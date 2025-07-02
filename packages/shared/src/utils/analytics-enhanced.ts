/**
 * Enhanced CivicSense Analytics Integration
 * Extends the base analytics system with email tracking and civic engagement metrics
 */

import { EmailType, EmailResult } from '../lib/email/mailerlite-service'

// Re-export base analytics for convenience
export { useAnalytics, mapCategoryToAnalytics } from './analytics'

/**
 * Email event tracking for server-side contexts
 * Integrates with the existing Statsig analytics system
 */
export class EmailAnalyticsTracker {
  private static instance: EmailAnalyticsTracker | null = null

  static getInstance(): EmailAnalyticsTracker {
    if (!EmailAnalyticsTracker.instance) {
      EmailAnalyticsTracker.instance = new EmailAnalyticsTracker()
    }
    return EmailAnalyticsTracker.instance
  }

  /**
   * Track email sending on the server side
   */
  trackEmailSent(result: EmailResult, metadata: Record<string, any> = {}) {
    const eventData = {
      email_type: result.emailType,
      recipient_domain: result.recipient?.split('@')[1] || 'unknown',
      success: result.success,
      message_id: result.messageId,
      timestamp: result.timestamp,
      error: result.error,
      ...metadata
    }

    // Log for analytics processing
    console.log(`📊 Email ${result.success ? 'SENT' : 'FAILED'}: ${result.emailType}`, eventData)

    // In production, you could send this to your analytics service
    if (typeof window !== 'undefined') {
      // Client-side tracking
      this.sendToStatsig('email_sent', eventData)
    }
  }

  /**
   * Track email engagement events from webhooks
   */
  trackEmailEngagement(
    eventType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed',
    emailType: EmailType,
    messageId: string,
    metadata: Record<string, any> = {}
  ) {
    const eventData = {
      email_type: emailType,
      message_id: messageId,
      engagement_type: eventType,
      timestamp: Date.now(),
      ...metadata
    }

    console.log(`📊 Email ${eventType.toUpperCase()}: ${emailType}`, eventData)

    // Track civic engagement from emails
    if (eventType === 'clicked' || eventType === 'opened') {
      this.trackCivicEngagementFromEmail(emailType, eventType, metadata)
    }
  }

  /**
   * Track civic engagement driven by email interactions
   */
  private trackCivicEngagementFromEmail(
    emailType: EmailType,
    engagementType: string,
    metadata: Record<string, any>
  ) {
    // Map email types to civic engagement categories
    const civicImpactMap: Record<EmailType, string> = {
      'welcome': 'onboarding_engagement',
      'learning_pod_invitation': 'collaborative_learning',
      'quiz_achievement': 'civic_knowledge_building',
      'level_up': 'gamified_learning',
      'gift_claim': 'civic_access_sharing',
      'educational_access': 'institutional_engagement',
      'weekly_digest': 'ongoing_engagement',
      'streak_encouragement': 'habit_formation',
      'onboarding_completion': 'learning_journey_completion',
      'premium_welcome': 'premium_engagement',
      'subscription_expiring': 'retention_engagement',
      'password_reset': 'account_maintenance',
      'account_verification': 'account_activation',
      'achievement': 'civic_achievement_celebration',
      'streak': 'civic_learning_consistency',
      'pod_invitation': 'collaborative_civic_learning',
      're_engagement': 'civic_re_activation',
      'civic_news_alert': 'civic_awareness_engagement'
    }

    const civicEngagementType = civicImpactMap[emailType] || 'general_engagement'

    console.log(`📊 Civic Engagement from Email: ${civicEngagementType}`, {
      email_type: emailType,
      engagement_type: engagementType,
      civic_category: civicEngagementType,
      democratic_education_impact: true,
      ...metadata
    })
  }

  /**
   * Send events to Statsig (client-side only)
   */
  private sendToStatsig(eventName: string, data: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).statsig) {
      try {
        (window as any).statsig.logEvent(eventName, data)
      } catch (error) {
        console.warn('Failed to send event to Statsig:', error)
      }
    }
  }
}

/**
 * Email-triggered event sequences
 * These functions coordinate email sending with analytics tracking
 */
export class EmailEventOrchestrator {
  private emailTracker: EmailAnalyticsTracker

  constructor() {
    this.emailTracker = EmailAnalyticsTracker.getInstance()
  }

  /**
   * Orchestrate user registration email sequence
   */
  async orchestrateUserRegistration(userEmail: string, userName: string, registrationContext: {
    source: 'direct' | 'google' | 'gift_claim' | 'educational'
    isEducational?: boolean
    institutionDomain?: string
  }) {
    try {
      // Send welcome email
      const { sendWelcomeEmail } = await import('../lib/email/mailerlite-service')
      const result = await sendWelcomeEmail(userEmail, userName)
      
      // Track the email with registration context
      this.emailTracker.trackEmailSent(result, {
        trigger_event: 'user_registration',
        registration_source: registrationContext.source,
        is_educational: registrationContext.isEducational || false,
        institution_domain: registrationContext.institutionDomain,
        user_journey_stage: 'onboarding'
      })

      // If educational user, also send educational access email
      if (registrationContext.isEducational && registrationContext.institutionDomain) {
        const { sendEducationalAccessEmail } = await import('../lib/email/mailerlite-service')
        const eduResult = await sendEducationalAccessEmail({
          to: userEmail,
          userName,
          institutionDomain: registrationContext.institutionDomain
        })
        
        this.emailTracker.trackEmailSent(eduResult, {
          trigger_event: 'educational_access_granted',
          institution_domain: registrationContext.institutionDomain,
          access_type: 'educational'
        })
      }

      return { success: true, results: [result] }
    } catch (error) {
      console.error('Error orchestrating user registration emails:', error)
      return { success: false, error }
    }
  }

  /**
   * Orchestrate quiz achievement email sequence
   */
  async orchestrateQuizAchievement(userEmail: string, userName: string, achievementData: {
    achievementName: string
    score: number
    quizName: string
    quizCategory: string
    isNewRecord: boolean
    levelUp?: { newLevel: number; xpTotal: number }
  }) {
    try {
      const results: EmailResult[] = []

      // Send achievement email
      const { sendQuizAchievementEmail } = await import('../lib/email/mailerlite-service')
      const achievementResult = await sendQuizAchievementEmail({
        to: userEmail,
        userName,
        achievementName: achievementData.achievementName,
        score: achievementData.score,
        quizName: achievementData.quizName
      })
      
      this.emailTracker.trackEmailSent(achievementResult, {
        trigger_event: 'quiz_achievement',
        quiz_category: achievementData.quizCategory,
        achievement_score: achievementData.score,
        is_new_record: achievementData.isNewRecord,
        civic_learning_milestone: true
      })
      
      results.push(achievementResult)

      // If user leveled up, send level up email
      if (achievementData.levelUp) {
        const { sendLevelUpEmail } = await import('../lib/email/mailerlite-service')
        const levelUpResult = await sendLevelUpEmail({
          to: userEmail,
          userName,
          newLevel: achievementData.levelUp.newLevel,
          xpTotal: achievementData.levelUp.xpTotal
        })
        
        this.emailTracker.trackEmailSent(levelUpResult, {
          trigger_event: 'level_up',
          new_level: achievementData.levelUp.newLevel,
          xp_total: achievementData.levelUp.xpTotal,
          triggered_by: 'quiz_achievement',
          gamification_milestone: true
        })
        
        results.push(levelUpResult)
      }

      return { success: true, results }
    } catch (error) {
      console.error('Error orchestrating quiz achievement emails:', error)
      return { success: false, error }
    }
  }

  /**
   * Orchestrate learning pod invitation sequence
   */
  async orchestrateLearningPodInvitation(invitations: Array<{
    to: string
    studentName: string
    podName: string
    teacherName: string
    joinUrl: string
    courseName?: string
    requireParentConsent?: boolean
  }>, podContext: {
    podId: string
    courseId?: string
    institutionDomain?: string
  }) {
    const results: EmailResult[] = []
    
    try {
      const { sendLearningPodInvite } = await import('../lib/email/mailerlite-service')
      
      for (const invitation of invitations) {
        const result = await sendLearningPodInvite(invitation)
        
        this.emailTracker.trackEmailSent(result, {
          trigger_event: 'learning_pod_invite',
          pod_id: podContext.podId,
          course_id: podContext.courseId,
          institution_domain: podContext.institutionDomain,
          requires_parent_consent: invitation.requireParentConsent,
          civic_education_outreach: true
        })
        
        results.push(result)
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return { 
        success: true, 
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      }
    } catch (error) {
      console.error('Error orchestrating learning pod invitations:', error)
      return { success: false, error }
    }
  }
}

// Export singleton instances
export const emailAnalyticsTracker = EmailAnalyticsTracker.getInstance()
export const emailEventOrchestrator = new EmailEventOrchestrator()

/**
 * Utility functions for common email tracking scenarios
 */
export const emailUtils = {
  /**
   * Track email conversion (when someone takes action after receiving an email)
   */
  trackEmailConversion(messageId: string, emailType: EmailType, conversionType: string, metadata: Record<string, any> = {}) {
    emailAnalyticsTracker.trackEmailEngagement('clicked', emailType, messageId, {
      conversion_type: conversionType,
      civic_action_taken: true,
      ...metadata
    })
  },

  /**
   * Track civic engagement driven by email
   */
  trackCivicEngagementFromEmail(emailType: EmailType, actionType: string, metadata: Record<string, any> = {}) {
    console.log(`📊 Civic Action from Email: ${actionType}`, {
      email_type: emailType,
      action_type: actionType,
      democratic_participation: true,
      email_driven_engagement: true,
      ...metadata
    })
  }
} 