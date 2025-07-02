import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// =============================================================================
// SUBMIT SCENARIO DECISION
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      scenarioId,
      situationId,
      decisionId,
      userId,
      guestToken,
      resourceStateBefore,
      resourceStateAfter
    } = body

    // Validate required fields
    if (!scenarioId || !situationId || !decisionId || (!userId && !guestToken)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create scenario attempt
    let attemptId: string

    if (userId) {
      // For authenticated users, find or create attempt
      const { data: existingAttempt } = await supabase
        .from('user_scenario_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('scenario_id', scenarioId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingAttempt) {
        attemptId = existingAttempt.id
      } else {
        // Create new attempt
        const { data: newAttempt, error: attemptError } = await supabase
          .from('user_scenario_attempts')
          .insert({
            user_id: userId,
            scenario_id: scenarioId,
            attempt_number: 1, // TODO: Calculate actual attempt number
            started_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (attemptError) {
          console.error('Error creating scenario attempt:', attemptError)
          return NextResponse.json(
            { error: 'Failed to create scenario attempt' },
            { status: 500 }
          )
        }

        attemptId = newAttempt.id
      }
    } else {
      // For guest users, create a guest attempt record
      const { data: guestAttempt, error: guestError } = await supabase
        .from('user_scenario_attempts')
        .insert({
          guest_token: guestToken,
          scenario_id: scenarioId,
          attempt_number: 1,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (guestError) {
        console.error('Error creating guest scenario attempt:', guestError)
        return NextResponse.json(
          { error: 'Failed to create guest scenario attempt' },
          { status: 500 }
        )
      }

      attemptId = guestAttempt.id
    }

    // Record the decision
    const { data: decision, error: decisionError } = await supabase
      .from('user_scenario_decisions')
      .insert({
        attempt_id: attemptId,
        situation_id: situationId,
        decision_id: decisionId,
        decision_order: 1, // TODO: Calculate actual order
        resource_state_before: resourceStateBefore,
        resource_state_after: resourceStateAfter,
        time_taken_seconds: 0 // TODO: Calculate actual time taken
      })
      .select()
      .single()

    if (decisionError) {
      console.error('Error recording decision:', decisionError)
      return NextResponse.json(
        { error: 'Failed to record decision' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decision,
      attemptId
    })

  } catch (error) {
    console.error('Unexpected error in decisions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET USER DECISIONS FOR SCENARIO
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const scenarioId = searchParams.get('scenarioId')
    const userId = searchParams.get('userId')
    const guestToken = searchParams.get('guestToken')

    if (!scenarioId || (!userId && !guestToken)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user's decisions for this scenario
    let query = supabase
      .from('user_scenario_decisions')
      .select(`
        *,
        user_scenario_attempts!inner(scenario_id),
        scenario_decisions!inner(*)
      `)
      .eq('user_scenario_attempts.scenario_id', scenarioId)

    if (userId) {
      query = query.eq('user_scenario_attempts.user_id', userId)
    } else {
      query = query.eq('user_scenario_attempts.guest_token', guestToken)
    }

    const { data: decisions, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user decisions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch decisions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decisions: decisions || []
    })

  } catch (error) {
    console.error('Unexpected error fetching decisions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 