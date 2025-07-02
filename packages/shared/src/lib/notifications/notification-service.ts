// ============================================================================
// GENERIC NOTIFICATION SERVICE
// ============================================================================
// Provider-agnostic notification system that can work with OneSignal, 
// Firebase, email, SMS, or any other notification provider
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// Notification Provider Types
export type NotificationProviderType = 'push' | 'email' | 'sms' | 'in_app'

export interface NotificationProvider {
  id: string
  provider_name: string
  provider_type: NotificationProviderType
  is_active: boolean
  configuration: Record<string, any>
  send: (notification: NotificationRequest) => Promise<NotificationResult>
}

// Notification Request Types
export interface NotificationRequest {
  id?: string
  title: string
  message: string
  target_users?: string[]
  target_segments?: string[]
  data?: Record<string, any>
  deep_link?: string
  action_url?: string
  scheduled_at?: Date
  civic_action_steps?: string[]
  urgency_level?: number
}

export interface NotificationResult {
  success: boolean
  provider_id: string
  external_id?: string
  sent_count?: number
  delivered_count?: number
  error?: string
}

// Campaign Types
export interface NotificationCampaign {
  id: string
  campaign_name: string
  campaign_type: string
  title: string
  message: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'failed' | 'cancelled'
  civic_urgency_level: number
  providers: string[] // Array of provider IDs
  target_segments: string[]
  civic_action_steps: string[]
  deep_link?: string
  action_url?: string
  scheduled_at?: Date
  created_at: Date
  updated_at: Date
  // Analytics
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  conversion_count: number
}

// Segment Types
export interface NotificationSegment {
  id: string
  segment_name: string
  description: string
  targeting_rules: {
    civic_engagement_level?: 'low' | 'medium' | 'high'
    quiz_completion_rate?: number
    location?: string[]
    voting_status?: 'registered' | 'unregistered' | 'voted'
    last_active_days?: number
    topics_interested?: string[]
  }
  actual_user_count: number
  is_active: boolean
  civic_category: string
}

// Template Types
export interface NotificationTemplate {
  id: string
  template_name: string
  template_type: string
  title_template: string
  message_template: string
  civic_focus: string
  usage_count: number
  variables: string[]
}

// ============================================================================
// NOTIFICATION PROVIDERS
// ============================================================================

// OneSignal Provider
class OneSignalProvider implements NotificationProvider {
  id = 'onesignal'
  provider_name = 'OneSignal'
  provider_type: NotificationProviderType = 'push'
  is_active = true
  configuration: Record<string, any>

  constructor(config: { app_id: string; rest_api_key: string }) {
    this.configuration = config
  }

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      const oneSignalData = {
        app_id: this.configuration.app_id,
        headings: { en: notification.title },
        contents: { en: notification.message },
        data: {
          ...notification.data,
          civic_action_steps: notification.civic_action_steps,
          deep_link: notification.deep_link,
          action_url: notification.action_url
        },
        ...(notification.target_users && {
          include_external_user_ids: notification.target_users
        }),
        ...(notification.target_segments && {
          included_segments: notification.target_segments
        }),
        ...(notification.scheduled_at && {
          send_after: notification.scheduled_at.toISOString()
        }),
        priority: notification.urgency_level || 1
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.configuration.rest_api_key}`
        },
        body: JSON.stringify(oneSignalData)
      })

      const result = await response.json()

      if (response.ok) {
        return {
          success: true,
          provider_id: this.id,
          external_id: result.id,
          sent_count: result.recipients || 0
        }
      } else {
        throw new Error(result.errors?.join(', ') || 'OneSignal API error')
      }
    } catch (error) {
      return {
        success: false,
        provider_id: this.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Email Provider (Generic)
class EmailProvider implements NotificationProvider {
  id = 'email'
  provider_name = 'Email'
  provider_type: NotificationProviderType = 'email'
  is_active = true
  configuration: Record<string, any>

  constructor(config: { smtp_host: string; api_key?: string }) {
    this.configuration = config
  }

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      // This would integrate with your email service (SendGrid, SES, etc.)
      console.log('Sending email notification:', notification)
      
      // Mock implementation for now
      return {
        success: true,
        provider_id: this.id,
        external_id: `email_${Date.now()}`,
        sent_count: notification.target_users?.length || 1
      }
    } catch (error) {
      return {
        success: false,
        provider_id: this.id,
        error: error instanceof Error ? error.message : 'Email sending failed'
      }
    }
  }
}

// SMS Provider (Generic)
class SMSProvider implements NotificationProvider {
  id = 'sms'
  provider_name = 'SMS'
  provider_type: NotificationProviderType = 'sms'
  is_active = false // Disabled by default
  configuration: Record<string, any>

  constructor(config: { api_key: string; character_limit?: number }) {
    this.configuration = config
  }

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      // This would integrate with your SMS service (Twilio, etc.)
      console.log('Sending SMS notification:', notification)
      
      // Mock implementation for now
      return {
        success: true,
        provider_id: this.id,
        external_id: `sms_${Date.now()}`,
        sent_count: notification.target_users?.length || 1
      }
    } catch (error) {
      return {
        success: false,
        provider_id: this.id,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      }
    }
  }
}

// ============================================================================
// NOTIFICATION SERVICE MANAGER
// ============================================================================

export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map()
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize OneSignal if configured
    if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY) {
      const oneSignal = new OneSignalProvider({
        app_id: process.env.ONESIGNAL_APP_ID,
        rest_api_key: process.env.ONESIGNAL_REST_API_KEY
      })
      this.providers.set('onesignal', oneSignal)
    }

    // Initialize Email provider if configured
    if (process.env.EMAIL_SMTP_HOST) {
      const email = new EmailProvider({
        smtp_host: process.env.EMAIL_SMTP_HOST,
        api_key: process.env.EMAIL_API_KEY
      })
      this.providers.set('email', email)
    }

    // Initialize SMS provider if configured
    if (process.env.SMS_API_KEY) {
      const sms = new SMSProvider({
        api_key: process.env.SMS_API_KEY,
        character_limit: 160
      })
      this.providers.set('sms', sms)
    }
  }

  // Get all available providers
  getProviders(): NotificationProvider[] {
    return Array.from(this.providers.values())
  }

  // Get active providers
  getActiveProviders(): NotificationProvider[] {
    return this.getProviders().filter(provider => provider.is_active)
  }

  // Send notification via specific provider
  async sendViaProvider(
    providerId: string, 
    notification: NotificationRequest
  ): Promise<NotificationResult> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      return {
        success: false,
        provider_id: providerId,
        error: `Provider ${providerId} not found`
      }
    }

    if (!provider.is_active) {
      return {
        success: false,
        provider_id: providerId,
        error: `Provider ${providerId} is disabled`
      }
    }

    return provider.send(notification)
  }

  // Send notification via multiple providers
  async sendMultiChannel(
    providerIds: string[],
    notification: NotificationRequest
  ): Promise<NotificationResult[]> {
    const results = await Promise.all(
      providerIds.map(providerId => this.sendViaProvider(providerId, notification))
    )

    return results
  }

  // Create and send campaign
  async sendCampaign(campaignId: string): Promise<{
    success: boolean
    results: NotificationResult[]
    error?: string
  }> {
    try {
      // In a real implementation, this would fetch the campaign from the database
      // For now, we'll use mock data
      const campaign: NotificationCampaign = {
        id: campaignId,
        campaign_name: 'Civic Quiz Reminder',
        campaign_type: 'quiz_reminder',
        title: 'Time for your civic quiz!',
        message: 'Test your knowledge and strengthen democracy.',
        status: 'draft',
        civic_urgency_level: 2,
        providers: ['onesignal', 'email'],
        target_segments: ['active_learners'],
        civic_action_steps: [
          'Complete your quiz to earn civic points',
          'Share your results to encourage others',
          'Take action on issues you learn about'
        ],
        deep_link: 'civicsense://quiz/constitutional-rights',
        scheduled_at: undefined,
        created_at: new Date(),
        updated_at: new Date(),
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        conversion_count: 0
      }

      const notification: NotificationRequest = {
        id: campaign.id,
        title: campaign.title,
        message: campaign.message,
        target_segments: campaign.target_segments,
        data: {
          campaign_id: campaign.id,
          campaign_type: campaign.campaign_type
        },
        deep_link: campaign.deep_link,
        civic_action_steps: campaign.civic_action_steps,
        urgency_level: campaign.civic_urgency_level
      }

      const results = await this.sendMultiChannel(campaign.providers, notification)

      // Update campaign status and analytics
      // In a real implementation, this would update the database

      return {
        success: results.some(r => r.success),
        results
      }
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Campaign sending failed'
      }
    }
  }

  // Civic-specific methods
  async sendQuizReminder(userId: string, quizTopic: string): Promise<NotificationResult[]> {
    const notification: NotificationRequest = {
      title: 'Ready for your civic quiz?',
      message: `Test your knowledge on ${quizTopic} and strengthen democracy!`,
      target_users: [userId],
      civic_action_steps: [
        'Complete the quiz to build civic knowledge',
        'Share what you learn with friends',
        'Apply your knowledge to local issues'
      ],
      deep_link: `civicsense://quiz/${quizTopic}`,
      urgency_level: 2
    }

    return this.sendMultiChannel(['onesignal'], notification)
  }

  async sendVotingReminder(userId: string, electionDate: Date): Promise<NotificationResult[]> {
    const daysUntil = Math.ceil((electionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    const notification: NotificationRequest = {
      title: `Election in ${daysUntil} days!`,
      message: 'Make your voice heard in democracy. Check your registration and polling location.',
      target_users: [userId],
      civic_action_steps: [
        'Verify your voter registration',
        'Find your polling location',
        'Research candidates and issues',
        'Make a voting plan'
      ],
      deep_link: 'civicsense://voting-guide',
      urgency_level: 4
    }

    return this.sendMultiChannel(['onesignal', 'email'], notification)
  }

  async sendBreakingCivicNews(
    segmentId: string, 
    headline: string, 
    summary: string
  ): Promise<NotificationResult[]> {
    const notification: NotificationRequest = {
      title: `Breaking: ${headline}`,
      message: summary,
      target_segments: [segmentId],
      civic_action_steps: [
        'Read the full analysis',
        'Contact your representatives',
        'Share with your community',
        'Take civic action'
      ],
      deep_link: 'civicsense://news/breaking',
      urgency_level: 5
    }

    return this.sendMultiChannel(['onesignal', 'email'], notification)
  }
}

// Singleton instance
export const notificationService = new NotificationService() 