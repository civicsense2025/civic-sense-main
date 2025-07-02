// ============================================================================
// SURVEY REWARDS CLAIM API ROUTE
// ============================================================================
// Handles claiming rewards when users complete surveys with incentives

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { z } from 'zod'
import type { 
  ClaimSurveyRewardsRequest,
  ClaimSurveyRewardsResponse,
  SurveyIncentive,
  RaffleEntry,
  UserCredit,
  RewardFulfillment
} from '@civicsense/shared/types/incentives'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ClaimRewardsSchema = z.object({
  survey_response_id: z.string().uuid(),
  survey_incentive_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  contact_email: z.string().email().optional(),
  contact_name: z.string().min(1).optional()
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates unique ticket code for raffle entries
 */
async function generateUniqueTicketCode(supabase: any): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const code = 'TKT-' + Math.random().toString(36).substr(2, 8).toUpperCase()
    
    const { data: existing } = await supabase
      .from('raffle_entries')
      .select('id')
      .eq('ticket_code', code)
      .single()
    
    if (!existing) {
      return code
    }
    
    attempts++
  }
  
  throw new Error('Failed to generate unique ticket code')
}

/**
 * Generates unique discount code
 */
async function generateDiscountCode(prefix: string, supabase: any): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const suffix = Math.random().toString(36).substr(2, 6).toUpperCase()
    const code = `${prefix}-${suffix}`
    
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('code', code)
      .single()
    
    if (!existing) {
      return code
    }
    
    attempts++
  }
  
  throw new Error('Failed to generate unique discount code')
}

/**
 * Creates raffle entry for user
 */
async function createRaffleEntry(
  supabase: any,
  incentive: SurveyIncentive,
  surveyResponseId: string,
  userId?: string,
  contactEmail?: string,
  contactName?: string
): Promise<RaffleEntry> {
  // Get next entry number for this raffle
  const { data: entryCount, error: countError } = await supabase
    .from('raffle_entries')
    .select('entry_number')
    .eq('survey_incentive_id', incentive.id)
    .order('entry_number', { ascending: false })
    .limit(1)
  
  if (countError) throw countError
  
  const nextEntryNumber = (entryCount?.[0]?.entry_number || 0) + 1
  const ticketCode = await generateUniqueTicketCode(supabase)
  
  const { data: entry, error: entryError } = await supabase
    .from('raffle_entries')
    .insert({
      survey_incentive_id: incentive.id,
      user_id: userId,
      survey_response_id: surveyResponseId,
      entry_number: nextEntryNumber,
      ticket_code: ticketCode,
      contact_email: contactEmail,
      contact_name: contactName,
      is_valid: true
    })
    .select()
    .single()
  
  if (entryError) throw entryError
  
  return entry
}

/**
 * Creates user credits
 */
async function createUserCredits(
  supabase: any,
  incentive: SurveyIncentive,
  surveyResponseId: string,
  userId: string
): Promise<UserCredit> {
  const creditsConfig = incentive.credits_config!
  
  const expiresAt = creditsConfig.expires_days 
    ? new Date(Date.now() + creditsConfig.expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null
  
  const { data: credit, error: creditError } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      credit_type: creditsConfig.currency,
      amount: creditsConfig.amount,
      currency: creditsConfig.currency,
      source_type: 'survey_completion',
      source_id: incentive.survey_id,
      source_description: `Completed survey: ${incentive.title}`,
      status: 'active',
      expires_at: expiresAt
    })
    .select()
    .single()
  
  if (creditError) throw creditError
  
  return credit
}

/**
 * Creates discount code for user
 */
async function createDiscountCode(
  supabase: any,
  incentive: SurveyIncentive,
  surveyResponseId: string,
  userId?: string
): Promise<any> {
  const discountConfig = incentive.discount_config!
  const prefix = discountConfig.code_prefix || 'SURVEY'
  const code = await generateDiscountCode(prefix, supabase)
  
  const validUntil = new Date(Date.now() + discountConfig.valid_days * 24 * 60 * 60 * 1000).toISOString()
  
  const { data: discountCode, error: discountError } = await supabase
    .from('discount_codes')
    .insert({
      code,
      discount_type: discountConfig.percentage ? 'percentage' : 'fixed_amount',
      discount_value: discountConfig.percentage || discountConfig.fixed_amount,
      currency: discountConfig.currency,
      applies_to: discountConfig.applies_to,
      max_uses: discountConfig.max_uses || 1,
      uses_count: 0,
      max_uses_per_user: 1,
      valid_from: new Date().toISOString(),
      valid_until: validUntil,
      source_type: 'survey_incentive',
      source_id: incentive.id,
      is_active: true
    })
    .select()
    .single()
  
  if (discountError) throw discountError
  
  return discountCode
}

/**
 * Records reward fulfillment
 */
async function recordRewardFulfillment(
  supabase: any,
  incentive: SurveyIncentive,
  surveyResponseId: string,
  rewardType: string,
  rewardData: any,
  userId?: string
): Promise<RewardFulfillment> {
  const { data: fulfillment, error: fulfillmentError } = await supabase
    .from('reward_fulfillments')
    .insert({
      user_id: userId,
      survey_incentive_id: incentive.id,
      survey_response_id: surveyResponseId,
      reward_type: rewardType,
      reward_data: rewardData,
      status: 'fulfilled',
      fulfillment_method: 'automatic',
      fulfilled_at: new Date().toISOString(),
      notification_sent: false
    })
    .select()
    .single()
  
  if (fulfillmentError) throw fulfillmentError
  
  return fulfillment
}

// ============================================================================
// POST - Claim Survey Rewards
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate request body
    const validationResult = ClaimRewardsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }
    
    const { 
      survey_response_id, 
      survey_incentive_id, 
      user_id, 
      contact_email, 
      contact_name 
    } = validationResult.data
    
    // Verify survey response exists and is complete
    const { data: surveyResponse, error: responseError } = await supabase
      .from('survey_responses')
      .select('id, survey_id, is_complete, user_id, guest_token')
      .eq('id', survey_response_id)
      .single()
    
    if (responseError || !surveyResponse) {
      return NextResponse.json(
        { error: 'Survey response not found' },
        { status: 404 }
      )
    }
    
    if (!surveyResponse.is_complete) {
      return NextResponse.json(
        { error: 'Survey must be completed to claim rewards' },
        { status: 400 }
      )
    }
    
    // Get survey incentive details
    const { data: incentive, error: incentiveError } = await supabase
      .from('survey_incentives')
      .select('*')
      .eq('id', survey_incentive_id)
      .eq('enabled', true)
      .single()
    
    if (incentiveError || !incentive) {
      return NextResponse.json(
        { error: 'Survey incentive not found or not active' },
        { status: 404 }
      )
    }
    
    // Verify incentive is for the correct survey
    if (incentive.survey_id !== surveyResponse.survey_id) {
      return NextResponse.json(
        { error: 'Incentive does not match survey' },
        { status: 400 }
      )
    }
    
    // Check if incentive is still valid
    if (incentive.valid_until && new Date(incentive.valid_until) < new Date()) {
      return NextResponse.json(
        { error: 'Incentive has expired' },
        { status: 400 }
      )
    }
    
    // Check if max rewards limit reached
    if (incentive.max_rewards && incentive.rewards_given >= incentive.max_rewards) {
      return NextResponse.json(
        { error: 'Maximum rewards limit reached' },
        { status: 400 }
      )
    }
    
    // Check authentication requirements
    if (incentive.authenticated_only && !user_id) {
      return NextResponse.json(
        { error: 'Authentication required for this incentive' },
        { status: 401 }
      )
    }
    
    // Check if rewards already claimed for this response
    const { data: existingFulfillments, error: fulfillmentError } = await supabase
      .from('reward_fulfillments')
      .select('id')
      .eq('survey_response_id', survey_response_id)
      .eq('survey_incentive_id', survey_incentive_id)
    
    if (fulfillmentError) {
      console.error('Error checking existing fulfillments:', fulfillmentError)
      return NextResponse.json(
        { error: 'Failed to validate reward eligibility' },
        { status: 500 }
      )
    }
    
    if (existingFulfillments && existingFulfillments.length > 0) {
      return NextResponse.json(
        { error: 'Rewards have already been claimed for this survey response' },
        { status: 409 }
      )
    }
    
    // Process rewards based on incentive types
    const rewardsClaimedResponse: ClaimSurveyRewardsResponse = {
      success: true,
      rewards_claimed: [],
      raffle_entries: [],
      credits_awarded: [],
      discount_codes: [],
      messages: []
    }
    
    try {
      // Process raffle entries
      if (incentive.incentive_types.includes('raffle')) {
        const raffleEntry = await createRaffleEntry(
          supabase,
          incentive,
          survey_response_id,
          user_id,
          contact_email,
          contact_name
        )
        
        rewardsClaimedResponse.raffle_entries.push(raffleEntry)
        
        const fulfillment = await recordRewardFulfillment(
          supabase,
          incentive,
          survey_response_id,
          'raffle_entry',
          { ticket_code: raffleEntry.ticket_code, entry_number: raffleEntry.entry_number },
          user_id
        )
        
        rewardsClaimedResponse.rewards_claimed.push(fulfillment)
        rewardsClaimedResponse.messages.push(
          `🎟️ Raffle entry created! Your ticket code is ${raffleEntry.ticket_code}`
        )
      }
      
      // Process credits (requires authenticated user)
      if (incentive.incentive_types.includes('credits') && user_id) {
        const credit = await createUserCredits(
          supabase,
          incentive,
          survey_response_id,
          user_id
        )
        
        rewardsClaimedResponse.credits_awarded.push(credit)
        
        const fulfillment = await recordRewardFulfillment(
          supabase,
          incentive,
          survey_response_id,
          'credits',
          { amount: credit.amount, currency: credit.currency },
          user_id
        )
        
        rewardsClaimedResponse.rewards_claimed.push(fulfillment)
        rewardsClaimedResponse.messages.push(
          `💰 ${credit.amount} ${credit.currency} credits added to your account!`
        )
      }
      
      // Process premium access (requires authenticated user)
      if (incentive.incentive_types.includes('premium_access') && user_id) {
        const premiumConfig = incentive.premium_config!
        const expiresAt = premiumConfig.duration_months 
          ? new Date(Date.now() + premiumConfig.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
        
        // Here you would integrate with your subscription system
        // For now, we'll just record the fulfillment
        const fulfillment = await recordRewardFulfillment(
          supabase,
          incentive,
          survey_response_id,
          'premium_access',
          {
            type: premiumConfig.type,
            tier: premiumConfig.tier,
            duration_months: premiumConfig.duration_months,
            activated_at: new Date().toISOString(),
            expires_at: expiresAt
          },
          user_id
        )
        
        rewardsClaimedResponse.rewards_claimed.push(fulfillment)
        rewardsClaimedResponse.premium_access_granted = {
          type: premiumConfig.type,
          duration_months: premiumConfig.duration_months,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt
        }
        
        rewardsClaimedResponse.messages.push(
          `⭐ Premium access granted! Enjoy ${premiumConfig.duration_months || 'lifetime'} ${premiumConfig.tier} features.`
        )
      }
      
      // Process discount codes
      if (incentive.incentive_types.includes('discount')) {
        const discountCode = await createDiscountCode(
          supabase,
          incentive,
          survey_response_id,
          user_id
        )
        
        rewardsClaimedResponse.discount_codes.push(discountCode)
        
        const fulfillment = await recordRewardFulfillment(
          supabase,
          incentive,
          survey_response_id,
          'discount_code',
          { code: discountCode.code, discount_value: discountCode.discount_value },
          user_id
        )
        
        rewardsClaimedResponse.rewards_claimed.push(fulfillment)
        rewardsClaimedResponse.messages.push(
          `🎁 Discount code created: ${discountCode.code} (${discountCode.discount_value}${discountCode.discount_type === 'percentage' ? '%' : ` ${discountCode.currency}`} off)`
        )
      }
      
      // Update rewards given count
      await supabase
        .from('survey_incentives')
        .update({ 
          rewards_given: incentive.rewards_given + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', incentive.id)
      
    } catch (rewardError) {
      console.error('Error processing rewards:', rewardError)
      return NextResponse.json(
        { 
          error: 'Failed to process rewards',
          details: rewardError instanceof Error ? rewardError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(rewardsClaimedResponse)
    
  } catch (error) {
    console.error('Unexpected error in POST /api/surveys/claim-rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 