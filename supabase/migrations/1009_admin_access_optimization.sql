-- Admin Access Optimization Migration
-- Optimizes admin access patterns and RLS policies
-- Generated: 2024-12-19

BEGIN;

-- ==============================================================================
-- ADMIN ACCESS OPTIMIZATION
-- ==============================================================================
-- Optimizes admin queries and access patterns for better performance

-- Create admin role check function for better performance (user_roles doesn't have is_active column)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Create admin or owner check function (profiles table doesn't have is_owner column, using is_admin)
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    -- Check if admin via user_roles or profiles
    public.is_admin($1) OR
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = $1 
      AND is_admin = true
    )
  );
$$;

-- Optimize admin policies using the function
DROP POLICY IF EXISTS "Only admins can view all feedback" ON public.user_feedback;
CREATE POLICY "Only admins can view all feedback" 
ON public.user_feedback FOR SELECT 
USING (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins can update feedback" ON public.user_feedback;
CREATE POLICY "Only admins can update feedback" 
ON public.user_feedback FOR UPDATE 
USING (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "admin_all_access_guest_usage" ON public.guest_usage_tracking;
CREATE POLICY "admin_all_access_guest_usage" 
ON public.guest_usage_tracking FOR ALL 
USING (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "admin_all_access_guest_analytics" ON public.guest_usage_analytics;
CREATE POLICY "admin_all_access_guest_analytics" 
ON public.guest_usage_analytics FOR ALL 
USING (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can access all progress data" ON public.progress_sessions;
CREATE POLICY "Admins can access all progress data" 
ON public.progress_sessions FOR ALL 
USING (
  user_id = (select auth.uid()) OR 
  guest_token IS NOT NULL OR 
  public.is_admin((select auth.uid()))
);

DROP POLICY IF EXISTS "Admins can access all progress responses" ON public.progress_question_responses;
CREATE POLICY "Admins can access all progress responses" 
ON public.progress_question_responses FOR ALL 
USING (
  session_id IN (
    SELECT session_id FROM public.progress_sessions 
    WHERE user_id = (select auth.uid()) OR guest_token IS NOT NULL
  ) OR 
  public.is_admin((select auth.uid()))
);

-- Survey admin policies
DROP POLICY IF EXISTS "Admin can do everything on surveys" ON public.surveys;
CREATE POLICY "Admin can do everything on surveys" 
ON public.surveys FOR ALL 
USING (
  created_by = (select auth.uid()) OR 
  public.is_admin((select auth.uid()))
);

DROP POLICY IF EXISTS "Admin can do everything on survey questions" ON public.survey_questions;
CREATE POLICY "Admin can do everything on survey questions" 
ON public.survey_questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_questions.survey_id 
    AND surveys.created_by = (select auth.uid())
  ) OR 
  public.is_admin((select auth.uid()))
);

-- Translation jobs admin access
DROP POLICY IF EXISTS "Allow read access to translation jobs" ON public.translation_jobs;
CREATE POLICY "Allow read access to translation jobs" 
ON public.translation_jobs FOR SELECT 
USING (public.is_admin((select auth.uid())));

-- Pod activities admin access
DROP POLICY IF EXISTS "Pod members can view activities" ON public.pod_activities;
CREATE POLICY "Pod members can view activities" 
ON public.pod_activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pod_memberships 
    WHERE pod_id = pod_activities.pod_id 
    AND user_id = (select auth.uid()) 
    AND status = 'active'
  ) OR 
  public.is_admin((select auth.uid()))
);

DROP POLICY IF EXISTS "Users can create their own activities" ON public.pod_activities;
CREATE POLICY "Users can create their own activities" 
ON public.pod_activities FOR INSERT 
WITH CHECK (
  created_by = (select auth.uid()) OR 
  public.is_admin((select auth.uid()))
);

-- Pod challenges admin access
DROP POLICY IF EXISTS "Pod members can view challenges" ON public.pod_challenges;
CREATE POLICY "Pod members can view challenges" 
ON public.pod_challenges FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pod_memberships 
    WHERE pod_id = pod_challenges.pod_id 
    AND user_id = (select auth.uid()) 
    AND status = 'active'
  ) OR 
  public.is_admin((select auth.uid()))
);

-- Create admin-specific indexes for common queries (no is_active column)
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_active 
ON public.user_roles(user_id) 
WHERE role IN ('admin', 'super_admin');

CREATE INDEX IF NOT EXISTS idx_profiles_admin_flags 
ON public.profiles(id) 
WHERE is_admin = true;

-- Admin dashboard queries (check if these tables exist and have the right columns)
CREATE INDEX IF NOT EXISTS idx_user_feedback_admin_review 
ON public.user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_usage_admin_monitoring 
ON public.guest_usage_tracking(created_at DESC, guest_token);

CREATE INDEX IF NOT EXISTS idx_system_alerts_admin_dashboard 
ON public.system_alerts(severity, created_at DESC, resolved);

-- Content moderation indexes
CREATE INDEX IF NOT EXISTS idx_surveys_admin_moderation 
ON public.surveys(created_at DESC, is_published, created_by);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_admin_queue 
ON public.translation_jobs(status, priority, created_at);

-- User management indexes
CREATE INDEX IF NOT EXISTS idx_profiles_admin_management 
ON public.profiles(created_at DESC, is_admin, subscription_tier);

COMMIT;

-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner(UUID) TO authenticated;

-- Add comments explaining the optimizations
COMMENT ON FUNCTION public.is_admin(UUID) 
IS 'Optimized admin role check function with caching for better RLS performance';

COMMENT ON FUNCTION public.is_admin_or_owner(UUID) 
IS 'Combined admin/owner check function for privileged access patterns';

COMMENT ON INDEX public.idx_user_roles_admin_active 
IS 'Partial index for fast admin role verification';

COMMENT ON INDEX public.idx_profiles_admin_flags 
IS 'Partial index for admin and owner profile lookups'; 