/**
 * Survey Email Integration Service for CivicSense
 * Connects MailerSend to the survey system for automated email triggers
 */

import { emailService } from './mailerlite-service'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class SurveyEmailIntegration {
  /**
   * Send survey invitation email
   */
  static async sendSurveyInvitation(
    userEmail: string,
    surveyId: string,
    inviterName?: string,
    customMessage?: string
  ) {
    try {
      // Get survey details
      const { data: survey } = await serviceSupabase
        .from('surveys')
        .select('title, description, estimated_time')
        .eq('id', surveyId)
        .single()

      if (!survey) {
        throw new Error('Survey not found')
      }

      const surveyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/survey/${surveyId}`
      
      const emailData = {
        user_name: userEmail.split('@')[0],
        survey_title: survey.title || 'CivicSense Survey',
        survey_description: survey.description || '',
        survey_url: surveyUrl,
        estimated_time: survey.estimated_time || 5,
        inviter_name: inviterName || 'CivicSense Team',
        custom_message: customMessage || '',
        action_url: surveyUrl,
        action_text: 'Take Survey',
        civic_impact: 'Your responses help improve civic education for everyone',
        why_this_matters: 'Understanding civic engagement patterns helps us build better democratic tools'
      }

      const result = await emailService.sendTransactionalEmail(
        userEmail,
        `Help improve civic education: ${survey.title}`,
        emailData,
        'survey-invitation'
      )

      console.log('📧 Survey invitation sent:', { userEmail, surveyId, messageId: result.messageId })
      return result
    } catch (error) {
      console.error('Error sending survey invitation:', error)
      throw error
    }
  }

  /**
   * Send survey completion thank you email
   */
  static async sendSurveyCompletionEmail(responseId: string) {
    try {
      // Get response details
      const { data: response } = await serviceSupabase
        .from('survey_responses')
        .select(`
          id,
          survey_id,
          user_id,
          completed_at
        `)
        .eq('id', responseId)
        .single()

      if (!response) {
        throw new Error('Survey response not found')
      }

      // Get survey details
      const { data: survey } = await serviceSupabase
        .from('surveys')
        .select('title, description')
        .eq('id', response.survey_id)
        .single()

      if (!survey) {
        throw new Error('Survey not found')
      }

      let userEmail = ''
      let userName = ''

      // Get user email and name
      if (response.user_id) {
        const { data: user } = await serviceSupabase.auth.admin.getUserById(response.user_id)
        if (user?.user) {
          userEmail = user.user.email || ''
          userName = user.user.user_metadata?.full_name || userEmail.split('@')[0]
        }
      }

      if (!userEmail) {
        console.log('No email found for survey response, skipping completion email')
        return { success: false, reason: 'No email available' }
      }

      // Get completion stats
      const { data: answers } = await serviceSupabase
        .from('survey_answers')
        .select('question_id')
        .eq('response_id', responseId)

      const questionsAnswered = answers?.length || 0

      const emailData = {
        user_name: userName,
        survey_title: survey.title || 'CivicSense Survey',
        questions_answered: questionsAnswered,
        completion_message: 'Thank you for taking the time to share your insights!',
        impact_message: 'Your responses help us understand how to better serve civic education needs',
        dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        explore_url: `${process.env.NEXT_PUBLIC_SITE_URL}/categories`,
        community_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pods`,
        civic_action_message: 'Ready to put your civic knowledge into action?',
        next_steps: [
          'Explore civic education topics that interest you',
          'Join a learning pod to discuss with others',
          'Take practice quizzes to test your knowledge'
        ]
      }

      const result = await emailService.sendTransactionalEmail(
        userEmail,
        `Thank you for completing: ${survey.title}`,
        emailData,
        'survey-completion'
      )

      console.log('📧 Survey completion email sent:', { userEmail, responseId, messageId: result.messageId })
      return result
    } catch (error) {
      console.error('Error sending survey completion email:', error)
      throw error
    }
  }

  /**
   * Send feedback acknowledgment email
   */
  static async sendFeedbackAcknowledgment(
    userEmail: string,
    feedbackType: string,
    feedbackId: string
  ) {
    try {
      const emailData = {
        user_name: userEmail.split('@')[0],
        feedback_type: feedbackType,
        acknowledgment_message: 'Thank you for taking the time to share your feedback!',
        impact_message: 'Your input helps us improve CivicSense for everyone',
        follow_up_message: 'We review all feedback carefully and will follow up if needed',
        dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        support_email: 'support@civicsense.us'
      }

      const result = await emailService.sendTransactionalEmail(
        userEmail,
        'Thank you for your feedback - CivicSense',
        emailData,
        'feedback-acknowledgment'
      )

      console.log('📧 Feedback acknowledgment sent:', { userEmail, feedbackId, messageId: result.messageId })
      return result
    } catch (error) {
      console.error('Error sending feedback acknowledgment:', error)
      throw error
    }
  }
}

// Export singleton instance
export const surveyEmailIntegration = SurveyEmailIntegration 