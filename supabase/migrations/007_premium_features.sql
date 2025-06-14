-- Premium Features and Subscription System Migration
-- Adds user subscription tiers and premium feature gates

-- 1. USER SUBSCRIPTION TIERS
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'premium', 'pro'
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trial'
    subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    payment_provider VARCHAR(50), -- 'stripe', 'paypal', 'apple', 'google'
    external_subscription_id VARCHAR(200), -- Provider's subscription ID
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    billing_cycle VARCHAR(20), -- 'monthly', 'yearly'
    amount_cents INTEGER, -- Subscription amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 2. PREMIUM FEATURE USAGE TRACKING
CREATE TABLE user_feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL, -- 'custom_decks', 'historical_progress', 'advanced_analytics', 'spaced_repetition'
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    monthly_limit INTEGER, -- NULL for unlimited
    reset_date DATE, -- When monthly usage resets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, feature_name)
);

-- 3. HISTORICAL PROGRESS SNAPSHOTS (Premium Feature)
CREATE TABLE user_progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'milestone'
    
    -- Progress metrics at time of snapshot
    total_quizzes_completed INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    accuracy_percentage REAL DEFAULT 0,
    
    -- Category performance
    category_stats JSONB DEFAULT '{}', -- { "Government": { "attempted": 50, "correct": 40, "skill_level": 75 } }
    
    -- Weekly/monthly aggregates
    period_quizzes_completed INTEGER DEFAULT 0,
    period_questions_answered INTEGER DEFAULT 0,
    period_correct_answers INTEGER DEFAULT 0,
    period_xp_gained INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, snapshot_date, snapshot_type)
);

-- 4. ENHANCED QUIZ ANALYTICS (Premium Feature)
CREATE TABLE user_quiz_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_attempt_id UUID REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) REFERENCES question_topics(topic_id),
    
    -- Detailed timing analytics
    total_time_seconds INTEGER NOT NULL,
    average_time_per_question REAL,
    fastest_question_time INTEGER,
    slowest_question_time INTEGER,
    time_distribution JSONB, -- Array of time spent per question
    
    -- Performance analytics
    difficulty_performance JSONB, -- Performance by difficulty level
    category_performance JSONB, -- Performance by category
    question_type_performance JSONB, -- Performance by question type
    
    -- Learning patterns
    improvement_trend REAL, -- Positive/negative trend in recent performance
    consistency_score REAL, -- How consistent performance is
    optimal_study_time VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
    
    -- Engagement metrics
    hint_usage_rate REAL, -- Percentage of questions where hints were used
    completion_rate REAL, -- Percentage of started quizzes completed
    retry_rate REAL, -- How often user retries questions
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PREMIUM LEARNING INSIGHTS (Premium Feature)
CREATE TABLE user_learning_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'strength', 'weakness', 'recommendation', 'milestone'
    insight_category VARCHAR(100), -- Category this insight relates to
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    action_items JSONB DEFAULT '[]', -- Array of suggested actions
    
    confidence_score REAL DEFAULT 0.0, -- 0-1 confidence in this insight
    priority_level INTEGER DEFAULT 1, -- 1-5 priority level
    
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    valid_until DATE, -- When this insight expires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SUBSCRIPTION TIER LIMITS
CREATE TABLE subscription_tier_limits (
    tier VARCHAR(20) PRIMARY KEY,
    custom_decks_limit INTEGER, -- NULL for unlimited
    historical_months_limit INTEGER, -- How many months of history to keep
    advanced_analytics BOOLEAN DEFAULT false,
    spaced_repetition BOOLEAN DEFAULT false,
    learning_insights BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    offline_mode BOOLEAN DEFAULT false,
    export_data BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription tiers
INSERT INTO subscription_tier_limits (tier, custom_decks_limit, historical_months_limit, advanced_analytics, spaced_repetition, learning_insights, priority_support, offline_mode, export_data) VALUES
('free', 0, 1, false, false, false, false, false, false),
('premium', 10, 12, true, true, true, false, true, true),
('pro', NULL, NULL, true, true, true, true, true, true);

-- 7. PREMIUM FEATURE GATES FUNCTIONS
CREATE OR REPLACE FUNCTION check_premium_feature_access(
    p_user_id UUID,
    p_feature_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR(20);
    feature_allowed BOOLEAN := false;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM user_subscriptions
    WHERE user_id = p_user_id
    AND subscription_status = 'active'
    AND (subscription_end_date IS NULL OR subscription_end_date > NOW());
    
    -- Default to free tier if no subscription found
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;
    
    -- Check feature access based on tier and feature
    CASE p_feature_name
        WHEN 'custom_decks' THEN
            SELECT (custom_decks_limit > 0 OR custom_decks_limit IS NULL) INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = user_tier;
        WHEN 'historical_progress' THEN
            SELECT (historical_months_limit > 1) INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = user_tier;
        WHEN 'advanced_analytics' THEN
            SELECT advanced_analytics INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = user_tier;
        WHEN 'spaced_repetition' THEN
            SELECT spaced_repetition INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = user_tier;
        WHEN 'learning_insights' THEN
            SELECT learning_insights INTO feature_allowed
            FROM subscription_tier_limits WHERE tier = user_tier;
        ELSE
            feature_allowed := false;
    END CASE;
    
    RETURN COALESCE(feature_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCTION TO GET USER'S FEATURE LIMITS
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
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM user_subscriptions
    WHERE user_id = p_user_id
    AND subscription_status = 'active'
    AND (subscription_end_date IS NULL OR subscription_end_date > NOW());
    
    -- Default to free tier if no subscription found
    IF user_tier IS NULL THEN
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
    WHERE stl.tier = user_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNCTION TO TRACK FEATURE USAGE
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_user_id UUID,
    p_feature_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    monthly_limit INTEGER;
    has_access BOOLEAN;
BEGIN
    -- Check if user has access to this feature
    SELECT check_premium_feature_access(p_user_id, p_feature_name) INTO has_access;
    
    IF NOT has_access THEN
        RETURN false;
    END IF;
    
    -- Get or create feature usage record
    INSERT INTO user_feature_usage (user_id, feature_name, usage_count, last_used_at, reset_date)
    VALUES (p_user_id, p_feature_name, 1, NOW(), DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
    ON CONFLICT (user_id, feature_name) DO UPDATE SET
        usage_count = CASE 
            WHEN user_feature_usage.reset_date <= CURRENT_DATE THEN 1
            ELSE user_feature_usage.usage_count + 1
        END,
        last_used_at = NOW(),
        reset_date = CASE
            WHEN user_feature_usage.reset_date <= CURRENT_DATE THEN DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
            ELSE user_feature_usage.reset_date
        END;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(subscription_tier);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(subscription_end_date) WHERE subscription_end_date IS NOT NULL;

CREATE INDEX idx_user_feature_usage_user_feature ON user_feature_usage(user_id, feature_name);
CREATE INDEX idx_user_feature_usage_reset_date ON user_feature_usage(reset_date);

CREATE INDEX idx_user_progress_history_user_date ON user_progress_history(user_id, snapshot_date);
CREATE INDEX idx_user_progress_history_type ON user_progress_history(snapshot_type);

CREATE INDEX idx_user_quiz_analytics_user_id ON user_quiz_analytics(user_id);
CREATE INDEX idx_user_quiz_analytics_topic_id ON user_quiz_analytics(topic_id);
CREATE INDEX idx_user_quiz_analytics_created_at ON user_quiz_analytics(created_at);

CREATE INDEX idx_user_learning_insights_user_id ON user_learning_insights(user_id);
CREATE INDEX idx_user_learning_insights_type ON user_learning_insights(insight_type);
CREATE INDEX idx_user_learning_insights_unread ON user_learning_insights(user_id, is_read) WHERE is_read = false;

-- 11. ADD TRIGGERS FOR UPDATED_AT COLUMNS
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feature_usage_updated_at 
    BEFORE UPDATE ON user_feature_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_insights_updated_at 
    BEFORE UPDATE ON user_learning_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. CREATE DEFAULT SUBSCRIPTIONS FOR EXISTING USERS
INSERT INTO user_subscriptions (user_id, subscription_tier, subscription_status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);

-- 13. ROW LEVEL SECURITY POLICIES
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_insights ENABLE ROW LEVEL SECURITY;

-- Users can only access their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feature usage" ON user_feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress history" ON user_progress_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz analytics" ON user_quiz_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning insights" ON user_learning_insights
    FOR ALL USING (auth.uid() = user_id);

-- 14. ENHANCED VIEW FOR USER COMPREHENSIVE STATS WITH PREMIUM FEATURES
CREATE OR REPLACE VIEW user_comprehensive_stats_premium AS
SELECT 
    up.user_id,
    up.current_streak,
    up.longest_streak,
    up.total_quizzes_completed,
    up.total_questions_answered,
    up.total_correct_answers,
    up.total_xp,
    up.current_level,
    up.weekly_goal,
    up.weekly_completed,
    up.preferred_categories,
    ROUND(CAST(up.total_correct_answers AS DECIMAL) / NULLIF(up.total_questions_answered, 0) * 100, 2) as accuracy_percentage,
    
    -- Category mastery stats
    (SELECT COUNT(*) FROM user_category_skills ucs WHERE ucs.user_id = up.user_id AND ucs.mastery_level IN ('advanced', 'expert')) as categories_mastered,
    (SELECT COUNT(DISTINCT category) FROM user_category_skills ucs WHERE ucs.user_id = up.user_id) as categories_attempted,
    
    -- Active goals
    (SELECT COUNT(*) FROM user_learning_goals ulg WHERE ulg.user_id = up.user_id AND ulg.is_active = true) as active_goals,
    
    -- Custom decks (premium feature)
    (SELECT COUNT(*) FROM user_custom_decks ucd WHERE ucd.user_id = up.user_id AND ucd.is_active = true) as custom_decks_count,
    
    -- Recent achievements
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = up.user_id AND ua.earned_at > NOW() - INTERVAL '7 days') as achievements_this_week,
    
    -- Subscription info
    us.subscription_tier,
    us.subscription_status,
    us.subscription_end_date,
    
    -- Premium feature access
    check_premium_feature_access(up.user_id, 'custom_decks') as has_custom_decks_access,
    check_premium_feature_access(up.user_id, 'historical_progress') as has_historical_progress_access,
    check_premium_feature_access(up.user_id, 'advanced_analytics') as has_advanced_analytics_access,
    check_premium_feature_access(up.user_id, 'spaced_repetition') as has_spaced_repetition_access,
    check_premium_feature_access(up.user_id, 'learning_insights') as has_learning_insights_access

FROM user_progress up
LEFT JOIN user_subscriptions us ON us.user_id = up.user_id;

-- 15. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription tiers and payment status';
COMMENT ON TABLE user_feature_usage IS 'Tracks usage of premium features for rate limiting';
COMMENT ON TABLE user_progress_history IS 'Historical snapshots of user progress (premium feature)';
COMMENT ON TABLE user_quiz_analytics IS 'Detailed quiz performance analytics (premium feature)';
COMMENT ON TABLE user_learning_insights IS 'AI-generated learning insights and recommendations (premium feature)';
COMMENT ON TABLE subscription_tier_limits IS 'Defines what features are available for each subscription tier';

COMMENT ON FUNCTION check_premium_feature_access(UUID, VARCHAR) IS 'Checks if a user has access to a specific premium feature';
COMMENT ON FUNCTION get_user_feature_limits(UUID) IS 'Returns all feature limits for a user based on their subscription tier';
COMMENT ON FUNCTION track_feature_usage(UUID, VARCHAR) IS 'Tracks usage of a premium feature and enforces limits'; 