-- Add Apple In-App Purchase support to CivicSense premium system
BEGIN;

-- Create Apple IAP transactions table
CREATE TABLE IF NOT EXISTS public.apple_iap_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  original_transaction_id TEXT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL,
  receipt_data TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'invalid', 'pending')),
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_apple_iap_transactions_user_id 
ON public.apple_iap_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_apple_iap_transactions_product_id 
ON public.apple_iap_transactions(product_id);

CREATE INDEX IF NOT EXISTS idx_apple_iap_transactions_transaction_id 
ON public.apple_iap_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_apple_iap_transactions_validation_status 
ON public.apple_iap_transactions(validation_status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apple_iap_transactions_updated_at
    BEFORE UPDATE ON public.apple_iap_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Update user_subscriptions table to support Apple IAP
-- Add Apple IAP as a payment provider option
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_payment_provider_check;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_payment_provider_check 
CHECK (payment_provider IN ('stripe', 'apple_iap', 'educational'));

-- RLS Policies for Apple IAP transactions
ALTER TABLE public.apple_iap_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "apple_iap_transactions_user_select" ON public.apple_iap_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own transactions
CREATE POLICY "apple_iap_transactions_user_insert" ON public.apple_iap_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own transactions
CREATE POLICY "apple_iap_transactions_user_update" ON public.apple_iap_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to check if user has valid Apple IAP for a product
CREATE OR REPLACE FUNCTION public.check_apple_iap_access(
    p_user_id UUID,
    p_product_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    transaction_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO transaction_count
    FROM public.apple_iap_transactions
    WHERE user_id = p_user_id
      AND product_id = p_product_id
      AND validation_status = 'valid';
    
    RETURN transaction_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the premium feature access function to include Apple IAP
CREATE OR REPLACE FUNCTION public.check_premium_feature_access(
    p_user_id UUID,
    p_feature_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_subscription RECORD;
    has_apple_iap BOOLEAN := FALSE;
BEGIN
    -- Check if user has any subscription
    SELECT *
    INTO user_subscription
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;
    
    -- If no subscription record, check for Apple IAP lifetime premium
    IF user_subscription IS NULL THEN
        SELECT public.check_apple_iap_access(p_user_id, 'civicsense_lifetime_premium')
        INTO has_apple_iap;
        
        -- If they have Apple IAP lifetime, grant premium features
        IF has_apple_iap THEN
            RETURN CASE 
                WHEN p_feature_name IN ('custom_decks', 'historical_progress', 'advanced_analytics', 'spaced_repetition', 'learning_insights', 'priority_support', 'offline_mode', 'export_data', 'npc_battle') THEN TRUE
                ELSE FALSE
            END;
        END IF;
        
        RETURN FALSE;
    END IF;
    
    -- Check if subscription is active
    IF user_subscription.subscription_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if subscription has expired (if end date exists)
    IF user_subscription.subscription_end_date IS NOT NULL 
       AND user_subscription.subscription_end_date < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Grant access based on subscription tier
    RETURN CASE user_subscription.subscription_tier
        WHEN 'premium' THEN 
            CASE 
                WHEN p_feature_name IN ('custom_decks', 'historical_progress', 'advanced_analytics', 'spaced_repetition', 'learning_insights', 'priority_support', 'offline_mode', 'export_data', 'npc_battle') THEN TRUE
                ELSE FALSE
            END
        WHEN 'pro' THEN TRUE -- Pro has access to all features
        ELSE FALSE -- Free tier
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user feature limits including Apple IAP
CREATE OR REPLACE FUNCTION public.get_user_feature_limits(
    p_user_id UUID
) RETURNS TABLE(
    tier TEXT,
    custom_decks_limit INTEGER,
    historical_months_limit INTEGER,
    advanced_analytics BOOLEAN,
    spaced_repetition BOOLEAN,
    learning_insights BOOLEAN,
    priority_support BOOLEAN,
    offline_mode BOOLEAN,
    export_data BOOLEAN
) AS $$
DECLARE
    user_subscription RECORD;
    has_apple_iap BOOLEAN := FALSE;
BEGIN
    -- Check for subscription
    SELECT *
    INTO user_subscription
    FROM public.user_subscriptions
    WHERE user_id = p_user_id;
    
    -- Check for Apple IAP if no subscription found
    IF user_subscription IS NULL THEN
        SELECT public.check_apple_iap_access(p_user_id, 'civicsense_lifetime_premium')
        INTO has_apple_iap;
        
        IF has_apple_iap THEN
            -- Return premium limits for Apple IAP users
            RETURN QUERY SELECT 
                'premium'::TEXT as tier,
                NULL::INTEGER as custom_decks_limit,
                NULL::INTEGER as historical_months_limit,
                TRUE as advanced_analytics,
                TRUE as spaced_repetition,
                TRUE as learning_insights,
                TRUE as priority_support,
                TRUE as offline_mode,
                TRUE as export_data;
            RETURN;
        END IF;
        
        -- Return free tier limits
        RETURN QUERY SELECT 
            'free'::TEXT as tier,
            0 as custom_decks_limit,
            1 as historical_months_limit,
            FALSE as advanced_analytics,
            FALSE as spaced_repetition,
            FALSE as learning_insights,
            FALSE as priority_support,
            FALSE as offline_mode,
            FALSE as export_data;
        RETURN;
    END IF;
    
    -- Check if subscription is active
    IF user_subscription.subscription_status != 'active' 
       OR (user_subscription.subscription_end_date IS NOT NULL 
           AND user_subscription.subscription_end_date < NOW()) THEN
        -- Return free tier limits for inactive subscriptions
        RETURN QUERY SELECT 
            'free'::TEXT as tier,
            0 as custom_decks_limit,
            1 as historical_months_limit,
            FALSE as advanced_analytics,
            FALSE as spaced_repetition,
            FALSE as learning_insights,
            FALSE as priority_support,
            FALSE as offline_mode,
            FALSE as export_data;
        RETURN;
    END IF;
    
    -- Return limits based on subscription tier
    CASE user_subscription.subscription_tier
        WHEN 'premium' THEN
            RETURN QUERY SELECT 
                'premium'::TEXT as tier,
                NULL::INTEGER as custom_decks_limit,
                NULL::INTEGER as historical_months_limit,
                TRUE as advanced_analytics,
                TRUE as spaced_repetition,
                TRUE as learning_insights,
                TRUE as priority_support,
                TRUE as offline_mode,
                TRUE as export_data;
        WHEN 'pro' THEN
            RETURN QUERY SELECT 
                'pro'::TEXT as tier,
                NULL::INTEGER as custom_decks_limit,
                NULL::INTEGER as historical_months_limit,
                TRUE as advanced_analytics,
                TRUE as spaced_repetition,
                TRUE as learning_insights,
                TRUE as priority_support,
                TRUE as offline_mode,
                TRUE as export_data;
        ELSE
            RETURN QUERY SELECT 
                'free'::TEXT as tier,
                0 as custom_decks_limit,
                1 as historical_months_limit,
                FALSE as advanced_analytics,
                FALSE as spaced_repetition,
                FALSE as learning_insights,
                FALSE as priority_support,
                FALSE as offline_mode,
                FALSE as export_data;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 