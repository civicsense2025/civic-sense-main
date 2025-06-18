"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Play, BookOpen, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { supabase } from "@/lib/supabase"

interface InProgressItem {
  type: 'quiz' | 'learning_path' | 'skill'
  id: string
  title: string
  description?: string
  progress: number
  timeSpent?: number
  lastAccessed: string
  category?: string
  estimatedTimeRemaining?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

interface ContinueLearningProps {
  userId: string
  className?: string
}

export function ContinueLearning({ userId, className }: ContinueLearningProps) {
  const router = useRouter()
  const [inProgressItems, setInProgressItems] = useState<InProgressItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInProgressItems = async () => {
      try {
        setIsLoading(true)
        
        // Get partial quiz attempts by checking incomplete attempts
        const { data: partialAttempts, error } = await supabase
          .from('user_quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .order('updated_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Error fetching partial attempts:', error)
          return
        }

        const allTopics = await dataService.getAllTopics()
        
        const quizItems: InProgressItem[] = (partialAttempts || []).map((attempt: any) => {
          const topic = allTopics[attempt.topic_id]
          return {
            type: 'quiz' as const,
            id: attempt.topic_id,
            title: topic?.topic_title || 'Unknown Topic',
            description: topic?.description ? (topic.description.substring(0, 120) + '...') : '',
            progress: Math.round(((attempt.correct_answers || 0) / (attempt.total_questions || 10)) * 100),
            timeSpent: attempt.time_spent_seconds,
            lastAccessed: attempt.updated_at || attempt.created_at,
            category: topic?.categories?.[0] || 'General',
            estimatedTimeRemaining: Math.max(1, Math.round(((attempt.total_questions || 10) - (attempt.correct_answers || 0)) * 1.5)), // 1.5 min per question
            difficulty: 'intermediate' // Default since we don't have difficulty in topics
          }
        })

        // Sort by most recently accessed
        const sortedItems = quizItems.sort((a, b) => 
          new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        ).slice(0, 3) // Show max 3 items

        setInProgressItems(sortedItems)
      } catch (error) {
        console.error('Error loading in-progress items:', error)
        setInProgressItems([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadInProgressItems()
    }
  }, [userId])

  const handleContinue = (item: InProgressItem) => {
    if (item.type === 'quiz') {
      router.push(`/quiz/${item.id}`)
    }
    // Add handling for other types when implemented
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
      case 'intermediate': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
      case 'advanced': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20'
    }
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
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (inProgressItems.length === 0) {
    return null // Don't show the section if no in-progress items
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
          <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-light text-slate-900 dark:text-white">
          Continue where you left off
        </h2>
      </div>
      
      <div className="space-y-4">
        {inProgressItems.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white text-lg leading-tight">
                          {item.title}
                        </h3>
                        <Badge className={`${getDifficultyColor(item.difficulty || 'beginner')} text-xs font-light border-0`}>
                          {item.difficulty}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-light leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <span className="font-light">{item.progress}% complete</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span className="font-light">{formatTimeAgo(item.lastAccessed)}</span>
                      </div>
                      {item.estimatedTimeRemaining && (
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          <span className="font-light">~{item.estimatedTimeRemaining}m left</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleContinue(item)}
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-full px-4 py-2 font-light"
                    >
                      Continue
                    </Button>
                  </div>
                  
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="bg-slate-900 dark:bg-white h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 