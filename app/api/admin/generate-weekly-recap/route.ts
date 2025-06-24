import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient, requireAdmin } from '@/lib/auth-utils'

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting weekly recap generation...')

    // Check admin authentication using secure getUser() method
    const { user, response } = await requireAdmin()
    if (response) {
      return response // Return 401 if not admin
    }

    console.log(`✅ Admin user ${user.email} authenticated for weekly recap generation`)

    const adminClient = createAdminClient()
    const { startDate, endDate, configName } = await request.json()

    console.log(`Generating weekly recap for ${startDate} to ${endDate}`)

    // Get configuration
    const { data: config, error: configError } = await adminClient
      .from('weekly_recap_configs')
      .select('*')
      .eq('config_name', configName || 'default')
      .single()

    if (configError || !config) {
      console.error('Error fetching config:', configError)
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration not found' 
      }, { status: 400 })
    }

    // Get content metrics for the date range
    const { data: metrics, error: metricsError } = await adminClient
      .from('weekly_content_metrics')
      .select('*')
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('overall_score', { ascending: false })

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch content metrics' 
      }, { status: 500 })
    }

    // Filter and categorize content
    const qualifiedMetrics = (metrics || []).filter(m => 
      m.completion_rate >= config.min_completion_rate &&
      m.engagement_score >= config.min_engagement_threshold
    )

    const topicMetrics = qualifiedMetrics
      .filter(m => m.content_type === 'topic')
      .slice(0, Math.ceil(config.max_items_per_collection * config.topics_percentage / 100))

    const questionMetrics = qualifiedMetrics
      .filter(m => m.content_type === 'question')
      .slice(0, Math.ceil(config.max_items_per_collection * config.questions_percentage / 100))

    const glossaryMetrics = qualifiedMetrics
      .filter(m => m.content_type === 'glossary')
      .slice(0, Math.ceil(config.max_items_per_collection * config.glossary_percentage / 100))

    // Generate collection data
    const recapData = {
      title: config.title_template.replace('{date_range}', `${startDate} to ${endDate}`),
      description: config.description_template.replace('{date_range}', `${startDate} to ${endDate}`),
      emoji: config.emoji_pool.split(',')[Math.floor(Math.random() * config.emoji_pool.split(',').length)].trim(),
      start_date: startDate,
      end_date: endDate,
      config_used: configName || 'default',
      total_items: topicMetrics.length + questionMetrics.length + glossaryMetrics.length,
      topics_count: topicMetrics.length,
      questions_count: questionMetrics.length,
      glossary_count: glossaryMetrics.length,
      generated_by: user.id,
      generated_at: new Date().toISOString()
    }

    // Save to database
    const { data: collection, error: saveError } = await adminClient
      .from('weekly_recap_collections')
      .insert(recapData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving weekly recap:', saveError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save weekly recap' 
      }, { status: 500 })
    }

    console.log('✅ Weekly recap generated successfully:', collection.id)

    return NextResponse.json({
      success: true,
      data: {
        collection,
        metrics: {
          topics: topicMetrics,
          questions: questionMetrics,
          glossary: glossaryMetrics
        }
      }
    })

  } catch (error) {
    console.error('Error in weekly recap generation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check admin authentication
    const { user, response } = await requireAdmin()
    if (response) {
      return response
    }

    const adminClient = createAdminClient()

    // Get recent weekly recaps
    const { data: recaps, error } = await adminClient
      .from('weekly_recap_collections')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching weekly recaps:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch weekly recaps' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: recaps
    })

  } catch (error) {
    console.error('Error fetching weekly recaps:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to simulate updating weekly metrics
// In production, this would connect to actual analytics data
async function updateWeeklyMetrics(supabase: any, weekStart: string, weekEnd: string) {
  // Get all active topics for simulation
  const { data: topics } = await supabase
    .from('question_topics')
    .select('id, topic_title')
    .eq('is_active', true)
    .limit(20)

  if (!topics) return

  // Create simulated metrics for each topic
  const metrics = topics.map((topic: any) => ({
    week_start_date: weekStart,
    week_end_date: weekEnd,
    content_type: 'topic',
    content_id: topic.id,
    total_views: Math.floor(Math.random() * 200) + 10,
    total_completions: Math.floor(Math.random() * 100) + 5,
    completion_rate: Math.floor(Math.random() * 80) + 20,
    user_ratings_avg: Math.random() * 2 + 3, // 3-5 range
    user_ratings_count: Math.floor(Math.random() * 50) + 5,
    trending_score: Math.floor(Math.random() * 100),
    civic_importance_score: Math.floor(Math.random() * 100),
    follow_up_actions: Math.floor(Math.random() * 20)
  }))

  // Insert metrics (upsert)
  for (const metric of metrics) {
    await supabase
      .from('weekly_content_metrics')
      .upsert(metric, { onConflict: 'week_start_date,content_type,content_id' })
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
} 