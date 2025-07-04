"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Users, 
  Crown, 
  TrendingUp, 
  Clock, 
  Award, 
  BarChart3,
  Plus,
  Settings,
  Share2,
  Star,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from "../../components/ui"
import { useToast } from "../../components/ui"
import Link from 'next/link'

interface LearningPod {
  id: string
  pod_name: string
  pod_type: string
  family_name?: string
  member_count: number
  user_role: string
  is_admin: boolean
  content_filter_level: string
  recent_activity_count: number
  last_activity_date: string
}

interface PodStats {
  totalPods: number
  totalMembers: number
  adminPods: number
  recentActivity: number
  topPerformingPod?: {
    name: string
    activityScore: number
  }
}

export function LearningPodsDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [pods, setPods] = useState<LearningPod[]>([])
  const [stats, setStats] = useState<PodStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/learning-pods', {
      credentials: 'include' // Include authentication cookies
    })
      
      if (!response.ok) {
        // Show mock data if API fails
        setPods(getMockPods())
        setStats(getMockStats())
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      const userPods = data.pods || []
      
      setPods(userPods)
      
      // Calculate stats
      const calculatedStats: PodStats = {
        totalPods: userPods.length,
        totalMembers: userPods.reduce((sum: number, pod: LearningPod) => sum + pod.member_count, 0),
        adminPods: userPods.filter((pod: LearningPod) => pod.is_admin).length,
        recentActivity: userPods.reduce((sum: number, pod: LearningPod) => sum + pod.recent_activity_count, 0),
        topPerformingPod: userPods.length > 0 ? {
          name: userPods[0].pod_name,
          activityScore: userPods[0].recent_activity_count
        } : undefined
      }
      
      setStats(calculatedStats)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Show mock data on error
      setPods(getMockPods())
      setStats(getMockStats())
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data for demo purposes
  const getMockPods = (): LearningPod[] => [
    {
      id: 'demo-pod-1',
      pod_name: 'Smith Family Learning Pod',
      pod_type: 'family',
      family_name: 'The Smith Family',
      member_count: 4,
      user_role: 'admin',
      is_admin: true,
      content_filter_level: 'moderate',
      recent_activity_count: 23,
      last_activity_date: '2024-06-15T10:30:00Z'
    },
    {
      id: 'demo-pod-2',
      pod_name: 'Democracy Study Group',
      pod_type: 'study_group',
      member_count: 8,
      user_role: 'member',
      is_admin: false,
      content_filter_level: 'light',
      recent_activity_count: 15,
      last_activity_date: '2024-06-14T16:45:00Z'
    }
  ]

  const getMockStats = (): PodStats => ({
    totalPods: 2,
    totalMembers: 12,
    adminPods: 1,
    recentActivity: 38,
    topPerformingPod: {
      name: 'Smith Family Learning Pod',
      activityScore: 23
    }
  })

  useEffect(() => {
    loadDashboard()
  }, [user])

  const getPodTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'family': '👨‍👩‍👧‍👦',
      'friends': '👥',
      'classroom': '🏫',
      'study_group': '📚',
      'campaign': '🗳️',
      'organization': '🏢',
      'book_club': '📖',
      'debate_team': '⚖️'
    }
    return typeMap[type] || '👥'
  }

  const getFilterLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      case 'light': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'moderate': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'strict': return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  if (!user) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-6">
            Learning pods are available to authenticated users
          </p>
          <Button asChild className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white">
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading your learning pods...</p>
        </CardContent>
      </Card>
    )
  }

  if (pods.length === 0) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">No learning pods yet</h3>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-6">
            Create or join a learning pod to start collaborative learning
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white">
              <Link href="/learning-pods">
                <Plus className="h-4 w-4 mr-2" />
                Create Pod
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/learning-pods">
                Discover Pods
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Your Pods</p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">{stats.totalPods}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              {stats.adminPods > 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="text-slate-500 dark:text-slate-400">{stats.adminPods} admin</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Total Members</p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Recent Activity</p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">{stats.recentActivity}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Top Pod</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {stats.topPerformingPod?.name || 'None'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              {stats.topPerformingPod && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {stats.topPerformingPod.activityScore} activities
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Your Pods */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-light text-slate-900 dark:text-white">Your Learning Pods</h3>
          <Button asChild variant="outline" size="sm">
            <Link href="/learning-pods">
              <Settings className="h-4 w-4 mr-2" />
              Manage All
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pods.slice(0, 4).map((pod) => (
            <Card key={pod.id} className="border-0 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPodTypeIcon(pod.pod_type)}</span>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {pod.pod_name}
                        </h4>
                        {pod.family_name && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            {pod.family_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {pod.is_admin && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 dark:text-slate-400 font-light">
                        {pod.member_count} member{pod.member_count !== 1 ? 's' : ''}
                      </span>
                      <Badge className={cn(getFilterLevelColor(pod.content_filter_level), "border-0 text-xs")}>
                        {pod.content_filter_level}
                      </Badge>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-light">
                      {pod.user_role}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-light">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTimeAgo(pod.last_activity_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      {pod.recent_activity_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {pod.recent_activity_count} activities
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href="/learning-pods">
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pods.length > 4 && (
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/learning-pods">
                View All {pods.length} Pods
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
                Expand Your Learning Network
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
                Create new pods, discover public learning groups, or invite friends and family to join your existing pods.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white">
                <Link href="/learning-pods">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Pod
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/learning-pods">
                  <Share2 className="h-4 w-4 mr-2" />
                  Discover Pods
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/learning-pods">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 