import React from 'react'
import { useStatsig } from '@/components/providers/statsig-provider'
import { useAuth } from '@/components/auth/auth-provider'

// Analytics configuration
const ANALYTICS_CONFIG = {
  // High priority events - always track
  highPriority: [
    'user_registration',
    'user_login', 
    'quiz_completed',
    'achievement_unlocked',
    'level_up',
    'subscription_started',
    'subscription_cancelled',
    'email_sent',
    'email_delivered',
    'email_clicked',
    'email_conversion',
    'error_occurred'
  ],
  
  // Medium priority events - sample these
  mediumPriority: {
    events: [
      'quiz_started',
      'page_view',
      'boost_activated',
      'feature_discovered',
      'email_opened',
      'email_bounced',
      'email_unsubscribed',
      'email_driven_engagement'
    ],
    sampleRate: 0.3 // Track 30% of these events
  },
  
  // Low priority events - minimal sampling
  lowPriority: {
    events: [
      'question_answered',
      'hint_used',
      'button_clicked',
      'scroll_depth'
    ],
    sampleRate: 0.1 // Track 10% of these events
  }
}

// Event sampling utility
function shouldTrackEvent(eventName: string): boolean {
  if (ANALYTICS_CONFIG.highPriority.includes(eventName)) {
    return true
  }
  
  if (ANALYTICS_CONFIG.mediumPriority.events.includes(eventName)) {
    return Math.random() < ANALYTICS_CONFIG.mediumPriority.sampleRate
  }
  
  if (ANALYTICS_CONFIG.lowPriority.events.includes(eventName)) {
    return Math.random() < ANALYTICS_CONFIG.lowPriority.sampleRate
  }
  
  console.warn(`Unknown event type: ${eventName}`)
  return true
}

// Core analytics hook
export const useAnalytics = () => {
  const { user } = useAuth()
  
  // Try to get Statsig context, but provide fallback if not available
  let logEvent: (eventName: string, value: number, metadata: Record<string, any>) => void
  let isReady: boolean
  
  try {
    const statsig = useStatsig()
    logEvent = statsig.logEvent
    isReady = statsig.isReady
  } catch (error) {
    // Fallback when Statsig provider is not available
    logEvent = (eventName: string, value: number, metadata: Record<string, any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Analytics Event (Fallback): ${eventName}`, { value, metadata })
      }
    }
    isReady = true // Always ready in fallback mode
  }

  const trackEvent = (eventName: string, value: number = 1, metadata: Record<string, any> = {}) => {
    if (!shouldTrackEvent(eventName)) {
      return
    }

    const enrichedMetadata = {
      ...metadata,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      platform: 'web'
    }

    logEvent(eventName, value, enrichedMetadata)
  }

  // Quiz tracking
  const trackQuiz = {
    started: (topicId: string, mode: string = 'standard') => {
      trackEvent('quiz_started', 1, { topicId, mode })
    },
    completed: (topicId: string, score: number, timeSpent: number) => {
      trackEvent('quiz_completed', score, { topicId, timeSpent })
    },
    questionAnswered: (questionId: string, correct: boolean, timeSpent: number) => {
      trackEvent('question_answered', correct ? 1 : 0, { questionId, timeSpent })
    },
    hintUsed: (questionId: string) => {
      trackEvent('hint_used', 1, { questionId })
    }
  }

  // Gamification tracking
  const trackGameification = {
    achievementUnlocked: (achievementId: string) => {
      trackEvent('achievement_unlocked', 1, { achievementId })
    },
    levelUp: (newLevel: number, totalXp: number) => {
      trackEvent('level_up', newLevel, { totalXp })
    },
    boostActivated: (boostType: string) => {
      trackEvent('boost_activated', 1, { boostType })
    }
  }

  // Engagement tracking
  const trackEngagement = {
    pageView: (pageName: string) => {
      trackEvent('page_view', 1, { pageName })
    },
    buttonClick: (buttonId: string) => {
      trackEvent('button_clicked', 1, { buttonId })
    },
    featureDiscovered: (featureId: string) => {
      trackEvent('feature_discovered', 1, { featureId })
    },
    sessionStart: () => {
      trackEvent('session_started', 1)
    },
    sessionEnd: () => {
      trackEvent('session_ended', 1)
    },
    audioStarted: () => {
      trackEvent('audio_started', 1)
    },
    audioStopped: () => {
      trackEvent('audio_stopped', 1)
    },
    audioContentPlayed: (params: { contentId: string; duration: number }) => {
      trackEvent('audio_content_played', 1, params)
    }
  }

  // Error tracking
  const trackError = (error: Error | string, context?: Record<string, any>) => {
    const errorMessage = error instanceof Error ? error.message : error
    trackEvent('error_occurred', 1, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    })
  }

  return {
    trackEvent,
    trackQuiz,
    trackGameification,
    trackEngagement,
    trackError,
    isReady
  }
}

// Higher-order component for automatic page tracking
export const withPageTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pageName: string
): React.ComponentType<P> => {
  const TrackedComponent: React.FC<P> = (props: P) => {
    const { trackEngagement } = useAnalytics()

    React.useEffect(() => {
      trackEngagement.pageView(pageName)
    }, [trackEngagement])

    return React.createElement(WrappedComponent, props)
  }
  
  return TrackedComponent
}

// Session tracking hook
export const useSessionTracking = () => {
  const { trackEngagement } = useAnalytics()

  React.useEffect(() => {
    trackEngagement.sessionStart()

    const handleBeforeUnload = () => {
      trackEngagement.sessionEnd()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      trackEngagement.sessionEnd()
    }
  }, [trackEngagement])
} 