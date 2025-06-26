"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Star,
  MessageSquare,
  Brain,
  Globe,
  Zap,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Shield,
  Database,
  Award,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// If the layout fix doesn't work, uncomment this as an alternative approach:
// const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard'), {
//   ssr: false,
//   loading: () => (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50">
//       <div className="text-center space-y-4">
//         <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
//         <p className="text-slate-600">Loading admin dashboard...</p>
//       </div>
//     </div>
//   )
// })

interface DashboardStats {
  users: {
    total: number
    active_last_30_days: number
    new_this_week: number
    verified_count: number
    admin_count: number
  }
  content: {
    total_topics: number
    total_questions: number
    pending_events: number
    ai_generated_today: number
    surveys_active: number
    scenarios_available: number
  }
  engagement: {
    quiz_attempts_today: number
    quiz_attempts_week: number
    survey_responses_today: number
    avg_completion_rate: number
    multiplayer_sessions_active: number
  }
  system: {
    pending_feedback: number
    system_alerts: number
    last_backup: string
    storage_usage: number
    api_calls_today: number
  }
  analytics: {
    civic_engagement_score: number
    knowledge_improvement_rate: number
    content_quality_score: number
    user_satisfaction_rate: number
  }
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'content_created' | 'quiz_completed' | 'event_submitted' | 'feedback_received' | 'survey_completed' | 'multiplayer_session'
  description: string
  timestamp: string
  user_email?: string
  metadata?: Record<string, any>
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: any
  variant: 'primary' | 'secondary' | 'urgent'
  count?: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/dashboard?timeRange=7d&includeDetails=true`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data.stats)
        setRecentActivity(data.data.recentActivity)
        setSystemAlerts(data.data.systemAlerts)
      } else {
        console.error('Failed to load dashboard data:', data.error)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      title: 'Review Events',
      description: 'Approve pending submissions',
      href: '/admin/events',
      icon: Calendar,
      variant: 'urgent',
      count: stats?.content.pending_events || 0
    },
    {
      title: 'Weekly Recaps',
      description: 'Auto-generated collections',
      href: '/admin/weekly-recap',
      icon: Clock,
      variant: 'primary'
    },
    {
      title: 'Generate Content',
      description: 'Create with AI',
      href: '/admin/ai-content',
      icon: Brain,
      variant: 'secondary'
    },
    {
      title: 'User Feedback',
      description: 'Address support requests',
      href: '/admin/feedback',
      icon: MessageSquare,
      variant: 'secondary',
      count: stats?.system.pending_feedback || 0
    },
    {
      title: 'Analytics',
      description: 'View performance',
      href: '/admin/analytics/content',
      icon: BarChart3,
      variant: 'secondary'
    }
  ]

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup': return Users
      case 'quiz_completed': return Target
      case 'event_submitted': return Calendar
      case 'feedback_received': return MessageSquare
      case 'survey_completed': return FileText
      case 'multiplayer_session': return Globe
      default: return Activity
    }
  }

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup': return 'text-emerald-600'
      case 'quiz_completed': return 'text-blue-600'
      case 'event_submitted': return 'text-amber-600'
      case 'feedback_received': return 'text-purple-600'
      case 'survey_completed': return 'text-indigo-600'
      case 'multiplayer_session': return 'text-cyan-600'
      default: return 'text-slate-600'
    }
  }

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return AlertCircle
      case 'warning': return AlertCircle
      case 'info': return CheckCircle
      default: return AlertCircle
    }
  }

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-amber-600 bg-amber-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return ArrowUp
    if (value < threshold) return ArrowDown
    return Minus
  }

  const getTrendColor = (value: number, threshold: number = 0) => {
    if (value > threshold) return 'text-emerald-600'
    if (value < threshold) return 'text-red-600'
    return 'text-slate-600'
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600">
          Overview of your CivicSense administration
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className={cn(
              "group relative p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
              action.variant === 'urgent' && action.count && action.count > 0
                ? "bg-red-50 border-red-200 hover:bg-red-100"
                : action.variant === 'primary'
                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                : "bg-white border-slate-200 hover:bg-slate-50"
            )}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <action.icon className={cn(
                    "h-5 w-5",
                    action.variant === 'urgent' && action.count && action.count > 0
                      ? "text-red-600"
                      : action.variant === 'primary'
                      ? "text-white"
                      : "text-slate-600"
                  )} />
                  <div>
                    <h3 className={cn(
                      "font-semibold text-sm",
                      action.variant === 'primary' ? "text-white" : "text-slate-900"
                    )}>
                      {action.title}
                    </h3>
                    <p className={cn(
                      "text-xs",
                      action.variant === 'urgent' && action.count && action.count > 0
                        ? "text-red-600"
                        : action.variant === 'primary'
                        ? "text-white/70"
                        : "text-slate-500"
                    )}>
                      {action.description}
                    </p>
                  </div>
                </div>
                {action.count !== undefined && action.count > 0 && (
                  <Badge variant={action.variant === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                    {action.count}
                  </Badge>
                )}
              </div>
              <ArrowRight className={cn(
                "absolute bottom-4 right-4 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                action.variant === 'primary' ? "text-white/70" : "text-slate-400"
              )} />
            </div>
          </Link>
        ))}
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.users.total.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {stats.users.new_this_week} this week
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Content</CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.content.total_topics.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  topics, {stats.content.total_questions.toLocaleString()} questions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {Math.round(stats.engagement.avg_completion_rate * 100)}%
                </div>
                <div className="text-xs text-slate-500">
                  completion rate
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Civic Impact</CardTitle>
                <Star className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {Math.round(stats.analytics.civic_engagement_score)}
                </div>
                <div className="text-xs text-slate-500">
                  engagement score
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
            <CardDescription>Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 6).map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      getActivityColor(activity.type).replace('text-', 'bg-').replace('-600', '-100')
                    )}>
                      <Icon className={cn("h-4 w-4", getActivityColor(activity.type))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">System Status</CardTitle>
            <CardDescription>Alerts and system health information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemAlerts.length > 0 ? (
              systemAlerts.slice(0, 6).map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div key={alert.id} className={cn(
                    "p-4 rounded-lg border",
                    getAlertColor(alert.type)
                  )}>
                    <div className="flex items-start space-x-3">
                      <Icon className={cn("h-4 w-4 mt-0.5", getAlertColor(alert.type).split(' ')[0])} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {alert.title}
                        </p>
                        <p className="text-xs opacity-75">
                          {alert.description}
                        </p>
                        <p className="text-xs opacity-60 mt-1">
                          {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">All systems operational</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 