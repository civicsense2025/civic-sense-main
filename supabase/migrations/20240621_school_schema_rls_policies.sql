-- RLS Policies for school schema
-- Applied after tables are created

BEGIN;

-- User profiles: Users can see their own profile and teachers can see their students
ALTER TABLE school.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own school profile" ON school.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own school profile" ON school.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student profiles in their courses" ON school.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school.enrollments e
      JOIN school.courses c ON e.course_id = c.id
      WHERE e.user_id = school.user_profiles.user_id
      AND c.teacher_id = auth.uid()
      AND e.status = 'active'
    )
  );

-- Districts: Public read, admin write
ALTER TABLE school.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are publicly readable" ON school.districts
  FOR SELECT USING (true);

CREATE POLICY "District admins can manage districts" ON school.districts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('district_admin', 'administrator')
    )
  );

-- Schools: Readable by district members
ALTER TABLE school.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools readable by district members" ON school.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school.user_profiles
      WHERE user_id = auth.uid()
      AND school_district_id = school.schools.district_id
    )
  );

-- Courses: Teachers manage their courses, students see enrolled courses
ALTER TABLE school.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their courses" ON school.courses
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled courses" ON school.courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school.enrollments
      WHERE course_id = school.courses.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Enrollments: Students see their own, teachers see their course enrollments
ALTER TABLE school.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments" ON school.enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can manage course enrollments" ON school.enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school.courses
      WHERE id = school.enrollments.course_id
      AND teacher_id = auth.uid()
    )
  );

-- Course-pod links: Teachers and pod admins can manage
ALTER TABLE school.course_pod_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their course-pod links" ON school.course_pod_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school.courses
      WHERE id = school.course_pod_links.course_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Pod admins can view their pod-course links" ON school.course_pod_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pod_memberships
      WHERE pod_id = school.course_pod_links.pod_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'parent', 'organizer')
    )
  );

-- Assignments: Teachers manage, students view
ALTER TABLE school.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage course assignments" ON school.assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school.courses
      WHERE id = school.assignments.course_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view course assignments" ON school.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM school.enrollments e
      JOIN school.courses c ON e.course_id = c.id
      WHERE c.id = school.assignments.course_id
      AND e.user_id = auth.uid()
      AND e.status = 'active'
    )
  );

-- Submissions: Students see their own, teachers see their course submissions
ALTER TABLE school.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" ON school.submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create own submissions" ON school.submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can manage course submissions" ON school.submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school.assignments a
      JOIN school.courses c ON a.course_id = c.id
      WHERE a.id = school.submissions.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Sync logs: Teachers and admins can view relevant logs
ALTER TABLE school.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their course sync logs" ON school.sync_logs
  FOR SELECT USING (
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM school.courses
      WHERE id = school.sync_logs.course_id
      AND teacher_id = auth.uid()
    )) OR
    (pod_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pod_memberships
      WHERE pod_id = school.sync_logs.pod_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'parent', 'organizer')
    ))
  );

COMMIT; 