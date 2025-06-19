import { z } from 'zod'

// Plunk API configuration and types
const PLUNK_API_URL = 'https://api.useplunk.com/v1'
const PLUNK_API_KEY = process.env.PLUNK_API_KEY

if (!PLUNK_API_KEY) {
  console.warn('PLUNK_API_KEY environment variable not set. Email sending will be disabled.')
}

// Email template schemas for validation
const BaseEmailSchema = z.object({
  to: z.string().email(),
  from: z.string().email().optional(),
  subject: z.string().min(1),
  body: z.string().optional(),
  html: z.string().optional(),
  headers: z.record(z.string()).optional(),
  reply_to: z.string().email().optional()
})

const TemplateEmailSchema = z.object({
  to: z.string().email(),
  template: z.string(),
  data: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
  reply_to: z.string().email().optional(),
  subject: z.string().optional()
})

// Email types for analytics tracking
export type EmailType = 
  | 'welcome'
  | 'learning_pod_invitation'
  | 'password_reset'
  | 'quiz_achievement'
  | 'level_up'
  | 'gift_claim'
  | 'educational_access'
  | 'weekly_digest'
  | 'streak_encouragement'
  | 'onboarding_completion'
  | 'premium_welcome'
  | 'subscription_expiring'
  | 'account_verification'
  | 'achievement'
  | 'streak'
  | 'pod_invitation'
  | 're_engagement'
  | 'civic_news_alert'

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  emailType: EmailType
  recipient: string
  timestamp: number
}

export interface EmailAnalytics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
}

// CivicSense email service class
export class CivicSenseEmailService {
  private apiKey: string | undefined
  private fromEmail: string
  private fromName: string

  constructor() {
    this.apiKey = PLUNK_API_KEY
    this.fromEmail = process.env.FROM_EMAIL || 'hello@civicsense.us'
    this.fromName = process.env.FROM_NAME || 'CivicSense'
  }

  /**
   * Get default subject for email type
   */
  private getDefaultSubject(emailType: EmailType, data: Record<string, any> = {}): string {
    const subjects: Record<EmailType, string> = {
      welcome: 'Welcome to CivicSense - Your civic education journey begins!',
      learning_pod_invitation: `You're invited to join ${data.pod_name || 'a learning pod'}`,
      password_reset: 'Reset your CivicSense password',
      quiz_achievement: `🎉 Achievement unlocked: ${data.achievement_title || 'New milestone'}`,
      level_up: `🚀 Level up! You've reached ${data.level_title || 'a new level'}`,
      gift_claim: 'Your CivicSense gift is ready to claim!',
      educational_access: 'Your educational access has been activated',
      weekly_digest: 'Your civic learning this week',
      streak_encouragement: `${data.streak_count || 'Multi'}-day learning streak!`,
      onboarding_completion: 'Welcome to the CivicSense community!',
      premium_welcome: 'Welcome to CivicSense Premium!',
      subscription_expiring: 'Your CivicSense subscription expires soon',
      account_verification: 'Verify your CivicSense account',
      achievement: `🎯 ${data.achievement_title || 'Achievement unlocked'}`,
      streak: `🔥 ${data.streak_count || 'Learning'} day streak - keep it going!`,
      pod_invitation: `Join ${data.pod_name || 'our learning pod'} on CivicSense`,
      re_engagement: 'Democracy didn\'t stop while you were away',
      civic_news_alert: `${data.news_headline || 'Important civic update'}`
    }
    
    return subjects[emailType] || 'CivicSense Update'
  }

  /**
   * Send a templated email using Plunk
   */
  async sendTemplateEmail({
    to,
    template,
    data = {},
    emailType,
    headers = {},
    reply_to,
    subject
  }: {
    to: string
    template: string
    data?: Record<string, any>
    emailType: EmailType
    headers?: Record<string, string>
    reply_to?: string
    subject?: string
  }): Promise<EmailResult> {
    const startTime = performance.now()
    
    try {
      // Validate input
      const validatedInput = TemplateEmailSchema.parse({
        to,
        template,
        data,
        headers,
        reply_to,
        subject
      })

      // Get subject line - use provided subject or generate default
      const emailSubject = subject || this.getDefaultSubject(emailType, data)

      // If no API key, simulate email sending for development
      if (!this.apiKey) {
        console.log(`📧 [SIMULATED] Sending ${emailType} email to: ${to}`)
        console.log(`📧 Subject: ${emailSubject}`)
        console.log(`📧 Template: ${template}`)
        console.log(`📧 Data:`, data)
        
        return {
          success: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      // If data contains a 'body' field, treat this as a custom email instead of template
      if (data.body && typeof data.body === 'string') {
        console.log(`📧 Detected body field in data, sending as custom email instead of template`)
        return this.sendCustomEmail({
          to: validatedInput.to,
          subject: emailSubject,
          body: data.body,
          emailType,
          headers,
          reply_to
        })
      }

      // Send via Plunk API using template
      const response = await fetch(`${PLUNK_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...headers
        },
        body: JSON.stringify({
          to: validatedInput.to,
          subject: emailSubject,
          template: validatedInput.template,
          data: {
            ...validatedInput.data,
            // Add CivicSense branding data
            site_name: 'CivicSense',
            site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.us',
            support_email: 'support@civicsense.us',
            current_year: new Date().getFullYear()
          },
          reply_to: validatedInput.reply_to || this.fromEmail
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Plunk API error:', result)
        
        // If template doesn't exist and we have a body in data, fallback to custom email
        if (result.message?.includes('template') && data.body) {
          console.log(`📧 Template '${template}' not found, falling back to custom email`)
          return this.sendCustomEmail({
            to: validatedInput.to,
            subject: emailSubject,
            body: data.body,
            emailType,
            headers,
            reply_to
          })
        }
        
        return {
          success: false,
          error: result.error || 'Failed to send email',
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      // Track email success in analytics
      this.trackEmailEvent({
        eventType: 'email_sent',
        emailType,
        recipient: to,
        messageId: result.id,
        duration: performance.now() - startTime,
        template
      })

      return {
        success: true,
        messageId: result.id,
        emailType,
        recipient: to,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Email sending error:', error)
      
      // Track email failure
      this.trackEmailEvent({
        eventType: 'email_failed',
        emailType,
        recipient: to,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType,
        recipient: to,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Send a custom HTML email
   */
  async sendCustomEmail({
    to,
    subject,
    html,
    body,
    emailType,
    headers = {},
    reply_to
  }: {
    to: string
    subject: string
    html?: string
    body?: string
    emailType: EmailType
    headers?: Record<string, string>
    reply_to?: string
  }): Promise<EmailResult> {
    const startTime = performance.now()
    
    try {
      // Validate input
      const validatedInput = BaseEmailSchema.parse({
        to,
        subject,
        html,
        body,
        headers,
        reply_to
      })

      // If no API key, simulate email sending
      if (!this.apiKey) {
        console.log(`📧 [SIMULATED] Sending ${emailType} email to: ${to}`)
        console.log(`📧 Subject: ${subject}`)
        console.log(`📧 Content preview: ${(html || body || '').substring(0, 100)}...`)
        
        return {
          success: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      // Send via Plunk API
      const response = await fetch(`${PLUNK_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...headers
        },
        body: JSON.stringify({
          to: validatedInput.to,
          subject: validatedInput.subject,
          body: validatedInput.html || validatedInput.body,
          from: `${this.fromName} <${this.fromEmail}>`,
          reply_to: validatedInput.reply_to || this.fromEmail
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Plunk API error:', result)
        return {
          success: false,
          error: result.error || 'Failed to send email',
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      // Track email success
      this.trackEmailEvent({
        eventType: 'email_sent',
        emailType,
        recipient: to,
        messageId: result.id,
        duration: performance.now() - startTime,
        subject
      })

      return {
        success: true,
        messageId: result.id,
        emailType,
        recipient: to,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Email sending error:', error)
      
      // Track email failure
      this.trackEmailEvent({
        eventType: 'email_failed',
        emailType,
        recipient: to,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType,
        recipient: to,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Get email analytics from Plunk
   */
  async getEmailAnalytics(emailType?: EmailType, days: number = 30): Promise<EmailAnalytics | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      const response = await fetch(`${PLUNK_API_URL}/analytics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch email analytics')
        return null
      }

      const data = await response.json()
      
      return {
        sent: data.sent || 0,
        delivered: data.delivered || 0,
        opened: data.opened || 0,
        clicked: data.clicked || 0,
        bounced: data.bounced || 0,
        complained: data.complained || 0
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error)
      return null
    }
  }

  /**
   * Track email events for Statsig analytics integration
   */
  private trackEmailEvent({
    eventType,
    emailType,
    recipient,
    messageId,
    duration,
    template,
    subject,
    error
  }: {
    eventType: 'email_sent' | 'email_failed' | 'email_opened' | 'email_clicked'
    emailType: EmailType
    recipient: string
    messageId?: string
    duration?: number
    template?: string
    subject?: string
    error?: string
  }) {
    // Only track in browser/client context where Statsig is available
    if (typeof window !== 'undefined') {
      try {
        // Import analytics dynamically to avoid SSR issues
        import('@/utils/analytics').then(({ useAnalytics }) => {
          // This would need to be called from a React component context
          // For now, we'll use a simple console log
          console.log(`📊 Email Event: ${eventType}`, {
            email_type: emailType,
            recipient_domain: recipient.split('@')[1],
            message_id: messageId,
            duration_ms: duration,
            template,
            subject,
            error
          })
        })
      } catch (err) {
        console.warn('Could not track email event:', err)
      }
    }
    
    // Always log for server-side tracking
    console.log(`📧 ${eventType.toUpperCase()}: ${emailType} to ${recipient}`, {
      messageId,
      duration,
      template,
      subject,
      error
    })
  }

  /**
   * High-level convenience methods for email triggers
   */
  
  async sendAchievementEmail({
    to,
    user_name,
    achievement_type,
    achievement_title,
    achievement_description,
    celebration_data
  }: {
    to: string
    user_name: string
    achievement_type: string
    achievement_title: string
    achievement_description: string
    celebration_data: Record<string, any>
  }): Promise<EmailResult> {
    return this.sendTemplateEmail({
      to,
      template: 'achievement-celebration',
      data: {
        user_name,
        achievement_type,
        achievement_title,
        achievement_description,
        ...celebration_data
      },
      emailType: 'quiz_achievement'
    })
  }

  async sendLevelUpEmail({
    to,
    user_name,
    new_level,
    level_title,
    power_unlock_message,
    celebration_image,
    next_milestone
  }: {
    to: string
    user_name: string
    new_level: number
    level_title: string
    power_unlock_message: string
    celebration_image?: string
    next_milestone: any
  }): Promise<EmailResult> {
    return this.sendTemplateEmail({
      to,
      template: 'level-up-celebration',
      data: {
        user_name,
        new_level,
        level_title,
        power_unlock_message,
        celebration_image,
        next_milestone
      },
      emailType: 'level_up'
    })
  }

  async sendFirstShareEmail({
    to,
    user_name,
    share_platform,
    shared_content,
    civic_impact_message,
    community_stats,
    invite_friends_url,
    viral_content
  }: {
    to: string
    user_name: string
    share_platform: string
    shared_content: string
    civic_impact_message: string
    community_stats?: any
    invite_friends_url: string
    viral_content?: any
  }): Promise<EmailResult> {
    return this.sendTemplateEmail({
      to,
      template: 'first-share-celebration',
      data: {
        user_name,
        share_platform,
        shared_content,
        civic_impact_message,
        community_stats,
        invite_friends_url,
        viral_content
      },
      emailType: 'quiz_achievement'
    })
  }

  async sendWeeklyDigest({
    to,
    user_name,
    user_state,
    civic_level,
    week_summary,
    recommended_topics,
    local_civic_action,
    trending_discussions,
    this_week_in_democracy,
    streak_count
  }: {
    to: string
    user_name: string
    user_state: string
    civic_level: number
    week_summary: any
    recommended_topics: any[]
    local_civic_action: any[]
    trending_discussions?: any[]
    this_week_in_democracy?: string
    streak_count: number
  }): Promise<EmailResult> {
    return this.sendTemplateEmail({
      to,
      template: 'personalized-topic-digest',
      data: {
        user_name,
        user_state,
        civic_level,
        week_summary,
        recommended_topics,
        local_civic_action,
        trending_discussions,
        this_week_in_democracy,
        streak_count
      },
      emailType: 'weekly_digest'
    })
  }

  async sendReEngagementEmail({
    to,
    user_name,
    days_away,
    civic_moment_hook,
    personalized_comeback,
    quick_quiz_url,
    what_you_missed
  }: {
    to: string
    user_name: string
    days_away: number
    civic_moment_hook: string
    personalized_comeback: string
    quick_quiz_url: string
    what_you_missed?: string[]
  }): Promise<EmailResult> {
    return this.sendTemplateEmail({
      to,
      template: 're-engagement-civic-moment',
      data: {
        user_name,
        days_away,
        civic_moment_hook,
        personalized_comeback,
        quick_quiz_url,
        what_you_missed
      },
      emailType: 'streak_encouragement'
    })
  }

  /**
   * Validate email template data
   */
  validateTemplateData(template: string, data: Record<string, any>): boolean {
    // Define required fields for each template
    const templateRequirements: Record<string, string[]> = {
      'welcome': ['user_name'],
      'learning_pod_invitation': ['student_name', 'pod_name', 'teacher_name', 'join_url'],
      'password_reset': ['reset_url', 'user_name'],
      'quiz_achievement': ['user_name', 'achievement_name', 'score'],
      'level_up': ['user_name', 'new_level', 'xp_total'],
      'gift_claim': ['recipient_name', 'access_type', 'claim_url'],
      'educational_access': ['user_name', 'institution_domain'],
      'weekly_digest': ['user_name', 'weekly_stats'],
      'streak_encouragement': ['user_name', 'streak_count'],
      'onboarding_completion': ['user_name', 'next_steps'],
      'premium_welcome': ['user_name', 'subscription_type'],
      'subscription_expiring': ['user_name', 'expiry_date', 'renewal_url'],
      'account_verification': ['user_name', 'verification_url']
    }

    const required = templateRequirements[template] || []
    const missing = required.filter(field => !(field in data))
    
    if (missing.length > 0) {
      console.warn(`Missing required template data for ${template}:`, missing)
      return false
    }
    
    return true
  }
}

// Export singleton instance
export const emailService = new CivicSenseEmailService()

// Utility functions for common email types
export const sendWelcomeEmail = async (to: string, userName: string): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'welcome',
    data: { user_name: userName },
    emailType: 'welcome'
  })
}

export const sendPasswordResetEmail = async (to: string, userName: string, resetUrl: string): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'password_reset',
    data: { user_name: userName, reset_url: resetUrl },
    emailType: 'password_reset'
  })
}

export const sendLearningPodInvite = async ({
  to,
  studentName,
  podName,
  teacherName,
  joinUrl,
  courseName,
  requireParentConsent = false
}: {
  to: string
  studentName: string
  podName: string
  teacherName: string
  joinUrl: string
  courseName?: string
  requireParentConsent?: boolean
}): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'learning_pod_invitation',
    data: {
      student_name: studentName,
      pod_name: podName,
      teacher_name: teacherName,
      join_url: joinUrl,
      course_name: courseName,
      require_parent_consent: requireParentConsent
    },
    emailType: 'learning_pod_invitation'
  })
}

export const sendQuizAchievementEmail = async ({
  to,
  userName,
  achievementName,
  score,
  quizName
}: {
  to: string
  userName: string
  achievementName: string
  score: number
  quizName: string
}): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'quiz_achievement',
    data: {
      user_name: userName,
      achievement_name: achievementName,
      score,
      quiz_name: quizName
    },
    emailType: 'quiz_achievement'
  })
}

export const sendLevelUpEmail = async ({
  to,
  userName,
  newLevel,
  xpTotal
}: {
  to: string
  userName: string
  newLevel: number
  xpTotal: number
}): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'level_up',
    data: {
      user_name: userName,
      new_level: newLevel,
      xp_total: xpTotal
    },
    emailType: 'level_up'
  })
}

export const sendGiftClaimEmail = async ({
  to,
  recipientName,
  accessType,
  claimUrl,
  giftMessage
}: {
  to: string
  recipientName: string
  accessType: 'annual' | 'lifetime'
  claimUrl: string
  giftMessage?: string
}): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'gift_claim',
    data: {
      recipient_name: recipientName,
      access_type: accessType,
      claim_url: claimUrl,
      gift_message: giftMessage
    },
    emailType: 'gift_claim'
  })
}

export const sendEducationalAccessEmail = async ({
  to,
  userName,
  institutionDomain
}: {
  to: string
  userName: string
  institutionDomain: string
}): Promise<EmailResult> => {
  return emailService.sendTemplateEmail({
    to,
    template: 'educational_access',
    data: {
      user_name: userName,
      institution_domain: institutionDomain
    },
    emailType: 'educational_access'
  })
} 