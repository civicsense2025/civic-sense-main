"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Crown, Zap, Trophy, Star, Target, Activity, BarChart3, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  className?: string
  compact?: boolean
  collapsible?: boolean
}

interface UserStatsData {
  totalTopics: number
  completedTopics: number
  currentLevel: number
  totalXP: number
  currentStreak: number
  averageScore: number
  recentActivity: Array<{
    topicId: string
    topicTitle: string
    score: number
    completedAt: string
  }>
}

export function DashboardStats({ className, compact = false, collapsible = false }: DashboardStatsProps) {
  const { user } = useAuth()
  const [statsData, setStatsData] = useState<UserStatsData | null>(null)
  const [topicsData, setTopicsData] = useState<Record<string, TopicMetadata>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load comprehensive stats data
  useEffect(() => {
    const loadStatsData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Load all topics
        const topics = await dataService.getAllTopics()
        setTopicsData(topics)
        const topicsArray = Object.values(topics)
        
        // Get completed topics from localStorage
        const completedTopicsKey = "civicAppCompletedTopics_v1"
        const savedCompleted = localStorage.getItem(completedTopicsKey)
        const completedTopicIds = savedCompleted ? JSON.parse(savedCompleted) : []
        
        // Get quiz results from localStorage
        const resultsKey = `civicAppQuizResults_${user.id}_v1`
        const savedResults = localStorage.getItem(resultsKey)
        let recentActivity: UserStatsData['recentActivity'] = []
        let totalXP = 0
        let totalScore = 0
        let scoreCount = 0
        
        if (savedResults) {
          try {
            const results = JSON.parse(savedResults)
            recentActivity = results.slice(-10).map((result: any) => {
              const score = Math.round((result.correctAnswers / result.totalQuestions) * 100)
              totalXP += score // Simple XP calculation
              totalScore += score
              scoreCount++
              
              return {
                topicId: result.topicId,
                topicTitle: topics[result.topicId]?.topic_title || 'Unknown Topic',
                score,
                completedAt: result.completedAt || new Date().toISOString()
              }
            }).reverse()
          } catch (error) {
            console.error('Error parsing quiz results:', error)
          }
        }
        
        // Calculate level from XP (every 1000 XP = 1 level)
        const currentLevel = Math.floor(totalXP / 1000) + 1
        
        // Calculate average score
        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
        
        // Calculate streak (simplified - consecutive days with completed quizzes)
        let currentStreak = 0
        if (recentActivity.length > 0) {
          const today = new Date()
          const todayStr = today.toDateString()
          const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()
          
          // Check if user completed a quiz today or yesterday
          const hasRecentActivity = recentActivity.some(activity => {
            const activityDate = new Date(activity.completedAt).toDateString()
            return activityDate === todayStr || activityDate === yesterdayStr
          })
          
          if (hasRecentActivity) {
            currentStreak = Math.min(recentActivity.length, 7) // Cap at 7 for demo
          }
        }
        
        const data: UserStatsData = {
          totalTopics: topicsArray.length,
          completedTopics: completedTopicIds.length,
          currentLevel,
          totalXP,
          currentStreak,
          averageScore,
          recentActivity
        }
        
        setStatsData(data)
      } catch (error) {
        console.error('Error loading stats data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadStatsData()
    }
  }, [user])

  if (!user || isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!statsData) {
    return (
      <div className={cn("text-center p-8", className)}>
        <p className="text-slate-700 dark:text-slate-200">Unable to load stats</p>
      </div>
    )
  }

  const completionPercentage = Math.round((statsData.completedTopics / statsData.totalTopics) * 100)

  // Determine user title based on level
  const getUserTitle = () => {
    if (statsData.currentLevel >= 20) return "Civic Master"
    if (statsData.currentLevel >= 15) return "Civic Expert"
    if (statsData.currentLevel >= 10) return "Civic Scholar"
    if (statsData.currentLevel >= 5) return "Civic Student"
    return "Civic Learner"
  }

  const getLevelColor = () => {
    if (statsData.currentLevel >= 20) return "text-indigo-700 dark:text-indigo-400"
    if (statsData.currentLevel >= 15) return "text-yellow-600 dark:text-yellow-400"
    if (statsData.currentLevel >= 10) return "text-blue-600 dark:text-blue-400"
    if (statsData.currentLevel >= 5) return "text-green-600 dark:text-green-400"
          return "text-slate-700 dark:text-slate-200"
  }

  const getLevelBadgeColor = () => {
    if (statsData.currentLevel >= 20) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
    if (statsData.currentLevel >= 15) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
    if (statsData.currentLevel >= 10) return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
    if (statsData.currentLevel >= 5) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
    return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300"
  }

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {/* Level */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 text-center">
            <Crown className={cn("h-6 w-6 mx-auto mb-2", getLevelColor())} />
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {statsData.currentLevel}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200">Level</p>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {completionPercentage}%
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200">Complete</p>
          </CardContent>
        </Card>

        {/* Streak */}
        {statsData.currentStreak > 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {statsData.currentStreak}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200">Streak</p>
            </CardContent>
          </Card>
        )}

        {/* Average Score */}
        {statsData.averageScore > 0 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-indigo-700 dark:text-indigo-400" />
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {statsData.averageScore}%
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200">Avg Score</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("shadow-2xl border-0 bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-slate-900/90 dark:to-slate-800/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl">Your Progress</span>
          </div>
          <Badge className={cn("px-3 py-1", getLevelBadgeColor())}>
            {getUserTitle()}
          </Badge>
        </CardTitle>
        <CardDescription className="text-base">
          Track your civic education journey and achievements
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Level */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <Crown className={cn("h-8 w-8 mx-auto mb-2", getLevelColor())} />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {statsData.currentLevel}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Level</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {statsData.totalXP.toLocaleString()} XP
            </p>
          </div>

          {/* Progress */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {completionPercentage}%
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Complete</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {statsData.completedTopics}/{statsData.totalTopics} topics
            </p>
          </div>

          {/* Streak */}
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 rounded-lg">
            <Flame className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {statsData.currentStreak}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Day Streak</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {statsData.currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
            </p>
          </div>

          {/* Average Score */}
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 text-indigo-700 dark:text-indigo-400" />
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {statsData.averageScore}%
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">Avg Score</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {statsData.recentActivity.length} quizzes
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Overall Progress</h3>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completionPercentage}%
            </span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-1 bg-slate-200 dark:bg-slate-700" 
          />
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">
            {statsData.completedTopics} of {statsData.totalTopics} civic topics completed
          </p>
        </div>

        {/* Recent Activity */}
        {statsData.recentActivity.length > 0 && (
          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {statsData.recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {activity.topicTitle}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={activity.score >= 80 ? "default" : activity.score >= 60 ? "secondary" : "destructive"}
                    className={cn(
                      "text-sm font-bold",
                      activity.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                      activity.score >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    )}
                  >
                    {activity.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 