import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/learning-pods/join-requests - Get join requests for pods the user administers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's admin pod IDs first
    const { data: adminPods } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .eq('user_id', user.id)
      .in('role', ['admin', 'parent', 'teacher', 'organizer'])
      .eq('membership_status', 'active')

    const adminPodIds = adminPods?.map(p => p.pod_id) || []

    if (adminPodIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        requests: []
      })
    }

    // Get join requests for pods where the user is an admin
    const { data: joinRequests, error } = await supabase
      .from('pod_join_requests')
      .select(`
        id,
        pod_id,
        requester_id,
        message,
        created_at,
        status
      `)
      .in('pod_id', adminPodIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching join requests:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch join requests',
        requests: []
      }, { status: 500 })
    }

    // Get pod names and user info for the requests
    const podIds = [...new Set(joinRequests?.map(r => r.pod_id) || [])]
    const userIds = [...new Set(joinRequests?.map(r => r.requester_id) || [])]

    const [podData, userData] = await Promise.all([
      supabase.from('learning_pods').select('id, pod_name').in('id', podIds),
      supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    ])

    const podNameMap = podData.data?.reduce((acc: Record<string, string>, pod: any) => {
      acc[pod.id] = pod.pod_name
      return acc
    }, {}) || {}

    const userMap = userData.data?.reduce((acc: Record<string, any>, user: any) => {
      acc[user.id] = user
      return acc
    }, {}) || {}

    // Format the response
    const formattedRequests = (joinRequests || []).map((request: any) => {
      const user = userMap[request.requester_id] || {}
      return {
        id: request.id,
        user_name: user.full_name || 'Unknown User',
        user_email: user.email || 'Unknown Email',
        pod_name: podNameMap[request.pod_id] || 'Unknown Pod',
        pod_id: request.pod_id,
        requested_at: request.created_at,
        message: request.message
      }
    })

    return NextResponse.json({ 
      success: true, 
      requests: formattedRequests 
    })
  } catch (error) {
    console.error('Error in join requests API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      requests: []
    }, { status: 500 })
  }
} 