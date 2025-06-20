"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles, Star, TrendingUp, BookOpen, Zap, Target, HelpCircle, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { dataService } from "@/lib/data-service"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { supabase } from "@/lib/supabase"

interface RecommendedTopic {
  id: string
  title: string
  description: string
  category: string
  emoji: string
  reason: string
  confidence: number
  estimatedMinutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  trending?: boolean
  matchScore: number
}

interface RecommendedTopicsProps {
  userId: string
  className?: string
}

export function RecommendedTopics({ userId, className }: RecommendedTopicsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoading(true)
        
        // Get user's activity and preferences
        const [userActivity, allTopics, userProgress] = await Promise.all([
          getUserActivity(userId),
          dataService.getAllTopics(),
          getUserProgress(userId)
        ])

        // Generate personalized recommendations
        const recs = await generateRecommendations(
          userId,
          userActivity,
          allTopics,
          userProgress
        )

        setRecommendations(recs.slice(0, 4)) // Show top 4 recommendations
      } catch (error) {
        console.error('Error loading recommendations:', error)
        setRecommendations([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadRecommendations()
    }
  }, [userId])



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
      case 'intermediate': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
      case 'advanced': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.7) return 'text-blue-600 dark:text-blue-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
          </div>
          <div className="w-48 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Recommended for you
          </h2>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🌟</div>
          <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
            Building your recommendations
          </h3>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Complete a few more quizzes and we'll suggest topics tailored to your interests
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Recommended for you
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <Link key={rec.id} href={`/quiz/${rec.id}`} className="group block">
              <Card className="border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/20 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-950 dark:to-slate-900/50 overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Header with emoji and action indicator */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/80 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                          {rec.emoji}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <Badge className={`${getDifficultyColor(rec.difficulty)} text-xs font-space-mono border-0 px-3 py-1`}>
                              {rec.difficulty}
                            </Badge>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-light">
                              {rec.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {rec.trending && (
                          <Badge className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 text-xs font-space-mono border-0 px-3 py-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            trending
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={(e) => e.preventDefault()} // Prevent link navigation
                              >
                                <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="max-w-sm p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/25"
                            >
                              <div className="space-y-3">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  Why this topic?
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-light leading-relaxed">
                                  {rec.reason}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                    {rec.category}
                                  </span>
                                  <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                                    {Math.round(rec.confidence * 100)}% match
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-950/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300">
                            <ArrowUpRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom section with subtle call-to-action */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
                          Ready to start learning?
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform duration-200">
                          Start now →
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Helper functions
async function getUserActivity(userId: string) {
  try {
    const recentActivity = await enhancedQuizDatabase.getRecentActivity(userId, 20)
    
    // Analyze patterns in user activity
    const categoryFrequency: Record<string, number> = {}
    const difficultyPreference: Record<string, number> = {}
    const timePatterns: Record<string, number> = {}
    
    recentActivity.forEach((activity: any) => {
      // Track category preferences
      if (activity.category) {
        categoryFrequency[activity.category] = (categoryFrequency[activity.category] || 0) + 1
      }
      
      // Track time patterns
      const hour = new Date(activity.completedAt).getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
      timePatterns[timeOfDay] = (timePatterns[timeOfDay] || 0) + 1
    })
    
    return {
      recentActivity,
      categoryFrequency,
      difficultyPreference,
      timePatterns,
      totalActivities: recentActivity.length
    }
  } catch (error) {
    console.error('Error getting user activity:', error)
    return {
      recentActivity: [],
      categoryFrequency: {},
      difficultyPreference: {},
      timePatterns: {},
      totalActivities: 0
    }
  }
}

async function getUserProgress(userId: string) {
  try {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return progress || {
      current_level: 1,
      total_xp: 0,
      accuracy_percentage: 0,
      current_streak: 0
    }
  } catch (error) {
    console.error('Error getting user progress:', error)
    return {
      current_level: 1,
      total_xp: 0,
      accuracy_percentage: 0,
      current_streak: 0
    }
  }
}

async function generateRecommendations(
  userId: string,
  userActivity: any,
  allTopics: Record<string, any>,
  userProgress: any
): Promise<RecommendedTopic[]> {
  try {
    // Get completed topics to avoid recommending duplicates
    const completedTopics = await enhancedQuizDatabase.getCompletedTopics(userId)
    const completedSet = new Set(completedTopics)
    
    const recommendations: RecommendedTopic[] = []
    
    // Convert topics object to array
    const topicsArray = Object.values(allTopics).filter(topic => 
      !completedSet.has(topic.topic_id)
    )
    
    // Strategy 1: Category-based recommendations (based on user preferences)
    const topCategoriesArray = Object.entries(userActivity.categoryFrequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category]) => category)
    
    for (const category of topCategoriesArray) {
      const categoryTopics = topicsArray.filter(topic => 
        topic.categories?.includes(category)
      ).slice(0, 2)
      
      for (const topic of categoryTopics) {
                 recommendations.push({
           id: topic.topic_id,
           title: topic.topic_title,
           description: topic.description || topic.why_this_matters || 'Expand your knowledge in this important area',
           category: category,
           emoji: topic.emoji || '📚',
           reason: `Based on your interest in ${category}`,
           confidence: 0.8,
           estimatedMinutes: calculateEstimatedTime(topic),
           difficulty: 'intermediate',
           trending: false,
           matchScore: 0.8
         })
      }
    }
    
    // Strategy 2: Trending topics (recent, popular topics)
    const trendingTopics = topicsArray
      .filter(topic => {
        const topicDate = new Date(topic.date)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - topicDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7 // Topics from last week
      })
      .slice(0, 2)
    
    for (const topic of trendingTopics) {
      recommendations.push({
        id: topic.topic_id,
        title: topic.topic_title,
        description: topic.description || topic.why_this_matters || 'Stay up to date with current civic topics',
        category: topic.categories?.[0] || 'Current Events',
        emoji: topic.emoji || '📰',
        reason: 'Trending this week',
        confidence: 0.7,
        estimatedMinutes: calculateEstimatedTime(topic),
        difficulty: 'intermediate',
        trending: true,
        matchScore: 0.7
      })
    }
    
    // Strategy 3: Level-appropriate recommendations
    const levelBasedTopics = topicsArray
      .filter(() => Math.random() > 0.7) // Random sampling for diversity
      .slice(0, 2)
    
    for (const topic of levelBasedTopics) {
      const difficulty = userProgress.current_level <= 2 ? 'beginner' : 
                        userProgress.current_level <= 5 ? 'intermediate' : 'advanced'
      
      recommendations.push({
        id: topic.topic_id,
        title: topic.topic_title,
        description: topic.description || topic.why_this_matters || 'Perfect for your current learning level',
        category: topic.categories?.[0] || 'General',
        emoji: topic.emoji || '🎯',
        reason: `Matches your level ${userProgress.current_level}`,
        confidence: 0.6,
        estimatedMinutes: calculateEstimatedTime(topic),
        difficulty: difficulty,
        trending: false,
        matchScore: 0.6
      })
    }
    
    // Remove duplicates and sort by match score
    const uniqueRecs = recommendations
      .filter((rec, index, self) => 
        index === self.findIndex(r => r.id === rec.id)
      )
      .sort((a, b) => b.matchScore - a.matchScore)
    
    return uniqueRecs
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

// Helper function to calculate estimated time based on topic data
function calculateEstimatedTime(topic: any): number {
  // Base time per topic
  let baseTime = 6
  
  // Adjust based on topic complexity (if we have indicators)
  if (topic.categories?.includes('Constitutional Law') || 
      topic.categories?.includes('Foreign Policy') ||
      topic.categories?.includes('AI Governance')) {
    baseTime += 2 // More complex topics
  }
  
  if (topic.categories?.includes('Elections') || 
      topic.categories?.includes('Civic Action')) {
    baseTime += 1 // Slightly more complex
  }
  
  // Random variation to make it feel more realistic
  const variation = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
  return Math.max(4, baseTime + variation) // Minimum 4 minutes
}