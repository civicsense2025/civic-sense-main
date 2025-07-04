-- =====================================================================================
-- Daily Challenges Schema Migration
-- Creates tables and functions for comprehensive daily challenge tracking
-- =====================================================================================

BEGIN;

-- =====================================================================================
-- 1. DAILY CHALLENGES TABLE
-- Stores daily challenge configurations and metadata
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  
  -- Challenge Configuration
  total_topics INTEGER NOT NULL DEFAULT 0,
  topic_ids JSONB NOT NULL DEFAULT '[]',
  featured_topic_id UUID REFERENCES public.question_topics(id),
  
  -- Challenge Metadata
  difficulty_level INTEGER DEFAULT 2 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_duration_minutes INTEGER DEFAULT 15,
  
  -- Status Tracking
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_topic_ids CHECK (jsonb_typeof(topic_ids) = 'array'),
  CONSTRAINT future_or_current_date CHECK (challenge_date >= CURRENT_DATE - INTERVAL '365 days')
);

-- Indexes for daily_challenges
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON public.daily_challenges(is_active, challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_featured ON public.daily_challenges(is_featured, challenge_date) WHERE is_featured = true;

-- =====================================================================================
-- 2. USER DAILY PROGRESS TABLE
-- Tracks individual user progress on daily challenges
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.user_daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  
  -- Progress Tracking
  completed_topics JSONB NOT NULL DEFAULT '[]',
  total_topics INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Completion Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Performance Metrics
  total_score INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  accuracy_percentage INTEGER DEFAULT 0 CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- XP and Rewards
  xp_earned INTEGER DEFAULT 0,
  bonus_xp INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(user_id, challenge_date),
  CONSTRAINT valid_completed_topics CHECK (jsonb_typeof(completed_topics) = 'array'),
  CONSTRAINT completion_logic CHECK (
    (is_completed = false AND completed_at IS NULL) OR 
    (is_completed = true AND completed_at IS NOT NULL)
  )
);

-- Indexes for user_daily_progress
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_user_date ON public.user_daily_progress(user_id, challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_completed ON public.user_daily_progress(user_id, is_completed, challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_streak ON public.user_daily_progress(user_id, challenge_date) WHERE is_completed = true;

-- =====================================================================================
-- 3. DAILY CHALLENGE STREAKS TABLE
-- Tracks user streak information and statistics
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.daily_challenge_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current Streak
  current_streak INTEGER DEFAULT 0,
  current_streak_start_date DATE,
  current_streak_end_date DATE,
  
  -- Historical Streaks
  longest_streak INTEGER DEFAULT 0,
  longest_streak_start_date DATE,
  longest_streak_end_date DATE,
  
  -- Overall Statistics
  total_challenges_completed INTEGER DEFAULT 0,
  total_days_participated INTEGER DEFAULT 0,
  average_completion_percentage INTEGER DEFAULT 0,
  
  -- Last Activity
  last_completed_date DATE,
  last_activity_date DATE,
  
  -- Milestone Tracking
  milestones_achieved JSONB DEFAULT '[]',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(user_id),
  CONSTRAINT valid_milestones CHECK (jsonb_typeof(milestones_achieved) = 'array'),
  CONSTRAINT streak_logic CHECK (
    current_streak >= 0 AND 
    longest_streak >= 0 AND 
    longest_streak >= current_streak
  )
);

-- Indexes for daily_challenge_streaks
CREATE INDEX IF NOT EXISTS idx_daily_challenge_streaks_user ON public.daily_challenge_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_streaks_current ON public.daily_challenge_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_streaks_longest ON public.daily_challenge_streaks(longest_streak DESC);

-- =====================================================================================
-- 4. CHALLENGE TOPIC PROGRESS TABLE
-- Tracks individual topic completion within daily challenges
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.challenge_topic_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.question_topics(id),
  
  -- Progress Details
  is_started BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  
  -- Performance Metrics
  score INTEGER DEFAULT 0,
  accuracy_percentage INTEGER DEFAULT 0 CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Session Information
  quiz_session_id UUID REFERENCES public.quiz_sessions(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(user_id, challenge_date, topic_id),
  CONSTRAINT completion_requires_start CHECK (
    (is_completed = false) OR 
    (is_completed = true AND is_started = true AND started_at IS NOT NULL)
  )
);

-- Indexes for challenge_topic_progress
CREATE INDEX IF NOT EXISTS idx_challenge_topic_progress_user_date ON public.challenge_topic_progress(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_challenge_topic_progress_topic ON public.challenge_topic_progress(topic_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_challenge_topic_progress_session ON public.challenge_topic_progress(quiz_session_id) WHERE quiz_session_id IS NOT NULL;

-- =====================================================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================================

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS trigger_daily_challenges_updated_at ON public.daily_challenges;
CREATE TRIGGER trigger_daily_challenges_updated_at
  BEFORE UPDATE ON public.daily_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_daily_progress_updated_at ON public.user_daily_progress;
CREATE TRIGGER trigger_user_daily_progress_updated_at
  BEFORE UPDATE ON public.user_daily_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_daily_challenge_streaks_updated_at ON public.daily_challenge_streaks;
CREATE TRIGGER trigger_daily_challenge_streaks_updated_at
  BEFORE UPDATE ON public.daily_challenge_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_challenge_topic_progress_updated_at ON public.challenge_topic_progress;
CREATE TRIGGER trigger_challenge_topic_progress_updated_at
  BEFORE UPDATE ON public.challenge_topic_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 6. DAILY CHALLENGE FUNCTIONS
-- =====================================================================================

-- Function to get or create daily challenge for a date
CREATE OR REPLACE FUNCTION get_or_create_daily_challenge(target_date DATE)
RETURNS TABLE (
  challenge_id UUID,
  challenge_date DATE,
  total_topics INTEGER,
  topic_ids JSONB,
  featured_topic_id UUID,
  difficulty_level INTEGER,
  estimated_duration_minutes INTEGER
) AS $$
DECLARE
  existing_challenge RECORD;
  new_challenge_id UUID;
  topics_for_date JSONB;
  featured_topic UUID;
BEGIN
  -- Check if challenge already exists
  SELECT * INTO existing_challenge
  FROM public.daily_challenges dc
  WHERE dc.challenge_date = target_date
  AND dc.is_active = true;
  
  IF existing_challenge.id IS NOT NULL THEN
    -- Return existing challenge
    RETURN QUERY
    SELECT 
      existing_challenge.id,
      existing_challenge.challenge_date,
      existing_challenge.total_topics,
      existing_challenge.topic_ids,
      existing_challenge.featured_topic_id,
      existing_challenge.difficulty_level,
      existing_challenge.estimated_duration_minutes;
    RETURN;
  END IF;
  
  -- Create new challenge
  -- Get topics for the date from question_topics
  SELECT COALESCE(jsonb_agg(qt.id), '[]'::jsonb) INTO topics_for_date
  FROM public.question_topics qt
  WHERE qt.date::date = target_date
  AND qt.is_active = true;
  
  -- Select a featured topic (first breaking/featured, or random)
  SELECT qt.id INTO featured_topic
  FROM public.question_topics qt
  WHERE qt.date::date = target_date
  AND qt.is_active = true
  AND (qt.is_breaking = true OR qt.is_featured = true)
  ORDER BY qt.is_breaking DESC, qt.is_featured DESC, RANDOM()
  LIMIT 1;
  
  -- If no featured topic, pick a random one
  IF featured_topic IS NULL THEN
    SELECT qt.id INTO featured_topic
    FROM public.question_topics qt
    WHERE qt.date::date = target_date
    AND qt.is_active = true
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
  
  -- Insert new challenge
  INSERT INTO public.daily_challenges (
    challenge_date,
    total_topics,
    topic_ids,
    featured_topic_id,
    difficulty_level,
    estimated_duration_minutes,
    is_active
  ) VALUES (
    target_date,
    jsonb_array_length(topics_for_date),
    topics_for_date,
    featured_topic,
    2, -- Default difficulty
    15, -- Default duration
    true
  ) RETURNING id INTO new_challenge_id;
  
  -- Return new challenge
  RETURN QUERY
  SELECT 
    new_challenge_id,
    target_date,
    jsonb_array_length(topics_for_date),
    topics_for_date,
    featured_topic,
    2,
    15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user daily progress
CREATE OR REPLACE FUNCTION update_user_daily_progress(
  p_user_id UUID,
  p_challenge_date DATE,
  p_topic_id UUID,
  p_quiz_session_id UUID DEFAULT NULL,
  p_questions_answered INTEGER DEFAULT 0,
  p_questions_correct INTEGER DEFAULT 0,
  p_total_questions INTEGER DEFAULT 0,
  p_time_spent_seconds INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  challenge_record RECORD;
  progress_record RECORD;
  topic_progress_record RECORD;
  updated_progress RECORD;
BEGIN
  -- Get challenge for date
  SELECT * INTO challenge_record
  FROM public.daily_challenges
  WHERE challenge_date = p_challenge_date
  AND is_active = true;
  
  IF challenge_record.id IS NULL THEN
    RETURN json_build_object('error', 'No active challenge found for date');
  END IF;
  
  -- Upsert challenge topic progress
  INSERT INTO public.challenge_topic_progress (
    user_id,
    challenge_date,
    topic_id,
    quiz_session_id,
    is_started,
    is_completed,
    questions_answered,
    questions_correct,
    total_questions,
    score,
    accuracy_percentage,
    time_spent_seconds,
    started_at,
    completed_at
  ) VALUES (
    p_user_id,
    p_challenge_date,
    p_topic_id,
    p_quiz_session_id,
    true,
    CASE WHEN p_total_questions > 0 AND p_questions_answered >= p_total_questions THEN true ELSE false END,
    p_questions_answered,
    p_questions_correct,
    p_total_questions,
    p_questions_correct,
    CASE WHEN p_questions_answered > 0 THEN ROUND((p_questions_correct::decimal / p_questions_answered) * 100) ELSE 0 END,
    p_time_spent_seconds,
    COALESCE((SELECT started_at FROM public.challenge_topic_progress WHERE user_id = p_user_id AND challenge_date = p_challenge_date AND topic_id = p_topic_id), NOW()),
    CASE WHEN p_total_questions > 0 AND p_questions_answered >= p_total_questions THEN NOW() ELSE NULL END
  )
  ON CONFLICT (user_id, challenge_date, topic_id)
  DO UPDATE SET
    quiz_session_id = COALESCE(EXCLUDED.quiz_session_id, challenge_topic_progress.quiz_session_id),
    is_started = true,
    is_completed = CASE WHEN p_total_questions > 0 AND p_questions_answered >= p_total_questions THEN true ELSE challenge_topic_progress.is_completed END,
    questions_answered = GREATEST(EXCLUDED.questions_answered, challenge_topic_progress.questions_answered),
    questions_correct = GREATEST(EXCLUDED.questions_correct, challenge_topic_progress.questions_correct),
    total_questions = GREATEST(EXCLUDED.total_questions, challenge_topic_progress.total_questions),
    score = GREATEST(EXCLUDED.score, challenge_topic_progress.score),
    accuracy_percentage = CASE 
      WHEN EXCLUDED.questions_answered > 0 
      THEN ROUND((EXCLUDED.questions_correct::decimal / EXCLUDED.questions_answered) * 100) 
      ELSE challenge_topic_progress.accuracy_percentage 
    END,
    time_spent_seconds = challenge_topic_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
    completed_at = CASE 
      WHEN p_total_questions > 0 AND p_questions_answered >= p_total_questions AND challenge_topic_progress.completed_at IS NULL
      THEN NOW() 
      ELSE challenge_topic_progress.completed_at 
    END,
    updated_at = NOW();
  
  -- Get all topic progress for this challenge
  SELECT 
    COUNT(*) as total_topics_in_challenge,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_topics_count,
    COALESCE(SUM(questions_correct), 0) as total_correct,
    COALESCE(SUM(questions_answered), 0) as total_answered,
    COALESCE(SUM(time_spent_seconds), 0) as total_time_spent,
    COALESCE(SUM(score), 0) as total_score
  INTO progress_record
  FROM public.challenge_topic_progress
  WHERE user_id = p_user_id
  AND challenge_date = p_challenge_date;
  
  -- Calculate overall progress percentage
  DECLARE
    overall_progress_percentage INTEGER := 0;
    is_challenge_completed BOOLEAN := false;
  BEGIN
    IF challenge_record.total_topics > 0 THEN
      overall_progress_percentage := ROUND((progress_record.completed_topics_count::decimal / challenge_record.total_topics) * 100);
      is_challenge_completed := progress_record.completed_topics_count >= challenge_record.total_topics;
    END IF;
  END;
  
  -- Upsert user daily progress
  INSERT INTO public.user_daily_progress (
    user_id,
    challenge_date,
    completed_topics,
    total_topics,
    progress_percentage,
    is_completed,
    completed_at,
    total_score,
    total_questions_answered,
    total_correct_answers,
    accuracy_percentage,
    time_spent_seconds,
    xp_earned
  ) VALUES (
    p_user_id,
    p_challenge_date,
    (SELECT jsonb_agg(topic_id) FROM public.challenge_topic_progress WHERE user_id = p_user_id AND challenge_date = p_challenge_date AND is_completed = true),
    challenge_record.total_topics,
    overall_progress_percentage,
    is_challenge_completed,
    CASE WHEN is_challenge_completed THEN NOW() ELSE NULL END,
    progress_record.total_score,
    progress_record.total_answered,
    progress_record.total_correct,
    CASE WHEN progress_record.total_answered > 0 THEN ROUND((progress_record.total_correct::decimal / progress_record.total_answered) * 100) ELSE 0 END,
    progress_record.total_time_spent,
    progress_record.total_score * 10 + CASE WHEN is_challenge_completed THEN 100 ELSE 0 END
  )
  ON CONFLICT (user_id, challenge_date)
  DO UPDATE SET
    completed_topics = (SELECT jsonb_agg(topic_id) FROM public.challenge_topic_progress WHERE user_id = p_user_id AND challenge_date = p_challenge_date AND is_completed = true),
    progress_percentage = overall_progress_percentage,
    is_completed = is_challenge_completed,
    completed_at = CASE 
      WHEN is_challenge_completed AND user_daily_progress.completed_at IS NULL 
      THEN NOW() 
      ELSE user_daily_progress.completed_at 
    END,
    total_score = progress_record.total_score,
    total_questions_answered = progress_record.total_answered,
    total_correct_answers = progress_record.total_correct,
    accuracy_percentage = CASE WHEN progress_record.total_answered > 0 THEN ROUND((progress_record.total_correct::decimal / progress_record.total_answered) * 100) ELSE 0 END,
    time_spent_seconds = progress_record.total_time_spent,
    xp_earned = progress_record.total_score * 10 + CASE WHEN is_challenge_completed AND user_daily_progress.is_completed = false THEN 100 ELSE 0 END,
    updated_at = NOW();
  
  -- Update streaks if challenge was just completed
  IF is_challenge_completed THEN
    PERFORM update_user_streak(p_user_id, p_challenge_date);
  END IF;
  
  -- Return updated progress
  SELECT * INTO updated_progress
  FROM public.user_daily_progress
  WHERE user_id = p_user_id
  AND challenge_date = p_challenge_date;
  
  RETURN json_build_object(
    'success', true,
    'progress', row_to_json(updated_progress),
    'challenge_completed', is_challenge_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_completion_date DATE)
RETURNS JSON AS $$
DECLARE
  streak_record RECORD;
  consecutive_days INTEGER := 1;
  current_date DATE := p_completion_date;
  check_date DATE;
BEGIN
  -- Calculate consecutive days working backwards from completion date
  check_date := p_completion_date - INTERVAL '1 day';
  
  WHILE EXISTS (
    SELECT 1 FROM public.user_daily_progress 
    WHERE user_id = p_user_id 
    AND challenge_date = check_date 
    AND is_completed = true
  ) LOOP
    consecutive_days := consecutive_days + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  -- Get current streak record
  SELECT * INTO streak_record
  FROM public.daily_challenge_streaks
  WHERE user_id = p_user_id;
  
  -- Upsert streak record
  INSERT INTO public.daily_challenge_streaks (
    user_id,
    current_streak,
    current_streak_start_date,
    current_streak_end_date,
    longest_streak,
    longest_streak_start_date,
    longest_streak_end_date,
    total_challenges_completed,
    total_days_participated,
    last_completed_date,
    last_activity_date
  ) VALUES (
    p_user_id,
    consecutive_days,
    p_completion_date - (consecutive_days - 1),
    p_completion_date,
    consecutive_days,
    p_completion_date - (consecutive_days - 1),
    p_completion_date,
    1,
    1,
    p_completion_date,
    p_completion_date
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_streak = consecutive_days,
    current_streak_start_date = p_completion_date - (consecutive_days - 1),
    current_streak_end_date = p_completion_date,
    longest_streak = GREATEST(daily_challenge_streaks.longest_streak, consecutive_days),
    longest_streak_start_date = CASE 
      WHEN consecutive_days > daily_challenge_streaks.longest_streak 
      THEN p_completion_date - (consecutive_days - 1)
      ELSE daily_challenge_streaks.longest_streak_start_date 
    END,
    longest_streak_end_date = CASE 
      WHEN consecutive_days > daily_challenge_streaks.longest_streak 
      THEN p_completion_date
      ELSE daily_challenge_streaks.longest_streak_end_date 
    END,
    total_challenges_completed = daily_challenge_streaks.total_challenges_completed + 1,
    last_completed_date = p_completion_date,
    last_activity_date = p_completion_date,
    updated_at = NOW();
  
  RETURN json_build_object('success', true, 'current_streak', consecutive_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_topic_progress ENABLE ROW LEVEL SECURITY;

-- Daily challenges: readable by all authenticated users
CREATE POLICY "daily_challenges_read" ON public.daily_challenges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Daily challenges: only admins can modify
CREATE POLICY "daily_challenges_admin" ON public.daily_challenges
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User daily progress: users can only see their own data
CREATE POLICY "user_daily_progress_own" ON public.user_daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- Daily challenge streaks: users can only see their own data
CREATE POLICY "daily_challenge_streaks_own" ON public.daily_challenge_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Challenge topic progress: users can only see their own data
CREATE POLICY "challenge_topic_progress_own" ON public.challenge_topic_progress
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================================================
-- 8. INITIAL DATA SETUP
-- =====================================================================================

-- Create daily challenges for the past 30 days and next 7 days
DO $$
DECLARE
  challenge_date DATE;
BEGIN
  FOR i IN -30..7 LOOP
    challenge_date := CURRENT_DATE + (i || ' days')::interval;
    PERFORM get_or_create_daily_challenge(challenge_date);
  END LOOP;
END $$;

COMMIT; 