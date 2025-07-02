-- =============================================================================
-- FIX SCENARIO ATTEMPTS SCHEMA - MISSING COLUMNS
-- =============================================================================
-- This migration fixes missing columns in user_scenario_attempts table
-- that are referenced in the API but don't exist in the schema.

BEGIN;

-- =============================================================================
-- STEP 1: ADD MISSING COLUMNS TO user_scenario_attempts
-- =============================================================================

-- Add attempt_number column (referenced in API but missing from schema)
ALTER TABLE user_scenario_attempts 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1;

-- Add total_time_spent_seconds column (API expects this format)
ALTER TABLE user_scenario_attempts 
ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER;

-- Add final_resources column (API expects this format)
ALTER TABLE user_scenario_attempts 
ADD COLUMN IF NOT EXISTS final_resources JSONB DEFAULT '{}';

-- Add difficulty_rating column (referenced in page.tsx)
ALTER TABLE user_scenario_attempts 
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5);

-- =============================================================================
-- STEP 2: ADD MISSING COLUMNS TO user_scenario_decisions
-- =============================================================================

-- Add decision_order column (referenced in API)
ALTER TABLE user_scenario_decisions 
ADD COLUMN IF NOT EXISTS decision_order INTEGER NOT NULL DEFAULT 1;

-- Add time_taken_seconds column (API expects this format)
ALTER TABLE user_scenario_decisions 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

-- =============================================================================
-- STEP 3: CREATE INDEXES FOR NEW COLUMNS
-- =============================================================================

-- Index for attempt number queries
CREATE INDEX IF NOT EXISTS idx_user_scenario_attempts_attempt_number 
ON user_scenario_attempts(user_id, scenario_id, attempt_number);

-- Index for decision order queries
CREATE INDEX IF NOT EXISTS idx_user_scenario_decisions_order 
ON user_scenario_decisions(attempt_id, decision_order);

-- =============================================================================
-- STEP 4: UPDATE EXISTING DATA
-- =============================================================================

-- Set attempt_number for existing records
UPDATE user_scenario_attempts 
SET attempt_number = 1 
WHERE attempt_number IS NULL;

-- Convert total_time_spent interval to seconds if needed
UPDATE user_scenario_attempts 
SET total_time_spent_seconds = EXTRACT(EPOCH FROM total_time_spent)::INTEGER
WHERE total_time_spent IS NOT NULL AND total_time_spent_seconds IS NULL;

-- =============================================================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN user_scenario_attempts.attempt_number IS 'Sequential attempt number for this user and scenario';
COMMENT ON COLUMN user_scenario_attempts.total_time_spent_seconds IS 'Total time spent in seconds (replaces interval for API consistency)';
COMMENT ON COLUMN user_scenario_attempts.final_resources IS 'Final resource state when scenario completed';
COMMENT ON COLUMN user_scenario_attempts.difficulty_rating IS 'User-provided difficulty rating (1-5)';

COMMENT ON COLUMN user_scenario_decisions.decision_order IS 'Order of this decision within the attempt';
COMMENT ON COLUMN user_scenario_decisions.time_taken_seconds IS 'Time taken to make this decision in seconds';

COMMIT; 