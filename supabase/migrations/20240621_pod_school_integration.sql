-- Enhanced Pod-School Integration
-- Creates clear relationships between institutional structures and learning communities

BEGIN;

-- Add school-related fields to learning pods for better integration
ALTER TABLE public.learning_pods ADD COLUMN IF NOT EXISTS school_district_id uuid REFERENCES school.districts(id);
ALTER TABLE public.learning_pods ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school.schools(id);
ALTER TABLE public.learning_pods ADD COLUMN IF NOT EXISTS institutional_type text CHECK (institutional_type IN ('district_program', 'school_program', 'classroom', 'none'));

-- Update the pod_type enum to include institutional types
ALTER TYPE pod_type ADD VALUE IF NOT EXISTS 'district_program';
ALTER TYPE pod_type ADD VALUE IF NOT EXISTS 'school_program';

-- Create indexes for school-pod relationships
CREATE INDEX IF NOT EXISTS idx_learning_pods_district ON public.learning_pods(school_district_id);
CREATE INDEX IF NOT EXISTS idx_learning_pods_school ON public.learning_pods(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_pods_institutional_type ON public.learning_pods(institutional_type);

-- Function to create a classroom pod when a course is created
CREATE OR REPLACE FUNCTION school.create_course_pod(
  p_course_id uuid,
  p_course_name text,
  p_school_id uuid,
  p_teacher_id uuid
) RETURNS uuid AS $$
DECLARE
  pod_id uuid;
BEGIN
  -- Create a learning pod for this course
  INSERT INTO public.learning_pods (
    pod_name,
    pod_type,
    school_id,
    institutional_type,
    content_filter_level,
    created_by
  ) VALUES (
    p_course_name || ' - Civic Learning',
    'classroom',
    p_school_id,
    'classroom',
    'moderate',
    p_teacher_id
  ) RETURNING id INTO pod_id;
  
  -- Link the course to the pod
  INSERT INTO school.course_pod_links (
    course_id,
    pod_id,
    sync_enabled,
    grade_passback_enabled,
    created_by
  ) VALUES (
    p_course_id,
    pod_id,
    true,
    true,
    p_teacher_id
  );
  
  -- Add the teacher as admin of the pod
  INSERT INTO public.pod_memberships (
    pod_id,
    user_id,
    role,
    membership_status
  ) VALUES (
    pod_id,
    p_teacher_id,
    'teacher',
    'active'
  );
  
  RETURN pod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create school-wide civic learning program
CREATE OR REPLACE FUNCTION school.create_school_program(
  p_school_id uuid,
  p_program_name text,
  p_created_by uuid
) RETURNS uuid AS $$
DECLARE
  pod_id uuid;
  school_data record;
BEGIN
  -- Get school information
  SELECT s.*, d.name as district_name INTO school_data
  FROM school.schools s
  JOIN school.districts d ON s.district_id = d.id
  WHERE s.id = p_school_id;
  
  -- Create a school-wide learning pod
  INSERT INTO public.learning_pods (
    pod_name,
    pod_type,
    school_district_id,
    school_id,
    institutional_type,
    content_filter_level,
    created_by
  ) VALUES (
    school_data.name || ' - ' || p_program_name,
    'school_program',
    school_data.district_id,
    p_school_id,
    'school_program',
    'moderate',
    p_created_by
  ) RETURNING id INTO pod_id;
  
  -- Add the creator as admin
  INSERT INTO public.pod_memberships (
    pod_id,
    user_id,
    role,
    membership_status
  ) VALUES (
    pod_id,
    p_created_by,
    'organizer',
    'active'
  );
  
  RETURN pod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create district-wide civic initiative
CREATE OR REPLACE FUNCTION school.create_district_program(
  p_district_id uuid,
  p_program_name text,
  p_created_by uuid
) RETURNS uuid AS $$
DECLARE
  pod_id uuid;
  district_data record;
BEGIN
  -- Get district information
  SELECT * INTO district_data FROM school.districts WHERE id = p_district_id;
  
  -- Create a district-wide learning pod
  INSERT INTO public.learning_pods (
    pod_name,
    pod_type,
    school_district_id,
    institutional_type,
    content_filter_level,
    created_by
  ) VALUES (
    district_data.name || ' - ' || p_program_name,
    'district_program',
    p_district_id,
    'district_program',
    'light',
    p_created_by
  ) RETURNING id INTO pod_id;
  
  -- Add the creator as admin
  INSERT INTO public.pod_memberships (
    pod_id,
    user_id,
    role,
    membership_status
  ) VALUES (
    pod_id,
    p_created_by,
    'organizer',
    'active'
  );
  
  RETURN pod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for school pod hierarchy
CREATE OR REPLACE VIEW school.pod_hierarchy AS
SELECT 
  lp.id as pod_id,
  lp.pod_name,
  lp.pod_type,
  lp.institutional_type,
  d.name as district_name,
  d.id as district_id,
  s.name as school_name, 
  s.id as school_id,
  c.name as course_name,
  c.id as course_id,
  (SELECT COUNT(*) FROM public.pod_memberships pm WHERE pm.pod_id = lp.id AND pm.membership_status = 'active') as member_count,
  lp.created_at
FROM public.learning_pods lp
LEFT JOIN school.districts d ON lp.school_district_id = d.id
LEFT JOIN school.schools s ON lp.school_id = s.id
LEFT JOIN school.course_pod_links cpl ON cpl.pod_id = lp.id
LEFT JOIN school.courses c ON cpl.course_id = c.id
WHERE lp.institutional_type IS NOT NULL
ORDER BY d.name, s.name, c.name;

-- Function to get institutional pod structure for a user
CREATE OR REPLACE FUNCTION school.get_user_institutional_pods(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  pod_id uuid,
  pod_name text,
  pod_type pod_type,
  institutional_type text,
  level text,
  parent_name text,
  member_count bigint,
  user_role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.pod_name,
    lp.pod_type,
    lp.institutional_type,
    CASE 
      WHEN lp.institutional_type = 'district_program' THEN 'District'
      WHEN lp.institutional_type = 'school_program' THEN 'School'
      WHEN lp.institutional_type = 'classroom' THEN 'Course'
      ELSE 'Other'
    END as level,
    COALESCE(s.name, d.name) as parent_name,
    (SELECT COUNT(*) FROM public.pod_memberships pm2 WHERE pm2.pod_id = lp.id AND pm2.membership_status = 'active') as member_count,
    pm.role::text as user_role
  FROM public.learning_pods lp
  JOIN public.pod_memberships pm ON pm.pod_id = lp.id
  LEFT JOIN school.schools s ON lp.school_id = s.id
  LEFT JOIN school.districts d ON lp.school_district_id = d.id
  WHERE pm.user_id = get_user_institutional_pods.user_id
    AND pm.membership_status = 'active'
    AND lp.institutional_type IS NOT NULL
  ORDER BY level, parent_name, lp.pod_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION school.create_course_pod TO authenticated;
GRANT EXECUTE ON FUNCTION school.create_school_program TO authenticated;
GRANT EXECUTE ON FUNCTION school.create_district_program TO authenticated;
GRANT EXECUTE ON FUNCTION school.get_user_institutional_pods TO authenticated;
GRANT SELECT ON school.pod_hierarchy TO authenticated;

COMMIT; 