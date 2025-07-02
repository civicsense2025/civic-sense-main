-- Fix pod database schema issues
-- This migration addresses foreign key relationships, missing tables, and RLS policies

BEGIN;

-- ============================================================================
-- 1. CREATE MISSING TABLES AND RELATIONSHIPS
-- ============================================================================

-- Ensure profiles table exists (for user information)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. FIX POD_ACTIVITIES TABLE STRUCTURE
-- ============================================================================

-- Check if pod_activities exists, if not create it
CREATE TABLE IF NOT EXISTS public.pod_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.pod_activities 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pod_activities_pod_id ON public.pod_activities(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_activities_user_id ON public.pod_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_pod_activities_created_at ON public.pod_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pod_activities_type ON public.pod_activities(activity_type);

-- Enable RLS
ALTER TABLE public.pod_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for pod_activities (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Pod members can view activities" ON public.pod_activities;
CREATE POLICY "Pod members can view activities" ON public.pod_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_activities.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.membership_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Pod members can insert activities" ON public.pod_activities;
CREATE POLICY "Pod members can insert activities" ON public.pod_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_activities.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.membership_status = 'active'
    )
  );

-- ============================================================================
-- 3. ENSURE POD_MEMBER_ANALYTICS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pod_member_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pod_id, user_id, date_recorded)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pod_member_analytics_pod_user ON public.pod_member_analytics(pod_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pod_member_analytics_date ON public.pod_member_analytics(date_recorded DESC);

-- Enable RLS
ALTER TABLE public.pod_member_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Pod members can view analytics" ON public.pod_member_analytics;
CREATE POLICY "Pod members can view analytics" ON public.pod_member_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_member_analytics.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.membership_status = 'active'
    )
  );

DROP POLICY IF EXISTS "System can insert/update analytics" ON public.pod_member_analytics;
CREATE POLICY "System can insert/update analytics" ON public.pod_member_analytics
  FOR ALL USING (true);

-- ============================================================================
-- 4. ENSURE POD_ANALYTICS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pod_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0.00,
  quiz_completions INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pod_id, date_recorded)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pod_analytics_pod_id ON public.pod_analytics(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_analytics_date ON public.pod_analytics(date_recorded DESC);

-- Enable RLS
ALTER TABLE public.pod_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Pod members can view pod analytics" ON public.pod_analytics;
CREATE POLICY "Pod members can view pod analytics" ON public.pod_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pod_memberships pm 
      WHERE pm.pod_id = pod_analytics.pod_id 
      AND pm.user_id = auth.uid() 
      AND pm.membership_status = 'active'
    )
  );

-- ============================================================================
-- 5. CREATE FUNCTION TO POPULATE PROFILES
-- ============================================================================

-- Function to ensure user has a profile
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile();

-- Populate existing users without profiles
INSERT INTO public.profiles (id, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Update display_name for all users (after column is added)
UPDATE public.profiles 
SET display_name = COALESCE(
  (SELECT au.raw_user_meta_data->>'display_name' FROM auth.users au WHERE au.id = profiles.id),
  (SELECT au.email FROM auth.users au WHERE au.id = profiles.id),
  full_name
)
WHERE display_name IS NULL;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to log pod activity safely
CREATE OR REPLACE FUNCTION public.log_pod_activity(
  p_pod_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.pod_activities (
    pod_id,
    user_id, 
    activity_type,
    activity_data
  ) VALUES (
    p_pod_id,
    p_user_id,
    p_activity_type,
    p_activity_data
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the calling operation
    RAISE WARNING 'Failed to log pod activity: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. UPDATE EXISTING DATA (IF ANY)
-- ============================================================================

-- Update any existing pod_activities to ensure they have proper structure
UPDATE public.pod_activities 
SET activity_data = COALESCE(activity_data, '{}')
WHERE activity_data IS NULL;

-- ============================================================================
-- 8. REFRESH SCHEMA CACHE
-- ============================================================================

-- Refresh the PostgREST schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema';

COMMIT; 