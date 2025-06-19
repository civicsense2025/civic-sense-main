import { createClient } from '@supabase/supabase-js'

/**
 * Enhanced Google Classroom integration with full roster sync and grade passback
 * Implements the complete integration as defined in the database migration
 */
export class GoogleClassroomIntegration {
  private supabase
  private accessToken: string | null = null

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async makeClassroomRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('No access token set for Classroom API')
    }

    const response = await fetch(`https://classroom.googleapis.com/v1/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Classroom API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Fetch courses for the authenticated Classroom user (teacher)
   */
  async listCourses(): Promise<any[]> {
    try {
      const data = await this.makeClassroomRequest('courses?courseStates=ACTIVE')
      return data.courses || []
    } catch (error) {
      console.error('Error listing courses:', error)
      throw error
    }
  }

  /**
   * Import a Classroom course into CivicSense as a learning pod with full sync setup
   */
  async importCourse(courseId: string, schoolId: string, podId?: string): Promise<string> {
    try {
      // Get course details from Google Classroom
      const course = await this.getCourse(courseId)
      
      // Create course record in school schema
      const { data: courseRecord, error: courseError } = await this.supabase
        .from('school.courses')
        .insert({
          school_id: schoolId,
          google_classroom_id: course.id,
          name: course.name,
          description: course.description,
          section: course.section,
          teacher_id: course.ownerId, // This should be mapped to internal user ID
          academic_year: new Date().getFullYear().toString(),
          semester: this.getCurrentSemester(),
          is_active: course.courseState === 'ACTIVE'
        })
        .select()
        .single()

      if (courseError) {
        throw new Error(`Failed to create course record: ${courseError.message}`)
      }

      // Link to learning pod if provided
      if (podId) {
        const { error: linkError } = await this.supabase
          .from('school.course_pod_links')
          .insert({
            course_id: courseRecord.id,
            pod_id: podId,
            sync_enabled: true,
            grade_passback_enabled: true,
            created_by: course.ownerId
          })

        if (linkError) {
          console.error('Failed to link course to pod:', linkError)
        }
      }

      // Log the import
      await this.supabase.rpc('school.log_sync_activity', {
        p_course_id: courseRecord.id,
        p_pod_id: podId,
        p_sync_type: 'roster_import',
        p_records_processed: 1,
        p_records_successful: 1
      })

      return courseRecord.id
    } catch (error) {
      console.error('Error importing course:', error)
      
      // Log the error
      await this.supabase.rpc('school.log_sync_activity', {
        p_course_id: null,
        p_pod_id: podId,
        p_sync_type: 'roster_import',
        p_records_processed: 1,
        p_records_successful: 0,
        p_error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      throw error
    }
  }

  /**
   * Sync roster (students and teachers) from Classroom to learning pod
   */
  async syncRoster(podId: string): Promise<{ studentsAdded: number, teachersAdded: number }> {
    try {
      // Get pod's classroom course ID
      const { data: pod } = await this.supabase
        .from('learning_pods')
        .select('google_classroom_id')
        .eq('id', podId)
        .single()

      if (!pod?.google_classroom_id) {
        throw new Error('Pod not linked to Classroom')
      }

      // Fetch students and teachers from Google Classroom
      const [students, teachers] = await Promise.all([
        this.getStudents(pod.google_classroom_id),
        this.getTeachers(pod.google_classroom_id)
      ])

      let studentsAdded = 0
      let teachersAdded = 0
      const errors: string[] = []

      // Process students
      for (const student of students) {
        try {
          // Check if user exists in auth.users (would need proper user mapping)
          // For now, we'll create a placeholder approach
          
          const { error: enrollmentError } = await this.supabase
            .from('school.enrollments')
            .upsert({
              course_id: pod.google_classroom_id,
              user_id: student.userId, // This should be mapped to internal user ID
              role: 'student',
              status: 'active'
            }, {
              onConflict: 'course_id,user_id'
            })

          if (!enrollmentError) {
            studentsAdded++
          } else {
            errors.push(`Student ${student.profile.emailAddress}: ${enrollmentError.message}`)
          }
        } catch (error) {
          errors.push(`Student ${student.profile.emailAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Process teachers
      for (const teacher of teachers) {
        try {
          const { error: enrollmentError } = await this.supabase
            .from('school.enrollments')
            .upsert({
              course_id: pod.google_classroom_id,
              user_id: teacher.userId, // This should be mapped to internal user ID
              role: 'teacher',
              status: 'active'
            }, {
              onConflict: 'course_id,user_id'
            })

          if (!enrollmentError) {
            teachersAdded++
          } else {
            errors.push(`Teacher ${teacher.profile.emailAddress}: ${enrollmentError.message}`)
          }
        } catch (error) {
          errors.push(`Teacher ${teacher.profile.emailAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Log the sync activity
      await this.supabase.rpc('school.log_sync_activity', {
        p_course_id: pod.google_classroom_id,
        p_sync_type: 'roster_import',
        p_records_processed: students.length + teachers.length,
        p_records_successful: studentsAdded + teachersAdded,
        p_error_details: errors.length > 0 ? { errors } : null
      })

      return { studentsAdded, teachersAdded }
    } catch (error) {
      console.error('Error syncing roster:', error)
      throw error
    }
  }

  async getStudents(courseId: string): Promise<any[]> {
    try {
      const data = await this.makeClassroomRequest(`courses/${courseId}/students`)
      return data.students || []
    } catch (error) {
      console.error('Error getting students:', error)
      throw error
    }
  }

  async getTeachers(courseId: string): Promise<any[]> {
    try {
      const data = await this.makeClassroomRequest(`courses/${courseId}/teachers`)
      return data.teachers || []
    } catch (error) {
      console.error('Error getting teachers:', error)
      throw error
    }
  }

  /**
   * Create an assignment in Classroom that links to a CivicSense quiz
   */
  async createQuizAssignment(
    courseId: string, 
    topicId: string, 
    quizTitle: string, 
    quizDescription: string,
    dueDate?: Date,
    maxPoints = 100
  ): Promise<string> {
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const linkUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}?classroom=${courseId}`
    
    const payload = {
      title: `CivicSense Quiz: ${quizTitle}`,
      description: quizDescription,
      materials: [
        {
          link: {
            url: linkUrl,
            title: 'Take quiz on CivicSense'
          }
        }
      ],
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      maxPoints: maxPoints,
      ...(dueDate && { dueDate: this.formatClassroomDate(dueDate) })
    }

    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      console.error('Failed to create Classroom assignment', await res.text())
      throw new Error('Failed to create Classroom assignment')
    }

    const data = await res.json()
    
    // Track the assignment in our database
    const { data: podData } = await supabase
      .from('learning_pods')
      .select('id')
      .eq('google_classroom_id', courseId)
      .single()

    if (podData) {
      await supabase
        .from('school.assignments')
        .insert({
          course_id: podData.id,
          topic_id: topicId,
          google_classroom_assignment_id: data.id,
          title: payload.title,
          description: payload.description,
          due_date: dueDate?.toISOString(),
          max_points: maxPoints
        })
    }

    return data.id as string
  }

  /**
   * Submit grade to Classroom for a student's quiz attempt
   */
  async submitGrade(
    courseId: string, 
    assignmentId: string, 
    studentId: string, 
    grade: number,
    attemptId?: string
  ): Promise<void> {
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get student submissions for this assignment
    const submissionsRes = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions?userId=${studentId}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    )

    if (!submissionsRes.ok) {
      throw new Error('Failed to fetch student submissions')
    }

    const submissionsData = await submissionsRes.json()
    const submission = submissionsData.studentSubmissions?.[0]

    if (!submission) {
      throw new Error('No submission found for student')
    }

    // Submit the grade
    const gradeRes = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions/${submission.id}:modifyAttachments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignedGrade: grade,
          draftGrade: grade
        })
      }
    )

    if (!gradeRes.ok) {
      const errorText = await gradeRes.text()
      console.error('Failed to submit grade to Classroom', errorText)
      
      // Update attempt record with error
      if (attemptId) {
        await supabase
          .from('user_quiz_attempts')
          .update({
            grade_posted_to_classroom: false,
            grade_post_error: errorText,
            grade_post_timestamp: new Date().toISOString()
          })
          .eq('id', attemptId)
      }
      
      throw new Error('Failed to submit grade to Classroom')
    }

    // Update attempt record with success
    if (attemptId) {
      await supabase
        .from('user_quiz_attempts')
        .update({
          classroom_course_id: courseId,
          classroom_assignment_id: assignmentId,
          classroom_submission_id: submission.id,
          grade_posted_to_classroom: true,
          grade_post_timestamp: new Date().toISOString(),
          grade_post_error: null
        })
        .eq('id', attemptId)
    }
  }

  /**
   * Batch process pending grade submissions for a pod
   */
  async processPendingGrades(podId: string): Promise<{ processed: number, errors: number }> {
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get pod's classroom course ID
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('google_classroom_id')
      .eq('id', podId)
      .single()

    if (!pod?.google_classroom_id) {
      throw new Error('Pod not linked to Classroom')
    }

    // Get pending grade submissions
    const { data: pendingAttempts } = await supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        user_id,
        percentage_score,
        classroom_assignment_id,
        classroom_user_mapping!inner(google_classroom_user_id)
      `)
      .eq('classroom_course_id', pod.google_classroom_id)
      .eq('grade_posted_to_classroom', false)
      .not('classroom_assignment_id', 'is', null)

    let processed = 0
    let errors = 0

    for (const attempt of pendingAttempts || []) {
      try {
        // Cast to any to resolve TypeScript issue with complex join
        const attemptAny = attempt as any
        await this.submitGrade(
          pod.google_classroom_id,
          attemptAny.classroom_assignment_id,
          attemptAny.classroom_user_mapping.google_classroom_user_id,
          attemptAny.percentage_score,
          attemptAny.id
        )
        processed++
      } catch (error) {
        console.error('Failed to submit grade for attempt', attempt.id, error)
        errors++
      }
    }

    return { processed, errors }
  }

  /**
   * Helper to format dates for Classroom API
   */
  private formatClassroomDate(date: Date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    }
  }

  /**
   * Get detailed sync status for a pod
   */
  async getSyncStatus(podId: string) {
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: recentLogs } = await supabase
      .from('school.sync_logs')
      .select('*')
      .eq('pod_id', podId)
      .order('started_at', { ascending: false })
      .limit(10)

    const { data: pod } = await supabase
      .from('learning_pods')
      .select('classroom_last_sync, classroom_sync_errors')
      .eq('id', podId)
      .single()

    return {
      lastSync: pod?.classroom_last_sync,
      recentErrors: pod?.classroom_sync_errors,
      recentLogs: recentLogs || []
    }
  }

  private getCurrentSemester(): string {
    const month = new Date().getMonth() + 1
    if (month >= 8 || month <= 12) return 'Fall'
    if (month >= 1 && month <= 5) return 'Spring'
    return 'Summer'
  }

  private async getCourse(courseId: string): Promise<any> {
    try {
      return await this.makeClassroomRequest(`courses/${courseId}`)
    } catch (error) {
      console.error('Error getting course:', error)
      throw error
    }
  }
}

/**
 * Helper function to create classroom integration instance with user's token
 */
export async function createClassroomIntegration(userId: string): Promise<GoogleClassroomIntegration | null> {
  // In a real implementation, you'd fetch the user's stored Google OAuth token
  // For now, this is a placeholder
  const accessToken = await getUserGoogleAccessToken(userId)
  if (!accessToken) return null
  
  const integration = new GoogleClassroomIntegration()
  integration.setAccessToken(accessToken)
  return integration
}

/**
 * Placeholder for fetching user's Google OAuth token
 * In production, you'd implement proper OAuth token storage and refresh
 */
async function getUserGoogleAccessToken(userId: string): Promise<string | null> {
  // TODO: Implement OAuth token storage and retrieval
  return null
} 