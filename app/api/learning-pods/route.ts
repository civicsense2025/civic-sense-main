import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/learning-pods - Get user's learning pods
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pod memberships with pod details
    const { data: pods, error } = await supabase
      .from('pod_memberships')
      .select(`
        pod_id,
        role,
        membership_status,
        joined_at,
        learning_pods!inner(
          id,
          pod_name,
          pod_type,
          family_name,
          join_code,
          content_filter_level,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')

    if (error) {
      console.error('Error fetching user pods:', error)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Get member counts for each pod
    const podIds = pods?.map((p: any) => p.learning_pods.id) || []
    const { data: memberCounts } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .in('pod_id', podIds)
      .eq('membership_status', 'active')

    const memberCountMap = memberCounts?.reduce((acc: Record<string, number>, m: { pod_id: string }) => {
      acc[m.pod_id] = (acc[m.pod_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Format response
    const formattedPods = pods?.map((pod: any) => ({
      id: pod.learning_pods.id,
      pod_name: pod.learning_pods.pod_name,
      pod_type: pod.learning_pods.pod_type,
      family_name: pod.learning_pods.family_name,
      join_code: pod.learning_pods.join_code,
      member_count: memberCountMap[pod.learning_pods.id] || 0,
      user_role: pod.role,
      is_admin: ['admin', 'parent', 'organizer'].includes(pod.role),
      content_filter_level: pod.learning_pods.content_filter_level,
      created_at: pod.learning_pods.created_at
    })) || []

    return NextResponse.json({ pods: formattedPods })
  } catch (error) {
    console.error('Error in learning-pods GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/learning-pods - Create new learning pod
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { podName, podType, familyName, description, contentFilterLevel } = body

    if (!podName?.trim()) {
      return NextResponse.json({ error: 'Pod name is required' }, { status: 400 })
    }

    // Use the database function to create pod
    const { data: result, error } = await supabase
      .rpc('create_learning_pod', {
        p_creator_id: user.id,
        p_pod_name: podName.trim(),
        p_pod_type: podType || 'family',
        p_family_name: familyName?.trim() || null,
        p_content_filter_level: contentFilterLevel || 'moderate'
      })

    if (error) {
      console.error('Error creating pod:', error)
      return NextResponse.json({ error: 'Failed to create pod' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      podId: result,
      message: 'Learning pod created successfully!'
    })
  } catch (error) {
    console.error('Error in learning-pods POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 