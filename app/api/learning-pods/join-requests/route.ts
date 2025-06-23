import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/learning-pods/join-requests - Get join requests for user's pods
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pods where user is admin (can manage join requests)
    const { data: adminPods, error: podsError } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .eq('user_id', user.id)
      .in('role', ['admin', 'parent', 'organizer', 'teacher'])
      .eq('membership_status', 'active')

    if (podsError) {
      console.error('Error fetching admin pods:', podsError)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    const podIds = adminPods?.map(p => p.pod_id) || []

    if (podIds.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Get pending join requests for those pods
    const { data: joinRequests, error: requestsError } = await supabase
      .from('pod_join_requests')
      .select(`
        id,
        pod_id,
        user_id,
        user_email,
        message,
        status,
        created_at,
        expires_at,
        requester_age,
        learning_pods!inner (
          pod_name,
          pod_type
        )
      `)
      .in('pod_id', podIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 })
    }

    // Get user profiles for requests that have user_id
    const userIds = joinRequests?.filter(r => r.user_id).map(r => r.user_id) || []
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

    // Format join requests
    const formattedRequests = joinRequests?.map(request => {
      const podData = request.learning_pods as any
      return {
        id: request.id,
        pod_id: request.pod_id,
        pod_name: podData?.pod_name || 'Unknown Pod',
        pod_type: podData?.pod_type || 'unknown',
        user_id: request.user_id,
        user_name: request.user_id 
          ? userMap.get(request.user_id)?.name || 'Unknown User'
          : request.user_email?.split('@')[0] || 'Unknown User',
        user_email: request.user_id 
          ? userMap.get(request.user_id)?.email 
          : request.user_email,
        message: request.message,
        requester_age: request.requester_age,
        requested_at: request.created_at,
        expires_at: request.expires_at,
        status: request.status
      }
    }) || []

    return NextResponse.json({ 
      success: true, 
      requests: formattedRequests 
    })

  } catch (error) {
    console.error('Error in join-requests GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/learning-pods/join-requests - Create a join request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { pod_id, join_code, message, requester_age } = body

    if (!pod_id && !join_code) {
      return NextResponse.json({ error: 'Pod ID or join code is required' }, { status: 400 })
    }

    let podId = pod_id

    // If join code provided, look up the pod
    if (join_code && !pod_id) {
      const { data: pod, error: podError } = await supabase
        .from('learning_pods')
        .select('id')
        .eq('join_code', join_code)
        .single()

      if (podError || !pod) {
        return NextResponse.json({ error: 'Invalid join code' }, { status: 400 })
      }

      podId = pod.id
    }

    // Check if pod exists
    const { data: pod, error: podCheckError } = await supabase
      .from('learning_pods')
      .select('id, pod_name, max_members')
      .eq('id', podId)
      .single()

    if (podCheckError || !pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 })
    }

    // For authenticated users
    if (user) {
      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('pod_memberships')
        .select('id, membership_status')
        .eq('pod_id', podId)
        .eq('user_id', user.id)
        .single()

      if (existingMembership) {
        if (existingMembership.membership_status === 'active') {
          return NextResponse.json({ error: 'You are already a member of this pod' }, { status: 400 })
        } else if (existingMembership.membership_status === 'suspended') {
          return NextResponse.json({ error: 'Your membership is suspended' }, { status: 400 })
        }
      }

      // Check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from('pod_join_requests')
        .select('id, status')
        .eq('pod_id', podId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return NextResponse.json({ error: 'You already have a pending request for this pod' }, { status: 400 })
      }

      // Check pod member limit
      if (pod.max_members) {
        const { data: memberCount } = await supabase
          .from('pod_memberships')
          .select('id', { count: 'exact' })
          .eq('pod_id', podId)
          .eq('membership_status', 'active')

        if ((memberCount?.length || 0) >= pod.max_members) {
          return NextResponse.json({ error: 'Pod is at maximum capacity' }, { status: 400 })
        }
      }

      // Create join request
      const { data: joinRequest, error: requestError } = await supabase
        .from('pod_join_requests')
        .insert({
          pod_id: podId,
          user_id: user.id,
          message: message || null,
          requester_age: requester_age || null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

      if (requestError) {
        console.error('Error creating join request:', requestError)
        return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: {
          request_id: joinRequest.id,
          message: 'Join request submitted successfully'
        }
      })

    } else {
      // For guest users, require email
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email is required for guest requests' }, { status: 400 })
      }

      // Check if there's already a pending request with this email
      const { data: existingRequest } = await supabase
        .from('pod_join_requests')
        .select('id, status')
        .eq('pod_id', podId)
        .eq('user_email', email)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return NextResponse.json({ error: 'There is already a pending request with this email' }, { status: 400 })
      }

      // Create guest join request
      const { data: joinRequest, error: requestError } = await supabase
        .from('pod_join_requests')
        .insert({
          pod_id: podId,
          user_email: email,
          message: message || null,
          requester_age: requester_age || null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

      if (requestError) {
        console.error('Error creating guest join request:', requestError)
        return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: {
          request_id: joinRequest.id,
          message: 'Join request submitted successfully. You will be notified when it is approved.'
        }
      })
    }

  } catch (error) {
    console.error('Error creating join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 