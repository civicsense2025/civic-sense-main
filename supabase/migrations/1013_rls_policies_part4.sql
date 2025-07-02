-- Comprehensive RLS Policies for CivicSense - Part 4: User Progress and Analytics
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- USER PROGRESS AND ANALYTICS (User-specific data)
-- =============================================================================

-- User Progress - Users can manage their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON user_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Quiz Attempts - Users can manage their own attempts
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON user_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
ON user_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
ON user_quiz_attempts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON user_quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Question Responses - Users can manage their own responses
ALTER TABLE user_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own question responses"
ON user_question_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question responses"
ON user_question_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all question responses"
ON user_question_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Assessments - Users can manage their own assessments
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments"
ON user_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
ON user_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
ON user_assessments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments"
ON user_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

COMMIT; 