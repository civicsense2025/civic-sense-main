-- 20240622_add_multi_lms_support.sql
-- Adds support for multiple LMS platforms (Google Classroom and Clever) to the school schema
-- This migration extends the existing school schema to support both platforms

BEGIN;

-- 1. Add LMS platform enum type
CREATE TYPE IF NOT EXISTS school.lms_platform AS ENUM ('google_classroom', 'clever');

-- 2. Extend courses table to support both platforms
ALTER TABLE IF EXISTS school.courses
    ADD COLUMN IF NOT EXISTS lms_platform school.lms_platform,
    ADD COLUMN IF NOT EXISTS clever_section_id text,
    ADD COLUMN IF NOT EXISTS external_course_id text,
    ADD COLUMN IF NOT EXISTS grade text,
    ADD COLUMN IF NOT EXISTS subject text;

COMMENT ON COLUMN school.courses.lms_platform IS 'The LMS platform this course syncs with';
COMMENT ON COLUMN school.courses.clever_section_id IS 'Associated Clever section ID';
COMMENT ON COLUMN school.courses.external_course_id IS 'Generic external course/section ID for any LMS';
COMMENT ON COLUMN school.courses.grade IS 'Grade level for the course';
COMMENT ON COLUMN school.courses.subject IS 'Subject area for the course';

-- 3. Add constraint to ensure one LMS ID per course
ALTER TABLE school.courses
    ADD CONSTRAINT check_single_lms_id CHECK (
        (google_classroom_id IS NOT NULL)::int + 
        (clever_section_id IS NOT NULL)::int <= 1
    );

-- 4. Extend learning_pods table for multi-LMS support
ALTER TABLE IF EXISTS public.learning_pods
    ADD COLUMN IF NOT EXISTS lms_platform school.lms_platform,
    ADD COLUMN IF NOT EXISTS clever_section_id text,
    ADD COLUMN IF NOT EXISTS clever_sync_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS clever_last_sync timestamptz,
    ADD COLUMN IF NOT EXISTS clever_sync_errors jsonb;

COMMENT ON COLUMN public.learning_pods.lms_platform IS 'The LMS platform this pod is integrated with';
COMMENT ON COLUMN public.learning_pods.clever_section_id IS 'Associated Clever section ID';
COMMENT ON COLUMN public.learning_pods.clever_sync_enabled IS 'Whether roster sync with Clever is active';
COMMENT ON COLUMN public.learning_pods.clever_last_sync IS 'Last successful sync with Clever';
COMMENT ON COLUMN public.learning_pods.clever_sync_errors IS 'Recent sync errors with Clever';

-- 5. Create Clever user mapping table
CREATE TABLE IF NOT EXISTS public.clever_user_mapping (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    civicsense_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    clever_user_id text NOT NULL,
    clever_email text,
    first_name text,
    last_name text,
    role text,
    school_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (clever_user_id)
);

COMMENT ON TABLE public.clever_user_mapping IS 'Maps CivicSense users to their Clever user profile IDs';

-- 6. Extend user_quiz_attempts for multi-LMS grade passback
ALTER TABLE IF EXISTS public.user_quiz_attempts
    ADD COLUMN IF NOT EXISTS clever_section_id text,
    ADD COLUMN IF NOT EXISTS clever_assignment_id text,
    ADD COLUMN IF NOT EXISTS grade_posted_to_lms boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS grade_post_error text,
    ADD COLUMN IF NOT EXISTS grade_post_timestamp timestamptz;

COMMENT ON COLUMN public.user_quiz_attempts.clever_section_id IS 'Clever section ID linked to this quiz attempt';
COMMENT ON COLUMN public.user_quiz_attempts.clever_assignment_id IS 'Clever assignment ID for grade tracking';
COMMENT ON COLUMN public.user_quiz_attempts.grade_posted_to_lms IS 'Whether grade was successfully posted to any LMS';
COMMENT ON COLUMN public.user_quiz_attempts.grade_post_error IS 'Error message if grade posting failed';
COMMENT ON COLUMN public.user_quiz_attempts.grade_post_timestamp IS 'When grade was posted to LMS';

-- 7. Create student grades table for Clever (since Clever doesn't have gradebook API)
CREATE TABLE IF NOT EXISTS school.student_grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id text NOT NULL,
    assignment_id text NOT NULL,
    student_id text NOT NULL,
    grade numeric NOT NULL,
    max_points numeric NOT NULL DEFAULT 100,
    lms_platform school.lms_platform NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (section_id, assignment_id, student_id, lms_platform)
);

COMMENT ON TABLE school.student_grades IS 'Internal grade tracking for LMS platforms without gradebook APIs';

-- 8. Extend assignments table for multi-LMS support
ALTER TABLE IF EXISTS school.assignments
    ADD COLUMN IF NOT EXISTS lms_platform school.lms_platform DEFAULT 'google_classroom',
    ADD COLUMN IF NOT EXISTS clever_assignment_id text,
    ADD COLUMN IF NOT EXISTS external_url text,
    ADD COLUMN IF NOT EXISTS section_id text;

COMMENT ON COLUMN school.assignments.lms_platform IS 'Which LMS platform this assignment is for';
COMMENT ON COLUMN school.assignments.clever_assignment_id IS 'Internal assignment ID for Clever integration';
COMMENT ON COLUMN school.assignments.external_url IS 'External URL for the assignment';
COMMENT ON COLUMN school.assignments.section_id IS 'Section/course ID in the external LMS';

-- 9. Extend enrollments table for multi-LMS support
ALTER TABLE IF EXISTS school.enrollments
    ADD COLUMN IF NOT EXISTS clever_user_id text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS first_name text,
    ADD COLUMN IF NOT EXISTS last_name text,
    ADD COLUMN IF NOT EXISTS lms_platform school.lms_platform;

COMMENT ON COLUMN school.enrollments.clever_user_id IS 'Clever user ID for this enrollment';
COMMENT ON COLUMN school.enrollments.email IS 'User email from LMS platform';
COMMENT ON COLUMN school.enrollments.first_name IS 'First name from LMS platform';
COMMENT ON COLUMN school.enrollments.last_name IS 'Last name from LMS platform';
COMMENT ON COLUMN school.enrollments.lms_platform IS 'Which LMS platform this enrollment is from';

-- 10. Update sync_logs to track LMS platform
ALTER TABLE IF EXISTS school.sync_logs
    ADD COLUMN IF NOT EXISTS lms_platform school.lms_platform;

COMMENT ON COLUMN school.sync_logs.lms_platform IS 'Which LMS platform this sync was for';

-- 11. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_lms_platform ON school.courses(lms_platform);
CREATE INDEX IF NOT EXISTS idx_courses_clever_section_id ON school.courses(clever_section_id) WHERE clever_section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_pods_lms_platform ON public.learning_pods(lms_platform);
CREATE INDEX IF NOT EXISTS idx_learning_pods_clever_section_id ON public.learning_pods(clever_section_id) WHERE clever_section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clever_user_mapping_user_id ON public.clever_user_mapping(clever_user_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_section_assignment ON school.student_grades(section_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_clever_section ON public.user_quiz_attempts(clever_section_id) WHERE clever_section_id IS NOT NULL;

-- 12. Create helper function to get LMS integration status
CREATE OR REPLACE FUNCTION school.get_lms_integration_status(p_pod_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    pod_record record;
BEGIN
    SELECT 
        lms_platform,
        google_classroom_id,
        clever_section_id,
        classroom_sync_enabled,
        clever_sync_enabled,
        grade_passback_enabled,
        classroom_last_sync,
        clever_last_sync,
        classroom_sync_errors,
        clever_sync_errors
    INTO pod_record
    FROM public.learning_pods
    WHERE id = p_pod_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Pod not found');
    END IF;
    
    result := jsonb_build_object(
        'lms_platform', pod_record.lms_platform,
        'integrations', jsonb_build_object()
    );
    
    -- Add Google Classroom integration status
    IF pod_record.google_classroom_id IS NOT NULL THEN
        result := jsonb_set(
            result,
            '{integrations,google_classroom}',
            jsonb_build_object(
                'course_id', pod_record.google_classroom_id,
                'sync_enabled', pod_record.classroom_sync_enabled,
                'grade_passback_enabled', pod_record.grade_passback_enabled,
                'last_sync', pod_record.classroom_last_sync,
                'sync_errors', pod_record.classroom_sync_errors
            )
        );
    END IF;
    
    -- Add Clever integration status
    IF pod_record.clever_section_id IS NOT NULL THEN
        result := jsonb_set(
            result,
            '{integrations,clever}',
            jsonb_build_object(
                'section_id', pod_record.clever_section_id,
                'sync_enabled', pod_record.clever_sync_enabled,
                'last_sync', pod_record.clever_last_sync,
                'sync_errors', pod_record.clever_sync_errors
            )
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 13. Create function to switch LMS platform for a pod
CREATE OR REPLACE FUNCTION school.switch_pod_lms_platform(
    p_pod_id uuid,
    p_new_platform school.lms_platform,
    p_external_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Validate platform and external ID
    IF p_new_platform IS NULL OR p_external_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Platform and external ID are required');
    END IF;
    
    -- Update the pod with new platform
    IF p_new_platform = 'google_classroom' THEN
        UPDATE public.learning_pods
        SET 
            lms_platform = p_new_platform,
            google_classroom_id = p_external_id,
            clever_section_id = NULL,
            classroom_sync_enabled = true,
            clever_sync_enabled = false
        WHERE id = p_pod_id;
    ELSIF p_new_platform = 'clever' THEN
        UPDATE public.learning_pods
        SET 
            lms_platform = p_new_platform,
            clever_section_id = p_external_id,
            google_classroom_id = NULL,
            clever_sync_enabled = true,
            classroom_sync_enabled = false
        WHERE id = p_pod_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'platform', p_new_platform,
        'external_id', p_external_id
    );
END;
$$;

-- 14. Update existing data to set default LMS platform
UPDATE public.learning_pods 
SET lms_platform = 'google_classroom' 
WHERE google_classroom_id IS NOT NULL AND lms_platform IS NULL;

UPDATE school.courses 
SET lms_platform = 'google_classroom' 
WHERE google_classroom_id IS NOT NULL AND lms_platform IS NULL;

-- 15. Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION school.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_grades_updated_at 
    BEFORE UPDATE ON school.student_grades 
    FOR EACH ROW 
    EXECUTE FUNCTION school.update_updated_at_column();

COMMIT; 