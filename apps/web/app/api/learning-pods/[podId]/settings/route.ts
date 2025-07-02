import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/learning-pods/[podId]/settings - Get pod and member settings
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
      .select('role')
      .eq('pod_id', podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
    }

    // Get pod settings
    const { data: podSettings, error: podError } = await supabase
      .from('pod_settings')
      .select('*')
      .eq('pod_id', podId)
      .single()

    if (podError) {
      console.error('Error fetching pod settings:', podError)
      return NextResponse.json({ error: 'Failed to fetch pod settings' }, { status: 500 })
    }

    // Get member individual settings (only for admins or self)
    let memberSettings = null
    if (membership.role in ['admin', 'parent', 'organizer', 'teacher']) {
      const { data: allMemberSettings } = await supabase
        .from('member_individual_settings')
        .select('*')
        .eq('pod_id', podId)
      
      memberSettings = allMemberSettings
    } else {
      // Regular members can only see their own settings
      const { data: ownSettings } = await supabase
        .from('member_individual_settings')
        .select('*')
        .eq('pod_id', podId)
        .eq('user_id', user.id)
        .single()
      
      memberSettings = ownSettings ? [ownSettings] : []
    }

    return NextResponse.json({
      success: true,
      data: {
        pod_settings: podSettings,
        member_settings: memberSettings || [],
        user_role: membership.role
      }
    })

  } catch (error) {
    console.error('Error in settings route:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/learning-pods/[podId]/settings - Update pod settings
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
    const { pod_settings, member_settings } = body

    // Check if user has admin privileges
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

    let updatedPodSettings = null
    let updatedMemberSettings = null

    // Update pod settings if provided
    if (pod_settings) {
      const { data, error } = await supabase
        .from('pod_settings')
        .update({
          description: pod_settings.description,
          is_public: pod_settings.is_public,
          welcome_message: pod_settings.welcome_message,
          daily_time_limit_minutes: pod_settings.daily_time_limit_minutes,
          allowed_start_time: pod_settings.allowed_start_time,
          allowed_end_time: pod_settings.allowed_end_time,
          allowed_days: pod_settings.allowed_days,
          can_access_multiplayer: pod_settings.can_access_multiplayer,
          can_access_chat: pod_settings.can_access_chat,
          can_share_progress: pod_settings.can_share_progress,
          can_view_leaderboards: pod_settings.can_view_leaderboards,
          require_parent_approval_for_friends: pod_settings.require_parent_approval_for_friends,
          max_difficulty_level: pod_settings.max_difficulty_level,
          blocked_categories: pod_settings.blocked_categories,
          allow_sensitive_topics: pod_settings.allow_sensitive_topics,
          send_progress_reports: pod_settings.send_progress_reports,
          report_frequency: pod_settings.report_frequency,
          alert_on_inappropriate_content: pod_settings.alert_on_inappropriate_content,
          track_detailed_activity: pod_settings.track_detailed_activity
        })
        .eq('pod_id', podId)
        .select()
        .single()

      if (error) {
        console.error('Error updating pod settings:', error)
        return NextResponse.json({ error: 'Failed to update pod settings' }, { status: 500 })
      }

      updatedPodSettings = data
    }

    // Update member settings if provided
    if (member_settings && Array.isArray(member_settings)) {
      const memberUpdates = []

      for (const memberSetting of member_settings) {
        const { data, error } = await supabase
          .from('member_individual_settings')
          .upsert({
            pod_id: podId,
            user_id: memberSetting.user_id,
            override_time_limits: memberSetting.override_time_limits,
            daily_time_limit_minutes: memberSetting.daily_time_limit_minutes,
            allowed_start_time: memberSetting.allowed_start_time,
            allowed_end_time: memberSetting.allowed_end_time,
            allowed_days: memberSetting.allowed_days,
            override_content_filter: memberSetting.override_content_filter,
            content_filter_level: memberSetting.content_filter_level,
            blocked_categories: memberSetting.blocked_categories,
            max_difficulty_level: memberSetting.max_difficulty_level,
            override_feature_access: memberSetting.override_feature_access,
            can_access_multiplayer: memberSetting.can_access_multiplayer,
            can_access_chat: memberSetting.can_access_chat,
            can_share_progress: memberSetting.can_share_progress,
            can_view_leaderboards: memberSetting.can_view_leaderboards,
            override_monitoring: memberSetting.override_monitoring,
            send_progress_reports: memberSetting.send_progress_reports,
            report_frequency: memberSetting.report_frequency,
            alert_on_inappropriate_content: memberSetting.alert_on_inappropriate_content
          })
          .select()
          .single()

        if (error) {
          console.error('Error updating member settings:', error)
        } else {
          memberUpdates.push(data)
        }
      }

      updatedMemberSettings = memberUpdates
    }

    // Log the activity
    await supabase.rpc('log_pod_activity', {
      p_pod_id: podId,
      p_user_id: user.id,
      p_activity_type: 'settings_updated',
      p_activity_data: {
        updated_pod_settings: !!pod_settings,
        updated_member_settings: !!member_settings,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        pod_settings: updatedPodSettings,
        member_settings: updatedMemberSettings
      }
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 