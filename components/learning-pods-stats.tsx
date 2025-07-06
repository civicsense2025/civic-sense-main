"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, Crown, TrendingUp, Trophy, Star, Target, Activity, BarChart3, Shield, Plus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { envFeatureFlags } from '@/lib/env-feature-flags'

interface LearningPodsStatsProps {
  className?: string
  compact?: boolean
}

interface PodStatsData {
  totalPods: number
  activePods: number
  memberRole: 'admin' | 'parent' | 'member' | null
  totalMembers: number
  podRanking: number
  contributions: number
  recentActivity: Array<{
    podName: string
    activity: string
    date: string
  }>
}

export function LearningPodsStats({ className, compact = false }: LearningPodsStatsProps) {
  // Check feature flag first
  if (!envFeatureFlags.getFlag('learningPods')) {
    return null
  }

  const { user } = useAuth()
  const [podStats, setPodStats] = useState<PodStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPodStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
        // Load user's pods
        const response = await fetch('/api/learning-pods', {
      credentials: 'include' // Include authentication cookies
    })
        
        if (response.ok) {
          const data = await response.json()
          const pods = data.pods || []
          
          // Calculate stats
          const totalPods = pods.length
          const activePods = pods.filter((pod: any) => pod.member_count > 1).length
          const totalMembers = pods.reduce((sum: number, pod: any) => sum + pod.member_count, 0)
          const adminPods = pods.filter((pod: any) => pod.is_admin).length
          const memberRole = adminPods > 0 ? 'admin' : (pods.length > 0 ? 'member' : null)
          
          // Mock some additional stats for demo
          const podRanking = Math.max(1, Math.floor(Math.random() * 10) + 1)
          const contributions = Math.floor(Math.random() * 50) + 10
          
          const recentActivity = pods.slice(0, 3).map((pod: any) => ({
            podName: pod.pod_name,
            activity: 'Completed quiz',
            date: new Date().toISOString()
          }))
          
          setPodStats({
            totalPods,
            activePods,
            memberRole,
            totalMembers,
            podRanking,
            contributions,
            recentActivity
          })
        } else {
          // No pods or error - set empty state
          setPodStats({
            totalPods: 0,
            activePods: 0,
            memberRole: null,
            totalMembers: 0,
            podRanking: 0,
            contributions: 0,
            recentActivity: []
          })
        }
      } catch (error) {
        console.error('Error loading pod stats:', error)
        setPodStats({
          totalPods: 0,
          activePods: 0,
          memberRole: null,
          totalMembers: 0,
          podRanking: 0,
          contributions: 0,
          recentActivity: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPodStats()
  }, [user])

  if (!user || isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!podStats || podStats.totalPods === 0) {
    return (
      <Card className={cn("shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20", className)}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
            <Users className="h-5 w-5" />
            Learning Pods
          </CardTitle>
          <CardDescription>
            Join or create learning pods for collaborative civic education
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            You're not part of any learning pods yet
          </p>
          <Link href="/learning-pods-demo">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Explore Learning Pods
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getRoleIcon = () => {
    switch (podStats.memberRole) {
      case 'admin':
        return <Crown className="h-5 w-5 text-yellow-600" />
      case 'parent':
        return <Shield className="h-5 w-5 text-blue-600" />
      default:
        return <Users className="h-5 w-5 text-green-600" />
    }
  }

  const getRoleColor = () => {
    switch (podStats.memberRole) {
      case 'admin':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case 'parent':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
    }
  }

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
        {/* Total Pods */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {podStats.totalPods}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200">My Pods</p>
          </CardContent>
        </Card>

        {/* Role */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            {getRoleIcon()}
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              {podStats.memberRole ? podStats.memberRole.charAt(0).toUpperCase() + podStats.memberRole.slice(1) : 'Member'}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200">Role</p>
          </CardContent>
        </Card>

        {/* Ranking */}
        {podStats.podRanking > 0 && (
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                #{podStats.podRanking}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200">Ranking</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("shadow-2xl border-0 bg-gradient-to-br from-white/90 to-indigo-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-indigo-600" />
            <span className="text-xl">Learning Pods</span>
          </div>
          <Badge className={cn("px-3 py-1", getRoleColor())}>
            {podStats.memberRole ? podStats.memberRole.charAt(0).toUpperCase() + podStats.memberRole.slice(1) : 'Member'}
          </Badge>
        </CardTitle>
        <CardDescription className="text-base">
          Your collaborative learning community stats
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Pods */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {podStats.totalPods}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">My Pods</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {podStats.activePods} active
            </p>
          </div>

          {/* Total Members */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {podStats.totalMembers}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Members</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Across all pods
            </p>
          </div>

          {/* Ranking */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              #{podStats.podRanking}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Ranking</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              In your pods
            </p>
          </div>

          {/* Contributions */}
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
            <Star className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {podStats.contributions}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Contributions</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              This month
            </p>
          </div>
        </div>

        {/* Recent Pod Activity */}
        {podStats.recentActivity.length > 0 && (
          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Recent Pod Activity</h3>
            <div className="space-y-2">
              {podStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {activity.podName}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {activity.activity}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(activity.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/learning-pods-demo" className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/learning-pods-demo" className="flex-1">
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Manage Pods
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 