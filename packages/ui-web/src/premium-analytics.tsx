"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { PremiumGate } from "@/components/premium-gate"
import { 
  BarChart3, TrendingUp, Clock, Target, Brain, 
  Calendar, Zap, Award, Crown, Sparkles,
  ChevronRight, Activity, Users, Lightbulb,
  PieChart, LineChart, BarChart, Lock, Eye, RefreshCw
} from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import { supabase } from "@civicsense/shared/lib/supabase"
import { enhancedQuizDatabase, type PremiumAnalyticsData } from "@civicsense/shared/lib/quiz-database"

interface PremiumAnalyticsProps {
  className?: string
}

interface HiddenDataStats {
  totalAnalyticsRecords: number
  totalProgressSnapshots: number
  totalLearningInsights: number
  oldestDataDate: string | null
  categoryBreakdowns: number
  timePatterns: number
  estimatedValue: string
}

export function PremiumAnalytics({ className }: PremiumAnalyticsProps) {
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [analyticsData, setAnalyticsData] = useState<PremiumAnalyticsData | null>(null)
  const [hiddenDataStats, setHiddenDataStats] = useState<HiddenDataStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user])

  const loadAnalyticsData = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (hasFeatureAccess('advanced_analytics')) {
        console.log('🔄 Loading premium analytics data...')
        
        // Load enhanced premium analytics
        const premiumData = await enhancedQuizDatabase.getPremiumAnalyticsData(user.id)
        
        if (premiumData) {
          setAnalyticsData(premiumData)
          console.log('✅ Premium analytics loaded:', premiumData)
        } else {
          // Fall back to mock data if no real data yet
          setAnalyticsData(createMockAnalyticsData())
          console.log('📊 Using mock analytics data (no real data yet)')
        }
      } else {
        console.log('🔒 Loading hidden data stats for free user...')
        await loadHiddenDataStats()
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('❌ Error loading analytics data:', error)
      setError('Failed to load analytics data')
      
      // Fall back to mock data on error
      if (hasFeatureAccess('advanced_analytics')) {
        setAnalyticsData(createMockAnalyticsData())
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadHiddenDataStats = async () => {
    if (!user) return

    try {
      // Get comprehensive stats about the data we're collecting
      const [
        analyticsCount,
        progressCount,
        insightsCount,
        oldestData,
        categoryData,
        quizAttempts
      ] = await Promise.all([
        // Count quiz analytics records
        supabase
          .from('user_quiz_analytics')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Count progress history snapshots
        supabase
          .from('user_progress_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Count learning insights
        supabase
          .from('user_learning_insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Get oldest data date
        supabase
          .from('user_quiz_analytics')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        
        // Get category breakdown count
        supabase
          .from('user_category_skills')
          .select('category')
          .eq('user_id', user.id),
          
        // Get total quiz attempts for value calculation
        supabase
          .from('user_quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true)
      ])

      // Calculate estimated value of their data
      const totalQuizzes = quizAttempts.count || 0
      const totalRecords = (analyticsCount.count || 0) + (progressCount.count || 0) + (insightsCount.count || 0)
      let estimatedValue = "Start taking quizzes"
      
      if (totalQuizzes > 0) {
        const estimatedDataPoints = totalQuizzes * 15 // Average data points per quiz
        if (estimatedDataPoints > 1000) {
          estimatedValue = `${Math.round(estimatedDataPoints / 100) / 10}k+ data points`
        } else {
          estimatedValue = `${estimatedDataPoints}+ data points`
        }
      }

      setHiddenDataStats({
        totalAnalyticsRecords: analyticsCount.count || 0,
        totalProgressSnapshots: progressCount.count || 0,
        totalLearningInsights: insightsCount.count || 0,
        oldestDataDate: oldestData?.data && 'created_at' in oldestData.data ? oldestData.data.created_at : null,
        categoryBreakdowns: (categoryData?.data || []).length || 0,
        timePatterns: analyticsCount.count || 0,
        estimatedValue
      })
      
      console.log('📊 Hidden data stats loaded:', {
        totalRecords,
        estimatedValue,
        oldestDate: oldestData?.data && 'created_at' in oldestData.data ? oldestData.data.created_at : null
      })
      
    } catch (error) {
      console.error('❌ Error loading hidden data stats:', error)
      // Set some default values to still show upgrade prompts
      setHiddenDataStats({
        totalAnalyticsRecords: 0,
        totalProgressSnapshots: 0,
        totalLearningInsights: 0,
        oldestDataDate: null,
        categoryBreakdowns: 0,
        timePatterns: 0,
        estimatedValue: "Start taking quizzes"
      })
    }
  }

  const createMockAnalyticsData = (): PremiumAnalyticsData => {
    return {
      weeklyProgress: [
        { week: "Week 1", quizzes: 5, accuracy: 78, xp: 450 },
        { week: "Week 2", quizzes: 8, accuracy: 82, xp: 720 },
        { week: "Week 3", quizzes: 6, accuracy: 85, xp: 540 },
        { week: "Week 4", quizzes: 10, accuracy: 88, xp: 900 },
      ],
      categoryPerformance: [
        { category: "Constitutional Law", accuracy: 92, timeSpent: 45, improvement: 15 },
        { category: "Voting Rights", accuracy: 85, timeSpent: 32, improvement: 8 },
        { category: "Civil Liberties", accuracy: 78, timeSpent: 28, improvement: -2 },
        { category: "Government Structure", accuracy: 88, timeSpent: 38, improvement: 12 },
      ],
      learningPatterns: {
        bestTimeOfDay: "Evening (7-9 PM)",
        averageSessionLength: 12,
        preferredDifficulty: "Intermediate",
        streakPattern: "Consistent weekday learner"
      },
      predictiveInsights: [
        {
          insight: "You perform 23% better on Constitutional Law topics",
          confidence: 87,
          recommendation: "Focus on expanding your Civil Liberties knowledge to balance your expertise"
        },
        {
          insight: "Your accuracy increases by 15% during evening sessions",
          confidence: 92,
          recommendation: "Schedule important study sessions between 7-9 PM for optimal performance"
        },
        {
          insight: "You're on track to reach Expert level in 3 categories this month",
          confidence: 78,
          recommendation: "Maintain current pace and consider setting a mastery goal"
        }
      ]
    }
  }

  const handlePremiumFeatureClick = () => {
    if (!hasFeatureAccess('advanced_analytics')) {
      setShowPremiumGate(true)
    }
  }

  const handleRefresh = () => {
    loadAnalyticsData()
  }

  const getDataAgeText = () => {
    if (!hiddenDataStats?.oldestDataDate) return "Start taking quizzes to build your analytics"
    
    const oldestDate = new Date(hiddenDataStats.oldestDataDate)
    const now = new Date()
    const diffTime = now.getTime() - oldestDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.ceil(diffDays / 7)
    const diffMonths = Math.ceil(diffDays / 30)
    
    if (diffDays < 7) return `${diffDays} days of data`
    if (diffWeeks < 8) return `${diffWeeks} weeks of data`
    return `${diffMonths} months of data`
  }

  if (!user) return null

  if (!hasFeatureAccess('advanced_analytics')) {
    return (
      <>
        <Card className={cn("border-2 border-dashed border-slate-200 dark:border-slate-700", className)}>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Header with lock icon */}
              <div className="relative mb-6">
                <BarChart3 className="h-16 w-16 mx-auto text-slate-400" />
                <div className="absolute -top-2 -right-2 bg-slate-900 dark:bg-slate-100 rounded-full p-2">
                  <Lock className="h-4 w-4 text-white dark:text-slate-900" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Your Analytics Are Ready
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  We've been tracking your learning progress behind the scenes. Upgrade to unlock detailed insights about your performance.
                </p>
              </div>

              {/* Enhanced data teasers */}
              {hiddenDataStats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center group hover:scale-105 transition-transform">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {hiddenDataStats.totalAnalyticsRecords}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Quiz Analytics
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center group hover:scale-105 transition-transform">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {hiddenDataStats.totalProgressSnapshots}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Progress Snapshots
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center group hover:scale-105 transition-transform">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {hiddenDataStats.totalLearningInsights}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      AI Insights
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center group hover:scale-105 transition-transform">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {hiddenDataStats.categoryBreakdowns}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Category Breakdowns
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center group hover:scale-105 transition-transform">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {hiddenDataStats.timePatterns}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Time Patterns
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 text-center group hover:scale-105 transition-transform border border-purple-200 dark:border-purple-800">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {hiddenDataStats.estimatedValue}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      Waiting for You
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced preview features */}
              <div className="space-y-4 mb-8">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  What You'll Unlock:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 group hover:scale-105 transition-transform">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">Performance Trends</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">See how your accuracy improves over time with detailed charts</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800 group hover:scale-105 transition-transform">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-medium text-purple-900 dark:text-purple-100 text-sm">AI Learning Insights</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Personalized recommendations powered by machine learning</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 group hover:scale-105 transition-transform">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100 text-sm">Optimal Study Times</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Discover when you learn most effectively based on your data</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800 group hover:scale-105 transition-transform">
                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-medium text-orange-900 dark:text-orange-100 text-sm">Category Mastery</div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">Track your progress and identify strengths and weaknesses</div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePremiumFeatureClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Unlock Your Analytics
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                All your data is already being collected and analyzed
              </p>
            </div>
          </CardContent>
        </Card>
        
        <PremiumGate
          feature="advanced_analytics"
          isOpen={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          title="Advanced Analytics"
          description="Get detailed insights into your learning patterns and performance"
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
            <span className="text-slate-600 dark:text-slate-400">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="text-red-500">⚠️ Error loading analytics</div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Advanced Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Deep insights into your learning journey</p>
          {lastRefresh && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="hover:scale-105 transition-transform"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="group hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Weekly Quizzes</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.quizzes || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">This week</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.accuracy || 0}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">This week</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">XP Earned</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.xp || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">This week</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Avg Session</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.learningPatterns.averageSessionLength || 0}m
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Minutes</p>
              </CardContent>
            </Card>
          </div>

          <Card className="group hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Weekly Progress Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="font-medium">{week.week}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <BarChart className="h-4 w-4 mr-1 text-blue-500" />
                        {week.quizzes} quizzes
                      </span>
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1 text-green-500" />
                        {week.accuracy}% accuracy
                      </span>
                      <span className="flex items-center text-yellow-600 font-medium">
                        <Zap className="h-4 w-4 mr-1" />
                        {week.xp} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Your accuracy and improvement across different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.categoryPerformance.map((category, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{category.accuracy}%</span>
                        <Badge 
                          variant={category.improvement > 0 ? "default" : "secondary"} 
                          className={cn(
                            "text-xs transition-all hover:scale-105",
                            category.improvement > 0 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          )}
                        >
                          {category.improvement > 0 ? "+" : ""}{category.improvement}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.accuracy} className="h-3" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {category.timeSpent} minutes studied
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Learning Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Best Time of Day</span>
                  <p className="text-lg text-blue-900 dark:text-blue-100">{analyticsData?.learningPatterns.bestTimeOfDay}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Average Session</span>
                  <p className="text-lg text-green-900 dark:text-green-100">{analyticsData?.learningPatterns.averageSessionLength} minutes</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Preferred Difficulty</span>
                  <p className="text-lg text-purple-900 dark:text-purple-100">{analyticsData?.learningPatterns.preferredDifficulty}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Learning Style</span>
                  <p className="text-lg text-orange-900 dark:text-orange-100">{analyticsData?.learningPatterns.streakPattern}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Study Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Schedule sessions during your peak performance time
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Focus on weaker categories for balanced growth
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Maintain consistent daily practice for best results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI-Powered Insights</span>
              </CardTitle>
              <CardDescription>Personalized recommendations based on your learning data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.predictiveInsights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-gradient-to-b from-purple-500 to-blue-500 group hover:shadow-lg transition-all hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{insight.insight}</p>
                        <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {insight.recommendation}
                      </p>
                      <Progress value={insight.confidence} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}