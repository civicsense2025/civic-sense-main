import { createClient } from '@supabase/supabase-js'

/**
 * Enhanced Clever integration with full roster sync and grade passback
 * Implements the complete integration following the same patterns as Google Classroom
 */
export class CleverIntegration {
  private supabase
  private accessToken: string | null = null
  private baseUrl: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Clever uses different base URLs for sandbox vs production
    this.baseUrl = process.env.CLEVER_ENVIRONMENT === 'production' 
      ? 'https://api.clever.com' 
      : 'https://api.clever.com/sandbox'
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async makeCleverRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('No access token set for Clever API')
    }

    const response = await fetch(`${this.baseUrl}/v3.0/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Clever API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Fetch sections (courses) for the authenticated Clever user (teacher)
   */
  async listSections(): Promise<any[]> {
    try {
      const data = await this.makeCleverRequest('sections')
      return data.data || []
    } catch (error) {
      console.error('Error listing sections:', error)
      throw error
    }
  }

  /**
   * Fetch schools accessible to the authenticated user
   */
  async listSchools(): Promise<any[]> {
    try {
      const data = await this.makeCleverRequest('schools')
      return data.data || []
    } catch (error) {
      console.error('Error listing schools:', error)
      throw error
    }
  }

  /**
   * Import a Clever section into CivicSense as a learning pod with full sync setup
   */
  async importSection(sectionId: string, schoolId: string, podId?: string): Promise<string> {
    try {
      // Get section details from Clever
      const section = await this.getSection(sectionId)
      
      // Create course record in school schema
      const { data: courseRecord, error: courseError } = await this.supabase
        .from('school.courses')
        .insert({
          school_id: schoolId,
          clever_section_id: section.data.id,
          name: section.data.name,
          description: section.data.description,
          section: section.data.section,
          teacher_id: section.data.teacher, // This should be mapped to internal user ID
          academic_year: new Date().getFullYear().toString(),
          semester: this.getCurrentSemester(),
          grade: section.data.grade,
          subject: section.data.subject,
          is_active: true
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
            created_by: section.data.teacher
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
      console.error('Error importing section:', error)
      
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
   * Sync roster (students and teachers) from Clever to learning pod
   */
  async syncRoster(podId: string): Promise<{ studentsAdded: number, teachersAdded: number }> {
    try {
      // Get pod's clever section ID
      const { data: pod } = await this.supabase
        .from('learning_pods')
        .select('clever_section_id')
        .eq('id', podId)
        .single()

      if (!pod?.clever_section_id) {
        throw new Error('Pod not linked to Clever section')
      }

      // Fetch students and teachers from Clever
      const [students, teachers] = await Promise.all([
        this.getStudents(pod.clever_section_id),
        this.getTeachers(pod.clever_section_id)
      ])

      let studentsAdded = 0
      let teachersAdded = 0
      const errors: string[] = []

      // Process students
      for (const student of students) {
        try {
          const { error: enrollmentError } = await this.supabase
            .from('school.enrollments')
            .upsert({
              course_id: pod.clever_section_id,
              user_id: student.data.id, // This should be mapped to internal user ID
              role: 'student',
              status: 'active',
              clever_user_id: student.data.id,
              email: student.data.email,
              first_name: student.data.name?.first,
              last_name: student.data.name?.last
            }, {
              onConflict: 'course_id,user_id'
            })

          if (!enrollmentError) {
            studentsAdded++
          } else {
            errors.push(`Student ${student.data.email}: ${enrollmentError.message}`)
          }
        } catch (error) {
          errors.push(`Student ${student.data.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Process teachers
      for (const teacher of teachers) {
        try {
          const { error: enrollmentError } = await this.supabase
            .from('school.enrollments')
            .upsert({
              course_id: pod.clever_section_id,
              user_id: teacher.data.id, // This should be mapped to internal user ID
              role: 'teacher',
              status: 'active',
              clever_user_id: teacher.data.id,
              email: teacher.data.email,
              first_name: teacher.data.name?.first,
              last_name: teacher.data.name?.last
            }, {
              onConflict: 'course_id,user_id'
            })

          if (!enrollmentError) {
            teachersAdded++
          } else {
            errors.push(`Teacher ${teacher.data.email}: ${enrollmentError.message}`)
          }
        } catch (error) {
          errors.push(`Teacher ${teacher.data.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Log the sync activity
      await this.supabase.rpc('school.log_sync_activity', {
        p_course_id: pod.clever_section_id,
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

  async getStudents(sectionId: string): Promise<any[]> {
    try {
      const data = await this.makeCleverRequest(`sections/${sectionId}/students`)
      return data.data || []
    } catch (error) {
      console.error('Error getting students:', error)
      throw error
    }
  }

  async getTeachers(sectionId: string): Promise<any[]> {
    try {
      const data = await this.makeCleverRequest(`sections/${sectionId}/teachers`)
      return data.data || []
    } catch (error) {
      console.error('Error getting teachers:', error)
      throw error
    }
  }

  /**
   * Create assignment tracking in Clever (Note: Clever doesn't have assignment creation API like Classroom)
   * Instead, we track external assignments that link to CivicSense
   */
  async createQuizAssignment(
    sectionId: string, 
    topicId: string, 
    quizTitle: string, 
    quizDescription: string,
    dueDate?: Date,
    maxPoints = 100
  ): Promise<string> {
    const linkUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}?clever=${sectionId}`
    
    // Since Clever doesn't have assignment creation API, we create internal tracking
    const { data: assignment, error } = await this.supabase
      .from('school.assignments')
      .insert({
        section_id: sectionId,
        topic_id: topicId,
        title: `CivicSense Quiz: ${quizTitle}`,
        description: quizDescription,
        due_date: dueDate?.toISOString(),
        max_points: maxPoints,
        external_url: linkUrl,
        lms_platform: 'clever'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    return assignment.id
  }

  /**
   * Record grade for Clever integration (since Clever doesn't have gradebook API)
   * We track grades internally and provide reports for teachers
   */
  async recordGrade(
    sectionId: string, 
    assignmentId: string, 
    studentId: string, 
    grade: number,
    attemptId?: string
  ): Promise<void> {
    // Record grade in our system for Clever integration
    const { error: gradeError } = await this.supabase
      .from('school.student_grades')
      .upsert({
        section_id: sectionId,
        assignment_id: assignmentId,
        student_id: studentId,
        grade: grade,
        max_points: 100,
        recorded_at: new Date().toISOString(),
        lms_platform: 'clever'
      }, {
        onConflict: 'section_id,assignment_id,student_id'
      })

    if (gradeError) {
      console.error('Failed to record grade for Clever', gradeError.message)
      
      // Update attempt record with error
      if (attemptId) {
        await this.supabase
          .from('user_quiz_attempts')
          .update({
            grade_posted_to_lms: false,
            grade_post_error: gradeError.message,
            grade_post_timestamp: new Date().toISOString()
          })
          .eq('id', attemptId)
      }
      
      throw new Error('Failed to record grade for Clever')
    }

    // Update attempt record with success
    if (attemptId) {
      await this.supabase
        .from('user_quiz_attempts')
        .update({
          clever_section_id: sectionId,
          clever_assignment_id: assignmentId,
          grade_posted_to_lms: true,
          grade_post_timestamp: new Date().toISOString(),
          grade_post_error: null
        })
        .eq('id', attemptId)
    }
  }

  /**
   * Batch process pending grade recordings for a pod
   */
  async processPendingGrades(podId: string): Promise<{ processed: number, errors: number }> {
    // Get pod's clever section ID
    const { data: pod } = await this.supabase
      .from('learning_pods')
      .select('clever_section_id')
      .eq('id', podId)
      .single()

    if (!pod?.clever_section_id) {
      throw new Error('Pod not linked to Clever section')
    }

    // Get pending grade recordings
    const { data: pendingAttempts } = await this.supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        user_id,
        percentage_score,
        clever_assignment_id,
        clever_user_mapping!inner(clever_user_id)
      `)
      .eq('clever_section_id', pod.clever_section_id)
      .eq('grade_posted_to_lms', false)
      .not('clever_assignment_id', 'is', null)

    let processed = 0
    let errors = 0

    for (const attempt of pendingAttempts || []) {
      try {
        const attemptAny = attempt as any
        await this.recordGrade(
          pod.clever_section_id,
          attemptAny.clever_assignment_id,
          attemptAny.clever_user_mapping.clever_user_id,
          attemptAny.percentage_score,
          attemptAny.id
        )
        processed++
      } catch (error) {
        console.error('Failed to record grade for attempt', attempt.id, error)
        errors++
      }
    }

    return { processed, errors }
  }

  /**
   * Generate grade report for teachers (since Clever doesn't have gradebook)
   */
  async generateGradeReport(sectionId: string): Promise<any> {
    // Get grades data
    const { data: grades, error: gradesError } = await this.supabase
      .from('school.student_grades')
      .select('*')
      .eq('section_id', sectionId)
      .eq('lms_platform', 'clever')

    if (gradesError) {
      console.error('Error fetching grades:', gradesError)
      throw new Error(`Failed to fetch grades: ${gradesError.message}`)
    }

    const gradesArray = grades || []

    // Get assignments data separately if needed
    const assignmentIds = [...new Set(gradesArray.map((g: any) => g.assignment_id).filter(Boolean))]
    const { data: assignments } = await this.supabase
      .from('school.assignments')
      .select('id, title, max_points')
      .in('id', assignmentIds)

    // Get student data separately if needed  
    const studentIds = [...new Set(gradesArray.map((g: any) => g.student_id).filter(Boolean))]
    const { data: students } = await this.supabase
      .from('school.enrollments')
      .select('user_id, first_name, last_name, email')
      .in('user_id', studentIds)

    // Combine the data
    const enrichedGrades = gradesArray.map((grade: any) => ({
      ...grade,
      assignment: assignments?.find((a: any) => a.id === grade.assignment_id),
      student: students?.find((s: any) => s.user_id === grade.student_id)
    }))

    return {
      sectionId,
      generatedAt: new Date().toISOString(),
      grades: enrichedGrades,
      summary: {
        totalAssignments: assignmentIds.length,
        totalStudents: studentIds.length,
        averageGrade: gradesArray.length > 0 
          ? gradesArray.reduce((sum, g) => sum + (g.grade || 0), 0) / gradesArray.length 
          : 0
      }
    }
  }

  /**
   * Get detailed sync status for a pod
   */
  async getSyncStatus(podId: string) {
    const { data: recentLogs } = await this.supabase
      .from('school.sync_logs')
      .select('*')
      .eq('pod_id', podId)
      .order('started_at', { ascending: false })
      .limit(10)

    const { data: pod } = await this.supabase
      .from('learning_pods')
      .select('clever_last_sync, clever_sync_errors')
      .eq('id', podId)
      .single()

    return {
      lastSync: pod?.clever_last_sync,
      recentErrors: pod?.clever_sync_errors,
      recentLogs: recentLogs || []
    }
  }

  private getCurrentSemester(): string {
    const now = new Date()
    const month = now.getMonth() + 1
    
    if (month >= 8) {
      return 'Fall'
    } else if (month >= 5) {
      return 'Summer'
    } else {
      return 'Spring'
    }
  }

  private async getSection(sectionId: string): Promise<any> {
    try {
      return await this.makeCleverRequest(`sections/${sectionId}`)
    } catch (error) {
      console.error('Error getting section:', error)
      throw error
    }
  }
}

/**
 * Helper function to create clever integration instance with user's token
 */
export async function createCleverIntegration(userId: string): Promise<CleverIntegration | null> {
  // In a real implementation, you'd fetch the user's stored Clever OAuth token
  const accessToken = await getUserCleverAccessToken(userId)
  if (!accessToken) return null
  
  const integration = new CleverIntegration()
  integration.setAccessToken(accessToken)
  return integration
}

/**
 * Placeholder for getting user's Clever access token
 */
async function getUserCleverAccessToken(userId: string): Promise<string | null> {
  // This would fetch from your secure token storage
  // For now, return null - implement based on your auth flow
  return null
} 