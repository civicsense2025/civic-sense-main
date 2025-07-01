// OneSignal Integration for CivicSense iOS App
// Handles push notifications and user synchronization

interface OneSignalConfig {
  appId: string
  restApiKey: string
  userAuthKey?: string
}

interface OneSignalUser {
  identity: {
    external_id: string
    onesignal_id?: string
  }
  properties: {
    tags: Record<string, string | number>
    language?: string
    timezone_id?: string
    country?: string
    first_active?: number
    last_active?: number
  }
  subscriptions: Array<{
    type: 'iOSPush' | 'Email' | 'SMS'
    token?: string
    enabled: boolean
    notification_types?: number
    app_version?: string
    device_model?: string
    device_os?: string
    sdk?: string
  }>
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

export class OneSignalService {
  private config: OneSignalConfig | null = null
  private baseUrl = 'https://api.onesignal.com'
  private enabled = false

  constructor() {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY
    
    if (appId && restApiKey) {
      this.config = {
        appId,
        restApiKey,
        userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY
      }
      this.enabled = true
    } else {
      console.warn('OneSignal configuration missing. Service will operate in disabled mode.')
      this.enabled = false
    }
  }

  private checkEnabled(): boolean {
    if (!this.enabled || !this.config) {
      console.warn('OneSignal service is disabled due to missing configuration')
      return false
    }
    return true
  }

  // =============================================================================
  // USER CREATION & SYNC
  // =============================================================================

  /**
   * Create or update a user in OneSignal with CivicSense-specific data
   */
  async createOrUpdateUser(userData: CivicUserData): Promise<{ success: boolean; oneSignalId?: string; error?: string }> {
    if (!this.checkEnabled()) {
      return { success: false, error: 'OneSignal service is disabled' }
    }

    try {
      const oneSignalUser = this.mapCivicUserToOneSignal(userData)
      
      const response = await fetch(`${this.baseUrl}/apps/${this.config!.appId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config!.restApiKey}`
        },
        body: JSON.stringify(oneSignalUser)
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('OneSignal user creation failed:', error)
        return { success: false, error: `HTTP ${response.status}: ${error}` }
      }

      const result = await response.json()
      
      // Track successful user sync for civic engagement metrics
      await this.trackUserSync(userData.userId, result.identity?.onesignal_id)
      
      return { 
        success: true, 
        oneSignalId: result.identity?.onesignal_id 
      }

    } catch (error) {
      console.error('OneSignal sync error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown sync error' 
      }
    }
  }

  /**
   * Update user tags for civic engagement segmentation
   */
  async updateUserTags(externalId: string, tags: Record<string, string | number>): Promise<boolean> {
    if (!this.checkEnabled()) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/apps/${this.config!.appId}/users/by/external_id/${externalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config!.restApiKey}`
        },
        body: JSON.stringify({
          properties: { tags }
        })
      })

      return response.ok
    } catch (error) {
      console.error('OneSignal tag update error:', error)
      return false
    }
  }

  /**
   * Add push subscription for iOS device
   */
  async addPushSubscription(
    externalId: string, 
    pushToken: string, 
    deviceInfo: {
      deviceModel: string
      deviceOS: string
      appVersion: string
    }
  ): Promise<boolean> {
    if (!this.checkEnabled()) {
      return false
    }

    try {
      const subscription = {
        type: 'iOSPush' as const,
        token: pushToken,
        enabled: true,
        notification_types: 1, // All notification types enabled
        device_model: deviceInfo.deviceModel,
        device_os: deviceInfo.deviceOS,
        app_version: deviceInfo.appVersion,
        sdk: 'react-native-onesignal'
      }

      const response = await fetch(`${this.baseUrl}/apps/${this.config!.appId}/users/by/external_id/${externalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config!.restApiKey}`
        },
        body: JSON.stringify({
          subscriptions: [subscription]
        })
      })

      return response.ok
    } catch (error) {
      console.error('OneSignal push subscription error:', error)
      return false
    }
  }

  // =============================================================================
  // CIVIC ENGAGEMENT NOTIFICATIONS
  // =============================================================================

  /**
   * Send targeted civic engagement notification
   */
  async sendCivicNotification(options: {
    userIds?: string[]
    segmentName?: string
    title: string
    message: string
    civicAction?: {
      type: 'quiz_reminder' | 'local_event' | 'voting_alert' | 'congressional_update'
      actionUrl?: string
      urgency: 'low' | 'medium' | 'high'
    }
    scheduledTime?: Date
  }): Promise<{ success: boolean; notificationId?: string }> {
    if (!this.checkEnabled()) {
      return { success: false }
    }

    try {
      const notification = {
        app_id: this.config!.appId,
        headings: { en: options.title },
        contents: { en: options.message },
        ...(options.userIds && {
          include_external_user_ids: options.userIds
        }),
        ...(options.segmentName && {
          included_segments: [options.segmentName]
        }),
        data: {
          civic_action_type: options.civicAction?.type,
          action_url: options.civicAction?.actionUrl,
          urgency: options.civicAction?.urgency || 'medium',
          source: 'civicsense_app'
        },
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        ...(options.scheduledTime && {
          send_after: options.scheduledTime.toISOString()
        })
      }

      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config!.restApiKey}`
        },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('OneSignal notification send failed:', error)
        return { success: false }
      }

      const result = await response.json()
      return { success: true, notificationId: result.id }

    } catch (error) {
      console.error('OneSignal notification error:', error)
      return { success: false }
    }
  }

  // =============================================================================
  // CIVIC ENGAGEMENT SEGMENTS
  // =============================================================================

  /**
   * Create segments for civic engagement targeting
   */
  async createCivicSegments(): Promise<void> {
    const segments = [
      {
        name: 'Active Civic Learners',
        filters: [
          { field: 'tag', key: 'engagement_level', relation: '=', value: 'advanced' },
          { field: 'tag', key: 'last_active_days', relation: '<', value: '7' }
        ]
      },
      {
        name: 'Quiz Enthusiasts',
        filters: [
          { field: 'tag', key: 'quiz_streak', relation: '>', value: '5' }
        ]
      },
      {
        name: 'Local Civic Participants',
        filters: [
          { field: 'tag', key: 'local_civic_alerts', relation: '=', value: 'true' },
          { field: 'tag', key: 'location_set', relation: '=', value: 'true' }
        ]
      },
      {
        name: 'New Democracy Learners',
        filters: [
          { field: 'tag', key: 'engagement_level', relation: '=', value: 'beginner' },
          { field: 'tag', key: 'days_since_signup', relation: '<', value: '30' }
        ]
      }
    ]

    // Note: Segment creation typically done via dashboard
    // This is for reference of recommended segments
    console.log('Recommended OneSignal segments for CivicSense:', segments)
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Map CivicSense user data to OneSignal format
   */
  private mapCivicUserToOneSignal(userData: CivicUserData): OneSignalUser {
    return {
      identity: {
        external_id: userData.userId
      },
      properties: {
        tags: {
          // Civic engagement data
          engagement_level: userData.civicProfile.engagementLevel,
          quiz_streak: userData.civicProfile.streakCount,
          topics_count: userData.civicProfile.topicsOfInterest.length,
          last_active_quiz: userData.civicProfile.lastActiveQuiz || 'none',
          
          // Notification preferences
          democratic_alerts: userData.preferences.democraticAlerts.toString(),
          local_civic_alerts: userData.preferences.localCivicReminders.toString(),
          email_updates: userData.preferences.emailUpdates.toString(),
          
          // Location data for local civic engagement
          ...(userData.civicProfile.location && {
            user_state: userData.civicProfile.location.state,
            user_district: userData.civicProfile.location.district || 'unknown',
            user_city: userData.civicProfile.location.city || 'unknown',
            location_set: 'true'
          }),
          
          // Engagement metrics
          signup_date: Date.now(),
          last_active: Date.now(),
          topics_interested: userData.civicProfile.topicsOfInterest.join(',')
        },
        language: 'en',
        timezone_id: Intl.DateTimeFormat().resolvedOptions().timeZone,
        country: 'US'
      },
      subscriptions: [
        // iOS Push subscription (if token available)
        ...(userData.pushToken ? [{
          type: 'iOSPush' as const,
          token: userData.pushToken,
          enabled: userData.preferences.notifications,
          notification_types: 1
        }] : []),
        
        // Email subscription (if email available)
        ...(userData.email ? [{
          type: 'Email' as const,
          token: userData.email,
          enabled: userData.preferences.emailUpdates
        }] : [])
      ]
    }
  }

  /**
   * Track user sync for analytics
   */
  private async trackUserSync(userId: string, oneSignalId?: string): Promise<void> {
    try {
      // This would integrate with your analytics system
      console.log('User synced to OneSignal:', { userId, oneSignalId })
      
      // Could call your analytics API here
      // await analytics.track('onesignal_user_synced', { userId, oneSignalId })
    } catch (error) {
      console.warn('Failed to track OneSignal sync:', error)
    }
  }

  // =============================================================================
  // CIVIC ENGAGEMENT AUTOMATION
  // =============================================================================

  /**
   * Send quiz streak celebration
   */
  async sendStreakCelebration(userId: string, streakCount: number): Promise<void> {
    await this.sendCivicNotification({
      userIds: [userId],
      title: `🔥 ${streakCount} Day Democracy Streak!`,
      message: `You're building serious civic knowledge. Keep the momentum going!`,
      civicAction: {
        type: 'quiz_reminder',
        actionUrl: 'civicsense://quiz',
        urgency: 'low'
      }
    })
  }

  /**
   * Send local voting reminder
   */
  async sendVotingReminder(userIds: string[], electionInfo: {
    date: Date
    type: string
    location: string
  }): Promise<void> {
    await this.sendCivicNotification({
      userIds,
      title: `📊 ${electionInfo.type} Coming Up!`,
      message: `Election on ${electionInfo.date.toLocaleDateString()}. Your vote shapes your community.`,
      civicAction: {
        type: 'voting_alert',
        actionUrl: `civicsense://voting-info`,
        urgency: 'high'
      },
      scheduledTime: new Date(electionInfo.date.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before
    })
  }

  /**
   * Send new content notification based on interests
   */
  async sendContentAlert(userId: string, contentInfo: {
    title: string
    topic: string
    type: 'quiz' | 'article' | 'scenario'
  }): Promise<void> {
    await this.sendCivicNotification({
      userIds: [userId],
      title: `📚 New ${contentInfo.type}: ${contentInfo.topic}`,
      message: contentInfo.title,
      civicAction: {
        type: 'quiz_reminder',
        actionUrl: `civicsense://${contentInfo.type}/${contentInfo.topic}`,
        urgency: 'medium'
      }
    })
  }
}

// Export singleton instance
export const oneSignal = new OneSignalService()

// Export types for use in other files
export type { OneSignalUser, CivicUserData } 