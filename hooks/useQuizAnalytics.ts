'use client'

import { useAnalytics, mapCategoryToAnalytics } from '@/utils/analytics'
import { useAuth } from '@/components/auth/auth-provider'
import { useCallback, useRef } from 'react'

// Safe hook to use Statsig with fallback
function useSafeStatsig() {
  try {
    const { useStatsig } = require('@/components/providers/statsig-provider')
    return useStatsig()
  } catch (error) {
    return {
      checkGate: () => false,
      isReady: true,
      hasError: false
    }
  }
}

export function useQuizAnalytics() {
  const { trackQuiz, trackGameification, trackEngagement } = useAnalytics()
  const { user } = useAuth()
  const { checkGate } = useSafeStatsig()
  const sessionRef = useRef<string | null>(null)

  // Generate a unique session ID for this quiz session
  const getQuizSessionId = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    return sessionRef.current
  }, [])

  // Track quiz start with proper data mapping
  const trackQuizStart = useCallback((data: {
    quizId: string
    category: string
    difficulty?: string
    userLevel?: number
    activeBoosts?: string[]
    streakCount?: number
  }) => {
    trackQuiz.quizStarted({
      quiz_id: data.quizId,
      quiz_category: mapCategoryToAnalytics(data.category),
      quiz_difficulty: data.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
      user_level: data.userLevel,
      active_boosts: data.activeBoosts || [],
      streak_count: data.streakCount || 0
    })
    
    // Track page view for detailed analytics
    const detailedAnalyticsEnabled = checkGate('detailed_quiz_analytics')
    if (detailedAnalyticsEnabled) {
      trackEngagement.pageView(`quiz_${data.quizId}`, 'quiz_start')
    }
  }, [trackQuiz, trackEngagement, checkGate, getQuizSessionId])

  // Track question answers with proper data mapping
  const trackQuestionAnswer = useCallback((data: {
    questionId: string
    questionCategory: string
    answerCorrect: boolean
    responseTimeSeconds: number
    attemptNumber?: number
    hintUsed?: boolean
    boostActive?: string | null
    confidenceLevel?: 1 | 2 | 3 | 4 | 5
  }) => {
    trackQuiz.questionAnswered({
      question_id: data.questionId,
      question_category: data.questionCategory,
      answer_correct: data.answerCorrect,
      response_time_seconds: data.responseTimeSeconds,
      attempt_number: data.attemptNumber,
      hint_used: data.hintUsed,
      boost_active: data.boostActive,
      confidence_level: data.confidenceLevel
    })
  }, [trackQuiz])

  // Track quiz completion with proper data mapping
  const trackQuizComplete = useCallback((data: {
    quizId: string
    category: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTimeSeconds: number
    hintsUsed?: number
    boostsUsed?: string[]
    difficulty?: string
    xpEarned?: number
    streakMaintained?: boolean
    newLevelReached?: boolean
  }) => {
    trackQuiz.quizCompleted({
      quiz_id: data.quizId,
      quiz_category: mapCategoryToAnalytics(data.category),
      quiz_difficulty: data.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
      score_percentage: data.score,
      total_questions: data.totalQuestions,
      correct_answers: data.correctAnswers,
      total_time_seconds: data.totalTimeSeconds,
      user_level: user?.user_metadata?.level,
      active_boosts: data.boostsUsed || [],
      streak_count: data.streakMaintained ? 1 : 0,
      xp_earned: data.xpEarned,
      streak_maintained: data.streakMaintained,
      new_level_reached: data.newLevelReached,
      boosts_used: data.boostsUsed
    })

    // Track achievements
    if (data.newLevelReached) {
      trackGameification.levelUp({
        new_level: (user?.user_metadata?.level || 1) + 1,
        xp_total: data.xpEarned || 0,
        primary_activity: 'quiz'
      })
    }

    if (data.streakMaintained) {
      trackGameification.streakMaintained({
        streak_count: 1,
        activity_type: 'quiz',
        time_since_last_activity_hours: 0
      })
    }

    // Reset session after completion
    sessionRef.current = null
  }, [trackQuiz, trackGameification, user?.user_metadata?.level])

  // Track quiz abandonment
  const trackQuizAbandonment = useCallback((data: {
    quizId: string
    questionsAnswered: number
    totalQuestions: number
    timeSpentSeconds: number
    reason?: 'timeout' | 'user_exit' | 'technical_issue'
  }) => {
    const abandonmentPoint = 
      data.questionsAnswered === 0 ? 'start' :
      data.questionsAnswered < data.totalQuestions * 0.5 ? 'early' :
      data.questionsAnswered < data.totalQuestions * 0.8 ? 'middle' : 'near_end'

    trackQuiz.quizAbandoned({
      quiz_id: data.quizId,
      questions_answered: data.questionsAnswered,
      total_questions: data.totalQuestions,
      abandonment_point: abandonmentPoint as 'start' | 'middle' | 'near_end',
      time_spent_seconds: data.timeSpentSeconds,
      reason: data.reason
    })

    // Reset session after abandonment
    sessionRef.current = null
  }, [trackQuiz])

  // Track boost usage
  const trackBoostUsage = useCallback((data: {
    boostType: string
    activationContext: 'pre_quiz' | 'mid_quiz' | 'specific_question'
    effectiveness?: boolean
    remainingUses?: number
  }) => {
    trackGameification.boostActivated({
      boost_type: data.boostType,
      activation_context: data.activationContext,
      user_level: user?.user_metadata?.level || 1,
      remaining_uses: data.remainingUses
    })

    // Track boost effectiveness if provided
    if (data.effectiveness !== undefined) {
      trackGameification.boostEffectMeasured({
        boost_type: data.boostType,
        performance_improvement: data.effectiveness ? 1 : 0,
        questions_affected: 1
      })
    }
  }, [trackGameification, user?.user_metadata?.level])

  // Track hint usage
  const trackHintUsage = useCallback((data: {
    questionId: string
    hintType: 'auto' | 'manual' | 'smart'
    effectiveness: boolean
  }) => {
    trackQuiz.hintUsed(data.questionId, data.hintType, data.effectiveness)
  }, [trackQuiz])

  return {
    trackQuizStart,
    trackQuestionAnswer,
    trackQuizComplete,
    trackQuizAbandonment,
    trackBoostUsage,
    trackHintUsage,
    getQuizSessionId
  }
} 