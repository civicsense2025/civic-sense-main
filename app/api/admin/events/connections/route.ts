import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Content Linking API for Historical Events
 * 
 * Manages connections between historical events and educational content
 * (topics, questions, and timeline relationships).
 */

// Validation schemas
const TopicConnectionSchema = z.object({
  topic_id: z.string().min(1),
  event_id: z.string().uuid(),
  connection_type: z.enum([
    'background', 'example', 'precedent', 'comparison',
    'consequence', 'cause', 'related'
  ]),
  connection_strength: z.number().int().min(1).max(5).default(3),
  context_notes: z.string().optional(),
  used_in_questions: z.boolean().default(false),
  used_in_explanations: z.boolean().default(false),
  display_priority: z.number().int().default(0)
})

const QuestionConnectionSchema = z.object({
  question_id: z.string().uuid(),
  event_id: z.string().uuid(),
  usage_type: z.enum([
    'question_context', 'answer_explanation', 'hint',
    'source_reference', 'related_reading'
  ]),
  display_text: z.string().optional(),
  sort_order: z.number().int().default(0)
})

const TimelineConnectionSchema = z.object({
  from_event_id: z.string().uuid(),
  to_event_id: z.string().uuid(),
  relationship_type: z.enum([
    'led_to', 'caused_by', 'concurrent_with', 'reaction_to',
    'precedent_for', 'continuation_of'
  ]),
  time_gap_days: z.number().int().optional(),
  explanation: z.string().optional()
})

/**
 * GET /api/admin/events/connections
 * Get connections for events, topics, or questions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'topic', 'question', 'timeline'
    const event_id = searchParams.get('event_id')
    const topic_id = searchParams.get('topic_id')
    const question_id = searchParams.get('question_id')

    let connections: any[] = []

    if (type === 'topic' || !type) {
      let topicQuery = supabase
        .from('topic_event_connections')
        .select(`
          *,
          event:historical_events(id, title, event_date, significance_level),
          topic:question_topics(topic_id, topic_title, emoji)
        `)

      if (event_id) topicQuery = topicQuery.eq('event_id', event_id)
      if (topic_id) topicQuery = topicQuery.eq('topic_id', topic_id)

      const { data: topicConnections, error: topicError } = await topicQuery
      if (topicError) throw topicError

      connections.push(...(topicConnections || []).map(conn => ({
        ...conn,
        connection_category: 'topic'
      })))
    }

    if (type === 'question' || !type) {
      let questionQuery = supabase
        .from('question_event_connections')
        .select(`
          *,
          event:historical_events(id, title, event_date, significance_level),
          question:questions(id, question, question_type, topic_id)
        `)

      if (event_id) questionQuery = questionQuery.eq('event_id', event_id)
      if (question_id) questionQuery = questionQuery.eq('question_id', question_id)

      const { data: questionConnections, error: questionError } = await questionQuery
      if (questionError) throw questionError

      connections.push(...(questionConnections || []).map(conn => ({
        ...conn,
        connection_category: 'question'
      })))
    }

    if (type === 'timeline' || !type) {
      let timelineQuery = supabase
        .from('event_timeline_connections')
        .select(`
          *,
          from_event:historical_events!from_event_id(id, title, event_date),
          to_event:historical_events!to_event_id(id, title, event_date)
        `)

      if (event_id) {
        timelineQuery = timelineQuery.or(`from_event_id.eq.${event_id},to_event_id.eq.${event_id}`)
      }

      const { data: timelineConnections, error: timelineError } = await timelineQuery
      if (timelineError) throw timelineError

      connections.push(...(timelineConnections || []).map(conn => ({
        ...conn,
        connection_category: 'timeline'
      })))
    }

    return NextResponse.json({
      connections,
      total: connections.length,
      filters_applied: {
        type,
        event_id,
        topic_id,
        question_id
      }
    })

  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/events/connections
 * Create new connections between content
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, connections } = body

    if (!type || !Array.isArray(connections)) {
      return NextResponse.json(
        { error: 'type and connections array are required' },
        { status: 400 }
      )
    }

    let createdConnections: any[] = []

    switch (type) {
      case 'topic':
        for (const conn of connections) {
          const validationResult = TopicConnectionSchema.safeParse(conn)
          if (!validationResult.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: validationResult.error.issues },
              { status: 400 }
            )
          }

          const { data: created, error } = await supabase
            .from('topic_event_connections')
            .insert({
              ...validationResult.data,
              created_by: user.id
            })
            .select()
            .single()

          if (error) throw error
          createdConnections.push(created)
        }
        break

      case 'question':
        for (const conn of connections) {
          const validationResult = QuestionConnectionSchema.safeParse(conn)
          if (!validationResult.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: validationResult.error.issues },
              { status: 400 }
            )
          }

          const { data: created, error } = await supabase
            .from('question_event_connections')
            .insert({
              ...validationResult.data,
              created_by: user.id
            })
            .select()
            .single()

          if (error) throw error
          createdConnections.push(created)
        }
        break

      case 'timeline':
        for (const conn of connections) {
          const validationResult = TimelineConnectionSchema.safeParse(conn)
          if (!validationResult.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: validationResult.error.issues },
              { status: 400 }
            )
          }

          // Prevent self-connections
          if (validationResult.data.from_event_id === validationResult.data.to_event_id) {
            return NextResponse.json(
              { error: 'Cannot create timeline connection between the same event' },
              { status: 400 }
            )
          }

          const { data: created, error } = await supabase
            .from('event_timeline_connections')
            .insert({
              ...validationResult.data,
              created_by: user.id
            })
            .select()
            .single()

          if (error) throw error
          createdConnections.push(created)
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid connection type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      created_count: createdConnections.length,
      connections: createdConnections
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating connections:', error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Connection already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events/connections
 * Delete connections
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, connection_ids } = body

    if (!type || !Array.isArray(connection_ids) || connection_ids.length === 0) {
      return NextResponse.json(
        { error: 'type and connection_ids array are required' },
        { status: 400 }
      )
    }

    let deletedCount = 0

    switch (type) {
      case 'topic':
        const { error: topicError } = await supabase
          .from('topic_event_connections')
          .delete()
          .in('id', connection_ids)

        if (topicError) throw topicError
        deletedCount = connection_ids.length
        break

      case 'question':
        const { error: questionError } = await supabase
          .from('question_event_connections')
          .delete()
          .in('id', connection_ids)

        if (questionError) throw questionError
        deletedCount = connection_ids.length
        break

      case 'timeline':
        const { error: timelineError } = await supabase
          .from('event_timeline_connections')
          .delete()
          .in('id', connection_ids)

        if (timelineError) throw timelineError
        deletedCount = connection_ids.length
        break

      default:
        return NextResponse.json(
          { error: 'Invalid connection type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount
    })

  } catch (error) {
    console.error('Error deleting connections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 