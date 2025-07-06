// ============================================================================
// POD ACTIVITY FEED
// ============================================================================

"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  User, 
  UserPlus, 
  TrendingUp, 
  Crown, 
  Settings, 
  Activity, 
  BookOpen, 
  Star,
  MessageCircle,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PodActivity {
  id: string
  pod_id: string
  pod_name: string
  activity_type: 'joined' | 'left' | 'quiz_completed' | 'achievement_earned' | 'settings_updated' | 'content_flagged' | 'milestone_reached'
  user_name: string
  user_id: string
  activity_data: any
  created_at: string
}

interface PodActivityFeedProps {
  podId?: string // If provided, show activities for specific pod
  className?: string
  limit?: number
  showPodName?: boolean
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

function getActivityIcon(activityType: string) {
  const iconMap = {
    'joined': <UserPlus className="h-4 w-4 text-green-600" />,
    'left': <User className="h-4 w-4 text-red-600" />,
    'quiz_completed': <TrendingUp className="h-4 w-4 text-blue-600" />,
    'achievement_earned': <Crown className="h-4 w-4 text-yellow-600" />,
    'settings_updated': <Settings className="h-4 w-4 text-slate-600" />,
    'content_flagged': <MessageCircle className="h-4 w-4 text-orange-600" />,
    'milestone_reached': <Star className="h-4 w-4 text-purple-600" />
  }
  
  return iconMap[activityType as keyof typeof iconMap] || <Activity className="h-4 w-4 text-slate-600" />
}

function getActivityColor(activityType: string): string {
  const colorMap = {
    'joined': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    'left': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    'quiz_completed': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    'achievement_earned': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    'settings_updated': 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700',
    'content_flagged': 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    'milestone_reached': 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  }
  
  return colorMap[activityType as keyof typeof colorMap] || 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700'
}

function getActivityMessage(activity: PodActivity, showPodName: boolean): string {
  const data = activity.activity_data || {}
  
  switch (activity.activity_type) {
    case 'joined':
      return `${activity.user_name} joined ${showPodName ? activity.pod_name : 'the pod'}`
    
    case 'left':
      return `${activity.user_name} left ${showPodName ? activity.pod_name : 'the pod'}`
    
    case 'quiz_completed':
      const quizName = data.quiz_topic || data.quiz_name || 'a quiz'
      const score = data.score || data.accuracy_percentage || 0
      return `${activity.user_name} completed ${quizName} with ${score}% score`
    
    case 'achievement_earned':
      const achievement = data.achievement || data.achievement_name || 'an achievement'
      return `${activity.user_name} earned the "${achievement}" achievement`
    
    case 'milestone_reached':
      const milestone = data.milestone_name || data.milestone || 'a milestone'
      return `${activity.user_name} reached the "${milestone}" milestone`
    
    case 'settings_updated':
      return `Pod settings were updated by ${activity.user_name}`
    
    case 'content_flagged':
      return `${activity.user_name} flagged content for review`
    
    default:
      return `${activity.user_name} performed an activity in ${showPodName ? activity.pod_name : 'the pod'}`
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PodActivityFeed({ 
  podId, 
  className, 
  limit = 20,
  showPodName = false 
}: PodActivityFeedProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<PodActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadActivities = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/learning-pods/activities?${new URLSearchParams({
        limit: limit.toString(),
        ...(podId && { podId }),
      })}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`)
      }

      const data = await response.json()
      
      // Set the activities directly without adding flags
      setActivities(data.activities || [])

    } catch (err) {
      console.error('Error loading pod activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadActivities(true)
  }

  useEffect(() => {
    loadActivities()
  }, [podId, limit])

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            <Activity className="h-12 w-12 mx-auto text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Failed to Load Activities
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {error}
              </p>
            </div>
            <Button onClick={() => loadActivities()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            <Activity className="h-12 w-12 mx-auto text-slate-400" />
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No Activities Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {podId 
                  ? "This pod hasn't had any recent activity. Start completing quizzes to see updates here!"
                  : "Join a pod and start completing quizzes to see activity updates here!"
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {podId ? 'Latest updates from this pod' : 'Latest updates from your pods'}
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          variant="ghost" 
          size="sm"
          disabled={isRefreshing}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            className={cn(
              "p-4 border transition-all duration-200 hover:shadow-sm",
              getActivityColor(activity.activity_type)
            )}
          >
            <div className="flex items-start gap-3">
              {/* Activity Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                {getActivityIcon(activity.activity_type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white font-medium leading-tight">
                  {getActivityMessage(activity, showPodName)}
                </p>
                
                {/* Additional Activity Details */}
                {activity.activity_data && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activity.activity_type === 'quiz_completed' && (
                      <>
                        {activity.activity_data.total_questions && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.activity_data.total_questions} questions
                          </Badge>
                        )}
                        {activity.activity_data.time_spent_seconds && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(activity.activity_data.time_spent_seconds / 60)}m
                          </Badge>
                        )}
                      </>
                    )}
                    
                    {activity.activity_type === 'achievement_earned' && activity.activity_data.achievement && (
                      <Badge variant="default" className="text-xs">
                        🏆 {activity.activity_data.achievement}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Pod Name (if showing activities from multiple pods) */}
                {showPodName && activity.pod_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    in {activity.pod_name}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {formatTimeAgo(activity.created_at)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More Button (if there are many activities) */}
      {activities.length >= limit && (
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Could implement pagination here
              console.log('Load more activities')
            }}
          >
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  )
} 