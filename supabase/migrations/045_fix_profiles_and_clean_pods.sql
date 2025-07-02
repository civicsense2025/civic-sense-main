-- ============================================================================
-- MIGRATION: Fix Pod Relationships Without Modifying Profiles
-- Purpose: Add foreign key relationships and create proper views for pod queries
-- Date: 2025-01-21
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CLEAN UP ANY EXISTING BROKEN OBJECTS
-- ============================================================================

-- Drop any existing objects from previous attempts
DROP VIEW IF EXISTS public.pod_member_details CASCADE;
DROP VIEW IF EXISTS public.pod_activity_details CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_pod_analytics_today(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_pod_analytics(UUID, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;

-- ============================================================================
-- 2. ADD PROPER FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key from pod_memberships to profiles (with proper error handling)
DO $$ 
BEGIN 
  -- First, clean up any orphaned records
  DELETE FROM public.pod_memberships 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  -- Add the constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pod_memberships_user_id_profiles_fkey'
    AND table_name = 'pod_memberships'
  ) THEN
    ALTER TABLE public.pod_memberships 
    ADD CONSTRAINT pod_memberships_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from pod_member_analytics to profiles
DO $$ 
BEGIN 
  -- Clean up orphaned records
  DELETE FROM public.pod_member_analytics 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pod_member_analytics_user_id_profiles_fkey'
    AND table_name = 'pod_member_analytics'
  ) THEN
    ALTER TABLE public.pod_member_analytics 
    ADD CONSTRAINT pod_member_analytics_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from pod_activities to profiles
DO $$ 
BEGIN 
  -- Clean up orphaned records
  DELETE FROM public.pod_activities 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pod_activities_user_id_profiles_fkey'
    AND table_name = 'pod_activities'
  ) THEN
    ALTER TABLE public.pod_activities 
    ADD CONSTRAINT pod_activities_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE/RECREATE MISSING TABLES WITH PROPER STRUCTURE
-- ============================================================================

-- Ensure pod_analytics table exists with proper structure
CREATE TABLE IF NOT EXISTS public.pod_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pod_id UUID NOT NULL REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_members INTEGER DEFAULT 0,
  active_members_today INTEGER DEFAULT 0,
  active_members_week INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  total_quiz_attempts INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  average_session_length_minutes DECIMAL(8,2) DEFAULT 0,
  total_achievements_earned INTEGER DEFAULT 0,
  total_streaks_started INTEGER DEFAULT 0,
  new_members_today INTEGER DEFAULT 0,
  multiplayer_sessions INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  friend_requests_sent INTEGER DEFAULT 0,
  most_popular_topics JSONB DEFAULT '[]'::jsonb,
  category_performance JSONB DEFAULT '{}'::jsonb,
  difficulty_distribution JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pod_id, date_recorded)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pod_analytics_pod_id_date 
ON public.pod_analytics(pod_id, date_recorded DESC);

CREATE INDEX IF NOT EXISTS idx_pod_analytics_date_recorded 
ON public.pod_analytics(date_recorded DESC);

-- ============================================================================
-- 4. CREATE HELPER VIEWS THAT JOIN WITH AUTH.USERS FOR EMAIL
-- ============================================================================

-- Pod member details view (joining profiles with auth.users for email)
CREATE OR REPLACE VIEW public.pod_member_details AS
SELECT 
  pm.pod_id,
  pm.user_id,
  pm.role,
  pm.membership_status,
  pm.joined_at,
  pm.can_invite_members,
  pm.can_message,
  pm.can_view_progress,
  pm.can_modify_settings,
  p.full_name,
  p.avatar_url,
  au.email
FROM public.pod_memberships pm
LEFT JOIN public.profiles p ON pm.user_id = p.id
LEFT JOIN auth.users au ON pm.user_id = au.id
WHERE pm.membership_status IN ('active', 'pending');

-- Pod activities view with user details (including email from auth.users)
CREATE OR REPLACE VIEW public.pod_activity_details AS
SELECT 
  pa.id,
  pa.pod_id,
  pa.user_id,
  pa.activity_type,
  pa.activity_data,
  pa.created_at,
  p.full_name as user_name,
  au.email as user_email,
  lp.pod_name
FROM public.pod_activities pa
LEFT JOIN public.profiles p ON pa.user_id = p.id
LEFT JOIN auth.users au ON pa.user_id = au.id
LEFT JOIN public.learning_pods lp ON pa.pod_id = lp.id
ORDER BY pa.created_at DESC;

-- ============================================================================
-- 5. UPDATE RLS POLICIES
-- ============================================================================

-- Enable RLS on pod_analytics if not already enabled
ALTER TABLE public.pod_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Pod analytics access for members" ON public.pod_analytics;
DROP POLICY IF EXISTS "Pod analytics insert for admins" ON public.pod_analytics;

CREATE POLICY "Pod analytics access for members" ON public.pod_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pod_memberships pm
    WHERE pm.pod_id = pod_analytics.pod_id
    AND pm.user_id = auth.uid()
    AND pm.membership_status = 'active'
  )
);

CREATE POLICY "Pod analytics insert for admins" ON public.pod_analytics
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pod_memberships pm
    WHERE pm.pod_id = pod_analytics.pod_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
    AND pm.membership_status = 'active'
  )
);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to get or create today's pod analytics record
CREATE OR REPLACE FUNCTION public.get_or_create_pod_analytics_today(p_pod_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_id UUID;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Try to get existing record for today
  SELECT id INTO analytics_id
  FROM public.pod_analytics
  WHERE pod_id = p_pod_id AND date_recorded = today_date;
  
  -- If no record exists, create one
  IF analytics_id IS NULL THEN
    INSERT INTO public.pod_analytics (pod_id, date_recorded)
    VALUES (p_pod_id, today_date)
    RETURNING id INTO analytics_id;
  END IF;
  
  RETURN analytics_id;
END;
$$;

-- Function to update pod analytics
CREATE OR REPLACE FUNCTION public.update_pod_analytics(
  p_pod_id UUID,
  p_questions_answered INTEGER DEFAULT 0,
  p_correct_answers INTEGER DEFAULT 0,
  p_quiz_attempts INTEGER DEFAULT 1,
  p_time_spent_minutes INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Upsert analytics record
  INSERT INTO public.pod_analytics (
    pod_id,
    date_recorded,
    total_questions_answered,
    total_correct_answers,
    total_quiz_attempts,
    total_time_spent_minutes
  )
  VALUES (
    p_pod_id,
    today_date,
    p_questions_answered,
    p_correct_answers,
    p_quiz_attempts,
    p_time_spent_minutes
  )
  ON CONFLICT (pod_id, date_recorded)
  DO UPDATE SET
    total_questions_answered = pod_analytics.total_questions_answered + EXCLUDED.total_questions_answered,
    total_correct_answers = pod_analytics.total_correct_answers + EXCLUDED.total_correct_answers,
    total_quiz_attempts = pod_analytics.total_quiz_attempts + EXCLUDED.total_quiz_attempts,
    total_time_spent_minutes = pod_analytics.total_time_spent_minutes + EXCLUDED.total_time_spent_minutes,
    average_accuracy = CASE 
      WHEN (pod_analytics.total_questions_answered + EXCLUDED.total_questions_answered) > 0 
      THEN ROUND(
        ((pod_analytics.total_correct_answers + EXCLUDED.total_correct_answers)::DECIMAL / 
         (pod_analytics.total_questions_answered + EXCLUDED.total_questions_answered)) * 100, 2
      )
      ELSE 0 
    END;
END;
$$;

-- ============================================================================
-- 7. REFRESH SCHEMA CACHE
-- ============================================================================

-- Refresh the schema cache to make sure Supabase recognizes the new relationships
NOTIFY pgrst, 'reload schema';

COMMIT; 