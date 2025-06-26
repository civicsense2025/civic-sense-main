// ============================================================================
// UNCLAIMED SURVEY REWARDS API ROUTE
// ============================================================================
// Fetches survey rewards that users have completed but not yet claimed

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for operations that need elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// GET - Fetch Unclaimed Rewards
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('user_id')
    const guestToken = searchParams.get('guest_token')
    
    if (!userId && !guestToken) {
      return NextResponse.json(
        { error: 'User ID or guest token required' },
        { status: 400 }
      )
    }
    
    // Use service role client to avoid RLS policy conflicts
    // First, get completed survey responses without joins
    let responseQuery = serviceSupabase
      .from('survey_responses')
      .select('id, survey_id, user_id, guest_token, is_complete, created_at, completed_at')
      .eq('is_complete', true)
      .not('completed_at', 'is', null)
    
    // Filter by user or guest token
    if (userId) {
      responseQuery = responseQuery.eq('user_id', userId)
    } else {
      responseQuery = responseQuery.eq('guest_token', guestToken)
    }
    
    const { data: responses, error: responsesError } = await responseQuery
    
    if (responsesError) {
      console.error('Error fetching survey responses:', responsesError)
      // Return empty results instead of error to prevent blocking the UI
      return NextResponse.json({
        success: true,
        unclaimed_rewards: []
      })
    }
    
    if (!responses || responses.length === 0) {
      return NextResponse.json({
        success: true,
        unclaimed_rewards: []
      })
    }
    
    // Get survey titles separately to avoid join issues
    const surveyIds = responses.map(r => r.survey_id)
    const { data: surveys, error: surveysError } = await serviceSupabase
      .from('surveys')
      .select('id, title, description')
      .in('id', surveyIds)
    
    if (surveysError) {
      console.error('Error fetching surveys:', surveysError)
      // Continue without survey details rather than failing
    }
    
    // Create a map of survey details for quick lookup
    const surveyMap = new Map()
    if (surveys) {
      surveys.forEach(survey => {
        surveyMap.set(survey.id, survey)
      })
    }
    
    // Fetch active incentives for these surveys
    const { data: incentives, error: incentivesError } = await serviceSupabase
      .from('survey_incentives')
      .select('*')
      .in('survey_id', surveyIds)
      .eq('enabled', true)
      .gt('valid_until', new Date().toISOString()) // Only active incentives
    
    if (incentivesError) {
      console.error('Error fetching survey incentives:', incentivesError)
      return NextResponse.json({
        success: true,
        unclaimed_rewards: []
      })
    }
    
    if (!incentives || incentives.length === 0) {
      return NextResponse.json({
        success: true,
        unclaimed_rewards: []
      })
    }
    
    // Get response IDs to check for existing reward fulfillments
    const responseIds = responses.map(r => r.id)
    
    const { data: existingFulfillments, error: fulfillmentsError } = await serviceSupabase
      .from('reward_fulfillments')
      .select('survey_response_id, survey_incentive_id')
      .in('survey_response_id', responseIds)
    
    if (fulfillmentsError) {
      console.error('Error fetching existing fulfillments:', fulfillmentsError)
      // Continue without fulfillment check rather than failing
    }
    
    // Create a set of claimed rewards for quick lookup
    const claimedRewards = new Set(
      existingFulfillments?.map(f => `${f.survey_response_id}-${f.survey_incentive_id}`) || []
    )
    
    // Build unclaimed rewards list
    const unclaimedRewards = []
    
    for (const response of responses) {
      // Find incentives for this survey
      const surveyIncentives = incentives.filter(i => i.survey_id === response.survey_id)
      
      for (const incentive of surveyIncentives) {
        const rewardKey = `${response.id}-${incentive.id}`
        
        // Skip if already claimed
        if (claimedRewards.has(rewardKey)) {
          continue
        }
        
        // Check if user meets requirements
        let canClaim = true
        let reason = ''
        
        // Check authentication requirement
        if (incentive.authenticated_only && !userId) {
          canClaim = false
          reason = 'Authentication required for this reward'
        }
        
        // Check max rewards limit
        if (incentive.max_rewards && incentive.rewards_given >= incentive.max_rewards) {
          canClaim = false
          reason = 'Maximum rewards limit reached'
        }
        
        // Check if incentive is still valid
        if (incentive.valid_until && new Date(incentive.valid_until) < new Date()) {
          canClaim = false
          reason = 'Reward offer has expired'
        }
        
        // Check completion requirement (already filtered above, but double-check)
        if (incentive.completion_required && !response.is_complete) {
          canClaim = false
          reason = 'Survey must be completed'
        }
        
        // Get survey details from our map
        const surveyDetails = surveyMap.get(response.survey_id)
        
        unclaimedRewards.push({
          survey_response_id: response.id,
          survey_id: response.survey_id,
          survey_title: surveyDetails?.title || 'Unknown Survey',
          incentive: incentive,
          completed_at: response.completed_at,
          can_claim: canClaim,
          reason: reason || undefined
        })
      }
    }
    
    // Sort by completion date (newest first)
    unclaimedRewards.sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    
    return NextResponse.json({
      success: true,
      unclaimed_rewards: unclaimedRewards
    })
    
  } catch (error) {
    console.error('Unexpected error in GET /api/surveys/unclaimed-rewards:', error)
    // Return empty results instead of error to prevent blocking the UI
    return NextResponse.json({
      success: true,
      unclaimed_rewards: []
    })
  }
} 