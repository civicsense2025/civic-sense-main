/**
 * ============================================================================
 * CIVICSENSE POD-QUIZ INTEGRATION SYSTEM (SERVER VERSION)
 * ============================================================================
 * 
 * Server-side version for use in API routes and server components.
 * This version uses server-side Supabase client with proper authentication.
 */

import { createClient } from '@/lib/supabase/server'
import type { QuizCompletionData, PodActivityResult, MemberAnalytics } from './pod-quiz-integration'

// ============================================================================
// SERVER-SIDE INTEGRATION CLASS
// ============================================================================

export class PodQuizIntegrationServer {
  /**
   * Main method to process quiz completion and update pod analytics (server-side)
   */
  static async processQuizCompletion(data: QuizCompletionData): Promise<PodActivityResult> {
    const result: PodActivityResult = {
      activityLogged: false,
      analyticsUpdated: false,
      achievementsEarned: [],
      errors: []
    }

    try {
      const supabase = await createClient()
      
      console.log('🎯 Server: Processing quiz completion for pod integration:', {
        userId: data.userId,
        podId: data.podId,
        topicId: data.topicId,
        score: data.score
      })

      // Skip if no pod is specified
      if (!data.podId) {
        console.log('📝 Server: No podId specified, skipping pod integration')
        return result
      }

      // Verify user is a member of the pod
      const isMember = await this.verifyPodMembership(supabase, data.userId, data.podId)
      if (!isMember) {
        result.errors.push('User is not a member of the specified pod')
        return result
      }

      // Process the integration steps in parallel for better performance
      const [activityResult, analyticsResult, achievementResult] = await Promise.allSettled([
        this.logPodActivity(supabase, data),
        this.updateMemberAnalytics(supabase, data),
        this.checkAchievements(supabase, data)
      ])

      // Handle activity logging result
      if (activityResult.status === 'fulfilled') {
        result.activityLogged = true
        console.log('✅ Server: Pod activity logged successfully')
      } else {
        result.errors.push(`Activity logging failed: ${activityResult.reason}`)
        console.error('❌ Server: Pod activity logging failed:', activityResult.reason)
      }

      // Handle analytics update result
      if (analyticsResult.status === 'fulfilled') {
        result.analyticsUpdated = true
        console.log('✅ Server: Member analytics updated successfully')
      } else {
        result.errors.push(`Analytics update failed: ${analyticsResult.reason}`)
        console.error('❌ Server: Member analytics update failed:', analyticsResult.reason)
      }

      // Handle achievement check result
      if (achievementResult.status === 'fulfilled') {
        result.achievementsEarned = achievementResult.value
        console.log('🏆 Server: Achievement check completed:', result.achievementsEarned)
      } else {
        result.errors.push(`Achievement check failed: ${achievementResult.reason}`)
        console.error('❌ Server: Achievement check failed:', achievementResult.reason)
      }

      // Update pod-level analytics
      await this.updatePodAnalytics(supabase, data.podId)

      console.log('🎉 Server: Quiz-pod integration completed:', {
        activityLogged: result.activityLogged,
        analyticsUpdated: result.analyticsUpdated,
        achievementsCount: result.achievementsEarned.length,
        errorsCount: result.errors.length
      })

      return result

    } catch (error) {
      console.error('💥 Server: Fatal error in quiz-pod integration:', error)
      result.errors.push(`Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Verify that the user is an active member of the pod
   */
  private static async verifyPodMembership(supabase: any, userId: string, podId: string): Promise<boolean> {
    try {
      const { data: membership, error } = await supabase
        .from('pod_memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('pod_id', podId)
        .eq('membership_status', 'active')
        .single()

      if (error) {
        console.log('🔍 Server: Pod membership verification failed:', error.message)
        return false
      }

      return !!membership
    } catch (error) {
      console.error('❌ Server: Error verifying pod membership:', error)
      return false
    }
  }

  /**
   * Log the quiz completion as a pod activity
   */
  private static async logPodActivity(supabase: any, data: QuizCompletionData): Promise<void> {
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
    const { error } = await supabase.rpc('log_pod_activity', {
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
  private static async updateMemberAnalytics(supabase: any, data: QuizCompletionData): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    // Get current analytics or create new record
    const { data: currentAnalytics } = await supabase
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

      const { error } = await supabase
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

      const { error } = await supabase
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
  private static async checkAchievements(supabase: any, data: QuizCompletionData): Promise<string[]> {
    const achievements: string[] = []

    try {
      // Get user's total stats in this pod
      const { data: memberStats } = await supabase
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

      console.log('🏆 Server: Achievements earned:', achievements)
      return achievements

    } catch (error) {
      console.error('❌ Server: Error checking achievements:', error)
      return []
    }
  }

  /**
   * Update pod-level analytics aggregating member performance
   */
  private static async updatePodAnalytics(supabase: any, podId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get all member analytics for today
      const { data: memberAnalytics } = await supabase
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
      const { error } = await supabase
        .from('pod_analytics')
        .upsert(podAnalytics, {
          onConflict: 'pod_id,date_recorded'
        })

      if (error) {
        console.error('❌ Server: Failed to update pod analytics:', error)
      } else {
        console.log('✅ Server: Pod analytics updated successfully')
      }

    } catch (error) {
      console.error('❌ Server: Error updating pod analytics:', error)
    }
  }
} 