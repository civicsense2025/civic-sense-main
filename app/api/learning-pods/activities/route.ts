import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent activities for pods where the user is a member
    const { data: activities, error } = await supabase
      .from('pod_activities')
      .select(`
        id,
        activity_type,
        description,
        created_at,
        user_name,
        pod_id
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch activities',
        activities: []
      }, { status: 500 })
    }

    // Get user's pod IDs to filter activities
    const { data: userPods } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')

    const userPodIds = userPods?.map(p => p.pod_id) || []

    // Filter activities to only those from user's pods
    const userActivities = (activities || []).filter((activity: any) => 
      userPodIds.includes(activity.pod_id)
    )

    // Get pod names for the activities
    const { data: podNames } = await supabase
      .from('learning_pods')
      .select('id, pod_name')
      .in('id', userPodIds)

    const podNameMap = podNames?.reduce((acc: Record<string, string>, pod: any) => {
      acc[pod.id] = pod.pod_name
      return acc
    }, {}) || {}

    // Format the response
    const formattedActivities = userActivities.map((activity: any) => ({
      id: activity.id,
      pod_name: podNameMap[activity.pod_id] || 'Unknown Pod',
      activity_type: activity.activity_type,
      description: activity.description,
      created_at: activity.created_at,
      user_name: activity.user_name
    }))

    return NextResponse.json({ 
      success: true, 
      activities: formattedActivities 
    })
  } catch (error) {
    console.error('Error in activities API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      activities: []
    }, { status: 500 })
  }
} 