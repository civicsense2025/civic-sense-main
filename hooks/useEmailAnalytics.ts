import { useCallback } from 'react'
import { useAnalytics } from '@/utils/analytics'
import { EmailType, EmailResult } from '@/lib/email/plunk-service'

// Email event schemas that integrate with existing Statsig analytics
export interface EmailEvent {
  eventType: 'email_sent' | 'email_delivered' | 'email_opened' | 'email_clicked' | 'email_bounced' | 'email_failed'
  emailType: EmailType
  recipient: string
  messageId?: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface EmailCampaignMetrics {
  totalSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
  conversionRate: number
}

/**
 * Hook for tracking email events in the CivicSense analytics system
 * Integrates with the existing Statsig event tracking infrastructure
 */
export const useEmailAnalytics = () => {
  const { trackEvent, trackCustomEvent } = useAnalytics()

  /**
   * Track email sending event
   */
  const trackEmailSent = useCallback((result: EmailResult, metadata: Record<string, any> = {}) => {
    const eventData = {
      email_type: result.emailType,
      recipient_domain: result.recipient.split('@')[1],
      success: result.success,
      message_id: result.messageId,
      timestamp: result.timestamp,
      error: result.error,
      ...metadata
    }

    if (result.success) {
      trackEvent('email_sent', 1, eventData)
    } else {
      trackEvent('email_failed', 1, eventData)
    }
  }, [trackEvent])

  /**
   * Track email delivery confirmation
   */
  const trackEmailDelivered = useCallback((messageId: string, emailType: EmailType, metadata: Record<string, any> = {}) => {
    trackEvent('email_delivered', 1, {
      email_type: emailType,
      message_id: messageId,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email opens
   */
  const trackEmailOpened = useCallback((messageId: string, emailType: EmailType, metadata: Record<string, any> = {}) => {
    trackEvent('email_opened', 1, {
      email_type: emailType,
      message_id: messageId,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email clicks
   */
  const trackEmailClicked = useCallback((messageId: string, emailType: EmailType, clickedUrl: string, metadata: Record<string, any> = {}) => {
    trackEvent('email_clicked', 1, {
      email_type: emailType,
      message_id: messageId,
      clicked_url: clickedUrl,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email bounces
   */
  const trackEmailBounced = useCallback((messageId: string, emailType: EmailType, bounceType: 'hard' | 'soft', metadata: Record<string, any> = {}) => {
    trackEvent('email_bounced', 1, {
      email_type: emailType,
      message_id: messageId,
      bounce_type: bounceType,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email unsubscribes
   */
  const trackEmailUnsubscribed = useCallback((messageId: string, emailType: EmailType, metadata: Record<string, any> = {}) => {
    trackEvent('email_unsubscribed', 1, {
      email_type: emailType,
      message_id: messageId,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email-driven conversions (quiz starts, sign-ups, etc.)
   */
  const trackEmailConversion = useCallback((messageId: string, emailType: EmailType, conversionType: string, metadata: Record<string, any> = {}) => {
    trackEvent('email_conversion', 1, {
      email_type: emailType,
      message_id: messageId,
      conversion_type: conversionType,
      ...metadata
    })
  }, [trackEvent])

  /**
   * Track email campaign performance metrics
   */
  const trackEmailCampaignMetrics = useCallback((campaignId: string, metrics: EmailCampaignMetrics, metadata: Record<string, any> = {}) => {
    trackCustomEvent('email_campaign_metrics', 1, {
      campaign_id: campaignId,
      total_sent: metrics.totalSent,
      delivery_rate: metrics.deliveryRate,
      open_rate: metrics.openRate,
      click_rate: metrics.clickRate,
      bounce_rate: metrics.bounceRate,
      unsubscribe_rate: metrics.unsubscribeRate,
      conversion_rate: metrics.conversionRate,
      ...metadata
    })
  }, [trackCustomEvent])

  /**
   * Track civic engagement driven by emails
   */
  const trackEmailDrivenEngagement = useCallback((emailType: EmailType, engagementType: string, metadata: Record<string, any> = {}) => {
    trackEvent('email_driven_engagement', 1, {
      email_type: emailType,
      engagement_type: engagementType,
      civic_education_impact: true,
      ...metadata
    })
  }, [trackEvent])

  return {
    trackEmailSent,
    trackEmailDelivered,
    trackEmailOpened,
    trackEmailClicked,
    trackEmailBounced,
    trackEmailUnsubscribed,
    trackEmailConversion,
    trackEmailCampaignMetrics,
    trackEmailDrivenEngagement
  }
}

/**
 * Email event triggers that integrate with existing CivicSense analytics events
 * These functions connect email sending to user actions and achievements
 */
export const useEmailEventTriggers = () => {
  const emailAnalytics = useEmailAnalytics()
  const { trackAuth, trackQuiz, trackGameification } = useAnalytics()

  /**
   * Trigger welcome email on user registration
   */
  const triggerWelcomeEmail = useCallback(async (userEmail: string, userName: string) => {
    try {
      const { sendWelcomeEmail } = await import('@/lib/email/plunk-service')
      const result = await sendWelcomeEmail(userEmail, userName)
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'user_registration',
        user_journey_stage: 'onboarding'
      })

      return result
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return null
    }
  }, [emailAnalytics])

  /**
   * Trigger quiz achievement email
   */
  const triggerQuizAchievementEmail = useCallback(async (userEmail: string, userName: string, achievementData: {
    achievementName: string
    score: number
    quizName: string
    quizCategory: string
  }) => {
    try {
      const { sendQuizAchievementEmail } = await import('@/lib/email/plunk-service')
      const result = await sendQuizAchievementEmail({
        to: userEmail,
        userName,
        achievementName: achievementData.achievementName,
        score: achievementData.score,
        quizName: achievementData.quizName
      })
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'quiz_achievement',
        quiz_category: achievementData.quizCategory,
        achievement_score: achievementData.score,
        civic_learning_milestone: true
      })

      return result
    } catch (error) {
      console.error('Error sending quiz achievement email:', error)
      return null
    }
  }, [emailAnalytics])

  /**
   * Trigger level up email
   */
  const triggerLevelUpEmail = useCallback(async (userEmail: string, userName: string, levelData: {
    newLevel: number
    xpTotal: number
    primaryActivity: string
  }) => {
    try {
      const { sendLevelUpEmail } = await import('@/lib/email/plunk-service')
      const result = await sendLevelUpEmail({
        to: userEmail,
        userName,
        newLevel: levelData.newLevel,
        xpTotal: levelData.xpTotal
      })
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'level_up',
        new_level: levelData.newLevel,
        primary_activity: levelData.primaryActivity,
        gamification_milestone: true
      })

      return result
    } catch (error) {
      console.error('Error sending level up email:', error)
      return null
    }
  }, [emailAnalytics])

  /**
   * Trigger learning pod invitation email
   */
  const triggerLearningPodInvite = useCallback(async (inviteData: {
    to: string
    studentName: string
    podName: string
    teacherName: string
    joinUrl: string
    courseName?: string
    requireParentConsent?: boolean
  }) => {
    try {
      const { sendLearningPodInvite } = await import('@/lib/email/plunk-service')
      const result = await sendLearningPodInvite(inviteData)
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'learning_pod_invite',
        pod_type: 'classroom',
        requires_parent_consent: inviteData.requireParentConsent,
        civic_education_outreach: true
      })

      return result
    } catch (error) {
      console.error('Error sending learning pod invite:', error)
      return null
    }
  }, [emailAnalytics])

  /**
   * Trigger gift claim notification email
   */
  const triggerGiftClaimEmail = useCallback(async (giftData: {
    to: string
    recipientName: string
    accessType: 'annual' | 'lifetime'
    claimUrl: string
    giftMessage?: string
  }) => {
    try {
      const { sendGiftClaimEmail } = await import('@/lib/email/plunk-service')
      const result = await sendGiftClaimEmail(giftData)
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'gift_sent',
        access_type: giftData.accessType,
        has_personal_message: !!giftData.giftMessage,
        civic_access_sharing: true
      })

      return result
    } catch (error) {
      console.error('Error sending gift claim email:', error)
      return null
    }
  }, [emailAnalytics])

  /**
   * Trigger educational access notification
   */
  const triggerEducationalAccessEmail = useCallback(async (userEmail: string, userName: string, institutionDomain: string) => {
    try {
      const { sendEducationalAccessEmail } = await import('@/lib/email/plunk-service')
      const result = await sendEducationalAccessEmail({
        to: userEmail,
        userName,
        institutionDomain
      })
      
      emailAnalytics.trackEmailSent(result, {
        trigger_event: 'educational_access_granted',
        institution_domain: institutionDomain,
        access_type: 'educational',
        democratic_education_access: true
      })

      return result
    } catch (error) {
      console.error('Error sending educational access email:', error)
      return null
    }
  }, [emailAnalytics])

  return {
    triggerWelcomeEmail,
    triggerQuizAchievementEmail,
    triggerLevelUpEmail,
    triggerLearningPodInvite,
    triggerGiftClaimEmail,
    triggerEducationalAccessEmail
  }
} 