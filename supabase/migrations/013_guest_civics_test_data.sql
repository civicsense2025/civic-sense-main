-- Migration to store guest civics test data for later conversion
-- This allows us to track guest test results and associate them with users when they sign up

BEGIN;

-- Table to store guest civics test results
CREATE TABLE IF NOT EXISTS guest_civics_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_token TEXT NOT NULL,
    session_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    test_type TEXT NOT NULL CHECK (test_type IN ('quick', 'full')),
    answers JSONB DEFAULT '{}',
    category_breakdown JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    
    -- Indexes for performance
    CONSTRAINT unique_guest_session UNIQUE (guest_token, session_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_guest_civics_test_guest_token ON guest_civics_test_results(guest_token);
CREATE INDEX IF NOT EXISTS idx_guest_civics_test_ip ON guest_civics_test_results(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_civics_test_completed_at ON guest_civics_test_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_guest_civics_test_converted_user ON guest_civics_test_results(converted_user_id);

-- RLS policies
ALTER TABLE guest_civics_test_results ENABLE ROW LEVEL SECURITY;

-- Allow guests to insert their own results
CREATE POLICY "Allow guest test result insertion" ON guest_civics_test_results
    FOR INSERT WITH CHECK (true);

-- Allow reading guest results by token (for conversion)
CREATE POLICY "Allow reading by guest token" ON guest_civics_test_results
    FOR SELECT USING (true);

-- Allow users to read their converted results
CREATE POLICY "Allow users to read converted results" ON guest_civics_test_results
    FOR SELECT USING (converted_user_id = auth.uid());

-- Allow updating conversion data
CREATE POLICY "Allow conversion updates" ON guest_civics_test_results
    FOR UPDATE USING (true);

-- Function to convert guest results to user account
CREATE OR REPLACE FUNCTION convert_guest_civics_results(
    p_guest_token TEXT,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    conversion_count INTEGER;
BEGIN
    -- Update guest results to associate with user
    UPDATE guest_civics_test_results 
    SET 
        converted_user_id = p_user_id,
        converted_at = NOW()
    WHERE 
        guest_token = p_guest_token 
        AND converted_user_id IS NULL;
    
    GET DIAGNOSTICS conversion_count = ROW_COUNT;
    
    -- Optionally, copy the best result to user_assessments table
    INSERT INTO user_assessments (
        user_id,
        assessment_type,
        score,
        level,
        category_breakdown,
        answers,
        mode,
        completed_at
    )
    SELECT 
        p_user_id,
        'civics-test',
        score,
        level,
        category_breakdown,
        answers,
        test_type,
        completed_at
    FROM guest_civics_test_results
    WHERE 
        guest_token = p_guest_token
        AND converted_user_id = p_user_id
    ORDER BY score DESC, completed_at DESC
    LIMIT 1
    ON CONFLICT (user_id, assessment_type, mode) DO UPDATE SET
        score = EXCLUDED.score,
        level = EXCLUDED.level,
        category_breakdown = EXCLUDED.category_breakdown,
        answers = EXCLUDED.answers,
        completed_at = EXCLUDED.completed_at;
    
    RETURN conversion_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get guest test summary
CREATE OR REPLACE FUNCTION get_guest_test_summary(p_guest_token TEXT)
RETURNS TABLE (
    total_tests INTEGER,
    best_score INTEGER,
    latest_level TEXT,
    first_test_date TIMESTAMPTZ,
    latest_test_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tests,
        MAX(score)::INTEGER as best_score,
        (SELECT level FROM guest_civics_test_results 
         WHERE guest_token = p_guest_token 
         ORDER BY completed_at DESC LIMIT 1) as latest_level,
        MIN(completed_at) as first_test_date,
        MAX(completed_at) as latest_test_date
    FROM guest_civics_test_results
    WHERE guest_token = p_guest_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 