'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Loader2,
  UserCheck,
  UserPlus,
  Clock
} from 'lucide-react'

interface UserMetrics {
  total_users: number
  active_users_30d: number
  new_users_7d: number
  verified_users: number
  retention_rate: number
  engagement_score: number
  avg_session_duration: number
  bounce_rate: number
  user_growth_rate: number
}

interface UserActivity {
  date: string
  new_users: number
  active_users: number
  sessions: number
  quiz_completions: number
  survey_responses: number
}

export function UserAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserAnalytics()
  }, [])

  const loadUserAnalytics = async () => {
    setLoading(true)
    try {
      // Mock data since API endpoints might not exist
      const mockMetrics: UserMetrics = {
        total_users: 1247,
        active_users_30d: 856,
        new_users_7d: 34,
        verified_users: 1098,
        retention_rate: 68.5,
        engagement_score: 7.8,
        avg_session_duration: 18.5,
        bounce_rate: 24.3,
        user_growth_rate: 12.8
      }

      const mockActivities: UserActivity[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          new_users: Math.floor(Math.random() * 15) + 1,
          active_users: Math.floor(Math.random() * 200) + 50,
          sessions: Math.floor(Math.random() * 300) + 100,
          quiz_completions: Math.floor(Math.random() * 150) + 25,
          survey_responses: Math.floor(Math.random() * 50) + 5
        }
      })

      setMetrics(mockMetrics)
      setActivities(mockActivities)
    } catch (error) {
      console.error('Error loading user analytics:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading user analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Analytics</h1>
          <p className="text-gray-600">User behavior and engagement insights</p>
        </div>
        <Button onClick={loadUserAnalytics} variant="outline">
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
              <div className="text-2xl font-bold">{metrics.total_users.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(metrics.user_growth_rate)}
                <span className={getTrendColor(metrics.user_growth_rate)}>
                  {Math.abs(metrics.user_growth_rate)}% growth
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Users (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_users_30d.toLocaleString()}</div>
              <div className="text-xs text-gray-600">
                {Math.round((metrics.active_users_30d / metrics.total_users) * 100)}% of total users
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                New Users (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.new_users_7d}</div>
              <div className="text-xs text-gray-600">
                This week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Engagement Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.engagement_score}/10</div>
              <div className="text-xs text-gray-600">
                Average user engagement
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Daily new user registrations over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Average: {activities.reduce((sum, a) => sum + a.new_users, 0) / activities.length} users/day</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Verification Status</CardTitle>
                <CardDescription>Email verification and account status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span>Verified Users</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{metrics.verified_users.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {Math.round((metrics.verified_users / metrics.total_users) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Unverified Users</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(metrics.total_users - metrics.verified_users).toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {Math.round(((metrics.total_users - metrics.verified_users) / metrics.total_users) * 100)}%
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avg_session_duration} min</div>
                <p className="text-sm text-gray-600">Average session length</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.bounce_rate}%</div>
                <p className="text-sm text-gray-600">Single-page sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.retention_rate}%</div>
                <p className="text-sm text-gray-600">30-day retention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Analysis</CardTitle>
              <CardDescription>User retention patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Retention cohort analysis would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Demographics</CardTitle>
              <CardDescription>Geographic and demographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Demographic charts would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 