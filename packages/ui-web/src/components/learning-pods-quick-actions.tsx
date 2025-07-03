"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Users, 
  Plus, 
  Bell,
  Search,
  Crown,
  Activity
} from 'lucide-react'
import { cn } from '../../utils'
import { useAuth } from '@/components/auth/auth-provider'
import Link from 'next/link'
import { envFeatureFlags } from '@civicsense/shared/env-feature-flags'

interface QuickActionsProps {
  className?: string
  variant?: 'header' | 'sidebar'
}

interface QuickStats {
  totalPods: number
  pendingInvites: number
  recentActivity: number
  userRole: 'admin' | 'parent' | 'member' | null
}

export function LearningPodsQuickActions({ className, variant = 'header' }: QuickActionsProps) {
  // Check feature flag first
  if (!envFeatureFlags.getFlag('learningPods')) {
    return null
  }

  const { user } = useAuth()
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadQuickStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Load basic pod stats
        const response = await fetch('/api/learning-pods', {
      credentials: 'include' // Include authentication cookies
    })
        
        if (response.ok) {
          const data = await response.json()
          const pods = data.pods || []
          
          // Mock some quick stats for demo
          const quickStats: QuickStats = {
            totalPods: pods.length,
            pendingInvites: Math.floor(Math.random() * 3), // Mock pending invites
            recentActivity: Math.floor(Math.random() * 10) + 1, // Mock recent activity
            userRole: pods.length > 0 ? (pods.some((pod: any) => pod.is_admin) ? 'admin' : 'member') : null
          }
          
          setStats(quickStats)
        } else {
          // No pods yet
          setStats({
            totalPods: 0,
            pendingInvites: 0,
            recentActivity: 0,
            userRole: null
          })
        }
      } catch (error) {
        console.error('Error loading quick stats:', error)
        setStats({
          totalPods: 0,
          pendingInvites: 0,
          recentActivity: 0,
          userRole: null
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadQuickStats()
  }, [user])

  if (!user || isLoading) {
    return null
  }

  // Don't show if no pods and not admin
  if (!stats || (stats.totalPods === 0 && stats.userRole !== 'admin')) {
    return (
      <div className={cn("flex items-center", className)}>
        <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <Link href="/pods">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Pods</span>
          </Link>
        </Button>
      </div>
    )
  }

  if (variant === 'header') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {/* Pods Button with Count */}
        <Button asChild variant="ghost" size="sm" className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <Link href="/pods">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Pods</span>
            {stats.totalPods > 0 && (
              <Badge className="notification-badge absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 hover:bg-blue-500 text-white border-0">
                {stats.totalPods}
              </Badge>
            )}
          </Link>
        </Button>



        {/* Quick Create (Admin Only) */}
        {stats.userRole === 'admin' && (
          <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Link href="/pods">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create Pod</span>
            </Link>
          </Button>
        )}
      </div>
    )
  }

  // Sidebar variant
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-white">Learning Pods</span>
        </div>
        {stats.userRole === 'admin' && (
          <Crown className="h-4 w-4 text-yellow-600" />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* My Pods */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Users className="h-5 w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
          <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
            {stats.totalPods}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-200">My Pods</p>
        </div>

        {/* Activity */}
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <Activity className="h-5 w-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
          <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
            {stats.recentActivity}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-200">Recent</p>
        </div>
      </div>

      {/* Pending Invites Alert */}
      {stats.pendingInvites > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {stats.pendingInvites} pending invite{stats.pendingInvites > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button asChild size="sm" className="flex-1">
          <Link href="/pods">
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Link>
        </Button>
        
        {stats.userRole === 'admin' && (
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/pods">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
} 