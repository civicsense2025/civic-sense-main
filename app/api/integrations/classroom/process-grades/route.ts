import { NextRequest, NextResponse } from 'next/server'
import { GoogleClassroomIntegration } from '@/lib/integrations/google-classroom'
import { createClient } from '@/lib/supabase/server'

// POST /api/integrations/classroom/process-grades
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
      .select('google_classroom_id, grade_passback_enabled, pod_name')
      .eq('id', podId)
      .single()

    if (!pod?.google_classroom_id) {
      return NextResponse.json({ 
        error: 'Pod is not linked to a Google Classroom course' 
      }, { status: 400 })
    }

    if (!pod.grade_passback_enabled) {
      return NextResponse.json({ 
        error: 'Grade passback is not enabled for this pod' 
      }, { status: 400 })
    }

    const classroom = new GoogleClassroomIntegration()
    classroom.setAccessToken(accessToken)
    
    // Process pending grades
    const result = await classroom.processPendingGrades(podId)

    // Log the batch grade processing
    await supabase.rpc('log_classroom_sync', {
      p_pod_id: podId,
      p_sync_type: 'grades',
      p_sync_status: result.errors > 0 ? 'partial' : 'success',
      p_records_processed: result.processed + result.errors,
      p_records_successful: result.processed,
      p_error_details: result.errors > 0 ? { 
        errors_count: result.errors,
        message: `${result.errors} grade submissions failed` 
      } : null
    })

    return NextResponse.json({
      success: true,
      message: `Grade processing completed for ${pod.pod_name}`,
      result: {
        gradesProcessed: result.processed,
        gradesWithErrors: result.errors,
        totalAttempted: result.processed + result.errors,
        successRate: result.processed + result.errors > 0 
          ? (result.processed / (result.processed + result.errors) * 100).toFixed(1) + '%' 
          : '0%'
      }
    })

  } catch (error) {
    console.error('Error processing classroom grades:', error)
    
    // Log error to database if we have pod context
    try {
      const { pod_id } = await request.json().catch(() => ({}))
      if (pod_id) {
        const supabase = await createClient()
        await supabase.rpc('log_classroom_sync', {
          p_pod_id: pod_id,
          p_sync_type: 'grades',
          p_sync_status: 'error',
          p_error_details: { 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }
        })
      }
    } catch {
      // Ignore logging errors
    }
    
    return NextResponse.json({ 
      error: 'Failed to process classroom grades',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 