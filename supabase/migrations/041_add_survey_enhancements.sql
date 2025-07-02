-- Migration: Add Survey Enhancements
-- Description: Add post-completion configuration, user completion tracking, and learning goals integration
-- Date: 2024-06-19

BEGIN;

-- Add post-completion configuration to surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS post_completion_config JSONB DEFAULT NULL;

-- Add user survey completions tracking table
CREATE TABLE IF NOT EXISTS user_survey_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT, -- For anonymous users
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_questions INTEGER NOT NULL,
  questions_answered INTEGER NOT NULL,
  completion_time_seconds INTEGER, -- How long it took to complete
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one completion record per user per survey
  UNIQUE(user_id, survey_id),
  UNIQUE(guest_token, survey_id),
  
  -- Either user_id or guest_token must be present
  CONSTRAINT completion_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_token IS NULL) OR
    (user_id IS NULL AND guest_token IS NOT NULL)
  )
);

-- Add survey-learning goals mapping table
CREATE TABLE IF NOT EXISTS survey_learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  weight NUMERIC(3,2) DEFAULT 1.0, -- How much this survey contributes to the skill (0.0-1.0)
  question_mappings JSONB, -- Map specific questions to skill components
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(survey_id, skill_id)
);

-- Add survey recommendation triggers table for AI-powered recommendations
CREATE TABLE IF NOT EXISTS survey_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  recommended_content JSONB NOT NULL, -- Array of recommended content with scores
  based_on_responses JSONB NOT NULL, -- Summary of responses that triggered recommendations
  generated_at TIMESTAMPTZ DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  clicked_items JSONB DEFAULT '[]'::jsonb, -- Track which recommendations were clicked
  
  -- Either user_id or guest_token must be present
  CONSTRAINT recommendation_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_token IS NULL) OR
    (user_id IS NULL AND guest_token IS NOT NULL)
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_survey_completions_user_id ON user_survey_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_survey_completions_guest_token ON user_survey_completions(guest_token);
CREATE INDEX IF NOT EXISTS idx_user_survey_completions_survey_id ON user_survey_completions(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_survey_completions_completed_at ON user_survey_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_survey_learning_goals_survey_id ON survey_learning_goals(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_learning_goals_skill_id ON survey_learning_goals(skill_id);

CREATE INDEX IF NOT EXISTS idx_survey_recommendations_user_id ON survey_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_recommendations_guest_token ON survey_recommendations(guest_token);
CREATE INDEX IF NOT EXISTS idx_survey_recommendations_survey_id ON survey_recommendations(survey_id);

-- Add RLS policies for user_survey_completions
ALTER TABLE user_survey_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own survey completions" ON user_survey_completions
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "Users can insert their own survey completions" ON user_survey_completions
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "Users can update their own survey completions" ON user_survey_completions
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

-- RLS policies for survey_learning_goals (admin-only for now)
ALTER TABLE survey_learning_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view survey learning goals" ON survey_learning_goals
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage survey learning goals" ON survey_learning_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@civicsense.one'
    )
  );

-- RLS policies for survey_recommendations
ALTER TABLE survey_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations" ON survey_recommendations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "Users can insert their own recommendations" ON survey_recommendations
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "Users can update their own recommendations" ON survey_recommendations
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_token IS NOT NULL)
  );

-- Add updated_at trigger for user_survey_completions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_survey_completions_updated_at ON user_survey_completions;
CREATE TRIGGER update_user_survey_completions_updated_at 
  BEFORE UPDATE ON user_survey_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create completion record when survey is completed
CREATE OR REPLACE FUNCTION create_survey_completion()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
  start_time TIMESTAMPTZ;
  completion_time INTEGER;
BEGIN
  -- Only create completion record when is_complete changes to true
  IF NEW.is_complete = true AND (OLD.is_complete IS NULL OR OLD.is_complete = false) THEN
    
    -- Get question count for this survey
    SELECT COUNT(*) INTO question_count
    FROM survey_questions 
    WHERE survey_id = NEW.survey_id;
    
    -- Get start time (created_at of first answer for this response)
    SELECT MIN(answered_at) INTO start_time
    FROM survey_answers 
    WHERE response_id = NEW.id;
    
    -- Calculate completion time in seconds
    IF start_time IS NOT NULL THEN
      completion_time := EXTRACT(EPOCH FROM (NEW.completed_at - start_time))::INTEGER;
    END IF;
    
    -- Insert completion record
    INSERT INTO user_survey_completions (
      user_id,
      guest_token,
      survey_id,
      response_id,
      completed_at,
      total_questions,
      questions_answered,
      completion_time_seconds
    ) VALUES (
      NEW.user_id,
      NEW.guest_token,
      NEW.survey_id,
      NEW.id,
      NEW.completed_at,
      question_count,
      (SELECT COUNT(*) FROM survey_answers WHERE response_id = NEW.id),
      completion_time
    )
    ON CONFLICT (user_id, survey_id) DO UPDATE SET
      response_id = EXCLUDED.response_id,
      completed_at = EXCLUDED.completed_at,
      questions_answered = EXCLUDED.questions_answered,
      completion_time_seconds = EXCLUDED.completion_time_seconds,
      updated_at = now()
    ;
    
    -- Handle guest token conflicts separately
    IF NEW.guest_token IS NOT NULL THEN
      INSERT INTO user_survey_completions (
        user_id,
        guest_token,
        survey_id,
        response_id,
        completed_at,
        total_questions,
        questions_answered,
        completion_time_seconds
      ) VALUES (
        NULL,
        NEW.guest_token,
        NEW.survey_id,
        NEW.id,
        NEW.completed_at,
        question_count,
        (SELECT COUNT(*) FROM survey_answers WHERE response_id = NEW.id),
        completion_time
      )
      ON CONFLICT (guest_token, survey_id) DO UPDATE SET
        response_id = EXCLUDED.response_id,
        completed_at = EXCLUDED.completed_at,
        questions_answered = EXCLUDED.questions_answered,
        completion_time_seconds = EXCLUDED.completion_time_seconds,
        updated_at = now()
      ;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic completion tracking
DROP TRIGGER IF EXISTS survey_completion_trigger ON survey_responses;
CREATE TRIGGER survey_completion_trigger 
  AFTER UPDATE ON survey_responses 
  FOR EACH ROW 
  EXECUTE FUNCTION create_survey_completion();

-- Drop existing view to avoid column conflicts
DROP VIEW IF EXISTS survey_summary;

-- Create enhanced survey_summary view to include completion status  
CREATE VIEW survey_summary AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.status,
  s.allow_anonymous,
  s.allow_partial_responses,
  s.estimated_time,
  s.created_at,
  s.published_at,
  s.created_by,
  s.post_completion_config,
  
  -- Question stats
  COALESCE(q.question_count, 0) as question_count,
  
  -- Response stats
  COALESCE(r.total_responses, 0) as total_responses,
  COALESCE(r.completed_responses, 0) as completed_responses,
  COALESCE(r.authenticated_responses, 0) as authenticated_responses,
  COALESCE(r.anonymous_responses, 0) as anonymous_responses,
  
  -- Completion rate
  CASE 
    WHEN COALESCE(r.total_responses, 0) > 0 
    THEN ROUND((COALESCE(r.completed_responses, 0)::NUMERIC / r.total_responses) * 100, 1)
    ELSE 0 
  END as completion_rate
  
FROM surveys s

LEFT JOIN (
  SELECT 
    survey_id,
    COUNT(*) as question_count
  FROM survey_questions 
  GROUP BY survey_id
) q ON s.id = q.survey_id

LEFT JOIN (
  SELECT 
    survey_id,
    COUNT(*) as total_responses,
    COUNT(*) FILTER (WHERE is_complete = true) as completed_responses,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as authenticated_responses,
    COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_responses
  FROM survey_responses 
  GROUP BY survey_id
) r ON s.id = r.survey_id;

-- Grant permissions
GRANT SELECT ON survey_summary TO anon, authenticated;
GRANT ALL ON user_survey_completions TO authenticated;
GRANT SELECT ON user_survey_completions TO anon;
GRANT ALL ON survey_learning_goals TO authenticated;
GRANT SELECT ON survey_learning_goals TO anon;
GRANT ALL ON survey_recommendations TO authenticated;
GRANT SELECT ON survey_recommendations TO anon;

COMMIT; 