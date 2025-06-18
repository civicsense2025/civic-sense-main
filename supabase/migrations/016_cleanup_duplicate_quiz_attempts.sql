-- Migration: Clean up duplicate quiz attempts
-- This addresses the session management issue where users were getting multiple incomplete attempts for the same topic

BEGIN;

-- First, let's identify and clean up duplicate incomplete attempts
-- Keep only the most recent incomplete attempt per user per topic
WITH duplicate_incomplete_attempts AS (
  SELECT 
    id,
    user_id,
    topic_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, topic_id, is_completed 
      ORDER BY created_at DESC
    ) as rn
  FROM user_quiz_attempts 
  WHERE is_completed = false
)
DELETE FROM user_quiz_attempts 
WHERE id IN (
  SELECT id 
  FROM duplicate_incomplete_attempts 
  WHERE rn > 1
);

-- Clean up orphaned question responses from deleted attempts
DELETE FROM user_question_responses 
WHERE attempt_id NOT IN (
  SELECT id FROM user_quiz_attempts
);

-- Add a comment to track this cleanup
COMMENT ON TABLE user_quiz_attempts IS 'Quiz attempts table - cleaned up duplicates on 2025-01-17';

-- Create a function to prevent future duplicate incomplete attempts
CREATE OR REPLACE FUNCTION prevent_duplicate_incomplete_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an incomplete attempt, check for existing incomplete attempts for the same user/topic
  IF NEW.is_completed = false THEN
    -- Check if there's already an incomplete attempt for this user/topic combination
    IF EXISTS (
      SELECT 1 
      FROM user_quiz_attempts 
      WHERE user_id = NEW.user_id 
        AND topic_id = NEW.topic_id 
        AND is_completed = false
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      -- Update the existing incomplete attempt instead of creating a new one
      UPDATE user_quiz_attempts 
      SET 
        total_questions = NEW.total_questions,
        started_at = NEW.started_at,
        correct_answers = COALESCE(NEW.correct_answers, correct_answers),
        score = COALESCE(NEW.score, score),
        time_spent_seconds = COALESCE(NEW.time_spent_seconds, time_spent_seconds)
      WHERE user_id = NEW.user_id 
        AND topic_id = NEW.topic_id 
        AND is_completed = false;
      
      -- Return NULL to prevent the insert
      RETURN NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent future duplicates (only for INSERTs)
DROP TRIGGER IF EXISTS prevent_duplicate_incomplete_attempts_trigger ON user_quiz_attempts;
CREATE TRIGGER prevent_duplicate_incomplete_attempts_trigger
  BEFORE INSERT ON user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_incomplete_attempts();

-- Add index to improve performance of the deduplication queries
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_topic_completed 
ON user_quiz_attempts(user_id, topic_id, is_completed, created_at DESC);

-- Log the cleanup
DO $$
DECLARE
  cleanup_count integer;
BEGIN
  SELECT COUNT(*) INTO cleanup_count 
  FROM user_quiz_attempts 
  WHERE is_completed = false;
  
  RAISE NOTICE 'Duplicate quiz attempts cleanup completed. Remaining incomplete attempts: %', cleanup_count;
END $$;

COMMIT; 