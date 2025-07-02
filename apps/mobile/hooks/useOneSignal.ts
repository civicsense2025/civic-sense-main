/**
 * OneSignal Hook for CivicSense iOS App
 * Handles push notifications, user sync, and civic engagement messaging
 * Updated to handle OneSignal API changes gracefully
 */

import { useEffect, useState, useCallback } from 'react'
import { Platform } from 'react-native'
import OneSignal from 'react-native-onesignal'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../lib/auth-context'

// Simple guest access hook replacement
const useGuestAccess = () => ({
  getOrCreateGuestToken: () => `guest-${Date.now()}`
})

// OneSignal types (updated for current API)
interface OneSignalDeviceState {
  userId?: string;
  pushToken?: string;
  emailUserId?: string;
  isSubscribed?: boolean;
  hasNotificationPermission?: boolean;
}

interface OneSignalNotificationEvent {
  notification: {
    notificationId: string;
    title?: string;
    body?: string;
    additionalData?: any;
  };
  complete: (notification?: any) => void;
  getNotification: () => any;
}

interface OneSignalOpenedEvent {
  notification: {
    notificationId: string;
    title?: string;
    body?: string;
    additionalData?: any;
  };
  action: {
    type: number;
    actionId?: string;
  };
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

interface CivicNotificationData {
  civic_action_type?: 'quiz_reminder' | 'local_event' | 'voting_alert' | 'congressional_update'
  action_url?: string
  urgency?: 'low' | 'medium' | 'high'
  quiz_id?: string
  topic_id?: string
  source?: string
}

interface OneSignalState {
  isInitialized: boolean
  pushToken: string | null
  oneSignalUserId: string | null
  notificationPermission: 'granted' | 'denied' | 'undetermined'
  isSubscribed: boolean
}

interface CivicUserData {
  userId: string
  email?: string
  phoneNumber?: string
  pushToken?: string
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    democraticAlerts: boolean
    localCivicReminders: boolean
  }
  civicProfile: {
    engagementLevel: 'beginner' | 'intermediate' | 'advanced'
    topicsOfInterest: string[]
    location?: {
      state: string
      district?: string
      city?: string
    }
    lastActiveQuiz?: string
    streakCount: number
  }
}

export function useOneSignal() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  
  const [state, setState] = useState<OneSignalState>({
    isInitialized: false,
    pushToken: null,
    oneSignalUserId: null,
    notificationPermission: 'undetermined',
    isSubscribed: false
  })

  // =============================================================================
  // SAFE ONESIGNAL WRAPPER FUNCTIONS
  // =============================================================================

  const safeCallOneSignal = useCallback(async (methodName: string, fn: () => Promise<any> | any) => {
    try {
      return await fn()
    } catch (error) {
      console.warn(`OneSignal ${methodName} not available:`, error)
      return null
    }
  }, [])

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  const initializeOneSignal = useCallback(async () => {
    try {
      // Skip OneSignal on web platform (it's mobile only)
      if (typeof window !== 'undefined' && window.location) {
        console.log('🌐 Web platform detected - skipping OneSignal hook initialization')
        setState(prev => ({ ...prev, isInitialized: true }))
        return
      }

      // OneSignal App ID from environment
      const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID
      if (!appId) {
        console.warn('OneSignal App ID not configured')
        setState(prev => ({ ...prev, isInitialized: true }))
        return
      }

      console.log('📱 Mobile platform detected - initializing OneSignal hook')
      
      // Try different initialization methods (different OneSignal versions)
      const initialized = await safeCallOneSignal('initialize', async () => {
        // Try current API first
        if (typeof (OneSignal as any).initialize === 'function') {
          (OneSignal as any).initialize(appId)
          return true
        }
        // Try legacy API
        if (typeof (OneSignal as any).setAppId === 'function') {
          (OneSignal as any).setAppId(appId)
          return true
        }
        return false
      })

      if (!initialized) {
        console.warn('OneSignal initialization failed - continuing without push notifications')
        setState(prev => ({ ...prev, isInitialized: true }))
        return
      }

      // iOS-specific configuration
      if (Platform.OS === 'ios') {
        // Request notification permission
        const granted = await safeCallOneSignal('requestPermission', async () => {
          // Try current API
          if ((OneSignal as any).Notifications?.requestPermission) {
            return await (OneSignal as any).Notifications.requestPermission(true)
          }
          // Try legacy API
          if ((OneSignal as any).promptForPushNotificationsWithUserResponse) {
            return new Promise((resolve) => {
              (OneSignal as any).promptForPushNotificationsWithUserResponse(resolve)
            })
          }
          return true // Default to granted if we can't request
        })

        setState(prev => ({
          ...prev,
          notificationPermission: granted ? 'granted' : 'denied'
        }))

        // Enable verbose logging in development
        if (__DEV__) {
          await safeCallOneSignal('setLogLevel', () => {
            if ((OneSignal as any).Debug?.setLogLevel) {
              (OneSignal as any).Debug.setLogLevel(6)
            } else if ((OneSignal as any).setLogLevel) {
              (OneSignal as any).setLogLevel(6, 0)
            }
          })
        }
      }

      // Get device state for push token
      const deviceState = await safeCallOneSignal('getDeviceState', async () => {
        if ((OneSignal as any).User?.getDeviceState) {
          return await (OneSignal as any).User.getDeviceState()
        }
        if ((OneSignal as any).getDeviceState) {
          return await (OneSignal as any).getDeviceState()
        }
        return null
      })
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        pushToken: deviceState?.pushToken || null,
        oneSignalUserId: deviceState?.userId || null,
        isSubscribed: deviceState?.isSubscribed || false,
        notificationPermission: deviceState?.hasNotificationPermission ? 'granted' : 'denied'
      }))

      console.log('OneSignal initialized successfully:', {
        userId: deviceState?.userId,
        pushToken: deviceState?.pushToken,
        isSubscribed: deviceState?.isSubscribed
      })

    } catch (error) {
      console.error('Failed to initialize OneSignal:', error)
      setState(prev => ({ ...prev, isInitialized: true })) // Mark as initialized even if failed
    }
  }, [safeCallOneSignal])

  // =============================================================================
  // USER SYNCHRONIZATION
  // =============================================================================

  const syncUserToOneSignal = useCallback(async (userData?: Partial<CivicUserData>) => {
    try {
      if (!state.isInitialized) {
        console.warn('OneSignal not initialized, skipping user sync')
        return
      }

      const userId = user?.id || getOrCreateGuestToken()
      if (!userId) {
        console.warn('No user ID available for OneSignal sync')
        return
      }

      // Set external user ID with fallback
      await safeCallOneSignal('setExternalUserId', () => {
        if ((OneSignal as any).User?.setExternalUserId) {
          (OneSignal as any).User.setExternalUserId(userId)
        } else if ((OneSignal as any).setExternalUserId) {
          (OneSignal as any).setExternalUserId(userId)
        }
      })

      // Build civic engagement tags
      const civicTags = buildCivicTags(userData || await getCurrentUserData())
      
      // Send tags to OneSignal with fallback
      await safeCallOneSignal('sendTags', () => {
        if ((OneSignal as any).User?.addTags) {
          (OneSignal as any).User.addTags(civicTags)
        } else if ((OneSignal as any).sendTags) {
          (OneSignal as any).sendTags(civicTags)
        }
      })

      console.log('User synced to OneSignal successfully')

    } catch (error) {
      console.error('Failed to sync user to OneSignal:', error)
    }
  }, [user, state.isInitialized, state.oneSignalUserId, state.pushToken, safeCallOneSignal])

  // =============================================================================
  // NOTIFICATION HANDLING
  // =============================================================================

  const setupNotificationHandlers = useCallback(() => {
    // Handle notification received while app is open
    safeCallOneSignal('setNotificationWillShowInForegroundHandler', () => {
      if ((OneSignal as any).Notifications?.addEventListener) {
        (OneSignal as any).Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          console.log('OneSignal: notification will show in foreground:', event)
          // Handle civic notification customization here
        })
      } else if ((OneSignal as any).setNotificationWillShowInForegroundHandler) {
        (OneSignal as any).setNotificationWillShowInForegroundHandler((event: any) => {
          console.log('OneSignal: notification will show in foreground:', event)
          const notification = event.getNotification()
          event.complete(notification)
        })
      }
    })

    // Handle notification opened/clicked
    safeCallOneSignal('setNotificationOpenedHandler', () => {
      if ((OneSignal as any).Notifications?.addEventListener) {
        (OneSignal as any).Notifications.addEventListener('click', (event: any) => {
          console.log('OneSignal: notification opened:', event)
          const civicData = event.notification.additionalData as CivicNotificationData
          handleCivicNotificationAction(civicData)
        })
      } else if ((OneSignal as any).setNotificationOpenedHandler) {
        (OneSignal as any).setNotificationOpenedHandler((openedEvent: any) => {
          console.log('OneSignal: notification opened:', openedEvent)
          const civicData = openedEvent.notification.additionalData as CivicNotificationData
          handleCivicNotificationAction(civicData)
        })
      }
    })

  }, [safeCallOneSignal])

  const handleCivicNotificationAction = useCallback((data: CivicNotificationData) => {
    if (!data) return

    // Handle different civic action types
    switch (data.civic_action_type) {
      case 'quiz_reminder':
        console.log('Quiz reminder notification clicked:', data)
        break
      case 'voting_alert':
        console.log('Voting alert notification clicked:', data)
        break
      case 'local_event':
        console.log('Local event notification clicked:', data)
        break
      case 'congressional_update':
        console.log('Congressional update notification clicked:', data)
        break
      default:
        console.log('Custom notification clicked:', data)
    }

    // Track notification interaction for analytics
    trackNotificationInteraction(data)
  }, [])

  // =============================================================================
  // CIVIC ENGAGEMENT FEATURES
  // =============================================================================

  const sendCivicTag = useCallback((key: string, value: string | number) => {
    safeCallOneSignal('sendTag', () => {
      if ((OneSignal as any).User?.addTag) {
        (OneSignal as any).User.addTag(key, value.toString())
      } else if ((OneSignal as any).sendTag) {
        (OneSignal as any).sendTag(key, value.toString())
      }
    })
  }, [safeCallOneSignal])

  const updateCivicEngagement = useCallback((engagement: {
    quizCompleted?: boolean
    quizScore?: number
    contentViewed?: string
    civicActionTaken?: string
    engagementLevel?: 'beginner' | 'intermediate' | 'advanced'
  }) => {
    const tags: Record<string, string> = {
      last_activity: Math.floor(Date.now() / 1000).toString(),
    }

    if (engagement.quizCompleted) {
      tags.last_quiz_completed = Math.floor(Date.now() / 1000).toString()
    }

    if (engagement.quizScore !== undefined) {
      tags.latest_quiz_score = engagement.quizScore.toString()
    }

    if (engagement.contentViewed) {
      tags.last_content_type = engagement.contentViewed
    }

    if (engagement.civicActionTaken) {
      tags.latest_civic_action = engagement.civicActionTaken
    }

    if (engagement.engagementLevel) {
      tags.engagement_level = engagement.engagementLevel
    }

    safeCallOneSignal('sendTags', () => {
      if ((OneSignal as any).User?.addTags) {
        (OneSignal as any).User.addTags(tags)
      } else if ((OneSignal as any).sendTags) {
        (OneSignal as any).sendTags(tags)
      }
    })
  }, [safeCallOneSignal])

  const triggerCivicNotification = useCallback(async (type: 'streak' | 'achievement' | 'reminder', data: any) => {
    try {
      console.log('Triggering civic notification:', { type, data })
      // This would integrate with your backend API
    } catch (error) {
      console.error('Failed to trigger civic notification:', error)
    }
  }, [user])

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const buildCivicTags = (userData: Partial<CivicUserData>): Record<string, string> => {
    return {
      // Core civic data
      user_type: 'civic_learner',
      platform: 'mobile_ios',
      engagement_level: userData.civicProfile?.engagementLevel || 'beginner',
      
      // Quiz and learning data
      quiz_streak: userData.civicProfile?.streakCount?.toString() || '0',
      topics_count: userData.civicProfile?.topicsOfInterest?.length?.toString() || '0',
      last_active_quiz: userData.civicProfile?.lastActiveQuiz || 'none',
      
      // Notification preferences
      democratic_alerts: userData.preferences?.democraticAlerts?.toString() || 'true',
      local_civic_alerts: userData.preferences?.localCivicReminders?.toString() || 'true',
      email_updates: userData.preferences?.emailUpdates?.toString() || 'true',
      
      // Location data for local civic engagement
      ...(userData.civicProfile?.location && {
        user_state: userData.civicProfile.location.state,
        user_district: userData.civicProfile.location.district || 'unknown',
        user_city: userData.civicProfile.location.city || 'unknown',
        location_set: 'true'
      }),
      
      // Device and session info
      app_version: '1.0.0', // Should come from app config
      device_type: Device.deviceType?.toString() || 'unknown',
      signup_date: Math.floor(Date.now() / 1000).toString(),
      last_updated: Math.floor(Date.now() / 1000).toString(),
      
      // Topics of interest
      topics_interested: userData.civicProfile?.topicsOfInterest?.join(',') || ''
    }
  }

  const getCurrentUserData = async (): Promise<Partial<CivicUserData>> => {
    // This would fetch current user data from your app state/API
    // For now, return default structure
    return {
      userId: user?.id || getOrCreateGuestToken(),
      preferences: {
        notifications: true,
        emailUpdates: true,
        democraticAlerts: true,
        localCivicReminders: true
      },
      civicProfile: {
        engagementLevel: 'beginner',
        topicsOfInterest: [],
        streakCount: 0
      }
    }
  }

  const trackNotificationInteraction = (data: CivicNotificationData) => {
    // Track for analytics
    console.log('Civic notification interaction:', data)
    // This would integrate with your analytics system
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize OneSignal when component mounts
  useEffect(() => {
    initializeOneSignal()
  }, [initializeOneSignal])

  // Setup notification handlers when initialized
  useEffect(() => {
    if (state.isInitialized) {
      setupNotificationHandlers()
    }
  }, [state.isInitialized, setupNotificationHandlers])

  // Sync user when authenticated or OneSignal state changes
  useEffect(() => {
    if (state.isInitialized && (user || getOrCreateGuestToken())) {
      syncUserToOneSignal()
    }
  }, [state.isInitialized, user, syncUserToOneSignal])

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // State
    isInitialized: state.isInitialized,
    pushToken: state.pushToken,
    oneSignalUserId: state.oneSignalUserId,
    notificationPermission: state.notificationPermission,
    isSubscribed: state.isSubscribed,
    
    // Actions
    syncUser: syncUserToOneSignal,
    sendCivicTag,
    updateCivicEngagement,
    triggerCivicNotification,
    
    // Manual permission request (iOS)
    requestPermission: () => {
      if (Platform.OS === 'ios') {
        safeCallOneSignal('requestPermission', async () => {
          if ((OneSignal as any).Notifications?.requestPermission) {
            const granted = await (OneSignal as any).Notifications.requestPermission(true)
            setState(prev => ({
              ...prev,
              notificationPermission: granted ? 'granted' : 'denied'
            }))
          }
        })
      }
    },
    
    // Subscribe/unsubscribe
    setSubscription: (subscribed: boolean) => {
      safeCallOneSignal('setSubscription', () => {
        if ((OneSignal as any).User?.setSubscription) {
          (OneSignal as any).User.setSubscription(subscribed)
        } else if ((OneSignal as any).disablePush) {
          (OneSignal as any).disablePush(!subscribed)
        }
      })
      setState(prev => ({ ...prev, isSubscribed: subscribed }))
    }
  }
}

export type { CivicNotificationData, OneSignalState, CivicUserData } 