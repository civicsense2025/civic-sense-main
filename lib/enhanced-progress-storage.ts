/**
 * Enhanced Progress Storage System
 * 
 * Provides reliable database-backed progress storage with localStorage fallback.
 * Supports incremental saving of quiz/assessment progress and question-level tracking.
 * 
 * Features:
 * - Database-backed storage for reliability
 * - Incremental progress saving
 * - Question-level answer tracking
 * - Support for both authenticated and guest users
 * - localStorage fallback for offline scenarios
 * - Session expiration and cleanup
 * - Cross-device synchronization
 */

import { supabase } from '@/lib/supabase/client'
import { debug } from '@/lib/debug-config'

// Complex answer data for interactive questions
export type InteractiveAnswerData = 
  | string // Simple answer (backward compatibility)
  | {
      type: 'matching_interactive'
      matches: Array<{ leftId: string; rightId: string }>
      feedback?: Record<string, 'correct' | 'incorrect'>
      isSubmitted?: boolean
    }
  | {
      type: 'timeline'
      eventOrder: string[] // Array of event IDs in user's order
      feedback?: Record<string, 'correct' | 'incorrect'>
      isSubmitted?: boolean
    }
  | {
      type: 'fill_in_blanks_enhanced'
      blankAnswers: Array<{ blankId: string; value: string; options?: string[] }>
      progress?: number
      isSubmitted?: boolean
    }
  | {
      type: 'scenario_simulation'
      currentStage: number
      stageAnswers: Array<{ stageId: string; choiceId: string; points: number }>
      totalPoints: number
      isComplete?: boolean
    }

// Enhanced interfaces for progress storage
export interface EnhancedQuizState {
  sessionId: string
  sessionType: 'regular_quiz' | 'civics_test' | 'onboarding_assessment' | 'multiplayer_quiz' | 'survey'
  
  // Content identification
  topicId?: string
  assessmentType?: string
  testType?: 'quick' | 'full'
  
  // Progress state
  questions: any[]
  currentQuestionIndex: number
  answers: { [questionId: string]: string }
  
  // Enhanced interactive question state
  interactiveAnswers?: { [questionId: string]: InteractiveAnswerData }
  
  // Performance tracking
  streak: number
  maxStreak: number
  responseTimes: { [questionId: string]: number }
  
  // Additional metadata
  categoryPerformance?: Record<string, { correct: number; total: number }>
  metadata?: Record<string, any>
  
  // Timestamps
  startedAt: number
  lastUpdatedAt?: number
  expiresAt?: number
}

export interface QuestionResponse {
  questionId: string
  questionIndex: number
  userAnswer: string
  isCorrect: boolean
  timeSpentSeconds?: number
  hintUsed?: boolean
  // Enhanced fields for interactive questions
  interactiveAnswer?: InteractiveAnswerData
  partialProgress?: Record<string, any>
}

export interface ProgressSessionOptions {
  userId?: string
  guestToken?: string
  sessionType: string
  topicId?: string
  assessmentType?: string
  testType?: string
  maxAgeHours?: number
}

// Enhanced progress storage class
export class EnhancedProgressStorage {
  private static readonly DEFAULT_EXPIRY_HOURS = 24
  private static readonly STORAGE_PREFIX = 'enhanced-progress'

  /**
   * Create or update a progress session in the database
   */
  static async saveProgressSession(
    state: EnhancedQuizState,
    options: ProgressSessionOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, guestToken } = options
      
      // Prepare session data
      const sessionData = {
        session_id: state.sessionId,
        session_type: state.sessionType,
        user_id: userId || null,
        guest_token: !userId ? guestToken : null,
        topic_id: state.topicId,
        assessment_type: state.assessmentType,
        test_type: state.testType,
        questions: state.questions,
        current_question_index: state.currentQuestionIndex,
        answers: state.answers,
        streak: state.streak,
        max_streak: state.maxStreak,
        response_times: state.responseTimes,
        category_performance: state.categoryPerformance || {},
        metadata: {
          ...state.metadata || {},
          // Store interactive answers in metadata for database compatibility
          interactiveAnswers: state.interactiveAnswers || {}
        },
        expires_at: new Date(Date.now() + (this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
      }

      // Use upsert to create or update
      const { error } = await supabase
        .from('progress_sessions')
        .upsert(sessionData, {
          onConflict: 'session_id',
          ignoreDuplicates: false
        })

      if (error) {
        debug.warn('storage', 'Failed to save progress session to database:', error)
        
        // Fallback to localStorage
        this.saveToLocalStorage(state, options)
        return { success: false, error: error.message }
      }

      debug.log('storage', 'Successfully saved progress session to database:', {
        sessionId: state.sessionId,
        sessionType: state.sessionType,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.questions.length
      })

      // Also save to localStorage for offline access
      this.saveToLocalStorage(state, options)
      
      return { success: true }
    } catch (error) {
      debug.warn('storage', 'Exception saving progress session:', error)
      
      // Fallback to localStorage
      this.saveToLocalStorage(state, options)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save individual question response to database
   */
  static async saveQuestionResponse(
    sessionId: string,
    response: QuestionResponse,
    options: ProgressSessionOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the progress session ID
      const { data: session, error: sessionError } = await supabase
        .from('progress_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single()

      if (sessionError || !session) {
        debug.warn('storage', 'Could not find progress session for question response:', sessionError)
        return { success: false, error: 'Session not found' }
      }

      // Save the question response
      const { error } = await supabase
        .from('progress_question_responses')
        .upsert({
          progress_session_id: session.id,
          question_id: response.questionId,
          question_index: response.questionIndex,
          user_answer: response.userAnswer,
          is_correct: response.isCorrect,
          time_spent_seconds: response.timeSpentSeconds,
          hint_used: response.hintUsed || false
        }, {
          onConflict: 'progress_session_id,question_id',
          ignoreDuplicates: false
        })

      if (error) {
        debug.warn('storage', 'Failed to save question response:', error)
        return { success: false, error: error.message }
      }

      debug.log('storage', 'Successfully saved question response:', {
        sessionId,
        questionId: response.questionId,
        isCorrect: response.isCorrect
      })

      return { success: true }
    } catch (error) {
      debug.warn('storage', 'Exception saving question response:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Load progress session from database with localStorage fallback
   * Enhanced with completion checking to prevent restoring completed quizzes
   */
  static async loadProgressSession(
    sessionId: string,
    options: ProgressSessionOptions
  ): Promise<EnhancedQuizState | null> {
    try {
      const { userId, guestToken, topicId } = options

      // CRITICAL: Check if this quiz was recently completed
      // Don't restore progress for completed quizzes
      if (topicId && this.isQuizRecentlyCompleted(topicId)) {
        debug.log('storage', 'Quiz was recently completed, not restoring progress:', topicId)
        return null
      }

      // Try to load from database first
      let query = supabase
        .from('progress_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())

      // Add user/guest filter
      if (userId) {
        query = query.eq('user_id', userId)
      } else if (guestToken) {
        query = query.eq('guest_token', guestToken)
      }

      const { data: session, error } = await query.single()

      if (error || !session) {
        debug.log('storage', 'No progress session found in database, trying localStorage:', error?.message)
        
        // Fallback to localStorage (with completion check)
        return this.loadFromLocalStorage(sessionId, options)
      }

      // Also load question responses
      const { data: responses } = await supabase
        .from('progress_question_responses')
        .select('*')
        .eq('progress_session_id', session.id)
        .order('question_index')

      // Convert database format to state format
      const state: EnhancedQuizState = {
        sessionId: session.session_id,
        sessionType: session.session_type as any,
        topicId: session.topic_id ?? undefined,
        assessmentType: session.assessment_type ?? undefined,
        testType: (session.test_type as 'quick' | 'full') ?? undefined,
        questions: session.questions as any[],
        currentQuestionIndex: session.current_question_index,
        answers: session.answers as { [questionId: string]: string },
        // Restore interactive answers from metadata
        interactiveAnswers: (session.metadata as any)?.interactiveAnswers || {},
        streak: session.streak,
        maxStreak: session.max_streak,
        responseTimes: session.response_times as { [questionId: string]: number },
        categoryPerformance: session.category_performance as any,
        metadata: session.metadata as any,
        startedAt: new Date(session.started_at).getTime(),
        lastUpdatedAt: new Date(session.last_updated_at).getTime(),
        expiresAt: new Date(session.expires_at).getTime()
      }

      debug.log('storage', 'Successfully loaded progress session from database:', {
        sessionId: state.sessionId,
        sessionType: state.sessionType,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.questions.length,
        responsesCount: responses?.length || 0
      })

      return state
    } catch (error) {
      debug.warn('storage', 'Exception loading progress session from database:', error)
      
      // Fallback to localStorage
      return this.loadFromLocalStorage(sessionId, options)
    }
  }

  /**
   * Check if a quiz was recently completed (within last 5 minutes)
   * This prevents restoring progress for just-completed quizzes
   */
  static isQuizRecentlyCompleted(topicId: string): boolean {
    try {
      // Check multiple possible completion data formats
      
      // Format 1: Check latest completion reference
      const completionKey = localStorage.getItem(`latest_quiz_completion_${topicId}`)
      if (completionKey) {
        const completionData = localStorage.getItem(completionKey)
        if (completionData) {
          const completion = JSON.parse(completionData)
          const completedAt = new Date(completion.completedAt).getTime()
          const now = Date.now()
          const fiveMinutesAgo = now - (5 * 60 * 1000) // 5 minutes

          // Consider quiz recently completed if within last 5 minutes
          const isRecent = completedAt > fiveMinutesAgo
          
          if (isRecent) {
            debug.log('storage', 'Quiz recently completed (format 1), preventing progress restoration:', {
              topicId,
              completedAt: new Date(completedAt).toISOString(),
              minutesAgo: Math.round((now - completedAt) / 60000)
            })
            return true
          }
        }
      }
      
      // Format 2: Check completed topics list (legacy)
      const completedTopicsStr = localStorage.getItem("civicAppCompletedTopics_v1")
      if (completedTopicsStr) {
        const completedTopics = JSON.parse(completedTopicsStr)
        if (Array.isArray(completedTopics) && completedTopics.includes(topicId)) {
          // Check if there's recent activity to determine if this is a fresh completion
          const lastActivityStr = localStorage.getItem("civicAppLastActivity")
          if (lastActivityStr) {
            const lastActivity = new Date(lastActivityStr).getTime()
            const now = Date.now()
            const fiveMinutesAgo = now - (5 * 60 * 1000)
            
            if (lastActivity > fiveMinutesAgo) {
              debug.log('storage', 'Quiz recently completed (format 2), preventing progress restoration:', {
                topicId,
                lastActivity: new Date(lastActivity).toISOString()
              })
              return true
            }
          }
        }
      }
      
      // Format 3: Check for any completion data keys for this topic
      const allKeys = Object.keys(localStorage)
      const recentCompletionKeys = allKeys.filter(key => 
        key.startsWith(`quiz_completion_${topicId}_`) && 
        key !== `latest_quiz_completion_${topicId}`
      )
      
      for (const key of recentCompletionKeys) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const completion = JSON.parse(data)
            const completedAt = new Date(completion.completedAt).getTime()
            const now = Date.now()
            const fiveMinutesAgo = now - (5 * 60 * 1000)

            if (completedAt > fiveMinutesAgo) {
              debug.log('storage', 'Quiz recently completed (format 3), preventing progress restoration:', {
                topicId,
                completedAt: new Date(completedAt).toISOString(),
                key
              })
              return true
            }
          }
        } catch (parseError) {
          // Invalid data, skip
          debug.warn('storage', 'Invalid completion data for key:', key)
        }
      }

      return false
    } catch (error) {
      debug.warn('storage', 'Error checking recent completion:', error)
      return false
    }
  }

  /**
   * Get all progress sessions for a user
   */
  static async getUserProgressSessions(
    options: ProgressSessionOptions
  ): Promise<Array<{
    sessionId: string
    sessionType: string
    topicId?: string
    currentQuestionIndex: number
    totalQuestions: number
    answeredQuestions: number
    startedAt: Date
    lastUpdatedAt: Date
    expiresAt: Date
  }>> {
    try {
      const { userId, guestToken } = options

      const { data, error } = await supabase.rpc('get_user_progress_sessions', {
        p_user_id: userId,
        p_guest_token: !userId ? guestToken : undefined
      })

      if (error) {
        debug.warn('storage', 'Failed to get user progress sessions:', error)
        return []
      }

      return (data || []).map((session: any) => ({
        sessionId: session.session_id,
        sessionType: session.session_type,
        topicId: session.topic_id ?? undefined,
        currentQuestionIndex: session.current_question_index,
        totalQuestions: session.total_questions,
        answeredQuestions: session.answered_questions,
        startedAt: new Date(session.started_at),
        lastUpdatedAt: new Date(session.last_updated_at),
        expiresAt: new Date(session.expires_at)
      }))
    } catch (error) {
      debug.warn('storage', 'Exception getting user progress sessions:', error)
      return []
    }
  }

  /**
   * Enhanced clear method that also cleans up completion data after some time
   */
  static async clearProgressSession(
    sessionId: string,
    options: ProgressSessionOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear from database
      const { error: dbError } = await supabase
        .from('progress_sessions')
        .delete()
        .eq('session_id', sessionId)

      if (dbError) {
        debug.warn('storage', 'Failed to clear progress session from database:', dbError)
      }

      // Clear from localStorage
      this.clearFromLocalStorage(sessionId, options)

      // Also clear any old completion data for this topic (older than 1 hour)
      if (options.topicId) {
        this.cleanupOldCompletionData(options.topicId)
      }

      debug.log('storage', 'Successfully cleared progress session:', sessionId)
      return { success: true }
    } catch (error) {
      debug.warn('storage', 'Exception clearing progress session:', error)
      
      // Still try to clear from localStorage
      this.clearFromLocalStorage(sessionId, options)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Clean up old completion data to prevent localStorage bloat
   */
  private static cleanupOldCompletionData(topicId: string) {
    try {
      const keys = Object.keys(localStorage)
      const completionKeys = keys.filter(key => key.startsWith(`quiz_completion_${topicId}_`))
      const oneHourAgo = Date.now() - (60 * 60 * 1000)

      let cleaned = 0
      completionKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const completion = JSON.parse(data)
            const completedAt = new Date(completion.completedAt).getTime()
            
            if (completedAt < oneHourAgo) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
        } catch (error) {
          // Remove invalid completion data
          localStorage.removeItem(key)
          cleaned++
        }
      })

      if (cleaned > 0) {
        debug.log('storage', `Cleaned up ${cleaned} old completion records for topic:`, topicId)
      }
    } catch (error) {
      debug.warn('storage', 'Error cleaning up completion data:', error)
    }
  }

  /**
   * Generate storage key for localStorage
   */
  private static getStorageKey(sessionId: string, options: ProgressSessionOptions): string {
    return `${this.STORAGE_PREFIX}-${sessionId}`
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_progress_sessions')

      if (error) {
        debug.warn('storage', 'Failed to cleanup expired sessions:', error)
        return 0
      }

      const cleanedCount = data || 0
      if (cleanedCount > 0) {
        debug.log('storage', `Cleaned up ${cleanedCount} expired progress sessions`)
      }

      return cleanedCount
    } catch (error) {
      debug.warn('storage', 'Exception cleaning up expired sessions:', error)
      return 0
    }
  }

  /**
   * Move session from guest to authenticated user
   */
  static async migrateGuestSession(
    sessionId: string,
    guestToken: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('progress_sessions')
        .update({
          user_id: userId,
          guest_token: null
        })
        .eq('session_id', sessionId)
        .eq('guest_token', guestToken)

      if (error) {
        debug.warn('storage', 'Failed to migrate guest session:', error)
        return { success: false, error: error.message }
      }

      debug.log('storage', 'Successfully migrated guest session to user:', { sessionId, userId })
      return { success: true }
    } catch (error) {
      debug.warn('storage', 'Exception migrating guest session:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // localStorage fallback methods
  private static saveToLocalStorage(state: EnhancedQuizState, options: ProgressSessionOptions) {
    try {
      const key = `${this.STORAGE_PREFIX}-${state.sessionId}`
      const data = {
        ...state,
        savedAt: Date.now(),
        options
      }
      localStorage.setItem(key, JSON.stringify(data))
      debug.log('storage', 'Saved to localStorage as fallback:', key)
    } catch (error) {
      debug.warn('storage', 'Failed to save to localStorage:', error)
    }
  }

  /**
   * Load from localStorage with completion checking
   */
  private static loadFromLocalStorage(sessionId: string, options: ProgressSessionOptions): EnhancedQuizState | null {
    try {
      // Check for recent completion again (in case database check was skipped)
      if (options.topicId && this.isQuizRecentlyCompleted(options.topicId)) {
        debug.log('storage', 'Quiz recently completed, not loading from localStorage:', options.topicId)
        return null
      }

      const storageKey = this.getStorageKey(sessionId, options)
      const stored = localStorage.getItem(storageKey)
      
      if (!stored) {
        debug.log('storage', 'No localStorage data found for session:', sessionId)
        return null
      }

      const state: EnhancedQuizState = JSON.parse(stored)
      
      // Check if expired
      if (state.expiresAt && Date.now() > state.expiresAt) {
        debug.log('storage', 'Progress session expired, removing from localStorage')
        localStorage.removeItem(storageKey)
        return null
      }

      debug.log('storage', 'Successfully loaded progress from localStorage:', {
        sessionId: state.sessionId,
        sessionType: state.sessionType,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.questions.length
      })

      return state
    } catch (error) {
      debug.warn('storage', 'Error loading from localStorage:', error)
      return null
    }
  }

  private static clearFromLocalStorage(sessionId: string, options: ProgressSessionOptions) {
    try {
      const key = `${this.STORAGE_PREFIX}-${sessionId}`
      localStorage.removeItem(key)
      debug.log('storage', 'Cleared localStorage session:', sessionId)
    } catch (error) {
      debug.warn('storage', 'Failed to clear localStorage:', error)
    }
  }
}

/**
 * Factory functions for different component types
 */
export function createEnhancedProgressManager(options: ProgressSessionOptions) {
  return {
    async save(state: EnhancedQuizState) {
      return EnhancedProgressStorage.saveProgressSession(state, options)
    },

    async saveQuestionResponse(sessionId: string, response: QuestionResponse) {
      return EnhancedProgressStorage.saveQuestionResponse(sessionId, response, options)
    },

    async load(sessionId: string) {
      return EnhancedProgressStorage.loadProgressSession(sessionId, options)
    },

    async getUserSessions() {
      return EnhancedProgressStorage.getUserProgressSessions(options)
    },

    async clear(sessionId: string) {
      return EnhancedProgressStorage.clearProgressSession(sessionId, options)
    },

    async migrateFromGuest(sessionId: string, guestToken: string, userId: string) {
      return EnhancedProgressStorage.migrateGuestSession(sessionId, guestToken, userId)
    }
  }
}

// Specialized factory functions
export const createEnhancedCivicsTestProgress = (userId?: string, guestToken?: string) =>
  createEnhancedProgressManager({
    userId,
    guestToken,
    sessionType: 'civics_test'
  })

export const createEnhancedRegularQuizProgress = (userId?: string, guestToken?: string, topicId?: string) =>
  createEnhancedProgressManager({
    userId,
    guestToken,
    sessionType: 'regular_quiz',
    topicId
  })

export const createEnhancedOnboardingAssessmentProgress = (userId?: string, guestToken?: string) =>
  createEnhancedProgressManager({
    userId,
    guestToken,
    sessionType: 'onboarding_assessment'
  })

export const createEnhancedMultiplayerQuizProgress = (userId?: string, guestToken?: string, roomId?: string) =>
  createEnhancedProgressManager({
    userId,
    guestToken,
    sessionType: 'multiplayer_quiz',
    topicId: roomId
  })

export const createEnhancedSurveyProgress = (userId?: string, guestToken?: string, surveyId?: string) =>
  createEnhancedProgressManager({
    userId,
    guestToken,
    sessionType: 'survey',
    topicId: surveyId
  })

/**
 * Helper functions for interactive question progress
 */
export class InteractiveProgressHelper {
  /**
   * Save interactive answer data for a specific question
   */
  static saveInteractiveAnswer(
    state: EnhancedQuizState,
    questionId: string,
    answerData: InteractiveAnswerData
  ): EnhancedQuizState {
    return {
      ...state,
      interactiveAnswers: {
        ...state.interactiveAnswers || {},
        [questionId]: answerData
      },
      lastUpdatedAt: Date.now()
    }
  }

  /**
   * Get interactive answer data for a specific question
   */
  static getInteractiveAnswer(
    state: EnhancedQuizState,
    questionId: string
  ): InteractiveAnswerData | null {
    return state.interactiveAnswers?.[questionId] || null
  }

  /**
   * Check if a question has complex interactive state that needs preservation
   */
  static hasInteractiveProgress(
    state: EnhancedQuizState,
    questionId: string
  ): boolean {
    const answer = state.interactiveAnswers?.[questionId]
    if (!answer || typeof answer === 'string') return false

    // Check for partial progress indicators
    if ('matches' in answer && answer.matches.length > 0) return true
    if ('eventOrder' in answer && answer.eventOrder.length > 0) return true
    if ('blankAnswers' in answer && answer.blankAnswers.some(b => b.value.trim() !== '')) return true
    if ('stageAnswers' in answer && answer.stageAnswers.length > 0) return true

    return false
  }

  /**
   * Convert interactive answer to summary string for compatibility
   */
  static interactiveAnswerToString(answerData: InteractiveAnswerData): string {
    if (typeof answerData === 'string') return answerData

    switch (answerData.type) {
      case 'matching_interactive':
        return `${answerData.matches.length} matches made`
      case 'timeline':
        return `Timeline ordered: ${answerData.eventOrder.length} events`
      case 'fill_in_blanks_enhanced':
        const answered = answerData.blankAnswers.filter(b => b.value.trim() !== '').length
        return `${answered}/${answerData.blankAnswers.length} blanks filled`
      case 'scenario_simulation':
        return `Stage ${answerData.currentStage + 1}, ${answerData.totalPoints} points`
      default:
        return 'Interactive progress saved'
    }
  }
}