-- Migration: User-Generated Custom Content System
-- Date: December 2024
-- Purpose: Support freemium custom content creation with previews and full decks

BEGIN;

-- Create custom_content_generations table for tracking user generations
CREATE TABLE IF NOT EXISTS public.custom_content_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User and content info
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT, -- For guest users
  topic TEXT NOT NULL,
  description TEXT,
  
  -- Generation settings
  generation_settings JSONB NOT NULL DEFAULT '{}',
  question_count INTEGER DEFAULT 10 CHECK (question_count > 0 AND question_count <= 50),
  difficulty TEXT DEFAULT 'mixed' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  
  -- Premium features used
  is_premium_generation BOOLEAN DEFAULT FALSE,
  premium_features_used JSONB DEFAULT '{}', -- Track which premium features were used
  
  -- Generation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'preview')),
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  
  -- Content and metadata
  generated_content JSONB, -- Store the full generated content
  generation_metadata JSONB DEFAULT '{}', -- Model used, processing time, etc.
  
  -- Fact checking and quality
  fact_check_status TEXT DEFAULT 'pending' CHECK (fact_check_status IN ('pending', 'verified', 'partially_verified', 'unverified', 'failed')),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  source_credibility_average DECIMAL(3,2) CHECK (source_credibility_average >= 0 AND source_credibility_average <= 1),
  
  -- Publishing and sharing
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  is_preview_only BOOLEAN DEFAULT TRUE, -- Free users get preview-only
  
  -- CivicSense brand compliance
  civic_standards_score INTEGER CHECK (civic_standards_score >= 0 AND civic_standards_score <= 100),
  reveals_uncomfortable_truths BOOLEAN DEFAULT FALSE,
  names_specific_institutions BOOLEAN DEFAULT FALSE,
  provides_action_steps BOOLEAN DEFAULT FALSE,
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create custom_content_questions table for storing individual questions
CREATE TABLE IF NOT EXISTS public.custom_content_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to generation
  generation_id UUID REFERENCES public.custom_content_generations(id) ON DELETE CASCADE,
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- For multiple choice questions
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  
  -- Difficulty and categorization
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- CivicSense specific fields
  uncomfortable_truths TEXT[],
  power_dynamics_revealed TEXT[],
  action_steps JSONB DEFAULT '[]',
  
  -- Question quality and sources
  civic_relevance_score INTEGER CHECK (civic_relevance_score >= 0 AND civic_relevance_score <= 100),
  fact_check_status TEXT DEFAULT 'verified' CHECK (fact_check_status IN ('verified', 'partially_verified', 'unverified')),
  sources JSONB DEFAULT '[]', -- Array of source objects
  
  -- Ordering and display
  question_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_generation_usage table for tracking freemium limits
CREATE TABLE IF NOT EXISTS public.user_generation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_token TEXT, -- For guest users
  
  -- Usage tracking
  total_generations INTEGER DEFAULT 0,
  free_generations_used INTEGER DEFAULT 0,
  premium_generations_used INTEGER DEFAULT 0,
  
  -- Limits and status
  free_generation_limit INTEGER DEFAULT 1,
  has_used_free_trial BOOLEAN DEFAULT FALSE,
  subscription_status TEXT,
  
  -- Reset tracking (for potential monthly limits)
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user
  UNIQUE(user_id),
  UNIQUE(guest_token)
);

-- Create custom_content_topics table for published content that becomes playable
CREATE TABLE IF NOT EXISTS public.custom_content_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to original generation
  generation_id UUID REFERENCES public.custom_content_generations(id) ON DELETE SET NULL,
  
  -- Topic information (extends question_topics schema)
  topic_id TEXT UNIQUE NOT NULL, -- Matches question_topics.topic_id format
  topic_title TEXT NOT NULL,
  topic_description TEXT,
  topic_emoji TEXT DEFAULT '🧠',
  
  -- Content organization
  category_name TEXT DEFAULT 'User Generated',
  difficulty_level TEXT DEFAULT 'mixed',
  estimated_time_minutes INTEGER DEFAULT 10,
  
  -- User and attribution
  created_by_user UUID REFERENCES auth.users(id),
  creator_display_name TEXT,
  
  -- Moderation and quality
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  moderation_notes TEXT,
  
  -- Engagement metrics
  play_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  user_ratings JSONB DEFAULT '[]',
  
  -- CivicSense content standards
  civic_standards_passed BOOLEAN DEFAULT FALSE,
  uncomfortable_truths_score INTEGER CHECK (uncomfortable_truths_score >= 0 AND uncomfortable_truths_score <= 100),
  actionability_score INTEGER CHECK (actionability_score >= 0 AND actionability_score <= 100),
  
  -- Publishing and availability
  is_public BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  date DATE, -- For daily content rotation
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_user_id ON public.custom_content_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_guest_token ON public.custom_content_generations(guest_token);
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_status ON public.custom_content_generations(status);
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_created_at ON public.custom_content_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_content_generations_is_published ON public.custom_content_generations(is_published);

CREATE INDEX IF NOT EXISTS idx_custom_content_questions_generation_id ON public.custom_content_questions(generation_id);
CREATE INDEX IF NOT EXISTS idx_custom_content_questions_order ON public.custom_content_questions(generation_id, question_order);

CREATE INDEX IF NOT EXISTS idx_user_generation_usage_user_id ON public.user_generation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generation_usage_guest_token ON public.user_generation_usage(guest_token);

CREATE INDEX IF NOT EXISTS idx_custom_content_topics_topic_id ON public.custom_content_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_custom_content_topics_category ON public.custom_content_topics(category_name);
CREATE INDEX IF NOT EXISTS idx_custom_content_topics_is_public ON public.custom_content_topics(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_content_topics_date ON public.custom_content_topics(date);
CREATE INDEX IF NOT EXISTS idx_custom_content_topics_created_by ON public.custom_content_topics(created_by_user);

-- Create RLS policies

-- Custom Content Generations: Users can see their own generations
ALTER TABLE public.custom_content_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_generations" ON public.custom_content_generations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (guest_token IS NOT NULL AND guest_token = current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token')
  );

CREATE POLICY "users_can_create_generations" ON public.custom_content_generations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (guest_token IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "users_can_update_own_generations" ON public.custom_content_generations
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (guest_token IS NOT NULL AND guest_token = current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token')
  );

-- Custom Content Questions: Users can see questions from their generations
ALTER TABLE public.custom_content_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_questions" ON public.custom_content_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.custom_content_generations g 
      WHERE g.id = generation_id 
      AND (
        g.user_id = auth.uid() OR 
        (g.guest_token IS NOT NULL AND g.guest_token = current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token')
      )
    )
  );

CREATE POLICY "users_can_create_questions" ON public.custom_content_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_content_generations g 
      WHERE g.id = generation_id 
      AND (
        g.user_id = auth.uid() OR 
        (g.guest_token IS NOT NULL AND g.user_id IS NULL)
      )
    )
  );

-- User Generation Usage: Users can see their own usage
ALTER TABLE public.user_generation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_usage" ON public.user_generation_usage
  FOR ALL USING (
    auth.uid() = user_id OR 
    (guest_token IS NOT NULL AND guest_token = current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token')
  );

-- Custom Content Topics: Public content is viewable by all, creators can manage their own
ALTER TABLE public.custom_content_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_topics_viewable" ON public.custom_content_topics
  FOR SELECT USING (is_public = true OR created_by_user = auth.uid());

CREATE POLICY "creators_can_manage_topics" ON public.custom_content_topics
  FOR ALL USING (created_by_user = auth.uid());

-- Create functions for common operations

-- Function to check if user can generate content
CREATE OR REPLACE FUNCTION public.can_user_generate_content(
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  usage_record RECORD;
  user_profile RECORD;
BEGIN
  -- Get user profile to check premium status
  IF p_user_id IS NOT NULL THEN
    SELECT subscription_status, is_premium 
    INTO user_profile 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    -- Premium users can always generate
    IF user_profile.subscription_status = 'active' OR user_profile.is_premium = true THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Check usage for free/guest users
  SELECT * INTO usage_record 
  FROM public.user_generation_usage 
  WHERE (
    (p_user_id IS NOT NULL AND user_id = p_user_id) OR 
    (p_guest_token IS NOT NULL AND guest_token = p_guest_token)
  );
  
  -- If no usage record exists, they can use their free trial
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Check if they have free generations remaining
  RETURN usage_record.free_generations_used < usage_record.free_generation_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_generation_usage(
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL,
  p_is_premium BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  -- Insert or update usage record
  INSERT INTO public.user_generation_usage (
    user_id,
    guest_token,
    total_generations,
    free_generations_used,
    premium_generations_used,
    has_used_free_trial
  ) VALUES (
    p_user_id,
    p_guest_token,
    1,
    CASE WHEN p_is_premium THEN 0 ELSE 1 END,
    CASE WHEN p_is_premium THEN 1 ELSE 0 END,
    NOT p_is_premium
  )
  ON CONFLICT (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(guest_token, ''))
  DO UPDATE SET
    total_generations = user_generation_usage.total_generations + 1,
    free_generations_used = CASE 
      WHEN p_is_premium THEN user_generation_usage.free_generations_used 
      ELSE user_generation_usage.free_generations_used + 1 
    END,
    premium_generations_used = CASE 
      WHEN p_is_premium THEN user_generation_usage.premium_generations_used + 1 
      ELSE user_generation_usage.premium_generations_used 
    END,
    has_used_free_trial = user_generation_usage.has_used_free_trial OR NOT p_is_premium,
    updated_at = NOW()
  RETURNING id INTO usage_id;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert preview to playable topic (premium feature)
CREATE OR REPLACE FUNCTION public.convert_preview_to_topic(
  p_generation_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  generation_record RECORD;
  topic_id TEXT;
  new_topic_id UUID;
BEGIN
  -- Get the generation record
  SELECT * INTO generation_record 
  FROM public.custom_content_generations 
  WHERE id = p_generation_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found or access denied';
  END IF;
  
  -- Check if user has premium access
  -- (This would typically check the user's subscription status)
  
  -- Generate topic_id
  topic_id := 'custom_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || LEFT(p_generation_id::TEXT, 8);
  
  -- Create the topic
  INSERT INTO public.custom_content_topics (
    generation_id,
    topic_id,
    topic_title,
    topic_description,
    created_by_user,
    creator_display_name,
    category_name,
    difficulty_level,
    estimated_time_minutes,
    is_approved,
    civic_standards_passed
  ) VALUES (
    p_generation_id,
    topic_id,
    generation_record.topic,
    generation_record.description,
    p_user_id,
    (SELECT display_name FROM public.profiles WHERE id = p_user_id),
    'User Generated',
    generation_record.difficulty,
    generation_record.question_count,
    FALSE, -- Requires moderation
    generation_record.civic_standards_score >= 70
  ) RETURNING id INTO new_topic_id;
  
  -- Update generation to mark as converted
  UPDATE public.custom_content_generations 
  SET 
    is_preview_only = FALSE,
    updated_at = NOW()
  WHERE id = p_generation_id;
  
  RETURN new_topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_content_generations_updated_at
  BEFORE UPDATE ON public.custom_content_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_generation_usage_updated_at
  BEFORE UPDATE ON public.user_generation_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_content_topics_updated_at
  BEFORE UPDATE ON public.custom_content_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.custom_content_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.custom_content_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_generation_usage TO authenticated;
GRANT SELECT ON public.custom_content_topics TO authenticated;
GRANT INSERT, UPDATE ON public.custom_content_topics TO authenticated;

GRANT EXECUTE ON FUNCTION public.can_user_generate_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_generation_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_preview_to_topic TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.custom_content_generations IS 'Tracks user-generated custom content creation sessions with freemium controls';
COMMENT ON TABLE public.custom_content_questions IS 'Individual questions within user-generated content with CivicSense standards';
COMMENT ON TABLE public.user_generation_usage IS 'Tracks user generation limits for freemium model';
COMMENT ON TABLE public.custom_content_topics IS 'Published user-generated content that becomes playable like regular topics';

COMMENT ON FUNCTION public.can_user_generate_content IS 'Checks if user can generate content based on subscription and usage limits';
COMMENT ON FUNCTION public.increment_generation_usage IS 'Increments usage count when user generates content';
COMMENT ON FUNCTION public.convert_preview_to_topic IS 'Converts preview-only content to fully playable topic (premium feature)';

COMMIT; 