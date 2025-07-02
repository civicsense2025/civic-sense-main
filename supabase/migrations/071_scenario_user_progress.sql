-- =============================================================================
-- SCENARIO SYSTEM USER PROGRESS - PHASE 2
-- =============================================================================
-- This migration creates user progress tracking tables that extend existing
-- patterns from the quiz system for seamless integration.

BEGIN;

-- =============================================================================
-- STEP 1: CREATE USER PROGRESS TABLES (EXTEND EXISTING PATTERNS)
-- =============================================================================

-- Extend existing user_quiz_attempts pattern for scenarios
CREATE TABLE IF NOT EXISTS user_scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Context (same pattern as user_quiz_attempts)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_token VARCHAR(255), -- support for guest users
    
    -- Scenario Context
    scenario_id UUID REFERENCES scenarios(id),
    character_id UUID REFERENCES scenario_characters(id),
    
    -- Progress Tracking (similar to quiz attempts)
    current_situation_id UUID REFERENCES scenario_situations(id),
    decisions_made JSONB DEFAULT '[]', -- array of decision IDs and timestamps
    current_resources JSONB DEFAULT '{}', -- current resource levels
    
    -- Completion Data
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    final_outcome VARCHAR(100), -- which ending they reached
    
    -- Analytics (reuse existing pattern)
    total_time_spent INTERVAL,
    completion_percentage DECIMAL(5,2),
    
    -- Educational Assessment
    learning_objectives_met TEXT[],
    concepts_demonstrated TEXT[],
    democratic_values_score INTEGER CHECK (democratic_values_score BETWEEN -10 AND 10),
    
    -- Metadata
    session_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend existing user_question_responses pattern for scenario decisions
CREATE TABLE IF NOT EXISTS user_scenario_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to attempt (same pattern as user_question_responses)
    attempt_id UUID REFERENCES user_scenario_attempts(id) ON DELETE CASCADE,
    
    -- Decision Context
    situation_id UUID REFERENCES scenario_situations(id),
    decision_id UUID REFERENCES scenario_decisions(id),
    
    -- Timing Data (same pattern as existing responses)
    decision_time_seconds INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context
    resource_state_before JSONB DEFAULT '{}',
    resource_state_after JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- User scenario attempts indexes
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_user ON user_scenario_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_guest ON user_scenario_attempts(guest_token, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_scenario ON user_scenario_attempts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_character ON user_scenario_attempts(character_id);
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_completion ON user_scenario_attempts(completed_at DESC) WHERE completed_at IS NOT NULL;

-- User scenario decisions indexes
CREATE INDEX IF NOT EXISTS idx_user_scenario_decisions_attempt ON user_scenario_decisions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_scenario_decisions_situation ON user_scenario_decisions(situation_id);
CREATE INDEX IF NOT EXISTS idx_user_scenario_decisions_timestamp ON user_scenario_decisions(timestamp);

-- =============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on user progress tables
ALTER TABLE user_scenario_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scenario_decisions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: CREATE RLS POLICIES (USER-SCOPED)
-- =============================================================================

-- User scenario attempts: Users can only see their own attempts
CREATE POLICY "user_scenario_attempts_own" ON user_scenario_attempts
    FOR ALL USING (
        auth.uid() = user_id OR
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- User scenario decisions: Users can only see decisions from their attempts
CREATE POLICY "user_scenario_decisions_own" ON user_scenario_decisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_scenario_attempts 
            WHERE id = user_scenario_decisions.attempt_id 
            AND (
                user_id = auth.uid() OR
                (auth.uid() IS NULL AND guest_token IS NOT NULL)
            )
        ) OR
        auth.role() = 'service_role'
    );

-- Admin policies for analytics and management
CREATE POLICY "user_scenario_attempts_admin_read" ON user_scenario_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "user_scenario_decisions_admin_read" ON user_scenario_decisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        ) OR
        auth.role() = 'service_role'
    );

-- =============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate scenario completion percentage
CREATE OR REPLACE FUNCTION calculate_scenario_completion(
    p_scenario_id UUID,
    p_decisions_made JSONB
) RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_situations INTEGER;
    completed_situations INTEGER;
BEGIN
    -- Get total number of situations in scenario
    SELECT COUNT(*) INTO total_situations
    FROM scenario_situations
    WHERE scenario_id = p_scenario_id;
    
    -- Count completed situations based on decisions made
    SELECT COUNT(DISTINCT situation_id) INTO completed_situations
    FROM user_scenario_decisions usd
    JOIN scenario_decisions sd ON sd.id = usd.decision_id
    WHERE usd.attempt_id IN (
        SELECT id FROM user_scenario_attempts 
        WHERE scenario_id = p_scenario_id
    );
    
    -- Return percentage
    IF total_situations > 0 THEN
        RETURN (completed_situations::DECIMAL / total_situations::DECIMAL) * 100;
    ELSE
        RETURN 0;
    END IF;
END;
$$;

-- Function to get user's scenario progress summary
CREATE OR REPLACE FUNCTION get_user_scenario_progress(p_user_id UUID)
RETURNS TABLE (
    scenario_id UUID,
    scenario_title VARCHAR(200),
    character_name VARCHAR(100),
    completion_percentage DECIMAL(5,2),
    last_played TIMESTAMPTZ,
    is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.scenario_title,
        sc.character_name,
        COALESCE(usa.completion_percentage, 0),
        usa.created_at,
        (usa.completed_at IS NOT NULL)
    FROM scenarios s
    LEFT JOIN user_scenario_attempts usa ON usa.scenario_id = s.id AND usa.user_id = p_user_id
    LEFT JOIN scenario_characters sc ON sc.id = usa.character_id
    WHERE s.is_active = true
    ORDER BY usa.created_at DESC NULLS LAST, s.scenario_title;
END;
$$;

-- =============================================================================
-- STEP 6: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCENARIO USER PROGRESS TABLES CREATED ===';
    RAISE NOTICE 'User progress tables created:';
    RAISE NOTICE '  - user_scenario_attempts (extends user_quiz_attempts pattern)';
    RAISE NOTICE '  - user_scenario_decisions (extends user_question_responses pattern)';
    RAISE NOTICE 'Helper functions created:';
    RAISE NOTICE '  - calculate_scenario_completion()';
    RAISE NOTICE '  - get_user_scenario_progress()';
    RAISE NOTICE 'RLS policies follow existing user-scoped patterns';
    RAISE NOTICE 'Ready for Phase 3: Multiplayer Integration';
    RAISE NOTICE '================================================';
END $$;

COMMIT; 