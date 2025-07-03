// ============================================================================
// SURVEY INCENTIVES API ROUTE
// ============================================================================
// Handles CRUD operations for survey incentives configuration

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { 
  SurveyIncentive, 
  CreateSurveyIncentiveRequest,
  IncentiveType 
} from '@/types/incentives'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RaffleConfigSchema = z.object({
  prize: z.string().min(1),
  prize_value: z.string().optional(),
  total_winners: z.number().min(1),
  draw_date: z.string(),
  description: z.string().optional(),
  terms_conditions: z.string().optional(),
  winner_announcement_method: z.enum(['email', 'platform', 'both']).optional()
})

const CreditsConfigSchema = z.object({
  amount: z.number().min(1),
  currency: z.string().min(1),
  description: z.string().optional(),
  expires_days: z.number().optional(),
  min_completion_percentage: z.number().min(0).max(100).optional()
})

const PremiumConfigSchema = z.object({
  type: z.enum(['subscription', 'one_time', 'feature_unlock']),
  duration_months: z.number().min(1).optional(),
  tier: z.enum(['premium', 'pro', 'enterprise']),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
  auto_activate: z.boolean().optional()
})

const DiscountConfigSchema = z.object({
  percentage: z.number().min(1).max(100).optional(),
  fixed_amount: z.number().min(1).optional(),
  currency: z.string().min(1),
  code_prefix: z.string().optional(),
  valid_days: z.number().min(1),
  applies_to: z.array(z.string()),
  description: z.string().optional(),
  max_uses: z.number().min(1).optional()
})

const CreateIncentiveSchema = z.object({
  survey_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  incentive_types: z.array(z.enum(['raffle', 'credits', 'premium_access', 'discount'])),
  raffle_config: RaffleConfigSchema.optional(),
  credits_config: CreditsConfigSchema.optional(),
  premium_config: PremiumConfigSchema.optional(),
  discount_config: DiscountConfigSchema.optional(),
  max_rewards: z.number().min(1).optional(),
  completion_required: z.boolean().default(true),
  authenticated_only: z.boolean().default(false),
  show_on_start: z.boolean().default(true),
  show_progress_reminder: z.boolean().default(true),
  show_on_completion: z.boolean().default(true),
  valid_from: z.string().optional(),
  valid_until: z.string().optional()
})

const UpdateIncentiveSchema = CreateIncentiveSchema.partial().extend({
  enabled: z.boolean().optional()
})

// ============================================================================
// GET - Fetch Survey Incentives
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const surveyId = searchParams.get('survey_id')
    const includeInactive = searchParams.get('include_inactive') === 'true'
    
    // Build query
    let query = supabase
      .from('survey_incentives')
      .select(`
        id,
        survey_id,
        enabled,
        title,
        description,
        incentive_types,
        raffle_config,
        credits_config,
        premium_config,
        discount_config,
        max_rewards,
        rewards_given,
        completion_required,
        authenticated_only,
        show_on_start,
        show_progress_reminder,
        show_on_completion,
        valid_from,
        valid_until,
        created_at,
        updated_at,
        created_by
      `)
      .order('created_at', { ascending: false })
    
    // Filter by survey if specified
    if (surveyId) {
      query = query.eq('survey_id', surveyId)
    }
    
    // Filter by active status if not including inactive
    if (!includeInactive) {
      query = query.eq('enabled', true)
    }
    
    const { data: incentives, error } = await query
    
    if (error) {
      console.error('Error fetching survey incentives:', error)
      return NextResponse.json(
        { error: 'Failed to fetch survey incentives' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: incentives || []
    })
    
  } catch (error) {
    console.error('Unexpected error in GET /api/surveys/incentives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Survey Incentive
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validate request body
    const validationResult = CreateIncentiveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }
    
    const data = validationResult.data
    
    // Get current user for created_by field
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Validate incentive configurations match types
    const validationErrors: string[] = []
    
    if (data.incentive_types.includes('raffle') && !data.raffle_config) {
      validationErrors.push('Raffle configuration required when raffle incentive is selected')
    }
    
    if (data.incentive_types.includes('credits') && !data.credits_config) {
      validationErrors.push('Credits configuration required when credits incentive is selected')
    }
    
    if (data.incentive_types.includes('premium_access') && !data.premium_config) {
      validationErrors.push('Premium configuration required when premium access incentive is selected')
    }
    
    if (data.incentive_types.includes('discount') && !data.discount_config) {
      validationErrors.push('Discount configuration required when discount incentive is selected')
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Configuration validation failed',
          details: validationErrors
        },
        { status: 400 }
      )
    }
    
    // Verify survey exists and user has permission
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, created_by')
      .eq('id', data.survey_id)
      .single()
    
    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }
    
    // Check if user can manage this survey (survey creator or admin)
    const userRole = user.user_metadata?.role
    const canManage = survey.created_by === user.id || userRole === 'admin'
    
    if (!canManage) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Create survey incentive
    const { data: incentive, error: insertError } = await supabase
      .from('survey_incentives')
      .insert({
        ...data,
        created_by: user.id,
        enabled: true // Enable by default when creating
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating survey incentive:', insertError)
      return NextResponse.json(
        { error: 'Failed to create survey incentive' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: incentive,
      message: 'Survey incentive created successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in POST /api/surveys/incentives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Survey Incentive
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const incentiveId = searchParams.get('id')
    
    if (!incentiveId) {
      return NextResponse.json(
        { error: 'Incentive ID required' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = UpdateIncentiveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }
    
    const data = validationResult.data
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify incentive exists and user has permission
    const { data: existingIncentive, error: fetchError } = await supabase
      .from('survey_incentives')
      .select(`
        id,
        survey_id,
        created_by,
        surveys!survey_incentives_survey_id_fkey(created_by)
      `)
      .eq('id', incentiveId)
      .single()
    
    if (fetchError || !existingIncentive) {
      return NextResponse.json(
        { error: 'Survey incentive not found' },
        { status: 404 }
      )
    }
    
    // Check permissions
    const userRole = user.user_metadata?.role
    const canManage = existingIncentive.created_by === user.id || 
                     existingIncentive.surveys?.created_by === user.id || 
                     userRole === 'admin'
    
    if (!canManage) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Update survey incentive
    const { data: updatedIncentive, error: updateError } = await supabase
      .from('survey_incentives')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', incentiveId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating survey incentive:', updateError)
      return NextResponse.json(
        { error: 'Failed to update survey incentive' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedIncentive,
      message: 'Survey incentive updated successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/surveys/incentives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete Survey Incentive
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const incentiveId = searchParams.get('id')
    
    if (!incentiveId) {
      return NextResponse.json(
        { error: 'Incentive ID required' },
        { status: 400 }
      )
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify incentive exists and user has permission
    const { data: existingIncentive, error: fetchError } = await supabase
      .from('survey_incentives')
      .select(`
        id,
        survey_id,
        created_by,
        surveys!survey_incentives_survey_id_fkey(created_by)
      `)
      .eq('id', incentiveId)
      .single()
    
    if (fetchError || !existingIncentive) {
      return NextResponse.json(
        { error: 'Survey incentive not found' },
        { status: 404 }
      )
    }
    
    // Check permissions (only survey creator or admin can delete)
    const userRole = user.user_metadata?.role
    const canDelete = existingIncentive.created_by === user.id || 
                     existingIncentive.surveys?.created_by === user.id || 
                     userRole === 'admin'
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Check if there are any existing rewards/entries that prevent deletion
    const { data: existingRewards, error: rewardsError } = await supabase
      .from('reward_fulfillments')
      .select('id')
      .eq('survey_incentive_id', incentiveId)
      .limit(1)
    
    if (rewardsError) {
      console.error('Error checking existing rewards:', rewardsError)
      return NextResponse.json(
        { error: 'Failed to validate deletion' },
        { status: 500 }
      )
    }
    
    if (existingRewards && existingRewards.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete incentive with existing rewards',
          message: 'This incentive has already been claimed by users and cannot be deleted'
        },
        { status: 409 }
      )
    }
    
    // Delete survey incentive
    const { error: deleteError } = await supabase
      .from('survey_incentives')
      .delete()
      .eq('id', incentiveId)
    
    if (deleteError) {
      console.error('Error deleting survey incentive:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete survey incentive' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Survey incentive deleted successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/surveys/incentives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 