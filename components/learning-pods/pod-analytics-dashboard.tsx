// ============================================================================
// POD ANALYTICS DASHBOARD
// ============================================================================

"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, BarChart3, Star, Activity, TrendingUp, TrendingDown, Calendar, Clock, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PodAnalyticsData {
  overview: {
    totalMembers: number
    activeMembers: number
    questionsAnswered: number
    averageAccuracy: number
    totalTimeSpent: number
    averageTimePerMember: number
    engagementScore: number
    dailyActiveUsers: number
  }
  memberPerformance: Array<{
    userId: string
    userName: string
    questionsAnswered: number
    accuracy: number
    timeSpent: number
    lastActive: string
    streak: number
    achievements: number
  }>
  activityTrend: Array<{
    date: string
    questionsAnswered: number
    activeMembers: number
    averageAccuracy: number
  }>
  topicPerformance: Array<{
    topicId: string
    topicName: string
    questionsAnswered: number
    accuracy: number
    memberParticipation: number
  }>
  recentAchievements: Array<{
    userId: string
    userName: string
    achievement: string
    achievedAt: string
  }>
}

interface PodAnalyticsDashboardProps {
  podId: string
  className?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

function formatDateAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

function getEngagementColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-green-600'
  if (accuracy >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PodAnalyticsDashboard({ podId, className }: PodAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PodAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      
      // 1. Get pod member analytics
      const { data: memberAnalytics, error: memberError } = await supabase
        .from('pod_member_analytics')
        .select(`
          user_id,
          accuracy_rate,
          questions_answered,
          quiz_attempts,
          time_spent_minutes,
          current_streak,
          achievements_earned,
          date_recorded
        `)
        .eq('pod_id', podId)
        .gte('date_recorded', getDateRange(timeRange))
        .order('date_recorded', { ascending: false })

      if (memberError) throw memberError

      // Get user profiles separately
      const userIds = [...new Set(memberAnalytics?.map(m => m.user_id) || [])]
      let userProfiles: any[] = []
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
        userProfiles = profilesData || []
      }

      // 2. Get pod overview analytics
      const { data: podOverview, error: overviewError } = await supabase
        .from('pod_analytics')
        .select('*')
        .eq('pod_id', podId)
        .gte('date_recorded', getDateRange(timeRange))
        .order('date_recorded', { ascending: false })

      if (overviewError) throw overviewError

      // 3. Get pod activity log for recent achievements
      const { data: recentActivity, error: activityError } = await supabase
        .from('pod_activities')
        .select(`
          user_id,
          activity_type,
          activity_data,
          created_at
        `)
        .eq('pod_id', podId)
        .in('activity_type', ['quiz_completed', 'achievement_earned'])
        .gte('created_at', getDateRange('7d'))
        .order('created_at', { ascending: false })
        .limit(20)

      if (activityError) throw activityError

      // 4. Process the data into analytics format
      const processedAnalytics = processAnalyticsData(
        memberAnalytics || [],
        userProfiles,
        podOverview || [],
        recentActivity || []
      )

      setAnalytics(processedAnalytics)

    } catch (err) {
      console.error('Error loading pod analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = (range: string): string => {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    return startDate.toISOString().split('T')[0]
  }

  const processAnalyticsData = (
    memberData: any[],
    userProfiles: any[],
    podData: any[],
    activityData: any[]
  ): PodAnalyticsData => {
    // Group member data by user
    const membersByUser = memberData.reduce((acc, member) => {
      const userId = member.user_id
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: userProfiles.find(u => u.id === userId)?.full_name || 'Unknown User',
          questionsAnswered: 0,
          totalAccuracy: 0,
          timeSpent: 0,
          recordCount: 0,
          lastActive: member.date_recorded,
          maxStreak: 0,
          totalAchievements: 0
        }
      }
      
      acc[userId].questionsAnswered += member.questions_answered || 0
      acc[userId].totalAccuracy += member.accuracy_rate || 0
      acc[userId].timeSpent += member.time_spent_minutes || 0
      acc[userId].recordCount++
      acc[userId].maxStreak = Math.max(acc[userId].maxStreak, member.current_streak || 0)
      acc[userId].totalAchievements += member.achievements_earned || 0
      
      if (member.date_recorded > acc[userId].lastActive) {
        acc[userId].lastActive = member.date_recorded
      }
      
      return acc
    }, {} as Record<string, any>)

    // Calculate member performance
    const memberPerformance = Object.values(membersByUser).map((member: any) => ({
      userId: member.userId,
      userName: member.userName,
      questionsAnswered: member.questionsAnswered,
      accuracy: member.recordCount > 0 ? Math.round(member.totalAccuracy / member.recordCount) : 0,
      timeSpent: member.timeSpent,
      lastActive: member.lastActive,
      streak: member.maxStreak,
      achievements: member.totalAchievements
    }))

    // Calculate overview stats
    const totalMembers = Object.keys(membersByUser).length
    const activeMembers = memberPerformance.filter(m => 
      new Date(m.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    const totalQuestions = memberPerformance.reduce((sum, m) => sum + m.questionsAnswered, 0)
    const totalTime = memberPerformance.reduce((sum, m) => sum + m.timeSpent, 0)
    const avgAccuracy = memberPerformance.length > 0 
      ? Math.round(memberPerformance.reduce((sum, m) => sum + m.accuracy, 0) / memberPerformance.length)
      : 0

    // Process recent achievements from activity data
    const recentAchievements = activityData
      .filter(activity => activity.activity_type === 'achievement_earned')
      .map(activity => ({
        userId: activity.user_id,
        userName: userProfiles.find(u => u.id === activity.user_id)?.full_name || 'Unknown User',
        achievement: activity.activity_data?.achievement || 'Unknown Achievement',
        achievedAt: activity.created_at
      }))

    // Create activity trend from pod data
    const activityTrend = podData.map(pod => ({
      date: pod.date_recorded,
      questionsAnswered: pod.total_questions_answered || 0,
      activeMembers: pod.active_members_count || 0,
      averageAccuracy: pod.average_accuracy || 0
    }))

    // Mock topic performance data (would need additional queries for real data)
    const topicPerformance = [
      { topicId: '1', topicName: 'Constitutional Rights', questionsAnswered: 45, accuracy: 78, memberParticipation: 85 },
      { topicId: '2', topicName: 'Voting Systems', questionsAnswered: 32, accuracy: 82, memberParticipation: 70 },
      { topicId: '3', topicName: 'Local Government', questionsAnswered: 28, accuracy: 75, memberParticipation: 60 }
    ]

    const engagementScore = activeMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0

    return {
      overview: {
        totalMembers,
        activeMembers,
        questionsAnswered: totalQuestions,
        averageAccuracy: avgAccuracy,
        totalTimeSpent: totalTime,
        averageTimePerMember: totalMembers > 0 ? Math.round(totalTime / totalMembers) : 0,
        engagementScore,
        dailyActiveUsers: activeMembers
      },
      memberPerformance,
      activityTrend,
      topicPerformance,
      recentAchievements
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [podId, timeRange])

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600 dark:text-red-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Failed to Load Analytics
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <Button onClick={loadAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              No Analytics Data
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Start completing quizzes to see analytics data here.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className={cn("space-y-8", className)}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">Pod Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400">Performance insights and member engagement data</p>
        </div>
        
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</h3>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {analytics.overview.totalMembers}
            </p>
            <p className="text-sm text-green-600">
              {analytics.overview.activeMembers} active ({Math.round((analytics.overview.activeMembers / analytics.overview.totalMembers) * 100)}%)
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Questions Answered</h3>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {analytics.overview.questionsAnswered.toLocaleString()}
            </p>
            <p className={cn("text-sm", getAccuracyColor(analytics.overview.averageAccuracy))}>
              {analytics.overview.averageAccuracy}% accuracy
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Time Spent</h3>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {formatTime(analytics.overview.totalTimeSpent)}
            </p>
            <p className="text-sm text-slate-500">
              {formatTime(analytics.overview.averageTimePerMember)} avg/member
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Engagement Score</h3>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {analytics.overview.engagementScore}%
            </p>
            <p className={cn("text-sm flex items-center gap-1", getEngagementColor(analytics.overview.engagementScore))}>
              {analytics.overview.engagementScore >= 70 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {analytics.overview.dailyActiveUsers} daily active
            </p>
          </div>
        </Card>
      </div>

      {/* Member Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Member Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Member</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Questions</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Accuracy</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Time</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Streak</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {analytics.memberPerformance.map((member) => (
                <tr key={member.userId} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {member.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {member.userName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-900 dark:text-white">
                    {member.questionsAnswered.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <Badge variant={member.accuracy >= 80 ? "default" : member.accuracy >= 60 ? "secondary" : "destructive"}>
                      {member.accuracy}%
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {formatTime(member.timeSpent)}
                  </td>
                  <td className="py-3">
                    {member.streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.streak}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                    {formatDateAgo(member.lastActive)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Achievements */}
      {analytics.recentAchievements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Recent Achievements
          </h3>
          <div className="space-y-3">
            {analytics.recentAchievements.slice(0, 5).map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {achievement.userName} earned "{achievement.achievement}"
                    </p>
                  </div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDateAgo(achievement.achievedAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
} 