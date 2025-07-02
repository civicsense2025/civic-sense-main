-- ============================================================================
-- SURVEY INCENTIVES & REWARDS SYSTEM
-- ============================================================================
-- Comprehensive system for managing survey incentives, user credits, raffles,
-- and premium access rewards

-- Survey Incentives Configuration
-- ============================================================================
CREATE TABLE survey_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- Basic configuration
  enabled BOOLEAN DEFAULT FALSE,
  title VARCHAR(255) NOT NULL, -- "Complete our Alpha Survey!"
  description TEXT, -- "Get a chance to win $50 Amazon gift card + premium access"
  
  -- Incentive types
  incentive_types JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['raffle', 'credits', 'premium_access', 'discount']
  
  -- Raffle configuration
  raffle_config JSONB DEFAULT NULL, -- { prize: "$50 Amazon Gift Card", total_winners: 5, draw_date: "2024-02-01" }
  
  -- Credits configuration  
  credits_config JSONB DEFAULT NULL, -- { amount: 100, currency: "civics_points", description: "Earn 100 CivicSense points!" }
  
  -- Premium access configuration
  premium_config JSONB DEFAULT NULL, -- { type: "subscription", duration_months: 1, tier: "premium" }
  
  -- Discount configuration
  discount_config JSONB DEFAULT NULL, -- { percentage: 25, code: "SURVEY25", valid_days: 30 }
  
  -- Limits and requirements
  max_rewards INTEGER, -- Total number of rewards available (null = unlimited)
  rewards_given INTEGER DEFAULT 0, -- Track how many have been given
  completion_required BOOLEAN DEFAULT TRUE, -- Must complete entire survey
  authenticated_only BOOLEAN DEFAULT FALSE, -- Require user account
  
  -- Display settings
  show_on_start BOOLEAN DEFAULT TRUE, -- Show incentive when starting survey
  show_progress_reminder BOOLEAN DEFAULT TRUE, -- Remind during survey
  show_on_completion BOOLEAN DEFAULT TRUE, -- Show reward earned message
  
  -- Timing
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- User Credits System
-- ============================================================================
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Credit types
  credit_type VARCHAR(50) NOT NULL DEFAULT 'civics_points', -- 'civics_points', 'gift_credit', 'discount_credit'
  
  -- Amount and currency
  amount INTEGER NOT NULL,
  currency VARCHAR(20) DEFAULT 'points', -- 'points', 'USD', 'credits'
  
  -- Source tracking
  source_type VARCHAR(50) NOT NULL, -- 'survey_completion', 'manual_grant', 'referral', 'promotion'
  source_id UUID, -- Reference to survey, admin action, etc.
  source_description TEXT, -- "Completed Alpha Survey", "Referred new user"
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed', 'expired', 'revoked'
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Redemption tracking
  redeemed_at TIMESTAMP,
  redeemed_for TEXT, -- What they used the credit for
  redemption_details JSONB, -- Additional redemption info
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure non-negative amounts
  CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Raffle System
-- ============================================================================
CREATE TABLE raffle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_incentive_id UUID REFERENCES survey_incentives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  
  -- Entry details
  entry_number INTEGER NOT NULL, -- Sequential entry number for this raffle
  ticket_code VARCHAR(50) UNIQUE, -- Unique ticket identifier
  
  -- User info (for anonymous entries)
  contact_email VARCHAR(255),
  contact_name VARCHAR(255),
  
  -- Entry validation
  is_valid BOOLEAN DEFAULT TRUE,
  validation_notes TEXT,
  
  -- Prize tracking
  is_winner BOOLEAN DEFAULT FALSE,
  prize_tier INTEGER, -- 1st place, 2nd place, etc.
  prize_description TEXT,
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_claimed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one entry per user per raffle
  UNIQUE(survey_incentive_id, user_id)
);

-- Reward Fulfillment Tracking
-- ============================================================================
CREATE TABLE reward_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_incentive_id UUID REFERENCES survey_incentives(id) ON DELETE CASCADE,
  survey_response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  
  -- Reward details
  reward_type VARCHAR(50) NOT NULL, -- 'raffle_entry', 'credits', 'premium_access', 'discount_code'
  reward_data JSONB NOT NULL, -- Specific reward details
  
  -- Fulfillment status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'fulfilled', 'failed', 'cancelled'
  fulfillment_method VARCHAR(50), -- 'automatic', 'manual', 'email', 'stripe'
  
  -- Tracking
  fulfilled_at TIMESTAMP,
  fulfillment_details JSONB, -- Success/failure details
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP,
  
  -- Admin notes
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Discount Codes
-- ============================================================================
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Discount details
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Applicable products
  applies_to JSONB NOT NULL DEFAULT '["premium_subscription"]'::jsonb,
  
  -- Usage limits
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  
  -- Source tracking
  source_type VARCHAR(50), -- 'survey_incentive', 'promotion', 'manual'
  source_id UUID, -- Reference to survey_incentive or other source
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- User Discount Code Usage
-- ============================================================================
CREATE TABLE user_discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  
  -- Usage details
  used_at TIMESTAMP DEFAULT NOW(),
  order_id VARCHAR(255), -- Stripe payment intent ID or similar
  discount_amount DECIMAL(10,2),
  original_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  
  -- Source
  survey_response_id UUID REFERENCES survey_responses(id),
  
  -- Ensure one use per user per code (unless max_uses_per_user > 1)
  UNIQUE(user_id, discount_code_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Survey incentives
CREATE INDEX idx_survey_incentives_survey_id ON survey_incentives(survey_id);
CREATE INDEX idx_survey_incentives_enabled ON survey_incentives(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_survey_incentives_validity ON survey_incentives(valid_from, valid_until);

-- User credits
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_type ON user_credits(credit_type);
CREATE INDEX idx_user_credits_status ON user_credits(status);
CREATE INDEX idx_user_credits_source ON user_credits(source_type, source_id);
CREATE INDEX idx_user_credits_expiry ON user_credits(expires_at) WHERE expires_at IS NOT NULL;

-- Raffle entries
CREATE INDEX idx_raffle_entries_incentive_id ON raffle_entries(survey_incentive_id);
CREATE INDEX idx_raffle_entries_user_id ON raffle_entries(user_id);
CREATE INDEX idx_raffle_entries_response_id ON raffle_entries(survey_response_id);
CREATE INDEX idx_raffle_entries_ticket_code ON raffle_entries(ticket_code);
CREATE INDEX idx_raffle_entries_winners ON raffle_entries(is_winner) WHERE is_winner = TRUE;

-- Reward fulfillments
CREATE INDEX idx_reward_fulfillments_user_id ON reward_fulfillments(user_id);
CREATE INDEX idx_reward_fulfillments_status ON reward_fulfillments(status);
CREATE INDEX idx_reward_fulfillments_type ON reward_fulfillments(reward_type);
CREATE INDEX idx_reward_fulfillments_survey ON reward_fulfillments(survey_incentive_id);

-- Discount codes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_discount_codes_validity ON discount_codes(valid_from, valid_until);
CREATE INDEX idx_discount_codes_source ON discount_codes(source_type, source_id);

-- User discount usage
CREATE INDEX idx_user_discount_usage_user_id ON user_discount_usage(user_id);
CREATE INDEX idx_user_discount_usage_code_id ON user_discount_usage(discount_code_id);
CREATE INDEX idx_user_discount_usage_survey ON user_discount_usage(survey_response_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE survey_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discount_usage ENABLE ROW LEVEL SECURITY;

-- Survey incentives - Anyone can read active incentives, only admins can modify
CREATE POLICY "Public can view active survey incentives" ON survey_incentives
  FOR SELECT USING (enabled = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage survey incentives" ON survey_incentives
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User credits - Users can view their own credits, admins can view all
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON user_credits
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Raffle entries - Users can view their own entries, admins can view all
CREATE POLICY "Users can view own raffle entries" ON raffle_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own raffle entries" ON raffle_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all raffle entries" ON raffle_entries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Reward fulfillments - Users can view their own, admins can manage all
CREATE POLICY "Users can view own reward fulfillments" ON reward_fulfillments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reward fulfillments" ON reward_fulfillments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Discount codes - Public can read active codes, admins can manage
CREATE POLICY "Public can view active discount codes" ON discount_codes
  FOR SELECT USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage discount codes" ON discount_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User discount usage - Users can view their own usage, admins can view all
CREATE POLICY "Users can view own discount usage" ON user_discount_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own discount usage" ON user_discount_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all discount usage" ON user_discount_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate unique ticket codes
CREATE OR REPLACE FUNCTION generate_ticket_code(survey_incentive_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := 'TKT-' || UPPER(substring(md5(random()::text) from 1 for 8));
    
    SELECT EXISTS(
      SELECT 1 FROM raffle_entries 
      WHERE ticket_code = code
    ) INTO exists_check;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's total credits by type
CREATE OR REPLACE FUNCTION get_user_credits_balance(
  user_id_param UUID,
  credit_type_param VARCHAR(50) DEFAULT 'civics_points'
)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM user_credits 
     WHERE user_id = user_id_param 
       AND credit_type = credit_type_param 
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())
    ), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is eligible for incentive
CREATE OR REPLACE FUNCTION check_incentive_eligibility(
  user_id_param UUID,
  survey_incentive_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  incentive RECORD;
  existing_entry BOOLEAN;
  result JSONB;
BEGIN
  -- Get incentive details
  SELECT * INTO incentive
  FROM survey_incentives
  WHERE id = survey_incentive_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Incentive not found');
  END IF;
  
  -- Check if incentive is enabled and valid
  IF NOT incentive.enabled THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Incentive not enabled');
  END IF;
  
  IF incentive.valid_until IS NOT NULL AND incentive.valid_until < NOW() THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Incentive expired');
  END IF;
  
  IF incentive.valid_from > NOW() THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Incentive not yet active');
  END IF;
  
  -- Check if user already has entry for raffle incentives
  IF 'raffle' = ANY(SELECT jsonb_array_elements_text(incentive.incentive_types)) THEN
    SELECT EXISTS(
      SELECT 1 FROM raffle_entries 
      WHERE survey_incentive_id = survey_incentive_id_param 
        AND user_id = user_id_param
    ) INTO existing_entry;
    
    IF existing_entry THEN
      RETURN jsonb_build_object('eligible', false, 'reason', 'Already entered in raffle');
    END IF;
  END IF;
  
  -- Check max rewards limit
  IF incentive.max_rewards IS NOT NULL AND incentive.rewards_given >= incentive.max_rewards THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Maximum rewards reached');
  END IF;
  
  -- Check authentication requirement
  IF incentive.authenticated_only AND user_id_param IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Authentication required');
  END IF;
  
  RETURN jsonb_build_object('eligible', true, 'incentive', row_to_json(incentive));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EXAMPLE DATA FOR ALPHA SURVEY
-- ============================================================================

-- Example: Alpha Survey Incentive
-- This would be inserted when creating the alpha survey incentive
/*
INSERT INTO survey_incentives (
  survey_id, 
  enabled, 
  title, 
  description,
  incentive_types,
  raffle_config,
  premium_config,
  max_rewards,
  completion_required,
  authenticated_only
) VALUES (
  'alpha-survey-uuid', -- Replace with actual survey ID
  TRUE,
  'Complete our Alpha Survey!',
  'Get a raffle ticket for a $50 Amazon gift card PLUS premium CivicSense access!',
  '["raffle", "premium_access"]'::jsonb,
  '{
    "prize": "$50 Amazon Gift Card", 
    "total_winners": 5, 
    "draw_date": "2024-03-01T12:00:00Z",
    "description": "5 winners will be randomly selected"
  }'::jsonb,
  '{
    "type": "subscription", 
    "duration_months": 3, 
    "tier": "premium",
    "description": "3 months of CivicSense Premium access"
  }'::jsonb,
  NULL, -- No limit on total rewards
  TRUE, -- Must complete survey
  FALSE -- Allow anonymous entries with email
);
*/ 