"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BarChart3,
  Activity,
  Zap,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Star,
  Calendar,
  Sparkles,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'
import Link from 'next/link'

interface PodSummary {
  id: string
  name: string
  type: string
  memberCount: number
  accuracy: number
  timeSpent: number
  questionsAnswered: number
  isActive: boolean
  userRole: string
}

interface AggregateAnalytics {
  totalPods: number
  totalMembers: number
  activePods: number
  totalQuestionsAnswered: number
  averageAccuracy: number
  totalTimeSpent: number
  totalAchievements: number
  topPerformingPod: PodSummary
  mostActivePod: PodSummary
  recentActivity: Array<{
    podId: string
    podName: string
    activity: string
    timestamp: string
  }>
  podPerformance: PodSummary[]
  trends: {
    memberGrowth: number
    accuracyTrend: number
    activityTrend: number
  }
}

export function AggregatePodAnalytics() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [analytics, setAnalytics] = useState<AggregateAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [podTypeFilter, setPodTypeFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')

  const loadAggregateAnalytics = async () => {
    if (!user) {
      setAnalytics(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/learning-pods/aggregate-analytics?days=${timeRange}&podType=${podTypeFilter}&activity=${activityFilter}`)
      
      if (!response.ok) {
        setAnalytics(null)
        setIsLoading(false)
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view aggregate pod analytics.",
            variant: "destructive"
          })
        }
        return
      }
      
      const data = await response.json()
      
      // Only set analytics if there's actual data
      if (data.analytics && data.analytics.totalPods > 0) {
        setAnalytics(data.analytics)
      } else {
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error loading aggregate analytics:', error)
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAggregateAnalytics()
  }, [timeRange, podTypeFilter, activityFilter])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-slate-600" />
  }

  const getPodTypeIcon = (type: string) => {
    switch (type) {
      case 'family': return '👨‍👩‍👧‍👦'
      case 'friends': return '👥'
      case 'classroom': return '🏫'
      case 'study_group': return '📚'
      case 'campaign': return '🗳️'
      case 'organization': return '🏢'
      case 'book_club': return '📖'
      case 'debate_team': return '⚖️'
      default: return '👥'
    }
  }

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'parent': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'organizer': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      'teacher': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      'member': 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
    return colorMap[role] || 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light">Please sign in to view your pod analytics.</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-light text-slate-900 dark:text-white">
            Your Learning Pods Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Aggregate insights across all your learning pods and communities
          </p>
        </div>

        {/* Empty State with Zero Values */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">0</div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Total Pods</p>
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-slate-500">0 active</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">0</div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Total Members</p>
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-slate-500">0% growth</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">0</div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Questions Answered</p>
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-slate-500">0% avg accuracy</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">0m</div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Total Time</p>
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="text-slate-500">0% activity</span>
            </div>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No pods yet</h3>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-6">
            Create your first learning pod to start seeing analytics and insights.
          </p>
          <Button 
            onClick={() => {
              // Trigger create pod form
              const createEvent = new CustomEvent('triggerCreatePod')
              window.dispatchEvent(createEvent)
            }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-8 py-3 h-12 font-light"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Pod
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          Your Learning Pods Overview
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Aggregate insights across all your learning pods and communities
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-0 bg-slate-100 dark:bg-slate-800 h-10">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={podTypeFilter} onValueChange={setPodTypeFilter}>
            <SelectTrigger className="w-40 border-0 bg-slate-100 dark:bg-slate-800 h-10">
              <SelectValue placeholder="Pod type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="family">Family Pods</SelectItem>
              <SelectItem value="friends">Friend Groups</SelectItem>
              <SelectItem value="classroom">Classrooms</SelectItem>
              <SelectItem value="study_group">Study Groups</SelectItem>
              <SelectItem value="campaign">Campaign Groups</SelectItem>
              <SelectItem value="organization">Organizations</SelectItem>
              <SelectItem value="book_club">Book Clubs</SelectItem>
              <SelectItem value="debate_team">Debate Teams</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40 border-0 bg-slate-100 dark:bg-slate-800 h-10">
              <SelectValue placeholder="Activity status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pods</SelectItem>
              <SelectItem value="active">Active Pods</SelectItem>
              <SelectItem value="inactive">Inactive Pods</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics - Apple style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.totalPods}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Total Pods</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-green-600">{analytics.activePods} active</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.totalMembers}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Total Members</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            {getTrendIcon(analytics.trends.memberGrowth)}
            <span className="text-slate-500">{analytics.trends.memberGrowth.toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.totalQuestionsAnswered.toLocaleString()}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Questions Answered</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-green-600">{analytics.averageAccuracy.toFixed(1)}%</span>
            <span className="text-slate-500">avg accuracy</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {formatTime(analytics.totalTimeSpent)}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Total Time</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            {getTrendIcon(analytics.trends.activityTrend)}
            <span className="text-slate-500">{analytics.trends.activityTrend.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Pod Performance Comparison */}
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-xl font-light text-slate-900 dark:text-white">
            Pod Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.podPerformance.map((pod, index) => (
              <div key={pod.id} className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getPodTypeIcon(pod.type)}</span>
                    {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {pod.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(getRoleColor(pod.userRole), "border-0 text-xs")}>
                        {pod.userRole}
                      </Badge>
                      {pod.isActive && (
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-0 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-lg font-light text-slate-900 dark:text-white">
                      {pod.memberCount}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">members</p>
                  </div>
                  <div>
                    <div className="text-lg font-light text-slate-900 dark:text-white">
                      {pod.accuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">accuracy</p>
                  </div>
                  <div>
                    <div className="text-lg font-light text-slate-900 dark:text-white">
                      {pod.questionsAnswered}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">questions</p>
                  </div>
                  <div>
                    <div className="text-lg font-light text-slate-900 dark:text-white">
                      {formatTime(pod.timeSpent)}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">time spent</p>
                  </div>
                </div>
                
                <Button asChild variant="outline" size="sm">
                  <Link href={`/pods/${pod.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-lg font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performing Pod
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getPodTypeIcon(analytics.topPerformingPod.type)}</span>
              <h3 className="text-xl font-light text-slate-900 dark:text-white">
                {analytics.topPerformingPod.name}
              </h3>
            </div>
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {analytics.topPerformingPod.accuracy.toFixed(1)}%
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              average accuracy with {analytics.topPerformingPod.memberCount} members
            </p>
            <Button asChild size="sm">
              <Link href={`/pods/${analytics.topPerformingPod.id}`}>
                View Pod Details
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-lg font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Most Active Pod
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getPodTypeIcon(analytics.mostActivePod.type)}</span>
              <h3 className="text-xl font-light text-slate-900 dark:text-white">
                {analytics.mostActivePod.name}
              </h3>
            </div>
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {analytics.mostActivePod.questionsAnswered}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              questions answered • {formatTime(analytics.mostActivePod.timeSpent)} total time
            </p>
            <Button asChild size="sm">
              <Link href={`/pods/${analytics.mostActivePod.id}`}>
                View Pod Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recent Activity Across All Pods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900 dark:text-white">
                    {activity.activity}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{activity.podName}</span>
                    <span>•</span>
                    <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/pods/${activity.podId}`}>
                    <span className="sr-only">View pod</span>
                    →
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 