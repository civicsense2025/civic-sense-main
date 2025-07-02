import { NextRequest, NextResponse } from 'next/server'
import { CleverIntegration } from '@civicsense/shared/lib/integrations/clever'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// POST /api/integrations/clever/sync-roster
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
        error: 'Insufficient permissions to sync Clever roster' 
      }, { status: 403 })
    }

    // Get pod's clever section ID
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('clever_section_id, clever_sync_enabled')
      .eq('id', podId)
      .single()

    if (!pod?.clever_section_id) {
      return NextResponse.json({ 
        error: 'Pod is not linked to a Clever section' 
      }, { status: 400 })
    }

    if (!pod.clever_sync_enabled) {
      return NextResponse.json({ 
        error: 'Clever sync is not enabled for this pod' 
      }, { status: 400 })
    }

    const clever = new CleverIntegration()
    clever.setAccessToken(accessToken)

    const syncResult = await clever.syncRoster(podId)

    // Update last sync timestamp
    await supabase
      .from('learning_pods')
      .update({
        clever_last_sync: new Date().toISOString(),
        clever_sync_errors: null
      })
      .eq('id', podId)

    return NextResponse.json({
      success: true,
      studentsAdded: syncResult.studentsAdded,
      teachersAdded: syncResult.teachersAdded,
      totalAdded: syncResult.studentsAdded + syncResult.teachersAdded,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Clever roster sync failed:', error)
    
    // Try to update error state in pod
    try {
      const requestText = await request.text()
      const { pod_id: podId } = requestText ? JSON.parse(requestText) : {}
      
      if (podId) {
        const supabase = await createClient()
        await supabase
          .from('learning_pods')
          .update({
            clever_sync_errors: {
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', podId)
      }
    } catch (updateError) {
      console.error('Failed to update error state:', updateError)
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Roster sync failed' 
    }, { status: 500 })
  }
} 