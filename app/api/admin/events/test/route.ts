import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test endpoint for Events System
 * 
 * Tests the extended events table schema and verifies all functionality
 * is working properly with historical events integration.
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const results = {
      timestamp: new Date().toISOString(),
      schema_tests: {
        events_table: false,
        extended_fields: false,
        sample_data: false,
        connections_tables: false,
        helper_functions: false
      },
      data_samples: {
        total_events: 0,
        historical_events: 0,
        current_events: 0,
        sample_events: [] as any[]
      },
      errors: [] as string[]
    }

    // Test 1: Check if events table exists and has expected fields
    try {
      const { data: eventsSample, error: eventsError } = await supabase
        .from('events')
        .select(`
          topic_id,
          topic_title,
          description,
          date,
          event_type,
          significance_level,
          key_figures,
          related_organizations,
          impact_summary,
          tags,
          is_featured,
          civic_relevance_score
        `)
        .limit(3)

      if (eventsError) {
        results.errors.push(`Events table error: ${eventsError.message}`)
      } else {
        results.schema_tests.events_table = true
        results.data_samples.sample_events = eventsSample || []
        results.data_samples.total_events = eventsSample?.length || 0
      }
    } catch (error) {
      results.errors.push(`Events table test failed: ${error}`)
    }

    // Test 2: Check extended fields functionality
    try {
      const { data: extendedSample, error: extendedError } = await supabase
        .from('events')
        .select('event_type, significance_level, key_figures, is_featured')
        .not('event_type', 'is', null)
        .limit(1)

      if (extendedError) {
        results.errors.push(`Extended fields error: ${extendedError.message}`)
      } else {
        results.schema_tests.extended_fields = true
      }
    } catch (error) {
      results.errors.push(`Extended fields test failed: ${error}`)
    }

    // Test 3: Check for historical vs current events
    try {
      const [
        { count: historicalCount },
        { count: currentCount }
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('event_type', ['political', 'sociopolitical', 'cultural', 'economic', 'military', 'legislative', 'judicial', 'constitutional']),
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('event_type', ['news', 'current'])
      ])

      results.data_samples.historical_events = historicalCount || 0
      results.data_samples.current_events = currentCount || 0
      results.schema_tests.sample_data = true
    } catch (error) {
      results.errors.push(`Event type counting failed: ${error}`)
    }

    // Test 4: Check connection tables exist
    try {
      const { data: connectionsSample, error: connectionsError } = await supabase
        .from('topic_event_connections')
        .select('topic_id, event_topic_id, connection_type')
        .limit(1)

      if (connectionsError) {
        // Table might not exist yet, which is expected
        results.errors.push(`Connections table note: ${connectionsError.message}`)
      } else {
        results.schema_tests.connections_tables = true
      }
    } catch (error) {
      results.errors.push(`Connections table test: ${error}`)
    }

    // Test 5: Test helper functions (if they exist)
    try {
      const { data: functionTest, error: functionError } = await supabase
        .rpc('search_historical_events', { 
          p_query: 'civil rights',
          p_limit: 2 
        })

      if (functionError) {
        results.errors.push(`Helper function note: ${functionError.message}`)
      } else {
        results.schema_tests.helper_functions = true
      }
    } catch (error) {
      results.errors.push(`Helper function test: ${error}`)
    }

    // Calculate overall system health
    const totalTests = Object.keys(results.schema_tests).length
    const passedTests = Object.values(results.schema_tests).filter(Boolean).length
    const systemHealth = Math.round((passedTests / totalTests) * 100)

    return NextResponse.json({
      ...results,
      system_health: `${systemHealth}% (${passedTests}/${totalTests} tests passed)`,
      recommendations: generateRecommendations(results),
      next_steps: [
        'Run database migrations to create missing tables',
        'Add sample historical events for testing',
        'Set up content linking connections',
        'Implement AI research functionality',
        'Test with real admin authentication'
      ]
    })

  } catch (error) {
    console.error('Error in events test API:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations = []

  if (!results.schema_tests.events_table) {
    recommendations.push('❌ Events table needs to be verified or created')
  }

  if (!results.schema_tests.extended_fields) {
    recommendations.push('⚠️ Extended historical event fields need to be added to events table')
  }

  if (!results.schema_tests.connections_tables) {
    recommendations.push('🔗 Content linking tables need to be created')
  }

  if (!results.schema_tests.helper_functions) {
    recommendations.push('🔧 Database helper functions need to be installed')
  }

  if (results.data_samples.total_events === 0) {
    recommendations.push('📄 Add sample historical events for testing')
  }

  if (results.errors.length === 0) {
    recommendations.push('✅ System is ready for full implementation!')
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_sample_data':
        return await createSampleHistoricalEvents(supabase)
      
      case 'test_ai_research':
        return await testAIResearchFlow(supabase)
        
      default:
        return NextResponse.json({ error: 'Invalid test action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in events test POST:', error)
    return NextResponse.json({
      error: 'Test action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function createSampleHistoricalEvents(supabase: any) {
  const sampleEvents = [
    {
      topic_id: 'watergate-1974',
      topic_title: 'Watergate Scandal and Nixon Resignation',
      description: 'Political scandal that led to the only resignation of a U.S. President, fundamentally changing public trust in government and strengthening congressional oversight powers.',
      date: '1974-08-09',
      why_this_matters: 'Watergate demonstrated that no one, not even the President, is above the law. It showed how investigative journalism, congressional oversight, and judicial independence work together to hold power accountable.',
      civic_relevance_score: 95,
      event_type: 'political',
      significance_level: 10,
      key_figures: ['Richard Nixon', 'Bob Woodward', 'Carl Bernstein', 'John Dean'],
      geographic_scope: 'national',
      impact_summary: 'Restored checks and balances, strengthened congressional oversight, changed campaign finance laws, and increased government transparency requirements',
      tags: ['presidency', 'accountability', 'investigative journalism', 'checks and balances'],
      source_type: 'historical_curated',
      sources: { primary_sources: [{ title: 'Nixon Library', url: 'https://www.nixonlibrary.gov/', reliability: 9 }] },
      is_active: true,
      is_featured: true
    },
    {
      topic_id: 'voting-rights-act-1965',
      topic_title: 'Voting Rights Act of 1965',
      description: 'Federal legislation that prohibited racial discrimination in voting, dramatically expanding electoral participation and federal enforcement of constitutional voting rights.',
      date: '1965-08-06',
      why_this_matters: 'This law made democracy more inclusive by removing barriers that prevented African Americans from voting. It shows how federal law can protect constitutional rights when states fail to do so.',
      civic_relevance_score: 98,
      event_type: 'legislative',
      significance_level: 10,
      key_figures: ['Lyndon B. Johnson', 'Martin Luther King Jr.', 'John Lewis'],
      geographic_scope: 'national',
      impact_summary: 'Increased voter registration, federal oversight of elections, expanded democratic participation, strengthened federal civil rights enforcement',
      tags: ['voting rights', 'civil rights', 'federal enforcement', 'democracy'],
      source_type: 'historical_curated',
      sources: { primary_sources: [{ title: 'Library of Congress', url: 'https://www.loc.gov/', reliability: 10 }] },
      is_active: true,
      is_featured: true
    }
  ]

  const { data: insertedEvents, error } = await supabase
    .from('events')
    .upsert(sampleEvents, { onConflict: 'topic_id' })
    .select()

  if (error) {
    throw new Error(`Failed to create sample events: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: `Created ${insertedEvents.length} sample historical events`,
    events: insertedEvents
  })
}

async function testAIResearchFlow(supabase: any) {
  // Simulate an AI research request
  const researchRequest = {
    query: 'Major Supreme Court decisions that expanded civil rights',
    context: 'Looking for landmark cases that can be used in civic education',
    research_type: 'historical_events',
    timeframe: { start_date: '1950-01-01', end_date: '1980-01-01' },
    focus_areas: ['civil rights', 'supreme court', 'constitutional law'],
    significance_threshold: 8,
    status: 'completed',
    events_found: 3,
    results: [
      {
        title: 'Brown v. Board of Education (1954)',
        significance: 10,
        civic_relevance: 'Demonstrates judicial review and equal protection'
      },
      {
        title: 'Loving v. Virginia (1967)',
        significance: 8,
        civic_relevance: 'Shows evolution of constitutional interpretation'
      },
      {
        title: 'Gideon v. Wainwright (1963)',
        significance: 9,
        civic_relevance: 'Illustrates due process and right to counsel'
      }
    ],
    research_quality: 'excellent'
  }

  const { data: research, error } = await supabase
    .from('ai_research_results')
    .insert([researchRequest])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create research test: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'AI research flow test completed',
    research_result: research
  })
} 