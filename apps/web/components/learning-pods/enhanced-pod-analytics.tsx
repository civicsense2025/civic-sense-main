"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
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
  Minus,
  Star,
  Brain,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useToast } from '@civicsense/ui-web'
import { useAuth } from '@civicsense/ui-web'

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
  categoryBreakdown: Array<{
    category: string
    questionsAttempted: number
    averageAccuracy: number
    timeSpent: number
  }>
  difficultyDistribution: Array<{
    level: number
    count: number
    averageAccuracy: number
  }>
}

interface EnhancedPodAnalyticsProps {
  podId: string
}

export function EnhancedPodAnalytics({ podId }: EnhancedPodAnalyticsProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [analytics, setAnalytics] = useState<PodAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  const loadAnalytics = async () => {
    if (!user) {
      // Show demo analytics for guests
      setAnalytics(getMockAnalytics())
      setIsLoading(false)
      toast({
        title: "Demo analytics",
        description: "Sign in to view real pod analytics.",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/learning-pods/${podId}/analytics?days=${timeRange}`)
      
      if (!response.ok) {
        // Show mock analytics if API fails
        setAnalytics(getMockAnalytics())
        setIsLoading(false)
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view pod analytics.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Using demo analytics",
            description: "Showing sample analytics data for demonstration.",
          })
        }
        return
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Show mock analytics on error
      setAnalytics(getMockAnalytics())
      toast({
        title: "Using demo analytics",
        description: "Showing sample analytics data for demonstration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mock analytics data for demo
  const getMockAnalytics = (): PodAnalytics => ({
    pod: {
      id: podId,
      name: "Demo Learning Pod",
      type: "family",
      createdAt: "2024-01-15T00:00:00Z"
    },
    overview: {
      totalMembers: 5,
      activeMembers: 4,
      activeMembersPercentage: 80,
      totalQuestions: 245,
      averageAccuracy: 78.5,
      totalTimeSpent: 420,
      averageTimePerMember: 84
    },
    memberPerformance: [
      {
        userId: "user-1",
        role: "parent",
        questionsAttempted: 85,
        accuracy: 82.4,
        timeSpent: 145,
        bestStreak: 12,
        isActive: true
      },
      {
        userId: "user-2", 
        role: "child",
        questionsAttempted: 67,
        accuracy: 75.2,
        timeSpent: 98,
        bestStreak: 8,
        isActive: true
      },
      {
        userId: "user-3",
        role: "child", 
        questionsAttempted: 52,
        accuracy: 71.1,
        timeSpent: 89,
        bestStreak: 6,
        isActive: true
      },
      {
        userId: "user-4",
        role: "member",
        questionsAttempted: 41,
        accuracy: 68.3,
        timeSpent: 67,
        bestStreak: 5,
        isActive: false
      }
    ],
    timeSeriesData: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activeMembers: Math.floor(Math.random() * 3) + 2,
      questionsAnswered: Math.floor(Math.random() * 30) + 15,
      averageAccuracy: Math.floor(Math.random() * 20) + 70
    })).reverse(),
    insights: {
      mostActiveDay: {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activeMembers: 4
      },
      bestAccuracyDay: {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        averageAccuracy: 85.2
      },
      engagementTrend: 3.2
    },
    categoryBreakdown: [
      { category: "Government", questionsAttempted: 89, averageAccuracy: 79.2, timeSpent: 156 },
      { category: "Elections", questionsAttempted: 67, averageAccuracy: 82.1, timeSpent: 124 },
      { category: "Local Issues", questionsAttempted: 45, averageAccuracy: 75.8, timeSpent: 89 },
      { category: "Civil Rights", questionsAttempted: 44, averageAccuracy: 71.3, timeSpent: 51 }
    ],
    difficultyDistribution: [
      { level: 1, count: 45, averageAccuracy: 89.2 },
      { level: 2, count: 78, averageAccuracy: 81.5 },
      { level: 3, count: 67, averageAccuracy: 75.8 },
      { level: 4, count: 42, averageAccuracy: 68.9 },
      { level: 5, count: 13, averageAccuracy: 62.1 }
    ]
  })

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
    return <Minus className="h-4 w-4 text-slate-600" />
  }

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'parent': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'organizer': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      'teacher': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      'member': 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
      'child': 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
      'student': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
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

  if (!analytics) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No analytics available</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light">Analytics data will appear once members start learning.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          {analytics.pod.name} Analytics
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Performance insights and member engagement data
        </p>
        <div className="flex justify-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-0 bg-slate-100 dark:bg-slate-800 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics - Apple style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.overview.totalMembers}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Total Members</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-green-600">{analytics.overview.activeMembers} active</span>
            <span className="text-slate-500">
              ({analytics.overview.activeMembersPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.overview.totalQuestions.toLocaleString()}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Questions Answered</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-green-600">{analytics.overview.averageAccuracy.toFixed(1)}%</span>
            <span className="text-slate-500">accuracy</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {formatTime(analytics.overview.totalTimeSpent)}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Time Spent</p>
          <div className="text-sm text-slate-500">
            {formatTime(analytics.overview.averageTimePerMember)} avg/member
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl font-light text-slate-900 dark:text-white">
            {analytics.insights.engagementTrend.toFixed(1)}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Engagement Score</p>
          <div className="flex items-center justify-center gap-1 text-sm">
            {getTrendIcon(analytics.insights.engagementTrend)}
            <span className="text-slate-500">avg daily active</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-12 bg-slate-100 dark:bg-slate-800 h-12">
          <TabsTrigger value="overview" className="font-light">Activity</TabsTrigger>
          <TabsTrigger value="members" className="font-light">Members</TabsTrigger>
          <TabsTrigger value="performance" className="font-light">Performance</TabsTrigger>
          <TabsTrigger value="insights" className="font-light">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Activity Timeline */}
          <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-xl font-light text-slate-900 dark:text-white">
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.timeSeriesData.slice(-7).map((day, index) => (
                  <div key={day.date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {day.activeMembers} members • {day.questionsAnswered} questions
                      </div>
                    </div>
                    
                    {/* Activity Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Activity</span>
                        <span>{day.averageAccuracy.toFixed(0)}% accuracy</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-slate-900 dark:bg-white h-2 rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${Math.min((day.activeMembers / analytics.overview.totalMembers) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-8">
          {/* Member Performance */}
          <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-xl font-light text-slate-900 dark:text-white">
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.memberPerformance.slice(0, 5).map((member, index) => (
                  <div key={member.userId} className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-lg font-light">
                        #{index + 1}
                      </div>
                      <Badge className={cn(getRoleColor(member.role), "border-0")}>
                        {member.role}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-light text-slate-900 dark:text-white">
                          {member.questionsAttempted}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">questions</p>
                      </div>
                      <div>
                        <div className="text-2xl font-light text-slate-900 dark:text-white">
                          {member.accuracy.toFixed(1)}%
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">accuracy</p>
                      </div>
                      <div>
                        <div className="text-2xl font-light text-slate-900 dark:text-white">
                          {formatTime(member.timeSpent)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">time spent</p>
                      </div>
                      <div>
                        <div className="text-2xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-1">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          {member.bestStreak}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">best streak</p>
                      </div>
                    </div>
                    
                    {member.isActive && (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-0">
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
                
                {analytics.memberPerformance.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-light">No performance data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-8">
          {/* Performance Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-lg font-light text-slate-900 dark:text-white">
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryBreakdown?.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {category.category}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {category.averageAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-slate-900 dark:bg-white h-2 rounded-full transition-all duration-1000" 
                          style={{ width: `${category.averageAccuracy}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {category.questionsAttempted} questions • {formatTime(category.timeSpent)}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                        No category data yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-lg font-light text-slate-900 dark:text-white">
                  Difficulty Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.difficultyDistribution?.map((level, index) => (
                    <div key={level.level} className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: level.level }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400">
                            Level {level.level}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {level.count}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                          <div 
                            className="bg-slate-900 dark:bg-white h-1 rounded-full transition-all duration-1000" 
                            style={{ 
                              width: `${(level.count / Math.max(...(analytics.difficultyDistribution?.map(l => l.count) || [1]))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {level.averageAccuracy.toFixed(0)}%
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Brain className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                        No difficulty data yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-8">
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-lg font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Most Active Day
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-3xl font-light text-slate-900 dark:text-white">
                  {new Date(analytics.insights.mostActiveDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  {analytics.insights.mostActiveDay.activeMembers} active members
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-lg font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Target className="h-5 w-5" />
                  Best Accuracy Day
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-3xl font-light text-slate-900 dark:text-white">
                  {analytics.insights.bestAccuracyDay.averageAccuracy.toFixed(1)}%
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  on {new Date(analytics.insights.bestAccuracyDay.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pod Health Score */}
          <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-xl font-light text-slate-900 dark:text-white">
                Pod Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Member Engagement</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {analytics.overview.activeMembersPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${analytics.overview.activeMembersPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Learning Quality</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {analytics.overview.averageAccuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${analytics.overview.averageAccuracy}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">Activity Level</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {Math.min((analytics.insights.engagementTrend / 10) * 100, 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((analytics.insights.engagementTrend / 10) * 100, 100)}%` }}
                    ></div>
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