/**
 * CivicSense OneSignal Workflow Integrations
 * Connects OneSignal messaging to existing CivicSense systems
 */

import { OneSignalCivicClient } from './client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const oneSignalClient = new OneSignalCivicClient({
  appId: process.env.ONESIGNAL_APP_ID!,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY!,
  userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY
})

export class CivicWorkflowIntegration {
  
  // ============================================================================
  // QUIZ COMPLETION WORKFLOWS
  // ============================================================================

  /**
   * Triggered when user completes a quiz
   * Sends follow-up content and encourages further engagement
   */
  static async handleQuizCompletion(userId: string, quizData: {
    topicId: string
    score: number
    topic: string
    difficulty: string
  }) {
    try {
      // Get user data for personalization
      const { data: user } = await supabase
        .from('users')
        .select('external_id, email, civic_interests, quiz_completion_rate')
        .eq('id', userId)
        .single()

      if (!user) return

      // Update user engagement in OneSignal
      await oneSignalClient.updateCivicEngagement(user.external_id, {
        quiz_completed: true,
        quiz_score: quizData.score,
        engagement_level: this.calculateEngagementLevel(quizData.score, user.quiz_completion_rate)
      })

      // Send congratulatory message with next steps
      if (quizData.score >= 70) {
        await this.sendHighScoreCongratulations(user.external_id, quizData)
      } else {
        await this.sendEncouragementAndResources(user.external_id, quizData)
      }

      // Suggest related content
      await this.suggestRelatedContent(user.external_id, quizData.topicId)

    } catch (error) {
      console.error('Error in quiz completion workflow:', error)
    }
  }

  /**
   * Send civic action opportunities based on quiz completion
   */
  private static async sendHighScoreCongratulations(externalId: string, quizData: any) {
    await oneSignalClient.sendCivicNotification({
      type: 'civic_action',
      title: `🎉 Excellent work on ${quizData.topic}!`,
      message: `You scored ${quizData.score}%! Ready to put this knowledge into action?`,
      channels: ['push'],
      data: {
        action_type: 'civic_action_opportunity',
        deep_link: `/actions?topic=${quizData.topicId}`,
        quiz_score: quizData.score.toString()
      }
    }, {
      external_user_ids: [externalId]
    })
  }

  private static async sendEncouragementAndResources(externalId: string, quizData: any) {
    await oneSignalClient.sendCivicNotification({
      type: 'educational_content',
      title: `Keep learning about ${quizData.topic}! 📚`,
      message: `Every step builds your civic knowledge. Here are some helpful resources.`,
      channels: ['push'],
      data: {
        action_type: 'additional_resources',
        deep_link: `/topics/${quizData.topicId}/resources`,
        quiz_score: quizData.score.toString()
      }
    }, {
      external_user_ids: [externalId]
    })
  }

  // ============================================================================
  // NEWS & BREAKING ALERTS WORKFLOWS
  // ============================================================================

  /**
   * Triggered when new civic news is published
   * Sends personalized alerts based on user interests
   */
  static async handleBreakingCivicNews(newsData: {
    id: string
    headline: string
    summary: string
    categories: string[]
    civic_relevance_score: number
    urgency: 'low' | 'medium' | 'high'
    affects_voting?: boolean
    affects_states?: string[]
  }) {
    try {
      // Get users interested in these categories
      const { data: interestedUsers } = await supabase
        .from('users')
        .select('external_id, civic_interests, location, engagement_level')
        .contains('civic_interests', newsData.categories)

      if (!interestedUsers?.length) return

      // Filter by location if news affects specific states
      let targetUsers = interestedUsers
      if (newsData.affects_states?.length) {
        targetUsers = interestedUsers.filter(user => 
          newsData.affects_states!.some(state => 
            user.location?.state === state
          )
        )
      }

             // Send alerts based on urgency and relevance
       if (newsData.urgency === 'high' && newsData.civic_relevance_score > 80) {
         await this.sendBreakingNewsAlert(targetUsers, newsData)
       } else if (newsData.civic_relevance_score > 60) {
         await this.sendNewsDigest(targetUsers, newsData)
       }

    } catch (error) {
      console.error('Error in breaking news workflow:', error)
    }
  }

     private static async sendBreakingNewsAlert(users: any[], newsData: any) {
     const notification = {
       type: 'news_update' as any,
       title: `🚨 Breaking: ${newsData.headline}`,
       message: `${newsData.summary.substring(0, 100)}...`,
       channels: ['push', 'email'] as any[],
       data: {
         action_type: 'breaking_news',
         deep_link: `/news/${newsData.id}`,
         civic_score: newsData.civic_relevance_score.toString(),
         urgency: newsData.urgency
       }
     }

    // Send to high-engagement users immediately, others get batched
    const highEngagementUsers = users.filter(u => u.engagement_level === 'high')
    const otherUsers = users.filter(u => u.engagement_level !== 'high')

    if (highEngagementUsers.length > 0) {
      await oneSignalClient.sendCivicNotification(notification, {
        external_user_ids: highEngagementUsers.map(u => u.external_id)
      })
    }

    // Schedule digest for other users (avoid notification fatigue)
    if (otherUsers.length > 0) {
      await this.scheduleNewsDigest(otherUsers, newsData)
    }
  }

  // ============================================================================
  // VOTING & ELECTION WORKFLOWS
  // ============================================================================

  /**
   * Triggered by election events and voting deadlines
   * Sends timely voting reminders and information
   */
  static async handleElectionEvent(electionData: {
    id: string
    name: string
    date: string
    type: 'federal' | 'state' | 'local'
    affected_states?: string[]
    registration_deadline?: string
    early_voting_start?: string
  }) {
    try {
      // Get users in affected areas
      let targetUsers
      if (electionData.affected_states?.length) {
        const { data: users } = await supabase
          .from('users')
          .select('external_id, location, voting_reminders_enabled')
          .in('location->state', electionData.affected_states)
          .eq('voting_reminders_enabled', true)
        
        targetUsers = users || []
      } else {
        // National election - all users
        const { data: users } = await supabase
          .from('users')
          .select('external_id, location, voting_reminders_enabled')
          .eq('voting_reminders_enabled', true)
        
        targetUsers = users || []
      }

      if (!targetUsers.length) return

      // Send different reminders based on timeline
      const daysUntilElection = Math.ceil(
        (new Date(electionData.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilElection <= 1) {
        await this.sendElectionDayReminder(targetUsers, electionData)
      } else if (daysUntilElection <= 7) {
        await this.sendWeekBeforeReminder(targetUsers, electionData)
      } else if (daysUntilElection <= 30) {
        await this.sendMonthBeforeReminder(targetUsers, electionData)
      }

      // Registration deadline reminders
      if (electionData.registration_deadline) {
        await this.scheduleRegistrationReminders(targetUsers, electionData)
      }

    } catch (error) {
      console.error('Error in election workflow:', error)
    }
  }

  private static async sendElectionDayReminder(users: any[], electionData: any) {
    await oneSignalClient.sendVotingReminder(
      users.map(u => ({ ...u, external_id: u.external_id })),
      {
        name: electionData.name,
        date: electionData.date,
        type: electionData.type
      }
    )
  }

  // ============================================================================
  // USER ONBOARDING WORKFLOWS
  // ============================================================================

  /**
   * Triggered when new user completes onboarding
   * Sets up personalized engagement journey
   */
  static async handleUserOnboardingComplete(userId: string, onboardingData: {
    civic_interests: string[]
    engagement_goals: string[]
    location: { state?: string, district?: string }
    preferred_channels: string[]
  }) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('external_id, email')
        .eq('id', userId)
        .single()

      if (!user) return

      // Sync user to OneSignal with civic data
      await oneSignalClient.syncCivicUser({
        id: userId,
        external_id: user.external_id,
        email: user.email,
        civic_interests: onboardingData.civic_interests,
        location: onboardingData.location,
        engagement_level: 'medium',
        preferred_channels: onboardingData.preferred_channels as any[]
      })

      // Start onboarding journey
      await this.startCivicOnboardingJourney(user.external_id, onboardingData)

    } catch (error) {
      console.error('Error in onboarding workflow:', error)
    }
  }

  private static async startCivicOnboardingJourney(externalId: string, onboardingData: any) {
    // Welcome message
    await oneSignalClient.sendCivicNotification({
      type: 'educational_content',
      title: '🎉 Welcome to CivicSense!',
      message: 'Ready to dive into your civic education journey? Let\'s start with a quiz!',
      channels: ['push'],
      data: {
        action_type: 'onboarding_start',
        deep_link: '/quiz?onboarding=true'
      }
    }, {
      external_user_ids: [externalId]
    })

    // Schedule follow-up content based on interests
    await this.schedulePersonalizedContent(externalId, onboardingData.civic_interests)
  }

  // ============================================================================
  // MULTIPLAYER & SOCIAL WORKFLOWS
  // ============================================================================

  /**
   * Triggered by multiplayer quiz events
   * Sends social engagement notifications
   */
  static async handleMultiplayerQuizInvite(inviteData: {
    room_id: string
    host_user_id: string
    invited_user_ids: string[]
    quiz_topic: string
    scheduled_time?: string
  }) {
    try {
      // Get user data for all participants
      const { data: users } = await supabase
        .from('users')
        .select('id, external_id, full_name')
        .in('id', [inviteData.host_user_id, ...inviteData.invited_user_ids])

      if (!users?.length) return

      const host = users.find(u => u.id === inviteData.host_user_id)
      const invitedUsers = users.filter(u => inviteData.invited_user_ids.includes(u.id))

      // Send invitations to invited users
      for (const user of invitedUsers) {
        await oneSignalClient.sendCivicNotification({
          type: 'quiz_reminder',
          title: `🎯 Quiz Challenge from ${host?.full_name}!`,
          message: `Join a multiplayer quiz about ${inviteData.quiz_topic}. Test your civic knowledge together!`,
          channels: ['push'],
          data: {
            action_type: 'multiplayer_invite',
            deep_link: `/multiplayer/join/${inviteData.room_id}`,
            room_id: inviteData.room_id,
            quiz_topic: inviteData.quiz_topic
          }
        }, {
          external_user_ids: [user.external_id]
        })
      }

    } catch (error) {
      console.error('Error in multiplayer workflow:', error)
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateEngagementLevel(score: number, completionRate?: number): 'low' | 'medium' | 'high' {
    if (score >= 80 && (completionRate || 0) >= 0.7) return 'high'
    if (score >= 60 && (completionRate || 0) >= 0.4) return 'medium'
    return 'low'
  }

  private static async suggestRelatedContent(externalId: string, topicId: string) {
    // Get related topics from database
    const { data: relatedTopics } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, emoji')
      .neq('topic_id', topicId)
      .limit(3)

    if (relatedTopics?.length) {
      await oneSignalClient.sendCivicNotification({
        type: 'educational_content',
        title: '📚 More topics to explore',
        message: `Continue your civic education with ${relatedTopics[0].topic_title} and more!`,
        channels: ['push'],
        data: {
          action_type: 'related_content',
          deep_link: `/topics/${relatedTopics[0].topic_id}`
        }
      }, {
        external_user_ids: [externalId]
      })
    }
  }

  private static async scheduleNewsDigest(users: any[], newsData: any) {
    // TODO: Implement digest scheduling
    // For now, we'll send immediately but with lower priority
    console.log('Scheduling news digest for', users.length, 'users')
  }

  private static async scheduleRegistrationReminders(users: any[], electionData: any) {
    // TODO: Implement registration deadline reminders
    console.log('Scheduling registration reminders for', electionData.name)
  }

     private static async schedulePersonalizedContent(externalId: string, interests: string[]) {
     // TODO: Implement personalized content scheduling based on interests
     console.log('Scheduling personalized content for interests:', interests)
   }

   private static async sendNewsDigest(users: any[], newsData: any) {
     // Send digest-style news update to avoid notification fatigue
     await oneSignalClient.sendCivicNotification({
       type: 'news_update',
       title: `📰 Civic News Update`,
       message: `${newsData.headline} - Read more about this important civic development`,
       channels: ['push'] as any[],
       data: {
         action_type: 'news_digest',
         deep_link: `/news/${newsData.id}`,
         civic_score: newsData.civic_relevance_score.toString()
       }
     }, {
       external_user_ids: users.map(u => u.external_id)
     })
   }

   private static async sendWeekBeforeReminder(users: any[], electionData: any) {
     await oneSignalClient.sendVotingReminder(
       users.map(u => ({ ...u, external_id: u.external_id })),
       {
         name: electionData.name,
         date: electionData.date,
         type: electionData.type
       }
     )
   }

   private static async sendMonthBeforeReminder(users: any[], electionData: any) {
     await oneSignalClient.sendCivicNotification({
       type: 'voting_alert',
       title: `🗳️ Election Coming: ${electionData.name}`,
       message: `Make sure you're registered to vote! Election is in about a month.`,
       channels: ['push'] as any[],
       data: {
         action_type: 'election_reminder',
         deep_link: '/voting-guide',
         election_date: electionData.date,
         election_type: electionData.type
       }
     }, {
       external_user_ids: users.map(u => u.external_id)
     })
   }
 }

// ============================================================================
// TRIGGER FUNCTIONS (called from various parts of the app)
// ============================================================================

/**
 * Call this from your quiz completion handlers
 */
export async function triggerQuizCompletionWorkflow(userId: string, quizData: any) {
  return CivicWorkflowIntegration.handleQuizCompletion(userId, quizData)
}

/**
 * Call this from your news publishing system
 */
export async function triggerBreakingNewsWorkflow(newsData: any) {
  return CivicWorkflowIntegration.handleBreakingCivicNews(newsData)
}

/**
 * Call this from your election/voting system
 */
export async function triggerElectionWorkflow(electionData: any) {
  return CivicWorkflowIntegration.handleElectionEvent(electionData)
}

/**
 * Call this from your user onboarding system
 */
export async function triggerOnboardingWorkflow(userId: string, onboardingData: any) {
  return CivicWorkflowIntegration.handleUserOnboardingComplete(userId, onboardingData)
}

/**
 * Call this from your multiplayer system
 */
export async function triggerMultiplayerWorkflow(inviteData: any) {
  return CivicWorkflowIntegration.handleMultiplayerQuizInvite(inviteData)
} 