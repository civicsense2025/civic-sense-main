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

    // Get pods where user is admin/parent/organizer/teacher
    const { data: adminPods } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .eq('user_id', user.id)
      .in('role', ['admin', 'parent', 'organizer', 'teacher'])
      .eq('membership_status', 'active')

    if (!adminPods || adminPods.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    const podIds = adminPods.map((p: { pod_id: string }) => p.pod_id)

    // Get pending join requests for these pods
    const { data: requests, error } = await supabase
      .from('pod_join_requests')
      .select(`
        id,
        pod_id,
        requester_id,
        message,
        requester_age,
        status,
        created_at,
        expires_at,
        learning_pods!inner(
          pod_name,
          pod_type
        )
      `)
      .in('pod_id', podIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching join requests:', error)
      return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 })
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Error in join requests GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 