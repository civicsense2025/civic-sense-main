// ============================================================================
// SURVEY INCENTIVES SYSTEM TYPES
// ============================================================================
// TypeScript interfaces for the complete survey incentives and rewards system

// ============================================================================
// CORE INCENTIVE TYPES
// ============================================================================

/**
 * Survey incentive configuration
 */
export interface SurveyIncentive {
  id: string
  survey_id: string
  
  // Basic configuration
  enabled: boolean
  title: string
  description?: string
  
  // Incentive types and configurations
  incentive_types: IncentiveType[]
  raffle_config?: RaffleConfig
  credits_config?: CreditsConfig
  premium_config?: PremiumConfig
  discount_config?: DiscountConfig
  
  // Limits and requirements
  max_rewards?: number
  rewards_given: number
  completion_required: boolean
  authenticated_only: boolean
  
  // Display settings
  show_on_start: boolean
  show_progress_reminder: boolean
  show_on_completion: boolean
  
  // Timing
  valid_from: string
  valid_until?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Types of incentives available
 */
export type IncentiveType = 'raffle' | 'credits' | 'premium_access' | 'discount'

/**
 * Raffle configuration
 */
export interface RaffleConfig {
  prize: string // "Amazon Gift Card"
  prize_value?: string // "$50"
  total_winners: number
  draw_date: string
  description?: string
  terms_conditions?: string
  winner_announcement_method?: 'email' | 'platform' | 'both'
}

/**
 * Credits configuration
 */
export interface CreditsConfig {
  amount: number
  currency: string // 'civics_points', 'gift_credit'
  description?: string
  expires_days?: number
  min_completion_percentage?: number
}

/**
 * Premium access configuration
 */
export interface PremiumConfig {
  type: 'subscription' | 'one_time' | 'feature_unlock'
  duration_months?: number
  tier: 'premium' | 'pro' | 'enterprise'
  features?: string[]
  description?: string
  auto_activate?: boolean
}

/**
 * Discount configuration
 */
export interface DiscountConfig {
  percentage?: number
  fixed_amount?: number
  currency: string
  code_prefix?: string
  valid_days: number
  applies_to: string[] // ['premium_subscription', 'lifetime_access']
  description?: string
  max_uses?: number
}

// ============================================================================
// USER CREDITS SYSTEM
// ============================================================================

/**
 * User credit entry
 */
export interface UserCredit {
  id: string
  user_id: string
  
  // Credit details
  credit_type: CreditType
  amount: number
  currency: string
  
  // Source tracking
  source_type: CreditSourceType
  source_id?: string
  source_description?: string
  
  // Status and expiration
  status: CreditStatus
  expires_at?: string
  
  // Redemption tracking
  redeemed_at?: string
  redeemed_for?: string
  redemption_details?: Record<string, any>
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Types of credits
 */
export type CreditType = 'civics_points' | 'gift_credit' | 'discount_credit' | 'premium_credit'

/**
 * Credit source types
 */
export type CreditSourceType = 'survey_completion' | 'manual_grant' | 'referral' | 'promotion' | 'achievement'

/**
 * Credit status
 */
export type CreditStatus = 'active' | 'redeemed' | 'expired' | 'revoked'

/**
 * User credits summary
 */
export interface UserCreditsBalance {
  user_id: string
  civics_points: number
  gift_credits: number
  discount_credits: number
  premium_credits: number
  total_earned: number
  total_redeemed: number
}

// ============================================================================
// RAFFLE SYSTEM
// ============================================================================

/**
 * Raffle entry
 */
export interface RaffleEntry {
  id: string
  survey_incentive_id: string
  user_id?: string
  survey_response_id: string
  
  // Entry details
  entry_number: number
  ticket_code: string
  
  // Contact info for anonymous entries
  contact_email?: string
  contact_name?: string
  
  // Validation
  is_valid: boolean
  validation_notes?: string
  
  // Prize tracking
  is_winner: boolean
  prize_tier?: number
  prize_description?: string
  prize_claimed: boolean
  prize_claimed_at?: string
  
  // Metadata
  created_at: string
}

/**
 * Raffle draw results
 */
export interface RaffleDrawResults {
  survey_incentive_id: string
  draw_date: string
  total_entries: number
  winners: RaffleWinner[]
  draw_method: string
  conducted_by: string
  verified_at: string
}

/**
 * Raffle winner details
 */
export interface RaffleWinner {
  entry_id: string
  user_id?: string
  ticket_code: string
  prize_tier: number
  prize_description: string
  contact_email?: string
  contact_name?: string
  notification_sent: boolean
  prize_claimed: boolean
}

// ============================================================================
// REWARD FULFILLMENT
// ============================================================================

/**
 * Reward fulfillment tracking
 */
export interface RewardFulfillment {
  id: string
  user_id?: string
  survey_incentive_id: string
  survey_response_id: string
  
  // Reward details
  reward_type: RewardType
  reward_data: Record<string, any>
  
  // Fulfillment status
  status: FulfillmentStatus
  fulfillment_method?: FulfillmentMethod
  
  // Tracking
  fulfilled_at?: string
  fulfillment_details?: Record<string, any>
  notification_sent: boolean
  notification_sent_at?: string
  
  // Admin tracking
  admin_notes?: string
  processed_by?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Types of rewards
 */
export type RewardType = 'raffle_entry' | 'credits' | 'premium_access' | 'discount_code'

/**
 * Fulfillment status
 */
export type FulfillmentStatus = 'pending' | 'fulfilled' | 'failed' | 'cancelled'

/**
 * Fulfillment methods
 */
export type FulfillmentMethod = 'automatic' | 'manual' | 'email' | 'stripe' | 'api'

// ============================================================================
// DISCOUNT CODES
// ============================================================================

/**
 * Discount code
 */
export interface DiscountCode {
  id: string
  code: string
  
  // Discount details
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  currency: string
  
  // Applicable products
  applies_to: string[]
  
  // Usage limits
  max_uses?: number
  uses_count: number
  max_uses_per_user: number
  
  // Validity
  valid_from: string
  valid_until?: string
  
  // Source tracking
  source_type?: string
  source_id?: string
  
  // Status
  is_active: boolean
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * User discount code usage
 */
export interface UserDiscountUsage {
  id: string
  user_id: string
  discount_code_id: string
  
  // Usage details
  used_at: string
  order_id?: string
  discount_amount: number
  original_amount: number
  final_amount: number
  
  // Source
  survey_response_id?: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to create survey incentive
 */
export interface CreateSurveyIncentiveRequest {
  survey_id: string
  title: string
  description?: string
  incentive_types: IncentiveType[]
  raffle_config?: RaffleConfig
  credits_config?: CreditsConfig
  premium_config?: PremiumConfig
  discount_config?: DiscountConfig
  max_rewards?: number
  completion_required?: boolean
  authenticated_only?: boolean
  show_on_start?: boolean
  show_progress_reminder?: boolean
  show_on_completion?: boolean
  valid_from?: string
  valid_until?: string
}

/**
 * Request to update survey incentive
 */
export interface UpdateSurveyIncentiveRequest extends Partial<CreateSurveyIncentiveRequest> {
  enabled?: boolean
}

/**
 * Response for incentive eligibility check
 */
export interface IncentiveEligibilityResponse {
  eligible: boolean
  reason?: string
  incentive?: SurveyIncentive
  user_entries?: RaffleEntry[]
  existing_rewards?: RewardFulfillment[]
}

/**
 * Request to claim survey rewards
 */
export interface ClaimSurveyRewardsRequest {
  survey_response_id: string
  survey_incentive_id: string
  user_id?: string
  contact_email?: string
  contact_name?: string
}

/**
 * Response for claimed rewards
 */
export interface ClaimSurveyRewardsResponse {
  success: boolean
  rewards_claimed: RewardFulfillment[]
  raffle_entries: RaffleEntry[]
  credits_awarded: UserCredit[]
  discount_codes: DiscountCode[]
  premium_access_granted?: {
    type: string
    duration_months?: number
    activated_at: string
    expires_at?: string
  }
  messages: string[]
  errors?: string[]
}

/**
 * Admin dashboard stats
 */
export interface IncentivesAdminStats {
  total_incentives: number
  active_incentives: number
  total_rewards_given: number
  
  // By type
  raffle_entries: number
  credits_awarded: number
  premium_access_granted: number
  discount_codes_issued: number
  
  // Completion stats
  pending_fulfillments: number
  failed_fulfillments: number
  
  // Recent activity
  recent_completions: RewardFulfillment[]
  upcoming_raffle_draws: SurveyIncentive[]
}

/**
 * Survey incentive analytics
 */
export interface SurveyIncentiveAnalytics {
  survey_incentive_id: string
  
  // Participation
  total_eligible_responses: number
  total_rewards_claimed: number
  claim_rate: number
  
  // By incentive type
  raffle_entries_count: number
  credits_awarded_total: number
  premium_access_granted_count: number
  discount_codes_used_count: number
  
  // Timeline
  daily_claims: Array<{
    date: string
    claims: number
    reward_type: RewardType
  }>
  
  // Fulfillment success rate
  fulfillment_success_rate: number
  avg_fulfillment_time_hours: number
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for incentive display component
 */
export interface IncentiveDisplayProps {
  incentive: SurveyIncentive
  showDetails?: boolean
  showClaimButton?: boolean
  onClaim?: () => void
  className?: string
}

/**
 * Props for raffle ticket component
 */
export interface RaffleTicketProps {
  entry: RaffleEntry
  incentive: SurveyIncentive
  showPrizeDetails?: boolean
  className?: string
}

/**
 * Props for credits balance component
 */
export interface CreditsBalanceProps {
  balance: UserCreditsBalance
  showDetails?: boolean
  showRedemptionOptions?: boolean
  onRedeem?: (creditType: CreditType, amount: number) => void
  className?: string
}

/**
 * Props for reward fulfillment status component
 */
export interface RewardStatusProps {
  fulfillment: RewardFulfillment
  showDetails?: boolean
  allowRetry?: boolean
  onRetry?: () => void
  className?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Incentive validation result
 */
export interface IncentiveValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Reward claim validation
 */
export interface RewardClaimValidation {
  canClaim: boolean
  reasons: string[]
  requiredActions: string[]
}

/**
 * User eligibility status
 */
export interface UserEligibilityStatus {
  user_id?: string
  survey_id: string
  incentive_id: string
  eligible: boolean
  completed_survey: boolean
  authenticated: boolean
  already_claimed: boolean
  within_time_limit: boolean
  meets_requirements: boolean
}

export default SurveyIncentive 