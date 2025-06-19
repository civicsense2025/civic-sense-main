/**
 * CivicSense Email Triggers
 * Strategic transactional email automation via Plunk
 */

import { CivicSenseEmailService } from './mailerlite-service'
import { createClient } from '@/lib/supabase/client'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.us'

interface TriggerEmailData {
  email: string
  template: string
  data: Record<string, any>
}

interface UserData {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
  civic_level?: number
  streak_count?: number
  preferred_categories?: string[]
  location_state?: string
  engagement_tier?: 'new' | 'active' | 'champion' | 'inactive'
  pod_memberships?: PodMembership[]
  educator_status?: boolean
  last_quiz_date?: string
  major_achievements?: string[]
  notification_preferences?: string[]
}

interface PodMembership {
  pod_id: string
  pod_name: string
  pod_type: string
  role: string
  membership_status: string
  joined_at: string
}

interface Achievement {
  id: string
  name: string
  description: string
  earned_at: string
}

const emailService = new CivicSenseEmailService()

// Helper function to get user's pod memberships
async function getUserPodMemberships(userId: string): Promise<PodMembership[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pod_memberships')
      .select(`
        pod_id,
        role,
        membership_status,
        joined_at,
        learning_pods!inner(
          pod_name,
          pod_type
        )
      `)
      .eq('user_id', userId)
      .eq('membership_status', 'active')

    if (error) {
      console.error('Error fetching pod memberships:', error)
      return []
    }

    return data?.map((membership: any) => ({
      pod_id: membership.pod_id,
      pod_name: membership.learning_pods.pod_name,
      pod_type: membership.learning_pods.pod_type,
      role: membership.role,
      membership_status: membership.membership_status,
      joined_at: membership.joined_at
    })) || []
  } catch (error) {
    console.error('Error in getUserPodMemberships:', error)
    return []
  }
}

// Helper function to get comprehensive user data including pods
async function getEnhancedUserData(userId: string): Promise<UserData | null> {
  try {
    const supabase = createClient()
    // Get basic user data using admin API to get any user by ID
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user) {
      console.warn('Could not fetch user data:', userError)
      return null
    }

    // Get pod memberships
    const podMemberships = await getUserPodMemberships(userId)

    // Get recent achievements (if the table exists, otherwise use fallback)
    let achievements: any[] = []
    try {
      const { data: achievementData } = await supabase
        .from('user_achievements')
        .select('achievement_name, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5)
      achievements = achievementData || []
    } catch (error) {
      console.warn('User achievements table not available, using fallback')
      achievements = []
    }

    // Get user level from enhanced progress if available
    let civicLevel = 1
    let streakCount = 0
    try {
      // Try to get data from enhanced gamification if available
      const { enhancedProgressOperations } = await import('../enhanced-gamification')
      const progress = await enhancedProgressOperations.getComprehensiveStats(userId)
      civicLevel = progress?.currentLevel || 1
      streakCount = progress?.currentStreak || 0
    } catch (error) {
      console.warn('Enhanced progress not available, using fallback values')
    }

    return {
      id: user.id,
      email: user.email!,
      user_metadata: user.user_metadata,
      civic_level: civicLevel,
      streak_count: streakCount,
      preferred_categories: [], // Default empty array
      location_state: undefined, // Will be inferred from other data if needed
      engagement_tier: 'new' as const, // Default to new user
      pod_memberships: podMemberships,
      educator_status: false, // Default to false
      last_quiz_date: undefined, // Will be populated if needed
      major_achievements: achievements.map((a: any) => a.achievement_name) || [],
      notification_preferences: ['email_achievements', 'email_digest'] // Default preferences
    }
  } catch (error) {
    console.error('Error getting enhanced user data:', error)
    return null
  }
}

// Helper function to get pod-specific context for emails
function getPodEmailContext(user: UserData): Record<string, any> {
  if (!user.pod_memberships || user.pod_memberships.length === 0) {
    return {}
  }

  const primaryPod = user.pod_memberships[0] // Most recent or primary pod
  const totalPods = user.pod_memberships.length
  const isAdmin = user.pod_memberships.some(pod => ['admin', 'teacher', 'parent', 'organizer'].includes(pod.role))

  return {
    primary_pod_name: primaryPod.pod_name,
    primary_pod_type: primaryPod.pod_type,
    user_pod_role: primaryPod.role,
    total_pods: totalPods,
    is_pod_admin: isAdmin,
    pod_names: user.pod_memberships.map(pod => pod.pod_name)
  }
}

// Helper function to add personal founder touch to emails
function addFounderPersonalization(baseData: Record<string, any>, user: UserData): Record<string, any> {
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]
  
  return {
    ...baseData,
    founder_name: 'Tán',
    personal_note_from_founder: getPersonalNoteFromTan(user),
    user_first_name: firstName,
    is_educator: user.educator_status,
    civic_journey_stage: getCivicJourneyStage(user.civic_level || 1),
    ...getPodEmailContext(user)
  }
}

function getPersonalNoteFromTan(user: UserData): string {
  const level = user.civic_level || 1
  const hasAchievements = (user.major_achievements?.length || 0) > 0
  const inPods = (user.pod_memberships?.length || 0) > 0
  
  if (level >= 10 && hasAchievements) {
    return "I'm genuinely impressed by your commitment to understanding how power really works. Keep challenging the narratives."
  } else if (inPods) {
    return "Learning with others is exactly how democracy is supposed to work. You're building real civic power."
  } else if (level >= 5) {
    return "You're starting to see through the political theater to how things actually work. That's exactly what we need."
  } else {
    return "Thank you for choosing to learn the civics they don't teach in school. This matters more than you know."
  }
}

function getCivicJourneyStage(level: number): string {
  if (level >= 25) return "Civic Champion"
  if (level >= 15) return "Democracy Scholar"
  if (level >= 10) return "Power Analyst"
  if (level >= 5) return "Informed Citizen"
  return "Civic Learner"
}

// Helper functions for trigger conditions
export function getLevelTitle(level: number): string {
  if (level >= 50) return "Democracy Expert"
  if (level >= 25) return "Civic Champion"
  if (level >= 15) return "Democracy Scholar"
  if (level >= 10) return "Power Analyst"
  if (level >= 5) return "Informed Citizen"
  if (level >= 3) return "Civic Explorer"
  return "Democracy Newcomer"
}

export function getLevelPowerMessage(level: number): string {
  const powerMessages = {
    1: "You're learning how power actually flows in America",
    3: "You understand more about government than most Americans",
    5: "You can see through political theater to real policy impacts",
    10: "You understand how the system is designed to work - and how it actually works",
    15: "You can analyze power structures most people don't even notice",
    25: "You have the civic knowledge to hold representatives accountable",
    50: "You understand power dynamics at a level that makes politicians nervous"
  }
  
  return powerMessages[level as keyof typeof powerMessages] || "Your civic knowledge is growing stronger"
}

// Tier 1: Powerful Moments (Immediate Send)
export async function triggerFirstPerfectQuizEmail(user: UserData, quizData: any) {
  console.log('🎯 Triggering first perfect quiz email for', user.email)
  
  const userData = await getEnhancedUserData(user.id)
  if (!userData) return
  
  const emailData = {
    ...getBaseEmailData(userData),
    ...addFounderPersonalization({}, userData),
    quiz_title: quizData.title,
    quiz_category: quizData.category,
    
    // More natural, less "civic" heavy content
    achievement_message: "You just nailed every question. That means you understand something most Americans don't.",
    power_insight: "Here's what this really means: You can now see through the political theater to how decisions actually get made.",
    personal_note_from_founder: "I get excited when people connect these dots. This is exactly why I built CivicSense.",
    
    // Story-driven next steps
    what_this_unlocks: `Now that you understand ${quizData.category}, you can start tracking how these decisions affect your daily life`,
    next_challenge: getNextChallengeForUser(userData),
    share_insight: `"I just figured out how ${quizData.category} really works - it's not what they teach in school"`,
    
    // Survey integration for feedback
    survey_prompt: {
      question: "What surprised you most about this topic?",
      survey_url: `https://civicsense.us/survey/quiz-insights?topic=${quizData.slug}&prefill=true`
    }
  }

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'achievement-first-quiz-perfect',
    data: emailData,
    emailType: 'quiz_achievement'
  })
}

export async function triggerSevenDayStreak(userId: string) {
  const user = await getEnhancedUserData(userId)
  if (!user) return

  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    streak_count: 7,
    civic_power_unlocked: "You now understand more about democracy than 73% of Americans",
    streak_badge_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-image?template=achievement&badge=7-day-streak`,
    keep_streak_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    body: "Seven days in a row! This consistency is exactly how you build real civic power. Most people consume political news passively - you're actively building understanding.",
    survey_prompt: {
      question: "How has your daily civic learning affected your understanding of current events?",
      survey_url: `${process.env.NEXT_PUBLIC_SITE_URL}/survey/streak-impact?streak=7&prefill=true`
    }
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'achievement-week-streak',
    data: emailData,
    emailType: 'streak_encouragement'
  })
}

export async function triggerLevelUp(userId: string, newLevel: number) {
  const user = await getEnhancedUserData(userId)
  if (!user) return

  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    new_level: newLevel,
    level_title: getLevelTitle(newLevel),
    power_unlock_message: getLevelPowerMessage(newLevel),
    celebration_image: `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-image?template=achievement&badge=level-${newLevel}`,
    next_milestone: getLevelTitle(newLevel + 5),
    body: `Congratulations on reaching ${getLevelTitle(newLevel)}! You've unlocked a new level of civic understanding.`
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'achievement-level-up',
    data: emailData,
    emailType: 'level_up'
  })
}

export async function triggerFirstSocialShare(userId: string, shareData: {
  platform: string
  achievement?: string
  quizResult?: string
}) {
  const user = await getEnhancedUserData(userId)
  if (!user) return

  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    share_platform: shareData.platform,
    civic_impact_message: "You're helping spread civic knowledge! Every person who sees your achievement becomes a little more informed about democracy.",
    community_stats: "Over 50,000 people are building civic power on CivicSense",
    invite_friends_url: `${process.env.NEXT_PUBLIC_SITE_URL}/invite`,
    body: "Thank you for sharing your civic learning journey! When you share your achievements, you're not just celebrating - you're encouraging others to understand how power really works."
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'first-share-celebration',
    data: emailData,
    emailType: 'quiz_achievement'
  })
}

// Tier 2: Milestone Moments (Strategic Timing)
export async function triggerWeeklyDigest(userId: string) {
  const user = await getEnhancedUserData(userId)
  if (!user || user.engagement_tier === 'inactive') return

  // Get user's recent activity and personalized recommendations
  const weekSummary = "This week you completed 3 quizzes and learned about judicial review" // Would be calculated from actual data
  const recommendedTopics = [
    'How Your City Council Really Works',
    'Understanding Congressional Committee Power',
    'Local Elections That Actually Matter'
  ] // Would be personalized based on preferred_categories

  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    week_summary: weekSummary,
    recommended_topics: recommendedTopics,
    local_civic_action: [
      'City Council meeting this Thursday at 7 PM',
      'School board budget hearing next Tuesday'
    ], // Would be location-based
    trending_discussions: [
      'How does gerrymandering actually work in practice?',
      'Why local elections have more impact than you think'
    ],
    this_week_in_democracy: "Congress passed infrastructure funding changes - here's what it means for your community",
    preferred_categories: user.preferred_categories,
    body: "Your weekly civic learning summary - plus some developments this week that connect to what you've been studying."
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'personalized-topic-digest',
    data: emailData,
    emailType: 'weekly_digest'
  })
}

export async function triggerLearningPodInvitation(
  inviteeUserId: string,
  inviterUserId: string,
  podData: {
    id: string
    name: string
    type: string
    description: string
    inviteCode: string
  }
) {
  const [invitee, inviter] = await Promise.all([
    getEnhancedUserData(inviteeUserId),
    getEnhancedUserData(inviterUserId)
  ])

  if (!invitee || !inviter) return

  const emailData = addFounderPersonalization({
    invitee_name: invitee.user_metadata?.full_name || invitee.email.split('@')[0],
    inviter_name: inviter.user_metadata?.full_name || inviter.email.split('@')[0],
    pod_name: podData.name,
    pod_type: podData.type,
    pod_description: podData.description,
    join_url: `${process.env.NEXT_PUBLIC_SITE_URL}/join/${podData.inviteCode}`,
    pod_preview_stats: "Active group averaging 85% quiz scores", // Would be calculated from actual pod stats
    why_pods_matter: "Learning about democracy works best when you can discuss it with others. That's how the founders intended civic education to work.",
    body: `${inviter.user_metadata?.full_name || inviter.email.split('@')[0]} has invited you to join "${podData.name}" for collaborative civic learning.`
  }, invitee)

  await emailService.sendTemplateEmail({
    to: invitee.email,
    template: 'pod-invitation',
    data: emailData,
    emailType: 'learning_pod_invitation'
  })
}

// Tier 3: Engagement & Retention
export async function triggerReEngagement(userId: string, daysSinceLastVisit: number) {
  const user = await getEnhancedUserData(userId)
  if (!user) return

  const civicMomentHook = "While you were away, Congress passed a bill that affects your daily commute. The transportation funding changes mean different things for different communities."
  
  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    days_away: daysSinceLastVisit,
    civic_moment_hook: civicMomentHook,
    personalized_comeback: `Based on your interest in ${user.preferred_categories?.[0] || 'government'}, we think you'd find the new developments fascinating`,
    quick_quiz_url: `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/recommended`,
    what_you_missed: [
      'New Supreme Court decision on voting rights',
      'Major infrastructure bill affecting your state',
      'Local election results in your area'
    ],
    body: `We miss you! While you were away for ${daysSinceLastVisit} days, some important civic developments happened that connect to what you've been learning.`
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 're-engagement-civic-moment',
    data: emailData,
    emailType: 'weekly_digest'
  })
}

export async function triggerCivicNewsAlert(
  userId: string,
  newsData: {
    headline: string
    impact: string
    action: string
    quizId?: string
    discussionUrl?: string
  }
) {
  const user = await getEnhancedUserData(userId)
  if (!user || !user.notification_preferences?.includes('civic_news')) return

  const emailData = addFounderPersonalization({
    user_name: user.user_metadata?.full_name || user.email.split('@')[0],
    news_headline: newsData.headline,
    why_this_matters_to_you: newsData.impact,
    action_you_can_take: newsData.action,
    learn_more_quiz: newsData.quizId,
    discussion_url: newsData.discussionUrl,
    body: `Breaking: ${newsData.headline} - this affects you directly based on what you've been learning about democracy.`
  }, user)

  await emailService.sendTemplateEmail({
    to: user.email,
    template: 'civic-news-alert',
    data: emailData,
    emailType: 'weekly_digest'
  })
}

function getNextChallengeForUser(user: UserData | null): string {
  if (!user) return "Understanding Congressional Power"
  
  const level = user.civic_level || 1
  const completedCategories = user.preferred_categories || []
  
  if (level < 5) return "How Your Vote Actually Gets Counted"
  if (level < 10) return "Understanding Judicial Review"
  if (level < 15) return "Following the Money in Politics"
  if (level < 25) return "Local Politics That Control Your Daily Life"
  
  // For advanced users, suggest areas they haven't explored
  const availableChallenges = [
    "Understanding Regulatory Capture",
    "How Gerrymandering Really Works",
    "The Reality of Congressional Committee Power",
    "Why Local Elections Matter More Than National Ones"
  ]
  
  return availableChallenges[Math.floor(Math.random() * availableChallenges.length)]
}

function getBaseEmailData(user: UserData | null) {
  return {
    user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there',
    site_name: 'CivicSense',
    site_url: 'https://civicsense.us',
    support_email: 'support@civicsense.us',
    current_year: new Date().getFullYear()
  }
} 