import { z } from 'zod'

// MailerLite API configuration and types
const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api'
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY

if (!MAILERLITE_API_KEY) {
  console.warn('MAILERLITE_API_KEY environment variable not set. Email sending will be disabled.')
}

// Email template schemas for validation
const BaseEmailSchema = z.object({
  to: z.string().email(),
  from: z.string().email().optional(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  reply_to: z.string().email().optional()
})

const TemplateEmailSchema = z.object({
  to: z.string().email(),
  template_id: z.string(),
  variables: z.record(z.any()).optional(),
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
  template?: string
  recipient?: string
  timestamp?: number
  skipped?: boolean
  reason?: string
  metadata?: {
    duration: number
    userId?: string
    to: string
  }
}

export interface EmailAnalytics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
}

interface UserEmailPreferences {
  email_notifications: boolean
  weekly_digest: boolean
  achievement_alerts: boolean
  email_delivery_frequency: string
  email_format: string
  marketing_emails: boolean
  product_updates: boolean
  community_digest: boolean
  survey_invitations: boolean
  civic_news_alerts: boolean
  re_engagement_emails: boolean
  notification_channels: string[] | object
}

// CivicSense email service class using MailerLite
export class CivicSenseEmailService {
  private apiKey: string | undefined
  private fromEmail: string
  private fromName: string
  private defaultGroupId: string

  constructor() {
    this.apiKey = MAILERLITE_API_KEY
    this.fromEmail = process.env.FROM_EMAIL || 'tan@civicsense.one'
    this.fromName = process.env.FROM_NAME || 'Tán from CivicSense'
    this.defaultGroupId = process.env.MAILERLITE_GROUP_ID || ''
    
    console.log('📧 [INIT] CivicSenseEmailService initialized with MailerLite:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      hasGroupId: !!this.defaultGroupId
    })
    
    // Warn if API key is missing
    if (!this.apiKey) {
      console.warn('⚠️ MAILERLITE_API_KEY not found. Email sending will fail. Please check your environment variables.')
    }

    if (!this.defaultGroupId) {
      console.warn('⚠️ MAILERLITE_GROUP_ID not found. Contact management features will be limited.')
    }
  }

  /**
   * Get default subject for email type
   */
  private getDefaultSubject(emailType: EmailType, data: Record<string, any> = {}): string {
    const subjects: Record<EmailType, string> = {
      welcome: 'You just joined something most politicians don\'t want you to have',
      learning_pod_invitation: `${data.inviter_name || 'Someone'} wants to understand democracy with you`,
      password_reset: 'Get back into your CivicSense account',
      quiz_achievement: data.quiz_topic ? `You just figured out ${data.quiz_topic}` : 'You just understood something most Americans don\'t',
      level_up: data.level_title ? `You\'ve unlocked ${data.level_title}` : 'You now understand more than most college graduates',
      gift_claim: 'Someone believes you should understand how power works',
      educational_access: 'Your classroom access is ready',
      weekly_digest: 'This week you learned what most people don\'t know',
      streak_encouragement: data.streak_count ? `${data.streak_count} days of understanding how democracy actually works` : 'You\'re building real civic power',
      onboarding_completion: 'Welcome to understanding how power really works',
      premium_welcome: 'Now you have the tools most citizens never get',
      subscription_expiring: 'Your access to deeper civic understanding expires soon',
      account_verification: 'One step closer to understanding power',
      achievement: data.achievement_title || 'You just learned something politicians wish you hadn\'t',
      streak: data.streak_count ? `${data.streak_count} days of civic learning that actually matters` : 'This consistency is exactly how you build civic power',
      pod_invitation: data.pod_name ? `Join "${data.pod_name}" for learning that actually prepares you for democracy` : 'Learn with others who want to understand how government really works',
      re_engagement: 'Democracy didn\'t stop while you were away',
      civic_news_alert: data.news_headline || 'This affects you more than the news is telling you'
    }
    
    return subjects[emailType] || 'Something important about how power works'
  }

  /**
   * Check if user wants to receive this type of email
   * TODO: Implement database check once user_email_preferences table is created
   */
  private async checkUserEmailPreferences(userId: string, emailType: EmailType): Promise<boolean> {
    if (!userId) return true // Send if no user ID (guest users, etc.)

    // Temporary: Always allow emails until database migration is applied
    console.log(`📧 [TEMP] Email preference check bypassed for ${emailType} - user: ${userId}`)
    return true
  }

  /**
   * Create or update a subscriber in MailerLite
   */
  async createOrUpdateSubscriber(
    email: string, 
    data: Record<string, any> = {},
    groups: string[] = []
  ): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'No API key configured' }
    }

    try {
      const subscriberData = {
        email,
        fields: {
          name: data.user_name || data.display_name || email.split('@')[0],
          last_name: data.last_name || '',
          company: 'CivicSense',
          country: data.country || 'US',
          city: data.city || '',
          phone: data.phone || '',
          state: data.state || '',
          z_i_p: data.zip || '',
          // Custom fields for CivicSense
          civic_level: data.civic_level || 1,
          subscription_tier: data.subscription_tier || 'free',
          learning_streak: data.learning_streak || 0,
          quiz_count: data.quiz_count || 0
        },
        groups: groups.length > 0 ? groups : (this.defaultGroupId ? [this.defaultGroupId] : []),
        status: 'active',
        subscribed_at: new Date().toISOString(),
        ip_address: data.ip_address || null,
        opted_in_at: new Date().toISOString(),
        optin_ip: data.ip_address || null
      }

      console.log('📧 [MAILERLITE] Creating/updating subscriber:', {
        email,
        hasGroups: subscriberData.groups.length > 0,
        fieldsCount: Object.keys(subscriberData.fields).length
      })

      const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(subscriberData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('MailerLite subscriber API error:', result)
        return {
          success: false,
          error: result.message || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      console.log(`📧 [MAILERLITE] Subscriber created/updated: ${email}`)
      return {
        success: true,
        subscriberId: result.data?.id
      }

    } catch (error) {
      console.error('Error creating/updating MailerLite subscriber:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send a transactional email using MailerLite
   */
  async sendTransactionalEmail({
    to,
    subject,
    html,
    text,
    template_id,
    variables = {},
    emailType,
    reply_to,
    userId
  }: {
    to: string
    subject?: string
    html?: string
    text?: string
    template_id?: string
    variables?: Record<string, any>
    emailType: EmailType
    reply_to?: string
    userId?: string
  }): Promise<EmailResult> {
    const startTime = performance.now()
    
    try {
      // Check user email preferences first
      if (userId) {
        const shouldSend = await this.checkUserEmailPreferences(userId, emailType)
        if (!shouldSend) {
          console.log(`📧 [SKIPPED] User ${userId} has disabled ${emailType} emails`)
          return {
            success: true,
            messageId: `skipped_${Date.now()}`,
            emailType,
            skipped: true,
            reason: 'User preferences'
          }
        }

        // Create/update subscriber with metadata
        try {
          await this.createOrUpdateSubscriber(to, variables, [this.defaultGroupId].filter(Boolean))
        } catch (syncError) {
          console.warn('📧 [WARNING] Subscriber sync failed, continuing with email:', syncError)
        }
      }

      if (!this.apiKey) {
        // Simulate email sending in development
        console.log(`📧 [SIMULATED] MailerLite email send (no API key)`)
        console.log(`📧 [SIMULATED] ${emailType} to: ${to}`)
        console.log(`📧 [SIMULATED] Subject: ${subject || this.getDefaultSubject(emailType, variables)}`)
        
        return {
          success: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      const finalSubject = subject || this.getDefaultSubject(emailType, variables)
      
      // Prepare email payload for MailerLite transactional API
      const emailPayload: any = {
        to: [{ email: to, name: variables.user_name || to.split('@')[0] }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        reply_to: {
          email: reply_to || this.fromEmail,
          name: this.fromName
        },
        subject: finalSubject,
        variables: {
          // Standard MailerLite variables
          email: to,
          name: variables.user_name || variables.display_name || to.split('@')[0],
          // Custom variables
          ...variables,
          // CivicSense branding
          site_name: 'CivicSense',
          site_url: 'https://civicsense.us',
          support_email: 'support@civicsense.us',
          current_year: new Date().getFullYear(),
          founder_name: 'Tán'
        }
      }

      // Add template or content
      if (template_id) {
        emailPayload.template_id = template_id
      } else {
        // For non-template emails, use HTML or text content
        if (html) {
          emailPayload.html = html
        }
        if (text) {
          emailPayload.text = text
        }
        
        // If no content provided, create simple HTML from variables
        if (!html && !text) {
          emailPayload.html = this.generateSimpleEmailHTML(finalSubject, variables)
        }
      }

      console.log('📧 [MAILERLITE] Sending transactional email:', {
        to: emailPayload.to[0].email,
        subject: emailPayload.subject,
        hasTemplate: !!template_id,
        hasHtml: !!emailPayload.html,
        hasText: !!emailPayload.text,
        variableCount: Object.keys(emailPayload.variables).length
      })

      const response = await fetch(`${MAILERLITE_API_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(emailPayload)
      })

      const result = await response.json()
      const duration = performance.now() - startTime

      if (!response.ok) {
        console.error('MailerLite transactional email API error:', result)
        return {
          success: false,
          error: result.message || `HTTP ${response.status}: ${response.statusText}`,
          emailType,
          recipient: to,
          timestamp: Date.now(),
          metadata: {
            duration: Math.round(duration),
            userId,
            to
          }
        }
      }

      // Track email success
      this.trackEmailEvent({
        eventType: 'email_sent',
        emailType,
        recipient: to,
        messageId: result.data?.id,
        duration,
        subject: finalSubject
      })

      console.log(`📧 [SENT] MailerLite email sent to ${to} in ${Math.round(duration)}ms`)
      
      return {
        success: true,
        messageId: result.data?.id || `sent_${Date.now()}`,
        emailType,
        recipient: to,
        timestamp: Date.now(),
        metadata: {
          duration: Math.round(duration),
          userId,
          to
        }
      }

    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`📧 [ERROR] Failed to send MailerLite email:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType,
        recipient: to,
        timestamp: Date.now(),
        metadata: {
          duration: Math.round(duration),
          userId,
          to
        }
      }
    }
  }

  /**
   * Legacy method compatibility - maps to sendTransactionalEmail
   */
  async sendTemplateEmail({
    to,
    template,
    data = {},
    emailType,
    headers = {},
    reply_to,
    subject,
    userId
  }: {
    to: string
    template: string
    data?: Record<string, any>
    emailType: EmailType
    headers?: Record<string, string>
    reply_to?: string
    subject?: string
    userId?: string
  }): Promise<EmailResult> {
    return this.sendTransactionalEmail({
      to,
      template_id: template,
      variables: data,
      emailType,
      reply_to,
      subject,
      userId
    })
  }

  /**
   * Legacy method compatibility - maps to sendTransactionalEmail
   */
  async sendCustomEmail({
    to,
    subject,
    html,
    body,
    emailType,
    headers = {},
    reply_to,
    userId
  }: {
    to: string
    subject: string
    html?: string
    body?: string
    emailType: EmailType
    headers?: Record<string, string>
    reply_to?: string
    userId?: string
  }): Promise<EmailResult> {
    return this.sendTransactionalEmail({
      to,
      subject,
      html,
      text: body,
      emailType,
      reply_to,
      userId
    })
  }

  /**
   * Generate simple HTML email from variables
   */
  private generateSimpleEmailHTML(subject: string, variables: Record<string, any>): string {
    const userName = variables.user_name || variables.display_name || 'there'
    const body = variables.body || variables.message || `Hello ${userName}!`
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); color: white; padding: 32px 24px; text-align: center; }
        .content { padding: 32px 24px; }
        .footer { padding: 24px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px; }
        .cta-button { background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 16px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${subject}</h1>
    </div>
    
    <div class="content">
        <p>Hi ${userName},</p>
        <p>${body}</p>
        
        ${variables.action_url ? `
        <div style="text-align: center; margin: 32px 0;">
            <a href="${variables.action_url}" class="cta-button">
                ${variables.action_text || 'Continue Learning'}
            </a>
        </div>
        ` : ''}
        
        <p>Keep building your civic power,<br>
        <strong>Tán Ho</strong><br>
        Founder, CivicSense</p>
    </div>
    
    <div class="footer">
        <p>CivicSense • Understanding how power really works</p>
        <p>
            <a href="https://civicsense.us" style="color: #6b7280;">Visit Site</a> • 
            <a href="{$unsubscribe_url}" style="color: #6b7280;">Unsubscribe</a>
        </p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Test API key by making a simple API call
   */
  async testApiKey(): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'No API key configured',
        error: 'MAILERLITE_API_KEY environment variable not set'
      }
    }

    try {
      // Test API key by calling the groups endpoint (lightweight call)
      const response = await fetch(`${MAILERLITE_API_URL}/groups`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (response.ok) {
        return {
          success: true,
          message: 'MailerLite API key is valid and working'
        }
      } else if (response.status === 401 || response.status === 403) {
        const error = await response.text()
        return {
          success: false,
          message: 'MailerLite API key authentication failed',
          error: `HTTP ${response.status}: Invalid API key`
        }
      } else {
        const error = await response.text()
        return {
          success: false,
          message: 'MailerLite API key test failed',
          error: `HTTP ${response.status}: ${error}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'MailerLite API key test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get email analytics from MailerLite
   */
  async getEmailAnalytics(emailType?: EmailType, days: number = 30): Promise<EmailAnalytics | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      // MailerLite doesn't have a single analytics endpoint, we'd need to aggregate from campaigns
      // For now, return null to indicate analytics aren't available
      console.log('📊 [MAILERLITE] Email analytics not yet implemented for MailerLite')
      return null
    } catch (error) {
      console.error('Error fetching MailerLite analytics:', error)
      return null
    }
  }

  /**
   * Track email events for analytics integration
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
    // Log for analytics tracking
    console.log(`📧 ${eventType.toUpperCase()}: ${emailType} to ${recipient}`, {
      messageId,
      duration,
      template,
      subject,
      error,
      recipientDomain: recipient.split('@')[1]
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
    return this.sendTransactionalEmail({
      to,
      template_id: 'achievement-celebration',
      variables: {
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
    return this.sendTransactionalEmail({
      to,
      template_id: 'level-up-celebration',
      variables: {
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
    return this.sendTransactionalEmail({
      to,
      template_id: 'first-share-celebration',
      variables: {
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
    return this.sendTransactionalEmail({
      to,
      template_id: 'personalized-topic-digest',
      variables: {
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
    return this.sendTransactionalEmail({
      to,
      template_id: 're-engagement-civic-moment',
      variables: {
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'welcome',
    variables: { user_name: userName },
    emailType: 'welcome'
  })
}

export const sendPasswordResetEmail = async (to: string, userName: string, resetUrl: string): Promise<EmailResult> => {
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'password_reset',
    variables: { user_name: userName, reset_url: resetUrl },
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'learning_pod_invitation',
    variables: {
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'quiz_achievement',
    variables: {
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'level_up',
    variables: {
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'gift_claim',
    variables: {
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
  return emailService.sendTransactionalEmail({
    to,
    template_id: 'educational_access',
    variables: {
      user_name: userName,
      institution_domain: institutionDomain
    },
    emailType: 'educational_access'
  })
} 