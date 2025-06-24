import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Individual Historical Event Management API
 * 
 * Handles CRUD operations for a specific historical event including
 * content connections and detailed analytics.
 */

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  event_type: z.enum([
    'political', 'sociopolitical', 'cultural', 'economic', 
    'military', 'legislative', 'judicial', 'constitutional'
  ]).optional(),
  significance_level: z.number().int().min(1).max(10).optional(),
  impact_summary: z.string().optional(),
  long_term_consequences: z.string().optional(),
  key_figures: z.array(z.string()).optional(),
  related_organizations: z.array(z.string()).optional(),
  geographic_scope: z.string().optional(),
  related_topics: z.array(z.string()).optional(),
  civic_education_relevance: z.object({
    voting_rights: z.boolean().optional(),
    government_structure: z.boolean().optional(),
    civil_liberties: z.boolean().optional(),
    checks_and_balances: z.boolean().optional(),
    democratic_processes: z.boolean().optional(),
    citizen_engagement: z.boolean().optional()
  }).optional(),
  quiz_potential: z.object({
    difficulty_levels: z.array(z.number().int().min(1).max(5)).optional(),
    question_types: z.array(z.string()).optional(),
    key_concepts: z.array(z.string()).optional()
  }).optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['primary', 'secondary', 'academic']),
    reliability_score: z.number().int().min(1).max(10)
  })).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  content_warnings: z.array(z.string()).optional()
})

/**
 * GET /api/admin/events/historical/[eventId]
 * Get detailed information about a specific historical event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params

    // Get event with all related connections
    const { data: event, error } = await supabase
      .from('historical_events')
      .select(`
        *,
        topic_connections:topic_event_connections(
          id,
          topic_id,
          connection_type,
          connection_strength,
          context_notes,
          used_in_questions,
          used_in_explanations,
          display_priority
        ),
        question_connections:question_event_connections(
          id,
          question_id,
          usage_type,
          display_text,
          sort_order
        ),
        timeline_from:event_timeline_connections!from_event_id(
          id,
          to_event_id,
          relationship_type,
          time_gap_days,
          explanation,
          to_event:historical_events!to_event_id(title, event_date)
        ),
        timeline_to:event_timeline_connections!to_event_id(
          id,
          from_event_id,
          relationship_type,
          time_gap_days,
          explanation,
          from_event:historical_events!from_event_id(title, event_date)
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch event', details: error.message },
        { status: 500 }
      )
    }

    // Get usage statistics
    const topicConnectionsCount = event.topic_connections?.length || 0
    const questionConnectionsCount = event.question_connections?.length || 0
    const timelineConnectionsCount = (event.timeline_from?.length || 0) + (event.timeline_to?.length || 0)

    return NextResponse.json({
      event,
      usage_stats: {
        connected_topics: topicConnectionsCount,
        connected_questions: questionConnectionsCount,
        timeline_connections: timelineConnectionsCount,
        total_connections: topicConnectionsCount + questionConnectionsCount + timelineConnectionsCount
      }
    })

  } catch (error) {
    console.error('Error fetching historical event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/events/historical/[eventId]
 * Update a specific historical event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params
    const body = await request.json()

    const validationResult = UpdateEventSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    // Update the event
    const { data: updatedEvent, error } = await supabase
      .from('historical_events')
      .update({
        ...validationResult.data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      console.error('Database error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent
    })

  } catch (error) {
    console.error('Error updating historical event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events/historical/[eventId]
 * Delete a specific historical event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    const { eventId } = params

    // Check if event exists and get connection counts
    const { data: event, error: fetchError } = await supabase
      .from('historical_events')
      .select(`
        id,
        title,
        topic_connections:topic_event_connections(count),
        question_connections:question_event_connections(count)
      `)
      .eq('id', eventId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch event', details: fetchError.message },
        { status: 500 }
      )
    }

    // Check for force delete parameter
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const topicConnections = event.topic_connections?.[0]?.count || 0
    const questionConnections = event.question_connections?.[0]?.count || 0
    const totalConnections = topicConnections + questionConnections

    // If event has connections and force is not specified, return warning
    if (totalConnections > 0 && !force) {
      return NextResponse.json({
        error: 'Event has active connections',
        details: {
          title: event.title,
          connections: {
            topics: topicConnections,
            questions: questionConnections,
            total: totalConnections
          }
        },
        requires_force: true
      }, { status: 409 })
    }

    // Delete the event (cascading deletes will handle connections)
    const { error: deleteError } = await supabase
      .from('historical_events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      console.error('Database error deleting event:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete event', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      connections_removed: totalConnections
    })

  } catch (error) {
    console.error('Error deleting historical event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 