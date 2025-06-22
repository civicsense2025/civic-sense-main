import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { arePodsEnabled, isMultiplayerEnabled, areScenariosEnabled } from '@/lib/comprehensive-feature-flags'

interface PodActivity {
  questions_answered: number
  time_spent: number
  accuracy: number
}

interface Pod {
  id: string
  pod_name: string
  pod_type: string
  member_count: number
  active_members: number
  last_activity_at: string | null
  pod_activity?: PodActivity[] | null
}

export async function GET(request: Request) {
  // Feature flag check - disable analytics API when pods are disabled
  if (!arePodsEnabled()) {
    return NextResponse.json({ 
      stats: {
        totalPods: 0,
        activePods: 0,
        totalMembers: 0,
        questionsAnswered: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        recentActivity: 0
      }
    })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const podType = searchParams.get('podType') || 'all'
    const activity = searchParams.get('activity') || 'all'

    // Get user's pods with activity data
    const { data: pods, error: podsError } = await supabase
      .from('learning_pods')
      .select(`
        id,
        pod_name,
        pod_type,
        member_count,
        active_members,
        last_activity_at,
        pod_activity (
          questions_answered,
          time_spent,
          accuracy
        )
      `)
      .eq('is_active', true)

    if (podsError) {
      console.error('Error fetching pods:', podsError)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Filter pods based on type and activity
    const filteredPods = (pods || []).filter(pod => {
      // Type filter
      if (podType !== 'all' && pod.pod_type !== podType) {
        return false
      }

      // Activity filter
      if (activity === 'active') {
        return pod.active_members > 0
      } else if (activity === 'inactive') {
        return pod.active_members === 0
      }

      return true
    }) as Pod[]

    // Calculate aggregate stats
    const stats = {
      totalPods: filteredPods.length,
      activePods: filteredPods.filter(pod => pod.active_members > 0).length,
      totalMembers: filteredPods.reduce((sum, pod) => sum + (pod.member_count || 0), 0),
      questionsAnswered: filteredPods.reduce((sum, pod) => {
        const activity = pod.pod_activity?.[0]
        return sum + (activity?.questions_answered || 0)
      }, 0),
      totalTimeSpent: filteredPods.reduce((sum, pod) => {
        const activity = pod.pod_activity?.[0]
        return sum + (activity?.time_spent || 0)
      }, 0),
      averageAccuracy: filteredPods.reduce((sum, pod) => {
        const activity = pod.pod_activity?.[0]
        return sum + (activity?.accuracy || 0)
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