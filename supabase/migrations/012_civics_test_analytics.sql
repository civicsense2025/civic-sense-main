-- Create civics test analytics table for tracking lead magnet performance
CREATE TABLE IF NOT EXISTS civics_test_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('started', 'completed', 'signup_after_test', 'abandoned')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_civics_test_analytics_event_type ON civics_test_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_civics_test_analytics_timestamp ON civics_test_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_civics_test_analytics_user_id ON civics_test_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_civics_test_analytics_session_id ON civics_test_analytics(session_id);

-- Add RLS policies
ALTER TABLE civics_test_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public events)
CREATE POLICY "Allow anonymous analytics inserts" ON civics_test_analytics
    FOR INSERT 
    WITH CHECK (true);

-- Only allow authenticated users to read their own analytics
CREATE POLICY "Users can read own analytics" ON civics_test_analytics
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow service role to read all analytics (for admin dashboard)
CREATE POLICY "Service role can read all analytics" ON civics_test_analytics
    FOR SELECT 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE civics_test_analytics IS 'Analytics tracking for the civics test lead magnet to measure conversion rates and user engagement';
COMMENT ON COLUMN civics_test_analytics.event_type IS 'Type of event: started, completed, signup_after_test, abandoned';
COMMENT ON COLUMN civics_test_analytics.score IS 'Test score (0-100) for completed tests';
COMMENT ON COLUMN civics_test_analytics.session_id IS 'Unique session identifier for tracking user journey';
COMMENT ON COLUMN civics_test_analytics.metadata IS 'Additional event data like test_type, level, etc.'; 