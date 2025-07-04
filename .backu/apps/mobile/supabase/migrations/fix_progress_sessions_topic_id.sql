-- Make topic_id nullable for assessments that don't relate to specific topics
ALTER TABLE progress_sessions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Remove the invalid check constraint (can't use subqueries in check constraints)
-- We'll handle topic_id validation in the application code instead

-- Update RLS policies to handle nullable topic_id
DROP POLICY IF EXISTS "Users can manage their own progress sessions" ON progress_sessions;

CREATE POLICY "Users can manage their own progress sessions" ON progress_sessions
  FOR ALL USING (
    auth.uid() = user_id
  );

-- Allow users to read progress sessions they own
DROP POLICY IF EXISTS "Users can read their own progress sessions" ON progress_sessions;

CREATE POLICY "Users can read their own progress sessions" ON progress_sessions
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow users to insert their own progress sessions
DROP POLICY IF EXISTS "Users can insert their own progress sessions" ON progress_sessions;

CREATE POLICY "Users can insert their own progress sessions" ON progress_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Allow users to update their own progress sessions
DROP POLICY IF EXISTS "Users can update their own progress sessions" ON progress_sessions;

CREATE POLICY "Users can update their own progress sessions" ON progress_sessions
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- Add index for better performance on topic_id lookups
CREATE INDEX IF NOT EXISTS idx_progress_sessions_topic_id ON progress_sessions(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_progress_sessions_user_id ON progress_sessions(user_id); 