-- =========================================================
-- Civics Test Analytics System
-- =========================================================
-- Tables and functions to track civics test engagement, completions, and conversions

BEGIN;

-- 1. Main analytics tracking table
CREATE TABLE IF NOT EXISTS civics_test_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('started', 'completed', 'signup_after_test', 'abandoned')),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_token TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure we can track conversion funnel
    INDEX (session_id),
    INDEX (user_id),
    INDEX (guest_token),
    INDEX (event_type),
    INDEX (timestamp)
);

-- 2. Guest test results table (already exists but ensure it's created)
CREATE TABLE IF NOT EXISTS guest_civics_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_token TEXT NOT NULL,
    session_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    test_type TEXT NOT NULL CHECK (test_type IN ('quick', 'full')),
    answers JSONB DEFAULT '{}',
    category_breakdown JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    
    INDEX (guest_token),
    INDEX (session_id),
    INDEX (converted_to_user_id),
    INDEX (completed_at)
);

-- 3. Function to get guest test summary
CREATE OR REPLACE FUNCTION get_guest_test_summary(p_guest_token TEXT)
RETURNS TABLE (
    total_tests INTEGER,
    best_score INTEGER,
    latest_score INTEGER,
    average_score NUMERIC,
    tests_taken JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tests,
        MAX(gtr.score)::INTEGER as best_score,
        (SELECT score FROM guest_civics_test_results WHERE guest_token = p_guest_token ORDER BY completed_at DESC LIMIT 1)::INTEGER as latest_score,
        ROUND(AVG(gtr.score), 1) as average_score,
        jsonb_agg(
            jsonb_build_object(
                'score', gtr.score,
                'level', gtr.level,
                'test_type', gtr.test_type,
                'completed_at', gtr.completed_at
            ) ORDER BY gtr.completed_at DESC
        ) as tests_taken
    FROM guest_civics_test_results gtr
    WHERE gtr.guest_token = p_guest_token
    AND gtr.converted_to_user_id IS NULL;
END;
$$;

-- 4. Function to convert guest results to user account
CREATE OR REPLACE FUNCTION convert_guest_civics_results(
    p_guest_token TEXT,
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    converted_count INTEGER;
BEGIN
    -- Update guest results to link to user account
    UPDATE guest_civics_test_results 
    SET 
        converted_to_user_id = p_user_id,
        converted_at = NOW()
    WHERE guest_token = p_guest_token
    AND converted_to_user_id IS NULL;
    
    GET DIAGNOSTICS converted_count = ROW_COUNT;
    
    -- Update analytics events to link to user account
    UPDATE civics_test_analytics
    SET user_id = p_user_id
    WHERE session_id IN (
        SELECT DISTINCT session_id 
        FROM guest_civics_test_results 
        WHERE guest_token = p_guest_token
    )
    AND user_id IS NULL;
    
    RETURN converted_count;
END;
$$;

-- 5. View for analytics dashboard
CREATE OR REPLACE VIEW civics_test_metrics AS
SELECT 
    DATE_TRUNC('day', timestamp) as day,
    COUNT(*) FILTER (WHERE event_type = 'started') as starts,
    COUNT(*) FILTER (WHERE event_type = 'completed') as completions,
    COUNT(*) FILTER (WHERE event_type = 'signup_after_test') as signups,
    COUNT(*) FILTER (WHERE event_type = 'abandoned') as abandonments,
    AVG(score) FILTER (WHERE event_type = 'completed' AND score IS NOT NULL) as avg_score,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
    COUNT(DISTINCT guest_token) FILTER (WHERE guest_token IS NOT NULL) as unique_guests
FROM civics_test_analytics
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;

-- 6. RLS policies for security
ALTER TABLE civics_test_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_civics_test_results ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (for admin dashboard)
CREATE POLICY "Allow read for authenticated users" ON civics_test_analytics
    FOR SELECT TO authenticated
    USING (true);

-- Allow insert for all (needed for guest tracking)
CREATE POLICY "Allow insert for all" ON civics_test_analytics
    FOR INSERT 
    WITH CHECK (true);

-- Guest results policies
CREATE POLICY "Allow read for authenticated users" ON guest_civics_test_results
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow insert for all" ON guest_civics_test_results
    FOR INSERT 
    WITH CHECK (true);

-- Allow update for conversion
CREATE POLICY "Allow update for conversion" ON guest_civics_test_results
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_civics_analytics_event_timestamp 
    ON civics_test_analytics(event_type, timestamp DESC);
    
CREATE INDEX IF NOT EXISTS idx_civics_analytics_user_events 
    ON civics_test_analytics(user_id, event_type, timestamp DESC);
    
CREATE INDEX IF NOT EXISTS idx_guest_results_token_completed 
    ON guest_civics_test_results(guest_token, completed_at DESC);

-- 8. Comments for documentation
COMMENT ON TABLE civics_test_analytics IS 'Analytics tracking for civics test engagement and conversion funnel';
COMMENT ON TABLE guest_civics_test_results IS 'Detailed results for guest users taking civics tests';
COMMENT ON FUNCTION get_guest_test_summary IS 'Get summary statistics for a guest user by token';
COMMENT ON FUNCTION convert_guest_civics_results IS 'Convert guest test results to a registered user account';
COMMENT ON VIEW civics_test_metrics IS 'Daily aggregated metrics for civics test performance';

-- 9. Sample data for testing (optional - can be removed in production)
-- INSERT INTO civics_test_analytics (event_type, session_id, score, metadata) VALUES
-- ('started', 'test-session-1', NULL, '{"test_type": "quick"}'),
-- ('completed', 'test-session-1', 75, '{"test_type": "quick", "questions": 8}');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON civics_test_analytics TO anon, authenticated;
GRANT SELECT, INSERT ON guest_civics_test_results TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_guest_test_summary(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION convert_guest_civics_results(TEXT, UUID) TO authenticated;

COMMIT;
