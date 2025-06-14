"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { DashboardStats } from "@/components/dashboard-stats"
import { EnhancedProgressDashboard } from "@/components/enhanced-progress-dashboard"
import { PremiumAnalytics } from "@/components/premium-analytics"
import { PremiumSubscriptionCard } from "@/components/premium-subscription-card"
import { PremiumFeaturesShowcase } from "@/components/premium-features-showcase"
import { CustomDeckBuilder } from "@/components/custom-deck-builder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, BarChart3, BookOpen, Settings, 
  TrendingUp, Target, Calendar, Users,
  Sparkles, Star, Shield, Zap, Trophy,
  Clock, CheckCircle, XCircle, ArrowRight,
  Brain, Award, Flame, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { dataService } from "@/lib/data-service"
import { enhancedProgressOperations, type EnhancedUserProgress, type Achievement } from "@/lib/enhanced-gamification"
import Link from "next/link"

interface DashboardData {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  currentStreak: number
  totalXP: number
  currentLevel: number
  recentActivity: Array<{
    topicId: string
    topicTitle: string
    score: number
    completedAt: string
    timeSpent?: number
  }>
  categoryProgress: Record<string, {
    completed: number
    total: number
    averageScore: number
  }>
  weeklyProgress: Array<{
    date: string
    quizzesCompleted: number
    xpGained: number
  }>
  achievements: Achievement[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { subscription, isPremium, isPro, isActive, hasFeatureAccess } = usePremium()
  const [activeTab, setActiveTab] = useState("overview")
  const [showProgressDashboard, setShowProgressDashboard] = useState(false)
  const [showCustomDeckBuilder, setShowCustomDeckBuilder] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedUserProgress | null>(null)

  // Load comprehensive dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Load enhanced progress data
        const progress = await enhancedProgressOperations.getComprehensiveStats(user.id)
        setEnhancedProgress(progress)
        
        // Load all topics for context
        const allTopics = await dataService.getAllTopics()
        const topicsArray = Object.values(allTopics)
        
        // Get recent activity from localStorage (this should eventually come from DB)
        const recentActivityKey = `civicAppQuizResults_${user.id}_v1`
        const savedResults = localStorage.getItem(recentActivityKey)
        let recentActivity: DashboardData['recentActivity'] = []
        
        if (savedResults) {
          try {
            const results = JSON.parse(savedResults)
            recentActivity = results.slice(-10).map((result: any) => ({
              topicId: result.topicId,
              topicTitle: allTopics[result.topicId]?.topic_title || 'Unknown Topic',
              score: Math.round((result.correctAnswers / result.totalQuestions) * 100),
              completedAt: result.completedAt || new Date().toISOString(),
              timeSpent: result.timeSpent
            })).reverse()
          } catch (error) {
            console.error('Error parsing recent activity:', error)
          }
        }
        
        // Calculate category progress
        const categoryProgress: DashboardData['categoryProgress'] = {}
        const completedTopicsKey = "civicAppCompletedTopics_v1"
        const savedCompleted = localStorage.getItem(completedTopicsKey)
        const completedTopicIds = savedCompleted ? JSON.parse(savedCompleted) : []
        
        // Group topics by category
        topicsArray.forEach(topic => {
          topic.categories.forEach(category => {
            if (!categoryProgress[category]) {
              categoryProgress[category] = { completed: 0, total: 0, averageScore: 0 }
            }
            categoryProgress[category].total++
            if (completedTopicIds.includes(topic.topic_id)) {
              categoryProgress[category].completed++
            }
          })
        })
        
        // Generate weekly progress (mock data for now - should come from DB)
        const weeklyProgress: DashboardData['weeklyProgress'] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          // This should be calculated from actual quiz completion data
          const quizzesForDay = recentActivity.filter(activity => 
            activity.completedAt.startsWith(dateStr)
          ).length
          
          weeklyProgress.push({
            date: dateStr,
            quizzesCompleted: quizzesForDay,
            xpGained: quizzesForDay * 50 // Approximate XP per quiz
          })
        }
        
        const data: DashboardData = {
          totalQuizzes: topicsArray.length,
          completedQuizzes: progress?.totalQuizzesCompleted || completedTopicIds.length,
          averageScore: progress?.accuracyPercentage || 0,
          currentStreak: progress?.currentStreak || 0,
          totalXP: progress?.totalXp || 0,
          currentLevel: progress?.currentLevel || 1,
          recentActivity,
          categoryProgress,
          weeklyProgress,
          achievements: progress?.recentAchievements || []
        }
        
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  useEffect(() => {
    // Check for upgrade success/failure from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const upgradeStatus = urlParams.get('upgrade')
    
    if (upgradeStatus === 'success') {
      console.log('Upgrade successful!')
    } else if (upgradeStatus === 'cancelled') {
      console.log('Upgrade cancelled')
    }
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sign In Required
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                Please sign in to access your personalized dashboard and track your civic education progress.
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Go to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getTierBadge = () => {
    if (isPro) {
      return (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg">
          <Star className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      )
    }
    if (isPremium) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
        Free Tier
      </Badge>
    )
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400"
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  const completionPercentage = Math.round((dashboardData.completedQuizzes / dashboardData.totalQuizzes) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with Stats Overview */}
        <div className="relative">
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    {getTierBadge()}
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                    Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email?.split('@')[0]}</span>! 
                    Track your civic education journey and celebrate your achievements.
                  </p>
                  
                  {/* Quick Stats Row */}
                  <div className="flex flex-wrap gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Level {dashboardData.currentLevel}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{dashboardData.totalXP.toLocaleString()} XP</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                          {dashboardData.completedQuizzes}/{dashboardData.totalQuizzes}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Quizzes Completed</p>
                      </div>
                    </div>
                    
                    {dashboardData.currentStreak > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dashboardData.currentStreak}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Day Streak</p>
                        </div>
                      </div>
                    )}
                    
                    {dashboardData.averageScore > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dashboardData.averageScore}%</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link href="/">
                    <Button variant="outline" size="lg" className="shadow-md border-slate-300 dark:border-slate-600">
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Back to Home
                    </Button>
                  </Link>
                  {hasFeatureAccess('advanced_analytics') && (
                    <Button 
                      onClick={() => setShowProgressDashboard(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Detailed Analytics
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Overall Progress Bar */}
              <div className="mt-8 p-6 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Overall Progress</h3>
                  <span className={cn("text-2xl font-bold", getCompletionColor(completionPercentage))}>
                    {completionPercentage}%
                  </span>
                </div>
                <Progress 
                  value={completionPercentage} 
                  className="h-3 bg-slate-200 dark:bg-slate-700" 
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {dashboardData.completedQuizzes} of {dashboardData.totalQuizzes} topics completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="decks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Custom Decks
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Upgrade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Your latest quiz attempts and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {activity.topicTitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(activity.completedAt).toLocaleDateString()}
                            </p>
                            {activity.timeSpent && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">
                                  {Math.round(activity.timeSpent / 60)}m
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={activity.score >= 80 ? "default" : activity.score >= 60 ? "secondary" : "destructive"}
                          className={cn(
                            "text-sm font-bold min-w-[60px] justify-center",
                            activity.score >= 80 ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300" :
                            activity.score >= 60 ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300" :
                            "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                          )}
                        >
                          {activity.score}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">No quiz activity yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Start taking quizzes to see your progress here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Progress */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <Target className="h-6 w-6 text-green-600" />
                    <span>Category Progress</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Track your progress across different civic topics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(dashboardData.categoryProgress)
                    .filter(([_, data]) => data.total > 0)
                    .slice(0, 6)
                    .map(([category, data]) => {
                      const percentage = Math.round((data.completed / data.total) * 100)
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {data.completed}/{data.total}
                              </span>
                              <span className={cn("text-sm font-bold", getCompletionColor(percentage))}>
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2 bg-slate-200 dark:bg-slate-700"
                          />
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Activity Chart */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <span>Weekly Activity</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Your quiz completion activity over the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-32">
                  {dashboardData.weeklyProgress.map((day, index) => {
                    const height = Math.max((day.quizzesCompleted / Math.max(...dashboardData.weeklyProgress.map(d => d.quizzesCompleted), 1)) * 100, 5)
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm min-h-[4px] transition-all duration-300 hover:opacity-80"
                          style={{ height: `${height}%` }}
                          title={`${day.quizzesCompleted} quizzes, ${day.xpGained} XP`}
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {dashboardData.achievements.length > 0 && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <span>Recent Achievements</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Celebrate your latest accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.achievements.slice(0, 6).map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-yellow-200/60 dark:border-yellow-700/60">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {achievement.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {hasFeatureAccess('advanced_analytics') ? (
                <PremiumAnalytics />
              ) : (
                <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Unlock detailed insights into your learning progress with Premium
                    </p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Upgrade to Premium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="decks">
            <div className="space-y-6">
              {hasFeatureAccess('custom_decks') ? (
                <CustomDeckBuilder />
              ) : (
                <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Custom Quiz Decks</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Create personalized quiz collections tailored to your learning goals
                    </p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Upgrade to Premium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="space-y-6">
              <PremiumSubscriptionCard />
            </div>
          </TabsContent>

          <TabsContent value="upgrade">
            <div className="space-y-6">
              <PremiumFeaturesShowcase />
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Progress Modal */}
        <EnhancedProgressDashboard 
          isOpen={showProgressDashboard} 
          onClose={() => setShowProgressDashboard(false)} 
        />

        {/* Custom Deck Builder Modal */}
        {showCustomDeckBuilder && (
          <CustomDeckBuilder onClose={() => setShowCustomDeckBuilder(false)} />
        )}
      </div>
    </div>
  )
} 