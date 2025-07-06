import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { oneSignal } from '@/lib/integrations/onesignal'
import { createClient } from '@/lib/supabase/server'

// Validation schema for notification triggers
const TriggerNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['streak', 'achievement', 'reminder', 'voting_alert', 'custom']),
  data: z.any() // Flexible data field for different notification types
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = TriggerNotificationSchema.parse(body)
    
    const { userId, type, data } = validatedData

    // Get user's civic profile for personalization
    const supabase = await createClient()
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select(`
        id, 
        email,
        civic_engagement_level,
        quiz_streak_count,
        user_profiles (
          notification_preferences,
          onesignal_user_id
        )
      `)
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has notifications enabled
    const preferences = userProfile.user_profiles?.[0]?.notification_preferences as any
    if (preferences && !preferences.notifications) {
      return NextResponse.json({
        success: false,
        message: 'User has notifications disabled'
      })
    }

    let notificationResult: { success: boolean; notificationId?: string } = { success: false }

    // Handle different notification types
    switch (type) {
      case 'streak':
        notificationResult = await handleStreakNotification(userId, data, userProfile)
        break
        
      case 'achievement':
        notificationResult = await handleAchievementNotification(userId, data, userProfile)
        break
        
      case 'reminder':
        notificationResult = await handleReminderNotification(userId, data, userProfile)
        break
        
      case 'voting_alert':
        notificationResult = await handleVotingAlert(userId, data, userProfile)
        break
        
      case 'custom':
        notificationResult = await handleCustomNotification(userId, data, userProfile)
        break
        
      default:
        return NextResponse.json(
          { error: 'Unknown notification type' },
          { status: 400 }
        )
    }

    if (!notificationResult.success) {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }

    // Log notification for analytics
    await supabase
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'notification_sent',
        event_data: {
          notification_type: type,
          notification_id: notificationResult.notificationId,
          success: true
        }
      })

    return NextResponse.json({
      success: true,
      notificationId: notificationResult.notificationId,
      message: 'Notification sent successfully'
    })

  } catch (error) {
    console.error('OneSignal trigger notification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// NOTIFICATION HANDLERS
// =============================================================================

async function handleStreakNotification(
  userId: string, 
  data: any, 
  userProfile: any
): Promise<{ success: boolean; notificationId?: string }> {
  const streakCount = data.streakCount || userProfile.quiz_streak_count || 0
  
  if (streakCount < 2) {
    return { success: false } // Don't send streak notifications for < 2 days
  }

  const streakMilestones = [3, 7, 14, 30, 60, 100]
  const isStreakMilestone = streakMilestones.includes(streakCount)

  let title = `🔥 ${streakCount} Day Democracy Streak!`
  let message = `You're building serious civic knowledge. Keep the momentum going!`

  if (isStreakMilestone) {
    title = `🏆 ${streakCount} Day Democracy Milestone!`
    message = `Incredible dedication to civic learning! You're becoming harder to manipulate and impossible to fool.`
  }

  return await oneSignal.sendCivicNotification({
    userIds: [userId],
    title,
    message,
    civicAction: {
      type: 'quiz_reminder',
      actionUrl: 'civicsense://quiz',
      urgency: 'low'
    }
  })
}

async function handleAchievementNotification(
  userId: string, 
  data: any, 
  userProfile: any
): Promise<{ success: boolean; notificationId?: string }> {
  const { achievement, category, score } = data

  const achievements = {
    'constitution_master': {
      title: '📜 Constitution Master!',
      message: 'You\'ve mastered the Constitution. Now you know your rights better than most politicians want you to.'
    },
    'voting_expert': {
      title: '🗳️ Voting Expert!',
      message: 'You understand how voting really works. Use this knowledge to make your voice heard.'
    },
    'power_analyst': {
      title: '⚡ Power Dynamics Expert!',
      message: 'You can see through political BS. This makes you dangerous to those who profit from ignorance.'
    },
    'civic_champion': {
      title: '🏆 Civic Champion!',
      message: 'You\'ve become a force for democratic accountability. Keep questioning everything.'
    }
  }

  const achievementData = achievements[achievement as keyof typeof achievements]
  
  if (!achievementData) {
    return { success: false }
  }

  return await oneSignal.sendCivicNotification({
    userIds: [userId],
    title: achievementData.title,
    message: achievementData.message,
    civicAction: {
      type: 'quiz_reminder',
      actionUrl: `civicsense://achievement/${achievement}`,
      urgency: 'medium'
    }
  })
}

async function handleReminderNotification(
  userId: string, 
  data: any, 
  userProfile: any
): Promise<{ success: boolean; notificationId?: string }> {
  const { reminderType, customMessage, topicId } = data

  const reminders = {
    'daily_quiz': {
      title: '📚 Daily Democracy Check',
      message: customMessage || 'Ready to learn something politicians hope you don\'t know?'
    },
    'weekly_review': {
      title: '🔍 Weekly Reality Check',
      message: customMessage || 'Time to review what you\'ve learned about how power really works.'
    },
    'engagement_boost': {
      title: '💪 Civic Engagement Time',
      message: customMessage || 'Democracy needs you informed and active. Let\'s keep learning.'
    }
  }

  const reminderData = reminders[reminderType as keyof typeof reminders]
  
  if (!reminderData) {
    return { success: false }
  }

  return await oneSignal.sendCivicNotification({
    userIds: [userId],
    title: reminderData.title,
    message: reminderData.message,
    civicAction: {
      type: 'quiz_reminder',
      actionUrl: topicId ? `civicsense://topic/${topicId}` : 'civicsense://quiz',
      urgency: 'low'
    }
  })
}

async function handleVotingAlert(
  userId: string, 
  data: any, 
  userProfile: any
): Promise<{ success: boolean; notificationId?: string }> {
  const { electionType, electionDate, location, registrationDeadline } = data

  const daysUntilElection = Math.ceil(
    (new Date(electionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  let title = `🗳️ ${electionType} Election Alert!`
  let message = `${daysUntilElection} days until ${electionType} election. Your vote is your voice in democracy.`
  let urgency: 'low' | 'medium' | 'high' = 'medium'

  if (daysUntilElection <= 3) {
    title = `🚨 Election in ${daysUntilElection} Days!`
    message = `Last chance to vote in the ${electionType} election. Don't let others decide for you.`
    urgency = 'high'
  } else if (registrationDeadline && new Date(registrationDeadline) > new Date()) {
    const daysUntilDeadline = Math.ceil(
      (new Date(registrationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDeadline <= 7) {
      title = `⏰ Voter Registration Deadline Soon!`
      message = `Only ${daysUntilDeadline} days left to register for the ${electionType} election.`
      urgency = 'high'
    }
  }

  return await oneSignal.sendCivicNotification({
    userIds: [userId],
    title,
    message,
    civicAction: {
      type: 'voting_alert',
      actionUrl: 'civicsense://voting-guide',
      urgency
    }
  })
}

async function handleCustomNotification(
  userId: string, 
  data: any, 
  userProfile: any
): Promise<{ success: boolean; notificationId?: string }> {
  const { title, message, actionUrl, urgency = 'medium' } = data

  if (!title || !message) {
    return { success: false }
  }

  return await oneSignal.sendCivicNotification({
    userIds: [userId],
    title,
    message,
    civicAction: {
      type: 'quiz_reminder',
      actionUrl: actionUrl || 'civicsense://home',
      urgency
    }
  })
} 