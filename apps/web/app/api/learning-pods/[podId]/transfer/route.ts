import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { podId } = await params
    const { newOwnerEmail } = await request.json()

    if (!newOwnerEmail || !newOwnerEmail.trim()) {
      return NextResponse.json({ error: 'New owner email is required' }, { status: 400 })
    }

    // Verify current user is admin of this pod
    const { data: currentMembership, error: membershipError } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !currentMembership || !['admin', 'parent', 'organizer'].includes(currentMembership.role)) {
      return NextResponse.json({ error: 'Only pod admins can transfer ownership' }, { status: 403 })
    }

    // Find the new owner by email
    const { data: newOwner, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', newOwnerEmail.trim().toLowerCase())
      .single()

    if (userError || !newOwner) {
      return NextResponse.json({ error: 'User with that email not found' }, { status: 404 })
    }

    // Check if new owner is already a member
    const { data: existingMembership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', newOwner.id)
      .single()

    // Start a transaction-like operation
    if (existingMembership) {
      // Update existing member to admin
      const { error: updateError } = await supabase
        .from('pod_memberships')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('pod_id', podId)
        .eq('user_id', newOwner.id)

      if (updateError) {
        console.error('Error updating member role:', updateError)
        return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 })
      }
    } else {
      // Add new owner as admin
      const { error: insertError } = await supabase
        .from('pod_memberships')
        .insert({
          pod_id: podId,
          user_id: newOwner.id,
          role: 'admin',
          membership_status: 'active',
          joined_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error adding new admin:', insertError)
        return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 })
      }
    }

    // Demote current admin to member (unless they want to leave)
    const { error: demoteError } = await supabase
      .from('pod_memberships')
      .update({ 
        role: 'member',
        updated_at: new Date().toISOString()
      })
      .eq('pod_id', podId)
      .eq('user_id', user.id)

    if (demoteError) {
      console.error('Error demoting current admin:', demoteError)
      // This is not critical - the transfer already succeeded
    }

    // Create activity log
    await supabase
      .from('pod_activities')
      .insert({
        pod_id: podId,
        activity_type: 'ownership_transferred',
        description: `Pod ownership transferred to ${newOwner.full_name || newOwner.email}`,
        user_name: user.user_metadata?.full_name || user.email || 'Former Admin',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true, 
      message: `Pod ownership transferred to ${newOwner.full_name || newOwner.email}`,
      newOwner: {
        email: newOwner.email,
        name: newOwner.full_name
      }
    })
  } catch (error) {
    console.error('Error in pod transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 