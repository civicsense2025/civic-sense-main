import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/learning-pods/[podId]/activity - Get pod activity log
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const activityType = searchParams.get('type')
    const userId = searchParams.get('user_id')

    // Check if user has access to view activity logs
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

    // Only admins can view full activity logs
    if (!['admin', 'parent', 'organizer', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('pod_activity_log')
      .select('*')
      .eq('pod_id', podId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activity log:', error)
      return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
    }

    // Get user information for activity participants
    const userIds = [...new Set(activities?.map(a => a.user_id) || [])]
    const { data: userProfiles } = await supabase.auth.admin.listUsers()
    
    const userMap = new Map()
    userProfiles.users?.forEach(user => {
      if (userIds.includes(user.id)) {
        userMap.set(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User'
        })
      }
    })

    // Format activities with user information
    const formattedActivities = activities?.map(activity => ({
      ...activity,
      user_name: userMap.get(activity.user_id)?.name || 'Unknown User',
      user_email: userMap.get(activity.user_id)?.email || 'unknown@example.com'
    }))

    return NextResponse.json({
      success: true,
      data: {
        activities: formattedActivities || [],
        pagination: {
          limit,
          offset,
          total: formattedActivities?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Error in activity route:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/learning-pods/[podId]/activity - Log a new activity
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
    const { 
      activity_type, 
      activity_data = {}, 
      session_id,
      target_user_id 
    } = body

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

    // Validate activity type
    const validActivityTypes = [
      'joined', 'left', 'quiz_completed', 'message_sent', 
      'achievement_earned', 'helped_member', 'content_flagged'
    ]

    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Use the database function to log activity
    const { data: activityId, error } = await supabase.rpc('log_pod_activity', {
      p_pod_id: podId,
      p_user_id: target_user_id || user.id,
      p_activity_type: activity_type,
      p_activity_data: {
        ...activity_data,
        session_id: session_id,
        logged_by: user.id,
        timestamp: new Date().toISOString()
      }
    })

    if (error) {
      console.error('Error logging activity:', error)
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        activity_id: activityId,
        message: 'Activity logged successfully'
      }
    })

  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 