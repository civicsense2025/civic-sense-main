/**
 * OneSignal Integration for CivicSense
 * Enables civic engagement through multi-channel messaging
 */

interface OneSignalConfig {
  appId: string
  restApiKey: string
  userAuthKey?: string
  baseUrl?: string
}

interface CivicUser {
  id: string
  email?: string
  phone?: string
  external_id: string
  civic_interests?: string[]
  location?: {
    state?: string
    district?: string
    zip_code?: string
  }
  engagement_level?: 'low' | 'medium' | 'high'
  preferred_channels?: ('push' | 'email' | 'sms')[]
  last_quiz_date?: string
  quiz_completion_rate?: number
}

interface CivicSegment {
  id: string
  name: string
  description: string
  filters: {
    civic_interests?: string[]
    engagement_level?: string[]
    location?: {
      states?: string[]
      districts?: string[]
    }
    quiz_performance?: {
      min_completion_rate?: number
      recent_activity_days?: number
    }
  }
}

interface CivicNotification {
  type: 'quiz_reminder' | 'voting_alert' | 'news_update' | 'civic_action' | 'educational_content'
  title: string
  message: string
  channels: ('push' | 'email' | 'sms' | 'in_app')[]
  data?: {
    quiz_id?: string
    article_url?: string
    action_type?: string
    deep_link?: string
    election_date?: string
    election_type?: string
    civic_score?: string
    [key: string]: any
  }
  personalization?: {
    use_user_name?: boolean
    use_location?: boolean
    use_representative_info?: boolean
  }
}

interface CivicJourney {
  id: string
  name: string
  description: string
  trigger: {
    type: 'user_signup' | 'quiz_completion' | 'inactivity' | 'news_event' | 'voting_deadline'
    conditions?: any
  }
  steps: CivicJourneyStep[]
  active: boolean
}

interface CivicJourneyStep {
  id: string
  name: string
  delay?: {
    amount: number
    unit: 'minutes' | 'hours' | 'days'
  }
  notification: CivicNotification
  conditions?: {
    segment_filters?: any
    engagement_requirements?: any
  }
}

class OneSignalCivicClient {
  private config: OneSignalConfig
  private baseUrl: string

  constructor(config: OneSignalConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://onesignal.com/api/v1'
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async syncCivicUser(user: CivicUser): Promise<{ success: boolean; player_id?: string; error?: string }> {
    try {
      const tags = this.buildCivicTags(user)
      
      const payload = {
        app_id: this.config.appId,
        external_user_id: user.external_id,
        tags,
        // Include email and phone for multi-channel messaging
        ...(user.email && { email: user.email }),
        ...(user.phone && { sms_number: user.phone })
      }

      const response = await this.makeRequest('POST', '/players', payload)
      
      return {
        success: true,
        player_id: response.id
      }
    } catch (error) {
      console.error('Failed to sync civic user:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateCivicEngagement(externalId: string, engagement: {
    quiz_completed?: boolean
    quiz_score?: number
    content_viewed?: string
    civic_action_taken?: string
    engagement_level?: 'low' | 'medium' | 'high'
  }): Promise<boolean> {
    try {
      const tags = {
        last_activity: Math.floor(Date.now() / 1000).toString(),
        ...engagement.quiz_completed && { last_quiz_completed: Math.floor(Date.now() / 1000).toString() },
        ...engagement.quiz_score && { latest_quiz_score: engagement.quiz_score.toString() },
        ...engagement.content_viewed && { last_content_type: engagement.content_viewed },
        ...engagement.civic_action_taken && { latest_civic_action: engagement.civic_action_taken },
        ...engagement.engagement_level && { engagement_level: engagement.engagement_level }
      }

      await this.makeRequest('PUT', `/players/${externalId}`, {
        app_id: this.config.appId,
        tags
      })

      return true
    } catch (error) {
      console.error('Failed to update civic engagement:', error)
      return false
    }
  }

  // ============================================================================
  // CIVIC SEGMENTATION
  // ============================================================================

  async createCivicSegment(segment: CivicSegment): Promise<{ success: boolean; segment_id?: string; error?: string }> {
    try {
      // Build OneSignal segment filters from civic filters
      const filters = this.buildSegmentFilters(segment.filters)

      const payload = {
        name: segment.name,
        filters
      }

      const response = await this.makeRequest('POST', `/apps/${this.config.appId}/segments`, payload)
      
      return {
        success: true,
        segment_id: response.id
      }
    } catch (error) {
      console.error('Failed to create civic segment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============================================================================
  // CIVIC MESSAGING
  // ============================================================================

  async sendCivicNotification(
    notification: CivicNotification,
    targeting: {
      segments?: string[]
      external_user_ids?: string[]
      filters?: any[]
    }
  ): Promise<{ success: boolean; notification_id?: string; error?: string }> {
    try {
      const payload = {
        app_id: this.config.appId,
        headings: { en: notification.title },
        contents: { en: notification.message },
        data: notification.data || {},
        
        // Multi-channel support
        ...notification.channels.includes('push') && {
          included_segments: targeting.segments || ['All']
        },
        
        ...notification.channels.includes('email') && {
          email_subject: notification.title,
          email_body: this.buildEmailBody(notification)
        },

        // Deep linking for civic content
        ...notification.data?.deep_link && {
          url: notification.data.deep_link,
          web_url: notification.data.deep_link
        },

        // Targeting
        ...targeting.external_user_ids && {
          include_external_user_ids: targeting.external_user_ids
        },
        ...targeting.filters && {
          filters: targeting.filters
        }
      }

      const response = await this.makeRequest('POST', '/notifications', payload)
      
      return {
        success: true,
        notification_id: response.id
      }
    } catch (error) {
      console.error('Failed to send civic notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendVotingReminder(users: CivicUser[], election: {
    name: string
    date: string
    type: 'federal' | 'state' | 'local'
    registration_deadline?: string
  }): Promise<boolean> {
    const daysUntilElection = Math.ceil(
      (new Date(election.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const notification: CivicNotification = {
      type: 'voting_alert',
      title: `🗳️ ${election.name} - ${daysUntilElection} days left!`,
      message: `Don't forget to vote in the ${election.name}. Your voice matters in democracy!`,
      channels: ['push', 'email'],
      data: {
        action_type: 'voting_reminder',
        deep_link: '/voting-guide',
        election_date: election.date,
        election_type: election.type
      },
      personalization: {
        use_user_name: true,
        use_location: true,
        use_representative_info: true
      }
    }

    return (await this.sendCivicNotification(notification, {
      external_user_ids: users.map(u => u.external_id)
    })).success
  }

  async sendQuizReminder(users: CivicUser[], quiz: {
    id: string
    title: string
    topic: string
  }): Promise<boolean> {
    const notification: CivicNotification = {
      type: 'quiz_reminder',
      title: `📚 New quiz available: ${quiz.topic}`,
      message: `Test your knowledge with "${quiz.title}" and learn something new about democracy!`,
      channels: ['push'],
      data: {
        quiz_id: quiz.id,
        action_type: 'quiz_reminder',
        deep_link: `/quiz/${quiz.id}`
      }
    }

    return (await this.sendCivicNotification(notification, {
      external_user_ids: users.map(u => u.external_id)
    })).success
  }

  async sendBreakingNewsAlert(users: CivicUser[], news: {
    headline: string
    summary: string
    url: string
    civic_relevance_score: number
  }): Promise<boolean> {
    const notification: CivicNotification = {
      type: 'news_update',
      title: `🚨 Breaking: ${news.headline}`,
      message: `${news.summary.substring(0, 100)}...`,
      channels: ['push', 'email'],
      data: {
        article_url: news.url,
        action_type: 'breaking_news',
        civic_score: news.civic_relevance_score.toString()
      }
    }

    // Only send to highly engaged users for breaking news
    const highEngagementUsers = users.filter(u => u.engagement_level === 'high')

    return (await this.sendCivicNotification(notification, {
      external_user_ids: highEngagementUsers.map(u => u.external_id)
    })).success
  }

  // ============================================================================
  // CIVIC JOURNEYS
  // ============================================================================

  async createCivicJourney(journey: CivicJourney): Promise<{ success: boolean; journey_id?: string; error?: string }> {
    try {
      // OneSignal doesn't have native journey support, so we'll implement our own
      // Store journey configuration and use our own trigger system
      const journeyData = {
        id: journey.id,
        name: journey.name,
        description: journey.description,
        trigger: journey.trigger,
        steps: journey.steps,
        active: journey.active,
        created_at: new Date().toISOString()
      }

      // Store in our database and set up triggers
      await this.storeCivicJourney(journeyData)
      
      if (journey.active) {
        await this.activateJourneyTriggers(journey)
      }

      return {
        success: true,
        journey_id: journey.id
      }
    } catch (error) {
      console.error('Failed to create civic journey:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  async getCivicEngagementMetrics(timeframe: {
    start: string
    end: string
  }): Promise<{
    notifications_sent: number
    open_rate: number
    click_rate: number
    civic_actions_triggered: number
    quiz_completions_from_notifications: number
    top_performing_content: Array<{ type: string; title: string; engagement_rate: number }>
  }> {
    try {
      const response = await this.makeRequest('GET', `/apps/${this.config.appId}/outcomes`, {
        outcome_names: ['civic_action', 'quiz_completion', 'content_engagement'],
        outcome_time_range: `${timeframe.start}...${timeframe.end}`
      })

      // Process OneSignal outcome data into civic metrics
      return {
        notifications_sent: response.notification_count || 0,
        open_rate: response.outcomes?.find((o: any) => o.name === 'opened')?.count || 0,
        click_rate: response.outcomes?.find((o: any) => o.name === 'clicked')?.count || 0,
        civic_actions_triggered: response.outcomes?.find((o: any) => o.name === 'civic_action')?.count || 0,
        quiz_completions_from_notifications: response.outcomes?.find((o: any) => o.name === 'quiz_completion')?.count || 0,
        top_performing_content: this.extractTopContent(response)
      }
    } catch (error) {
      console.error('Failed to get civic engagement metrics:', error)
      return {
        notifications_sent: 0,
        open_rate: 0,
        click_rate: 0,
        civic_actions_triggered: 0,
        quiz_completions_from_notifications: 0,
        top_performing_content: []
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildCivicTags(user: CivicUser): Record<string, string> {
    return {
      // Core civic data
      user_type: 'civic_learner',
      engagement_level: user.engagement_level || 'medium',
      
      // Location-based tags for political targeting
      ...(user.location?.state && { state: user.location.state }),
      ...(user.location?.district && { congressional_district: user.location.district }),
      ...(user.location?.zip_code && { zip_code: user.location.zip_code }),
      
      // Civic interests for content targeting
      ...(user.civic_interests && {
        civic_interests: user.civic_interests.join(','),
        primary_interest: user.civic_interests[0] || 'general'
      }),
      
      // Engagement metrics
      ...(user.quiz_completion_rate && {
        quiz_completion_rate: user.quiz_completion_rate.toString()
      }),
      ...(user.last_quiz_date && {
        last_quiz_date: user.last_quiz_date
      }),
      
      // Channel preferences
      ...(user.preferred_channels && {
        preferred_channels: user.preferred_channels.join(',')
      }),
      
      // Timestamps
      last_updated: Math.floor(Date.now() / 1000).toString(),
      civic_user_since: Math.floor(Date.now() / 1000).toString()
    }
  }

  private buildSegmentFilters(filters: CivicSegment['filters']): any[] {
    const segmentFilters: any[] = []

    // Civic interests filter
    if (filters.civic_interests?.length) {
      segmentFilters.push({
        field: 'tag',
        key: 'primary_interest',
        relation: '=',
        value: filters.civic_interests[0] // OneSignal limitation: single value
      })
    }

    // Engagement level filter
    if (filters.engagement_level?.length) {
      segmentFilters.push({
        field: 'tag',
        key: 'engagement_level',
        relation: '=',
        value: filters.engagement_level[0]
      })
    }

    // Location filters
    if (filters.location?.states?.length) {
      segmentFilters.push({
        field: 'tag',
        key: 'state',
        relation: '=',
        value: filters.location.states[0]
      })
    }

    // Quiz performance filters
    if (filters.quiz_performance?.min_completion_rate) {
      segmentFilters.push({
        field: 'tag',
        key: 'quiz_completion_rate',
        relation: '>',
        value: filters.quiz_performance.min_completion_rate.toString()
      })
    }

    return segmentFilters
  }

  private buildEmailBody(notification: CivicNotification): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        
        ${notification.data?.quiz_id ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/quiz/${notification.data.quiz_id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Take Quiz
            </a>
          </div>
        ` : ''}
        
        ${notification.data?.article_url ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${notification.data.article_url}" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Read Article
            </a>
          </div>
        ` : ''}
        
        <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          You're receiving this because you're subscribed to CivicSense civic engagement updates.
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `
  }

  private async storeCivicJourney(journey: any): Promise<void> {
    // Store journey in our database for tracking and management
    // This would integrate with your existing Supabase setup
  }

  private async activateJourneyTriggers(journey: CivicJourney): Promise<void> {
    // Set up trigger monitoring for journey activation
    // This would integrate with your existing event system
  }

  private extractTopContent(response: any): Array<{ type: string; title: string; engagement_rate: number }> {
    // Process OneSignal analytics to extract top-performing civic content
    return []
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${this.config.restApiKey}`
    }

    const options: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OneSignal API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}

export { OneSignalCivicClient, type CivicUser, type CivicSegment, type CivicNotification, type CivicJourney } 