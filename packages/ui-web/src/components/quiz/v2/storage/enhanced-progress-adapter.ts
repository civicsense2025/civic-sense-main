/**
 * Enhanced Progress Storage Adapter for Quiz Engine V2
 * 
 * Bridges the enhanced progress storage system with the new modular quiz architecture.
 * Provides seamless progress saving/loading while maintaining backward compatibility.
 */

import { EnhancedProgressStorage, createEnhancedProgressManager, EnhancedQuizState, QuestionResponse } from '@/lib/enhanced-progress-storage'
import type { QuizState, QuizConfig, QuizPluginContext } from '../types/index'

export interface ProgressAdapterOptions {
  userId?: string
  guestToken?: string
  sessionId: string
  topicId?: string
  mode?: string
  assessmentType?: string
  testType?: 'quick' | 'full'
}

export class EnhancedProgressAdapter {
  private progressManager: ReturnType<typeof createEnhancedProgressManager>
  private options: ProgressAdapterOptions
  private lastSavedState: string = ''

  constructor(options: ProgressAdapterOptions) {
    this.options = options
    
    // Create appropriate progress manager based on mode
    this.progressManager = createEnhancedProgressManager({
      userId: options.userId,
      guestToken: options.guestToken,
      sessionType: this.mapModeToSessionType(options.mode),
      topicId: options.topicId,
      assessmentType: options.assessmentType,
      testType: options.testType,
      maxAgeHours: 24
    })
  }

  /**
   * Map quiz mode to session type for storage
   */
  private mapModeToSessionType(mode?: string): 'regular_quiz' | 'civics_test' | 'onboarding_assessment' | 'multiplayer_quiz' | 'survey' {
    switch (mode) {
      case 'civics-test':
        return 'civics_test'
      case 'multiplayer':
        return 'multiplayer_quiz'
      case 'assessment':
        return 'onboarding_assessment'
      case 'survey':
        return 'survey'
      default:
        return 'regular_quiz'
    }
  }

  /**
   * Convert V2 quiz state to enhanced storage format
   */
  private convertToEnhancedState(
    state: QuizState,
    config: QuizConfig,
    context: QuizPluginContext
  ): EnhancedQuizState {
    return {
      sessionId: this.options.sessionId,
      sessionType: this.mapModeToSessionType(config.mode),
      topicId: this.options.topicId,
      assessmentType: this.options.assessmentType,
      testType: this.options.testType,
      questions: config.questions.map((q: any) => ({
        id: q.id,
        text: q.question,
        type: q.type
      })),
      currentQuestionIndex: state.currentQuestionIndex,
      answers: state.answers,
      streak: state.streak || 0,
      maxStreak: state.maxStreak || 0,
      responseTimes: state.questionTimes || {},
      categoryPerformance: state.categoryScores,
      metadata: {
        mode: config.mode,
        practiceMode: config.practiceMode,
        score: state.score,
        correctAnswers: state.correctAnswers,
        timeRemaining: state.timeRemaining,
        ...context.metadata
      },
      startedAt: state.startTime,
      lastUpdatedAt: Date.now()
    }
  }

  /**
   * Convert enhanced storage format to V2 quiz state
   */
  private convertFromEnhancedState(
    enhancedState: EnhancedQuizState,
    currentState: QuizState
  ): Partial<QuizState> {
    return {
      currentQuestionIndex: enhancedState.currentQuestionIndex,
      answers: enhancedState.answers,
      streak: enhancedState.streak,
      maxStreak: enhancedState.maxStreak,
      questionTimes: enhancedState.responseTimes,
      categoryScores: enhancedState.categoryPerformance,
      score: enhancedState.metadata?.score || 0,
      correctAnswers: enhancedState.metadata?.correctAnswers || 0,
      timeRemaining: enhancedState.metadata?.timeRemaining,
      startTime: enhancedState.startedAt
    }
  }

  /**
   * Save current quiz state to storage
   * Only saves if state has meaningfully changed to prevent excessive writes
   */
  async saveProgress(
    state: QuizState,
    config: QuizConfig,
    context: QuizPluginContext
  ): Promise<void> {
    try {
      // Convert to enhanced state format
      const enhancedState = this.convertToEnhancedState(state, config, context)
      
      // Check if state has changed (simple JSON comparison)
      const currentStateStr = JSON.stringify({
        currentQuestionIndex: enhancedState.currentQuestionIndex,
        answers: enhancedState.answers,
        score: enhancedState.metadata?.score
      })
      
      if (currentStateStr === this.lastSavedState) {
        return // No changes, skip save
      }
      
      // Save to storage
      const result = await this.progressManager.save(enhancedState)
      
      if (result.success) {
        this.lastSavedState = currentStateStr
        console.log('✅ Progress saved successfully')
      } else {
        console.warn('⚠️ Failed to save progress:', result.error)
      }
    } catch (error) {
      console.error('❌ Error saving progress:', error)
    }
  }

  /**
   * Save individual question response
   */
  async saveQuestionResponse(
    questionId: string,
    questionIndex: number,
    answer: string,
    isCorrect: boolean,
    timeSpent?: number
  ): Promise<void> {
    try {
      const response: QuestionResponse = {
        questionId,
        questionIndex,
        userAnswer: answer,
        isCorrect,
        timeSpentSeconds: timeSpent
      }
      
      await this.progressManager.saveQuestionResponse(this.options.sessionId, response)
    } catch (error) {
      console.error('❌ Error saving question response:', error)
    }
  }

  /**
   * Load saved progress for a session
   */
  async loadProgress(): Promise<Partial<QuizState> | null> {
    try {
      const enhancedState = await this.progressManager.load(this.options.sessionId)
      
      if (!enhancedState) {
        return null
      }
      
      // Check if the saved state is for the same topic
      if (this.options.topicId && enhancedState.topicId !== this.options.topicId) {
        console.warn('⚠️ Saved progress is for different topic, ignoring')
        return null
      }
      
      // Convert to V2 state format (partial state to merge)
      const v2State = this.convertFromEnhancedState(enhancedState, {} as QuizState)
      
      console.log('✅ Progress loaded successfully:', {
        questionIndex: v2State.currentQuestionIndex,
        answeredQuestions: Object.keys(v2State.answers || {}).length
      })
      
      return v2State
    } catch (error) {
      console.error('❌ Error loading progress:', error)
      return null
    }
  }

  /**
   * Clear saved progress (called on quiz completion)
   */
  async clearProgress(): Promise<void> {
    try {
      await this.progressManager.clear(this.options.sessionId)
      this.lastSavedState = ''
      console.log('✅ Progress cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing progress:', error)
    }
  }

  /**
   * Check if quiz was recently completed
   */
  static isQuizRecentlyCompleted(topicId: string): boolean {
    return EnhancedProgressStorage.isQuizRecentlyCompleted(topicId)
  }

  /**
   * Migrate guest session to authenticated user
   */
  async migrateToUser(userId: string): Promise<void> {
    if (this.options.guestToken && !this.options.userId) {
      try {
        await this.progressManager.migrateFromGuest(
          this.options.sessionId,
          this.options.guestToken,
          userId
        )
        this.options.userId = userId
        this.options.guestToken = undefined
        console.log('✅ Progress migrated to user successfully')
      } catch (error) {
        console.error('❌ Error migrating progress to user:', error)
      }
    }
  }
}

/**
 * Hook for using progress adapter in quiz components
 */
export function useProgressAdapter(options: ProgressAdapterOptions) {
  const adapter = new EnhancedProgressAdapter(options)
  
  return {
    saveProgress: adapter.saveProgress.bind(adapter),
    saveQuestionResponse: adapter.saveQuestionResponse.bind(adapter),
    loadProgress: adapter.loadProgress.bind(adapter),
    clearProgress: adapter.clearProgress.bind(adapter),
    migrateToUser: adapter.migrateToUser.bind(adapter),
    isRecentlyCompleted: EnhancedProgressAdapter.isQuizRecentlyCompleted
  }
} 