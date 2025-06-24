/**
 * ============================================================================
 * ADMIN DASHBOARD OVERVIEW COMPONENT
 * ============================================================================
 * Main dashboard overview with key metrics and quick actions for CivicSense admin panel
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  Calendar,
  MessageSquare,
  Globe,
  Brain,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface DashboardMetrics {
  users: {
    total: number
    active_30d: number
    new_7d: number
    growth_rate: number
  }
  content: {
    total_topics: number
    total_questions: number
    translated_languages: number
    pending_translations: number
  }
  engagement: {
    quiz_completions_30d: number
    avg_score: number
    completion_rate: number
  }
  system: {
    uptime: number
    api_response_time: number
    error_rate: number
  }
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'quiz_completion' | 'content_update' | 'translation_job'
  title: string
  description: string
  timestamp: string
  severity?: 'info' | 'warning' | 'success' | 'error'
}

export function AdminDashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      const mockMetrics: DashboardMetrics = {
        users: {
          total: 1247,
          active_30d: 856,
          new_7d: 34,
          growth_rate: 12.8
        },
        content: {
          total_topics: 48,
          total_questions: 1250,
          translated_languages: 8,
          pending_translations: 5
        },
        engagement: {
          quiz_completions_30d: 2847,
          avg_score: 73.5,
          completion_rate: 68.2
        },
        system: {
          uptime: 99.9,
          api_response_time: 145,
          error_rate: 0.02
        }
      }

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'user_registration',
          title: '34 new users registered',
          description: 'Weekly registration milestone reached',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          severity: 'success'
        },
        {
          id: '2',
          type: 'translation_job',
          title: 'Spanish translation completed',
          description: 'Quiz questions translated to Spanish',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          severity: 'success'
        },
        {
          id: '3',
          type: 'content_update',
          title: 'Constitutional Rights topic updated',
          description: '12 new questions added',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          severity: 'info'
        },
        {
          id: '4',
          type: 'quiz_completion',
          title: 'High engagement detected',
          description: '147 quiz completions in the last hour',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          severity: 'info'
        }
      ]

      setMetrics(mockMetrics)
      setRecentActivity(mockActivity)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    const iconMap = {
      user_registration: Users,
      quiz_completion: FileText,
      content_update: Brain,
      translation_job: Globe
    }
    
    const IconComponent = iconMap[type] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const getSeverityBadge = (severity: RecentActivity['severity']) => {
    const severityConfig = {
      success: { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600 text-white' },
      info: { variant: 'secondary' as const, className: '' },
      warning: { variant: 'outline' as const, className: 'border-yellow-500 text-yellow-700' },
      error: { variant: 'destructive' as const, className: '' }
    }
    
    const config = severityConfig[severity || 'info']
    return (
      <Badge variant={config.variant} className={config.className}>
        {severity || 'info'}
      </Badge>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-600">
            Welcome to CivicSense Admin Dashboard
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated {formatTimeAgo(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.users.total.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(metrics.users.growth_rate)}
                <span className={getTrendColor(metrics.users.growth_rate)}>
                  {Math.abs(metrics.users.growth_rate)}% growth
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.content.total_questions.toLocaleString()}</div>
              <div className="text-xs text-gray-600">
                {metrics.content.total_topics} topics
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quiz Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.engagement.quiz_completions_30d.toLocaleString()}</div>
              <div className="text-xs text-gray-600">
                {metrics.engagement.avg_score}% avg score
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.system.uptime}%</div>
              <div className="text-xs text-gray-600">
                {metrics.system.api_response_time}ms avg response
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="/admin/question-topics">
                <FileText className="h-4 w-4 mr-2" />
                Manage Content
              </a>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                View Users
              </a>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="/admin/analytics/content">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics Dashboard
              </a>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <a href="/admin/translations">
                <Globe className="h-4 w-4 mr-2" />
                Translation Management
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {getSeverityBadge(activity.severity)}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system performance and health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.system.uptime}%</div>
                <p className="text-sm text-gray-600">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.system.api_response_time}ms</div>
                <p className="text-sm text-gray-600">API Response Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.system.error_rate}%</div>
                <p className="text-sm text-gray-600">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 