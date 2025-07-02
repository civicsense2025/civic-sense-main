import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/learning-pods/[podId]/members - Get pod members
export async function GET(
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

    // Check if user is a member of this pod
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role, membership_status')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
    }

    // Get all members with their analytics
    const { data: members, error: membersError } = await supabase
      .from('pod_memberships')
      .select(`
        user_id,
        role,
        joined_at,
        membership_status,
        is_active,
        pod_member_analytics (
          accuracy_rate,
          questions_answered,
          quiz_attempts,
          time_spent_minutes,
          current_streak,
          longest_streak,
          achievements_earned,
          sessions_count,
          correct_answers
        )
      `)
      .eq('pod_id', podId)
      .eq('membership_status', 'active')
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching pod members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Get user profiles for all members
    const userIds = members?.map(m => m.user_id) || []
    const { data: userProfiles } = await supabase.auth.admin.listUsers()
    
    const userMap = new Map()
    userProfiles.users?.forEach(user => {
      if (userIds.includes(user.id)) {
        userMap.set(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          avatar_url: user.user_metadata?.avatar_url,
          created_at: user.created_at
        })
      }
    })

    // Format members with analytics
    const formattedMembers = members?.map(member => {
      const userProfile = userMap.get(member.user_id)
      const analytics = member.pod_member_analytics?.[0] || {}
      
      return {
        user_id: member.user_id,
        name: userProfile?.name || 'Unknown User',
        email: userProfile?.email || 'unknown@example.com',
        avatar_url: userProfile?.avatar_url,
        role: member.role,
        joined_at: member.joined_at,
        is_active: member.is_active,
        stats: {
          accuracy_rate: analytics.accuracy_rate || 0,
          questions_answered: analytics.questions_answered || 0,
          quiz_attempts: analytics.quiz_attempts || 0,
          time_spent_minutes: analytics.time_spent_minutes || 0,
          current_streak: analytics.current_streak || 0,
          longest_streak: analytics.longest_streak || 0,
          achievements_earned: analytics.achievements_earned || 0,
          sessions_count: analytics.sessions_count || 0,
          correct_answers: analytics.correct_answers || 0
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: {
        members: formattedMembers,
        total: formattedMembers.length,
        user_role: membership.role
      }
    })

  } catch (error) {
    console.error('Error in members GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/learning-pods/[podId]/members - Invite/Add member
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
    const body = await request.json()
    const { email, role = 'member', message } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user has admin permissions
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to add members' }, { status: 403 })
    }

    // Check if user exists by email
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const targetUser = existingUser.users?.find(u => u.email === email)

    if (!targetUser) {
      // Create a pending invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('pod_join_requests')
        .insert({
          pod_id: podId,
          user_email: email,
          requested_role: role,
          message: message || null,
          invited_by: user.id,
          status: 'invited',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

      if (inviteError) {
        console.error('Error creating invitation:', inviteError)
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
      }

      // TODO: Send invitation email
      
      return NextResponse.json({
        success: true,
        data: {
          invitation_id: invitation.id,
          message: 'Invitation sent successfully'
        }
      })
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('pod_memberships')
      .select('id, membership_status')
      .eq('pod_id', podId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingMembership && existingMembership.membership_status === 'active') {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add user as member
    const { data: newMembership, error: membershipError } = await supabase
      .from('pod_memberships')
      .insert({
        pod_id: podId,
        user_id: targetUser.id,
        role: role,
        membership_status: 'active',
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    // Create activity log
    await supabase
      .from('pod_activities')
      .insert({
        pod_id: podId,
        user_id: targetUser.id,
        activity_type: 'joined',
        activity_data: {
          invited_by: user.id,
          role: role
        }
      })

    // Initialize member analytics
    await supabase
      .from('pod_member_analytics')
      .insert({
        pod_id: podId,
        user_id: targetUser.id,
        date_recorded: new Date().toISOString().split('T')[0]
      })

    return NextResponse.json({
      success: true,
      data: {
        member_id: newMembership.id,
        message: 'Member added successfully'
      }
    })

  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/learning-pods/[podId]/members - Update member role or status
export async function PATCH(
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
    const body = await request.json()
    const { user_id, action, role, reason } = body

    if (!user_id || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 })
    }

    // Check if current user has admin permissions
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership || !['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent self-demotion of the last admin
    if (user_id === user.id && action === 'update_role' && role !== 'admin') {
      const { data: adminCount } = await supabase
        .from('pod_memberships')
        .select('id', { count: 'exact' })
        .eq('pod_id', podId)
        .eq('role', 'admin')
        .eq('membership_status', 'active')

      if ((adminCount?.length || 0) <= 1) {
        return NextResponse.json({ 
          error: 'Cannot demote the last admin. Promote another member first.' 
        }, { status: 400 })
      }
    }

    let updateData: any = { updated_at: new Date().toISOString() }
    let activityType = 'member_updated'
    let activityData: any = { updated_by: user.id, reason }

    switch (action) {
      case 'update_role':
        if (!role) {
          return NextResponse.json({ error: 'Role is required' }, { status: 400 })
        }
        updateData.role = role
        activityType = 'role_updated'
        activityData.new_role = role
        break

      case 'remove':
        updateData.membership_status = 'removed'
        updateData.removed_at = new Date().toISOString()
        activityType = 'left'
        activityData.removed_by = user.id
        break

      case 'suspend':
        updateData.membership_status = 'suspended'
        updateData.suspended_at = new Date().toISOString()
        activityType = 'suspended'
        break

      case 'reactivate':
        updateData.membership_status = 'active'
        updateData.suspended_at = null
        activityType = 'reactivated'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update membership
    const { data: updatedMembership, error: updateError } = await supabase
      .from('pod_memberships')
      .update(updateData)
      .eq('pod_id', podId)
      .eq('user_id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating membership:', updateError)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    // Create activity log
    await supabase
      .from('pod_activities')
      .insert({
        pod_id: podId,
        user_id: user_id,
        activity_type: activityType,
        activity_data: activityData
      })

    return NextResponse.json({
      success: true,
      data: {
        membership: updatedMembership,
        message: 'Member updated successfully'
      }
    })

  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 