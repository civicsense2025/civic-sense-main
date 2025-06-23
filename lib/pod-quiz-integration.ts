/**
 * ============================================================================
 * CIVICSENSE POD-QUIZ INTEGRATION SYSTEM (CLIENT VERSION)
 * ============================================================================
 * 
 * This module handles the integration between quiz completion and learning pod
 * analytics/activities. When users complete quizzes, this system automatically:
 * 
 * 1. Logs the activity to pod activity feeds
 * 2. Updates member analytics and progress
 * 3. Updates pod-level analytics
 * 4. Checks for achievements and milestones
 * 5. Handles both authenticated users and guest users
 * 
 * Usage in quiz completion:
 * ```typescript
 * import { PodQuizIntegration } from '@/lib/pod-quiz-integration'
 * 
 * const integration = new PodQuizIntegration()
 * await integration.processQuizCompletion({
 *   userId: user.id,
 *   podId: searchParams.podId,
 *   topicId,
 *   score: results.score,
 *   timeSpent: results.timeSpent,
 *   // ... other data
 * })
 * ```
 */

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface QuizCompletionData {
  userId: string
  podId?: string
  topicId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpentSeconds: number
  gameMode?: string
  sessionId?: string
  guestToken?: string
  difficultyLevel?: number
  categorySlug?: string
}

export interface PodActivityResult {
  activityLogged: boolean
  analyticsUpdated: boolean
  achievementsEarned: string[]
  errors: string[]
}

export interface MemberAnalytics {
  accuracy_rate: number
  questions_answered: number
  quiz_attempts: number
  time_spent_minutes: number
  current_streak: number
  longest_streak: number
  achievements_earned: number
  sessions_count: number
  correct_answers: number
}

// ============================================================================
// CLIENT-SIDE INTEGRATION CLASS
// ============================================================================

export class PodQuizIntegration {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Main method to process quiz completion and update pod analytics
   */
  async processQuizCompletion(data: QuizCompletionData): Promise<PodActivityResult> {
    const result: PodActivityResult = {
      activityLogged: false,
      analyticsUpdated: false,
      achievementsEarned: [],
      errors: []
    }

    try {
      console.log('🎯 Processing quiz completion for pod integration:', {
        userId: data.userId,
        podId: data.podId,
        topicId: data.topicId,
        score: data.score
      })

      // Skip if no pod is specified
      if (!data.podId) {
        console.log('📝 No podId specified, skipping pod integration')
        return result
      }

      // Verify user is a member of the pod
      const isMember = await this.verifyPodMembership(data.userId, data.podId)
      if (!isMember) {
        result.errors.push('User is not a member of the specified pod')
        return result
      }

      // Process the integration steps in parallel for better performance
      const [activityResult, analyticsResult, achievementResult] = await Promise.allSettled([
        this.logPodActivity(data),
        this.updateMemberAnalytics(data),
        this.checkAchievements(data)
      ])

      // Handle activity logging result
      if (activityResult.status === 'fulfilled') {
        result.activityLogged = true
        console.log('✅ Pod activity logged successfully')
      } else {
        result.errors.push(`Activity logging failed: ${activityResult.reason}`)
        console.error('❌ Pod activity logging failed:', activityResult.reason)
      }

      // Handle analytics update result
      if (analyticsResult.status === 'fulfilled') {
        result.analyticsUpdated = true
        console.log('✅ Member analytics updated successfully')
      } else {
        result.errors.push(`Analytics update failed: ${analyticsResult.reason}`)
        console.error('❌ Member analytics update failed:', analyticsResult.reason)
      }

      // Handle achievement check result
      if (achievementResult.status === 'fulfilled') {
        result.achievementsEarned = achievementResult.value
        console.log('🏆 Achievement check completed:', result.achievementsEarned)
      } else {
        result.errors.push(`Achievement check failed: ${achievementResult.reason}`)
        console.error('❌ Achievement check failed:', achievementResult.reason)
      }

      // Update pod-level analytics
      await this.updatePodAnalytics(data.podId)

      console.log('🎉 Quiz-pod integration completed:', {
        activityLogged: result.activityLogged,
        analyticsUpdated: result.analyticsUpdated,
        achievementsCount: result.achievementsEarned.length,
        errorsCount: result.errors.length
      })

      return result

    } catch (error) {
      console.error('💥 Fatal error in quiz-pod integration:', error)
      result.errors.push(`Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Verify that the user is an active member of the pod
   */
  private async verifyPodMembership(userId: string, podId: string): Promise<boolean> {
    try {
      const { data: membership, error } = await this.supabase
        .from('pod_memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('pod_id', podId)
        .eq('membership_status', 'active')
        .single()

      if (error) {
        console.log('🔍 Pod membership verification failed:', error.message)
        return false
      }

      return !!membership
    } catch (error) {
      console.error('❌ Error verifying pod membership:', error)
      return false
    }
  }

  /**
   * Log the quiz completion as a pod activity
   */
  private async logPodActivity(data: QuizCompletionData): Promise<void> {
    const activityData = {
      quiz_topic: data.topicId,
      score: data.score,
      total_questions: data.totalQuestions,
      correct_answers: data.correctAnswers,
      time_spent_seconds: data.timeSpentSeconds,
      game_mode: data.gameMode || 'standard',
      session_id: data.sessionId,
      accuracy_percentage: Math.round((data.correctAnswers / data.totalQuestions) * 100),
      difficulty_level: data.difficultyLevel || 1,
      category: data.categorySlug || 'general'
    }

    // Use the database function to log activity (this handles RLS properly)
    const { error } = await this.supabase.rpc('log_pod_activity', {
      p_pod_id: data.podId,
      p_user_id: data.userId,
      p_activity_type: 'quiz_completed',
      p_activity_data: activityData
    })

    if (error) {
      throw new Error(`Failed to log pod activity: ${error.message}`)
    }
  }

  /**
   * Update member analytics with the quiz results
   */
  private async updateMemberAnalytics(data: QuizCompletionData): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    // Get current analytics or create new record
    const { data: currentAnalytics } = await this.supabase
      .from('pod_member_analytics')
      .select('*')
      .eq('user_id', data.userId)
      .eq('pod_id', data.podId)
      .eq('date_recorded', today)
      .single()

    const timeSpentMinutes = Math.round(data.timeSpentSeconds / 60)
    const accuracy = Math.round((data.correctAnswers / data.totalQuestions) * 100)

    if (currentAnalytics) {
      // Update existing analytics
      const updatedAnalytics = {
        questions_answered: (currentAnalytics.questions_answered || 0) + data.totalQuestions,
        quiz_attempts: (currentAnalytics.quiz_attempts || 0) + 1,
        correct_answers: (currentAnalytics.correct_answers || 0) + data.correctAnswers,
        time_spent_minutes: (currentAnalytics.time_spent_minutes || 0) + timeSpentMinutes,
        sessions_count: (currentAnalytics.sessions_count || 0) + 1,
        // Recalculate accuracy rate
        accuracy_rate: Math.round(
          ((currentAnalytics.correct_answers || 0) + data.correctAnswers) /
          ((currentAnalytics.questions_answered || 0) + data.totalQuestions) * 100
        )
      }

      const { error } = await this.supabase
        .from('pod_member_analytics')
        .update(updatedAnalytics)
        .eq('id', currentAnalytics.id)

      if (error) {
        throw new Error(`Failed to update member analytics: ${error.message}`)
      }
    } else {
      // Create new analytics record
      const newAnalytics = {
        user_id: data.userId,
        pod_id: data.podId,
        date_recorded: today,
        questions_answered: data.totalQuestions,
        quiz_attempts: 1,
        correct_answers: data.correctAnswers,
        accuracy_rate: accuracy,
        time_spent_minutes: timeSpentMinutes,
        current_streak: data.correctAnswers === data.totalQuestions ? 1 : 0,
        longest_streak: data.correctAnswers === data.totalQuestions ? 1 : 0,
        achievements_earned: 0,
        sessions_count: 1
      }

      const { error } = await this.supabase
        .from('pod_member_analytics')
        .insert(newAnalytics)

      if (error) {
        throw new Error(`Failed to create member analytics: ${error.message}`)
      }
    }
  }

  /**
   * Check for achievements and milestones based on the quiz performance
   */
  private async checkAchievements(data: QuizCompletionData): Promise<string[]> {
    const achievements: string[] = []

    try {
      // Get user's total stats in this pod
      const { data: memberStats } = await this.supabase
        .from('pod_member_analytics')
        .select('*')
        .eq('user_id', data.userId)
        .eq('pod_id', data.podId)
        .order('date_recorded', { ascending: false })
        .limit(30) // Last 30 days

      if (!memberStats || memberStats.length === 0) {
        return achievements
      }

      const totalQuestions = memberStats.reduce((sum: number, stat: any) => sum + (stat.questions_answered || 0), 0)
      const totalCorrect = memberStats.reduce((sum: number, stat: any) => sum + (stat.correct_answers || 0), 0)
      const totalAttempts = memberStats.reduce((sum: number, stat: any) => sum + (stat.quiz_attempts || 0), 0)
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

      // Check for milestone achievements
      if (totalQuestions >= 100 && !achievements.includes('century_learner')) {
        achievements.push('century_learner')
      }

      if (totalAttempts >= 50 && !achievements.includes('dedicated_learner')) {
        achievements.push('dedicated_learner')
      }

      if (overallAccuracy >= 90 && totalQuestions >= 20 && !achievements.includes('accuracy_expert')) {
        achievements.push('accuracy_expert')
      }

      // Perfect score achievement
      if (data.correctAnswers === data.totalQuestions && data.totalQuestions >= 5) {
        achievements.push('perfect_score')
      }

      // Speed achievement (less than 30 seconds per question on average)
      const avgTimePerQuestion = data.timeSpentSeconds / data.totalQuestions
      if (avgTimePerQuestion < 30 && data.correctAnswers >= data.totalQuestions * 0.8) {
        achievements.push('speed_learner')
      }

      console.log('🏆 Achievements earned:', achievements)
      return achievements

    } catch (error) {
      console.error('❌ Error checking achievements:', error)
      return []
    }
  }

  /**
   * Update pod-level analytics aggregating member performance
   */
  private async updatePodAnalytics(podId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get all member analytics for today
      const { data: memberAnalytics } = await this.supabase
        .from('pod_member_analytics')
        .select('*')
        .eq('pod_id', podId)
        .eq('date_recorded', today)

      if (!memberAnalytics || memberAnalytics.length === 0) {
        return
      }

      // Aggregate the analytics
      const totalQuestions = memberAnalytics.reduce((sum: number, m: any) => sum + (m.questions_answered || 0), 0)
      const totalCorrect = memberAnalytics.reduce((sum: number, m: any) => sum + (m.correct_answers || 0), 0)
      const totalTime = memberAnalytics.reduce((sum: number, m: any) => sum + (m.time_spent_minutes || 0), 0)
      const totalAttempts = memberAnalytics.reduce((sum: number, m: any) => sum + (m.quiz_attempts || 0), 0)
      const activeMembers = memberAnalytics.filter((m: any) => (m.quiz_attempts || 0) > 0).length
      const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

      const podAnalytics = {
        pod_id: podId,
        date_recorded: today,
        total_questions_answered: totalQuestions,
        total_quiz_attempts: totalAttempts,
        total_time_spent_minutes: totalTime,
        active_members_count: activeMembers,
        average_accuracy: avgAccuracy,
        total_correct_answers: totalCorrect
      }

      // Upsert pod analytics
      const { error } = await this.supabase
        .from('pod_analytics')
        .upsert(podAnalytics, {
          onConflict: 'pod_id,date_recorded'
        })

      if (error) {
        console.error('❌ Failed to update pod analytics:', error)
      } else {
        console.log('✅ Pod analytics updated successfully')
      }

    } catch (error) {
      console.error('❌ Error updating pod analytics:', error)
    }
  }

  /**
   * Get pod activity feed for real-time updates
   */
  async getPodActivityFeed(podId: string, limit = 20): Promise<any[]> {
    try {
      const { data: activities, error } = await this.supabase
        .from('pod_activity_log')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching pod activity feed:', error)
        return []
      }

      return activities || []
    } catch (error) {
      console.error('❌ Error in getPodActivityFeed:', error)
      return []
    }
  }

  /**
   * Get member analytics for a pod
   */
  async getMemberAnalytics(podId: string, userId?: string): Promise<MemberAnalytics[]> {
    try {
      let query = this.supabase
        .from('pod_member_analytics')
        .select('*')
        .eq('pod_id', podId)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: analytics, error } = await query
        .order('date_recorded', { ascending: false })

      if (error) {
        console.error('❌ Error fetching member analytics:', error)
        return []
      }

      return analytics || []
    } catch (error) {
      console.error('❌ Error in getMemberAnalytics:', error)
      return []
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper to extract pod ID from quiz context (search params, etc.)
 */
export function extractPodIdFromContext(searchParams: URLSearchParams | Record<string, any>): string | undefined {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get('podId') || undefined
  }
  return searchParams.podId
}

// Added for backward compatibility with older imports
export const extractPodIdFromQuizContext = extractPodIdFromContext

/**
 * Create a standardized QuizCompletionData object from quiz results
 */
export function createQuizCompletionData(
  userId: string,
  topicId: string,
  results: {
    score: number
    totalQuestions: number
    correctAnswers: number
    timeSpent: number
  },
  context: {
    podId?: string
    gameMode?: string
    sessionId?: string
    guestToken?: string
  } = {}
): QuizCompletionData {
  return {
    userId,
    topicId,
    score: results.score,
    totalQuestions: results.totalQuestions,
    correctAnswers: results.correctAnswers,
    timeSpentSeconds: Math.round(results.timeSpent),
    gameMode: context.gameMode || 'standard',
    sessionId: context.sessionId || `session_${Date.now()}`,
    guestToken: context.guestToken,
    podId: context.podId,
    difficultyLevel: 1, // Default difficulty
    categorySlug: 'general' // Default category
  }
}

/**
 * Check if quiz completion should trigger pod integration
 */
export function shouldProcessPodIntegration(
  podId: string | undefined,
  userId: string | undefined
): boolean {
  return !!(podId && userId && podId.trim() !== '' && userId.trim() !== '')
}

// ============================================================================
// API INTEGRATION FOR SERVER-SIDE USAGE
// ============================================================================

/**
 * Process quiz completion via API call (for server-side usage)
 */
export async function processQuizCompletionViaAPI(data: QuizCompletionData): Promise<PodActivityResult> {
  try {
    const response = await fetch('/api/learning-pods/quiz-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    const result = await response.json()
    return result.data || {
      activityLogged: false,
      analyticsUpdated: false,
      achievementsEarned: [],
      errors: ['API call succeeded but no data returned']
    }
  } catch (error) {
    console.error('❌ Error calling pod integration API:', error)
    return {
      activityLogged: false,
      analyticsUpdated: false,
      achievementsEarned: [],
      errors: [`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
} 