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

    const { requestId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "deny"' }, { status: 400 })
    }

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('pod_join_requests')
      .select(`
        id,
        pod_id,
        user_id,
        user_email,
        requested_role,
        message,
        status,
        learning_pods!inner (
          pod_name,
          max_members
        )
      `)
      .eq('id', requestId)
      .single()

    if (requestError || !joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 })
    }

    // Check if current user has permission to manage this request
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', joinRequest.pod_id)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to manage join requests' }, { status: 403 })
    }

    if (action === 'approve') {
      // Check pod capacity if there's a limit
      const podData = joinRequest.learning_pods as any
      if (podData?.max_members) {
        const { data: memberCount } = await supabase
          .from('pod_memberships')
          .select('id', { count: 'exact' })
          .eq('pod_id', joinRequest.pod_id)
          .eq('membership_status', 'active')

        if ((memberCount?.length || 0) >= podData.max_members) {
          return NextResponse.json({ error: 'Pod is at maximum capacity' }, { status: 400 })
        }
      }

      // For requests with user_id, add them directly
      if (joinRequest.user_id) {
        // Check if user is already a member (in case they were added elsewhere)
        const { data: existingMembership } = await supabase
          .from('pod_memberships')
          .select('id, membership_status')
          .eq('pod_id', joinRequest.pod_id)
          .eq('user_id', joinRequest.user_id)
          .single()

        if (existingMembership && existingMembership.membership_status === 'active') {
          // Update request status anyway
          await supabase
            .from('pod_join_requests')
            .update({
              status: 'approved',
              processed_at: new Date().toISOString(),
              processed_by: user.id
            })
            .eq('id', requestId)

          return NextResponse.json({
            success: true,
            message: 'User is already a member of this pod'
          })
        }

        // Add user as member
        const { error: membershipError } = await supabase
          .from('pod_memberships')
          .insert({
            pod_id: joinRequest.pod_id,
            user_id: joinRequest.user_id,
            role: joinRequest.requested_role || 'member',
            membership_status: 'active',
            joined_at: new Date().toISOString()
          })

        if (membershipError) {
          console.error('Error creating membership:', membershipError)
          return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
        }

        // Create activity log for joining
        await supabase
          .from('pod_activities')
          .insert({
            pod_id: joinRequest.pod_id,
            user_id: joinRequest.user_id,
            activity_type: 'joined',
            activity_data: {
              approved_by: user.id,
              via_join_request: true,
              role: joinRequest.requested_role || 'member'
            }
          })

        // Initialize member analytics
        await supabase
          .from('pod_member_analytics')
          .insert({
            pod_id: joinRequest.pod_id,
            user_id: joinRequest.user_id,
            date_recorded: new Date().toISOString().split('T')[0]
          })
      } else {
        // For email-only requests, we need to send an invitation
        // This would typically involve creating an invite link and sending an email
        console.log('TODO: Send invitation email to', joinRequest.user_email)
      }
    }

    // Update the join request status
    const { error: updateError } = await supabase
      .from('pod_join_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'denied',
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating join request:', updateError)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    // Create activity log for the approval/denial
    await supabase
      .from('pod_activities')
      .insert({
        pod_id: joinRequest.pod_id,
        user_id: user.id,
        activity_type: 'join_request_processed',
        activity_data: {
          action: action,
          request_id: requestId,
          target_user_id: joinRequest.user_id,
          target_email: joinRequest.user_email
        }
      })

    return NextResponse.json({
      success: true,
      message: `Join request ${action}d successfully`
    })

  } catch (error) {
    console.error('Error processing join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/learning-pods/join-requests/[requestId] - Cancel/Delete a join request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await params

    // Get the join request to check ownership
    const { data: joinRequest, error: requestError } = await supabase
      .from('pod_join_requests')
      .select('id, pod_id, user_id, user_email, status')
      .eq('id', requestId)
      .single()

    if (requestError || !joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check if user can delete this request (either the requester or pod admin)
    let canDelete = false

    // Check if user is the requester
    if (joinRequest.user_id === user.id) {
      canDelete = true
    } else {
      // Check if user is a pod admin
      const { data: membership } = await supabase
        .from('pod_memberships')
        .select('role')
        .eq('pod_id', joinRequest.pod_id)
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .single()

      if (membership && ['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
        canDelete = true
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this request' }, { status: 403 })
    }

    // Delete the join request
    const { error: deleteError } = await supabase
      .from('pod_join_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting join request:', deleteError)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Join request deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 