/**
 * MailerSend Email Service for CivicSense
 * 
 * This service handles transactional emails using MailerSend API.
 * MailerSend is designed for transactional emails (notifications, confirmations, etc.)
 * while MailerLite is for marketing emails (newsletters, campaigns).
 * 
 * For CivicSense's use case, we need MailerSend.
 */

import { z } from 'zod'

// Environment variables
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY
const MAILERSEND_API_URL = 'https://api.mailersend.com/v1'

// Email types for CivicSense
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
  | 'survey_invitations'
  | 'survey-invitation'
  | 'survey-completion'
  | 'survey-reminder'
  | 'survey-feedback-followup'
  | 'feedback-acknowledgment'
  | 'feedback-followup'

// Email result interface
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  emailType: EmailType
  recipient?: string
  timestamp?: number
  metadata?: Record<string, any>
  skipped?: boolean
  reason?: string
}

interface MailerSendEmailData {
  from: {
    email: string
    name: string
  }
  to: Array<{
    email: string
    name?: string
  }>
  subject: string
  html?: string
  text?: string
  template_id?: string
  personalization?: Array<{
    email: string
    data: Record<string, any>
  }>
  tags?: string[]
}

interface MailerSendResponse {
  success: boolean
  messageId?: string
  error?: string
  data?: any
}

export class CivicSenseEmailService {
  private apiKey: string
  private baseUrl: string = 'https://api.mailersend.com/v1'
  private fromEmail: string
  private fromName: string
  private defaultGroupId: string

  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY || ''
    this.fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'tan@civicsense.one'
    this.fromName = process.env.MAILERSEND_FROM_NAME || 'Tán from CivicSense'
    this.defaultGroupId = process.env.MAILERLITE_GROUP_ID || '' // Keep for backward compatibility
    
    console.log('📧 [INIT] CivicSenseEmailService initialized with MailerSend:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      baseUrl: this.baseUrl
    })

    // Warn if API key is missing
    if (!this.apiKey) {
      console.warn('⚠️ MAILERSEND_API_KEY not found. Email functionality will be limited.')
    }

    // Note: MailerSend doesn't use group IDs like MailerLite
    if (!this.defaultGroupId) {
      console.log('ℹ️ No MailerLite group ID configured (not needed for MailerSend transactional emails)')
    }
  }

  /**
   * Track email events for analytics
   */
  private trackEmailEvent(event: {
    eventType: string
    emailType: EmailType
    recipient: string
    messageId?: string
    duration?: number
    subject?: string
  }): void {
    console.log('📧 [ANALYTICS]', event)
    // TODO: Implement proper analytics tracking
  }

  /**
   * Test API key validity
   */
  async testApiKey(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        return { success: true, message: 'MailerSend API key is valid and working' }
      } else {
        const errorData = await response.text()
        return { success: false, message: `API key test failed: ${response.status} - ${errorData}` }
      }
    } catch (error) {
      return { success: false, message: `API key test failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  /**
   * Send a transactional email using MailerSend
   */
  async sendTransactionalEmail(
    to: string,
    subject: string,
    data: Record<string, any> = {},
    template_id?: string,
    emailType: EmailType = 'welcome'
  ): Promise<EmailResult> {
    const startTime = performance.now()
    
    try {
      if (!this.apiKey) {
        console.error('❌ [EMAIL] MailerSend API key not configured')
        return { 
          success: false, 
          error: 'MailerSend API key not configured',
          emailType,
          recipient: to,
          timestamp: Date.now()
        }
      }

      // Prepare email data
      const emailData: MailerSendEmailData = {
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        to: [{
          email: to,
          name: data.user_name || data.user_first_name || 'CivicSense User'
        }],
        subject: subject
      }

      // Add template or content
      if (template_id) {
        emailData.template_id = template_id
        if (Object.keys(data).length > 0) {
          emailData.personalization = [{
            email: to,
            data: data
          }]
        }
      } else {
        // Generate HTML and text content if no template
        emailData.html = data.html || this.generateDefaultHtml(subject, data)
        emailData.text = data.text || this.generateDefaultText(subject, data)
      }

      // Add tags for tracking
      if (data.email_type || emailType) {
        emailData.tags = [`civicsense-${data.email_type || emailType}`, 'transactional']
      }

      console.log('📧 [SEND] Sending email via MailerSend:', {
        to: to,
        subject: subject,
        hasTemplate: !!template_id,
        hasPersonalization: !!emailData.personalization,
        dataKeys: Object.keys(data)
      })

      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(emailData)
      })

      const responseText = await response.text()
      const duration = performance.now() - startTime
      
      if (response.ok) {
        const messageId = response.headers.get('x-message-id')
        console.log('✅ [EMAIL] Email sent successfully:', {
          messageId,
          to,
          subject
        })
        
        // Track email success
        this.trackEmailEvent({
          eventType: 'email_sent',
          emailType,
          recipient: to,
          messageId: messageId || 'unknown',
          duration,
          subject
        })
        
        return {
          success: true,
          messageId: messageId || 'unknown',
          emailType,
          recipient: to,
          timestamp: Date.now(),
          metadata: {
            duration: Math.round(duration),
            to
          }
        }
      } else {
        console.error('❌ [EMAIL] Failed to send email:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText,
          to,
          subject
        })
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Response is not JSON, use status text
        }
        
        return {
          success: false,
          error: errorMessage,
          emailType,
          recipient: to,
          timestamp: Date.now(),
          metadata: {
            duration: Math.round(duration),
            to
          }
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime
      console.error('❌ [EMAIL] Exception while sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        emailType,
        recipient: to,
        timestamp: Date.now(),
        metadata: {
          duration: Math.round(duration),
          to
        }
      }
    }
  }

  /**
   * Legacy compatibility method - maps to sendTransactionalEmail
   */
  async sendTemplateEmail(
    to: string,
    template: string,
    data: Record<string, any> = {}
  ): Promise<EmailResult> {
    // Map template names to subjects for backward compatibility
    const subjectMap: Record<string, string> = {
      'welcome': data.subject || "You just joined something most politicians don't want you to have",
      'achievement': data.subject || "You just mastered something they hoped you'd never understand",
      'level_up': data.subject || "You've leveled up your civic knowledge",
      'streak': data.subject || "Your civic learning streak is impressive",
      'pod_invitation': data.subject || "You're invited to join a learning pod",
      'weekly_digest': data.subject || "This week in democracy: What they don't want you to know",
      're_engagement': data.subject || "Your civic education is waiting",
      'civic_news_alert': data.subject || "Breaking: Something they don't want you to understand"
    }

    const subject = subjectMap[template] || data.subject || 'Update from CivicSense'
    const emailType = template as EmailType
    
    return this.sendTransactionalEmail(to, subject, { ...data, email_type: template }, undefined, emailType)
  }

  /**
   * Generate default HTML content
   */
  private generateDefaultHtml(subject: string, data: Record<string, any>): string {
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
        <h1>CivicSense</h1>
        <p>Civic education that politicians don't want you to have</p>
    </div>
    
    <div class="content">
        <h2>${subject}</h2>
        
        ${data.body ? `<p>${data.body}</p>` : ''}
        
        ${data.personal_note_from_founder ? `
        <blockquote style="border-left: 4px solid #dc2626; padding-left: 16px; margin: 24px 0; font-style: italic;">
            ${data.personal_note_from_founder}
            <br><br>
            — ${data.founder_name || 'Tán'}
        </blockquote>
        ` : ''}
        
        ${data.action_url ? `
        <div style="text-align: center; margin: 32px 0;">
            <a href="${data.action_url}" class="cta-button">${data.action_text || 'Take Action'}</a>
        </div>
        ` : ''}
        
        <p>Keep learning, keep questioning, and remember: democracy works best when citizens understand how power actually operates.</p>
    </div>
    
    <div class="footer">
        <p>© ${data.current_year || new Date().getFullYear()} CivicSense</p>
        <p>Civic education for people who want to understand how democracy really works.</p>
        ${data.support_email ? `<p>Questions? Email us at <a href="mailto:${data.support_email}">${data.support_email}</a></p>` : ''}
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate default text content
   */
  private generateDefaultText(subject: string, data: Record<string, any>): string {
    let text = `${subject}\n\n`
    
    if (data.body) {
      text += `${data.body}\n\n`
    }
    
    if (data.personal_note_from_founder) {
      text += `"${data.personal_note_from_founder}"\n— ${data.founder_name || 'Tán'}\n\n`
    }
    
    if (data.action_url) {
      text += `${data.action_text || 'Take Action'}: ${data.action_url}\n\n`
    }
    
    text += `Keep learning, keep questioning, and remember: democracy works best when citizens understand how power actually operates.\n\n`
    text += `© ${data.current_year || new Date().getFullYear()} CivicSense\n`
    text += `Civic education for people who want to understand how democracy really works.`
    
    if (data.support_email) {
      text += `\n\nQuestions? Email us at ${data.support_email}`
    }
    
    return text
  }

  // Specific email type methods for better organization
  async sendWelcomeEmail(to: string, data: Record<string, any> = {}): Promise<EmailResult> {
    return this.sendTemplateEmail(to, 'welcome', data)
  }

  async sendEducationalAccessEmail(to: string, data: Record<string, any> = {}): Promise<EmailResult> {
    return this.sendTemplateEmail(to, 'educational_access', data)
  }

  async sendQuizAchievementEmail(to: string, data: Record<string, any> = {}): Promise<EmailResult> {
    return this.sendTemplateEmail(to, 'achievement', data)
  }

  async sendLevelUpEmail(to: string, data: Record<string, any> = {}): Promise<EmailResult> {
    return this.sendTemplateEmail(to, 'level_up', data)
  }

  async sendLearningPodInvite(to: string, data: Record<string, any> = {}): Promise<EmailResult> {
    return this.sendTemplateEmail(to, 'pod_invitation', data)
  }
}

// Export singleton instance
export const emailService = new CivicSenseEmailService()

// Named exports for backward compatibility
export const {
  sendWelcomeEmail,
  sendEducationalAccessEmail,
  sendQuizAchievementEmail,
  sendLevelUpEmail,
  sendLearningPodInvite
} = emailService

// Utility functions for common email types
export const sendPasswordResetEmail = async (to: string, userName: string, resetUrl: string): Promise<EmailResult> => {
  return emailService.sendTransactionalEmail(
    to,
    'Get back into your CivicSense account',
    {
      user_name: userName,
      reset_url: resetUrl,
      action_url: resetUrl,
      action_text: 'Reset Password'
    },
    undefined,
    'password_reset'
  )
}

export const sendGiftClaimEmail = async ({
  to,
  userName,
  giftCode,
  claimUrl
}: {
  to: string
  userName: string
  giftCode: string
  claimUrl: string
}): Promise<EmailResult> => {
  return emailService.sendTransactionalEmail(
    to,
    'Someone believes you should understand how power works',
    {
      user_name: userName,
      gift_code: giftCode,
      claim_url: claimUrl,
      action_url: claimUrl,
      action_text: 'Claim Your Gift'
    },
    undefined,
    'gift_claim'
  )
} 