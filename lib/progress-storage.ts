/**
 * Centralized Quiz Progress Storage Utility
 * 
 * Handles saving, loading, and restoring quiz progress for all quiz types:
 * - Regular quizzes (quiz-engine)
 * - Multiplayer quizzes (base-multiplayer-engine)
 * - Onboarding assessments (assessment-step)
 * - Civics test assessments (civics-test-assessment)
 * - Surveys (survey-form)
 * 
 * Features:
 * - Consistent localStorage key format
 * - Legacy key migration
 * - Progress validation and cleanup
 * - User-specific and guest-specific storage
 * - Automatic expiration handling
 */

import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { debug } from '@/lib/debug-config'

// Base interface for all quiz state
export interface BaseQuizState {
  sessionId: string
  quizType: string
  topicId?: string
  questions: any[]
  currentQuestionIndex: number
  answers: { [questionId: string]: string }
  streak: number
  maxStreak: number
  startTime: number
  responseTimes: { [questionId: string]: number }
  savedAt: number
  // Quiz-specific fields
  testType?: 'quick' | 'full'
  assessmentMode?: 'quick' | 'full'
  categoryPerformance?: Record<string, { correct: number; total: number }>
  // Multiplayer fields
  roomId?: string
  playerId?: string
  gameMode?: string
  playerScores?: Record<string, any>
}

// Survey-specific interfaces
export interface SurveyResponse {
  question_id: string
  answer: string | string[] | number | Record<string, any>
  answered_at: string
}

export interface BaseSurveyState {
  sessionId: string
  quizType: string
  topicId?: string
  questions: any[]
  currentQuestionIndex: number
  responses: Record<string, SurveyResponse>
  startTime: number
  savedAt: number
  // Required for compatibility with BaseQuizState validation
  answers: { [questionId: string]: string }
  streak: number
  maxStreak: number
  responseTimes: { [questionId: string]: number }
}

// Quiz type definitions
export type QuizType = 'regular' | 'civics-test' | 'onboarding-assessment' | 'multiplayer' | 'survey'

export interface QuizProgressOptions {
  userId?: string
  guestToken?: string
  quizType: string
  topicId?: string
  sessionId?: string
  maxAgeHours?: number
  enableLegacyMigration?: boolean
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  reason?: string
  hasProgress: boolean
  isRecent: boolean
  hasValidStructure: boolean
}

export class QuizProgressStorage {
  private static readonly DEFAULT_MAX_AGE_HOURS = 4
  private static readonly STORAGE_PREFIX = 'quiz-progress'

  /**
   * Generate a consistent storage key for quiz progress
   */
  static generateStorageKey(options: QuizProgressOptions): string {
    const { userId, guestToken, quizType, topicId, sessionId } = options
    const userIdentifier = userId || guestToken || 'anonymous'
    
    // For surveys, include sessionId if available
    if (quizType === 'survey' && sessionId) {
      return `${this.STORAGE_PREFIX}-${quizType}-${topicId}-${sessionId}-${userIdentifier}`
    }
    
    if (topicId) {
      return `${this.STORAGE_PREFIX}-${quizType}-${topicId}-${userIdentifier}`
    }
    return `${this.STORAGE_PREFIX}-${quizType}-${userIdentifier}`
  }

  /**
   * Generate legacy key formats for migration
   */
  static generateLegacyKeys(options: QuizProgressOptions): string[] {
    const { userId, guestToken, quizType, topicId } = options
    const legacyKeys: string[] = []

    if (userId) {
      // Old format variations
      legacyKeys.push(`${quizType}-state-${userId}`)
      legacyKeys.push(`${quizType}-state-user-${userId}`)
      legacyKeys.push(`quiz-state-${userId}`)
      
      if (topicId) {
        legacyKeys.push(`${quizType}-${topicId}-${userId}`)
        legacyKeys.push(`quiz-${topicId}-${userId}`)
      }
    }

    // Anonymous fallbacks
    legacyKeys.push(`${quizType}-state-anonymous`)
    legacyKeys.push('quiz-state-anonymous')
    
    if (topicId) {
      legacyKeys.push(`${quizType}-${topicId}-anonymous`)
    }

    return legacyKeys
  }

  /**
   * Validate quiz state for restoration
   */
  static validateQuizState(
    state: any, 
    options: QuizProgressOptions
  ): ValidationResult {
    if (!state || typeof state !== 'object') {
      return {
        isValid: false,
        reason: 'Invalid state object',
        hasProgress: false,
        isRecent: false,
        hasValidStructure: false
      }
    }

    // Check if state has progress (answered questions or responses)
    const hasProgress = (state.answers && 
      typeof state.answers === 'object' && 
      Object.keys(state.answers).length > 0) ||
      (state.responses &&
      typeof state.responses === 'object' &&
      Object.keys(state.responses).length > 0)

    // Check recency (default 4 hours)
    const maxAge = (options.maxAgeHours || this.DEFAULT_MAX_AGE_HOURS) * 60 * 60 * 1000
    const savedAt = state.savedAt || state.startTime || 0
    const isRecent = Date.now() - savedAt < maxAge

    // Check structure validity
    const hasValidStructure = state.questions && 
      Array.isArray(state.questions) && 
      state.questions.length > 0 &&
      typeof state.currentQuestionIndex === 'number' &&
      state.currentQuestionIndex >= 0 &&
      state.currentQuestionIndex < state.questions.length

    // Additional quiz-type specific validation
    let quizTypeValid = true
    if (options.quizType === 'civics-test' || options.quizType === 'onboarding-assessment') {
      quizTypeValid = state.testType || state.assessmentMode
    } else if (options.quizType === 'multiplayer') {
      quizTypeValid = state.roomId && state.playerId && state.gameMode
    } else if (options.quizType === 'survey') {
      quizTypeValid = state.responses && typeof state.responses === 'object'
    } else if (options.topicId) {
      quizTypeValid = state.topicId === options.topicId
    }

    const isValid = hasProgress && isRecent && hasValidStructure && quizTypeValid

    return {
      isValid,
      reason: !isValid ? this.getValidationFailureReason({
        hasProgress,
        isRecent,
        hasValidStructure,
        quizTypeValid
      }) : undefined,
      hasProgress,
      isRecent,
      hasValidStructure
    }
  }

  private static getValidationFailureReason(checks: {
    hasProgress: boolean
    isRecent: boolean
    hasValidStructure: boolean
    quizTypeValid: boolean
  }): string {
    if (!checks.hasProgress) return 'No progress found'
    if (!checks.isRecent) return 'State too old'
    if (!checks.hasValidStructure) return 'Invalid structure'
    if (!checks.quizTypeValid) return 'Quiz type mismatch'
    return 'Unknown validation failure'
  }

  /**
   * Save quiz progress to localStorage
   */
  static saveProgress(
    state: BaseQuizState | BaseSurveyState,
    options: QuizProgressOptions
  ): boolean {
    try {
      const storageKey = this.generateStorageKey(options)
      const stateWithTimestamp = {
        ...state,
        savedAt: Date.now()
      }

      localStorage.setItem(storageKey, JSON.stringify(stateWithTimestamp))
      
      const answerCount = 'responses' in state 
        ? Object.keys(state.responses).length
        : Object.keys(state.answers).length

      debug.log('storage', `Saved ${options.quizType} progress:`, {
        key: storageKey,
        questionIndex: state.currentQuestionIndex + 1,
        totalQuestions: state.questions.length,
        answers: answerCount
      })

      return true
    } catch (error) {
      debug.warn('storage', `Failed to save ${options.quizType} progress:`, error)
      return false
    }
  }

  /**
   * Load quiz progress from localStorage with legacy migration
   */
  static loadProgress(options: QuizProgressOptions): BaseQuizState | BaseSurveyState | null {
    try {
      const storageKey = this.generateStorageKey(options)
      let saved = localStorage.getItem(storageKey)

      // Try legacy key migration if current key doesn't exist
      if (!saved && options.enableLegacyMigration !== false) {
        const legacyKeys = this.generateLegacyKeys(options)
        
        for (const legacyKey of legacyKeys) {
          saved = localStorage.getItem(legacyKey)
          if (saved) {
            debug.log('storage', `Found ${options.quizType} progress with legacy key:`, legacyKey)
            // Migrate to new key
            localStorage.setItem(storageKey, saved)
            localStorage.removeItem(legacyKey)
            break
          }
        }
      }

      if (!saved) {
        debug.log('storage', `No ${options.quizType} progress found`)
        return null
      }

      const state = JSON.parse(saved)
      const validation = this.validateQuizState(state, options)

      if (validation.isValid) {
        const answerCount = state.responses 
          ? Object.keys(state.responses).length
          : Object.keys(state.answers || {}).length

        debug.log('storage', `Restored ${options.quizType} progress:`, {
          key: storageKey,
          questionIndex: state.currentQuestionIndex + 1,
          totalQuestions: state.questions?.length || 0,
          answers: answerCount,
          savedAt: new Date(state.savedAt || state.startTime).toLocaleString()
        })
        return state
      } else {
        debug.log('storage', `Cleaning up invalid ${options.quizType} progress:`, {
          key: storageKey,
          reason: validation.reason,
          validation
        })
        localStorage.removeItem(storageKey)
        return null
      }
    } catch (error) {
      debug.warn('storage', `Failed to load ${options.quizType} progress:`, error)
      return null
    }
  }

  /**
   * Clear quiz progress from localStorage
   */
  static clearProgress(options: QuizProgressOptions): boolean {
    try {
      const storageKey = this.generateStorageKey(options)
      localStorage.removeItem(storageKey)
      
      debug.log('storage', `Cleared ${options.quizType} progress:`, storageKey)
      return true
    } catch (error) {
      debug.warn('storage', `Failed to clear ${options.quizType} progress:`, error)
      return false
    }
  }

  /**
   * Clean up all expired quiz progress entries
   */
  static cleanupExpiredProgress(maxAgeHours: number = this.DEFAULT_MAX_AGE_HOURS): number {
    let cleanedCount = 0
    const maxAge = maxAgeHours * 60 * 60 * 1000

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith(this.STORAGE_PREFIX)) continue

        try {
          const value = localStorage.getItem(key)
          if (!value) continue

          const state = JSON.parse(value)
          const savedAt = state.savedAt || state.startTime || 0
          
          if (Date.now() - savedAt > maxAge) {
            localStorage.removeItem(key)
            cleanedCount++
            debug.log('storage', `Cleaned up expired progress:`, key)
          }
        } catch (error) {
          // Invalid JSON, remove it
          localStorage.removeItem(key)
          cleanedCount++
          debug.log('storage', `Cleaned up invalid progress:`, key)
        }
      }
    } catch (error) {
      debug.warn('storage', 'Error during progress cleanup:', error)
    }

    if (cleanedCount > 0) {
      debug.log('storage', `Cleaned up ${cleanedCount} expired progress entries`)
    }

    return cleanedCount
  }

  /**
   * Get all quiz progress entries for debugging
   */
  static getAllProgress(): Record<string, any> {
    const allProgress: Record<string, any> = {}

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith(this.STORAGE_PREFIX)) continue

        try {
          const value = localStorage.getItem(key)
          if (value) {
            allProgress[key] = JSON.parse(value)
          }
        } catch (error) {
          allProgress[key] = 'Invalid JSON'
        }
      }
    } catch (error) {
      debug.warn('storage', 'Error getting all progress:', error)
    }

    return allProgress
  }

  /**
   * Initialize progress storage (cleanup expired entries)
   */
  static initialize(): void {
    // Clean up expired entries on initialization
    this.cleanupExpiredProgress()

    // Set up periodic cleanup (every 30 minutes)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupExpiredProgress()
      }, 30 * 60 * 1000)
    }
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  QuizProgressStorage.initialize()
}

/**
 * Convenience hooks for different quiz types
 */
export const createQuizProgressManager = (options: QuizProgressOptions) => ({
  save: (state: BaseQuizState) => QuizProgressStorage.saveProgress(state, options),
  load: () => QuizProgressStorage.loadProgress(options) as BaseQuizState | null,
  clear: () => QuizProgressStorage.clearProgress(options),
  validate: (state: any) => QuizProgressStorage.validateQuizState(state, options)
})

// Export specific managers for each quiz type
export const createRegularQuizProgress = (userId?: string, guestToken?: string, topicId?: string) =>
  createQuizProgressManager({ userId, guestToken, quizType: 'regular', topicId })

export const createCivicsTestProgress = (userId?: string, guestToken?: string) =>
  createQuizProgressManager({ userId, guestToken, quizType: 'civics-test' })

export const createOnboardingAssessmentProgress = (userId?: string, guestToken?: string) =>
  createQuizProgressManager({ userId, guestToken, quizType: 'onboarding-assessment' })

export const createMultiplayerQuizProgress = (userId?: string, guestToken?: string, roomId?: string) =>
  createQuizProgressManager({ userId, guestToken, quizType: 'multiplayer', topicId: roomId })

/**
 * Survey progress functions
 */
export function createSurveyProgress(surveyId: string, sessionId: string, userId?: string, guestToken?: string) {
  return {
    save: (state: BaseSurveyState) => QuizProgressStorage.saveProgress(state, {
      quizType: 'survey',
      topicId: surveyId,
      sessionId,
      userId,
      guestToken
    }),
    load: () => QuizProgressStorage.loadProgress({
      quizType: 'survey',
      topicId: surveyId,
      sessionId,
      userId,
      guestToken
    }) as BaseSurveyState | null,
    clear: () => QuizProgressStorage.clearProgress({
      quizType: 'survey',
      topicId: surveyId,
      sessionId,
      userId,
      guestToken
    })
  }
}

/**
 * Survey state conversion utilities
 */
export function convertSurveyStateToBaseSurvey(surveyState: {
  currentQuestionIndex: number
  responses: Record<string, SurveyResponse>
  questions: any[]
  startTime: number
  sessionId?: string
}): BaseSurveyState {
  // Convert responses to answers format for compatibility
  const answers: { [questionId: string]: string } = {}
  Object.entries(surveyState.responses).forEach(([questionId, response]) => {
    answers[questionId] = typeof response.answer === 'string' 
      ? response.answer 
      : JSON.stringify(response.answer)
  })

  return {
    sessionId: surveyState.sessionId || `survey-${Date.now()}`,
    quizType: 'survey',
    topicId: undefined,
    questions: surveyState.questions,
    currentQuestionIndex: surveyState.currentQuestionIndex,
    responses: surveyState.responses,
    startTime: surveyState.startTime,
    savedAt: Date.now(),
    // Required compatibility fields
    answers,
    streak: 0,
    maxStreak: 0,
    responseTimes: {}
  }
}

export function convertBaseSurveyStateToSurvey(baseState: BaseSurveyState): {
  currentQuestionIndex: number
  responses: Record<string, SurveyResponse>
  questions: any[]
  startTime: number
  sessionId?: string
} {
  return {
    currentQuestionIndex: baseState.currentQuestionIndex,
    responses: baseState.responses,
    questions: baseState.questions,
    startTime: baseState.startTime,
    sessionId: baseState.sessionId
  }
}

/**
 * Hook for easy progress storage access
 */
export function useProgressStorage() {
  const { user } = useAuth()
  const { guestToken } = useGuestAccess()

  return {
    // Quiz functions
    createRegularQuizProgress: (topicId: string) => 
      createRegularQuizProgress(user?.id || undefined, guestToken || undefined, topicId),
    createCivicsTestProgress: () => 
      createCivicsTestProgress(user?.id || undefined, guestToken || undefined),
    createOnboardingAssessmentProgress: () => 
      createOnboardingAssessmentProgress(user?.id || undefined, guestToken || undefined),
    createMultiplayerQuizProgress: (topicId: string) => 
      createMultiplayerQuizProgress(user?.id || undefined, guestToken || undefined, topicId),
    
    // Survey functions
    createSurveyProgress: (surveyId: string, sessionId: string) => 
      createSurveyProgress(surveyId, sessionId, user?.id || undefined, guestToken || undefined),
    
    // Utility functions
    cleanupExpiredEntries: () => QuizProgressStorage.cleanupExpiredProgress(),
    getAllProgressEntries: () => QuizProgressStorage.getAllProgress(),
    
    // User info
    userId: user?.id,
    guestToken,
    isAuthenticated: !!user
  }
}

// Initialize cleanup when module loads
if (typeof window !== 'undefined') {
  QuizProgressStorage.initialize()
} 