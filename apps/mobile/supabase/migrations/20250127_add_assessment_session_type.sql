-- Migration: Add 'assessment' and 'civics_test' to allowed session types
-- Date: 2025-01-27
-- Description: Allow 'assessment' and 'civics_test' as valid session_types in progress_sessions table

BEGIN;

-- Drop the existing constraint
ALTER TABLE progress_sessions DROP CONSTRAINT IF EXISTS progress_sessions_session_type_check;

-- Add the new constraint that includes 'assessment' and 'civics_test'
ALTER TABLE progress_sessions 
ADD CONSTRAINT progress_sessions_session_type_check 
CHECK (session_type IN ('regular_quiz', 'reinforcement', 'review', 'challenge', 'assessment', 'civics_test'));

COMMIT; 