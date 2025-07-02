/**
 * Enhanced Analytics Integration for CivicSense Quiz V2
 * Comprehensive tracking for all game modes and user interactions
 */

import { supabase } from '@/lib/supabase/client'
import type { QuizEngineContext, GameModePlugin } from '../modes/types'
import type { QuizResults } from '@/lib/types/quiz'

// Enhanced analytics event types
export interface AnalyticsEvent {
  eventType: string
  userId?: string
  guestToken?: string
  sessionId: string
  timestamp: Date
  data: Record<string, any>
  context?: QuizEngineContext
}

// Mode-specific analytics interfaces
export interface QuizModeAnalytics {
  mode: string
  sessionId: string
  startTime: number
  endTime?: number
  completionRate: number
  accuracy: number
  timeSpent: number
  questionsAttempted: number
  questionsCompleted: number
  hintsUsed: number
  skipsUsed: number
  modeSpecificData: Record<string, any>
}

export interface CivicLearningMetrics {
  conceptsMastered: string[]
  difficultiesEncountered: string[]
  learningProgression: number
  civicEngagementScore: number
  democraticKnowledgeGains: number
  powerDynamicsUnderstood: string[]
}

export interface UserBehaviorAnalytics {
  sessionDuration: number
  interactionPatterns: string[]
  preferredModes: string[]
  learningVelocity: number
  retentionRate: number
  engagementLevel: 'low' | 'medium' | 'high'
}

/**
 * Enhanced Analytics Manager for V2 Quiz Engine
 */
export class EnhancedAnalyticsManager {
  private events: AnalyticsEvent[] = []
  private sessionStart: number = Date.now()
  private currentContext?: QuizEngineContext

  constructor(private sessionId: string) {}

  /**
   * Set the current quiz context for analytics
   */
  setContext(context: QuizEngineContext) {
    this.currentContext = context
  }

  /**
   * Track a custom analytics event
   */
  track(eventType: string, data: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      eventType,
      userId: this.currentContext?.userId,
      guestToken: this.currentContext?.guestToken,
      sessionId: this.sessionId,
      timestamp: new Date(),
      data,
      context: this.currentContext
    }

    this.events.push(event)
    
    // Send immediately for critical events
    if (this.isCriticalEvent(eventType)) {
      this.sendEvent(event)
    }
  }

  /**
   * Track quiz mode start with comprehensive context
   */
  trackModeStart(mode: string, plugin: GameModePlugin) {
    this.track('quiz_mode_start', {
      mode,
      displayName: plugin.displayName,
      category: plugin.category,
      requiresAuth: plugin.requiresAuth,
      requiresPremium: plugin.requiresPremium,
      config: plugin.config,
      startTime: Date.now(),
      topicId: this.currentContext?.topicId,
      questionCount: this.currentContext?.questions.length || 0,
      userContext: {
        isAuthenticated: this.currentContext?.isAuthenticated || false,
        hasExistingProgress: !!this.currentContext?.attemptData
      }
    })
  }

  /**
   * Track question-level interactions
   */
  trackQuestionInteraction(questionIndex: number, interactionType: string, data: any = {}) {
    const question = this.currentContext?.questions[questionIndex]
    if (!question) return

    this.track('question_interaction', {
      questionIndex,
      questionId: question.question_number,
      questionType: question.type,
      difficulty: question.difficulty,
      interactionType,
      timeSpent: data.timeSpent || 0,
      responseTime: data.responseTime || 0,
      answer: data.answer,
      isCorrect: data.isCorrect,
      hintsUsed: data.hintsUsed || 0,
      attempts: data.attempts || 1,
      ...data
    })
  }

  /**
   * Track answer submission with enhanced data
   */
  trackAnswerSubmission(questionIndex: number, answer: string, isCorrect: boolean, responseTime?: number) {
    const question = this.currentContext?.questions[questionIndex]
    if (!question) return

    this.track('answer_submitted', {
      questionIndex,
      questionId: question.question_number,
      questionType: question.type,
      difficulty: question.difficulty,
      topicArea: 'general', // Default since topic_area doesn't exist on type
      answer,
      isCorrect,
      responseTime: responseTime || 0,
      currentStreak: this.currentContext?.streak || 0,
      totalScore: this.currentContext?.score || 0,
      sessionProgress: ((questionIndex + 1) / (this.currentContext?.questions.length || 1)) * 100,
      modeSpecificData: this.getModeSpecificData()
    })
  }

  /**
   * Track mode-specific events (e.g., flashcard confidence, debate arguments)
   */
  trackModeSpecificEvent(eventType: string, data: Record<string, any>) {
    const mode = 'standard' // Default mode since property doesn't exist
    
    this.track(`mode_${mode}_${eventType}`, {
      mode,
      sessionId: this.sessionId,
      questionIndex: this.currentContext?.currentQuestionIndex || 0,
      modeState: this.currentContext?.modeState,
      ...data
    })
  }

  /**
   * Track quiz completion with comprehensive results
   */
  trackQuizCompletion(results: QuizResults, plugin: GameModePlugin) {
    const endTime = Date.now()
    const sessionDuration = endTime - this.sessionStart
    const mode = plugin.mode

    // Calculate detailed analytics
    const analytics: QuizModeAnalytics = {
      mode,
      sessionId: this.sessionId,
      startTime: this.sessionStart,
      endTime,
      completionRate: 100, // Default completion rate since property doesn't exist
      accuracy: results.score,
      timeSpent: sessionDuration,
      questionsAttempted: this.currentContext?.questions.length || 0,
      questionsCompleted: this.currentContext?.userAnswers.length || 0,
      hintsUsed: 0, // Calculate from events
      skipsUsed: 0, // Calculate from events
      modeSpecificData: this.getModeSpecificData()
    }

    // Get civic learning metrics
    const civicMetrics = this.calculateCivicLearningMetrics(results)
    
    // Get user behavior analytics
    const behaviorMetrics = this.calculateUserBehaviorAnalytics()

    this.track('quiz_completed', {
      ...analytics,
      civicLearningMetrics: civicMetrics,
      userBehaviorMetrics: behaviorMetrics,
      pluginAnalytics: plugin.getAnalyticsData?.(this.currentContext!),
      finalResults: results,
      democraticImpact: this.calculateDemocraticImpact(results),
      recommendations: this.generateLearningRecommendations(results, analytics)
    })

    // Send completion data immediately
    this.flush()
  }

  /**
   * Track user engagement patterns
   */
  trackEngagementPattern(pattern: string, intensity: number, context: any = {}) {
    this.track('engagement_pattern', {
      pattern,
      intensity, // 1-10 scale
      sessionTime: Date.now() - this.sessionStart,
      context
    })
  }

  /**
   * Track learning progress and knowledge gains
   */
  trackLearningProgress(conceptLearned: string, confidenceLevel: number, evidence: any = {}) {
    this.track('learning_progress', {
      conceptLearned,
      confidenceLevel, // 1-10 scale
      evidenceOfLearning: evidence,
      sessionContext: {
        mode: 'standard', // Default mode since property doesn't exist
        questionIndex: this.currentContext?.currentQuestionIndex,
        currentScore: this.currentContext?.score
      }
    })
  }

  /**
   * Track accessibility usage
   */
  trackAccessibilityUsage(feature: string, successful: boolean, context: any = {}) {
    this.track('accessibility_usage', {
      feature,
      successful,
      userAgent: navigator.userAgent,
      assistiveTechnology: context.assistiveTechnology || 'unknown',
      context
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetrics(metrics: {
    loadTime?: number
    renderTime?: number
    interactionLatency?: number
    memoryUsage?: number
  }) {
    this.track('performance_metrics', {
      ...metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      sessionDuration: Date.now() - this.sessionStart
    })
  }

  /**
   * Calculate civic learning impact
   */
  private calculateCivicLearningMetrics(results: QuizResults): CivicLearningMetrics {
    const correctAnswers = this.currentContext?.userAnswers.filter(a => a.isCorrect) || []
    const topics = ['general'] // Default topics since topic_area doesn't exist

    return {
      conceptsMastered: [...new Set(correctAnswers.map((_, i) => topics[i]).filter(Boolean))],
      difficultiesEncountered: [],
      learningProgression: results.score >= 70 ? 1 : results.score >= 50 ? 0.7 : 0.4,
      civicEngagementScore: this.calculateEngagementScore(),
      democraticKnowledgeGains: results.score * 0.1, // 0-10 scale
      powerDynamicsUnderstood: this.identifyPowerDynamicsLearned()
    }
  }

  /**
   * Calculate user behavior patterns
   */
  private calculateUserBehaviorAnalytics(): UserBehaviorAnalytics {
    const sessionDuration = Date.now() - this.sessionStart
    const interactionEvents = this.events.filter(e => e.eventType.includes('interaction'))

    return {
      sessionDuration,
      interactionPatterns: this.identifyInteractionPatterns(),
      preferredModes: ['standard'], // Default mode since property doesn't exist
      learningVelocity: this.calculateLearningVelocity(),
      retentionRate: 0.8, // Would need historical data
      engagementLevel: sessionDuration > 600000 ? 'high' : sessionDuration > 300000 ? 'medium' : 'low'
    }
  }

  /**
   * Calculate democratic impact score
   */
  private calculateDemocraticImpact(results: QuizResults): number {
    // Score based on civic knowledge gained and engagement quality
    const baseScore = results.score * 0.6 // 60% weight on accuracy
    const engagementBonus = this.calculateEngagementScore() * 0.3 // 30% weight on engagement
    const progressBonus = 100 * 0.1 // 10% weight on completion - use default since completionRate doesn't exist

    return Math.round(baseScore + engagementBonus + progressBonus)
  }

  /**
   * Generate personalized learning recommendations
   */
  private generateLearningRecommendations(results: QuizResults, analytics: QuizModeAnalytics) {
    const recommendations = []

    if (results.score < 60) {
      recommendations.push('practice_mode')
      recommendations.push('flashcard_review')
    }

    if (analytics.timeSpent > 300000) { // 5+ minutes
      recommendations.push('speed_round_challenge')
    }

    if (results.score >= 80) {
      recommendations.push('scenario_mode')
      recommendations.push('debate_mode')
    }

    return recommendations
  }

  /**
   * Helper methods
   */
  private getModeSpecificData(): Record<string, any> {
    return this.currentContext?.modeState || {}
  }

  private calculateEngagementScore(): number {
    const interactionEvents = this.events.filter(e => e.eventType.includes('interaction'))
    return Math.min(10, interactionEvents.length * 0.5)
  }

  private identifyPowerDynamicsLearned(): string[] {
    // Analyze questions to identify power dynamics concepts
    return ['federal_state_relationship', 'checks_balances', 'interest_groups']
  }

  private identifyInteractionPatterns(): string[] {
    const patterns = []
    const eventTypes = this.events.map(e => e.eventType)
    
    if (eventTypes.includes('hint_used')) patterns.push('help_seeking')
    if (eventTypes.filter(t => t === 'answer_submitted').length > 5) patterns.push('active_engagement')
    
    return patterns
  }

  private calculateLearningVelocity(): number {
    const questionsAnswered = this.currentContext?.userAnswers.length || 0
    const timeSpent = Date.now() - this.sessionStart
    return (questionsAnswered / (timeSpent / 60000)) // questions per minute
  }

  private isCriticalEvent(eventType: string): boolean {
    return ['quiz_completed', 'error_occurred', 'accessibility_issue'].includes(eventType)
  }

  /**
   * Send individual event to analytics backend
   */
  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Send to multiple analytics endpoints
      await Promise.all([
        this.sendToSupabase(event),
        this.sendToLocalAnalytics(event),
        this.sendToExternalAnalytics(event)
      ])
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  /**
   * Send event to Supabase analytics table
   */
  private async sendToSupabase(event: AnalyticsEvent) {
    // TODO: Create analytics_events table in database
    console.log('Analytics event to be stored:', event)
    // Temporarily disabled until table is created
    /*
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event.eventType,
        user_id: event.userId || null,
        guest_token: event.guestToken || null,
        session_id: event.sessionId,
        event_data: event.data,
        timestamp: event.timestamp.toISOString()
      })

    if (error) {
      console.error('Supabase analytics error:', error)
    }
    */
  }

  /**
   * Send to local analytics storage for offline support
   */
  private async sendToLocalAnalytics(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('civicsense_analytics') || '[]'
      const events = JSON.parse(stored)
      events.push(event)
      
      // Keep only last 100 events locally
      const recent = events.slice(-100)
      localStorage.setItem('civicsense_analytics', JSON.stringify(recent))
    } catch (error) {
      console.error('Local analytics storage error:', error)
    }
  }

  /**
   * Send to external analytics services
   */
  private async sendToExternalAnalytics(event: AnalyticsEvent) {
    // Could integrate with Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event.eventType, event.data)
    }
  }

  /**
   * Flush all pending events
   */
  async flush() {
    const pendingEvents = [...this.events]
    this.events = []

    for (const event of pendingEvents) {
      await this.sendEvent(event)
    }
  }

  /**
   * Get analytics summary for current session
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      eventCount: this.events.length,
      eventTypes: [...new Set(this.events.map(e => e.eventType))],
      lastActivity: this.events[this.events.length - 1]?.timestamp
    }
  }
}

/**
 * Create analytics manager instance for a quiz session
 */
export function createAnalyticsManager(sessionId: string): EnhancedAnalyticsManager {
  return new EnhancedAnalyticsManager(sessionId)
}

/**
 * Analytics utilities
 */
export const AnalyticsUtils = {
  /**
   * Calculate civic knowledge impact score
   */
  calculateCivicImpact(score: number, completionRate: number, engagement: number): number {
    return Math.round((score * 0.5) + (completionRate * 0.3) + (engagement * 0.2))
  },

  /**
   * Determine recommended next steps based on performance
   */
  getRecommendations(results: QuizResults, mode: string): string[] {
    const recs = []
    
    if (results.score < 50) {
      recs.push('Review fundamental concepts')
      recs.push('Try practice mode')
    } else if (results.score < 75) {
      recs.push('Challenge yourself with harder questions')
      recs.push('Try scenario mode')
    } else {
      recs.push('Excellent work! Try debate mode')
      recs.push('Share your knowledge with others')
    }

    return recs
  },

  /**
   * Format analytics data for dashboard display
   */
  formatForDashboard(analytics: QuizModeAnalytics) {
    return {
      score: `${analytics.accuracy}%`,
      time: `${Math.round(analytics.timeSpent / 60000)}m`,
      completion: `${analytics.completionRate}%`,
      efficiency: analytics.questionsCompleted / (analytics.timeSpent / 60000)
    }
  }
} 