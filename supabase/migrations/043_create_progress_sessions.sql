-- Migration: Create progress sessions for incremental saving
-- This table will store in-progress quiz/assessment sessions to allow reliable restoration

BEGIN;

-- Create progress_sessions table for incremental progress storage
CREATE TABLE IF NOT EXISTS progress_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (supports both authenticated and guest users)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT,
  
  -- Session metadata
  session_id TEXT NOT NULL UNIQUE,
  session_type TEXT NOT NULL CHECK (session_type IN ('regular_quiz', 'civics_test', 'onboarding_assessment', 'multiplayer_quiz', 'survey')),
  
  -- Content identification with proper foreign keys
  topic_id TEXT REFERENCES question_topics(topic_id) ON DELETE CASCADE,
  assessment_type TEXT,
  test_type TEXT CHECK (test_type IN ('quick', 'full')),
  
  -- LMS Integration support (inherits to final attempts)
  classroom_course_id TEXT,
  classroom_assignment_id TEXT,
  clever_assignment_id TEXT,
  clever_section_id TEXT,
  
  -- Progress state (stored as JSON for flexibility)
  questions JSONB NOT NULL,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Performance tracking
  streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  response_times JSONB NOT NULL DEFAULT '{}',
  
  -- Additional metadata
  category_performance JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Constraints
  CONSTRAINT progress_sessions_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_token IS NULL) OR 
    (user_id IS NULL AND guest_token IS NOT NULL)
  ),
  CONSTRAINT progress_sessions_valid_index CHECK (current_question_index >= 0)
);

-- Create progress_question_responses table for question-level tracking
CREATE TABLE IF NOT EXISTS progress_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to progress session
  progress_session_id UUID NOT NULL REFERENCES progress_sessions(id) ON DELETE CASCADE,
  
  -- Question details - MUST match existing user_question_responses schema
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE, -- Changed to UUID with FK
  question_index INTEGER NOT NULL,
  
  -- Response details - matches existing schema exactly
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER, -- Matches existing nullable field
  hint_used BOOLEAN DEFAULT FALSE, -- Matches existing nullable field
  
  -- Additional progress-specific fields
  attempt_number INTEGER DEFAULT 1,
  boost_used TEXT,
  
  -- Timestamps
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT progress_question_responses_valid_index CHECK (question_index >= 0),
  CONSTRAINT progress_question_responses_valid_time CHECK (time_spent_seconds IS NULL OR time_spent_seconds >= 0),
  CONSTRAINT progress_question_responses_valid_attempt CHECK (attempt_number > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_sessions_user_type ON progress_sessions(user_id, session_type);
CREATE INDEX IF NOT EXISTS idx_progress_sessions_guest_type ON progress_sessions(guest_token, session_type);
CREATE INDEX IF NOT EXISTS idx_progress_sessions_session_id ON progress_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_sessions_expires_at ON progress_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_progress_sessions_topic ON progress_sessions(topic_id);

CREATE INDEX IF NOT EXISTS idx_progress_responses_session ON progress_question_responses(progress_session_id);
CREATE INDEX IF NOT EXISTS idx_progress_responses_question ON progress_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_progress_responses_session_index ON progress_question_responses(progress_session_id, question_index);

-- Add RLS policies
ALTER TABLE progress_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_question_responses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own progress sessions
CREATE POLICY "Users can view their own progress sessions" ON progress_sessions
  FOR ALL USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

-- Users can only access responses for their own sessions
CREATE POLICY "Users can view their own progress responses" ON progress_question_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM progress_sessions 
      WHERE id = progress_question_responses.progress_session_id
      AND (auth.uid() = user_id OR (auth.uid() IS NULL AND guest_token IS NOT NULL))
    )
  );

-- Admins can access all progress data
CREATE POLICY "Admins can access all progress data" ON progress_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access all progress responses" ON progress_question_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create function to automatically update last_updated_at
CREATE OR REPLACE FUNCTION update_progress_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update timestamp
DROP TRIGGER IF EXISTS progress_sessions_update_timestamp ON progress_sessions;
CREATE TRIGGER progress_sessions_update_timestamp
  BEFORE UPDATE ON progress_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_session_timestamp();

-- Create function to migrate completed progress session to final tables
CREATE OR REPLACE FUNCTION migrate_progress_session_to_completion(
  p_session_id TEXT
) RETURNS TABLE (
  success BOOLEAN,
  final_attempt_id UUID,
  migration_type TEXT,
  error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session progress_sessions%ROWTYPE;
  v_final_attempt_id UUID;
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_score INTEGER;
  v_time_spent INTEGER;
  v_error_msg TEXT;
BEGIN
  -- Get the progress session
  SELECT * INTO v_session 
  FROM progress_sessions 
  WHERE session_id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'error'::TEXT, 'Progress session not found'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate completion metrics
  SELECT 
    jsonb_array_length(v_session.questions),
    (SELECT COUNT(*) FROM progress_question_responses WHERE progress_session_id = v_session.id AND is_correct = true),
    COALESCE((
      SELECT SUM(time_spent_seconds) 
      FROM progress_question_responses 
      WHERE progress_session_id = v_session.id
    ), 0)
  INTO v_total_questions, v_correct_answers, v_time_spent;
  
  -- Calculate score percentage
  v_score := CASE 
    WHEN v_total_questions > 0 THEN ROUND((v_correct_answers::FLOAT / v_total_questions) * 100)
    ELSE 0 
  END;
  
  BEGIN
    -- Handle different session types
    CASE v_session.session_type
      WHEN 'regular_quiz', 'multiplayer_quiz' THEN
        -- Migrate to user_quiz_attempts
        IF v_session.user_id IS NOT NULL THEN
          -- Check for existing incomplete attempt
          SELECT id INTO v_final_attempt_id
          FROM user_quiz_attempts
          WHERE user_id = v_session.user_id 
            AND topic_id = v_session.topic_id
            AND is_completed = false
          ORDER BY created_at DESC
          LIMIT 1;
          
          IF v_final_attempt_id IS NOT NULL THEN
            -- Update existing attempt
            UPDATE user_quiz_attempts SET
              total_questions = v_total_questions,
              correct_answers = v_correct_answers,
              score = v_score,
              time_spent_seconds = v_time_spent,
              completed_at = NOW(),
              is_completed = true,
              classroom_course_id = v_session.classroom_course_id,
              classroom_assignment_id = v_session.classroom_assignment_id,
              clever_assignment_id = v_session.clever_assignment_id,
              clever_section_id = v_session.clever_section_id
            WHERE id = v_final_attempt_id;
          ELSE
            -- Create new attempt
            INSERT INTO user_quiz_attempts (
              user_id, topic_id, total_questions, correct_answers, score,
              time_spent_seconds, started_at, completed_at, is_completed,
              classroom_course_id, classroom_assignment_id,
              clever_assignment_id, clever_section_id
            ) VALUES (
              v_session.user_id, v_session.topic_id, v_total_questions, 
              v_correct_answers, v_score, v_time_spent,
              v_session.started_at, NOW(), true,
              v_session.classroom_course_id, v_session.classroom_assignment_id,
              v_session.clever_assignment_id, v_session.clever_section_id
            ) RETURNING id INTO v_final_attempt_id;
          END IF;
          
          -- Migrate question responses
          DELETE FROM user_question_responses WHERE attempt_id = v_final_attempt_id;
          
          INSERT INTO user_question_responses (
            attempt_id, question_id, user_answer, is_correct, 
            time_spent_seconds, hint_used, created_at
          )
          SELECT 
            v_final_attempt_id, 
            question_id, 
            user_answer, 
            is_correct,
            time_spent_seconds,
            hint_used,
            answered_at
          FROM progress_question_responses
          WHERE progress_session_id = v_session.id AND question_id IS NOT NULL;
          
          RETURN QUERY SELECT TRUE, v_final_attempt_id, 'user_quiz_attempt'::TEXT, NULL::TEXT;
        ELSE
          -- Guest user - just mark as guest completion
          RETURN QUERY SELECT TRUE, NULL::UUID, 'guest_quiz'::TEXT, NULL::TEXT;
        END IF;
        
      WHEN 'civics_test', 'onboarding_assessment' THEN
        -- Migrate to user_assessments or guest tables
        IF v_session.user_id IS NOT NULL THEN
          INSERT INTO user_assessments (
            user_id, assessment_type, score, 
            level, category_breakdown, answers,
            mode, completed_at
          ) VALUES (
            v_session.user_id,
            COALESCE(v_session.assessment_type, v_session.session_type),
            v_score,
            CASE 
              WHEN v_score >= 80 THEN 'advanced'
              WHEN v_score >= 60 THEN 'intermediate'
              ELSE 'beginner'
            END,
            v_session.category_performance,
            v_session.answers,
            COALESCE(v_session.test_type, 'full'),
            NOW()
          ) RETURNING id INTO v_final_attempt_id;
          
          RETURN QUERY SELECT TRUE, v_final_attempt_id, 'user_assessment'::TEXT, NULL::TEXT;
        ELSE
          -- Guest assessment - store in guest_civics_test_results
          INSERT INTO guest_civics_test_results (
            guest_token, session_id, score,
            level, test_type, answers, category_breakdown,
            completed_at
          ) VALUES (
            v_session.guest_token, v_session.session_id, v_score,
            CASE 
              WHEN v_score >= 80 THEN 'advanced'
              WHEN v_score >= 60 THEN 'intermediate'
              ELSE 'beginner'
            END,
            COALESCE(v_session.test_type, 'full'),
            v_session.answers,
            v_session.category_performance,
            NOW()
          );
          
          RETURN QUERY SELECT TRUE, NULL::UUID, 'guest_assessment'::TEXT, NULL::TEXT;
        END IF;
        
      ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, 'error'::TEXT, ('Unsupported session type: ' || v_session.session_type)::TEXT;
        RETURN;
    END CASE;
    
    -- Clean up progress session after successful migration
    DELETE FROM progress_sessions WHERE id = v_session.id;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RETURN QUERY SELECT FALSE, NULL::UUID, 'error'::TEXT, v_error_msg::TEXT;
    RETURN;
  END;
  
END;
$$;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_progress_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM progress_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's active progress sessions
CREATE OR REPLACE FUNCTION get_user_progress_sessions(
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL
)
RETURNS SETOF progress_sessions AS $$
BEGIN
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY 
    SELECT * FROM progress_sessions 
    WHERE user_id = p_user_id 
    ORDER BY last_updated_at DESC;
  ELSIF p_guest_token IS NOT NULL THEN
    RETURN QUERY 
    SELECT * FROM progress_sessions 
    WHERE guest_token = p_guest_token 
    ORDER BY last_updated_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE progress_sessions IS 'Temporary storage for in-progress quiz/assessment sessions with automatic migration to final tables';
COMMENT ON TABLE progress_question_responses IS 'Individual question responses during progress sessions, compatible with user_question_responses schema';
COMMENT ON COLUMN progress_sessions.session_id IS 'Unique identifier for the session, used for localStorage compatibility';
COMMENT ON COLUMN progress_sessions.guest_token IS 'Token for guest users to identify their sessions';
COMMENT ON COLUMN progress_sessions.expires_at IS 'When this session expires and can be cleaned up';
COMMENT ON COLUMN progress_question_responses.question_index IS 'Index of question in the session for ordering';
COMMENT ON FUNCTION migrate_progress_session_to_completion(TEXT) IS 'Migrates completed progress session to appropriate final table (user_quiz_attempts, user_assessments, or guest tables)';
COMMENT ON FUNCTION cleanup_expired_progress_sessions() IS 'Removes expired progress sessions and orphaned responses';

COMMIT; 