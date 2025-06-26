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
        metadata: state.metadata || {},
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
   */
  static async loadProgressSession(
    sessionId: string,
    options: ProgressSessionOptions
  ): Promise<EnhancedQuizState | null> {
    try {
      const { userId, guestToken } = options

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
        
        // Fallback to localStorage
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
   * Clear progress session from both database and localStorage
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

  private static loadFromLocalStorage(sessionId: string, options: ProgressSessionOptions): EnhancedQuizState | null {
    try {
      const key = `${this.STORAGE_PREFIX}-${sessionId}`
      const saved = localStorage.getItem(key)
      
      if (!saved) {
        debug.log('storage', 'No localStorage fallback found for session:', sessionId)
        return null
      }

      const data = JSON.parse(saved)
      
      // Check if expired
      const maxAge = (options.maxAgeHours || this.DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000
      if (Date.now() - data.savedAt > maxAge) {
        localStorage.removeItem(key)
        debug.log('storage', 'Removed expired localStorage session:', sessionId)
        return null
      }

      debug.log('storage', 'Loaded from localStorage fallback:', sessionId)
      return data as EnhancedQuizState
    } catch (error) {
      debug.warn('storage', 'Failed to load from localStorage:', error)
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