"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Target, 
  Award,
  BarChart3,
  ArrowRight,
  Star,
  Flame,
  CheckCircle2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { enhancedQuizDatabase } from '@civicsense/types/quizbase'
import { dataService } from '@civicsense/business-logic/services'
import Link from "next/link"

interface ActivityInsight {
  type: 'streak' | 'improvement' | 'category_mastery' | 'milestone' | 'learning_pattern'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  icon: 'flame' | 'trending-up' | 'award' | 'target' | 'clock'
  priority: 'high' | 'medium' | 'low'
  data?: any
}

interface LearningStats {
  weeklyProgress: {
    quizzesCompleted: number
    avgScore: number
    timeSpent: number
    improvementTrend: number
  }
  currentStreak: number
  bestCategory: string
  strugglingCategory: string
  totalActiveDays: number
  recentAchievements: string[]
}

interface EnhancedRecentActivityProps {
  userId: string
  className?: string
}

export function EnhancedRecentActivity({ userId, className }: EnhancedRecentActivityProps) {
  const router = useRouter()
  const [insights, setInsights] = useState<ActivityInsight[]>([])
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEnhancedActivity = async () => {
      try {
        setIsLoading(true)
        
        // Get comprehensive activity data
        const [recentActivity, allTopics] = await Promise.all([
          enhancedQuizDatabase.getRecentActivity(userId, 30),
          dataService.getAllTopics()
        ])

        // Generate learning stats
        const stats = await generateLearningStats(userId, recentActivity, allTopics)
        setLearningStats(stats)

        // Generate actionable insights
        const activityInsights = await generateActivityInsights(userId, recentActivity, stats, allTopics)
        setInsights(activityInsights)

      } catch (error) {
        console.error('Error loading enhanced activity:', error)
        setInsights([])
        setLearningStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadEnhancedActivity()
    }
  }, [userId])

  const getInsightIcon = (icon: string) => {
    switch (icon) {
      case 'flame': return <Flame className="w-4 h-4" />
      case 'trending-up': return <TrendingUp className="w-4 h-4" />
      case 'award': return <Award className="w-4 h-4" />
      case 'target': return <Target className="w-4 h-4" />
      case 'clock': return <Clock className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
      case 'medium': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
      case 'low': return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20'
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
          </div>
          <div className="w-48 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!learningStats || insights.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Learning Activity
          </h2>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
            Start Learning to See Insights
          </h3>
          <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
            Complete a few quizzes and we'll show you personalized learning insights and progress patterns
          </p>
          <Button asChild className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 rounded-full">
            <Link href="/">
              Start Your First Quiz
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Learning Activity
          </h2>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          View All Activity →
        </Button>
      </div>

      {/* Weekly Summary Card */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900 dark:text-white">This Week</h3>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 font-light">
              {learningStats.totalActiveDays} active days
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-light text-slate-900 dark:text-white mb-1">
                {learningStats.weeklyProgress.quizzesCompleted}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
                Quizzes completed
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-light text-slate-900 dark:text-white">
                  {Math.round(learningStats.weeklyProgress.avgScore)}%
                </span>
                {learningStats.weeklyProgress.improvementTrend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : learningStats.weeklyProgress.improvementTrend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
                Average score
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-light text-slate-900 dark:text-white mb-1">
                {Math.round(learningStats.weeklyProgress.timeSpent / 60)}m
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
                Time learning
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Insights */}
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, index) => (
          <Card key={index} className="border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getInsightColor(insight.priority)}`}>
                  {getInsightIcon(insight.icon)}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-light leading-relaxed">
                    {insight.description}
                  </p>
                </div>
                
                {insight.action && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    asChild
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Link href={insight.action.href}>
                      {insight.action.label}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Performance Quick View */}
      {(learningStats.bestCategory || learningStats.strugglingCategory) && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningStats.bestCategory && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100 text-sm">
                      Strong in {learningStats.bestCategory}
                    </div>
                    <div className="text-green-700 dark:text-green-300 text-xs font-light">
                      Keep up the excellent work!
                    </div>
                  </div>
                </div>
              )}
              
              {learningStats.strugglingCategory && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Practice {learningStats.strugglingCategory}
                    </div>
                    <div className="text-blue-700 dark:text-blue-300 text-xs font-light">
                      Room for improvement here
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions for generating insights
async function generateLearningStats(
  userId: string, 
  recentActivity: any[], 
  allTopics: Record<string, any>
): Promise<LearningStats> {
  try {
    // Calculate weekly progress
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyActivities = recentActivity.filter(activity => 
      new Date(activity.completedAt) >= oneWeekAgo
    )

    const weeklyQuizzes = weeklyActivities.length
    const weeklyAvgScore = weeklyActivities.length > 0 
      ? weeklyActivities.reduce((sum, activity) => sum + activity.score, 0) / weeklyActivities.length
      : 0
    const weeklyTimeSpent = weeklyActivities.reduce((sum, activity) => sum + (activity.timeSpent || 0), 0)

    // Calculate improvement trend (compare last 7 days to previous 7 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const previousWeekActivities = recentActivity.filter(activity => {
      const date = new Date(activity.completedAt)
      return date >= twoWeeksAgo && date < oneWeekAgo
    })
    
    const previousWeekAvgScore = previousWeekActivities.length > 0
      ? previousWeekActivities.reduce((sum, activity) => sum + activity.score, 0) / previousWeekActivities.length
      : 0
    
    const improvementTrend = weeklyAvgScore - previousWeekAvgScore

    // Calculate category performance
    const categoryScores: Record<string, number[]> = {}
    recentActivity.forEach(activity => {
      const topic = allTopics[activity.topicId]
      if (topic && topic.categories) {
        topic.categories.forEach((category: string) => {
          if (!categoryScores[category]) categoryScores[category] = []
          categoryScores[category].push(activity.score)
        })
      }
    })

    // Find best and struggling categories
    let bestCategory = ''
    let strugglingCategory = ''
    let bestScore = 0
    let worstScore = 100

    Object.entries(categoryScores).forEach(([category, scores]) => {
      if (scores.length >= 2) { // Only consider categories with at least 2 attempts
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        if (avgScore > bestScore) {
          bestScore = avgScore
          bestCategory = category
        }
        if (avgScore < worstScore) {
          worstScore = avgScore
          strugglingCategory = category
        }
      }
    })

    // Calculate active days
    const uniqueDays = new Set(
      weeklyActivities.map(activity => 
        new Date(activity.completedAt).toDateString()
      )
    )

    return {
      weeklyProgress: {
        quizzesCompleted: weeklyQuizzes,
        avgScore: weeklyAvgScore,
        timeSpent: weeklyTimeSpent,
        improvementTrend
      },
      currentStreak: 0, // Would need to calculate from daily data
      bestCategory: bestScore > 70 ? bestCategory : '',
      strugglingCategory: worstScore < 70 ? strugglingCategory : '',
      totalActiveDays: uniqueDays.size,
      recentAchievements: []
    }
  } catch (error) {
    console.error('Error generating learning stats:', error)
    return {
      weeklyProgress: {
        quizzesCompleted: 0,
        avgScore: 0,
        timeSpent: 0,
        improvementTrend: 0
      },
      currentStreak: 0,
      bestCategory: '',
      strugglingCategory: '',
      totalActiveDays: 0,
      recentAchievements: []
    }
  }
}

async function generateActivityInsights(
  userId: string,
  recentActivity: any[],
  stats: LearningStats,
  allTopics: Record<string, any>
): Promise<ActivityInsight[]> {
  const insights: ActivityInsight[] = []

  // Insight 1: Improvement trend
  if (stats.weeklyProgress.improvementTrend > 5) {
    insights.push({
      type: 'improvement',
      title: 'You\'re on a roll! 🚀',
      description: `Your scores improved by ${Math.round(stats.weeklyProgress.improvementTrend)}% this week`,
      icon: 'trending-up',
      priority: 'high',
      action: {
        label: 'Keep going',
        href: '/'
      }
    })
  }

  // Insight 2: Streak potential
  if (stats.totalActiveDays >= 3) {
    insights.push({
      type: 'streak',
      title: 'Building consistency',
      description: `You've been active ${stats.totalActiveDays} days this week. Can you make it daily?`,
      icon: 'flame',
      priority: 'medium',
      action: {
        label: 'Continue streak',
        href: '/'
      }
    })
  }

  // Insight 3: Category mastery
  if (stats.bestCategory) {
    insights.push({
      type: 'category_mastery',
      title: `${stats.bestCategory} expert`,
      description: `You're excelling in ${stats.bestCategory}. Ready for advanced topics?`,
      icon: 'award',
      priority: 'medium',
      action: {
        label: 'Explore advanced',
        href: '/'
      }
    })
  }

  // Insight 4: Learning opportunity
  if (stats.strugglingCategory) {
    insights.push({
      type: 'learning_pattern',
      title: 'Growth opportunity',
      description: `Focus on ${stats.strugglingCategory} to round out your knowledge`,
      icon: 'target',
      priority: 'high',
      action: {
        label: 'Practice now',
        href: '/'
      }
    })
  }

  // Insight 5: Time-based
  if (stats.weeklyProgress.timeSpent > 0) {
    const avgTimePerQuiz = stats.weeklyProgress.timeSpent / Math.max(stats.weeklyProgress.quizzesCompleted, 1)
    if (avgTimePerQuiz < 300) { // Less than 5 minutes per quiz
      insights.push({
        type: 'learning_pattern',
        title: 'Speed learner',
        description: 'You complete quizzes quickly. Try slowing down to deepen understanding',
        icon: 'clock',
        priority: 'low'
      })
    }
  }

  return insights.slice(0, 5) // Return top 5 insights
} 