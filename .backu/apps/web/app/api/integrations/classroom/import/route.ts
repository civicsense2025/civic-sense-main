import { NextRequest, NextResponse } from 'next/server'
import { GoogleClassroomIntegration } from '@/lib/integrations/google-classroom'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/classroom/import
// Body: { access_token: string }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { access_token: accessToken } = body

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing Google OAuth access token' }, { status: 400 })
    }

    const classroom = new GoogleClassroomIntegration(accessToken)
    const courses = await classroom.listCourses()

    // For MVP we import all active courses user teaches
    const imported: string[] = []

    for (const course of courses) {
      if (course.courseState !== 'ACTIVE') continue
      const podId = await classroom.importCourse(course, user.id)
      imported.push(podId)
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Classroom import failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 