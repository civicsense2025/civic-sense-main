import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-middleware'

/**
 * Events Management API
 * 
 * Unified endpoint for managing all event types in CivicSense:
 * - Current events (news_events, user_events)  
 * - Historical events (extended events table)
 * - Content connections and timeline relationships
 */

export async function GET(request: NextRequest) {
  try {
    // Use improved admin middleware that bypasses RLS recursion
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user, role } = adminCheck
    console.log(`✅ Admin user ${user.email} (${role}) accessing events API`)

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('type') || 'all'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const significance = parseInt(searchParams.get('min_significance') || '1')
    const featured = searchParams.get('featured') === 'true'

    const result = {
      events: [] as any[],
      user_events: [] as any[],
      news_events: [] as any[],
      stats: {
        total_events: 0,
        historical_events: 0,
        current_events: 0,
        featured_events: 0,
        high_significance_events: 0,
        total_user_events: 0,
        pending_user_events: 0,
        total_news_events: 0,
        ai_research_results: 0
      }
    }

    // Get events from the main events table (includes historical and current)
    if (eventType === 'all' || eventType === 'events' || eventType === 'historical') {
      let eventsQuery = supabase
        .from('events')
        .select(`
          topic_id,
          topic_title,
          description,
          date,
          why_this_matters,
          civic_relevance_score,
          event_type,
          significance_level,
          key_figures,
          related_organizations,
          geographic_scope,
          impact_summary,
          long_term_consequences,
          tags,
          categories,
          quiz_potential,
          fact_check_status,
          reliability_score,
          is_featured,
          content_warnings,
          ai_generated,
          research_quality_score,
          last_fact_checked,
          source_type,
          sources,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .gte('significance_level', significance)
        .order('date', { ascending: false })
        .order('significance_level', { ascending: false })
        .range(offset, offset + limit - 1)

      if (eventType === 'historical') {
        eventsQuery = eventsQuery.in('event_type', [
          'political', 'sociopolitical', 'cultural', 'economic', 
          'military', 'legislative', 'judicial', 'constitutional'
        ])
      }

      if (featured) {
        eventsQuery = eventsQuery.eq('is_featured', true)
      }

      const { data: events, error: eventsError } = await eventsQuery

      if (eventsError) {
        console.warn('Error fetching events:', eventsError)
      } else if (events) {
        result.events = events
      }
    }

    // Get user-submitted events
    if (eventType === 'all' || eventType === 'user_events') {
      let userEventsQuery = supabase
        .from('user_events')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        userEventsQuery = userEventsQuery.eq('status', status)
      }

      const { data: userEvents, error: userEventsError } = await userEventsQuery

      if (userEventsError) {
        console.warn('Error fetching user events:', userEventsError)
      } else if (userEvents) {
        result.user_events = userEvents
      }
    }

    // Get AI-discovered news events
    if (eventType === 'all' || eventType === 'news_events') {
      const { data: newsEvents, error: newsEventsError } = await supabase
        .from('news_events')
        .select('*')
        .order('discovered_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (newsEventsError) {
        console.warn('Error fetching news events:', newsEventsError)
      } else if (newsEvents) {
        result.news_events = newsEvents
      }
    }

    // Calculate statistics
    const [
      { count: totalEvents },
      { count: historicalEvents },
      { count: currentEvents },
      { count: featuredEvents },
      { count: highSigEvents },
      { count: totalUserEvents },
      { count: pendingUserEvents },
      { count: totalNewsEvents },
      { count: aiResearchCount }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).in('event_type', ['political', 'sociopolitical', 'cultural', 'economic', 'military', 'legislative', 'judicial', 'constitutional']),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true).in('event_type', ['news', 'current']),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('events').select('*', { count: 'exact', head: true }).gte('significance_level', 8),
      supabase.from('user_events').select('*', { count: 'exact', head: true }),
      supabase.from('user_events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('news_events').select('*', { count: 'exact', head: true }),
      supabase.from('ai_research_results').select('*', { count: 'exact', head: true }).eq('status', 'completed')
    ])

    result.stats = {
      total_events: totalEvents || 0,
      historical_events: historicalEvents || 0,
      current_events: currentEvents || 0,
      featured_events: featuredEvents || 0,
      high_significance_events: highSigEvents || 0,
      total_user_events: totalUserEvents || 0,
      pending_user_events: pendingUserEvents || 0,
      total_news_events: totalNewsEvents || 0,
      ai_research_results: aiResearchCount || 0
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in events GET API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use improved admin middleware that bypasses RLS recursion
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user, role } = adminCheck
    const body = await request.json()
    const { action, ...data } = body

    console.log(`✅ Admin user ${user.email} (${role}) performing action: ${action}`)

    const supabase = await createClient()

    switch (action) {
      case 'create_historical_event':
        return await createHistoricalEvent(supabase, data, user.id)
      
      case 'update_event':
        return await updateEvent(supabase, data, user.id)
        
      case 'create_topic_connection':
        return await createTopicConnection(supabase, data, user.id)
        
      case 'create_timeline_connection':
        return await createTimelineConnection(supabase, data, user.id)
        
      case 'ai_research_events':
        return await initiateAIResearch(supabase, data, user.id)
        
      case 'update_user_event_status':
        return await updateUserEventStatus(supabase, data)
      
      case 'bulk_approve_user_events':
        return await bulkApproveUserEvents(supabase, data)
        
      case 'promote_news_to_content':
        return await promoteNewsEventToContent(supabase, data)
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in events POST API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions
async function createHistoricalEvent(supabase: any, data: any, userId: string) {
  const eventData = {
    topic_id: data.topic_id || `historical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    topic_title: data.title,
    description: data.description,
    date: data.event_date,
    why_this_matters: data.why_this_matters || data.impact_summary,
    civic_relevance_score: data.civic_relevance_score || (data.significance_level * 10),
    event_type: data.event_type,
    significance_level: data.significance_level,
    key_figures: data.key_figures || [],
    related_organizations: data.related_organizations || [],
    geographic_scope: data.geographic_scope || 'national',
    impact_summary: data.impact_summary,
    long_term_consequences: data.long_term_consequences,
    tags: data.tags || [],
    categories: data.categories || [],
    quiz_potential: data.quiz_potential || {},
    fact_check_status: data.fact_check_status || 'pending',
    reliability_score: data.reliability_score || 5,
    is_featured: data.is_featured || false,
    content_warnings: data.content_warnings || [],
    ai_generated: data.ai_generated || false,
    research_quality_score: data.research_quality_score,
    source_type: 'historical_curated',
    sources: data.sources || {},
    is_active: true,
    content_generation_status: 'completed'
  }

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create historical event: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    event: newEvent,
    message: 'Historical event created successfully'
  })
}

async function updateEvent(supabase: any, data: any, userId: string) {
  const { topic_id, ...updateData } = data
  
  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('topic_id', topic_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    event: updatedEvent,
    message: 'Event updated successfully'
  })
}

async function createTopicConnection(supabase: any, data: any, userId: string) {
  const connectionData = {
    topic_id: data.topic_id,
    event_topic_id: data.event_topic_id,
    connection_type: data.connection_type,
    connection_strength: data.connection_strength || 3,
    context_notes: data.context_notes,
    used_in_questions: data.used_in_questions || false,
    used_in_explanations: data.used_in_explanations || false,
    display_priority: data.display_priority || 0,
    created_by: userId
  }

  const { data: connection, error } = await supabase
    .from('topic_event_connections')
    .insert([connectionData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create topic connection: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    connection,
    message: 'Topic connection created successfully'
  })
}

async function createTimelineConnection(supabase: any, data: any, userId: string) {
  const connectionData = {
    from_event_topic_id: data.from_event_topic_id,
    to_event_topic_id: data.to_event_topic_id,
    relationship_type: data.relationship_type,
    time_gap_days: data.time_gap_days,
    explanation: data.explanation,
    created_by: userId
  }

  const { data: connection, error } = await supabase
    .from('event_timeline_connections')
    .insert([connectionData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create timeline connection: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    connection,
    message: 'Timeline connection created successfully'
  })
}

async function initiateAIResearch(supabase: any, data: any, userId: string) {
  // Create research request record
  const researchData = {
    query: data.query,
    context: data.context,
    research_type: 'historical_events',
    timeframe: data.timeframe || {},
    focus_areas: data.focus_areas || [],
    significance_threshold: data.significance_threshold || 5,
    status: 'queued',
    researcher_id: userId
  }

  const { data: research, error } = await supabase
    .from('ai_research_results')
    .insert([researchData])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create research request: ${error.message}`)
  }

  // TODO: Add actual AI research processing here
  // For now, just return the created research record

  return NextResponse.json({ 
    success: true, 
    research,
    message: 'AI research request created successfully'
  })
}

async function updateUserEventStatus(supabase: any, data: any) {
  const { event_id, status, admin_notes } = data

  const { data: updatedEvent, error } = await supabase
    .from('user_events')
    .update({
      status,
      admin_notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user event status: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    event: updatedEvent,
    message: 'User event status updated successfully'
  })
}

async function bulkApproveUserEvents(supabase: any, data: any) {
  const { event_ids } = data

  const { data: updatedEvents, error } = await supabase
    .from('user_events')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .in('id', event_ids)
    .select()

  if (error) {
    throw new Error(`Failed to bulk approve user events: ${error.message}`)
  }

  return NextResponse.json({ 
    success: true, 
    events: updatedEvents,
    message: `${updatedEvents.length} user events approved successfully`
  })
}

async function promoteNewsEventToContent(supabase: any, data: any) {
  const { news_event_id } = data

  // Get the news event
  const { data: newsEvent, error: fetchError } = await supabase
    .from('news_events')
    .select('*')
    .eq('id', news_event_id)
    .single()

  if (fetchError || !newsEvent) {
    throw new Error(`Failed to fetch news event: ${fetchError?.message}`)
  }

  // Create corresponding event in main events table
  const eventData = {
    topic_id: `news_promoted_${Date.now()}`,
    topic_title: newsEvent.headline,
    description: newsEvent.content,
    date: newsEvent.published_at.split('T')[0],
    why_this_matters: `This recent news event demonstrates current political dynamics and civic engagement opportunities.`,
    civic_relevance_score: newsEvent.civic_relevance_score,
    event_type: 'current',
    significance_level: Math.min(Math.floor(newsEvent.civic_relevance_score / 10), 10),
    key_figures: newsEvent.government_actors_involved || [],
    tags: newsEvent.policy_areas_affected || [],
    source_type: 'news_promoted',
    sources: { original_news_event_id: news_event_id, source_url: newsEvent.source_url },
    is_active: true
  }

  const { data: newEvent, error: createError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to promote news event: ${createError.message}`)
  }

  // Update news event to mark as promoted
  await supabase
    .from('news_events')
    .update({ content_generation_status: 'promoted_to_event' })
    .eq('id', news_event_id)

  return NextResponse.json({ 
    success: true, 
    event: newEvent,
    message: 'News event promoted to content successfully'
  })
} 