import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'
import { z } from 'zod'
import type { DbQuestionTopic, DbQuestion, DbCategory } from '@civicsense/shared/lib/database.types'

// Search parameters schema for validation
const searchSchema = z.object({
  query: z.string().optional().default(''),
  categories: z.array(z.string()).optional().default([]),
  difficulty: z.array(z.string()).optional().default([]),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  hasQuestions: z.boolean().optional(),
  isActive: z.boolean().optional().default(true),
  sortBy: z.enum(['relevance', 'date', 'difficulty', 'popularity', 'questions']).optional().default('relevance'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = searchSchema.parse(body)

    // Build the base query - remove the problematic join
    let query = supabase
      .from('question_topics')
      .select('*')
      .eq('is_active', params.isActive)

    // Apply search query if provided
    if (params.query) {
      // Search in title and description (no tags field in question_topics)
      query = query.or(`topic_title.ilike.%${params.query}%,description.ilike.%${params.query}%,why_this_matters.ilike.%${params.query}%`)
    }

    // Filter by categories using junction table (much faster!)
    if (params.categories.length > 0) {
      // First check if junction table exists and has data
      const { data: junctionExists } = await supabase
        .from('question_topic_categories')
        .select('topic_id')
        .limit(1)
      
      if (junctionExists && junctionExists.length > 0) {
        // Get category UUIDs from category names
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name')
          .in('name', params.categories)
          .eq('is_active', true)
        
        const categoryUUIDs = categoryData?.map(cat => cat.id) || []
        
        if (categoryUUIDs.length > 0) {
          // Get topic UUIDs from junction table
          const { data: junctionTopics } = await supabase
            .from('question_topic_categories')
            .select('topic_id')
            .in('category_id', categoryUUIDs)
          
          const topicUUIDs = junctionTopics?.map(row => row.topic_id) || []
          
          if (topicUUIDs.length > 0) {
            // Convert UUIDs to string topic_ids by querying question_topics
            const { data: topicData } = await supabase
              .from('question_topics')
              .select('topic_id, id')
              .in('id', topicUUIDs)
            
            const stringTopicIds = topicData?.map(topic => topic.topic_id) || []
            
            if (stringTopicIds.length > 0) {
              // Now filter by string topic_ids
              query = query.in('topic_id', stringTopicIds)
            } else {
              // No topics match the categories, return empty result
              query = query.eq('topic_id', 'no-match-found')
            }
          } else {
            // No topics match the categories, return empty result
            query = query.eq('topic_id', 'no-match-found')
          }
        } else {
          // No matching categories found, return empty result
          query = query.eq('topic_id', 'no-match-found')
        }
      } else {
        // Fallback to JSONB approach if junction table not populated yet
        const categoryFilters = params.categories.map(cat => `categories.cs.["${cat}"]`).join(',')
        query = query.or(categoryFilters)
      }
    }

    // Note: difficulty filtering will be done post-query based on question difficulty levels

    // Filter by date range
    if (params.dateRange?.start) {
      query = query.gte('date', params.dateRange.start)
    }
    if (params.dateRange?.end) {
      query = query.lte('date', params.dateRange.end)
    }

    // Sort based on criteria
    switch (params.sortBy) {
      case 'date':
        // For date sorting, put null dates (evergreen content) at the end
        query = query.order('date', { ascending: false, nullsFirst: false })
        break
      case 'difficulty':
      case 'questions':
      case 'popularity':
        // These will be handled post-query
        query = query.order('date', { ascending: false, nullsFirst: false })
        break
      case 'relevance':
      default:
        if (params.query) {
          // For relevance, we'll post-process to score matches
          query = query.order('date', { ascending: false, nullsFirst: false })
        } else {
          query = query.order('date', { ascending: false, nullsFirst: false })
        }
    }

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1)

    const { data: topics, error, count } = await query

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search topics' }, { status: 500 })
    }

    // Get question counts for each topic
    const topicIdList = topics?.map(t => t.topic_id) || []
    let questionCounts: any[] = []
    
    if (topicIdList.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('topic_id, question_type')
        .in('topic_id', topicIdList)
        .eq('is_active', true)
      
      if (questionsError) {
        console.error('Error fetching question counts:', questionsError)
        questionCounts = []
      } else {
        questionCounts = questionsData || []
      }
    }

    // Build question stats map
    const questionStatsMap = new Map<string, any>()
    if (questionCounts) {
      questionCounts.forEach(q => {
        if (!questionStatsMap.has(q.topic_id)) {
          questionStatsMap.set(q.topic_id, {
            total: 0,
            byType: {}
          })
        }
        const stats = questionStatsMap.get(q.topic_id)
        stats.total++
        stats.byType[q.question_type] = (stats.byType[q.question_type] || 0) + 1
      })
    }

    // Get category details
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, emoji')
      .eq('is_active', true)

    const categoryMap = new Map(categories?.map(c => [c.name, c]) || [])

    // Get average difficulty for topics based on their questions
    const topicIds = topics?.map(t => t.topic_id) || []
    let questionDifficulties: any[] = []
    
    if (topicIds.length > 0) {
      const { data: difficultyData, error: difficultyError } = await supabase
        .from('questions')
        .select('topic_id, difficulty_level')
        .in('topic_id', topicIds)
        .eq('is_active', true)
        .not('difficulty_level', 'is', null)
      
      if (difficultyError) {
        console.error('Error fetching question difficulties:', difficultyError)
        questionDifficulties = []
      } else {
        questionDifficulties = difficultyData || []
      }
    }

    // Calculate average difficulty per topic
    const topicDifficultyMap = new Map<string, { avg: number, count: number }>()
    if (questionDifficulties) {
      questionDifficulties.forEach(q => {
        if (!topicDifficultyMap.has(q.topic_id)) {
          topicDifficultyMap.set(q.topic_id, { avg: 0, count: 0 })
        }
        const stats = topicDifficultyMap.get(q.topic_id)!
        stats.avg = (stats.avg * stats.count + (q.difficulty_level || 1)) / (stats.count + 1)
        stats.count++
      })
    }

    // Calculate relevance scores if searching
    let processedTopics = topics || []
    if (params.query && params.sortBy === 'relevance') {
      processedTopics = processedTopics.map(topic => {
        let score = 0
        const query = params.query.toLowerCase()
        
        // Title match (highest weight)
        if (topic.topic_title.toLowerCase().includes(query)) {
          score += 10
          if (topic.topic_title.toLowerCase().startsWith(query)) {
            score += 5
          }
        }
        
        // Description match
        if (topic.description?.toLowerCase().includes(query)) {
          score += 5
        }
        
        // Why this matters match
        if (topic.why_this_matters?.toLowerCase().includes(query)) {
          score += 3
        }
        
        return { ...topic, relevanceScore: score }
      }).sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Enhance topics with additional data
    const enhancedTopics = processedTopics.map(topic => {
      const questionStats = questionStatsMap.get(topic.topic_id) || { total: 0, byType: {} }
      const difficultyStats = topicDifficultyMap.get(topic.topic_id)
      
      // Handle categories as JSON - could be array or string array
      let categoryArray: string[] = []
      if (Array.isArray(topic.categories)) {
        categoryArray = topic.categories as string[]
      } else if (typeof topic.categories === 'string') {
        categoryArray = [topic.categories]
      }
      
      const categoryDetails = categoryArray.map(catName => categoryMap.get(catName)).filter(Boolean) || []
      
      // Get average difficulty level from questions
      const avgDifficulty = difficultyStats?.avg || 1
      
      return {
        ...topic,
        questionCount: questionStats.total,
        questionTypes: questionStats.byType,
        categoryDetails,
        hasQuestions: questionStats.total > 0,
        averageDifficulty: avgDifficulty,
        difficultyLabel: getDifficultyLabel(Math.round(avgDifficulty)),
        readingTime: calculateReadingTime(questionStats.total)
      }
    })

    // Filter by hasQuestions if specified
    let finalTopics = enhancedTopics
    if (params.hasQuestions !== undefined) {
      finalTopics = enhancedTopics.filter(t => t.hasQuestions === params.hasQuestions)
    }

    // Filter by difficulty if specified
    if (params.difficulty.length > 0) {
      const difficultyMap: Record<string, number> = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
        'expert': 4
      }
      const requestedLevels = params.difficulty.map(d => difficultyMap[d] || 1)
      finalTopics = finalTopics.filter(t => {
        const roundedDiff = Math.round(t.averageDifficulty)
        return requestedLevels.includes(roundedDiff)
      })
    }

    // Sort by various criteria
    switch (params.sortBy) {
      case 'questions':
        finalTopics.sort((a, b) => b.questionCount - a.questionCount)
        break
      case 'difficulty':
        finalTopics.sort((a, b) => a.averageDifficulty - b.averageDifficulty)
        break
      case 'popularity':
        // Sort by question count as a proxy for popularity
        finalTopics.sort((a, b) => b.questionCount - a.questionCount)
        break
    }

    return NextResponse.json({
      topics: finalTopics,
      total: count || 0,
      offset: params.offset,
      limit: params.limit,
      hasMore: (count || 0) > params.offset + params.limit
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
}

// Helper functions
function getDifficultyLabel(level: number): string {
  const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  return labels[level - 1] || 'Unknown'
}

function calculateReadingTime(questionCount: number): number {
  // Estimate 1 minute per question
  return Math.max(1, Math.round(questionCount))
}

// GET endpoint for simpler searches
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')

  const body: any = { query }
  if (category) body.categories = [category]
  if (difficulty) body.difficulty = [difficulty]

  // Reuse POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body)
  }))
} 