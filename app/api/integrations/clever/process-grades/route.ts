import { NextRequest, NextResponse } from 'next/server'
import { CleverIntegration } from '@/lib/integrations/clever'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/clever/process-grades
// Body: { access_token: string, pod_id: string }
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
    const { access_token: accessToken, pod_id: podId } = body

    if (!accessToken || !podId) {
      return NextResponse.json({ 
        error: 'Missing required fields: access_token and pod_id' 
      }, { status: 400 })
    }

    // Verify user has permission to manage this pod
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to process grades for this pod' 
      }, { status: 403 })
    }

    // Get pod details
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('clever_section_id, pod_name')
      .eq('id', podId)
      .single()

    if (!pod?.clever_section_id) {
      return NextResponse.json({ 
        error: 'Pod is not linked to a Clever section' 
      }, { status: 400 })
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    const gradeResult = await clever.processPendingGrades(podId)

    return NextResponse.json({
      success: true,
      processed: gradeResult.processed,
      errors: gradeResult.errors,
      podName: pod.pod_name,
      sectionId: pod.clever_section_id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Clever grade processing failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Grade processing failed' 
    }, { status: 500 })
  }
}

// GET /api/integrations/clever/process-grades - Get grade report for a section
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
    const accessToken = searchParams.get('access_token')

    if (!sectionId || !accessToken) {
      return NextResponse.json({ 
        error: 'Missing required parameters: section_id and access_token' 
      }, { status: 400 })
    }

    // Verify user has permission to view grades for this section
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('id, pod_name')
      .eq('clever_section_id', sectionId)
      .single()

    if (pod) {
      const { data: membership } = await supabase
        .from('pod_memberships')
        .select('role')
        .eq('pod_id', pod.id)
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .single()

      if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to view grades for this section' 
        }, { status: 403 })
      }
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    const gradeReport = await clever.generateGradeReport(sectionId)

    return NextResponse.json({
      success: true,
      report: gradeReport
    })
  } catch (error) {
    console.error('Failed to generate Clever grade report:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate grade report' 
    }, { status: 500 })
  }
} 