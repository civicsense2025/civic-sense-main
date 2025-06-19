'use client'

import React from 'react'
import { useStatsig } from '@/components/providers/statsig-provider'
import { useAuth } from '@/components/auth/auth-provider'
import { z } from 'zod'

// Add event sampling configuration at the top of the file
const ANALYTICS_CONFIG = {
  // High priority events - always track (critical for business)
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
    'error_occurred' // Always track errors
  ],
  
  // Medium priority events - sample these to conserve events
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
  // Always track high priority events
  if (ANALYTICS_CONFIG.highPriority.includes(eventName)) {
    return true
  }
  
  // Sample medium priority events
  if (ANALYTICS_CONFIG.mediumPriority.events.includes(eventName)) {
    return Math.random() < ANALYTICS_CONFIG.mediumPriority.sampleRate
  }
  
  // Sample low priority events
  if (ANALYTICS_CONFIG.lowPriority.events.includes(eventName)) {
    return Math.random() < ANALYTICS_CONFIG.lowPriority.sampleRate
  }
  
  // Default to tracking unknown events (but log warning)
  console.warn(`Unknown event type: ${eventName}`)
  return true
}

// Session-based event batching (optional optimization)
class EventBatcher {
  private static instance: EventBatcher
  private batch: Array<{ eventName: string; metadata: any }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 5
  private readonly BATCH_TIMEOUT = 10000 // 10 seconds

  static getInstance(): EventBatcher {
    if (!EventBatcher.instance) {
      EventBatcher.instance = new EventBatcher()
    }
    return EventBatcher.instance
  }

  addEvent(eventName: string, metadata: any) {
    if (!shouldTrackEvent(eventName)) {
      console.log(`🔇 Skipping event due to sampling: ${eventName}`)
      return
    }

    this.batch.push({ eventName, metadata })
    
    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush()
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), this.BATCH_TIMEOUT)
    }
  }

  private flush() {
    if (this.batch.length === 0) return
    
    console.log(`📊 Flushing ${this.batch.length} events to Statsig`)
    // Here you would send the batch to Statsig
    // For now, send them individually but this structure allows for batching
    
    this.batch.forEach(({ eventName, metadata }) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, metadata)
      }
    })
    
    this.batch = []
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }
}

// Event validation schemas
const QuizEventSchema = z.object({
  quiz_id: z.string(),
  quiz_category: z.enum(['constitution', 'current_events', 'local_civics', 'government_basics', 'voting_rights', 'political_system']),
  quiz_difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  score_percentage: z.number().min(0).max(100).optional(),
  total_questions: z.number().positive().optional(),
  correct_answers: z.number().min(0).optional(),
  total_time_seconds: z.number().positive().optional(),
  user_level: z.number().positive().optional(),
  active_boosts: z.array(z.string()).default([]),
  streak_count: z.number().min(0).default(0)
})

const BoostEventSchema = z.object({
  boost_type: z.string(),
  boost_cost_xp: z.number().positive().optional(),
  user_xp_before: z.number().min(0).optional(),
  user_level: z.number().positive().optional(),
  activation_context: z.enum(['quiz_start', 'mid_quiz', 'specific_question', 'pre_quiz', 'browse']).optional()
})

const AuthEventSchema = z.object({
  registration_method: z.enum(['google', 'email']).optional(),
  login_method: z.enum(['google', 'email']).optional(),
  source: z.enum(['landing_page', 'referral', 'direct', 'social']).default('direct'),
  session_duration_previous: z.number().min(0).optional(),
  days_since_last_login: z.number().min(0).optional()
})

const FeedbackEventSchema = z.object({
  feedback_type: z.string(),
  context_type: z.string(),
  context_id: z.string(),
  rating: z.number().min(1).max(5).nullable(),
  has_contact_info: z.boolean(),
  feedback_length: z.number().min(0)
})

// Session management
let sessionId: string | null = null
let sessionStartTime: number = Date.now()

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return sessionId
}

const getSessionDuration = (): number => {
  return Math.floor((Date.now() - sessionStartTime) / 1000)
}

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const getDayOfWeek = (): string => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
}

// Helper function to map actual question categories to analytics enum values
export function mapCategoryToAnalytics(questionCategory: string): 'constitution' | 'current_events' | 'local_civics' | 'government_basics' | 'voting_rights' | 'political_system' {
  const categoryMap: Record<string, 'constitution' | 'current_events' | 'local_civics' | 'government_basics' | 'voting_rights' | 'political_system'> = {
    // Constitutional and legal categories
    'Constitutional Law': 'constitution',
    'Constitutional Rights': 'constitution',
    'Constitutional Interpretation': 'constitution',
    'Constitutional Powers': 'constitution',
    'Bill of Rights': 'constitution',
    'Due Process': 'constitution',
    'Equal Protection': 'constitution',
    'First Amendment Rights': 'constitution',
    'Judicial Review': 'constitution',
    
    // Government structure and basics
    'Government': 'government_basics',
    'Government Structure': 'government_basics',
    'Federal Government': 'government_basics',
    'State Government': 'government_basics',
    'Local Government': 'government_basics',
    'Public Administration': 'government_basics',
    'Legislative Process': 'government_basics',
    'Separation of Powers': 'government_basics',
    'Federalism': 'government_basics',
    
    // Elections and voting
    'Elections': 'voting_rights',
    'Electoral Process': 'voting_rights',
    'Electoral Systems': 'voting_rights',
    'Voting': 'voting_rights',
    'Campaign Finance': 'voting_rights',
    
    // Civil rights and liberties
    'Civil Rights': 'voting_rights', // Civil rights often relate to voting rights
    'Civil Liberties': 'voting_rights',
    'Human Rights': 'voting_rights',
    'Individual Rights': 'voting_rights',
    
    // Justice system
    'Justice': 'government_basics',
    'Criminal Justice': 'government_basics',
    'Law Enforcement': 'government_basics',
    'Legal System': 'government_basics',
    
    // Policy and current events
    'Public Policy': 'current_events',
    'Policy Analysis': 'current_events',
    'Economy': 'current_events',
    'Economic Policy': 'current_events',
    'Fiscal Policy': 'current_events',
    'Monetary Policy': 'current_events',
    'Trade Policy': 'current_events',
    'Environment': 'current_events',
    'Environmental Policy': 'current_events',
    'Climate Policy': 'current_events',
    'Sustainability': 'current_events',
    'Media': 'current_events',
    'Media Literacy': 'current_events',
    
    // Foreign affairs
    'Foreign Policy': 'current_events',
    'International Relations': 'current_events',
    'Diplomacy': 'current_events',
    'International Affairs': 'current_events',
    'National Security': 'current_events',
    
    // Local and civic engagement
    'Local Issues': 'local_civics',
    'Community': 'local_civics',
    'Civic Action': 'local_civics',
    'Civic Participation': 'local_civics',
    'Civic Engagement': 'local_civics',
    'Community Engagement': 'local_civics',
    
    // Historical and precedent
    'Historical Precedent': 'constitution',
    'Historical Context': 'constitution'
  }
  
  // Return mapped category or default to local_civics
  return categoryMap[questionCategory] || 'local_civics'
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
    // Check if we should track this event (sampling)
    if (!shouldTrackEvent(eventName)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔇 Skipping event due to sampling: ${eventName}`)
      }
      return
    }

    if (!isReady) {
      console.warn('Statsig not ready, event queued:', eventName)
      // Could implement event queuing here
      return
    }

    const enrichedMetadata = {
      ...metadata,
      user_id: user?.id || 'anonymous',
      user_level: user?.user_metadata?.level || 1,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      session_duration_seconds: getSessionDuration(),
      time_of_day: getTimeOfDay(),
      day_of_week: getDayOfWeek(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      // Add event priority for debugging
      event_priority: ANALYTICS_CONFIG.highPriority.includes(eventName) ? 'HIGH' :
                     ANALYTICS_CONFIG.mediumPriority.events.includes(eventName) ? 'MEDIUM' : 'LOW'
    }

    try {
      logEvent(eventName, value, enrichedMetadata)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Analytics Event Tracked: ${eventName} (${enrichedMetadata.event_priority} priority)`)
      }
    } catch (error) {
      console.error('Analytics tracking error:', error, { eventName, metadata: enrichedMetadata })
    }
  }

  // Authentication & Onboarding Events
  const trackAuth = {
    userRegistered: (data: z.infer<typeof AuthEventSchema>) => {
      const validated = AuthEventSchema.parse(data)
      trackEvent('user_registered', 1, validated)
    },

    userLogin: (data: z.infer<typeof AuthEventSchema>) => {
      const validated = AuthEventSchema.parse(data)
      trackEvent('user_login', 1, validated)
    },

    onboardingStarted: (entry_point: string) => {
      trackEvent('onboarding_started', 1, {
        user_type: user ? 'returning' : 'new',
        entry_point
      })
    },

    onboardingStepCompleted: (step: string, step_number: number, time_spent_seconds: number) => {
      trackEvent('onboarding_step_completed', 1, {
        step,
        step_number,
        time_spent_seconds,
        completion_rate: (step_number / 6) * 100 // Assuming 6 total steps
      })
    },

    onboardingCompleted: (completion_time_seconds: number, steps_skipped: string[] = []) => {
      trackEvent('onboarding_completed', 1, {
        completion_time_seconds,
        steps_completed: 6 - steps_skipped.length,
        steps_skipped,
        completion_rate: 100
      })
    },

    onboardingAbandoned: (last_step: string, step_number: number, time_spent_seconds: number) => {
      trackEvent('onboarding_abandoned', 1, {
        last_step,
        step_number,
        time_spent_seconds,
        abandonment_rate: (step_number / 6) * 100
      })
    }
  }

  // Quiz & Learning Events  
  const trackQuiz = {
    quizStarted: (data: Partial<z.infer<typeof QuizEventSchema>>) => {
      const validated = QuizEventSchema.partial().parse(data)
      trackEvent('quiz_started', 1, validated)
    },

    questionAnswered: (data: {
      question_id: string
      question_category: string
      answer_correct: boolean
      response_time_seconds: number
      attempt_number?: number
      hint_used?: boolean
      boost_active?: string | null
      confidence_level?: 1 | 2 | 3 | 4 | 5
    }) => {
      trackEvent('question_answered', 1, data)
    },

    quizCompleted: (data: z.infer<typeof QuizEventSchema> & {
      xp_earned?: number
      streak_maintained?: boolean
      new_level_reached?: boolean
      boosts_used?: string[]
    }) => {
      const validated = QuizEventSchema.parse(data)
      trackEvent('quiz_completed', 1, {
        ...validated,
        xp_earned: data.xp_earned || 0,
        streak_maintained: data.streak_maintained || false,
        new_level_reached: data.new_level_reached || false,
        boosts_used: data.boosts_used || []
      })
    },

    quizAbandoned: (data: {
      quiz_id: string
      questions_answered: number
      total_questions: number
      abandonment_point: 'start' | 'middle' | 'near_end'
      time_spent_seconds: number
      reason?: 'timeout' | 'user_exit' | 'technical_issue'
    }) => {
      trackEvent('quiz_abandoned', 1, data)
    },

    hintUsed: (question_id: string, hint_type: 'auto' | 'manual' | 'smart', effectiveness: boolean) => {
      trackEvent('hint_used', 1, {
        question_id,
        hint_type,
        effectiveness,
        user_initiated: hint_type === 'manual'
      })
    }
  }

  // Gamification & Boost Events
  const trackGameification = {
    boostPurchased: (data: z.infer<typeof BoostEventSchema> & {
      purchase_context: 'pre_quiz' | 'mid_quiz' | 'post_quiz' | 'browse'
    }) => {
      const validated = BoostEventSchema.parse(data)
      trackEvent('boost_purchased', 1, validated)
    },

    boostActivated: (data: z.infer<typeof BoostEventSchema> & {
      remaining_uses?: number
      user_performance_before?: number
    }) => {
      const validated = BoostEventSchema.parse(data)
      trackEvent('boost_activated', 1, validated)
    },

    boostEffectMeasured: (data: {
      boost_type: string
      performance_improvement: number
      questions_affected: number
      user_satisfaction?: 1 | 2 | 3 | 4 | 5
    }) => {
      trackEvent('boost_effect_measured', 1, data)
    },

    achievementUnlocked: (data: {
      achievement_type: string
      achievement_category: 'quiz' | 'streak' | 'social' | 'learning'
      days_to_unlock?: number
      total_achievements?: number
    }) => {
      trackEvent('achievement_unlocked', 1, {
        ...data,
        user_level: user?.user_metadata?.level || 1
      })
    },

    levelUp: (data: {
      new_level: number
      xp_total: number
      days_to_level_up?: number
      primary_activity: 'quiz' | 'daily_streak' | 'achievements'
    }) => {
      trackEvent('level_up', 1, data)
    },

    streakMaintained: (data: {
      streak_count: number
      activity_type: 'quiz' | 'reading' | 'discussion'
      time_since_last_activity_hours: number
      streak_motivation?: 'notification' | 'habit' | 'reminder' | 'social'
    }) => {
      trackEvent('daily_streak_maintained', 1, data)
    },

    streakBroken: (data: {
      streak_count_lost: number
      days_since_last_activity: number
      last_activity_type: string
      user_reaction?: 'disappointed' | 'motivated' | 'indifferent'
    }) => {
      trackEvent('daily_streak_broken', 1, data)
    }
  }

  // Engagement & Content Events
  const trackEngagement = {
    audioContentPlayed: (data: {
      content_type: 'quiz_question' | 'explanation' | 'hint'
      duration_seconds: number
      completion_percentage: number
      user_initiated: boolean
      accessibility_feature?: boolean
    }) => {
      trackEvent('audio_content_played', 1, data)
    },

    contentShared: (data: {
      content_type: 'quiz_result' | 'achievement' | 'streak'
      share_platform: 'twitter' | 'facebook' | 'copy_link'
      content_score?: number
    }) => {
      trackEvent('content_shared', 1, {
        ...data,
        user_level: user?.user_metadata?.level || 1
      })
    },

    pageView: (page: string, referrer?: string) => {
      trackEvent('page_view', 1, {
        page,
        referrer: referrer || document.referrer,
        url: window.location.href
      })
    },

    sessionStart: () => {
      sessionStartTime = Date.now()
      trackEvent('session_start', 1, {
        session_id: getSessionId(),
        device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
      })
    },

    sessionEnd: () => {
      trackEvent('session_end', 1, {
        session_id: getSessionId(),
        session_duration_seconds: getSessionDuration()
      })
    },

    feedbackSubmitted: (data: z.infer<typeof FeedbackEventSchema>) => {
      try {
        const validData = FeedbackEventSchema.parse(data)
        trackEvent('feedback_submitted', 1, {
          ...validData,
          session_id: getSessionId(),
          session_duration: getSessionDuration(),
          time_of_day: getTimeOfDay(),
          day_of_week: getDayOfWeek(),
          user_id: user?.id || null,
          user_level: user?.user_metadata?.level || null,
          is_premium: user?.user_metadata?.isPremium || false
        })
      } catch (error) {
        console.error('Invalid feedback data:', error)
      }
    }
  }

  // Feature Adoption Events
  const trackFeature = {
    featureDiscovered: (feature_name: string, discovery_method: 'tutorial' | 'exploration' | 'tooltip' | 'accident') => {
      trackEvent('feature_discovered', 1, {
        feature_name,
        discovery_method,
        user_experience_level: user?.user_metadata?.level || 1
      })
    },

    featureFirstUse: (feature_name: string, success: boolean, satisfaction?: 1 | 2 | 3 | 4 | 5) => {
      trackEvent('feature_first_use', 1, {
        feature_name,
        success,
        user_satisfaction: satisfaction
      })
    },

    settingsChanged: (data: {
      setting_category: 'notifications' | 'audio' | 'difficulty' | 'privacy'
      setting_name: string
      old_value: string
      new_value: string
      change_reason?: 'preference' | 'accessibility' | 'performance'
    }) => {
      trackEvent('settings_changed', 1, data)
    }
  }

  // Custom event tracker for flexibility
  const trackCustomEvent = (eventName: string, value: number = 1, metadata: Record<string, any> = {}) => {
    trackEvent(`custom_${eventName}`, value, metadata)
  }

  // Error tracking - always high priority
  const trackError = (errorType: string, errorMessage: string, metadata: Record<string, any> = {}) => {
    const errorMetadata = {
      ...metadata,
      error_type: errorType,
      error_message: errorMessage.slice(0, 500), // Limit message length
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 Analytics Error Event: ${errorType}`, errorMetadata)
    }

    // Use trackEvent but with error-specific event name
    trackEvent('error_occurred', 1, errorMetadata)
  }

  return {
    // Core tracking
    trackEvent,
    trackCustomEvent,
    trackError,
    
    // Category-specific tracking
    trackAuth,
    trackQuiz,
    trackGameification,
    trackEngagement,
    trackFeature,
    
    // Session management
    getSessionId,
    getSessionDuration,
    
    // Utility
    isReady: isReady && !!user
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
    // Track session start
    trackEngagement.sessionStart()

    // Track session end on unmount or page unload
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

// User journey tracking utilities
export const trackUserJourney = {
  landingPage: (source: string, campaign?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_journey_start', JSON.stringify({
        source,
        campaign,
        timestamp: Date.now(),
        page: window.location.pathname
      }))
    }
  },

  conversionEvent: (event: string, value?: number, trackCustomEvent?: (eventName: string, value: number, metadata: Record<string, any>) => void) => {
    if (typeof window !== 'undefined') {
      const journeyStart = sessionStorage.getItem('user_journey_start')
      if (journeyStart && trackCustomEvent) {
        const start = JSON.parse(journeyStart)
        const timeToConversion = (Date.now() - start.timestamp) / 1000
        
        // Track conversion with journey context
        trackCustomEvent('user_journey_conversion', value || 1, {
          conversion_event: event,
          time_to_conversion_seconds: timeToConversion,
          journey_source: start.source,
          journey_campaign: start.campaign,
          starting_page: start.page
        })
      }
    }
  }
}

export default useAnalytics 