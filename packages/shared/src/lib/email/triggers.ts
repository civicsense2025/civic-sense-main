/**
 * CivicSense Email Triggers
 * Functions to send strategic transactional emails via MailerSend
 */

import { emailService, EmailType } from './mailerlite-service'
import { EmailAnalyticsTracker } from '../utils/analytics-enhanced'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.us'
const analytics = EmailAnalyticsTracker.getInstance()

// User data interface for email triggers
interface EmailUser {
  id: string
  email: string
  name: string
  civic_level?: number
  streak_count?: number
  state?: string
  preferred_topics?: string[]
  engagement_tier?: 'new' | 'active' | 'champion' | 'inactive'
  pod_member?: boolean
  educator_status?: boolean
  last_quiz_date?: Date
  major_achievements?: string[]
}

// Quiz data interface
interface QuizData {
  id: string
  title: string
  topic: string
  score?: number
  whyThisMatters?: string
  category?: string
}

// Pod interface with member_count
interface PodData {
  id: string
  name: string
  type: string
  description: string
  member_count?: number
}

// Achievement types
type AchievementType = 
  | 'first_perfect_quiz'
  | 'seven_day_streak'
  | 'level_up'
  | 'first_share'
  | 'civic_champion'
  | 'helped_someone'

/**
 * 🎯 TIER 1: POWERFUL MOMENTS (Immediate Send)
 * These create emotional connection and drive viral sharing
 */

/**
 * Send celebration email for first perfect quiz score
 */
export async function triggerFirstPerfectQuiz(
  user: EmailUser,
  quiz: QuizData,
  attemptId: string
) {
  const civicInsight = quiz.whyThisMatters || getDefaultCivicInsight(quiz.topic)
  const nextChallenge = await getPersonalizedNextTopic(user.id)
  
  const emailData = {
    user_name: user.name,
    achievement_type: 'first_perfect_quiz',
    achievement_title: `Perfect Score: ${quiz.title}`,
    achievement_description: civicInsight,
    quiz_topic: quiz.title,
    score: 100,
    civic_insight: civicInsight,
    share_url: `${baseUrl}/results/${attemptId}?share=true`,
    next_challenge: nextChallenge,
    power_message: "You now understand something about democracy that most Americans don't. That's real civic power."
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "You just understood something most Americans don't",
    emailData,
    'achievement-first-quiz-perfect',
    'achievement'
  )
  
  // Track for analytics
  await analytics.trackEmailSent(result, {
    achievement_type: 'first_perfect_quiz',
    quiz_topic: quiz.topic,
    user_level: user.civic_level
  })
  
  console.log('✅ Perfect quiz achievement email sent successfully')
  
  return result
}

/**
 * Send celebration email for 7-day learning streak
 */
export async function triggerSevenDayStreak(user: EmailUser) {
  const streakBadgeUrl = `${baseUrl}/api/generate-image?template=achievement&badge=7-day-streak&user=${encodeURIComponent(user.name)}`
  
  const emailData = {
    user_name: user.name,
    achievement_type: 'seven_day_streak',
    achievement_title: '🔥 7-Day Learning Streak!',
    achievement_description: 'You understand more about democracy than 73% of Americans',
    streak_count: 7,
    civic_power_unlocked: "You now understand more about democracy than 73% of Americans",
    streak_badge_url: streakBadgeUrl,
    keep_streak_url: `${baseUrl}/dashboard`,
    social_share_message: `🏛️ Just completed a 7-day civic learning streak on @CivicSense! Building real democratic knowledge, one day at a time. #CivicPower #Democracy`
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "Your civic learning streak is impressive",
    emailData,
    'achievement-week-streak',
    'streak'
  )
  
  await analytics.trackEmailSent(result, {
    achievement_type: 'seven_day_streak',
    streak_count: 7,
    user_level: user.civic_level
  })
  
  return result
}

/**
 * Send level up celebration email
 */
export async function triggerLevelUp(user: EmailUser, newLevel: number) {
  const levelTitle = getLevelTitle(newLevel)
  const powerMessage = getLevelPowerMessage(newLevel)
  const celebrationImage = await generateLevelUpImage(newLevel, user.name)
  const nextMilestone = getNextMilestone(newLevel)
  const xpGained = 100 // Assuming a default xpGained value
  
  const emailData = {
    user_name: user.name,
    old_level: newLevel - 1,
    new_level: newLevel,
    level_title: levelTitle,
    xp_earned: xpGained,
    civic_power_message: "You now understand more about democracy than most college graduates. That's real civic power.",
    next_milestone: nextMilestone,
    dashboard_url: `${baseUrl}/dashboard`,
    social_share_message: `🏛️ Just leveled up to ${levelTitle} on @CivicSense! Understanding democracy is real power. #CivicPower #Democracy`
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "You've leveled up your civic knowledge",
    emailData,
    'achievement-level-up',
    'level_up'
  )
  
  await analytics.trackEmailSent(result, {
    achievement_type: 'level_up',
    new_level: newLevel,
    level_title: levelTitle
  })
  
  return result
}

/**
 * Send celebration email for first social share
 */
export async function triggerFirstShare(
  user: EmailUser,
  platform: string,
  sharedContent: { type: string; title: string }
) {
  const communityStats = await getCommunityGrowthStats()
  
  const emailData = {
    user_name: user.name,
    share_platform: platform,
    shared_content: sharedContent.title,
    civic_impact_message: "You're helping spread civic knowledge! Informed citizens strengthen democracy.",
    community_stats: communityStats,
    invite_friends_url: `${baseUrl}/invite?ref=${user.id}`,
    viral_content: {
      twitter: `🏛️ Just shared my civic learning progress on @CivicSense! "${sharedContent.title}" - civic education that actually prepares you for democratic participation. #CivicPower`,
      facebook: `I just learned something about democracy that I never knew: "${sharedContent.title}". Check out CivicSense - it's civic education that actually prepares you for real democratic participation.`
    }
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "Thank you for sharing your civic learning journey",
    emailData,
    'first-share-celebration',
    'achievement'
  )
  
  await analytics.trackEmailSent(result, {
    achievement_type: 'first_share',
    platform,
    shared_content_type: sharedContent.type
  })
  
  return result
}

/**
 * 🎯 TIER 2: MILESTONE MOMENTS (Strategic Timing)
 */

/**
 * Send weekly personalized civic digest (Sundays 10 AM)
 */
export async function triggerWeeklyDigest(user: EmailUser) {
  if (user.engagement_tier !== 'active' && user.engagement_tier !== 'champion') {
    return { success: false, error: 'User not in active segment for weekly digest' }
  }
  
  const weekSummary = await getUserWeekSummary(user.id)
  const recommendedTopics = await getPersonalizedTopics(user.id, user.state)
  const localCivicAction = await getLocalCivicOpportunities(user.state)
  const trendingDiscussions = await getTrendingPodDiscussions()
  const weeklyNews = await getWeeklyDemocracyNews()
  
  const emailData = {
    user_name: user.name,
    user_state: user.state || 'your area',
    civic_level: user.civic_level || 1,
    week_summary: weekSummary,
    recommended_topics: recommendedTopics,
    local_civic_action: localCivicAction,
    trending_discussions: trendingDiscussions,
    this_week_in_democracy: weeklyNews,
    streak_count: user.streak_count || 0
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "This week you learned what most people don't know",
    emailData,
    'personalized-topic-digest',
    'weekly_digest'
  )
  
  await analytics.trackEmailSent(result, {
    user_level: user.civic_level,
    topics_included: recommendedTopics.length,
    local_opportunities: localCivicAction.length
  })
  
  return result
}

/**
 * Send learning pod invitation email
 */
export async function triggerPodInvitation(
  invitee: EmailUser,
  inviter: EmailUser,
  pod: PodData,
  inviteCode: string
) {
  const podStats = await getPodStats(pod.id)
  
  const emailData = {
    inviter_name: inviter.name,
    invitee_name: invitee.name,
    pod_name: pod.name,
    join_link: `${baseUrl}/join/${inviteCode}`,
    pod_description: pod.description || 'A collaborative space for civic learning',
    pod_members_count: pod.member_count || podStats.member_count || 0,
    action_url: `${baseUrl}/join/${inviteCode}`,
    deadline: 'Join anytime',
    custom_message: ''
  }
  
  const result = await emailService.sendTransactionalEmail(
    invitee.email,
    `${inviter.name} wants to learn with you`,
    emailData,
    'pod-invitation',
    'learning_pod_invitation'
  )
  
  await analytics.trackEmailSent(result, {
    pod_id: pod.id,
    inviter_id: inviter.id,
    pod_type: pod.type
  })
  
  return result
}

/**
 * Send recognition email when user helps someone else
 */
export async function triggerHelpedSomeoneRecognition(
  helper: EmailUser,
  helpedWith: { topic: string; type: string }
) {
  const impactStats = await getHelperImpactStats(helper.id)
  
  const emailData = {
    helper_name: helper.name,
    impact_message: `Your shared insight about "${helpedWith.topic}" just helped someone master that topic!`,
    civic_ripple_effect: "When you share civic knowledge, you strengthen democracy for everyone.",
    community_impact_stats: impactStats,
    continue_helping_url: `${baseUrl}/pods`
  }
  
  const result = await emailService.sendTransactionalEmail(
    helper.email,
    "You just helped someone understand democracy better",
    emailData,
    'helped-someone-recognition',
    'achievement'
  )
  
  await analytics.trackEmailSent(result, {
    helped_with_topic: helpedWith.topic,
    help_type: helpedWith.type,
    total_people_helped: impactStats.totalPeopleHelped
  })
  
  return result
}

/**
 * 🎯 TIER 3: ENGAGEMENT & RETENTION
 */

/**
 * Send re-engagement email with civic moment hook
 */
export async function triggerReEngagement(user: EmailUser, daysSinceLastVisit: number) {
  const civicMoment = await getCurrentCivicMoment(user.state)
  const personalizedComeback = await getPersonalizedReengagement(user.id)
  const recommendedQuizId = await getRecommendedQuiz(user.id)
  const recentHighlights = await getRecentCivicHighlights()
  
  const emailData = {
    user_name: user.name,
    days_away: daysSinceLastVisit,
    civic_moment_hook: civicMoment,
    personalized_comeback: personalizedComeback,
    quick_quiz_url: `${baseUrl}/quiz/${recommendedQuizId}`,
    what_you_missed: recentHighlights
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "Democracy didn't stop while you were away",
    emailData,
    're-engagement-civic-moment',
    're_engagement'
  )
  
  await analytics.trackEmailSent(result, {
    days_inactive: daysSinceLastVisit,
    user_level: user.civic_level,
    previous_engagement_tier: user.engagement_tier
  })
  
  return result
}

/**
 * Send civic news alert for breaking civic education moments
 */
export async function triggerCivicNewsAlert(
  user: EmailUser,
  event: {
    id: string
    headline: string
    personalizedImpact: string
    civicAction: string
    relatedQuizId?: string
  }
) {
  const emailData = {
    user_name: user.name,
    news_headline: event.headline,
    why_this_matters_to_you: event.personalizedImpact,
    action_you_can_take: event.civicAction,
    learn_more_quiz: event.relatedQuizId,
    discussion_url: `${baseUrl}/pods/discuss/${event.id}`
  }
  
  const result = await emailService.sendTransactionalEmail(
    user.email,
    "Breaking: Something they don't want you to understand",
    emailData,
    'civic-news-alert',
    'civic_news_alert'
  )
  
  await analytics.trackEmailSent(result, {
    event_id: event.id,
    user_state: user.state,
    has_quiz: !!event.relatedQuizId
  })
  
  return result
}

/**
 * HELPER FUNCTIONS
 */

function getLevelTitle(level: number): string {
  const titles = {
    1: 'Informed Citizen',
    5: 'Civic Scholar',
    10: 'Democracy Expert',
    25: 'Constitutional Master',
    50: 'Civic Champion'
  }
  
  // Find the highest title earned
  const earnedLevels = Object.keys(titles)
    .map(Number)
    .filter(l => l <= level)
    .sort((a, b) => b - a)
  
  return titles[earnedLevels[0] as keyof typeof titles] || 'Civic Learner'
}

function getLevelPowerMessage(level: number): string {
  const messages = {
    1: "You've taken the first step toward real civic power",
    5: "You now understand more about democracy than 60% of Americans",
    10: "You have the civic knowledge to hold elected officials accountable",
    25: "You understand the levers of power in American democracy",
    50: "You're equipped to be a civic leader in your community"
  }
  
  return messages[level as keyof typeof messages] || "You're building real civic power"
}

function getNextMilestone(level: number): { level: number; title: string; description: string } {
  const milestones = [
    { level: 1, title: 'First Achievement', description: 'Complete your first quiz' },
    { level: 5, title: 'Civic Scholar', description: 'Master 5 civic topics' },
    { level: 10, title: 'Democracy Expert', description: 'Build comprehensive civic knowledge' },
    { level: 25, title: 'Constitutional Master', description: 'Understand the foundations of democracy' },
    { level: 50, title: 'Civic Champion', description: 'Become a civic leader' }
  ]
  
  return milestones.find(m => m.level > level) || { 
    level: level + 10, 
    title: 'Civic Leader', 
    description: 'Continue building your civic impact' 
  }
}

function getDefaultCivicInsight(topic: string): string {
  return `Understanding "${topic}" gives you the knowledge to participate more effectively in democracy. This isn't just academic—it's practical power you can use as a citizen.`
}

// Mock functions for personalization data
// These should be replaced with actual implementations

async function getPersonalizedNextTopic(userId: string): Promise<string> {
  // TODO: Implement based on user's learning history and interests
  return "Understanding Your State Legislature"
}

async function getUserWeekSummary(userId: string): Promise<any> {
  // TODO: Implement actual user activity summary
  return {
    quizzes_completed: 3,
    topics_mastered: 2,
    streak_maintained: true,
    civic_power_growth: "15%"
  }
}

async function getPersonalizedTopics(userId: string, state?: string): Promise<any[]> {
  // TODO: Implement topic recommendation engine
  return [
    { title: "How Your State Legislature Works", why_relevant: "Based on your location and interests" },
    { title: "Understanding Local Elections", why_relevant: "Elections coming up in your area" }
  ]
}

async function getLocalCivicOpportunities(state?: string): Promise<any[]> {
  // TODO: Implement local civic event API
  return [
    { title: "Town Hall Next Tuesday", description: "Your mayor will discuss the budget" },
    { title: "Voter Registration Drive", description: "Help your neighbors register to vote" }
  ]
}

async function getTrendingPodDiscussions(): Promise<any[]> {
  // TODO: Implement trending discussions logic
  return [
    { title: "How does gerrymandering actually work?", participants: 24 },
    { title: "Understanding the Electoral College", participants: 18 }
  ]
}

async function getWeeklyDemocracyNews(): Promise<string> {
  // TODO: Implement curated civic news summary
  return "This week: Supreme Court heard arguments on voting rights, Congress debated infrastructure, and local elections happened in 15 states."
}

async function getCommunityGrowthStats(): Promise<any> {
  // TODO: Implement community metrics
  return {
    total_learners: 50000,
    this_month_growth: 1250,
    knowledge_shared: 75000
  }
}

async function getPodStats(podId: string): Promise<any> {
  // TODO: Implement pod analytics
  return {
    member_count: 12,
    avg_quiz_score: 85,
    topics_covered: 8
  }
}

async function getHelperImpactStats(userId: string): Promise<any> {
  // TODO: Implement helper impact tracking
  return {
    totalPeopleHelped: 15,
    topicsShared: 8,
    helpfulness_rating: 4.8
  }
}

async function getCurrentCivicMoment(state?: string): Promise<string> {
  // TODO: Implement real-time civic moment detection
  return "While you were away, Congress passed a bill that affects your daily commute..."
}

async function getPersonalizedReengagement(userId: string): Promise<string> {
  // TODO: Implement personalized re-engagement content
  return "Your civic learning journey was making real progress. Ready to continue building your democratic power?"
}

async function getRecommendedQuiz(userId: string): Promise<string> {
  // TODO: Implement quiz recommendation engine
  return "constitutional-rights-basics"
}

async function getRecentCivicHighlights(): Promise<string[]> {
  // TODO: Implement recent highlights
  return [
    "Supreme Court decision on voting rights",
    "Local election results in 15 states",
    "New civic education requirements passed"
  ]
}

async function generateLevelUpImage(level: number, userName: string): Promise<string> {
  // TODO: Implement dynamic image generation
  return `${baseUrl}/api/generate-image?template=level-up&level=${level}&user=${encodeURIComponent(userName)}`
} 