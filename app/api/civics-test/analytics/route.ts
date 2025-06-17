import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Fetch civics test analytics from the civics_test_analytics table
    const { data: analytics, error } = await supabase
      .from('civics_test_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching civics test analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
    
    // Calculate summary statistics
    const completions = analytics?.filter(a => a.event_type === 'completed') || []
    const starts = analytics?.filter(a => a.event_type === 'started') || []
    
    const totalCompletions = completions.length
    const totalStarts = starts.length
    const completionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0
    
    // Calculate average score
    const scoresWithValues = completions.map(c => c.score).filter(s => s !== null && s !== undefined)
    const averageScore = scoresWithValues.length > 0 
      ? scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length 
      : 0
    
    // Level distribution
    const levelCounts = completions.reduce((acc, completion) => {
      const level = completion.level || 'beginner'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const summary = {
      total_starts: totalStarts,
      total_completions: totalCompletions,
      completion_rate: Math.round(completionRate),
      average_score: Math.round(averageScore),
      level_distribution: levelCounts,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }
    
    return NextResponse.json({
      summary,
      data: analytics,
      success: true
    })
    
  } catch (error) {
    console.error('Error in civics test analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record test events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      event_type,
      session_id,
      user_id,
      guest_token,
      score,
      level,
      test_type,
      answers,
      category_breakdown,
      metadata
    } = body
    
    // Validate required fields
    if (!event_type || !session_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Insert analytics record
    const { data, error } = await supabase
      .from('civics_test_analytics')
      .insert({
        event_type,
        session_id,
        user_id: user_id || null,
        guest_token: guest_token || null,
        score: score || null,
        level: level || null,
        test_type: test_type || 'full',
        answers: answers || null,
        category_breakdown: category_breakdown || null,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting civics test analytics:', error)
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Error in civics test analytics POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Convert guest results to user account
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { guest_token, user_id } = body
    
    if (!guest_token || !user_id) {
      return NextResponse.json({ error: 'Missing guest_token or user_id' }, { status: 400 })
    }
    
    // Update all records with this guest token to associate with user
    const { data, error } = await supabase
      .from('civics_test_analytics')
      .update({ user_id })
      .eq('guest_token', guest_token)
      .is('user_id', null)
      .select()
    
    if (error) {
      console.error('Error converting guest results:', error)
      return NextResponse.json({ error: 'Failed to convert guest results' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      converted_records: data?.length || 0
    })
    
  } catch (error) {
    console.error('Error in civics test analytics PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 