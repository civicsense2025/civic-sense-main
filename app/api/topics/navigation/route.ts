import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Navigation request schema
const navigationSchema = z.object({
  topicId: z.string(),
  limit: z.number().min(1).max(10).optional().default(3) // How many prev/next topics to return
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')
    const limit = parseInt(searchParams.get('limit') || '3')

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 })
    }

    const params = navigationSchema.parse({ topicId, limit })

    // First, get the current topic to understand its position
    const { data: currentTopic, error: currentError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, date, is_active')
      .eq('topic_id', params.topicId)
      .eq('is_active', true)
      .single()

    if (currentError || !currentTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    let previousTopics: any[] = []
    let nextTopics: any[] = []
    let prevError: any = null
    let nextError: any = null

    // Handle topics with dates vs evergreen topics (null dates)
    if (currentTopic.date) {
      // Current topic has a date - get previous and next dated topics
      const { data: prevData, error: prevErr } = await supabase
        .from('question_topics')
        .select(`
          topic_id,
          topic_title,
          description,
          emoji,
          date,
          categories,
          is_breaking,
          is_featured
        `)
        .eq('is_active', true)
        .not('date', 'is', null)
        .lt('date', currentTopic.date)
        .order('date', { ascending: false })
        .limit(params.limit)

      previousTopics = prevData || []
      prevError = prevErr

      const { data: nextData, error: nextErr } = await supabase
        .from('question_topics')
        .select(`
          topic_id,
          topic_title,
          description,
          emoji,
          date,
          categories,
          is_breaking,
          is_featured
        `)
        .eq('is_active', true)
        .not('date', 'is', null)
        .gt('date', currentTopic.date)
        .order('date', { ascending: true })
        .limit(params.limit)

      nextTopics = nextData || []
      nextError = nextErr
    } else {
      // Current topic is evergreen (null date) - get other evergreen topics
      const { data: evergreenData, error: evergreenErr } = await supabase
        .from('question_topics')
        .select(`
          topic_id,
          topic_title,
          description,
          emoji,
          date,
          categories,
          is_breaking,
          is_featured
        `)
        .eq('is_active', true)
        .is('date', null)
        .neq('topic_id', currentTopic.topic_id)
        .order('created_at', { ascending: false })
        .limit(params.limit * 2) // Get more since we'll split them

      if (evergreenData && evergreenData.length > 0) {
        // Split evergreen topics into "previous" and "next" for navigation
        const midpoint = Math.ceil(evergreenData.length / 2)
        previousTopics = evergreenData.slice(0, midpoint)
        nextTopics = evergreenData.slice(midpoint)
      }
      prevError = evergreenErr
      nextError = evergreenErr
    }

    if (prevError) {
      console.error('Error fetching previous topics:', prevError)
    }

    if (nextError) {
      console.error('Error fetching next topics:', nextError)
    }

    // Get question counts for all topics
    const allTopicIds = [
      ...previousTopics.map(t => t.topic_id),
      ...nextTopics.map(t => t.topic_id)
    ]

    let questionCounts: Record<string, number> = {}
    if (allTopicIds.length > 0) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select('topic_id')
        .in('topic_id', allTopicIds)
        .eq('is_active', true)

      if (questionsData) {
        questionCounts = questionsData.reduce((acc, q) => {
          acc[q.topic_id] = (acc[q.topic_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Enhance topics with question counts and other metadata
    const enhanceTopics = (topics: any[]) => {
      return topics.map(topic => ({
        ...topic,
        questionCount: questionCounts[topic.topic_id] || 0,
        hasQuestions: (questionCounts[topic.topic_id] || 0) > 0,
        readingTime: Math.max(1, Math.round((questionCounts[topic.topic_id] || 0))),
        categoryArray: Array.isArray(topic.categories) ? topic.categories : []
      }))
    }

    const response = {
      current: {
        topic_id: currentTopic.topic_id,
        topic_title: currentTopic.topic_title,
        date: currentTopic.date
      },
      previous: enhanceTopics(previousTopics),
      next: enhanceTopics(nextTopics),
      hasMore: {
        previous: previousTopics.length === params.limit,
        next: nextTopics.length === params.limit
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Navigation API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = navigationSchema.parse(body)
    
    // Reuse GET logic with POST body
    const url = new URL(request.url)
    url.searchParams.set('topicId', params.topicId)
    url.searchParams.set('limit', params.limit.toString())
    
    return GET(new NextRequest(url.toString()))
  } catch (error) {
    console.error('Navigation POST API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
} 