-- ============================================================================
-- CIVICSENSE FOCUSED SCHEMA FIX
-- Adds missing columns to existing tables for question response functionality
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Add missing columns to user_question_responses
-- ============================================================================

-- Add user_id column for direct user association (not just through attempt_id)
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add selected_answer column (alias for user_answer for service compatibility)
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS selected_answer TEXT;

-- Add response_time_ms for millisecond precision
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT 0;

-- Add assessment_type for different quiz types
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'practice' 
  CHECK (assessment_type IN ('quiz', 'practice', 'civics_test', 'daily_challenge'));

-- Add topic_id for direct topic association
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS topic_id TEXT;

-- Add confidence_level for spaced repetition
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS confidence_level INTEGER 
  CHECK (confidence_level >= 1 AND confidence_level <= 5);

-- Add was_review flag
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS was_review BOOLEAN DEFAULT FALSE;

-- Add updated_at timestamp
ALTER TABLE public.user_question_responses 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 2. Add missing columns to user_question_memory
-- ============================================================================

-- Add review_interval (alias for interval_days)
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS review_interval INTEGER DEFAULT 1;

-- Add ease_factor (alias for easiness_factor)
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.5;

-- Add mastery_level (0-100 score)
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0 
  CHECK (mastery_level >= 0 AND mastery_level <= 100);

-- Add average_response_time
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS average_response_time INTEGER DEFAULT 0;

-- Add last_confidence_level
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS last_confidence_level INTEGER 
  CHECK (last_confidence_level >= 1 AND last_confidence_level <= 5);

-- Add last_attempt_date
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS last_attempt_date TIMESTAMPTZ;

-- Add updated_at timestamp
ALTER TABLE public.user_question_memory 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 3. Sync existing data between old and new columns
-- ============================================================================

-- Sync user_question_responses data
UPDATE public.user_question_responses 
SET 
  selected_answer = COALESCE(selected_answer, user_answer),
  response_time_ms = COALESCE(response_time_ms, time_spent_seconds * 1000),
  user_id = COALESCE(user_id, (
    SELECT user_id FROM user_quiz_attempts 
    WHERE user_quiz_attempts.id = user_question_responses.attempt_id
  )),
  topic_id = COALESCE(topic_id, (
    SELECT topic_id FROM user_quiz_attempts 
    WHERE user_quiz_attempts.id = user_question_responses.attempt_id
  )),
  updated_at = COALESCE(updated_at, created_at, NOW())
WHERE selected_answer IS NULL 
   OR response_time_ms IS NULL 
   OR response_time_ms = 0 
   OR user_id IS NULL 
   OR updated_at IS NULL;

-- Sync user_question_memory data  
UPDATE public.user_question_memory 
SET 
  review_interval = COALESCE(review_interval, interval_days, 1),
  ease_factor = COALESCE(ease_factor, easiness_factor, 2.5),
  last_attempt_date = COALESCE(last_attempt_date, last_reviewed_at),
  updated_at = COALESCE(updated_at, last_reviewed_at, NOW())
WHERE review_interval IS NULL 
   OR ease_factor IS NULL 
   OR last_attempt_date IS NULL 
   OR updated_at IS NULL;

-- ============================================================================
-- 4. Create indexes for better performance
-- ============================================================================

-- Indexes for user_question_responses
CREATE INDEX IF NOT EXISTS idx_user_question_responses_user_id 
  ON public.user_question_responses(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_responses_topic_id 
  ON public.user_question_responses(topic_id) WHERE topic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_responses_assessment_type 
  ON public.user_question_responses(assessment_type);

CREATE INDEX IF NOT EXISTS idx_user_question_responses_created_at 
  ON public.user_question_responses(created_at DESC);

-- Indexes for user_question_memory  
CREATE INDEX IF NOT EXISTS idx_user_question_memory_next_review 
  ON public.user_question_memory(next_review_date) WHERE next_review_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_memory_mastery 
  ON public.user_question_memory(mastery_level DESC) WHERE mastery_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_question_memory_user_question 
  ON public.user_question_memory(user_id, question_id);

-- ============================================================================
-- 5. Create utility functions for question response service
-- ============================================================================

-- Function to safely upsert user question response
CREATE OR REPLACE FUNCTION public.upsert_user_question_response(
  p_user_id UUID,
  p_question_id TEXT,
  p_selected_answer TEXT,
  p_is_correct BOOLEAN,
  p_response_time_ms INTEGER DEFAULT 0,
  p_assessment_type TEXT DEFAULT 'practice',
  p_attempt_id TEXT DEFAULT NULL,
  p_topic_id TEXT DEFAULT NULL,
  p_confidence_level INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id UUID;
  final_attempt_id TEXT;
BEGIN
  -- Generate attempt_id if not provided (for compatibility)
  final_attempt_id := COALESCE(p_attempt_id, 'session_' || extract(epoch from now())::text);
  
  INSERT INTO public.user_question_responses (
    user_id,
    question_id,
    selected_answer,
    user_answer,
    is_correct,
    response_time_ms,
    time_spent_seconds,
    assessment_type,
    attempt_id,
    topic_id,
    confidence_level,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_question_id,
    p_selected_answer,
    p_selected_answer, -- Duplicate for compatibility
    p_is_correct,
    p_response_time_ms,
    ROUND(p_response_time_ms / 1000.0), -- Convert to seconds for compatibility
    p_assessment_type,
    final_attempt_id,
    p_topic_id,
    p_confidence_level,
    NOW(),
    NOW()
  )
  ON CONFLICT (attempt_id, question_id) 
  DO UPDATE SET
    selected_answer = EXCLUDED.selected_answer,
    user_answer = EXCLUDED.user_answer,
    is_correct = EXCLUDED.is_correct,
    response_time_ms = EXCLUDED.response_time_ms,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    assessment_type = EXCLUDED.assessment_type,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = NOW()
  RETURNING id INTO response_id;
  
  RETURN response_id;
END;
$$;

-- Function to safely upsert user question memory with spaced repetition
CREATE OR REPLACE FUNCTION public.upsert_user_question_memory(
  p_user_id UUID,
  p_question_id TEXT,
  p_is_correct BOOLEAN,
  p_response_time_ms INTEGER DEFAULT 0,
  p_confidence_level INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  memory_record RECORD;
  new_consecutive_correct INTEGER;
  new_total_attempts INTEGER;
  new_interval INTEGER;
  new_ease_factor DECIMAL(3,2);
  new_mastery_level INTEGER;
  next_review_date TIMESTAMPTZ;
BEGIN
  -- Get current memory state
  SELECT * INTO memory_record
  FROM public.user_question_memory
  WHERE user_id = p_user_id AND question_id = p_question_id;
  
  -- Calculate new values
  new_consecutive_correct := CASE 
    WHEN p_is_correct THEN COALESCE(memory_record.consecutive_correct, 0) + 1
    ELSE 0
  END;
  
  new_total_attempts := COALESCE(memory_record.total_attempts, 0) + 1;
  
  -- Simple spaced repetition algorithm
  IF p_is_correct THEN
    IF new_consecutive_correct = 1 THEN
      new_interval := 1;
    ELSIF new_consecutive_correct = 2 THEN
      new_interval := 6;
    ELSE
      new_interval := ROUND(COALESCE(memory_record.interval_days, 1) * COALESCE(memory_record.ease_factor, 2.5));
    END IF;
    new_ease_factor := LEAST(4.0, COALESCE(memory_record.ease_factor, 2.5) + (p_confidence_level - 3) * 0.1);
  ELSE
    new_interval := 1;
    new_ease_factor := GREATEST(1.3, COALESCE(memory_record.ease_factor, 2.5) - 0.2);
  END IF;
  
  -- Calculate mastery level (0-100)
  new_mastery_level := LEAST(100, ROUND(
    (new_consecutive_correct::DECIMAL / GREATEST(new_total_attempts, 1)) * 60 +
    LEAST(new_consecutive_correct * 8, 40)
  ));
  
  next_review_date := NOW() + (new_interval || ' days')::INTERVAL;
  
  -- Upsert memory record
  INSERT INTO public.user_question_memory (
    user_id,
    question_id,
    consecutive_correct,
    total_attempts,
    last_reviewed_at,
    last_attempt_date,
    next_review_date,
    interval_days,
    review_interval,
    easiness_factor,
    ease_factor,
    mastery_level,
    average_response_time,
    last_confidence_level,
    repetition_count,
    updated_at
  ) VALUES (
    p_user_id,
    p_question_id,
    new_consecutive_correct,
    new_total_attempts,
    NOW(),
    NOW(),
    next_review_date,
    new_interval,
    new_interval,
    new_ease_factor,
    new_ease_factor,
    new_mastery_level,
    p_response_time_ms,
    p_confidence_level,
    new_total_attempts,
    NOW()
  )
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET
    consecutive_correct = EXCLUDED.consecutive_correct,
    total_attempts = EXCLUDED.total_attempts,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    last_attempt_date = EXCLUDED.last_attempt_date,
    next_review_date = EXCLUDED.next_review_date,
    interval_days = EXCLUDED.interval_days,
    review_interval = EXCLUDED.review_interval,
    easiness_factor = EXCLUDED.easiness_factor,
    ease_factor = EXCLUDED.ease_factor,
    mastery_level = EXCLUDED.mastery_level,
    average_response_time = CASE 
      WHEN user_question_memory.average_response_time > 0 
      THEN (user_question_memory.average_response_time + p_response_time_ms) / 2
      ELSE p_response_time_ms
    END,
    last_confidence_level = EXCLUDED.last_confidence_level,
    repetition_count = EXCLUDED.repetition_count,
    updated_at = EXCLUDED.updated_at;
  
  RETURN jsonb_build_object(
    'mastery_level', new_mastery_level,
    'next_review_date', next_review_date,
    'consecutive_correct', new_consecutive_correct,
    'total_attempts', new_total_attempts
  );
END;
$$;

-- ============================================================================
-- 6. Create triggers for automatic updates
-- ============================================================================

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_question_responses_updated_at'
  ) THEN
    CREATE TRIGGER update_user_question_responses_updated_at
      BEFORE UPDATE ON public.user_question_responses
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_question_memory_updated_at'
  ) THEN
    CREATE TRIGGER update_user_question_memory_updated_at
      BEFORE UPDATE ON public.user_question_memory
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 7. Grant necessary permissions
-- ============================================================================

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION public.upsert_user_question_response TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_question_memory TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================

/*
-- Verify user_question_responses has all needed columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_question_responses' 
  AND table_schema = 'public'
ORDER BY column_name;

-- Verify user_question_memory has all needed columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_question_memory' 
  AND table_schema = 'public'
ORDER BY column_name;

-- Test the upsert functions
SELECT public.upsert_user_question_response(
  auth.uid()::uuid,
  'test_question_id',
  'test_answer',
  true,
  5000,
  'practice',
  null,
  'test_topic',
  4
);

SELECT public.upsert_user_question_memory(
  auth.uid()::uuid,
  'test_question_id',
  true,
  5000,
  4
);
*/ 