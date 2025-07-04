import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isLearningPodsEnabled } from '@civicsense/business-logic'

interface PodMembership {
  pod_id: string;
  role: string;
  learning_pods: {
    id: string;
    pod_name: string;
    pod_type: string;
    created_at: string;
  };
}

interface PodMemberCount {
  pod_id: string;
}

// GET /api/learning-pods/aggregate-analytics - Get aggregate analytics for user's pods
export async function GET(request: NextRequest) {
  // Feature flag check
  if (!isLearningPodsEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const days = url.searchParams.get('days') || '30'
    const podType = url.searchParams.get('podType') || 'all'
    const activity = url.searchParams.get('activity') || 'all'

    // Get user's pods
    const { data: userPods, error: podsError } = await supabase
      .from('pod_memberships')
      .select(`
        pod_id,
        role,
        learning_pods!inner(
          id,
          pod_name,
          pod_type,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')

    if (podsError) {
      console.error('Error fetching user pods:', podsError)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    const podIds = (userPods as PodMembership[] | null)?.map(p => p.learning_pods.id) || []
    
    if (podIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalPods: 0,
          activePods: 0,
          totalMembers: 0,
          adminPods: 0,
          recentActivity: 0
        }
      })
    }

    // Calculate member counts
    const { data: memberCounts } = await supabase
      .from('pod_memberships')
      .select('pod_id')
      .in('pod_id', podIds)
      .eq('membership_status', 'active')

    const memberCountMap = (memberCounts as PodMemberCount[] | null)?.reduce((acc: Record<string, number>, m) => {
      acc[m.pod_id] = (acc[m.pod_id] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate basic stats
    const totalMembers = Object.values(memberCountMap).reduce((sum, count) => sum + count, 0)
    const adminPods = (userPods as PodMembership[] | null)?.filter(p => 
      ['admin', 'parent', 'organizer', 'teacher'].includes(p.role)
    ).length || 0
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentActivity } = await supabase
      .from('pod_activities')
      .select('id')
      .in('pod_id', podIds)
      .gte('created_at', sevenDaysAgo.toISOString())

    const stats = {
      totalPods: podIds.length,
      activePods: podIds.length, // For now, assume all pods are active
      totalMembers,
      adminPods,
      recentActivity: recentActivity?.length || 0,
      topPerformingPod: userPods && userPods.length > 0 ? {
        name: (userPods[0] as PodMembership).learning_pods.pod_name,
        activityScore: 85 // Mock score for now
      } : undefined
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in aggregate analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 