import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      event_type, 
      score, 
      user_id, 
      guest_token,
      session_id, 
      metadata,
      answers,
      category_breakdown,
      level,
      test_type 
    } = body

    // Validate required fields
    if (!event_type || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, session_id' },
        { status: 400 }
      )
    }

    // Get IP and user agent for tracking
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Insert analytics event
    const { data, error } = await supabase
      .from('civics_test_analytics')
      .insert({
        event_type,
        score: score || null,
        user_id: user_id || null,
        session_id,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
        ip_address
      })

    if (error) {
      console.error('Error inserting civics test analytics:', error)
      return NextResponse.json(
        { error: 'Failed to record analytics' },
        { status: 500 }
      )
    }

    // If this is a completed test and we have guest data, store it
    if (event_type === 'completed' && !user_id && guest_token && score !== undefined) {
      const { error: guestError } = await supabase
        .from('guest_civics_test_results')
        .insert({
          guest_token,
          session_id,
          score,
          level: level || 'beginner',
          test_type: test_type || metadata?.test_type || 'full',
          answers: answers || {},
          category_breakdown: category_breakdown || {},
          ip_address,
          user_agent,
          completed_at: new Date().toISOString()
        })

      if (guestError) {
        console.error('Error storing guest civics test result:', guestError)
        // Don't fail the request if guest storage fails
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Civics test analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const event_type = searchParams.get('event_type')
    const guest_token = searchParams.get('guest_token')

    // If requesting guest data specifically
    if (guest_token) {
      const { data: guestData, error: guestError } = await supabase
        .rpc('get_guest_test_summary', { p_guest_token: guest_token })

      if (guestError) {
        console.error('Error fetching guest test summary:', guestError)
        return NextResponse.json(
          { error: 'Failed to fetch guest data' },
          { status: 500 }
        )
      }

      // Also get detailed results
      const { data: detailedResults, error: detailsError } = await supabase
        .from('guest_civics_test_results')
        .select('*')
        .eq('guest_token', guest_token)
        .order('completed_at', { ascending: false })

      if (detailsError) {
        console.error('Error fetching guest test details:', detailsError)
        return NextResponse.json(
          { error: 'Failed to fetch guest details' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        guest_summary: guestData[0] || null,
        guest_results: detailedResults || []
      })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('civics_test_analytics')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })

    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching civics test analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Calculate summary stats
    const completions = data.filter(d => d.event_type === 'completed')
    const starts = data.filter(d => d.event_type === 'started')
    const signups = data.filter(d => d.event_type === 'signup_after_test')

    const averageScore = completions.length > 0 
      ? completions.reduce((sum, c) => sum + (c.score || 0), 0) / completions.length 
      : 0

    const conversionRate = starts.length > 0 
      ? (completions.length / starts.length) * 100 
      : 0

    const signupRate = completions.length > 0 
      ? (signups.length / completions.length) * 100 
      : 0

    const summary = {
      total_starts: starts.length,
      total_completions: completions.length,
      total_signups: signups.length,
      average_score: Math.round(averageScore),
      completion_rate: Math.round(conversionRate),
      signup_conversion_rate: Math.round(signupRate),
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }

    return NextResponse.json({ 
      success: true, 
      data,
      summary 
    })
  } catch (error) {
    console.error('Civics test analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// New PUT endpoint for converting guest data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { guest_token, user_id } = body

    if (!guest_token || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: guest_token, user_id' },
        { status: 400 }
      )
    }

    // Convert guest results to user account
    const { data, error } = await supabase
      .rpc('convert_guest_civics_results', {
        p_guest_token: guest_token,
        p_user_id: user_id
      })

    if (error) {
      console.error('Error converting guest civics results:', error)
      return NextResponse.json(
        { error: 'Failed to convert guest results' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      converted_count: data 
    })
  } catch (error) {
    console.error('Guest conversion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 