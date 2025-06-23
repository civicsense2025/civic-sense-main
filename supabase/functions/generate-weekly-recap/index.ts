import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyRecapConfig {
  id: string
  config_name: string
  max_items_per_collection: number
  min_engagement_threshold: number
  min_completion_rate: number
  topics_percentage: number
  questions_percentage: number
  glossary_percentage: number
  engagement_weight: number
  current_events_weight: number
  user_rating_weight: number
  civic_action_weight: number
  title_template: string
  description_template: string
  emoji_pool: string
}

interface ContentMetric {
  content_id: string
  content_type: string
  total_views: number
  total_completions: number
  completion_rate: number
  user_ratings_avg: number
  trending_score: number
  civic_importance_score: number
  follow_up_actions: number
  calculated_score: number
}

interface WeeklyTheme {
  name: string
  score: number
  content_count: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate week dates (generate for previous week)
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    console.log(`Generating weekly recap for ${weekStartStr} to ${weekEndStr}`)

    // Get active configuration
    const { data: config, error: configError } = await supabase
      .from('weekly_recap_configs')
      .select('*')
      .eq('is_active', true)
      .single()

    if (configError || !config) {
      throw new Error(`No active configuration found: ${configError?.message}`)
    }

    // Check if recap already exists for this week
    const { data: existingRecap } = await supabase
      .from('weekly_recap_collections')
      .select('id')
      .eq('week_start_date', weekStartStr)
      .eq('config_used', config.id)
      .single()

    if (existingRecap) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Weekly recap already exists for this week',
          week_start: weekStartStr 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update weekly metrics first
    const { data: metricsUpdate } = await supabase
      .rpc('update_weekly_content_metrics', { target_week_start: weekStartStr })

    console.log(`Updated metrics for ${metricsUpdate} content items`)

    // Get content metrics for the week
    const { data: contentMetrics, error: metricsError } = await supabase
      .from('weekly_content_metrics')
      .select('*')
      .eq('week_start_date', weekStartStr)
      .gte('total_views', config.min_engagement_threshold)
      .gte('completion_rate', config.min_completion_rate)

    if (metricsError) {
      throw new Error(`Failed to fetch content metrics: ${metricsError.message}`)
    }

    if (!contentMetrics || contentMetrics.length === 0) {
      console.log('No content met the minimum engagement thresholds')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No content met minimum engagement thresholds',
          threshold: config.min_engagement_threshold 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate scores for each content item
    const scoredContent: ContentMetric[] = contentMetrics.map(metric => {
      // Normalize scores to 0-100 scale
      const engagementScore = Math.min(100, (metric.total_views / 100) * 100)
      const currentEventsScore = metric.trending_score
      const userRatingScore = (metric.user_ratings_avg / 5) * 100
      const civicActionScore = Math.min(100, (metric.follow_up_actions / 10) * 100)

      // Calculate weighted score using the configuration
      const calculatedScore = (
        (engagementScore * config.engagement_weight) +
        (currentEventsScore * config.current_events_weight) +
        (userRatingScore * config.user_rating_weight) +
        (civicActionScore * config.civic_action_weight)
      )

      return {
        content_id: metric.content_id,
        content_type: metric.content_type,
        total_views: metric.total_views,
        total_completions: metric.total_completions,
        completion_rate: metric.completion_rate,
        user_ratings_avg: metric.user_ratings_avg,
        trending_score: metric.trending_score,
        civic_importance_score: metric.civic_importance_score,
        follow_up_actions: metric.follow_up_actions,
        calculated_score: Math.round(calculatedScore * 100) / 100
      }
    })

    // Sort by calculated score
    scoredContent.sort((a, b) => b.calculated_score - a.calculated_score)

    // Select content based on type percentages
    const maxItems = config.max_items_per_collection
    const topicsCount = Math.ceil(maxItems * (config.topics_percentage / 100))
    const questionsCount = Math.ceil(maxItems * (config.questions_percentage / 100))
    const glossaryCount = maxItems - topicsCount - questionsCount

    const selectedContent = [
      ...scoredContent.filter(c => c.content_type === 'topic').slice(0, topicsCount),
      ...scoredContent.filter(c => c.content_type === 'question').slice(0, questionsCount),
      ...scoredContent.filter(c => c.content_type === 'glossary_term').slice(0, glossaryCount)
    ]

    if (selectedContent.length === 0) {
      throw new Error('No content selected for recap collection')
    }

    // Get trending themes
    const { data: themes } = await supabase
      .rpc('get_weekly_top_themes', { 
        week_start: weekStartStr,
        week_end: weekEndStr,
        max_themes: 3 
      })

    const topThemes = themes || ['civic engagement', 'current events', 'democracy']
    const primaryTheme = topThemes[0] || 'civic engagement'

    // Generate collection metadata
    const emojis = config.emoji_pool.split(',')
    const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    const title = config.title_template
      .replace('{week_start}', formatDate(weekStart))
      .replace('{theme}', primaryTheme)
      .replace('{item_count}', selectedContent.length.toString())

    const description = config.description_template
      .replace('{top_themes}', topThemes.slice(0, 2).join(' and '))
      .replace('{item_count}', selectedContent.length.toString())

    const slug = `weekly-recap-${weekStartStr}`

    // Create the collection
    const { data: newCollection, error: collectionError } = await supabase
      .from('collections')
      .insert({
        title,
        slug,
        description,
        emoji: selectedEmoji,
        difficulty_level: 3,
        estimated_minutes: selectedContent.length * 5, // Estimate 5 minutes per item
        categories: ['weekly-recap', 'current-events'],
        tags: ['auto-generated', 'weekly', ...topThemes.slice(0, 2)],
        learning_objectives: [
          `Stay current with this week's most engaging civic education topics`,
          `Learn from ${selectedContent.length} carefully curated pieces of content`,
          `Build knowledge in ${primaryTheme} and related areas`
        ],
        action_items: [
          'Complete the weekly recap to stay informed',
          'Share insights with your community',
          'Take action on current events topics'
        ],
        current_events_relevance: 5,
        political_balance_score: 0,
        status: 'published',
        is_featured: true,
        visibility: 'public',
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      })
      .select()
      .single()

    if (collectionError) {
      throw new Error(`Failed to create collection: ${collectionError.message}`)
    }

    // Add items to the collection
    const collectionItems = selectedContent.map((content, index) => ({
      collection_id: newCollection.id,
      item_type: content.content_type,
      item_id: content.content_id,
      order_index: index + 1,
      is_featured: index < 3, // First 3 items are featured
      is_required: true
    }))

    const { error: itemsError } = await supabase
      .from('collection_items')
      .insert(collectionItems)

    if (itemsError) {
      throw new Error(`Failed to add items to collection: ${itemsError.message}`)
    }

    // Record the recap generation
    const avgEngagementScore = selectedContent.reduce((sum, c) => sum + c.calculated_score, 0) / selectedContent.length

    const { error: recapError } = await supabase
      .from('weekly_recap_collections')
      .insert({
        collection_id: newCollection.id,
        week_start_date: weekStartStr,
        week_end_date: weekEndStr,
        config_used: config.id,
        total_content_analyzed: contentMetrics.length,
        content_selected: selectedContent.length,
        avg_engagement_score: Math.round(avgEngagementScore * 100) / 100,
        top_themes: topThemes
      })

    if (recapError) {
      console.error('Failed to record recap generation:', recapError)
    }

    console.log(`Successfully created weekly recap collection: ${newCollection.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        collection_id: newCollection.id,
        collection_slug: slug,
        week_start: weekStartStr,
        week_end: weekEndStr,
        items_count: selectedContent.length,
        top_themes: topThemes,
        avg_engagement_score: avgEngagementScore,
        message: `Created weekly recap "${title}" with ${selectedContent.length} items`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating weekly recap:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
} 