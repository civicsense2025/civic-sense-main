import React from 'react'
import { useStatsig } from '@/components/providers/statsig-provider'
import { useAuth } from '@/components/auth/auth-provider'

// Session management
let sessionId: string | null = null
const getSessionId = () => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return sessionId
}

// Time utilities
const getTimeOfDay = () => {
  const hour = new Date().getHours()
  if (hour < 6) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const getDayOfWeek = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

// Main analytics hook
export const useAnalytics = () => {
  const { logEvent, isReady } = useStatsig()
  const { user } = useAuth()

  const baseEventData = {
    user_id: user?.id || 'anonymous',
    user_email: user?.email || null,
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    time_of_day: getTimeOfDay(),
    day_of_week: getDayOfWeek(),
  }

  // Authentication & Onboarding Events
  const trackAuth = {
    userRegistered: (method: 'google' | 'email', source?: string) => {
      if (!isReady) return
      logEvent('user_registered', 1, {
        ...baseEventData,
        registration_method: method,
        source: source || 'direct'
      })
    },

    userLogin: (method: 'google' | 'email', sessionDurationPrevious?: number, daysSinceLastLogin?: number) => {
      if (!isReady) return
      logEvent('user_login', 1, {
        ...baseEventData,
        login_method: method,
        session_duration_previous: sessionDurationPrevious || 0,
        days_since_last_login: daysSinceLastLogin || 0
      })
    },

    onboardingStarted: (userType: 'new' | 'returning', entryPoint: string) => {
      if (!isReady) return
      logEvent('onboarding_started', 1, {
        ...baseEventData,
        user_type: userType,
        entry_point: entryPoint
      })
    },

    onboardingCompleted: (completionTimeSeconds: number, stepsCompleted: number, stepsSkipped: string[] = []) => {
      if (!isReady) return
      logEvent('onboarding_completed', 1, {
        ...baseEventData,
        completion_time_seconds: completionTimeSeconds,
        steps_completed: stepsCompleted,
        steps_skipped: stepsSkipped
      })
    }
  }

  // Quiz & Learning Events
  const trackQuiz = {
    started: (quizData: {
      quiz_category: string
      quiz_difficulty: string
      user_level: number
      active_boosts: string[]
      streak_count: number
    }) => {
      if (!isReady) return
      logEvent('quiz_started', 1, {
        ...baseEventData,
        ...quizData
      })
    },

    questionAnswered: (questionData: {
      question_id: string
      question_category: string
      answer_correct: boolean
      response_time_seconds: number
      attempt_number?: number
      hint_used?: boolean
      boost_active?: string | null
      confidence_level?: 1 | 2 | 3 | 4 | 5
    }) => {
      if (!isReady) return
      logEvent('question_answered', 1, {
        ...baseEventData,
        attempt_number: 1,
        hint_used: false,
        boost_active: null,
        confidence_level: 3,
        ...questionData
      })
    },

    completed: (quizData: {
      quiz_id: string
      score_percentage: number
      total_questions: number
      correct_answers: number
      total_time_seconds: number
      boosts_used: string[]
      xp_earned: number
      streak_maintained: boolean
      new_level_reached: boolean
    }) => {
      if (!isReady) return
      logEvent('quiz_completed', 1, {
        ...baseEventData,
        ...quizData
      })
    },

    abandoned: (abandonmentData: {
      quiz_id: string
      questions_answered: number
      total_questions: number
      abandonment_point: 'start' | 'middle' | 'near_end'
      time_spent_seconds: number
      reason: 'timeout' | 'user_exit' | 'technical_issue'
    }) => {
      if (!isReady) return
      logEvent('quiz_abandoned', 1, {
        ...baseEventData,
        ...abandonmentData
      })
    }
  }

  // Gamification & Boost Events
  const trackGameification = {
    boostPurchased: (boostData: {
      boost_type: string
      boost_cost_xp: number
      user_xp_before: number
      user_level: number
      purchase_context: 'pre_quiz' | 'mid_quiz' | 'post_quiz' | 'browse'
    }) => {
      if (!isReady) return
      logEvent('boost_purchased', 1, {
        ...baseEventData,
        ...boostData
      })
    },

    boostActivated: (activationData: {
      boost_type: string
      activation_context: 'quiz_start' | 'mid_quiz' | 'specific_question'
      user_performance_before: number
      remaining_uses: number
    }) => {
      if (!isReady) return
      logEvent('boost_activated', 1, {
        ...baseEventData,
        ...activationData
      })
    },

    boostEffectMeasured: (effectData: {
      boost_type: string
      performance_improvement: number
      questions_affected: number
      user_satisfaction: 1 | 2 | 3 | 4 | 5
    }) => {
      if (!isReady) return
      logEvent('boost_effect_measured', 1, {
        ...baseEventData,
        ...effectData
      })
    },

    achievementUnlocked: (achievementData: {
      achievement_type: string
      achievement_category: 'quiz' | 'streak' | 'social' | 'learning'
      days_to_unlock: number
      user_level: number
      total_achievements: number
    }) => {
      if (!isReady) return
      logEvent('achievement_unlocked', 1, {
        ...baseEventData,
        ...achievementData
      })
    },

    levelUp: (levelData: {
      new_level: number
      xp_total: number
      days_to_level_up: number
      primary_activity: 'quiz' | 'daily_streak' | 'achievements'
    }) => {
      if (!isReady) return
      logEvent('level_up', 1, {
        ...baseEventData,
        ...levelData
      })
    }
  }

  // Engagement & Retention Events
  const trackEngagement = {
    streakMaintained: (streakData: {
      streak_count: number
      activity_type: 'quiz' | 'reading' | 'discussion'
      time_since_last_activity_hours: number
      streak_motivation: 'notification' | 'habit' | 'reminder' | 'social'
    }) => {
      if (!isReady) return
      logEvent('daily_streak_maintained', 1, {
        ...baseEventData,
        ...streakData
      })
    },

    streakBroken: (breakData: {
      streak_count_lost: number
      days_since_last_activity: number
      last_activity_type: string
      user_reaction?: 'disappointed' | 'motivated' | 'indifferent'
    }) => {
      if (!isReady) return
      logEvent('daily_streak_broken', 1, {
        ...baseEventData,
        user_reaction: 'indifferent',
        ...breakData
      })
    },

    audioContentPlayed: (audioData: {
      content_type: 'quiz_question' | 'explanation' | 'hint'
      duration_seconds: number
      completion_percentage: number
      user_initiated: boolean
      accessibility_feature: boolean
    }) => {
      if (!isReady) return
      logEvent('audio_content_played', 1, {
        ...baseEventData,
        ...audioData
      })
    },

    contentShared: (shareData: {
      content_type: 'quiz_result' | 'achievement' | 'streak'
      share_platform: 'twitter' | 'facebook' | 'copy_link'
      content_score?: number
      user_level: number
    }) => {
      if (!isReady) return
      logEvent('content_shared', 1, {
        ...baseEventData,
        content_score: 0,
        ...shareData
      })
    }
  }

  // Feature Adoption Events
  const trackFeatures = {
    discovered: (discoveryData: {
      feature_name: string
      discovery_method: 'tutorial' | 'exploration' | 'tooltip' | 'accident'
      time_to_discovery_days: number
      user_experience_level: 1 | 2 | 3 | 4 | 5
    }) => {
      if (!isReady) return
      logEvent('feature_discovered', 1, {
        ...baseEventData,
        ...discoveryData
      })
    },

    firstUse: (usageData: {
      feature_name: string
      time_since_discovery_minutes: number
      success: boolean
      user_satisfaction: 1 | 2 | 3 | 4 | 5
    }) => {
      if (!isReady) return
      logEvent('feature_first_use', 1, {
        ...baseEventData,
        ...usageData
      })
    },

    settingsChanged: (settingData: {
      setting_category: 'notifications' | 'audio' | 'difficulty' | 'privacy'
      setting_name: string
      old_value: string
      new_value: string
      change_reason: 'preference' | 'accessibility' | 'performance'
    }) => {
      if (!isReady) return
      logEvent('settings_changed', 1, {
        ...baseEventData,
        ...settingData
      })
    }
  }

  // Generic event tracking
  const trackCustomEvent = (eventName: string, value: string | number = 1, metadata: Record<string, any> = {}) => {
    if (!isReady) return
    logEvent(eventName, value, {
      ...baseEventData,
      ...metadata
    })
  }

  // Page/Screen tracking
  const trackPageView = (pageName: string, additionalData: Record<string, any> = {}) => {
    if (!isReady) return
    logEvent('page_view', 1, {
      ...baseEventData,
      page_name: pageName,
      ...additionalData
    })
  }

  // Error tracking
  const trackError = (errorType: string, errorMessage: string, context: Record<string, any> = {}) => {
    if (!isReady) return
    logEvent('error_occurred', 1, {
      ...baseEventData,
      error_type: errorType,
      error_message: errorMessage,
      ...context
    })
  }

  return {
    // Event categories
    trackAuth,
    trackQuiz,
    trackGameification,
    trackEngagement,
    trackFeatures,
    
    // Utility functions
    trackCustomEvent,
    trackPageView,
    trackError,
    
    // State
    isReady,
    sessionId: getSessionId()
  }
}

// Validation schemas using Zod
import { z } from 'zod'

export const QuizEventSchema = z.object({
  quiz_id: z.string(),
  category: z.string(),
  score: z.number().min(0).max(100),
  duration_seconds: z.number().positive(),
  boosts_used: z.array(z.string()),
  user_level: z.number().positive()
})

export const BoostEventSchema = z.object({
  boost_type: z.string(),
  boost_cost_xp: z.number().positive(),
  user_level: z.number().positive(),
  context: z.string()
})

// Event validation function
export const validateEvent = (eventName: string, data: any): boolean => {
  try {
    switch (eventName) {
      case 'quiz_completed':
        QuizEventSchema.parse(data)
        break
      case 'boost_purchased':
        BoostEventSchema.parse(data)
        break
      // Add more validations as needed
      default:
        return true
    }
    return true
  } catch (error) {
    console.error(`Event validation failed for ${eventName}:`, error)
    return false
  }
}

// Higher-order component for automatic page tracking
export const withPageTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pageName: string
): React.ComponentType<P> => {
  const TrackedComponent: React.FC<P> = (props: P) => {
    const { trackPageView } = useAnalytics()
    
    React.useEffect(() => {
      trackPageView(pageName)
    }, [trackPageView])
    
    return React.createElement(WrappedComponent, props)
  }
  
  return TrackedComponent
} 