import { NextRequest, NextResponse } from 'next/server'
import { CleverIntegration } from '@/lib/integrations/clever'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/clever/create-assignment
// Body: { access_token: string, section_id: string, topic_id: string, title: string, description: string, due_date?: string, max_points?: number }
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
      section_id: sectionId,
      topic_id: topicId,
      title,
      description,
      due_date: dueDate,
      max_points: maxPoints = 100
    } = body

    if (!accessToken || !sectionId || !topicId || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: access_token, section_id, topic_id, title' 
      }, { status: 400 })
    }

    // Find the pod linked to this Clever section
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('id, pod_name')
      .eq('clever_section_id', sectionId)
      .single()

    if (pod) {
      // Verify user has permission to manage this pod
      const { data: membership } = await supabase
        .from('pod_memberships')
        .select('role')
        .eq('pod_id', pod.id)
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .single()

      if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to create assignments for this section' 
        }, { status: 403 })
      }
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    const assignmentId = await clever.createQuizAssignment(
      sectionId,
      topicId,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined,
      maxPoints
    )

    // Get the topic details for response
    const { data: topic } = await supabase
      .from('question_topics')
      .select('title, description')
      .eq('id', topicId)
      .single()

    return NextResponse.json({
      success: true,
      assignmentId,
      sectionId,
      topicId,
      title,
      description,
      maxPoints,
      dueDate,
      externalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}?clever=${sectionId}`,
      topic: topic ? {
        title: topic.title,
        description: topic.description
      } : null
    })
  } catch (error) {
    console.error('Clever assignment creation failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Assignment creation failed' 
    }, { status: 500 })
  }
}

// GET /api/integrations/clever/create-assignment - List assignments for a section
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('section_id')

    if (!sectionId) {
      return NextResponse.json({ error: 'Missing section_id parameter' }, { status: 400 })
    }

    // Get assignments for this section
    const { data: assignments, error } = await supabase
      .from('school.assignments')
      .select(`
        *,
        question_topics!inner(title, description)
      `)
      .eq('section_id', sectionId)
      .eq('lms_platform', 'clever')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assignments: assignments?.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        topicId: assignment.topic_id,
        topicTitle: assignment.question_topics?.title,
        dueDate: assignment.due_date,
        maxPoints: assignment.max_points,
        externalUrl: assignment.external_url,
        createdAt: assignment.created_at
      })) || []
    })
  } catch (error) {
    console.error('Failed to list Clever assignments:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to list assignments' 
    }, { status: 500 })
  }
} 