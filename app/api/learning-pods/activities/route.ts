import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const activityType = searchParams.get('type')
    const podId = searchParams.get('podId')
    
    // Calculate offset
    const offset = (page - 1) * limit

    // Get user's pod memberships first
    const { data: memberships, error: membershipError } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    const podIds = memberships?.map(m => m.pod_id) || []

    if (podIds.length === 0) {
      return NextResponse.json({ activities: [], total: 0 })
    }

    // Build query
    let query = supabase
      .from('pod_activities')
      .select(`
        id,
        activity_type,
        activity_data,
        created_at,
        pod_id,
        user_id,
        learning_pods!inner (
          pod_name
        ),
        profiles!inner (
          full_name
        )
      `, { count: 'exact' })
      .in('pod_id', podIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters if provided
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }
    if (podId) {
      query = query.eq('pod_id', podId)
    }

    const { data: activities, error: activitiesError, count } = await query

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Transform the data to match the frontend interface
    const transformedActivities = activities?.map(activity => ({
      id: activity.id,
      pod_id: activity.pod_id,
      pod_name: activity.learning_pods.pod_name,
      activity_type: activity.activity_type,
      user_name: activity.profiles.full_name,
      activity_data: activity.activity_data,
      created_at: activity.created_at
    })) || []

    return NextResponse.json({ 
      activities: transformedActivities,
      total: count || 0,
      page,
      limit
    })

  } catch (error) {
    console.error('Error in activities route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 