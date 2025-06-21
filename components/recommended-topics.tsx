"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles, Star, TrendingUp, BookOpen, Zap, Target, HelpCircle, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { dataService } from "@/lib/data-service"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

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
  const [scrollPosition, setScrollPosition] = useState(0)

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

        // If we have less than 4 recommendations, fall back to topics they've already played but haven't completed
        let finalRecs = [...recs]
        if (finalRecs.length < 4) {
          const completedTopics = await enhancedQuizDatabase.getCompletedTopics(userId)
          const completedSet = new Set(completedTopics)
          
          // Get topics they've played but not completed
          const playedTopics = await enhancedQuizDatabase.getPlayedTopics(userId)
          const incompleteTopics = playedTopics.filter((topic: { id: string }) => !completedSet.has(topic.id))
          
          // Add incomplete topics until we have at least 4
          for (const topic of incompleteTopics) {
            if (finalRecs.length >= 4) break
            
            if (!finalRecs.some(rec => rec.id === topic.id)) {
              finalRecs.push({
                id: topic.id,
                title: topic.title || '',
                description: topic.description || 'Continue your learning journey',
                category: topic.category || 'General',
                emoji: topic.emoji || '📚',
                reason: 'Continue where you left off',
                confidence: 0.9,
                estimatedMinutes: 6, // Default value since we can't calculate it without full topic data
                difficulty: 'intermediate' as const, // Default to intermediate
                trending: false,
                matchScore: 0.9
              })
            }
          }
          
          // If we still need more, add topics from categories they've shown interest in
          if (finalRecs.length < 4) {
            const topCategories = Object.entries(userActivity.categoryFrequency)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([category]) => category)
            
            const allTopicsArray = Object.values(allTopics)
            
            for (const category of topCategories) {
              if (finalRecs.length >= 4) break
              
              const categoryTopics = allTopicsArray
                .filter(topic => 
                  topic.categories?.includes(category) &&
                  !completedSet.has(topic.topic_id) &&
                  !finalRecs.some(rec => rec.id === topic.topic_id)
                )
              
              for (const topic of categoryTopics) {
                if (finalRecs.length >= 4) break
                
                finalRecs.push({
                  id: topic.topic_id,
                  title: topic.topic_title,
                  description: topic.description || topic.why_this_matters || `Learn more about ${category}`,
                  category: category,
                  emoji: topic.emoji || '📚',
                  reason: `Based on your interest in ${category}`,
                  confidence: 0.7,
                  estimatedMinutes: calculateEstimatedTime(topic),
                  difficulty: 'intermediate',
                  trending: false,
                  matchScore: 0.7
                })
              }
            }
          }
        }

        setRecommendations(finalRecs)
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

  const scrollLeft = () => {
    const container = document.getElementById('recommendations-container')
    if (container) {
      const newPosition = Math.max(0, scrollPosition - 1)
      container.scrollTo({ left: newPosition * 280, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  const scrollRight = () => {
    const container = document.getElementById('recommendations-container')
    if (container) {
      const maxScroll = Math.max(0, recommendations.length - 4)
      const newPosition = Math.min(maxScroll, scrollPosition + 1)
      container.scrollTo({ left: newPosition * 280, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

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
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-64 h-24 bg-slate-50 dark:bg-slate-900 rounded-xl flex-shrink-0 animate-pulse"></div>
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
          <div className="text-4xl mb-4">��</div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Recommended for you
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollLeft}
              disabled={scrollPosition === 0}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollRight}
              disabled={scrollPosition >= recommendations.length - 4}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div 
          id="recommendations-container"
          className="grid grid-cols-4 gap-4"
        >
          {recommendations.map((rec) => (
            <Link key={rec.id} href={`/quiz/${rec.id}`} className="group block h-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="h-full border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/20 hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-950 dark:to-slate-900/50">
                    <CardContent className="p-4 h-full flex flex-col">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/80 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                          {rec.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {rec.trending && (
                              <Badge className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 text-[10px] font-space-mono border-0 px-2 py-0.5">
                                <TrendingUp className="w-2.5 h-2.5 mr-1" />
                                trending
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-light">
                              {rec.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-[300px] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/5 dark:shadow-black/20"
                >
                  <div className="space-y-1.5">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {rec.title}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                      {rec.description}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
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