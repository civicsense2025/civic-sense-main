"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  BarChart3,
  Activity,
  Zap,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import { useToast } from '@civicsense/shared/hooks/use-toast'
import React from 'react'

interface PodAnalytics {
  pod: {
    id: string
    name: string
    type: string
    createdAt: string
  }
  overview: {
    totalMembers: number
    activeMembers: number
    activeMembersPercentage: number
    totalQuestions: number
    averageAccuracy: number
    totalTimeSpent: number
    averageTimePerMember: number
  }
  memberPerformance: Array<{
    userId: string
    role: string
    questionsAttempted: number
    accuracy: number
    timeSpent: number
    bestStreak: number
    isActive: boolean
  }>
  timeSeriesData: Array<{
    date: string
    activeMembers: number
    questionsAnswered: number
    averageAccuracy: number
  }>
  insights: {
    mostActiveDay: {
      date: string
      activeMembers: number
    }
    bestAccuracyDay: {
      date: string
      averageAccuracy: number
    }
    engagementTrend: number
  }
}

interface PodAnalyticsProps {
  podId: string
}

interface MemberPerformance {
  userId: string
  role: string
  questionsAttempted: number
  accuracy: number
  timeSpent: number
  bestStreak: number
  isActive: boolean
}

export function PodAnalytics({ podId }: PodAnalyticsProps) {
  const { toast } = useToast()
  
  const [analytics, setAnalytics] = useState<PodAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [memberFilter, setMemberFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/learning-pods/${podId}/analytics?days=${timeRange}`)
      const data = await response.json()
      
      if (response.ok) {
        setAnalytics(data.analytics)
      } else {
        toast({
          title: "Error loading analytics",
          description: data.error || "Failed to load pod analytics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast({
        title: "Error loading analytics",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [podId, timeRange])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'parent': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'organizer': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'teacher': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'member': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'child': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'student': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
    return colorMap[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const filteredMemberPerformance = React.useMemo(() => {
    if (!analytics) return []
    
    let filtered: MemberPerformance[] = [...analytics.memberPerformance]
    
    // Apply member role filter
    if (memberFilter !== 'all') {
      filtered = filtered.filter(member => member.role === memberFilter)
    }
    
    // Apply activity filter
    if (activityFilter === 'active') {
      filtered = filtered.filter(member => member.isActive)
    } else if (activityFilter === 'inactive') {
      filtered = filtered.filter(member => !member.isActive)
    }
    
    return filtered
  }, [analytics, memberFilter, activityFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No analytics available</h3>
          <p className="text-muted-foreground">Analytics data will appear once members start learning.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{analytics?.pod.name} Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights and member engagement data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="child">Children</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{analytics.overview.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-green-600">{analytics.overview.activeMembers} active</span>
              <span className="text-muted-foreground">
                ({analytics.overview.activeMembersPercentage.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Questions Answered</p>
                <p className="text-2xl font-bold">{analytics.overview.totalQuestions.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-green-600">{analytics.overview.averageAccuracy.toFixed(1)}%</span>
              <span className="text-muted-foreground">accuracy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{formatTime(analytics.overview.totalTimeSpent)}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">
                {formatTime(analytics.overview.averageTimePerMember)} avg/member
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{analytics.insights.engagementTrend.toFixed(1)}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {getTrendIcon(analytics.insights.engagementTrend)}
              <span className="text-muted-foreground">avg daily active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="members">Member Performance</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple activity chart representation */}
              <div className="space-y-4">
                {analytics.timeSeriesData.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{day.activeMembers} active members</span>
                        <span className="text-xs text-muted-foreground">
                          {day.questionsAnswered} questions
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((day.activeMembers / analytics.overview.totalMembers) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-right">
                      {day.averageAccuracy.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMemberPerformance.map((member: MemberPerformance, index: number) => (
                  <div key={member.userId} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <Badge className={getRoleColor(member.role)} variant="secondary">
                        {member.role}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{member.questionsAttempted}</p>
                        <p className="text-muted-foreground">questions</p>
                      </div>
                      <div>
                        <p className="font-medium">{member.accuracy.toFixed(1)}%</p>
                        <p className="text-muted-foreground">accuracy</p>
                      </div>
                      <div>
                        <p className="font-medium">{formatTime(member.timeSpent)}</p>
                        <p className="text-muted-foreground">time spent</p>
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {member.bestStreak}
                        </p>
                        <p className="text-muted-foreground">best streak</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.isActive && (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredMemberPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No members match the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Most Active Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {new Date(analytics.insights.mostActiveDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {analytics.insights.mostActiveDay.activeMembers} active members
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Best Accuracy Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {analytics.insights.bestAccuracyDay.averageAccuracy.toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">
                    on {new Date(analytics.insights.bestAccuracyDay.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pod Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Member Engagement</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${analytics.overview.activeMembersPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {analytics.overview.activeMembersPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Learning Quality</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${analytics.overview.averageAccuracy}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {analytics.overview.averageAccuracy.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Activity Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((analytics.insights.engagementTrend / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.min((analytics.insights.engagementTrend / 10) * 100, 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 