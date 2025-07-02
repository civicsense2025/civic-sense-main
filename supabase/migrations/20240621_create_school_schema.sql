-- Create school schema for educational institution data
-- This separates educational data from general civic learning data

BEGIN;

-- Create enum types first (before tables that use them)
CREATE TYPE school_user_role AS ENUM (
  'student',
  'teacher', 
  'administrator',
  'counselor',
  'parent',
  'district_admin'
);

CREATE TYPE course_role AS ENUM (
  'student',
  'teacher',
  'teaching_assistant',
  'observer'
);

CREATE TYPE enrollment_status AS ENUM (
  'active',
  'dropped',
  'completed',
  'transferred'
);

CREATE TYPE sync_type AS ENUM (
  'roster_import',
  'grade_export',
  'assignment_create',
  'enrollment_sync'
);

CREATE TYPE sync_status AS ENUM (
  'pending',
  'in_progress', 
  'completed',
  'failed',
  'cancelled'
);

-- Create the school schema
CREATE SCHEMA IF NOT EXISTS school;

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA school TO authenticated;

-- School districts
CREATE TABLE school.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE, -- District code (e.g., "LAUSD")
  state text NOT NULL,
  contact_email text,
  domain text, -- Email domain for auto-verification
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Schools within districts
CREATE TABLE school.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES school.districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL, -- School code within district
  address jsonb,
  principal_email text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(district_id, code)
);

-- User profiles in school context (extends public.users)
CREATE TABLE school.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_district_id uuid REFERENCES school.districts(id),
  student_id text, -- School's internal student ID
  employee_id text, -- School's internal employee ID
  role school_user_role NOT NULL DEFAULT 'student',
  grade_level text,
  graduation_year integer,
  parent_email text,
  emergency_contact jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Classroom courses
CREATE TABLE school.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES school.schools(id) ON DELETE CASCADE,
  google_classroom_id text,
  name text NOT NULL,
  description text,
  section text,
  subject text,
  grade_level text,
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  academic_year text NOT NULL, -- e.g., "2024-2025"
  semester text, -- e.g., "Fall", "Spring", "Year"
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course enrollments
CREATE TABLE school.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES school.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role course_role NOT NULL DEFAULT 'student',
  enrollment_date timestamptz NOT NULL DEFAULT now(),
  status enrollment_status NOT NULL DEFAULT 'active',
  grade_override text, -- Override student's general grade level for this course
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(course_id, user_id)
);

-- Link courses to learning pods
CREATE TABLE school.course_pod_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES school.courses(id) ON DELETE CASCADE,
  pod_id uuid NOT NULL REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  sync_enabled boolean NOT NULL DEFAULT true,
  grade_passback_enabled boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(course_id, pod_id)
);

-- Classroom assignments
CREATE TABLE school.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES school.courses(id) ON DELETE CASCADE,
  google_classroom_assignment_id text,
  title text NOT NULL,
  description text,
  topic_id text, -- CivicSense topic/quiz ID
  quiz_type text, -- 'regular', 'civics_test', etc.
  max_points integer NOT NULL DEFAULT 100,
  due_date timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assignment submissions and grades
CREATE TABLE school.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES school.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_attempt_id uuid, -- Links to public.user_quiz_attempts
  score numeric(5,2), -- Grade received (0-100 or based on max_points)
  max_score numeric(5,2), -- Maximum possible score
  submitted_at timestamptz,
  graded_at timestamptz,
  grade_synced_at timestamptz, -- When grade was sent to Google Classroom
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(assignment_id, student_id)
);

-- Sync logs for classroom integration
CREATE TABLE school.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES school.courses(id) ON DELETE CASCADE,
  pod_id uuid REFERENCES public.learning_pods(id) ON DELETE CASCADE,
  sync_type sync_type NOT NULL,
  sync_status sync_status NOT NULL DEFAULT 'pending',
  records_processed integer DEFAULT 0,
  records_successful integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  started_by uuid REFERENCES auth.users(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  
  CONSTRAINT valid_sync_target CHECK (
    (course_id IS NOT NULL AND pod_id IS NULL) OR 
    (course_id IS NULL AND pod_id IS NOT NULL) OR
    (course_id IS NOT NULL AND pod_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_school_user_profiles_user_id ON school.user_profiles(user_id);
CREATE INDEX idx_school_user_profiles_district ON school.user_profiles(school_district_id);
CREATE INDEX idx_school_courses_school_id ON school.courses(school_id);
CREATE INDEX idx_school_courses_teacher ON school.courses(teacher_id);
CREATE INDEX idx_school_courses_google_id ON school.courses(google_classroom_id) WHERE google_classroom_id IS NOT NULL;
CREATE INDEX idx_school_enrollments_course ON school.enrollments(course_id);
CREATE INDEX idx_school_enrollments_user ON school.enrollments(user_id);
CREATE INDEX idx_school_assignments_course ON school.assignments(course_id);
CREATE INDEX idx_school_submissions_assignment ON school.submissions(assignment_id);
CREATE INDEX idx_school_submissions_student ON school.submissions(student_id);
CREATE INDEX idx_school_sync_logs_course ON school.sync_logs(course_id);
CREATE INDEX idx_school_sync_logs_status ON school.sync_logs(sync_status);

-- Create partial unique indexes (these require separate CREATE statements)
CREATE UNIQUE INDEX idx_school_user_profiles_district_student 
  ON school.user_profiles(school_district_id, student_id) 
  WHERE student_id IS NOT NULL;

CREATE UNIQUE INDEX idx_school_user_profiles_district_employee 
  ON school.user_profiles(school_district_id, employee_id) 
  WHERE employee_id IS NOT NULL;

CREATE UNIQUE INDEX idx_school_courses_google_classroom 
  ON school.courses(school_id, google_classroom_id) 
  WHERE google_classroom_id IS NOT NULL;

CREATE UNIQUE INDEX idx_school_assignments_google_classroom 
  ON school.assignments(course_id, google_classroom_assignment_id) 
  WHERE google_classroom_assignment_id IS NOT NULL;

-- Helper functions
CREATE OR REPLACE FUNCTION school.log_sync_activity(
  p_course_id uuid DEFAULT NULL,
  p_pod_id uuid DEFAULT NULL,
  p_sync_type sync_type DEFAULT 'roster_import',
  p_records_processed integer DEFAULT 0,
  p_records_successful integer DEFAULT 0,
  p_error_details jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO school.sync_logs (
    course_id,
    pod_id,
    sync_type,
    sync_status,
    records_processed,
    records_successful,
    records_failed,
    error_details,
    started_by,
    completed_at
  ) VALUES (
    p_course_id,
    p_pod_id,
    p_sync_type,
    CASE WHEN p_error_details IS NULL THEN 'completed'::sync_status ELSE 'failed'::sync_status END,
    p_records_processed,
    p_records_successful,
    p_records_processed - p_records_successful,
    p_error_details,
    auth.uid(),
    now()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's school context
CREATE OR REPLACE FUNCTION school.get_user_school_context(user_id uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', to_jsonb(sp.*),
    'district', to_jsonb(d.*),
    'schools', COALESCE(schools_array.schools, '[]'::jsonb),
    'courses', COALESCE(courses_array.courses, '[]'::jsonb)
  ) INTO result
  FROM school.user_profiles sp
  LEFT JOIN school.districts d ON sp.school_district_id = d.id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(to_jsonb(s.*)) as schools
    FROM school.schools s
    WHERE s.district_id = d.id
  ) schools_array ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'course', to_jsonb(c.*),
        'enrollment', to_jsonb(e.*)
      )
    ) as courses
    FROM school.enrollments e
    JOIN school.courses c ON e.course_id = c.id
    WHERE e.user_id = get_user_school_context.user_id
    AND e.status = 'active'
  ) courses_array ON true
  WHERE sp.user_id = get_user_school_context.user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION school.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON school.user_profiles
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_districts_updated_at
  BEFORE UPDATE ON school.districts
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON school.schools
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON school.courses
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON school.enrollments
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_course_pod_links_updated_at
  BEFORE UPDATE ON school.course_pod_links
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON school.assignments
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON school.submissions
  FOR EACH ROW EXECUTE FUNCTION school.update_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA school TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA school TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA school TO authenticated;

COMMIT; 