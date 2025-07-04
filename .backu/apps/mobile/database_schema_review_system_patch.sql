-- ============================================================================
-- CIVICSENSE REVIEW SYSTEM MIGRATION PATCH
-- Fixes foreign key relationships and missing triggers
-- REQUIRES COMPLETION TO REVIEW
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE CONTENT COMPLETION TRACKING TABLE
-- ============================================================================

-- Track user completion of various content types
CREATE TABLE IF NOT EXISTS public.content_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('topic', 'question', 'public_figure', 'collection', 'quiz_session', 'source', 'category', 'lesson')),
  content_id TEXT NOT NULL,
  content_title TEXT NOT NULL,
  
  -- Completion details
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completion_score DECIMAL(5,2), -- Quiz score, lesson progress, etc.
  time_spent_seconds INTEGER, -- Time spent on content
  completion_method TEXT DEFAULT 'standard' CHECK (completion_method IN ('standard', 'skip', 'partial', 'full')),
  
  -- Performance metrics
  correct_answers INTEGER, -- For quizzes
  total_questions INTEGER, -- For quizzes
  attempts_count INTEGER DEFAULT 1, -- Number of attempts before completion
  
  -- Difficulty assessment
  perceived_difficulty TEXT CHECK (perceived_difficulty IN ('too_easy', 'just_right', 'too_hard')),
  
  -- Verification
  is_verified_completion BOOLEAN DEFAULT false, -- Anti-cheat verification
  completion_metadata JSONB DEFAULT '{}', -- Additional context
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one completion record per user per content
  UNIQUE(user_id, content_type, content_id)
);

-- ============================================================================
-- ADD MISSING FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Add foreign key from content_reviews to reviewer_profiles via user_id
-- This enables proper joins in queries
ALTER TABLE public.content_reviews 
ADD CONSTRAINT content_reviews_reviewer_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.reviewer_profiles(user_id) 
ON DELETE CASCADE;

-- Add completion requirement to reviews
ALTER TABLE public.content_reviews 
ADD COLUMN IF NOT EXISTS completion_id UUID REFERENCES public.content_completions(id) ON DELETE SET NULL;

-- ============================================================================
-- CREATE COMPLETION VALIDATION FUNCTIONS
-- ============================================================================

-- Function to check if user has completed content before allowing review
CREATE OR REPLACE FUNCTION validate_completion_before_review()
RETURNS TRIGGER AS $$
DECLARE
  completion_exists BOOLEAN;
BEGIN
  -- Check if user has completed this content
  SELECT EXISTS(
    SELECT 1 FROM public.content_completions 
    WHERE user_id = NEW.user_id 
    AND content_type = NEW.content_type 
    AND content_id = NEW.content_id
  ) INTO completion_exists;
  
  -- Prevent review if not completed
  IF NOT completion_exists THEN
    RAISE EXCEPTION 'Cannot review content without completing it first. Content Type: %, Content ID: %', 
      NEW.content_type, NEW.content_id;
  END IF;
  
  -- Link the completion to the review
  SELECT id INTO NEW.completion_id
  FROM public.content_completions 
  WHERE user_id = NEW.user_id 
  AND content_type = NEW.content_type 
  AND content_id = NEW.content_id
  ORDER BY completed_at DESC 
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate completion before review
DROP TRIGGER IF EXISTS validate_completion_before_review_trigger ON public.content_reviews;
CREATE TRIGGER validate_completion_before_review_trigger
  BEFORE INSERT OR UPDATE ON public.content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION validate_completion_before_review();

-- ============================================================================
-- CREATE AUTOMATIC REVIEWER PROFILE CREATION
-- ============================================================================

-- Function to automatically create reviewer profile when user submits first review
CREATE OR REPLACE FUNCTION create_reviewer_profile_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if reviewer profile exists
  IF NOT EXISTS (
    SELECT 1 FROM public.reviewer_profiles 
    WHERE user_id = NEW.user_id
  ) THEN
    -- Create basic reviewer profile
    INSERT INTO public.reviewer_profiles (
      user_id,
      display_name,
      expertise_areas,
      review_count,
      helpful_votes_received,
      civic_engagement_score,
      is_verified,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      COALESCE(
        (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = NEW.user_id),
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.user_id),
        'Anonymous Reviewer'
      ),
      '{}', -- Empty expertise areas initially
      1, -- First review
      0, -- No helpful votes yet
      0, -- Default civic engagement score
      false, -- Not verified initially
      NOW(),
      NOW()
    );
  ELSE
    -- Update review count for existing profile
    UPDATE public.reviewer_profiles 
    SET 
      review_count = review_count + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create reviewer profiles (after completion validation)
DROP TRIGGER IF EXISTS create_reviewer_profile_trigger ON public.content_reviews;
CREATE TRIGGER create_reviewer_profile_trigger
  AFTER INSERT ON public.content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_reviewer_profile_if_not_exists();

-- ============================================================================
-- CREATE REVIEW SUMMARY UPDATE TRIGGERS
-- ============================================================================

-- Function to update review summaries when reviews change
CREATE OR REPLACE FUNCTION update_review_summary()
RETURNS TRIGGER AS $$
DECLARE
  content_type_val TEXT;
  content_id_val TEXT;
  avg_rating DECIMAL(3,2);
  total_count INTEGER;
  rating_dist JSONB;
BEGIN
  -- Get content info from NEW or OLD record
  content_type_val := COALESCE(NEW.content_type, OLD.content_type);
  content_id_val := COALESCE(NEW.content_id, OLD.content_id);
  
  -- Calculate new statistics (only from completed users)
  SELECT 
    ROUND(AVG(rating), 2),
    COUNT(*),
    jsonb_build_object(
      'five_star', COUNT(*) FILTER (WHERE rating = 5),
      'four_star', COUNT(*) FILTER (WHERE rating = 4),
      'three_star', COUNT(*) FILTER (WHERE rating = 3),
      'two_star', COUNT(*) FILTER (WHERE rating = 2),
      'one_star', COUNT(*) FILTER (WHERE rating = 1)
    )
  INTO avg_rating, total_count, rating_dist
  FROM public.content_reviews
  WHERE content_type = content_type_val 
    AND content_id = content_id_val
    AND is_public = true
    AND is_flagged = false
    AND completion_id IS NOT NULL; -- Only count reviews from users who completed content
  
  -- Upsert review summary
  INSERT INTO public.review_summaries (
    content_type,
    content_id,
    average_rating,
    total_reviews,
    rating_distribution,
    last_updated
  ) VALUES (
    content_type_val,
    content_id_val,
    COALESCE(avg_rating, 0),
    COALESCE(total_count, 0),
    COALESCE(rating_dist, '{"five_star":0,"four_star":0,"three_star":0,"two_star":0,"one_star":0}'::jsonb),
    NOW()
  )
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    rating_distribution = EXCLUDED.rating_distribution,
    last_updated = EXCLUDED.last_updated;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for review summary updates
DROP TRIGGER IF EXISTS update_review_summary_trigger ON public.content_reviews;
CREATE TRIGGER update_review_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_summary();

-- ============================================================================
-- CREATE HELPFULNESS COUNT UPDATE TRIGGERS
-- ============================================================================

-- Function to update helpfulness counts when votes change
CREATE OR REPLACE FUNCTION update_helpfulness_counts()
RETURNS TRIGGER AS $$
DECLARE
  review_id_val UUID;
  helpful_count_val INTEGER;
  not_helpful_count_val INTEGER;
BEGIN
  -- Get review ID from NEW or OLD record
  review_id_val := COALESCE(NEW.review_id, OLD.review_id);
  
  -- Calculate new counts
  SELECT 
    COUNT(*) FILTER (WHERE is_helpful = true),
    COUNT(*) FILTER (WHERE is_helpful = false)
  INTO helpful_count_val, not_helpful_count_val
  FROM public.review_helpfulness_votes
  WHERE review_id = review_id_val;
  
  -- Update review counts
  UPDATE public.content_reviews
  SET 
    helpful_count = COALESCE(helpful_count_val, 0),
    not_helpful_count = COALESCE(not_helpful_count_val, 0)
  WHERE id = review_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for helpfulness count updates
DROP TRIGGER IF EXISTS update_helpfulness_counts_trigger ON public.review_helpfulness_votes;
CREATE TRIGGER update_helpfulness_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.review_helpfulness_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_helpfulness_counts();

-- ============================================================================
-- CREATE COMPLETION HELPER FUNCTIONS
-- ============================================================================

-- Function to mark content as completed
CREATE OR REPLACE FUNCTION mark_content_completed(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT,
  p_content_title TEXT,
  p_completion_score DECIMAL DEFAULT NULL,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_correct_answers INTEGER DEFAULT NULL,
  p_total_questions INTEGER DEFAULT NULL,
  p_perceived_difficulty TEXT DEFAULT NULL,
  p_completion_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  completion_id UUID;
BEGIN
  -- Insert or update completion record
  INSERT INTO public.content_completions (
    user_id,
    content_type,
    content_id,
    content_title,
    completion_score,
    time_spent_seconds,
    correct_answers,
    total_questions,
    perceived_difficulty,
    completion_metadata,
    is_verified_completion
  ) VALUES (
    p_user_id,
    p_content_type,
    p_content_id,
    p_content_title,
    p_completion_score,
    p_time_spent_seconds,
    p_correct_answers,
    p_total_questions,
    p_perceived_difficulty,
    p_completion_metadata,
    true -- Mark as verified
  )
  ON CONFLICT (user_id, content_type, content_id)
  DO UPDATE SET
    completion_score = GREATEST(content_completions.completion_score, EXCLUDED.completion_score),
    time_spent_seconds = COALESCE(EXCLUDED.time_spent_seconds, content_completions.time_spent_seconds),
    correct_answers = GREATEST(COALESCE(content_completions.correct_answers, 0), COALESCE(EXCLUDED.correct_answers, 0)),
    total_questions = COALESCE(EXCLUDED.total_questions, content_completions.total_questions),
    attempts_count = content_completions.attempts_count + 1,
    perceived_difficulty = COALESCE(EXCLUDED.perceived_difficulty, content_completions.perceived_difficulty),
    completion_metadata = content_completions.completion_metadata || EXCLUDED.completion_metadata,
    updated_at = NOW()
  RETURNING id INTO completion_id;
  
  RETURN completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review content
CREATE OR REPLACE FUNCTION can_user_review_content(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has completed the content
  RETURN EXISTS(
    SELECT 1 FROM public.content_completions 
    WHERE user_id = p_user_id 
    AND content_type = p_content_type 
    AND content_id = p_content_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on content_completions
ALTER TABLE public.content_completions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own completions
CREATE POLICY "content_completions_own_data" ON public.content_completions
    FOR ALL USING (auth.uid() = user_id);

-- Update reviewer profiles policies to allow reading for review joins
DROP POLICY IF EXISTS "reviewer_profiles_select_all" ON public.reviewer_profiles;
CREATE POLICY "reviewer_profiles_select_all" ON public.reviewer_profiles
    FOR SELECT USING (true);

-- Allow users to update their own reviewer profile  
DROP POLICY IF EXISTS "reviewer_profiles_update_own" ON public.reviewer_profiles;
CREATE POLICY "reviewer_profiles_update_own" ON public.reviewer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow automatic creation of reviewer profiles
DROP POLICY IF EXISTS "reviewer_profiles_insert_system" ON public.reviewer_profiles;
CREATE POLICY "reviewer_profiles_insert_system" ON public.reviewer_profiles
    FOR INSERT WITH CHECK (true);

-- Update content_reviews policies to require completion
DROP POLICY IF EXISTS "content_reviews_own_data" ON public.content_reviews;
CREATE POLICY "content_reviews_own_data" ON public.content_reviews
    FOR ALL USING (
      auth.uid() = user_id 
      OR (
        -- Allow reading public reviews
        is_public = true 
        AND is_flagged = false
      )
    );

-- Only allow inserting reviews if user completed content
CREATE POLICY "content_reviews_insert_completed_only" ON public.content_reviews
    FOR INSERT WITH CHECK (
      auth.uid() = user_id 
      AND can_user_review_content(auth.uid(), content_type, content_id)
    );

-- ============================================================================
-- CREATE HELPFUL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for content completions
CREATE INDEX IF NOT EXISTS idx_content_completions_user_content 
ON public.content_completions(user_id, content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_content_completions_content_lookup 
ON public.content_completions(content_type, content_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_completions_completion_score 
ON public.content_completions(completion_score DESC) WHERE completion_score IS NOT NULL;

-- Index for faster review lookups
CREATE INDEX IF NOT EXISTS idx_content_reviews_content_lookup 
ON public.content_reviews(content_type, content_id, is_public, is_flagged);

-- Index for user's reviews
CREATE INDEX IF NOT EXISTS idx_content_reviews_user_content 
ON public.content_reviews(user_id, content_type, content_id);

-- Index for completion-linked reviews
CREATE INDEX IF NOT EXISTS idx_content_reviews_completion_link 
ON public.content_reviews(completion_id) WHERE completion_id IS NOT NULL;

-- Index for helpfulness votes
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_votes_review 
ON public.review_helpfulness_votes(review_id);

-- Index for helpfulness votes by user
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_votes_user 
ON public.review_helpfulness_votes(user_id, review_id);

-- Index for review summaries
CREATE INDEX IF NOT EXISTS idx_review_summaries_content 
ON public.review_summaries(content_type, content_id);

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions for authenticated users
GRANT SELECT ON public.content_reviews TO authenticated;
GRANT INSERT, UPDATE ON public.content_reviews TO authenticated;
GRANT DELETE ON public.content_reviews TO authenticated; -- Users can delete their own reviews via RLS

GRANT SELECT ON public.reviewer_profiles TO authenticated;
GRANT INSERT, UPDATE ON public.reviewer_profiles TO authenticated;

GRANT SELECT ON public.review_summaries TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_helpfulness_votes TO authenticated;

-- Grant permissions for content completions
GRANT SELECT, INSERT, UPDATE ON public.content_completions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION mark_content_completed TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_review_content TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'CivicSense Review System Migration Patch Applied Successfully';
  RAISE NOTICE 'Added completion tracking and validation';
  RAISE NOTICE 'Only users who complete content can now review it';
  RAISE NOTICE 'Review system is now fully operational with completion requirements';
END $$; 