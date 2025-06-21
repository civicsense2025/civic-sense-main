import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'

interface PodActivity {
  questions_answered: number
  time_spent: number
  accuracy: number
}

interface LearningPod {
  id: string
  pod_name: string
  pod_type: string
  member_count: number
  active_members: number
  created_at: string
  last_activity_at: string | null
  pod_activity: PodActivity | null
}

export async function GET(request: Request) {
  try {
    // Get user from session using server-side auth
    const supabaseServer = await createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const podType = url.searchParams.get('podType') || 'all'
    const activity = url.searchParams.get('activity') || 'all'

    // Get user's pods
    const { data: pods, error: podsError } = await supabase
      .from('learning_pods')
      .select(`
        id,
        pod_name,
        pod_type,
        member_count,
        active_members,
        created_at,
        last_activity_at,
        pod_activity (
          questions_answered,
          time_spent,
          accuracy
        )
      `)
      .eq('user_id', user.id)
      .not('archived_at', 'is', null) as { data: LearningPod[] | null, error: any }

    if (podsError) {
      console.error('Error fetching pods:', podsError)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Apply filters
    let filteredPods = pods || []
    
    if (podType !== 'all') {
      filteredPods = filteredPods.filter(pod => pod.pod_type === podType)
    }

    if (activity === 'active') {
      filteredPods = filteredPods.filter(pod => pod.active_members > 0)
    } else if (activity === 'inactive') {
      filteredPods = filteredPods.filter(pod => pod.active_members === 0)
    }

    // Calculate aggregate stats
    const stats = {
      totalPods: filteredPods.length,
      activePods: filteredPods.filter(pod => pod.active_members > 0).length,
      totalMembers: filteredPods.reduce((sum, pod) => sum + (pod.member_count || 0), 0),
      questionsAnswered: filteredPods.reduce((sum, pod) => {
        return sum + (pod.pod_activity?.questions_answered || 0)
      }, 0),
      totalTimeSpent: filteredPods.reduce((sum, pod) => {
        return sum + (pod.pod_activity?.time_spent || 0)
      }, 0),
      averageAccuracy: filteredPods.reduce((sum, pod) => {
        return sum + (pod.pod_activity?.accuracy || 0)
      }, 0) / (filteredPods.length || 1),
      recentActivity: filteredPods.filter(pod => {
        if (!pod.last_activity_at) return false
        const activityDate = new Date(pod.last_activity_at)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        return activityDate >= cutoffDate
      }).length
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in aggregate analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 