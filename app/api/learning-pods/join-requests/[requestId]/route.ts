import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/learning-pods/join-requests/[requestId] - Approve or deny a join request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the join request
    const { data: joinRequest, error: fetchError } = await supabase
      .from('pod_join_requests')
      .select(`
        id,
        pod_id,
        requester_id,
        status,
        learning_pods!inner(pod_name)
      `)
      .eq('id', params.requestId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check if user has permission to approve/deny for this pod
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', joinRequest.pod_id)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied'

    // Update the join request
    const { error: updateError } = await supabase
      .from('pod_join_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', params.requestId)

    if (updateError) {
      console.error('Error updating join request:', updateError)
      return NextResponse.json({ error: 'Failed to update join request' }, { status: 500 })
    }

    // If approved, add user to pod
    if (action === 'approve') {
      const { error: membershipError } = await supabase
        .from('pod_memberships')
        .insert({
          pod_id: joinRequest.pod_id,
          user_id: joinRequest.requester_id,
          role: 'member',
          membership_status: 'active'
        })

      if (membershipError) {
        console.error('Error creating pod membership:', membershipError)
        // Revert the join request status
        await supabase
          .from('pod_join_requests')
          .update({ status: 'pending' })
          .eq('id', params.requestId)
        
        return NextResponse.json({ error: 'Failed to add user to pod' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Join request ${action}d successfully`
    })
  } catch (error) {
    console.error('Error in join request PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 