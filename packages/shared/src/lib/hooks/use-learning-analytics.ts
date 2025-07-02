'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

// ============================================================================
// TYPES & INTERFACES  
// ============================================================================

interface LearningInsight {
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
      trend: 'improving' | 'declining' | 'stable'
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
  }
  comparative_analytics: {
    peer_comparison: {
      percentile_rank: number
      average_peer_score: number
      user_score: number
      performance_gap: number
    }
  }
  real_time_updates: {
    last_activity: string | null
    recent_improvements: string[]
    active_learning_session: boolean
  }
}

interface AnalyticsState {
  insights: LearningInsight | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface AnalyticsHookOptions {
  enableRealTime?: boolean
  refreshInterval?: number
  cacheTimeout?: number
}

// ============================================================================
// CROSS-PLATFORM ANALYTICS SERVICE
// ============================================================================

class CrossPlatformAnalyticsService {
  private cache = new Map<string, { data: LearningInsight; timestamp: number }>()
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  async getLearningInsights(userId: string): Promise<LearningInsight | null> {
    try {
      // Check cache first
      const cached = this.getCachedInsights(userId)
      if (cached) return cached

      // Determine platform and use appropriate endpoint
      const isWeb = typeof window !== 'undefined' && !(window as any).ReactNativeWebView
      const endpoint = isWeb 
        ? `/api/analytics/learning-insights?user_id=${userId}`
        : `/api/mobile/analytics/learning-insights?user_id=${userId}` // Future mobile API

      const response = await fetch(endpoint)
      
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
      console.error('Error fetching cross-platform insights:', error)
      return null
    }
  }

  private getCachedInsights(userId: string): LearningInsight | null {
    const cached = this.cache.get(userId)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TIMEOUT
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

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }

  // Cross-platform sync utilities
  async syncAnalytics(userId: string): Promise<void> {
    // Clear cache to force fresh fetch
    this.clearCache(userId)
    await this.getLearningInsights(userId)
  }

  // Real-time update management
  subscribeToUpdates(
    userId: string, 
    callback: (insights: LearningInsight) => void,
    interval: number = 30000
  ): () => void {
    const intervalId = setInterval(async () => {
      const insights = await this.getLearningInsights(userId)
      if (insights) {
        callback(insights)
      }
    }, interval)

    return () => clearInterval(intervalId)
  }
}

const analyticsService = new CrossPlatformAnalyticsService()

// ============================================================================
// UNIFIED ANALYTICS HOOK
// ============================================================================

export function useLearningAnalytics(options: AnalyticsHookOptions = {}) {
  const { user } = useAuth()
  const [state, setState] = useState<AnalyticsState>({
    insights: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  })

  const {
    enableRealTime = false,
    refreshInterval = 30000,
    cacheTimeout = 5 * 60 * 1000
  } = options

  // Load insights function
  const loadInsights = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false, error: 'User not authenticated' }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      if (forceRefresh) {
        analyticsService.clearCache(user.id)
      }

      const insights = await analyticsService.getLearningInsights(user.id)

      if (insights) {
        setState({
          insights,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        })
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No analytics data available. Complete some quizzes to see insights!'
        }))
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load analytics. Please try again.'
      }))
    }
  }, [user?.id])

  // Refresh function
  const refresh = useCallback(() => {
    loadInsights(true)
  }, [loadInsights])

  // Sync across platforms
  const syncAcrossPlatforms = useCallback(async () => {
    if (!user?.id) return

    try {
      await analyticsService.syncAnalytics(user.id)
      await loadInsights(true)
    } catch (error) {
      console.error('Error syncing analytics:', error)
    }
  }, [user?.id, loadInsights])

  // Initial load effect
  useEffect(() => {
    if (user?.id) {
      loadInsights()
    } else {
      setState({
        insights: null,
        isLoading: false,
        error: null,
        lastUpdated: null
      })
    }
  }, [user?.id, loadInsights])

  // Real-time updates effect
  useEffect(() => {
    if (!enableRealTime || !user?.id || !state.insights) return

    const unsubscribe = analyticsService.subscribeToUpdates(
      user.id,
      (insights) => {
        setState(prev => ({
          ...prev,
          insights,
          lastUpdated: new Date()
        }))
      },
      refreshInterval
    )

    return unsubscribe
  }, [enableRealTime, user?.id, state.insights, refreshInterval])

  // Derived state
  const hasData = Boolean(state.insights)
  const isActive = state.insights?.real_time_updates.active_learning_session || false
  const lastActivity = state.insights?.real_time_updates.last_activity 
    ? new Date(state.insights.real_time_updates.last_activity)
    : null

  // Analytics summary for quick access
  const summary = state.insights ? {
    overallScore: state.insights.learning_trajectory.current_level.overall_score,
    level: state.insights.learning_trajectory.current_level.level_name,
    questionsAnswered: state.insights.performance_analytics.total_questions_answered,
    currentStreak: state.insights.performance_analytics.streak_analytics.current_streak,
    improvementRate: state.insights.learning_trajectory.growth_projection.improvement_rate,
    confidenceLevel: state.insights.cognitive_patterns.confidence_metrics.quick_correct_percentage,
    highPriorityActions: state.insights.personalized_recommendations.immediate_actions
      .filter(action => action.priority === 'high').length,
    interventionAlerts: state.insights.personalized_recommendations.intervention_alerts.length
  } : null

  return {
    // Core state
    insights: state.insights,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Derived state
    hasData,
    isActive,
    lastActivity,
    summary,
    
    // Actions
    refresh,
    loadInsights,
    syncAcrossPlatforms,
    
    // Analytics utilities
    getTopicConfidence: (topic: string) => {
      const topicData = state.insights?.cognitive_patterns.confidence_metrics.confidence_by_topic
        .find(t => t.topic === topic)
      return topicData?.confidence || 0
    },
    
    getSkillProgress: (skillArea: string) => {
      const skill = state.insights?.learning_trajectory.skill_breakdown
        .find(s => s.skill_area === skillArea)
      return skill?.progress_percentage || 0
    },
    
    getRecommendationsByPriority: (priority: 'high' | 'medium' | 'low') => {
      return state.insights?.personalized_recommendations.immediate_actions
        .filter(action => action.priority === priority) || []
    },
    
    // Platform detection
    isPlatformWeb: typeof window !== 'undefined' && !(window as any).ReactNativeWebView,
    isPlatformMobile: typeof window !== 'undefined' && Boolean((window as any).ReactNativeWebView),
    
    // Cache management
    clearCache: () => analyticsService.clearCache(user?.id),
    
    // Service access for advanced usage
    analyticsService
  }
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useRealTimeLearningAnalytics() {
  return useLearningAnalytics({
    enableRealTime: true,
    refreshInterval: 30000
  })
}

export function useLearningAnalyticsSummary() {
  const { summary, isLoading, error } = useLearningAnalytics()
  return { summary, isLoading, error }
}

export function useLearningProgress() {
  const { insights, isLoading } = useLearningAnalytics()
  
  const progress = insights ? {
    currentLevel: insights.learning_trajectory.current_level,
    growthProjection: insights.learning_trajectory.growth_projection,
    skillBreakdown: insights.learning_trajectory.skill_breakdown,
    nextMilestone: insights.learning_trajectory.growth_projection.time_to_next_level
  } : null

  return { progress, isLoading }
}

export function useLearningRecommendations() {
  const { insights, isLoading } = useLearningAnalytics()
  
  const recommendations = insights ? {
    immediateActions: insights.personalized_recommendations.immediate_actions,
    interventionAlerts: insights.personalized_recommendations.intervention_alerts,
    highPriorityCount: insights.personalized_recommendations.immediate_actions
      .filter(action => action.priority === 'high').length,
    hasUrgentAlerts: insights.personalized_recommendations.intervention_alerts
      .some(alert => alert.urgency === 'immediate')
  } : null

  return { recommendations, isLoading }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default useLearningAnalytics 