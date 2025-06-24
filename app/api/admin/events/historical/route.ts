import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Historical Events Management API
 * 
 * Handles CRUD operations for historical events with advanced filtering,
 * search capabilities, and content linking.
 */

// Validation schemas
const HistoricalEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_type: z.enum([
    'political', 'sociopolitical', 'cultural', 'economic', 
    'military', 'legislative', 'judicial', 'constitutional'
  ]),
  significance_level: z.number().int().min(1).max(10).default(5),
  impact_summary: z.string().optional(),
  long_term_consequences: z.string().optional(),
  key_figures: z.array(z.string()).default([]),
  related_organizations: z.array(z.string()).default([]),
  geographic_scope: z.string().optional(),
  related_topics: z.array(z.string()).default([]),
  civic_education_relevance: z.object({
    voting_rights: z.boolean().default(false),
    government_structure: z.boolean().default(false),
    civil_liberties: z.boolean().default(false),
    checks_and_balances: z.boolean().default(false),
    democratic_processes: z.boolean().default(false),
    citizen_engagement: z.boolean().default(false)
  }).default({}),
  quiz_potential: z.object({
    difficulty_levels: z.array(z.number().int().min(1).max(5)).default([]),
    question_types: z.array(z.string()).default([]),
    key_concepts: z.array(z.string()).default([])
  }).default({}),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['primary', 'secondary', 'academic']),
    reliability_score: z.number().int().min(1).max(10)
  })).default([]),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  content_warnings: z.array(z.string()).default([])
})

const UpdateEventSchema = HistoricalEventSchema.partial()

/**
 * GET /api/admin/events/historical
 * Retrieve historical events with filtering and search
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
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    const event_type = searchParams.get('event_type')
    const min_significance = parseInt(searchParams.get('min_significance') || '1')
    const max_significance = parseInt(searchParams.get('max_significance') || '10')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const is_featured = searchParams.get('is_featured')
    const tags = searchParams.get('tags')?.split(',')
    const sort_by = searchParams.get('sort_by') || 'significance_level'
    const sort_order = searchParams.get('sort_order') || 'desc'

    // Build query
    let query = supabase
      .from('historical_events')
      .select(`
        *,
        topic_connections:topic_event_connections(
          topic_id,
          connection_type,
          connection_strength
        )
      `)

    // Apply filters
    if (search) {
      // Use the search function we created in the schema
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_events', { 
          p_query: search, 
          p_limit: limit 
        })
      
      if (searchError) {
        console.error('Search error:', searchError)
      } else if (searchResults) {
        return NextResponse.json({
          events: searchResults,
          total: searchResults.length,
          pagination: {
            limit,
            offset,
            has_more: searchResults.length === limit
          }
        })
      }
    }

    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    if (min_significance || max_significance) {
      query = query.gte('significance_level', min_significance)
      query = query.lte('significance_level', max_significance)
    }

    if (start_date) {
      query = query.gte('event_date', start_date)
    }

    if (end_date) {
      query = query.lte('event_date', end_date)
    }

    if (is_featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (tags) {
      query = query.overlaps('tags', tags)
    }

    // Apply sorting
    const validSortColumns = [
      'event_date', 'significance_level', 'title', 'created_at', 'updated_at'
    ]
    if (validSortColumns.includes(sort_by)) {
      query = query.order(sort_by, { ascending: sort_order === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: events, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('historical_events')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      events: events || [],
      total: totalCount || 0,
      pagination: {
        limit,
        offset,
        has_more: (offset + limit) < (totalCount || 0)
      },
      filters_applied: {
        search,
        event_type,
        min_significance,
        max_significance,
        start_date,
        end_date,
        is_featured: is_featured === 'true',
        tags,
        sort_by,
        sort_order
      }
    })

  } catch (error) {
    console.error('Error in historical events GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/events/historical
 * Create a new historical event
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
    const validationResult = HistoricalEventSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const eventData = validationResult.data

    // Create the event
    const { data: newEvent, error } = await supabase
      .from('historical_events')
      .insert({
        ...eventData,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating event:', error)
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event: newEvent
    }, { status: 201 })

  } catch (error) {
    console.error('Error in historical events POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/events/historical
 * Bulk update multiple events
 */
export async function PUT(request: NextRequest) {
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
    const { event_ids, updates } = body

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return NextResponse.json(
        { error: 'event_ids array is required' },
        { status: 400 }
      )
    }

    const validationResult = UpdateEventSchema.safeParse(updates)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    // Update events
    const { data: updatedEvents, error } = await supabase
      .from('historical_events')
      .update({
        ...validationResult.data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .in('id', event_ids)
      .select()

    if (error) {
      console.error('Database error updating events:', error)
      return NextResponse.json(
        { error: 'Failed to update events', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedEvents?.length || 0,
      events: updatedEvents
    })

  } catch (error) {
    console.error('Error in historical events PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/events/historical
 * Bulk delete multiple events
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
    const { event_ids } = body

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return NextResponse.json(
        { error: 'event_ids array is required' },
        { status: 400 }
      )
    }

    // Delete events (cascading deletes will handle connections)
    const { error } = await supabase
      .from('historical_events')
      .delete()
      .in('id', event_ids)

    if (error) {
      console.error('Database error deleting events:', error)
      return NextResponse.json(
        { error: 'Failed to delete events', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted_count: event_ids.length
    })

  } catch (error) {
    console.error('Error in historical events DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 