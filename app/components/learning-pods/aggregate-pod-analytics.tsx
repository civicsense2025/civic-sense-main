import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, BarChart3, Clock, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { type Json } from '@/lib/database.types'

interface PodStats {
  totalPods: number
  totalMembers: number
  questionsAnswered: number
  totalTime: string
  activeMembers: number
  avgAccuracy: number
  activityRate: number
}

interface PodMembership {
  pod_id: string
  membership_status: string
}

interface PodActivityLog {
  pod_id: string
  activity_data: Json
}

function hasValidActivityData(data: Json): boolean {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.questions_answered === 'number' &&
    typeof d.time_spent === 'number' &&
    typeof d.accuracy === 'number'
  )
}

export function AggregatePodAnalytics() {
  const [stats, setStats] = useState<PodStats>({
    totalPods: 0,
    totalMembers: 0,
    questionsAnswered: 0,
    totalTime: '0m',
    activeMembers: 0,
    avgAccuracy: 0,
    activityRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPodStats() {
      try {
        const supabase = createClient()
        
        // Get user's pods and memberships
        const { data: memberships, error: membershipsError } = await supabase
          .from('pod_memberships')
          .select('pod_id, membership_status')
          .eq('membership_status', 'active')

        if (membershipsError) throw membershipsError

        // Get pod activity logs
        const { data: activityLogs, error: activityError } = await supabase
          .from('pod_activity_log')
          .select('pod_id, activity_data')
          .in('pod_id', memberships?.map(m => m.pod_id) || [])

        if (activityError) throw activityError

        // Calculate stats
        const uniquePods = new Set(memberships?.map(m => m.pod_id) || [])
        const totalPods = uniquePods.size
        const totalMembers = memberships?.length || 0
        
        const activityStats = activityLogs?.reduce((acc, log) => {
          if (hasValidActivityData(log.activity_data)) {
            const data = log.activity_data as Record<string, number>
            acc.questions += data.questions_answered
            acc.time += data.time_spent
            acc.accuracy += data.accuracy
          }
          return acc
        }, { questions: 0, time: 0, accuracy: 0 })

        const activeMembers = memberships?.filter(m => m.membership_status === 'active').length || 0

        setStats({
          totalPods,
          totalMembers,
          questionsAnswered: activityStats?.questions || 0,
          totalTime: `${activityStats?.time || 0}m`,
          activeMembers,
          avgAccuracy: activityStats ? (activityStats.accuracy / (activityLogs?.length || 1)) : 0,
          activityRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
        })
      } catch (error) {
        console.error('Failed to load pod stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPodStats()
  }, [])

  if (isLoading) {
    return <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  }

  return (
    <div className="space-y-8">
      <p className="text-slate-500 dark:text-slate-400">
        Aggregate insights across all your learning pods and communities
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pods</h3>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalPods}</p>
            <p className="text-sm text-green-600">{stats.activeMembers} active</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Questions</h3>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.questionsAnswered}</p>
            <p className="text-sm text-green-600">{stats.avgAccuracy.toFixed(1)}% accuracy</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Time Spent</h3>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalTime}</p>
            <p className="text-sm text-green-600">{stats.activityRate.toFixed(1)}% active</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Members</h3>
              <Target className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalMembers}</p>
            <p className="text-sm text-green-600">{stats.activeMembers} active</p>
          </div>
        </Card>
      </div>

      {/* Activity Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-light text-slate-900 dark:text-white mb-2">Daily Activity</h2>
          <p className="text-slate-500 dark:text-slate-400">Track member engagement and participation over time</p>
        </div>
        
        <Card className="p-6">
          <div className="space-y-6">
            {/* Activity Chart Component */}
            <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              Activity chart will be rendered here
            </div>
          </div>
        </Card>
      </section>

      {/* Members Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-light text-slate-900 dark:text-white mb-2">Member Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400">Detailed member performance and engagement metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Role Distribution</h3>
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              Role distribution chart will be rendered here
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Activity Heatmap</h3>
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              Activity heatmap will be rendered here
            </div>
          </Card>
        </div>
      </section>

      {/* Performance Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-light text-slate-900 dark:text-white mb-2">Performance Metrics</h2>
          <p className="text-slate-500 dark:text-slate-400">Track learning progress and achievement metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Topic Performance</h3>
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              Topic performance chart will be rendered here
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Difficulty Distribution</h3>
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
              Difficulty distribution chart will be rendered here
            </div>
          </Card>
        </div>
      </section>

      {/* Insights Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-light text-slate-900 dark:text-white mb-2">Key Insights</h2>
          <p className="text-slate-500 dark:text-slate-400">AI-powered insights and recommendations</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Engagement Patterns</h3>
              <p className="text-slate-600 dark:text-slate-300">
                No significant patterns detected yet. Continue using the platform to generate insights.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Learning Recommendations</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Start by completing some activities to receive personalized recommendations.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
} 