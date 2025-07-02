/**
 * OneSignal Integration Examples for CivicSense
 * Shows how to connect existing components to OneSignal workflows
 */

import { 
  triggerQuizCompletionWorkflow,
  triggerBreakingNewsWorkflow,
  triggerElectionWorkflow,
  triggerOnboardingWorkflow,
  triggerMultiplayerWorkflow
} from './civic-workflows'

// ============================================================================
// QUIZ ENGINE INTEGRATION
// ============================================================================

/**
 * Example: Integrate with your existing quiz completion handler
 * Add this to your quiz engine completion logic
 */
export async function handleQuizCompletionWithNotifications(
  userId: string,
  quizResults: {
    topicId: string
    score: number
    answers: any[]
    timeSpent: number
  }
) {
  try {
    // Your existing quiz completion logic
    await saveQuizResultsToDatabase(userId, quizResults)
    
    // NEW: Trigger OneSignal workflow
    await triggerQuizCompletionWorkflow(userId, {
      topicId: quizResults.topicId,
      score: quizResults.score,
      topic: await getTopicTitle(quizResults.topicId),
      difficulty: await getTopicDifficulty(quizResults.topicId)
    })
    
    // Your existing success response
    return { success: true, score: quizResults.score }
    
  } catch (error) {
    console.error('Quiz completion with notifications failed:', error)
    // Still save results even if notifications fail
    await saveQuizResultsToDatabase(userId, quizResults)
    throw error
  }
}

// ============================================================================
// NEWS PUBLISHING INTEGRATION
// ============================================================================

/**
 * Example: Integrate with your news publishing workflow
 * Add this to your admin news creation system
 */
export async function publishNewsWithNotifications(newsData: {
  headline: string
  content: string
  summary: string
  categories: string[]
  author_id: string
}) {
  try {
    // Your existing news publishing logic
    const publishedNews = await publishNewsToDatabase(newsData)
    
    // NEW: Calculate civic relevance and trigger notifications
    const civicRelevance = await calculateCivicRelevanceScore(newsData)
    
    if (civicRelevance.score > 60) {
      await triggerBreakingNewsWorkflow({
        id: publishedNews.id,
        headline: newsData.headline,
        summary: newsData.summary,
        categories: newsData.categories,
        civic_relevance_score: civicRelevance.score,
        urgency: civicRelevance.urgency,
        affects_voting: civicRelevance.affects_voting,
        affects_states: civicRelevance.affected_states
      })
    }
    
    return publishedNews
    
  } catch (error) {
    console.error('News publishing with notifications failed:', error)
    throw error
  }
}

// ============================================================================
// USER ONBOARDING INTEGRATION
// ============================================================================

/**
 * Example: Integrate with your user onboarding system
 * Add this to your onboarding completion handler
 */
export async function completeOnboardingWithNotifications(
  userId: string,
  onboardingData: {
    civic_interests: string[]
    location: { state?: string, district?: string }
    notification_preferences: string[]
  }
) {
  try {
    // Your existing onboarding completion logic
    await updateUserProfile(userId, onboardingData)
    
    // NEW: Set up OneSignal engagement journey
    await triggerOnboardingWorkflow(userId, {
      civic_interests: onboardingData.civic_interests,
      engagement_goals: ['learn', 'participate'], // Based on user choices
      location: onboardingData.location,
      preferred_channels: onboardingData.notification_preferences
    })
    
    return { success: true, message: 'Onboarding complete! Check for welcome notifications.' }
    
  } catch (error) {
    console.error('Onboarding with notifications failed:', error)
    throw error
  }
}

// ============================================================================
// MULTIPLAYER QUIZ INTEGRATION
// ============================================================================

/**
 * Example: Integrate with your multiplayer quiz system
 * Add this to your multiplayer room invitation logic
 */
export async function inviteToMultiplayerQuizWithNotifications(
  hostUserId: string,
  invitedUserIds: string[],
  quizTopic: string
) {
  try {
    // Your existing multiplayer room creation
    const room = await createMultiplayerRoom(hostUserId, quizTopic)
    
    // Add invited users to room
    await addUsersToRoom(room.id, invitedUserIds)
    
    // NEW: Send OneSignal invitations
    await triggerMultiplayerWorkflow({
      room_id: room.id,
      host_user_id: hostUserId,
      invited_user_ids: invitedUserIds,
      quiz_topic: quizTopic
    })
    
    return { 
      success: true, 
      room_id: room.id,
      message: 'Invitations sent via push notifications!'
    }
    
  } catch (error) {
    console.error('Multiplayer invite with notifications failed:', error)
    throw error
  }
}

// ============================================================================
// ELECTION & VOTING INTEGRATION
// ============================================================================

/**
 * Example: Integrate with your election/voting reminder system
 * Call this from your election management admin panel
 */
export async function scheduleElectionRemindersWithNotifications(electionData: {
  name: string
  date: string
  type: 'federal' | 'state' | 'local'
  affected_states?: string[]
  registration_deadline?: string
}) {
  try {
    // Your existing election data storage
    const election = await saveElectionToDatabase(electionData)
    
    // NEW: Set up OneSignal notification campaigns
    await triggerElectionWorkflow({
      id: election.id,
      name: electionData.name,
      date: electionData.date,
      type: electionData.type,
      affected_states: electionData.affected_states,
      registration_deadline: electionData.registration_deadline
    })
    
    return {
      success: true,
      message: 'Election reminders scheduled for all eligible users!'
    }
    
  } catch (error) {
    console.error('Election scheduling with notifications failed:', error)
    throw error
  }
}

// ============================================================================
// API ROUTE INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example: API route that handles quiz completion with notifications
 * Add this pattern to your existing API routes
 */
export async function POST_quiz_complete_with_notifications(request: Request) {
  try {
    const { userId, topicId, score, answers } = await request.json()
    
    // Validate input
    if (!userId || !topicId || score === undefined) {
      return new Response('Missing required fields', { status: 400 })
    }
    
    // Complete quiz with OneSignal integration
    const result = await handleQuizCompletionWithNotifications(userId, {
      topicId,
      score,
      answers,
      timeSpent: 0 // Calculate from your data
    })
    
    return Response.json(result)
    
  } catch (error) {
    console.error('Quiz completion API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS (implement these based on your existing data)
// ============================================================================

async function saveQuizResultsToDatabase(userId: string, results: any) {
  // Your existing database save logic
  console.log('Saving quiz results for user:', userId)
}

async function getTopicTitle(topicId: string): Promise<string> {
  // Get topic title from your database
  return 'Constitutional Rights' // Example
}

async function getTopicDifficulty(topicId: string): Promise<string> {
  // Get topic difficulty from your database
  return 'intermediate' // Example
}

async function publishNewsToDatabase(newsData: any) {
  // Your existing news publishing logic
  return { id: 'news-123', ...newsData }
}

async function calculateCivicRelevanceScore(newsData: any) {
  // Your AI/logic to score civic relevance
  return {
    score: 85,
    urgency: 'high' as const,
    affects_voting: true,
    affected_states: ['PA', 'MI', 'WI']
  }
}

async function updateUserProfile(userId: string, data: any) {
  // Your existing user profile update logic
  console.log('Updating user profile:', userId)
}

async function createMultiplayerRoom(hostUserId: string, topic: string) {
  // Your existing multiplayer room creation
  return { id: 'room-123', host: hostUserId, topic }
}

async function addUsersToRoom(roomId: string, userIds: string[]) {
  // Your existing room membership logic
  console.log('Adding users to room:', roomId, userIds)
}

async function saveElectionToDatabase(electionData: any) {
  // Your existing election data storage
  return { id: 'election-123', ...electionData }
}

// ============================================================================
// COMPONENT INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example: React component that triggers notifications
 */
export function QuizCompletionHandler({ onComplete }: { onComplete: (data: any) => void }) {
  const handleQuizComplete = async (results: any) => {
    try {
      // Trigger OneSignal workflow
      await handleQuizCompletionWithNotifications(results.userId, results)
      
      // Call parent component handler
      onComplete(results)
      
      // Show success message mentioning notifications
      alert('Quiz completed! Check for follow-up notifications with next steps.')
      
    } catch (error) {
      console.error('Quiz completion failed:', error)
      // Still call parent handler even if notifications fail
      onComplete(results)
    }
  }
  
  return null // This would be part of your quiz component
}

/**
 * Example: Admin component for sending breaking news
 */
export function BreakingNewsPublisher({ newsData }: { newsData: any }) {
  const handlePublish = async () => {
    try {
      await publishNewsWithNotifications(newsData)
      alert('News published and notifications sent to relevant users!')
    } catch (error) {
      console.error('Failed to publish news with notifications:', error)
      alert('News published but notification sending failed')
    }
  }
  
  return null // This would be part of your admin panel
} 