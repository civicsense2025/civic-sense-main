"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Clock, Play, BookOpen, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { dataService } from "@civicsense/shared/lib/data-service"
import { enhancedQuizDatabase } from "@civicsense/shared/lib/quiz-database"
import { supabase } from "@civicsense/shared/lib/supabase/client"

interface InProgressItem {
  type: 'quiz' | 'learning_path' | 'skill'
  id: string
  attemptId?: string
  sessionId?: string
  title: string
  description?: string
  progress: number
  timeSpent?: number
  lastAccessed: string
  category?: string
  estimatedTimeRemaining?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  currentQuestionNumber?: number
  totalQuestions?: number
  source: 'progress_sessions' | 'user_quiz_attempts' // Track data source
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
        
        // First, get active progress sessions (primary source)
        const { data: progressSessions, error: progressError } = await supabase
          .from('progress_sessions')
          .select('*')
          .eq('user_id', userId)
          .in('session_type', ['regular_quiz', 'civics_test', 'onboarding_assessment'])
          .gt('expires_at', new Date().toISOString())
          .order('last_updated_at', { ascending: false })
          .limit(10)

        if (progressError) {
          console.error('Error fetching progress sessions:', progressError)
        }

        // Second, get incomplete quiz attempts (fallback/backwards compatibility)
        const { data: incompleteAttempts, error: attemptsError } = await supabase
          .from('user_quiz_attempts')
          .select('id, topic_id, correct_answers, total_questions, time_spent_seconds, created_at, session_id, response_data')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .order('created_at', { ascending: false })
          .limit(10)

        if (attemptsError) {
          console.error('Error fetching incomplete attempts:', attemptsError)
        }

        const allTopics = await dataService.getAllTopics()
        
        // Process progress sessions (primary source)
        const progressItems: InProgressItem[] = (progressSessions || []).map((session: any) => {
          const topic = allTopics[session.topic_id]
          const currentQuestionNumber = (session.current_question_index || 0) + 1
          const totalQuestions = session.questions?.length || 10
          const answeredCount = Object.keys(session.answers || {}).length
          
          // Calculate total time spent from response times
          let timeSpent: number | undefined = undefined
          if (session.response_times && typeof session.response_times === 'object') {
            const times = Object.values(session.response_times as Record<string, number>)
            timeSpent = times.length > 0 ? times.reduce((a, b) => a + b, 0) : undefined
          }
          
          return {
            type: 'quiz' as const,
            id: session.topic_id || `session-${session.session_id}`,
            sessionId: session.session_id,
            title: topic?.topic_title || `${session.session_type.replace('_', ' ')} Session`,
            description: topic?.description ? (topic.description.substring(0, 120) + '...') : 
                        `Continue your ${session.session_type.replace('_', ' ')} session`,
            progress: Math.round((currentQuestionNumber / totalQuestions) * 100),
            timeSpent,
            lastAccessed: session.last_updated_at || session.started_at,
            category: topic?.categories?.[0] || session.session_type.replace('_', ' '),
            estimatedTimeRemaining: Math.max(1, Math.round((totalQuestions - currentQuestionNumber) * 1.5)),
            difficulty: 'intermediate',
            currentQuestionNumber,
            totalQuestions,
            source: 'progress_sessions'
          }
        })

        // Process incomplete attempts (fallback/backwards compatibility)
        // Filter out any that already exist in progress sessions
        const existingTopicIds = new Set(progressItems.map(item => item.id))
        
        const attemptItems: InProgressItem[] = (incompleteAttempts || [])
          .filter((attempt: any) => !existingTopicIds.has(attempt.topic_id))
          .map((attempt: any) => {
            const topic = allTopics[attempt.topic_id]
            
            // Try to extract current question from response_data if available
            let currentQuestionNumber = 1
            let totalQuestions = attempt.total_questions || 10
            
            if (attempt.response_data && typeof attempt.response_data === 'object') {
              const responseData = attempt.response_data as any
              if (responseData.currentQuestionIndex !== undefined) {
                currentQuestionNumber = responseData.currentQuestionIndex + 1
              } else if (responseData.answers && Object.keys(responseData.answers).length > 0) {
                currentQuestionNumber = Object.keys(responseData.answers).length + 1
              }
              if (responseData.questions && Array.isArray(responseData.questions)) {
                totalQuestions = responseData.questions.length
              }
            } else if (attempt.correct_answers !== null) {
              // Fallback: use correct_answers as indicator of progress
              currentQuestionNumber = (attempt.correct_answers || 0) + 1
            }
            
            return {
              type: 'quiz' as const,
              id: attempt.topic_id,
              attemptId: attempt.id,
              sessionId: attempt.session_id,
              title: topic?.topic_title || 'Unknown Topic',
              description: topic?.description ? (topic.description.substring(0, 120) + '...') : '',
              progress: Math.round((currentQuestionNumber / totalQuestions) * 100),
              timeSpent: attempt.time_spent_seconds,
              lastAccessed: attempt.created_at,
              category: topic?.categories?.[0] || 'General',
              estimatedTimeRemaining: Math.max(1, Math.round((totalQuestions - currentQuestionNumber) * 1.5)),
              difficulty: 'intermediate',
              currentQuestionNumber,
              totalQuestions,
              source: 'user_quiz_attempts'
            }
          })

        // Combine and deduplicate by topic ID (progress sessions take priority)
        const allItems = [...progressItems, ...attemptItems]
        const deduplicatedItems = allItems.reduce((acc: InProgressItem[], item: InProgressItem) => {
          const existingIndex = acc.findIndex(a => a.id === item.id)
          if (existingIndex >= 0) {
            // Keep the item from progress_sessions if available, otherwise keep the more recent one
            if (item.source === 'progress_sessions' || 
                (acc[existingIndex].source !== 'progress_sessions' && 
                 new Date(item.lastAccessed) > new Date(acc[existingIndex].lastAccessed))) {
              acc[existingIndex] = item
            }
          } else {
            acc.push(item)
          }
          return acc
        }, [])

        // Sort by most recently accessed and limit to top 3
        const sortedItems = deduplicatedItems
          .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
          .slice(0, 3)

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
      // Build URL with appropriate parameters based on data source
      const params = new URLSearchParams({
        continue: 'true',
        restore: 'progress'
      })
      
      if (item.source === 'progress_sessions' && item.sessionId) {
        params.set('sessionId', item.sessionId)
        params.set('source', 'progress_sessions')
      } else if (item.source === 'user_quiz_attempts' && item.attemptId) {
        params.set('attemptId', item.attemptId)
        params.set('source', 'user_quiz_attempts')
      }
      
      router.push(`/quiz/${item.id}?${params.toString()}`)
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
          <Card key={`${item.type}-${item.id}-${item.source}`} className="border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-sm">
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
                        {item.source === 'progress_sessions' && (
                          <Badge className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-light border-0">
                            Active Session
                          </Badge>
                        )}
                      </div>
                      
                      {/* Progress Bar - More prominent positioning */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span className="font-medium">{item.progress}% complete</span>
                          {item.currentQuestionNumber && item.totalQuestions && (
                            <span>Question {item.currentQuestionNumber} of {item.totalQuestions}</span>
                          )}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 shadow-inner overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                            style={{ width: `${Math.max(item.progress, 8)}%` }}
                          />
                        </div>
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
                      {item.currentQuestionNumber ? `Continue from Question ${item.currentQuestionNumber}` : 'Continue'}
                    </Button>
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