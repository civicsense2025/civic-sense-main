-- 20240619_add_google_classroom_integration.sql
-- Adds Google Classroom integration support to learning_pods and user mapping
-- This file follows CivicSense migration standards: additive, idempotent, and fully qualified columns

BEGIN;

-- 1. Extend learning_pods with Google Classroom integration fields
ALTER TABLE IF EXISTS public.learning_pods
    ADD COLUMN IF NOT EXISTS google_classroom_id text,
    ADD COLUMN IF NOT EXISTS classroom_sync_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS grade_passback_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.learning_pods.google_classroom_id IS 'Associated Google Classroom course ID';
COMMENT ON COLUMN public.learning_pods.classroom_sync_enabled IS 'Whether roster sync with Classroom is active';
COMMENT ON COLUMN public.learning_pods.grade_passback_enabled IS 'Whether quiz grades are pushed to Classroom gradebook';

-- 2. Add mapping table between CivicSense users and Google Classroom users
CREATE TABLE IF NOT EXISTS public.classroom_user_mapping (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    civicsense_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    google_classroom_user_id text NOT NULL,
    google_email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (google_classroom_user_id)
);

COMMENT ON TABLE public.classroom_user_mapping IS 'Maps CivicSense users to their Google Classroom user profile IDs';

-- 3. Extend user_quiz_attempts for grade pass-back metadata
ALTER TABLE IF EXISTS public.user_quiz_attempts
    ADD COLUMN IF NOT EXISTS classroom_course_id text,
    ADD COLUMN IF NOT EXISTS classroom_assignment_id text;

COMMENT ON COLUMN public.user_quiz_attempts.classroom_course_id IS 'Google Classroom course ID linked to this quiz attempt';
COMMENT ON COLUMN public.user_quiz_attempts.classroom_assignment_id IS 'Google Classroom assignment ID for grade passback';

COMMIT; 