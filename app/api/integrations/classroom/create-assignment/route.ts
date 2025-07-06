import { NextRequest, NextResponse } from 'next/server'
import { GoogleClassroomIntegration } from '@/lib/integrations/google-classroom'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/classroom/create-assignment
// Body: { access_token: string, course_id: string, topic_id: string, title: string, description: string, due_date?: string, max_points?: number }
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
    const { 
      access_token: accessToken, 
      course_id: courseId, 
      topic_id: topicId,
      title,
      description,
      due_date: dueDateStr,
      max_points: maxPoints = 100
    } = body

    if (!accessToken || !courseId || !topicId || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: access_token, course_id, topic_id, title' 
      }, { status: 400 })
    }

    // Verify user has permission to create assignments for this course
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('id, pod_name')
      .eq('google_classroom_id', courseId)
      .single()

    if (!pod) {
      return NextResponse.json({ 
        error: 'No learning pod found for this Classroom course' 
      }, { status: 404 })
    }

    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', pod.id)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create assignments for this classroom' 
      }, { status: 403 })
    }

    // Verify the topic exists
    const { data: topic } = await supabase
      .from('question_topics')
      .select('topic_title, topic_description')
      .eq('topic_slug', topicId)
      .single()

    if (!topic) {
      return NextResponse.json({ 
        error: 'Quiz topic not found' 
      }, { status: 404 })
    }

    const classroom = new GoogleClassroomIntegration()
    classroom.setAccessToken(accessToken)
    
    // Parse due date if provided
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined
    
    // Create the assignment
    const assignmentId = await classroom.createQuizAssignment(
      courseId,
      topicId,
      title,
      description || `Complete the ${topic.topic_title} quiz on CivicSense to test your knowledge and earn points toward your civic education goals.`,
      dueDate,
      maxPoints
    )

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        id: assignmentId,
        courseId,
        topicId,
        title,
        description,
        dueDate: dueDate?.toISOString(),
        maxPoints,
        quizUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}?classroom=${courseId}&assignment=${assignmentId}`
      }
    })

  } catch (error) {
    console.error('Error creating classroom assignment:', error)
    
    return NextResponse.json({ 
      error: 'Failed to create classroom assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 