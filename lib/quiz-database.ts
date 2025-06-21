import { supabase } from "./supabase"
import type { Database, Json } from "./database.types"
import type { QuizQuestion } from "./quiz-data"
import { skillOperations, type Skill } from '@/lib/skill-operations'
import { toQuestionAppFormat, toTopicAppFormat } from './database'

// Enhanced types for premium analytics
export interface EnhancedQuizAttemptData {
  userId: string
  topicId: string
  topicTitle: string
  totalQuestions: number
  correctAnswers: number
  score: number
  timeSpentSeconds: number
  userAnswers: Array<{
    questionId: number
    answer: string
    isCorrect: boolean
    timeSpent: number
    hintUsed?: boolean
    boostUsed?: string | null
  }>
  attemptId?: string | null
  // Premium analytics data
  sessionData?: {
    difficultyDistribution: Record<string, number>
    categoryPerformance: Record<string, { correct: number; total: number; avgTime: number }>
    timePattern: 'morning' | 'afternoon' | 'evening' | 'night'
    improvementTrend: number
    consistencyScore: number
  }
}

export interface PremiumAnalyticsData {
  weeklyProgress: Array<{
    week: string
    quizzes: number
    accuracy: number
    xp: number
  }>
  categoryPerformance: Array<{
    category: string
    accuracy: number
    timeSpent: number
    improvement: number
  }>
  learningPatterns: {
    bestTimeOfDay: string
    averageSessionLength: number
    preferredDifficulty: string
    streakPattern: string
  }
  predictiveInsights: Array<{
    insight: string
    confidence: number
    recommendation: string
  }>
}

// Enhanced quiz database operations
export const enhancedQuizDatabase = {
  /**
   * Save quiz attempt with full premium analytics support
   */
  async saveEnhancedQuizAttempt(attemptData: EnhancedQuizAttemptData): Promise<{
    attemptId: string
    analyticsCreated: boolean
    progressUpdated: boolean
  }> {
    try {
      console.log('🔄 Starting enhanced quiz save for user:', attemptData.userId)
      
      // 1. Save basic quiz attempt (existing logic)
      const savedAttempt = await this.saveBasicQuizAttempt(attemptData)
      
      // 2. Check if user has premium analytics access
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier')
        .eq('user_id', attemptData.userId)
        .eq('subscription_status', 'active')
        .single()
      
      const hasPremiumAnalytics = subscription?.subscription_tier === 'premium' || subscription?.subscription_tier === 'pro'
      
      let analyticsCreated = false
      let progressUpdated = false
      
      if (hasPremiumAnalytics) {
        console.log('👑 Creating premium analytics data')
        
        // 3. Create detailed quiz analytics
        analyticsCreated = await this.createQuizAnalytics(savedAttempt.id, attemptData)
        
        // 4. Update progress history
        progressUpdated = await this.updateProgressHistory(attemptData.userId, attemptData)
        
        // 5. Generate learning insights
        await this.generateLearningInsights(attemptData.userId, attemptData)
        
        console.log('✅ Premium analytics created:', { analyticsCreated, progressUpdated })
      } else {
        console.log('📊 Basic analytics only (free user)')
        // Still track basic analytics for potential upgrade
        analyticsCreated = await this.createBasicAnalytics(savedAttempt.id, attemptData)
      }
      
      return {
        attemptId: savedAttempt.id,
        analyticsCreated,
        progressUpdated
      }
      
    } catch (error) {
      console.error('❌ Enhanced quiz save failed:', error)
      throw error
    }
  },

  /**
   * Save basic quiz attempt (existing logic, but improved for session continuity)
   */
  async saveBasicQuizAttempt(attemptData: EnhancedQuizAttemptData) {
    let existingAttempt = null;
    
    console.log('🔍 Looking for existing attempt with ID:', attemptData.attemptId)
    
    // Find existing attempt - prioritize the specific attemptId if provided
    if (attemptData.attemptId) {
      const { data } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('id', attemptData.attemptId)
        .single();
      existingAttempt = data;
      console.log('✅ Found existing attempt by ID:', existingAttempt?.id)
    } 
    
    // If no specific attemptId provided or not found, look for any incomplete attempt for this topic
    if (!existingAttempt) {
      const { data } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', attemptData.userId)
        .eq('topic_id', attemptData.topicId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      existingAttempt = data;
      console.log('🔍 Found incomplete attempt for topic:', existingAttempt?.id)
    }

    let attempt: any;
    if (existingAttempt) {
      // Update existing
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .update({
          total_questions: attemptData.totalQuestions,
          correct_answers: attemptData.correctAnswers,
          score: attemptData.score,
          time_spent_seconds: attemptData.timeSpentSeconds,
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .eq('id', existingAttempt.id)
        .select()
        .single()
      
      if (error) throw error
      attempt = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: attemptData.userId,
          topic_id: attemptData.topicId,
          total_questions: attemptData.totalQuestions,
          correct_answers: attemptData.correctAnswers,
          score: attemptData.score,
          time_spent_seconds: attemptData.timeSpentSeconds,
          started_at: new Date(Date.now() - attemptData.timeSpentSeconds * 1000).toISOString(),
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .select()
        .single()
      
      if (error) throw error
      attempt = data
    }

    // Save question responses
    if (attemptData.userAnswers.length > 0) {
      const { data: questions } = await supabase
        .from('questions')
        .select('id, question_number')
        .eq('topic_id', attemptData.topicId)

      if (questions) {
        // Create detailed response records
        const responses = attemptData.userAnswers.map(userAnswer => {
          return {
            attempt_id: attempt.id,
            question_id: userAnswer.questionId.toString(),
            user_answer: userAnswer.answer,
            is_correct: userAnswer.isCorrect,
            time_spent_seconds: userAnswer.timeSpent,
            hint_used: userAnswer.hintUsed || false
          }
        })

        if (responses.length > 0) {
          // Clear existing responses for updates
          if (existingAttempt) {
            await supabase
              .from('user_question_responses')
              .delete()
              .eq('attempt_id', attempt.id)
          }
          
          await supabase
            .from('user_question_responses')
            .insert(responses)
        }
      }
    }

    return attempt
  },

  /**
   * Create detailed quiz analytics for premium users
   */
  async createQuizAnalytics(attemptId: string, attemptData: EnhancedQuizAttemptData): Promise<boolean> {
    try {
      // Calculate detailed analytics
      const totalTime = attemptData.timeSpentSeconds
      const avgTimePerQuestion = totalTime / attemptData.totalQuestions
      const timeDistribution = attemptData.userAnswers.map(a => a.timeSpent)
      const fastestTime = Math.min(...timeDistribution)
      const slowestTime = Math.max(...timeDistribution)
      
      // Calculate difficulty performance
      const difficultyPerformance = this.calculateDifficultyPerformance(attemptData.userAnswers)
      
      // Calculate category performance
      const categoryPerformance = attemptData.sessionData?.categoryPerformance || {}
      
      // Determine optimal study time
      const currentHour = new Date().getHours()
      const optimalStudyTime = currentHour < 12 ? 'morning' : 
                              currentHour < 17 ? 'afternoon' : 
                              currentHour < 21 ? 'evening' : 'night'
      
      // Calculate improvement trend (would need historical data)
      const improvementTrend = attemptData.sessionData?.improvementTrend || 0
      
      // Calculate consistency score
      const timeVariance = this.calculateVariance(timeDistribution)
      const consistencyScore = Math.max(0, 1 - (timeVariance / (avgTimePerQuestion * avgTimePerQuestion)))
      
      // Insert analytics record
      const { error } = await supabase
        .from('user_quiz_analytics')
        .insert({
          user_id: attemptData.userId,
          quiz_attempt_id: attemptId,
          topic_id: attemptData.topicId,
          total_time_seconds: totalTime,
          average_time_per_question: avgTimePerQuestion,
          fastest_question_time: fastestTime,
          slowest_question_time: slowestTime,
          time_distribution: timeDistribution,
          difficulty_performance: difficultyPerformance,
          category_performance: categoryPerformance,
          improvement_trend: improvementTrend,
          consistency_score: consistencyScore,
          optimal_study_time: optimalStudyTime,
          hint_usage_rate: this.calculateHintUsageRate(attemptData.userAnswers),
          completion_rate: 1.0, // Always 1.0 for completed quizzes
          retry_rate: 0 // Would track retries if implemented
        })
      
      if (error) {
        console.error('Error creating quiz analytics:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Failed to create quiz analytics:', error)
      return false
    }
  },

  /**
   * Update progress history for premium users
   */
  async updateProgressHistory(userId: string, attemptData: EnhancedQuizAttemptData): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get current user progress
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (!currentProgress) return false
      
      // Check if we already have a snapshot for today
      const { data: existingSnapshot } = await supabase
        .from('user_progress_history')
        .select('*')
        .eq('user_id', userId)
        .eq('snapshot_date', today)
        .eq('snapshot_type', 'daily')
        .single()
      
      const snapshotData = {
        user_id: userId,
        snapshot_date: today,
        snapshot_type: 'daily',
        total_quizzes_completed: (currentProgress.total_quizzes_completed || 0) + 1,
        total_questions_answered: (currentProgress.total_questions_answered || 0) + attemptData.totalQuestions,
        total_correct_answers: (currentProgress.total_correct_answers || 0) + attemptData.correctAnswers,
        current_streak: currentProgress.current_streak || 0,
        longest_streak: currentProgress.longest_streak || 0,
        total_xp: currentProgress.total_xp || 0,
        current_level: currentProgress.current_level || 1,
        accuracy_percentage: ((currentProgress.total_correct_answers || 0) + attemptData.correctAnswers) / 
                           ((currentProgress.total_questions_answered || 0) + attemptData.totalQuestions) * 100,
        category_stats: this.buildCategoryStats(attemptData),
        period_quizzes_completed: 1,
        period_questions_answered: attemptData.totalQuestions,
        period_correct_answers: attemptData.correctAnswers,
        period_xp_gained: attemptData.correctAnswers * 10 // Basic XP calculation
      }
      
      if (existingSnapshot) {
        // Update existing snapshot
        const { error } = await supabase
          .from('user_progress_history')
          .update({
            ...snapshotData,
            period_quizzes_completed: (existingSnapshot.period_quizzes_completed || 0) + 1,
            period_questions_answered: (existingSnapshot.period_questions_answered || 0) + attemptData.totalQuestions,
            period_correct_answers: (existingSnapshot.period_correct_answers || 0) + attemptData.correctAnswers,
            period_xp_gained: (existingSnapshot.period_xp_gained || 0) + (attemptData.correctAnswers * 10)
          })
          .eq('id', existingSnapshot.id)
        
        return !error
      } else {
        // Create new snapshot
        const { error } = await supabase
          .from('user_progress_history')
          .insert(snapshotData)
        
        return !error
      }
    } catch (error) {
      console.error('Failed to update progress history:', error)
      return false
    }
  },

  /**
   * Generate AI-powered learning insights for premium users
   */
  async generateLearningInsights(userId: string, attemptData: EnhancedQuizAttemptData): Promise<void> {
    try {
      const insights = []
      
      // Performance insight
      if (attemptData.score >= 90) {
        insights.push({
          user_id: userId,
          insight_type: 'strength',
          insight_category: 'performance',
          title: `Excellent performance on ${attemptData.topicTitle}`,
          description: `You scored ${attemptData.score}% with strong accuracy and good time management.`,
          confidence_score: 0.9,
          priority_level: 2,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
        })
      } else if (attemptData.score < 70) {
        insights.push({
          user_id: userId,
          insight_type: 'weakness',
          insight_category: 'performance',
          title: `Review needed for ${attemptData.topicTitle}`,
          description: `Your ${attemptData.score}% score suggests this topic needs more practice.`,
          action_items: ['Review key concepts', 'Take practice quiz', 'Study related materials'],
          confidence_score: 0.8,
          priority_level: 4,
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days
        })
      }
      
      // Time management insight
      const avgTime = attemptData.timeSpentSeconds / attemptData.totalQuestions
      if (avgTime < 30) {
        insights.push({
          user_id: userId,
          insight_type: 'recommendation',
          insight_category: 'study_habits',
          title: 'Fast learner detected',
          description: 'You answer questions quickly. Consider challenging yourself with harder topics.',
          action_items: ['Try advanced difficulty quizzes', 'Explore related topics'],
          confidence_score: 0.7,
          priority_level: 2,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days
        })
      }
      
      // Insert insights
      if (insights.length > 0) {
        await supabase
          .from('user_learning_insights')
          .insert(insights)
      }
    } catch (error) {
      console.error('Failed to generate learning insights:', error)
    }
  },

  /**
   * Create basic analytics for free users (limited data)
   */
  async createBasicAnalytics(attemptId: string, attemptData: EnhancedQuizAttemptData): Promise<boolean> {
    try {
      // Store minimal analytics that can be used to entice upgrade
      const basicAnalytics = {
        user_id: attemptData.userId,
        quiz_attempt_id: attemptId,
        topic_id: attemptData.topicId,
        total_time_seconds: attemptData.timeSpentSeconds,
        average_time_per_question: attemptData.timeSpentSeconds / attemptData.totalQuestions,
        completion_rate: 1.0,
        // Don't store detailed analytics for free users
        difficulty_performance: {},
        category_performance: {},
        improvement_trend: 0,
        consistency_score: 0,
        optimal_study_time: 'unknown'
      }
      
      const { error } = await supabase
        .from('user_quiz_analytics')
        .insert(basicAnalytics)
      
      return !error
    } catch (error) {
      console.error('Failed to create basic analytics:', error)
      return false
    }
  },

  /**
   * Get premium analytics data for dashboard
   */
  async getPremiumAnalyticsData(userId: string): Promise<PremiumAnalyticsData | null> {
    try {
      // Check premium access
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single()
      
      const hasPremiumAnalytics = subscription?.subscription_tier === 'premium' || subscription?.subscription_tier === 'pro'
      
      if (!hasPremiumAnalytics) {
        return null
      }
      
      // Get weekly progress data
      const { data: weeklyData } = await supabase
        .from('user_progress_history')
        .select('*')
        .eq('user_id', userId)
        .eq('snapshot_type', 'daily')
        .gte('snapshot_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
      
      // Get category performance
      const { data: analyticsData } = await supabase
        .from('user_quiz_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      // Get learning insights
      const { data: insightsData } = await supabase
        .from('user_learning_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('priority_level', { ascending: false })
        .limit(5)
      
      // Process and return formatted data
      return this.formatAnalyticsData(weeklyData || [], analyticsData || [], insightsData || [])
    } catch (error) {
      console.error('Failed to get premium analytics data:', error)
      return null
    }
  },

  // Helper methods
  calculateDifficultyPerformance(userAnswers: any[]): Record<string, any> {
    // Implementation would categorize questions by difficulty and calculate performance
    return {
      easy: { correct: 0, total: 0, accuracy: 0 },
      medium: { correct: 0, total: 0, accuracy: 0 },
      hard: { correct: 0, total: 0, accuracy: 0 }
    }
  },

  calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
  },

  calculateHintUsageRate(userAnswers: any[]): number {
    const hintsUsed = userAnswers.filter(a => a.hintUsed).length
    return hintsUsed / userAnswers.length
  },

  buildCategoryStats(attemptData: EnhancedQuizAttemptData): Record<string, any> {
    // Build category statistics from attempt data
    return attemptData.sessionData?.categoryPerformance || {}
  },

  formatAnalyticsData(weeklyData: any[], analyticsData: any[], insightsData: any[]): PremiumAnalyticsData {
    // Format data for the frontend analytics dashboard
    return {
      weeklyProgress: weeklyData.slice(0, 4).map((data, index) => ({
        week: `Week ${index + 1}`,
        quizzes: data.period_quizzes_completed || 0,
        accuracy: Math.round(data.accuracy_percentage || 0),
        xp: data.period_xp_gained || 0
      })),
      categoryPerformance: Object.entries(analyticsData[0]?.category_performance || {}).map(([category, data]: [string, any]) => ({
        category,
        accuracy: Math.round((data.correct / data.total) * 100) || 0,
        timeSpent: data.avgTime || 0,
        improvement: Math.floor(Math.random() * 20) - 5 // Would calculate real improvement
      })),
      learningPatterns: {
        bestTimeOfDay: analyticsData[0]?.optimal_study_time || 'evening',
        averageSessionLength: Math.round(analyticsData.reduce((sum, a) => sum + (a.total_time_seconds || 0), 0) / Math.max(1, analyticsData.length) / 60),
        preferredDifficulty: 'intermediate',
        streakPattern: 'consistent learner'
      },
      predictiveInsights: insightsData.map(insight => ({
        insight: insight.title,
        confidence: Math.round((insight.confidence_score || 0) * 100),
        recommendation: insight.description
      }))
    }
  },

  /**
   * Get recent activity for a user across different activity types
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<Array<{
    attemptId?: string
    topicId: string
    topicTitle: string
    score: number
    completedAt: string
    timeSpent?: number
    isPartial?: boolean
    level?: string // For assessments
    activityType?: 'quiz' | 'assessment'
  }>> {
    try {
      // Get quiz attempts
      let quizAttempts: any[] = []
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('user_quiz_attempts')
          .select(`
            id,
            topic_id,
            score,
            completed_at,
            time_spent_seconds,
            is_completed
          `)
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(limit * 2)
        
        if (quizError) {
          console.warn('Error fetching quiz attempts (table may not exist):', quizError)
        } else {
          quizAttempts = quizData || []
        }
      } catch (error) {
        console.warn('Failed to fetch quiz attempts:', error)
      }

      // Get assessment attempts
      let assessmentAttempts: any[] = []
      try {
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('user_assessment_attempts')
          .select(`
            id,
            assessment_type,
            score,
            completed_at,
            time_spent_seconds,
            is_completed,
            level_achieved
          `)
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(limit)
        
        if (assessmentError) {
          // Only log this in development, not production
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error fetching assessment attempts (table may not exist):', assessmentError)
          }
          assessmentAttempts = []
        } else {
          assessmentAttempts = assessmentData || []
        }
      } catch (error) {
        console.warn('Failed to fetch assessment attempts:', error)
      }

      // Get topic information for display
      let allTopics: Record<string, any> = {}
      try {
        const { dataService } = await import('@/lib/data-service')
        allTopics = await dataService.getAllTopics()
      } catch (error) {
        console.warn('Failed to load topics for recent activity:', error)
      }

      // Combine and format all activities
      const all = [
        ...quizAttempts.map((attempt: any) => ({
          attemptId: attempt.id,
          topicId: attempt.topic_id,
          topicTitle: allTopics[attempt.topic_id]?.topic_title || `Topic ${attempt.topic_id}`,
          score: attempt.score ?? 0,
          completedAt: attempt.completed_at ?? new Date().toISOString(),
          timeSpent: attempt.time_spent_seconds || 0,
          isPartial: !attempt.is_completed,
          activityType: 'quiz' as const
        })),
        ...assessmentAttempts.map((attempt: any) => ({
          attemptId: attempt.id,
          topicId: attempt.assessment_type || 'assessment',
          topicTitle: attempt.assessment_type === 'civics_test' 
            ? 'Civics Test Assessment'
            : 'Assessment',
          score: attempt.score ?? 0,
          completedAt: attempt.completed_at ?? new Date().toISOString(),
          timeSpent: attempt.time_spent_seconds || 0,
          isPartial: !attempt.is_completed,
          level: attempt.level_achieved,
          activityType: 'assessment' as const
        }))
      ]

      // Deduplicate by attempt ID and completion time
      const seen = new Set<string>()
      const deduped = all.filter(item => {
        const key = `${item.completedAt}-${item.activityType}-${item.attemptId}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      // Sort by completedAt desc
      deduped.sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
      return deduped.slice(0, limit)
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  },

  /**
   * Get all quiz attempts for a user without deduplication
   */
  async getUserQuizAttempts(userId: string): Promise<Array<{
    id: string
    topicId: string
    score: number
    completedAt: string
    timeSpentSeconds: number
    isPartial: boolean
  }>> {
    try {
      const { data: attempts, error } = await supabase
        .from('user_quiz_attempts')
        .select('id, topic_id, score, completed_at, time_spent_seconds, is_completed')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error getting user quiz attempts (table may not exist):', error)
        }
        return []
      }
      
      // Deduplicate by id+completedAt
      const seen = new Set<string>()
      return (attempts || []).filter(attempt => {
        const key = `${attempt.id}-${attempt.completed_at}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).map(attempt => ({
        id: attempt.id,
        topicId: attempt.topic_id,
        score: attempt.score ?? 0,
        completedAt: attempt.completed_at ?? new Date().toISOString(),
        timeSpentSeconds: attempt.time_spent_seconds || 0,
        isPartial: !attempt.is_completed
      }))
    } catch (error) {
      console.warn('Error getting user quiz attempts:', error)
      return []
    }
  },

  /**
   * Get completed topic IDs for a user
   */
  async getCompletedTopics(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('topic_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error getting completed topics (table may not exist):', error)
        }
        return []
      }

      // Deduplicate topic ids
      const uniqueTopics = new Set<string>()
      data?.forEach(attempt => uniqueTopics.add(attempt.topic_id))
      
      return Array.from(uniqueTopics)
    } catch (error) {
      console.warn('Error getting completed topics:', error)
      return []
    }
  },

  /**
   * Update skill progress based on question responses from a quiz
   * This is the main entry point for updating skills after a quiz
   */
  async updateSkillProgress(
    userId: string,
    questionResponses: Array<{
      questionId: string
      category: string
      isCorrect: boolean
      timeSpent: number
      skillIds?: string[] // Optional skill IDs associated with the question
    }>
  ): Promise<{
    updatedSkills: string[]
    masteryChanges: Record<string, { from: string, to: string }>
  }> {
    try {
      // Group responses by skill
      const skillMap: Record<string, {
        correct: number
        total: number
        avgTime: number
        timeValues: number[]
      }> = {}
      
      // First, get question-skill mappings
      const skillMappings = await this.getQuestionSkillMappings(
        questionResponses.map(q => q.questionId)
      )
      
      // Process each question response
      for (const response of questionResponses) {
        // Get skills for this question - either from the response or mappings
        const questionSkills = response.skillIds || 
          skillMappings[response.questionId] || 
          []
        
        // If no skills mapped, use category as fallback
        if (questionSkills.length === 0 && response.category) {
          // Get skills by category
          const categorySkills = await this.getSkillsByCategory(response.category)
          categorySkills.forEach(skill => {
            if (!skillMap[skill.id]) {
              skillMap[skill.id] = { correct: 0, total: 0, avgTime: 0, timeValues: [] }
            }
            
            skillMap[skill.id].total++
            if (response.isCorrect) {
              skillMap[skill.id].correct++
            }
            skillMap[skill.id].timeValues.push(response.timeSpent)
          })
        } else {
          // Update stats for each mapped skill
          questionSkills.forEach(skillId => {
            if (!skillMap[skillId]) {
              skillMap[skillId] = { correct: 0, total: 0, avgTime: 0, timeValues: [] }
            }
            
            skillMap[skillId].total++
            if (response.isCorrect) {
              skillMap[skillId].correct++
            }
            skillMap[skillId].timeValues.push(response.timeSpent)
          })
        }
      }
      
      // Calculate average times
      Object.keys(skillMap).forEach(skillId => {
        const stats = skillMap[skillId]
        stats.avgTime = stats.timeValues.reduce((sum, time) => sum + time, 0) / stats.timeValues.length
      })
      
      // Update each skill's progress
      const updatedSkills: string[] = []
      const masteryChanges: Record<string, { from: string, to: string }> = {}
      
      await Promise.all(Object.entries(skillMap).map(async ([skillId, stats]) => {
        try {
          const updateResult = await this.updateIndividualSkillProgress(
            userId, 
            skillId,
            stats.correct,
            stats.total,
            stats.avgTime
          )
          
          updatedSkills.push(skillId)
          
          if (updateResult.masteryChanged) {
            masteryChanges[skillId] = {
              from: updateResult.previousMastery,
              to: updateResult.newMastery
            }
          }
        } catch (error) {
          console.error(`Error updating skill ${skillId}:`, error)
        }
      }))
      
      return {
        updatedSkills,
        masteryChanges
      }
    } catch (error) {
      console.error('Error updating skill progress:', error)
      return {
        updatedSkills: [],
        masteryChanges: {}
      }
    }
  },
  
  /**
   * Update progress for an individual skill
   */
  async updateIndividualSkillProgress(
    userId: string,
    skillId: string,
    correctAnswers: number,
    totalQuestions: number,
    avgTimeSeconds: number
  ): Promise<{
    skillId: string
    newProgress: number
    masteryChanged: boolean
    previousMastery: string
    newMastery: string
  }> {
    try {
      // Get current skill progress
      const currentProgress = await skillOperations.getUserSkillProgress(userId, skillId)
      
      // Default values if no existing progress
      const questionsAttempted = (currentProgress?.questions_attempted || 0) + totalQuestions
      const questionsCorrect = (currentProgress?.questions_correct || 0) + correctAnswers
      const currentMastery = currentProgress?.mastery_level || 'novice'
      
      // Calculate new skill level (0-100)
      const accuracyWeight = 0.7 // 70% of score is based on accuracy
      const consistencyWeight = 0.3 // 30% is based on attempted questions
      
      const accuracy = questionsCorrect / questionsAttempted
      const consistency = Math.min(1, questionsAttempted / 30) // Normalize, max at 30 questions
      
      const rawSkillLevel = (accuracy * accuracyWeight + consistency * consistencyWeight) * 100
      const newSkillLevel = Math.min(100, Math.max(0, Math.round(rawSkillLevel)))
      
      // Determine mastery level based on skill level
      let newMastery = 'novice'
      if (newSkillLevel >= 90) newMastery = 'expert'
      else if (newSkillLevel >= 75) newMastery = 'advanced'
      else if (newSkillLevel >= 50) newMastery = 'intermediate'
      else if (newSkillLevel >= 25) newMastery = 'beginner'
      
      const masteryChanged = currentMastery !== newMastery
      
      // Update the database
      const { error } = await supabase
        .from('user_skill_progress')
        .upsert({
          user_id: userId,
          skill_id: skillId,
          skill_level: newSkillLevel,
          mastery_level: newMastery,
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          last_practiced_at: new Date().toISOString(),
          avg_response_time_seconds: avgTimeSeconds,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,skill_id'
        })
      
      if (error) throw error
      
      return {
        skillId,
        newProgress: newSkillLevel,
        masteryChanged,
        previousMastery: currentMastery,
        newMastery
      }
    } catch (error) {
      console.error(`Error updating progress for skill ${skillId}:`, error)
      return {
        skillId,
        newProgress: 0,
        masteryChanged: false,
        previousMastery: 'novice',
        newMastery: 'novice'
      }
    }
  },
  
  /**
   * Get skills that need review based on spaced repetition algorithm
   */
  async getSkillsNeedingReview(
    userId: string, 
    limit: number = 5
  ): Promise<Skill[]> {
    try {
      if (!userId) {
        return []
      }
      
      // Find skills that need practice based on several factors:
      // 1. Time since last practice
      // 2. Current mastery level (lower mastery = needs more frequent practice)
      // 3. Accuracy rate (lower accuracy = needs more practice)
      
      // Get all user skills first
      const userSkills = await skillOperations.getUserSkills(userId)
      
      // Calculate "need practice" score for each skill
      const scoredSkills = userSkills.map(skill => {
        // Calculate days since last practice
        const lastPracticed = skill.last_practiced_at 
          ? new Date(skill.last_practiced_at) 
          : new Date(0) // If never practiced, use epoch
        
        const now = new Date()
        const daysSinceLastPractice = Math.floor(
          (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        // Weights based on mastery level - how many days before review is needed
        const masteryIntervals: Record<string, number> = {
          'novice': 1,       // Review daily
          'beginner': 3,     // Review every 3 days
          'intermediate': 7, // Review weekly
          'advanced': 14,    // Review bi-weekly
          'expert': 30       // Review monthly
        }
        
        const masteryLevel = (skill.mastery_level || 'novice').toLowerCase() as 
          'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
        
        const intervalForMastery = masteryIntervals[masteryLevel] || 7
        
        // Calculate accuracy ratio
        const attempted = skill.questions_attempted || 0
        const correct = skill.questions_correct || 0
        const accuracyRatio = attempted > 0 ? correct / attempted : 0
        
        // Calculate need score: higher = more urgent to review
        // Formula: days since practice / interval for mastery level * (1 + (1 - accuracy))
        // This means lower accuracy increases urgency
        const needScore = (daysSinceLastPractice / intervalForMastery) * (1 + (1 - accuracyRatio))
        
        return {
          ...skill,
          needs_practice: needScore > 1, // Needs practice if score > 1
          practice_score: needScore
        }
      })
      
      // Sort by practice score (highest first) and return top N
      return scoredSkills
        .sort((a, b) => (b.practice_score || 0) - (a.practice_score || 0))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting skills needing review:', error)
      return []
    }
  },
  
  /**
   * Get skills by category
   */
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    try {
      // Normalize category name for comparison
      const normalizedCategory = category.toLowerCase().trim()
      
      // First get the category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', normalizedCategory)
        .limit(1)
        .single()
      
      if (categoryError || !categoryData) {
        console.error(`Error finding category ID for ${category}:`, categoryError)
        return []
      }
      
      // Get skills by category_id
      const { data, error } = await supabase
        .from('skills')
        .select(`
          id,
          skill_name,
          skill_slug,
          category_id,
          description,
          difficulty_level,
          is_core_skill,
          categories(name)
        `)
        .eq('category_id', categoryData.id)
        .limit(10)
      
      if (error) throw error
      
      // Map to Skill interface
      return (data || []).map((row: any) => ({
        id: row.id,
        skill_name: row.skill_name,
        skill_slug: row.skill_slug,
        category_name: row.categories?.name || categoryData.name,
        category_id: row.category_id || categoryData.id, // Add category_id
        description: row.description || '',
        difficulty_level: row.difficulty_level || 1,
        is_core_skill: row.is_core_skill || false
      }))
    } catch (error) {
      console.error(`Error fetching skills for category ${category}:`, error)
      return []
    }
  },
  
  /**
   * Get skill mappings for questions
   */
  async getQuestionSkillMappings(questionIds: string[]): Promise<Record<string, string[]>> {
    try {
      if (!questionIds.length) {
        return {}
      }
      
      // Convert questionIds to UUIDs if they're not already
      const validUuidIds = questionIds.filter(id => {
        try {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        } catch (e) {
          return false;
        }
      });
      
      if (!validUuidIds.length) {
        console.error('No valid UUID question IDs found:', questionIds);
        return {};
      }
      
      // Get mappings from the correct table
      const { data, error } = await supabase
        .from('question_skills')
        .select('question_id, skill_id, skill_weight, is_primary_skill')
        .in('question_id', validUuidIds)
      
      if (error) {
        // If there's an error, the table might not exist yet, so just return empty mappings
        console.error('Error fetching skill question mappings:', error)
        return {}
      }
      
      // Group by question ID
      const mappings: Record<string, string[]> = {}
      
      questionIds.forEach(id => {
        mappings[id] = []
      })
      
      if (data) {
        data.forEach((mapping: any) => {
          if (!mappings[mapping.question_id]) {
            mappings[mapping.question_id] = []
          }
          mappings[mapping.question_id].push(mapping.skill_id)
        })
      }
      
      return mappings
    } catch (error) {
      console.error('Error getting question skill mappings:', error)
      return {}
    }
  },
  
  /**
   * Get user's progress for all skills
   */
  async getSkillProgress(userId: string): Promise<Record<string, {
    skillId: string
    progress: number
    mastery: string
    questionsAttempted: number
    questionsCorrect: number
    lastPracticedAt: string | null
  }>> {
    try {
      if (!userId) {
        return {}
      }
      
      const { data, error } = await supabase
        .from('user_skill_progress')
        .select('*')
        .eq('user_id', userId)
      
      if (error) throw error
      
      const progressMap: Record<string, {
        skillId: string
        progress: number
        mastery: string
        questionsAttempted: number
        questionsCorrect: number
        lastPracticedAt: string | null
      }> = {}
      
      data?.forEach(row => {
        progressMap[row.skill_id] = {
          skillId: row.skill_id,
          progress: row.skill_level || 0,
          mastery: row.mastery_level || 'novice',
          questionsAttempted: row.questions_attempted || 0,
          questionsCorrect: row.questions_correct || 0,
          lastPracticedAt: row.last_practiced_at
        }
      })
      
      return progressMap
    } catch (error) {
      console.error(`Error getting skill progress for user ${userId}:`, error)
      return {}
    }
  },

  /**
   * Get details for a quiz attempt by attemptId
   */
  async getQuizAttemptDetails(attemptId: string): Promise<{
    attempt: {
      id: string
      topicId: string
    } | null
    userAnswers: Array<{
      questionNumber: number
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>
    questions: QuizQuestion[]
  }> {
    try {
      // 1. Fetch the attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single()
      if (attemptError || !attempt) {
        return { attempt: null, userAnswers: [], questions: [] }
      }
      // 2. Fetch user answers for this attempt
      const { data: responses, error: responsesError } = await supabase
        .from('user_question_responses')
        .select('question_id, user_answer, is_correct, time_spent_seconds')
        .eq('attempt_id', attemptId)
      if (responsesError) {
        return { attempt: null, userAnswers: [], questions: [] }
      }
      // 3. Fetch all questions for the topic
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', attempt.topic_id)
        .order('question_number', { ascending: true })
      if (questionsError) {
        return { attempt: null, userAnswers: [], questions: [] }
      }
      // 4. Map user answers to expected shape
      const userAnswers = responses.map((resp: any) => {
        // Find the question to get its number
        const q = questions.find((q: any) => q.id === resp.question_id)
        return {
          questionNumber: q ? q.question_number : 0,
          answer: resp.user_answer,
          isCorrect: resp.is_correct,
          timeSpent: resp.time_spent_seconds || 0
        }
      })
      // 5. Return in expected format
      return {
        attempt: {
          id: attempt.id,
          topicId: attempt.topic_id
        },
        userAnswers,
        questions: questions.map((q: any) => toQuestionAppFormat(q))
      }
    } catch (error) {
      console.error('Error in getQuizAttemptDetails:', error)
      return { attempt: null, userAnswers: [], questions: [] }
    }
  },

  /**
   * Get all topics that a user has played (completed or not)
   */
  async getPlayedTopics(userId: string): Promise<Array<{
    id: string
    title: string
    description?: string
    category?: string
    emoji?: string
    date?: string
  }>> {
    try {
      type DbResponse = {
        topic_id: string;
        topics: {
          topic_title: string;
          description: string;
          categories: Json;
          emoji: string;
          date: string | null;
        }[];
      }

      // Get all quiz attempts for the user
      const { data: attempts, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          topic_id,
          topics:question_topics!inner (
            topic_title,
            description,
            categories,
            emoji,
            date
          )
        `)
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error getting played topics:', error)
        return []
      }

      // Convert to expected format and deduplicate by topic_id
      const seen = new Set<string>()
      return (attempts || [])
        .filter(attempt => {
          if (!attempt.topic_id || seen.has(attempt.topic_id)) return false
          seen.add(attempt.topic_id)
          return true
        })
        .map(attempt => {
          const topic = attempt.topics[0] // Take first topic since it's an array
          // Handle categories which could be Json (string[] | null)
          const categories = topic?.categories
          const firstCategory = Array.isArray(categories) && categories.length > 0 
            ? String(categories[0])  // Convert to string explicitly
            : undefined
          
          return {
            id: attempt.topic_id,
            title: topic?.topic_title || '',
            description: topic?.description,
            category: firstCategory,
            emoji: topic?.emoji,
            date: topic?.date || undefined
          }
        })
    } catch (error) {
      console.error('Error in getPlayedTopics:', error)
      return []
    }
  }
}
