-- Remove Pod Analytics Trigger from Quiz Attempts
-- This fixes the "function update_pod_analytics(uuid) is not unique" error
-- Pod analytics should be updated when users visit their pods, not on every quiz completion

BEGIN;

-- Drop the problematic trigger that updates pod analytics on quiz completion
DROP TRIGGER IF EXISTS trigger_update_pod_analytics ON user_quiz_attempts;

-- Drop the trigger function that was calling update_pod_analytics
DROP FUNCTION IF EXISTS trigger_update_pod_analytics();

-- Add comment explaining the change
COMMENT ON TABLE user_quiz_attempts IS 'Quiz attempt records. Pod analytics are updated separately when users visit pods, not on quiz completion.';

COMMIT; 