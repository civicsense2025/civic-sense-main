import { NextRequest, NextResponse } from 'next/server'
import { GoogleClassroomIntegration } from '@civicsense/shared/lib/integrations/google-classroom'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// POST /api/integrations/classroom/sync-roster
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
        error: 'Insufficient permissions to sync classroom roster' 
      }, { status: 403 })
    }

    // Get pod's classroom course ID
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('google_classroom_id, classroom_sync_enabled')
      .eq('id', podId)
      .single()

    if (!pod?.google_classroom_id) {
      return NextResponse.json({ 
        error: 'Pod is not linked to a Google Classroom course' 
      }, { status: 400 })
    }

    if (!pod.classroom_sync_enabled) {
      return NextResponse.json({ 
        error: 'Classroom sync is not enabled for this pod' 
      }, { status: 400 })
    }

    const classroom = new GoogleClassroomIntegration()
    classroom.setAccessToken(accessToken)
    
    // Sync the roster
    const syncResult = await classroom.syncRoster(podId)

    // Update last sync timestamp
    await supabase
      .from('learning_pods')
      .update({ 
        classroom_last_sync: new Date().toISOString(),
        classroom_sync_errors: null
      })
      .eq('id', podId)

    return NextResponse.json({
      success: true,
      message: 'Roster sync completed successfully',
      result: {
        studentsProcessed: syncResult.studentsAdded,
        teachersProcessed: syncResult.teachersAdded,
        totalProcessed: syncResult.studentsAdded + syncResult.teachersAdded
      }
    })

  } catch (error) {
    console.error('Error in classroom roster sync:', error)
    
    // Log error to database if we have pod context
    try {
      const { pod_id } = await request.json().catch(() => ({}))
      if (pod_id) {
        const supabase = await createClient()
        await supabase.rpc('log_classroom_sync', {
          p_pod_id: pod_id,
          p_sync_type: 'roster',
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
      error: 'Failed to sync classroom roster',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 