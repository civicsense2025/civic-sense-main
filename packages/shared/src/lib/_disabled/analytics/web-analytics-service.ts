/**
 * Web Analytics Service Library
 * Client-side service for accessing learning analytics with cross-platform sync
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LearningInsight {
  user_id: string
  analysis_timestamp: string
  cognitive_patterns: {
    processing_speed: {
      average_response_time: number
      fast_questions_percentage: number
      slow_questions_percentage: number
      speed_trend: 'improving' | 'declining' | 'stable'
      speed_distribution: Array<{ range: string; count: number; percentage: number }>
    }
    confidence_metrics: {
      quick_correct_percentage: number
      hesitation_index: number
      confidence_trend: 'improving' | 'declining' | 'stable'
      confidence_by_topic: Array<{ topic: string; confidence: number }>
    }
    learning_style: {
      preferred_question_types: Array<{ type: string; accuracy: number; preference_score: number }>
      visual_vs_textual: 'visual' | 'textual' | 'balanced'
      learning_pattern: 'sequential' | 'random' | 'adaptive'
    }
  }
  learning_trajectory: {
    current_level: {
      overall_score: number
      level_name: 'Novice' | 'Developing' | 'Proficient' | 'Advanced'
      percentile_rank: number
      areas_of_strength: string[]
      improvement_areas: string[]
    }
    growth_projection: {
      improvement_rate: number
      trend: 'accelerating' | 'steady' | 'plateauing' | 'declining'
      projected_score_in_30_days: number
      time_to_next_level: string
    }
    skill_breakdown: Array<{
      skill_area: string
      current_score: number
      target_score: number
      progress_percentage: number
      recent_trend: 'up' | 'down' | 'stable'
    }>
  }
  personalized_recommendations: {
    immediate_actions: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      reason: string
      expected_impact: string
      confidence: number
      timeframe: string
    }>
    study_plan: {
      recommended_topics: Array<{ topic: string; priority: number; estimated_time: string }>
      optimal_session_length: string
      best_study_times: string[]
      difficulty_progression: string
    }
    intervention_alerts: Array<{
      type: 'warning' | 'opportunity' | 'celebration'
      message: string
      suggested_action: string
      urgency: 'immediate' | 'this_week' | 'this_month'
    }>
  }
  performance_analytics: {
    total_questions_answered: number
    total_time_spent: number
    accuracy_by_topic: Array<{ topic: string; accuracy: number; question_count: number }>
    streak_analytics: { current_streak: number; longest_streak: number; streak_history: number[] }
    recent_sessions: Array<{
      date: string
      questions_answered: number
      accuracy: number
      time_spent: number
      topics_covered: string[]
    }>
  }
  comparative_analytics: {
    peer_comparison: {
      percentile_rank: number
      average_peer_score: number
      user_score: number
      performance_gap: number
    }
    historical_comparison: {
      improvement_since_start: number
      best_month_performance: number
      consistency_score: number
    }
  }
  real_time_updates: {
    last_activity: string | null
    recent_improvements: string[]
    active_learning_session: boolean
    session_progress?: {
      questions_in_session: number
      current_accuracy: number
      session_duration: number
    }
  }
}

export interface AnalyticsOptions {
  includeRealTime?: boolean
  refreshInterval?: number
  cacheTimeout?: number
}

export interface SessionUpdate {
  user_id: string
  action: 'session_start' | 'session_update' | 'session_end'
  data?: any
}

// ============================================================================
// WEB ANALYTICS SERVICE CLASS
// ============================================================================

export class WebAnalyticsService {
  private cache = new Map<string, { data: LearningInsight; timestamp: number }>()
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  async getLearningInsights(userId: string): Promise<LearningInsight | null> {
    try {
      // Check cache first
      const cached = this.getCachedInsights(userId)
      if (cached) return cached

      const response = await fetch(`/api/analytics/learning-insights?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning insights')
      }

      const result = await response.json()
      
      if (result.success) {
        this.cacheInsights(userId, result.data)
        return result.data
      }

      return null
    } catch (error) {
      console.error('Error fetching learning insights:', error)
      return null
    }
  }

  /**
   * Generate analytics summary for quick overview
   */
  generateAnalyticsSummary(insights: LearningInsight): AnalyticsSummary {
    return {
      overall_score: insights.learning_trajectory.current_level.overall_score,
      level_name: insights.learning_trajectory.current_level.level_name,
      questions_answered: insights.performance_analytics.total_questions_answered,
      current_streak: insights.performance_analytics.streak_analytics.current_streak,
      improvement_trend: insights.learning_trajectory.growth_projection.trend,
      top_strength: insights.learning_trajectory.current_level.areas_of_strength[0] || 'None yet',
      main_improvement_area: insights.learning_trajectory.current_level.improvement_areas[0] || 'None identified',
      next_recommendation: insights.personalized_recommendations.immediate_actions[0]?.action || 'Continue learning',
      percentile_rank: insights.comparative_analytics.peer_comparison.percentile_rank,
      time_to_next_level: insights.learning_trajectory.growth_projection.time_to_next_level,
      active_session: insights.real_time_updates.active_learning_session
    }
  }

  /**
   * Get performance trends for charts and visualizations
   */
  getPerformanceTrends(insights: LearningInsight): PerformanceTrends {
    return {
      speed_trend: {
        current: insights.cognitive_patterns.processing_speed.average_response_time,
        trend: insights.cognitive_patterns.processing_speed.speed_trend,
        distribution: insights.cognitive_patterns.processing_speed.speed_distribution
      },
      accuracy_trend: {
        overall: insights.learning_trajectory.current_level.overall_score,
        by_topic: insights.performance_analytics.accuracy_by_topic,
        recent_sessions: insights.performance_analytics.recent_sessions.map(session => ({
          date: session.date,
          accuracy: session.accuracy
        }))
      },
      confidence_trend: {
        quick_correct: insights.cognitive_patterns.confidence_metrics.quick_correct_percentage,
        trend: insights.cognitive_patterns.confidence_metrics.confidence_trend,
        by_topic: insights.cognitive_patterns.confidence_metrics.confidence_by_topic
      },
      skill_progress: insights.learning_trajectory.skill_breakdown.map(skill => ({
        skill: skill.skill_area,
        current: skill.current_score,
        target: skill.target_score,
        progress: skill.progress_percentage,
        trend: skill.recent_trend
      }))
    }
  }

  /**
   * Get actionable insights for immediate display
   */
  getActionableInsights(insights: LearningInsight): ActionableInsight[] {
    const actionables: ActionableInsight[] = []

    // Add immediate actions
    insights.personalized_recommendations.immediate_actions.forEach(action => {
      actionables.push({
        type: 'action',
        priority: action.priority,
        title: action.action,
        description: action.reason,
        impact: action.expected_impact,
        timeframe: action.timeframe,
        confidence: action.confidence
      })
    })

    // Add intervention alerts
    insights.personalized_recommendations.intervention_alerts.forEach(alert => {
      actionables.push({
        type: 'alert',
        priority: alert.urgency === 'immediate' ? 'high' : alert.urgency === 'this_week' ? 'medium' : 'low',
        title: alert.message,
        description: alert.suggested_action,
        impact: alert.type === 'celebration' ? 'Continue current approach' : 'Address to improve performance',
        timeframe: alert.urgency.replace('_', ' '),
        confidence: 90
      })
    })

    return actionables.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Clear analytics cache for a user
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Clean up all subscriptions and intervals
   */
  cleanup(): void {
    // Clear all intervals
    this.refreshIntervals.forEach(intervalId => clearInterval(intervalId))
    this.refreshIntervals.clear()
    
    // Clear subscriptions
    this.subscriptions.clear()
    
    // Clear cache
    this.cache.clear()
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getCachedInsights(userId: string, customTimeout?: number): LearningInsight | null {
    const cached = this.cache.get(userId)
    if (!cached) return null

    const timeout = customTimeout || this.CACHE_TIMEOUT
    const isExpired = Date.now() - cached.timestamp > timeout

    if (isExpired) {
      this.cache.delete(userId)
      return null
    }

    return cached.data
  }

  private cacheInsights(userId: string, data: LearningInsight): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    })
  }

  private setupRealTimeUpdates(userId: string, refreshInterval: number): void {
    // Clear existing interval
    const existingInterval = this.refreshIntervals.get(userId)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Set up new interval
    const intervalId = setInterval(async () => {
      try {
        const freshInsights = await this.getLearningInsights(userId, { 
          includeRealTime: true,
          cacheTimeout: 0 // Force fresh data
        })

        if (freshInsights) {
          // Notify subscribers
          const subscriptionKey = `${userId}-realtime`
          const callback = this.subscriptions.get(subscriptionKey)
          if (callback) {
            callback(freshInsights)
          }
        }
      } catch (error) {
        console.error('Error during real-time update:', error)
      }
    }, refreshInterval)

    this.refreshIntervals.set(userId, intervalId)
  }
}

// ============================================================================
// ADDITIONAL TYPE DEFINITIONS
// ============================================================================

export interface AnalyticsSummary {
  overall_score: number
  level_name: 'Novice' | 'Developing' | 'Proficient' | 'Advanced'
  questions_answered: number
  current_streak: number
  improvement_trend: 'accelerating' | 'steady' | 'plateauing' | 'declining'
  top_strength: string
  main_improvement_area: string
  next_recommendation: string
  percentile_rank: number
  time_to_next_level: string
  active_session: boolean
}

export interface PerformanceTrends {
  speed_trend: {
    current: number
    trend: 'improving' | 'declining' | 'stable'
    distribution: Array<{ range: string; count: number; percentage: number }>
  }
  accuracy_trend: {
    overall: number
    by_topic: Array<{ topic: string; accuracy: number; question_count: number }>
    recent_sessions: Array<{ date: string; accuracy: number }>
  }
  confidence_trend: {
    quick_correct: number
    trend: 'improving' | 'declining' | 'stable'
    by_topic: Array<{ topic: string; confidence: number }>
  }
  skill_progress: Array<{
    skill: string
    current: number
    target: number
    progress: number
    trend: 'up' | 'down' | 'stable'
  }>
}

export interface ActionableInsight {
  type: 'action' | 'alert'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  timeframe: string
  confidence: number
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export singleton instance for use across the application
export const webAnalyticsService = new WebAnalyticsService()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format analytics data for chart consumption
 */
export function formatForCharts(insights: LearningInsight) {
  return {
    speedDistribution: insights.cognitive_patterns.processing_speed.speed_distribution,
    accuracyByTopic: insights.performance_analytics.accuracy_by_topic,
    recentSessions: insights.performance_analytics.recent_sessions,
    skillBreakdown: insights.learning_trajectory.skill_breakdown,
    streakHistory: insights.performance_analytics.streak_analytics.streak_history,
    confidenceByTopic: insights.cognitive_patterns.confidence_metrics.confidence_by_topic
  }
}

/**
 * Generate color themes based on performance levels
 */
export function getPerformanceColors(score: number): { primary: string; secondary: string; background: string } {
  if (score >= 90) {
    return {
      primary: '#059669', // Green
      secondary: '#10B981',
      background: '#ECFDF5'
    }
  } else if (score >= 80) {
    return {
      primary: '#0891B2', // Cyan
      secondary: '#06B6D4', 
      background: '#ECFEFF'
    }
  } else if (score >= 60) {
    return {
      primary: '#F59E0B', // Yellow
      secondary: '#FBBF24',
      background: '#FFFBEB'
    }
  } else {
    return {
      primary: '#DC2626', // Red
      secondary: '#EF4444',
      background: '#FEF2F2'
    }
  }
}

/**
 * Cross-platform data synchronization utility
 */
export async function syncAnalyticsData(userId: string): Promise<LearningInsight | null> {
  return await webAnalyticsService.syncWithMobileAnalytics(userId)
} 