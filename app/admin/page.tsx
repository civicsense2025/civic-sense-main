"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Brain,
  ArrowUpRight,
  Calendar,
  MessageSquare,
  Globe,
  Sparkles,
  Database,
  Eye,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentActivity(data.recent_activity || [])
        setSystemAlerts(data.system_alerts || [])
      } else {
        // Fallback mock data for development
        setStats({
          users: {
            total: 2847,
            active_last_30_days: 1432,
            new_this_week: 87,
            verified_count: 2156,
            admin_count: 8
          },
          content: {
            total_topics: 156,
            total_questions: 1204,
            pending_events: 12,
            ai_generated_today: 24,
            surveys_active: 6,
            scenarios_available: 18
          },
          engagement: {
            quiz_attempts_today: 342,
            quiz_attempts_week: 2156,
            survey_responses_today: 45,
            avg_completion_rate: 78.5,
            multiplayer_sessions_active: 23
          },
          system: {
            pending_feedback: 8,
            system_alerts: 2,
            last_backup: new Date().toISOString(),
            storage_usage: 67,
            api_calls_today: 8934
          },
          analytics: {
            civic_engagement_score: 84.2,
            knowledge_improvement_rate: 12.4,
            content_quality_score: 91.7,
            user_satisfaction_rate: 88.9
          }
        })
        
        setRecentActivity([
          { id: '1', type: 'user_signup', description: 'New user registered', timestamp: new Date().toISOString() },
          { id: '2', type: 'content_created', description: 'AI generated 5 new topics', timestamp: new Date(Date.now() - 1800000).toISOString() },
          { id: '3', type: 'quiz_completed', description: 'Quiz completion rate increased', timestamp: new Date(Date.now() - 3600000).toISOString() }
        ])
        
        setSystemAlerts([
          { id: '1', type: 'warning', title: 'High API Usage', description: 'API calls approaching daily limit', timestamp: new Date().toISOString(), resolved: false }
        ])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const quickActions: QuickAction[] = [
    {
      title: 'Generate Content',
      description: 'Create content from news',
      href: '/admin/ai-content',
      icon: Sparkles,
      variant: 'primary'
    },
    {
      title: 'Review Feedback',
      description: `${stats?.system.pending_feedback || 0} pending`,
      href: '/admin/feedback',
      icon: MessageSquare,
      variant: 'secondary',
      count: stats?.system.pending_feedback
    },
    {
      title: 'User Analytics',
      description: 'View engagement metrics',
      href: '/admin/analytics/users',
      icon: BarChart3,
      variant: 'secondary'
    },
    {
      title: 'Create Topic',
      description: 'Add new quiz topic',
      href: '/admin/question-topics/create',
      icon: Plus,
      variant: 'secondary'
    }
  ]

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <TrendingUp className="h-3 w-3 text-emerald-500" />
    return <ArrowUpRight className="h-3 w-3 text-slate-400" />
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4 text-blue-500" />
      case 'content_created': return <BookOpen className="h-4 w-4 text-emerald-500" />
      case 'quiz_completed': return <Target className="h-4 w-4 text-purple-500" />
      case 'event_submitted': return <Calendar className="h-4 w-4 text-orange-500" />
      case 'feedback_received': return <MessageSquare className="h-4 w-4 text-pink-500" />
      default: return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="p-8 space-y-12">
        <div className="space-y-4">
          <div className="h-8 w-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-6 w-64 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-50 dark:bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Here's what's happening with CivicSense today
        </p>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3">
          {systemAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg"
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {alert.title}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  {alert.description}
                </p>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-300">
                {formatTimeAgo(alert.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div className={cn(
              "group relative p-6 rounded-xl border transition-all hover:shadow-sm",
              action.variant === 'primary' 
                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    action.variant === 'primary'
                      ? "bg-white/20 dark:bg-black/20"
                      : "bg-gray-50 dark:bg-gray-800"
                  )}>
                    <action.icon className={cn(
                      "h-5 w-5",
                      action.variant === 'primary' ? "text-white dark:text-black" : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  {action.count && action.count > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {action.count}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className={cn(
                    "font-medium",
                    action.variant === 'primary' ? "text-white dark:text-black" : "text-gray-900 dark:text-white"
                  )}>
                    {action.title}
                  </h3>
                  <p className={cn(
                    "text-sm mt-1",
                    action.variant === 'primary' ? "text-white/70 dark:text-black/70" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {action.description}
                  </p>
                </div>
              </div>
              <ArrowUpRight className={cn(
                "absolute top-4 right-4 h-4 w-4 transition-colors",
                action.variant === 'primary' ? "text-white/60 dark:text-black/60" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              )} />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users */}
          <div className="space-y-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {getTrendIcon(stats.users.new_this_week, 50)}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.users.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Active (30d)</span>
                <span className="font-medium">{stats.users.active_last_30_days}</span>
              </div>
              <Progress 
                value={(stats.users.active_last_30_days / stats.users.total) * 100} 
                className="h-1.5"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {getTrendIcon(stats.content.ai_generated_today, 10)}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.content.total_topics}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Topics Created
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">AI Generated Today</span>
                <span className="font-medium text-emerald-600">{stats.content.ai_generated_today}</span>
              </div>
            </div>
          </div>

          {/* Engagement */}
          <div className="space-y-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              {getTrendIcon(stats.engagement.avg_completion_rate, 75)}
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.engagement.avg_completion_rate}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completion Rate
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Quiz Attempts Today</span>
                <span className="font-medium">{stats.engagement.quiz_attempts_today}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.system.storage_usage}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Storage Used
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">API Calls Today</span>
                <span className="font-medium">{stats.system.api_calls_today.toLocaleString()}</span>
              </div>
              <Progress value={stats.system.storage_usage} className="h-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="space-y-4 p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/analytics/users">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2">
                <div className="w-8 h-8 bg-white/60 dark:bg-slate-800/60 rounded-xl flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Summary */}
        {stats && (
          <div className="space-y-4 p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Key Metrics
              </h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/analytics/content">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Details
                </Link>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Civic Engagement</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.analytics.civic_engagement_score}%
                  </span>
                </div>
                <Progress value={stats.analytics.civic_engagement_score} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Content Quality</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.analytics.content_quality_score}%
                  </span>
                </div>
                <Progress value={stats.analytics.content_quality_score} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">User Satisfaction</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.analytics.user_satisfaction_rate}%
                  </span>
                </div>
                <Progress value={stats.analytics.user_satisfaction_rate} className="h-2" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Learning Info */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          AI Agent Learning System
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Panel Schema */}
          <div className="p-6 bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Admin Panel Tracking</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">admin_panel schema</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">Activity logging enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">Performance metrics active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">User preferences stored</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tracks all admin actions, performance metrics, and system health for continuous improvement.
                </p>
              </div>
            </div>
          </div>

          {/* AI Agent Schema */}
          <div className="p-6 bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">AI Agent Memory</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ai_agent schema</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">Pattern learning active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">Content analysis cached</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">Knowledge graph building</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enables AI to learn from patterns, cache analyses, and work offline with fallback responses.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-blue-900 dark:text-blue-100">Implementation Status</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                To enable AI learning and admin tracking, run the database migrations:
                <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
                  psql $DATABASE_URL &lt; sql/admin_panel_schema.sql<br/>
                  psql $DATABASE_URL &lt; sql/ai_agent_schema.sql
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 