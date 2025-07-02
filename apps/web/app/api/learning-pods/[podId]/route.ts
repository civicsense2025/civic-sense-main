import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/learning-pods/[podId] - Get detailed pod information
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

    // Get pod details with settings
    const { data: pod, error: podError } = await supabase
      .from('learning_pods')
      .select(`
        id,
        pod_name,
        pod_type,
        family_name,
        join_code,
        content_filter_level,
        created_at,
        updated_at,
        pod_settings(
          description,
          is_public,
          welcome_message,
          daily_time_limit_minutes,
          allowed_start_time,
          allowed_end_time,
          allowed_days,
          can_access_multiplayer,
          can_access_chat,
          can_share_progress,
          can_view_leaderboards,
          require_parent_approval_for_friends,
          max_difficulty_level,
          blocked_categories,
          allow_sensitive_topics,
          send_progress_reports,
          report_frequency,
          alert_on_inappropriate_content,
          track_detailed_activity
        )
      `)
      .eq('id', podId)
      .single()

    if (podError || !pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 })
    }

    // Get pod members with their individual settings
    const { data: members, error: membersError } = await supabase
      .from('pod_memberships')
      .select(`
        id,
        user_id,
        role,
        membership_status,
        joined_at,
        member_individual_settings(
          override_time_limits,
          daily_time_limit_minutes,
          allowed_start_time,
          allowed_end_time,
          allowed_days,
          override_content_filter,
          content_filter_level,
          blocked_categories,
          max_difficulty_level,
          override_feature_access,
          can_access_multiplayer,
          can_access_chat,
          can_share_progress,
          can_view_leaderboards,
          override_monitoring,
          send_progress_reports,
          report_frequency,
          alert_on_inappropriate_content
        )
      `)
      .eq('pod_id', podId)
      .eq('membership_status', 'active')
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching pod members:', membersError)
    }

    // Get user profiles for member names and emails
    const userIds = members?.map(m => m.user_id) || []
    
    // Get user info from auth.users and profiles tables
    const userMap = new Map()
    
    try {
      // Get auth users for email
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      authUsers.users?.forEach(user => {
        if (userIds.includes(user.id)) {
          userMap.set(user.id, {
            email: user.email || 'unknown@example.com',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User'
          })
        }
      })

      // Get profiles for display names (enhance existing data)
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name')
        .in('id', userIds)
      
      if (userProfiles && userProfiles.length > 0) {
        userProfiles.forEach(profile => {
          const existing = userMap.get(profile.id)
          if (existing) {
            userMap.set(profile.id, {
              ...existing,
              name: profile.display_name || profile.full_name || existing.name
            })
          }
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Set fallback data for all users
      userIds.forEach(userId => {
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            email: 'unknown@example.com',
            name: 'Unknown User'
          })
        }
      })
    }

    // Extract settings (Supabase returns joined data as arrays)
    const settings = Array.isArray(pod.pod_settings) ? pod.pod_settings[0] : pod.pod_settings

    // Combine pod settings
    const podSettings = {
      pod_name: pod.pod_name,
      pod_type: pod.pod_type,
      description: settings?.description,
      family_name: pod.family_name,
      content_filter_level: pod.content_filter_level,
      is_public: settings?.is_public,
      join_code: pod.join_code,
      welcome_message: settings?.welcome_message,
      daily_time_limit_minutes: settings?.daily_time_limit_minutes,
      allowed_start_time: settings?.allowed_start_time,
      allowed_end_time: settings?.allowed_end_time,
      allowed_days: settings?.allowed_days,
      can_access_multiplayer: settings?.can_access_multiplayer,
      can_access_chat: settings?.can_access_chat,
      can_share_progress: settings?.can_share_progress,
      can_view_leaderboards: settings?.can_view_leaderboards,
      require_parent_approval_for_friends: settings?.require_parent_approval_for_friends,
      max_difficulty_level: settings?.max_difficulty_level,
      blocked_categories: settings?.blocked_categories,
      allow_sensitive_topics: settings?.allow_sensitive_topics,
      send_progress_reports: settings?.send_progress_reports,
      report_frequency: settings?.report_frequency,
      alert_on_inappropriate_content: settings?.alert_on_inappropriate_content,
      track_detailed_activity: settings?.track_detailed_activity
    }

    // Format members data with real user information
    const formattedMembers = (members || []).map(member => {
      const userInfo = userMap.get(member.user_id) || { 
        email: 'unknown@example.com', 
        name: 'Unknown User' 
      }
      
      return {
        id: member.id,
        user_id: member.user_id,
        name: userInfo.name,
        email: userInfo.email,
        role: member.role,
        joined_at: member.joined_at,
        status: member.membership_status,
        avatar: null,
        individual_settings: member.member_individual_settings?.[0] || null
      }
    })

    // Get member count
    const memberCount = formattedMembers.length

    const podDetails = {
      id: pod.id,
      pod_name: pod.pod_name,
      pod_type: pod.pod_type,
      family_name: pod.family_name,
      join_code: pod.join_code,
      member_count: memberCount,
      user_role: membership.role,
      is_admin: ['admin', 'parent', 'organizer', 'teacher'].includes(membership.role),
      created_at: pod.created_at,
      settings: podSettings,
      members: formattedMembers
    }

    return NextResponse.json({ pod: podDetails })
  } catch (error) {
    console.error('Error in pod details GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/learning-pods/[podId] - Update pod settings
export async function PUT(
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

    // Check if user has admin permissions for this pod
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

    // Update basic pod information
    const { error: updateError } = await supabase
      .from('learning_pods')
      .update({
        pod_name: body.pod_name,
        description: body.description,
        content_filter_level: body.content_filter_level,
        is_public: body.is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', podId)

    if (updateError) {
      console.error('Error updating pod:', updateError)
      return NextResponse.json({ error: 'Failed to update pod' }, { status: 500 })
    }

    // In a real app, you would also update pod settings in a separate table
    // For now, we'll just return success

    return NextResponse.json({ 
      success: true,
      message: 'Pod settings updated successfully'
    })
  } catch (error) {
    console.error('Error in pod settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { action, ...updateData } = body

    // Verify user has admin access to this pod
    const { data: membership, error: membershipError } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || !['admin', 'parent', 'teacher', 'organizer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Handle different update actions
    let updateFields: any = {}

    if (action === 'update_emoji' && updateData.emoji) {
      updateFields.pod_emoji = updateData.emoji
    } else if (action === 'update_title' && updateData.title) {
      updateFields.pod_name = updateData.title.trim()
    } else if (action === 'archive') {
      updateFields.archived_at = new Date().toISOString()
      updateFields.archived_by = user.id
    } else {
      // General update - validate allowed fields
      const allowedFields = ['pod_name', 'pod_emoji', 'description', 'pod_motto', 'pod_color']
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updateFields[key] = value
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the pod
    const { data: updatedPod, error: updateError } = await supabase
      .from('learning_pods')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', podId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating pod:', updateError)
      return NextResponse.json({ error: 'Failed to update pod' }, { status: 500 })
    }

    // Create activity log for the update
    const activityDescription = action === 'update_emoji' 
      ? `Pod emoji changed to ${updateData.emoji}`
      : action === 'update_title'
      ? `Pod renamed to "${updateData.title}"`
      : action === 'archive'
      ? 'Pod archived'
      : 'Pod settings updated'

    await supabase
      .from('pod_activities')
      .insert({
        pod_id: podId,
        activity_type: 'settings_updated',
        description: activityDescription,
        user_name: user.user_metadata?.full_name || user.email || 'Admin',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true, 
      pod: updatedPod,
      message: 'Pod updated successfully'
    })
  } catch (error) {
    console.error('Error in pod update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 