-- Migration: Educational Premium Access Support
-- Adds support for automatic premium access for .edu email addresses

-- 1. Add educational billing cycle to user_subscriptions if not already present
DO $$ 
BEGIN
    -- Check if we need to add any constraints or modify existing table
    -- Most changes should be compatible with existing schema
    
    -- Add a comment to track this feature
    COMMENT ON COLUMN user_subscriptions.billing_cycle IS 'Billing cycle: monthly, yearly, lifetime, educational';
    COMMENT ON COLUMN user_subscriptions.payment_provider IS 'Payment provider: stripe, paypal, apple, google, educational';
    
END $$;

-- 2. Add educational tier to subscription_tier_limits if not already present
INSERT INTO subscription_tier_limits (
    tier, 
    custom_decks_limit, 
    historical_months_limit, 
    advanced_analytics, 
    spaced_repetition, 
    learning_insights, 
    priority_support, 
    offline_mode, 
    export_data
) VALUES (
    'educational', 
    NULL, -- unlimited
    NULL, -- unlimited  
    true, 
    true, 
    true, 
    true, 
    true, 
    true
) ON CONFLICT (tier) DO NOTHING;

-- 3. Update the premium feature access function to support educational subscriptions
CREATE OR REPLACE FUNCTION check_premium_feature_access(
    p_user_id UUID,
    p_feature_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR(20);
    feature_allowed BOOLEAN := false;
    subscription_record user_subscriptions%ROWTYPE;
BEGIN
    -- Get user's subscription record
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    -- Check if subscription is active
    IF subscription_record.subscription_status = 'active' AND 
       (subscription_record.subscription_end_date IS NULL OR subscription_record.subscription_end_date > NOW()) THEN
        user_tier := subscription_record.subscription_tier;
        
        -- Special handling for educational subscriptions
        IF subscription_record.payment_provider = 'educational' OR 
           subscription_record.billing_cycle = 'educational' THEN
            -- Educational users get premium access
            user_tier := 'premium';
        END IF;
    ELSE
        -- Default to free tier if no active subscription found
        user_tier := 'free';
    END IF;
    
    -- Check feature access based on tier and feature
    CASE p_feature_name
        WHEN 'custom_decks' THEN
            SELECT (custom_decks_limit > 0 OR custom_decks_limit IS NULL) INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'historical_progress' THEN
            SELECT (historical_months_limit > 1 OR historical_months_limit IS NULL) INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'advanced_analytics' THEN
            SELECT advanced_analytics INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'spaced_repetition' THEN
            SELECT spaced_repetition INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'learning_insights' THEN
            SELECT learning_insights INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'priority_support' THEN
            SELECT priority_support INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'offline_mode' THEN
            SELECT offline_mode INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        WHEN 'export_data' THEN
            SELECT export_data INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = COALESCE(user_tier, 'free');
        ELSE
            feature_allowed := false;
    END CASE;
    
    RETURN COALESCE(feature_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_user_feature_limits function to handle educational subscriptions
CREATE OR REPLACE FUNCTION get_user_feature_limits(p_user_id UUID)
RETURNS TABLE(
    tier VARCHAR(20),
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
    user_tier VARCHAR(20);
    subscription_record user_subscriptions%ROWTYPE;
BEGIN
    -- Get user's subscription record
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    -- Determine effective tier
    IF subscription_record.subscription_status = 'active' AND 
       (subscription_record.subscription_end_date IS NULL OR subscription_record.subscription_end_date > NOW()) THEN
        user_tier := subscription_record.subscription_tier;
        
        -- Special handling for educational subscriptions
        IF subscription_record.payment_provider = 'educational' OR 
           subscription_record.billing_cycle = 'educational' THEN
            -- Educational users get premium-level limits
            user_tier := 'premium';
        END IF;
    ELSE
        -- Default to free tier if no active subscription found
        user_tier := 'free';
    END IF;
    
    -- Return the limits for this tier
    RETURN QUERY
    SELECT 
        stl.tier,
        stl.custom_decks_limit,
        stl.historical_months_limit,
        stl.advanced_analytics,
        stl.spaced_repetition,
        stl.learning_insights,
        stl.priority_support,
        stl.offline_mode,
        stl.export_data
    FROM subscription_tier_limits stl
    WHERE stl.tier = COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to check if email is educational
CREATE OR REPLACE FUNCTION is_educational_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if email ends with .edu
    RETURN email_address ~ '.*\.edu$';
END;
$$ LANGUAGE plpgsql IMMUTABLE; 