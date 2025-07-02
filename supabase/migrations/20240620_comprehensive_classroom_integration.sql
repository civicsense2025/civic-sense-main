-- 20240620_comprehensive_classroom_integration.sql
-- Comprehensive Google Classroom integration with user roles
-- Follows CivicSense migration standards: additive, idempotent, fully qualified columns

BEGIN;

-- =====================================================
-- 1. USER PROFILES AND ROLES SYSTEM
-- =====================================================

-- Create user profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'member',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add role column to existing user_profiles if it doesn't exist
ALTER TABLE IF EXISTS public.user_profiles 
    ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- Create index on role for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add RLS policies for user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and public info of others
CREATE POLICY IF NOT EXISTS "Users can view profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        role IN ('teacher', 'admin', 'organizer', 'parent')
    );

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. GOOGLE CLASSROOM INTEGRATION
-- =====================================================

-- Extend learning_pods with Google Classroom integration fields
ALTER TABLE IF EXISTS public.learning_pods
    ADD COLUMN IF NOT EXISTS google_classroom_id text,
    ADD COLUMN IF NOT EXISTS classroom_sync_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS grade_passback_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS classroom_last_sync timestamptz,
    ADD COLUMN IF NOT EXISTS classroom_sync_errors jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.learning_pods.google_classroom_id IS 'Associated Google Classroom course ID';
COMMENT ON COLUMN public.learning_pods.classroom_sync_enabled IS 'Whether roster sync with Classroom is active';
COMMENT ON COLUMN public.learning_pods.grade_passback_enabled IS 'Whether quiz grades are pushed to Classroom gradebook';
COMMENT ON COLUMN public.learning_pods.classroom_last_sync IS 'Timestamp of last successful sync with Classroom';
COMMENT ON COLUMN public.learning_pods.classroom_sync_errors IS 'JSON array of recent sync errors for debugging';

-- Create index on google_classroom_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_learning_pods_classroom_id ON public.learning_pods(google_classroom_id);

-- =====================================================
-- 3. CLASSROOM USER MAPPING
-- =====================================================

-- Create mapping table between CivicSense users and Google Classroom users
CREATE TABLE IF NOT EXISTS public.classroom_user_mapping (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    civicsense_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    google_classroom_user_id text NOT NULL,
    google_email text,
    google_name text,
    profile_photo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (google_classroom_user_id),
    UNIQUE (civicsense_user_id, google_classroom_user_id)
);

COMMENT ON TABLE public.classroom_user_mapping IS 'Maps CivicSense users to their Google Classroom user profile IDs';

-- Add RLS for classroom user mapping
ALTER TABLE public.classroom_user_mapping ENABLE ROW LEVEL SECURITY;

-- Users can manage their own classroom mappings
CREATE POLICY IF NOT EXISTS "Users can manage own classroom mapping" ON public.classroom_user_mapping
    FOR ALL USING (auth.uid() = civicsense_user_id);

-- Admins can view all mappings
CREATE POLICY IF NOT EXISTS "Admins can view all classroom mappings" ON public.classroom_user_mapping
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- =====================================================
-- 4. QUIZ ATTEMPTS CLASSROOM INTEGRATION
-- =====================================================

-- Extend user_quiz_attempts for grade pass-back metadata
ALTER TABLE IF EXISTS public.user_quiz_attempts
    ADD COLUMN IF NOT EXISTS classroom_course_id text,
    ADD COLUMN IF NOT EXISTS classroom_assignment_id text,
    ADD COLUMN IF NOT EXISTS classroom_submission_id text,
    ADD COLUMN IF NOT EXISTS grade_posted_to_classroom boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS grade_post_timestamp timestamptz,
    ADD COLUMN IF NOT EXISTS grade_post_error text;

COMMENT ON COLUMN public.user_quiz_attempts.classroom_course_id IS 'Google Classroom course ID linked to this quiz attempt';
COMMENT ON COLUMN public.user_quiz_attempts.classroom_assignment_id IS 'Google Classroom assignment ID for grade passback';
COMMENT ON COLUMN public.user_quiz_attempts.classroom_submission_id IS 'Google Classroom student submission ID';
COMMENT ON COLUMN public.user_quiz_attempts.grade_posted_to_classroom IS 'Whether grade was successfully posted to Classroom';
COMMENT ON COLUMN public.user_quiz_attempts.grade_post_timestamp IS 'When grade was posted to Classroom';
COMMENT ON COLUMN public.user_quiz_attempts.grade_post_error IS 'Error message if grade posting failed';

-- Add indexes for efficient Classroom-related queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_classroom_course ON public.user_quiz_attempts(classroom_course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_classroom_assignment ON public.user_quiz_attempts(classroom_assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_grade_pending ON public.user_quiz_attempts(grade_posted_to_classroom) 
    WHERE grade_posted_to_classroom = false AND classroom_assignment_id IS NOT NULL;

-- =====================================================
-- 5. CLASSROOM ASSIGNMENTS TRACKING
-- =====================================================

-- Create table to track Classroom assignments created from CivicSense
CREATE TABLE IF NOT EXISTS public.classroom_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id uuid REFERENCES public.learning_pods(id) ON DELETE CASCADE,
    topic_id text NOT NULL,
    classroom_course_id text NOT NULL,
    classroom_assignment_id text NOT NULL,
    assignment_title text NOT NULL,
    assignment_description text,
    due_date timestamptz,
    max_points decimal(5,2) DEFAULT 100.00,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (classroom_course_id, classroom_assignment_id)
);

COMMENT ON TABLE public.classroom_assignments IS 'Tracks Classroom assignments created from CivicSense content';

-- Add RLS for classroom assignments
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;

-- Pod members can view assignments for their pods
CREATE POLICY IF NOT EXISTS "Pod members can view classroom assignments" ON public.classroom_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pod_memberships 
            WHERE pod_memberships.pod_id = classroom_assignments.pod_id 
            AND pod_memberships.user_id = auth.uid()
            AND pod_memberships.membership_status = 'active'
        )
    );

-- Teachers/admins can create and manage assignments
CREATE POLICY IF NOT EXISTS "Teachers can manage classroom assignments" ON public.classroom_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('teacher', 'admin', 'organizer', 'parent')
        )
    );

-- =====================================================
-- 6. CLASSROOM SYNC LOG
-- =====================================================

-- Create table to log Classroom sync operations
CREATE TABLE IF NOT EXISTS public.classroom_sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id uuid REFERENCES public.learning_pods(id) ON DELETE CASCADE,
    sync_type text NOT NULL, -- 'roster', 'grades', 'assignments'
    sync_status text NOT NULL, -- 'success', 'error', 'partial'
    records_processed integer DEFAULT 0,
    records_successful integer DEFAULT 0,
    error_details jsonb,
    sync_duration_ms integer,
    triggered_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.classroom_sync_log IS 'Logs all Google Classroom sync operations for debugging and monitoring';

-- Add index for efficient log queries
CREATE INDEX IF NOT EXISTS idx_classroom_sync_log_pod_date ON public.classroom_sync_log(pod_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_sync_log_status ON public.classroom_sync_log(sync_status, created_at DESC);

-- Add RLS for sync log
ALTER TABLE public.classroom_sync_log ENABLE ROW LEVEL SECURITY;

-- Pod admins can view sync logs for their pods
CREATE POLICY IF NOT EXISTS "Pod admins can view sync logs" ON public.classroom_sync_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pod_memberships 
            WHERE pod_memberships.pod_id = classroom_sync_log.pod_id 
            AND pod_memberships.user_id = auth.uid()
            AND pod_memberships.role IN ('admin', 'parent', 'organizer', 'teacher')
        )
    );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(role, 'member') 
    FROM public.user_profiles 
    WHERE id = user_id;
$$;

-- Function to check if user can manage classroom integrations
CREATE OR REPLACE FUNCTION public.can_manage_classroom_integration(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = user_id 
        AND role IN ('teacher', 'admin', 'organizer', 'parent')
    );
$$;

-- Function to log classroom sync operations
CREATE OR REPLACE FUNCTION public.log_classroom_sync(
    p_pod_id uuid,
    p_sync_type text,
    p_sync_status text,
    p_records_processed integer DEFAULT 0,
    p_records_successful integer DEFAULT 0,
    p_error_details jsonb DEFAULT NULL,
    p_sync_duration_ms integer DEFAULT NULL,
    p_triggered_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO public.classroom_sync_log (
        pod_id, sync_type, sync_status, records_processed, 
        records_successful, error_details, sync_duration_ms, triggered_by
    )
    VALUES (
        p_pod_id, p_sync_type, p_sync_status, p_records_processed,
        p_records_successful, p_error_details, p_sync_duration_ms, 
        COALESCE(p_triggered_by, auth.uid())
    )
    RETURNING id;
$$;

-- =====================================================
-- 8. UPDATE EXISTING RLS POLICIES
-- =====================================================

-- Update learning_pods RLS to include classroom integration permissions
CREATE POLICY IF NOT EXISTS "Teachers can manage classroom integration" ON public.learning_pods
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.pod_memberships 
            WHERE pod_memberships.pod_id = learning_pods.id 
            AND pod_memberships.user_id = auth.uid()
            AND pod_memberships.role IN ('admin', 'parent', 'organizer', 'teacher')
        )
    );

-- =====================================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at on user_profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply trigger to user_profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;

-- Apply trigger to classroom_user_mapping if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_classroom_mapping_updated_at'
    ) THEN
        CREATE TRIGGER update_classroom_mapping_updated_at
            BEFORE UPDATE ON public.classroom_user_mapping
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;

-- Apply trigger to classroom_assignments if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_classroom_assignments_updated_at'
    ) THEN
        CREATE TRIGGER update_classroom_assignments_updated_at
            BEFORE UPDATE ON public.classroom_assignments
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END;
$$;

-- =====================================================
-- 10. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for specific tables they might need
GRANT SELECT ON public.user_profiles TO anon;

COMMIT; 