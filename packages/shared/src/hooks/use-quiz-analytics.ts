import { useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from './useGuestAccess'
import { createClient } from '../lib/supabase/client'

interface AnalyticsEvent {
  eventType: 'quiz_started' | 'question_viewed' | 'question_answered' | 'quiz_completed' | 'quiz_abandoned' | 'mode_changed' | 'hint_requested' | 'explanation_viewed' | 'social_interaction' | 'achievement_earned' | 'power_up_used' | 'navigation_event' | 'error_occurred' | 'performance_metric'
  eventCategory: 'engagement' | 'learning' | 'social' | 'performance' | 'error' | 'achievement'
  eventData?: Record<string, any>
  performanceData?: Record<string, any>
  responseTimeMs?: number
  timeSinceQuestionStartMs?: number
  timeSinceQuizStartMs?: number
  platform?: 'web' | 'mobile'
  deviceType?: string
  userAgent?: string
  referrerUrl?: string
  pageUrl?: string
  roomCode?: string
  teamId?: string
  socialInteractionType?: string
}

interface QuizSession {
  sessionId: string
  topicId: string
  quizAttemptId?: string
  gameMode: string
  startTime: number
  questionStartTimes: Record<string, number>
}

export function useQuizAnalytics() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const supabase = createClient()
  const sessionRef = useRef<QuizSession | null>(null)

  const initializeSession = useCallback((topicId: string, quizAttemptId?: string, gameMode: string = 'standard') => {
    const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    sessionRef.current = {
      sessionId,
      topicId,
      quizAttemptId,
      gameMode,
      startTime,
      questionStartTimes: {}
    }
    
    return sessionId
  }, [])

  const trackEvent = useCallback(async (event: AnalyticsEvent & { 
    topicId?: string
    questionId?: string
    quizAttemptId?: string
    gameMode?: string
  }) => {
    const session = sessionRef.current
    if (!session && !event.topicId) {
      console.warn('No active session and no topicId provided for analytics event')
      return
    }

    try {
      const guestToken = user ? undefined : getOrCreateGuestToken()
      
      const eventPayload = {
        p_event_type: event.eventType,
        p_event_category: event.eventCategory,
        p_user_id: user?.id || null,
        p_guest_token: guestToken || null,
        p_session_id: session?.sessionId || `standalone_${Date.now()}`,
        p_topic_id: event.topicId || session?.topicId || null,
        p_quiz_attempt_id: event.quizAttemptId || session?.quizAttemptId || null,
        p_question_id: event.questionId || null,
        p_game_mode: event.gameMode || session?.gameMode || 'standard',
        p_event_data: event.eventData || {},
        p_performance_data: event.performanceData || {},
        p_response_time_ms: event.responseTimeMs || null,
        p_time_since_question_start_ms: event.timeSinceQuestionStartMs || null,
        p_time_since_quiz_start_ms: event.timeSinceQuizStartMs || null,
        p_platform: event.platform || 'web',
        p_device_type: event.deviceType || navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        p_user_agent: event.userAgent || navigator.userAgent,
        p_referrer_url: event.referrerUrl || document.referrer,
        p_page_url: event.pageUrl || window.location.href,
        p_room_code: event.roomCode || null,
        p_team_id: event.teamId || null,
        p_social_interaction_type: event.socialInteractionType || null
      }

      const { error } = await supabase.rpc('log_quiz_event' as any, eventPayload)
      
      if (error) {
        console.error('Failed to track analytics event:', error)
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error)
    }
  }, [user, getOrCreateGuestToken, supabase])

  // Convenience methods for common events
  const trackQuizStart = useCallback((topicId: string, quizAttemptId: string, gameMode: string = 'standard') => {
    const sessionId = initializeSession(topicId, quizAttemptId, gameMode)
    
    trackEvent({
      eventType: 'quiz_started',
      eventCategory: 'engagement',
      eventData: {
        quiz_mode: gameMode,
        session_start: new Date().toISOString()
      }
    })
    
    return sessionId
  }, [initializeSession, trackEvent])

  const trackQuestionViewed = useCallback((questionId: string, questionIndex: number) => {
    const session = sessionRef.current
    if (!session) return
    
    const now = Date.now()
    session.questionStartTimes[questionId] = now
    
    trackEvent({
      eventType: 'question_viewed',
      eventCategory: 'engagement',
      questionId,
      eventData: {
        question_index: questionIndex,
        time_since_start: now - session.startTime
      },
      timeSinceQuizStartMs: now - session.startTime
    })
  }, [trackEvent])

  const trackQuestionAnswered = useCallback((
    questionId: string, 
    answer: string, 
    isCorrect: boolean, 
    timeSpent: number,
    questionIndex: number,
    additionalData?: Record<string, any>
  ) => {
    const session = sessionRef.current
    if (!session) return
    
    const now = Date.now()
    const questionStartTime = session.questionStartTimes[questionId] || now
    const timeSinceQuestionStart = now - questionStartTime
    
    trackEvent({
      eventType: 'question_answered',
      eventCategory: 'learning',
      questionId,
      eventData: {
        answer,
        is_correct: isCorrect,
        question_index: questionIndex,
        time_spent_seconds: timeSpent / 1000,
        misconception_addressed: additionalData?.misconceptionAddressed || false,
        uncomfortable_truth_revealed: additionalData?.uncomfortableTruthRevealed || false,
        action_steps_shown: additionalData?.actionStepsShown || false,
        ...additionalData
      },
      responseTimeMs: timeSpent,
      timeSinceQuestionStartMs: timeSinceQuestionStart,
      timeSinceQuizStartMs: now - session.startTime
    })
  }, [trackEvent])

  const trackQuizCompleted = useCallback((results: {
    score: number
    totalQuestions: number
    correctAnswers: number
    timeTaken: number
    timeSpentSeconds: number
  }) => {
    const session = sessionRef.current
    if (!session) return
    
    const now = Date.now()
    
    trackEvent({
      eventType: 'quiz_completed',
      eventCategory: 'achievement',
      eventData: {
        score: results.score,
        total_questions: results.totalQuestions,
        correct_answers: results.correctAnswers,
        completion_time_seconds: results.timeSpentSeconds,
        quiz_duration: now - session.startTime
      },
      timeSinceQuizStartMs: now - session.startTime,
      performanceData: {
        accuracy_rate: results.correctAnswers / results.totalQuestions,
        average_response_time: results.timeTaken / results.totalQuestions,
        completion_rate: 100 // Completed quiz
      }
    })
  }, [trackEvent])

  const trackModeChange = useCallback((fromMode: string, toMode: string) => {
    trackEvent({
      eventType: 'mode_changed',
      eventCategory: 'engagement',
      eventData: {
        from_mode: fromMode,
        to_mode: toMode,
        timestamp: new Date().toISOString()
      }
    })
  }, [trackEvent])

  const trackSocialInteraction = useCallback((
    interactionType: 'share' | 'chat' | 'reaction' | 'vote',
    platform?: string,
    additionalData?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'social_interaction',
      eventCategory: 'social',
      socialInteractionType: interactionType,
      eventData: {
        interaction_type: interactionType,
        platform,
        ...additionalData
      }
    })
  }, [trackEvent])

  const trackError = useCallback((error: Error, context: string) => {
    trackEvent({
      eventType: 'error_occurred',
      eventCategory: 'error',
      eventData: {
        error_message: error.message,
        error_stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      }
    })
  }, [trackEvent])

  const updateResponseTimeMetrics = useCallback(async (
    quizAttemptId: string,
    questionResponseTimes: Array<{ questionId: string; timeSpent: number }>
  ) => {
    try {
      const { error } = await supabase.rpc('update_response_time_metrics' as any, {
        p_quiz_attempt_id: quizAttemptId,
        p_question_response_times: questionResponseTimes
      })
      
      if (error) {
        console.error('Failed to update response time metrics:', error)
      }
    } catch (error) {
      console.error('Error updating response time metrics:', error)
    }
  }, [supabase])

  const endSession = useCallback(() => {
    sessionRef.current = null
  }, [])

  return {
    // Session management
    initializeSession,
    endSession,
    currentSession: sessionRef.current,
    
    // Event tracking
    trackEvent,
    trackQuizStart,
    trackQuestionViewed,
    trackQuestionAnswered,
    trackQuizCompleted,
    trackModeChange,
    trackSocialInteraction,
    trackError,
    
    // Performance tracking
    updateResponseTimeMetrics
  }
} 