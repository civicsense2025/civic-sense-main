/**
 * ============================================================================
 * MOBILE ANALYTICS SERVICE - SCHEMA ALIGNED VERSION
 * ============================================================================
 * Processes user_question_responses and quiz attempt data to generate
 * comprehensive learning insights for the mobile app
 */

import { supabase } from './supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionResponse {
  id: string
  user_id?: string
  attempt_id: string
  question_id: string
  user_answer: string
  selected_answer?: string
  is_correct: boolean
  time_spent_seconds?: number
  response_time_ms?: number
  hint_used?: boolean
  assessment_type?: string
  topic_id?: string
  confidence_level?: number
  was_review?: boolean
  created_at: string
  // Joined data
  question?: {
    id: string
    question_content?: string
    question_text?: string
    question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'ordering'
    difficulty_level?: number
    category?: string
    topic_id?: string
  }
}

export interface QuizAttempt {
  id: string
  user_id?: string
  topic_id?: string
  session_id?: string
  score?: number
  total_questions?: number
  completed_at?: string
  time_spent?: number
  game_mode?: string
  platform?: string
}

export interface TopicPerformance {
  topicId: string
  topicName: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  averageTime: number
  difficultyDistribution: { [key: string]: number }
  lastAttempt: string
  streak: number
  masteryLevel: number
  needsReview: boolean
}

export interface LearningInsights {
  overallPerformance: {
    totalQuizzes: number
    averageScore: number
    totalTimeSpent: number
    questionsAnswered: number
    correctAnswers: number
    currentStreak: number
    longestStreak: number
  }
  topicPerformance: TopicPerformance[]
  recentActivity: {
    date: string
    activity: string
    performance: number
  }[]
  recommendations: {
    type: 'review' | 'practice' | 'advance'
    topicId: string
    topicName: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }[]
  learningTrends: {
    improvementAreas: string[]
    strengthAreas: string[]
    optimalStudyTime: string
    consistencyScore: number
  }
  nextSteps: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

export interface RealTimeLearningUpdate {
  newResponses: QuestionResponse[]
  quickInsights: {
    recentAccuracy: number
    avgResponseTime: number
    strugglingAreas: string[]
    improvementSuggestion: string
  }
  lastUpdateId?: string | undefined
}

// ============================================================================
// MOBILE ANALYTICS SERVICE
// ============================================================================

export class MobileAnalyticsService {
  /**
   * Get comprehensive learning insights for a user
   */
  static async getLearningInsights(
    userId: string,
    topicId?: string,
    sessionContext?: any
  ): Promise<LearningInsights> {
    try {
      console.log('📊 Analytics: Generating learning insights for user:', userId, 
        topicId ? `(topic: ${topicId})` : '(all topics)');

      // Get user's question responses with proper error handling
      const responses = await this.getUserQuestionResponses(userId, topicId);
      const attempts = await this.getUserQuizAttempts(userId, topicId);

      console.log(`📊 Analytics: Found ${responses.length} responses and ${attempts.length} attempts`);

      // Generate insights based on available data
      const insights = await this.generateInsights(responses, attempts, sessionContext);

      // If we have session context, enhance insights with current quiz context
      if (sessionContext) {
        insights.recentActivity.unshift({
          date: new Date().toISOString(),
          activity: `Completed ${sessionContext.topicTitle || 'Quiz'}`,
          performance: sessionContext.score || 0
        });
      }

      console.log('✅ Analytics: Generated learning insights:', {
        totalResponses: responses.length,
        topicPerformanceCount: insights.topicPerformance.length,
        recommendationsCount: insights.recommendations.length
      });

      return insights;
    } catch (error) {
      console.error('❌ Analytics: Error generating learning insights:', error);
      
      // Return default insights on error to prevent app breaking
      return this.getDefaultInsights(sessionContext);
    }
  }

  /**
   * Get user's question responses with joined question data (schema-aware)
   */
  private static async getUserQuestionResponses(
    userId: string, 
    topicId?: string
  ): Promise<QuestionResponse[]> {
    try {
      let query = supabase
        .from('user_question_responses')
        .select(`
          id,
          user_id,
          attempt_id,
          question_id,
          user_answer,
          selected_answer,
          is_correct,
          time_spent_seconds,
          response_time_ms,
          hint_used,
          assessment_type,
          topic_id,
          confidence_level,
          was_review,
          created_at,
          questions (
            id,
            question_content,
            question_text,
            question_type,
            difficulty_level,
            category,
            topic_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Analyze last 500 responses

      // Add user filter - handle both user_id column (new) and attempt_id filtering (fallback)
      if (userId) {
        query = query.or(`user_id.eq.${userId},attempt_id.like.%${userId.slice(-8)}%`);
      }

      // Add topic filter if specified
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.warn('⚠️ Analytics: Could not fetch question responses:', error);
        return [];
      }

      return (data || []) as QuestionResponse[];
    } catch (error) {
      console.warn('⚠️ Analytics: Error in getUserQuestionResponses:', error);
      return [];
    }
  }

  /**
   * Get user's quiz attempts with proper error handling
   */
  private static async getUserQuizAttempts(
    userId: string,
    topicId?: string
  ): Promise<QuizAttempt[]> {
    try {
      let query = supabase
        .from('user_quiz_attempts')
        .select(`
          id,
          user_id,
          topic_id,
          session_id,
          score,
          total_questions,
          completed_at,
          time_spent,
          game_mode,
          platform
        `)
        .order('completed_at', { ascending: false })
        .limit(100);

      // Add user filter - handle various user identification methods
      if (userId) {
        query = query.or(`user_id.eq.${userId},session_id.like.%${userId.slice(-8)}%`);
      }

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.warn('⚠️ Analytics: Could not fetch quiz attempts:', error);
        return [];
      }

      return (data || []) as QuizAttempt[];
    } catch (error) {
      console.warn('⚠️ Analytics: Error in getUserQuizAttempts:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive learning insights from user data
   */
  private static async generateInsights(
    responses: QuestionResponse[],
    attempts: QuizAttempt[],
    sessionContext?: any
  ): Promise<LearningInsights> {
    // Calculate overall performance
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.is_correct).length;
    const totalTimeMs = responses.reduce((sum, r) => 
      sum + (r.response_time_ms || (r.time_spent_seconds || 0) * 1000), 0);

    // Calculate streak
    const { currentStreak, longestStreak } = this.calculateStreaks(responses);

    // Group responses by topic
    const topicGroups = this.groupResponsesByTopic(responses);
    const topicPerformance = this.calculateTopicPerformance(topicGroups);

    // Generate recommendations
    const recommendations = this.generateRecommendations(topicPerformance, sessionContext);

    // Calculate learning trends
    const learningTrends = this.calculateLearningTrends(responses, attempts);

    // Generate recent activity
    const recentActivity = this.generateRecentActivity(responses, attempts, sessionContext);

    // Generate next steps
    const nextSteps = this.generateNextSteps(topicPerformance, sessionContext);

    return {
      overallPerformance: {
        totalQuizzes: attempts.length,
        averageScore: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        totalTimeSpent: Math.round(totalTimeMs / 1000), // Convert to seconds
        questionsAnswered: totalQuestions,
        correctAnswers,
        currentStreak,
        longestStreak
      },
      topicPerformance,
      recentActivity,
      recommendations,
      learningTrends,
      nextSteps
    };
  }

  /**
   * Calculate current and longest streaks
   */
  private static calculateStreaks(responses: QuestionResponse[]): { currentStreak: number; longestStreak: number } {
    if (responses.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort by creation date (most recent first)
    const sortedResponses = [...responses].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from most recent)
    for (const response of sortedResponses) {
      if (response.is_correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const response of sortedResponses.reverse()) { // Reverse to go chronologically
      if (response.is_correct) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Group responses by topic for analysis
   */
  private static groupResponsesByTopic(responses: QuestionResponse[]): Record<string, QuestionResponse[]> {
    return responses.reduce((groups, response) => {
      const topicId = response.topic_id || response.question?.topic_id || 'unknown';
      if (!groups[topicId]) {
        groups[topicId] = [];
      }
      groups[topicId].push(response);
      return groups;
    }, {} as Record<string, QuestionResponse[]>);
  }

  /**
   * Calculate performance metrics for each topic
   */
  private static calculateTopicPerformance(topicGroups: Record<string, QuestionResponse[]>): TopicPerformance[] {
    return Object.entries(topicGroups).map(([topicId, responses]) => {
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const totalTime = responses.reduce((sum, r) => 
        sum + (r.response_time_ms || (r.time_spent_seconds || 0) * 1000), 0);

      // Calculate difficulty distribution
      const difficultyDistribution = responses.reduce((dist, r) => {
        const difficulty = r.question?.difficulty_level || 1;
        const difficultyName = difficulty <= 1 ? 'easy' : difficulty <= 2 ? 'medium' : 'hard';
        dist[difficultyName] = (dist[difficultyName] || 0) + 1;
        return dist;
      }, {} as Record<string, number>);

      // Enhanced mastery calculation using confidence and review data
      const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
      const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;
      
      // Factor in confidence levels and review patterns
      const confidenceResponses = responses.filter(r => r.confidence_level !== undefined);
      const avgConfidence = confidenceResponses.length > 0 
        ? confidenceResponses.reduce((sum, r) => sum + (r.confidence_level || 3), 0) / confidenceResponses.length
        : 3;
      
      const reviewResponses = responses.filter(r => r.was_review).length;
      const reviewSuccess = responses.filter(r => r.was_review && r.is_correct).length;
      const reviewAccuracy = reviewResponses > 0 ? reviewSuccess / reviewResponses : 1;

      // Enhanced mastery calculation
      const baseAccuracyScore = accuracy * 60; // Base 60% from accuracy
      const speedBonus = averageTime < 15000 ? 20 : 10; // Speed component
      const confidenceBonus = (avgConfidence - 3) * 5; // Confidence adjustment
      const reviewBonus = reviewAccuracy * 10; // Review performance bonus
      
      const masteryLevel = Math.round(Math.max(0, Math.min(100, 
        baseAccuracyScore + speedBonus + confidenceBonus + reviewBonus
      )));

      return {
        topicId,
        topicName: responses[0]?.question?.category || `Topic ${topicId}`,
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy * 100),
        averageTime: Math.round(averageTime / 1000), // Convert to seconds
        difficultyDistribution,
        lastAttempt: responses[0]?.created_at || '',
        streak: this.calculateTopicStreak(responses),
        masteryLevel,
        needsReview: accuracy < 0.7 || masteryLevel < 60 || reviewAccuracy < 0.5
      };
    });
  }

  /**
   * Calculate streak for a specific topic
   */
  private static calculateTopicStreak(responses: QuestionResponse[]): number {
    const sortedResponses = [...responses].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let streak = 0;
    for (const response of sortedResponses) {
      if (response.is_correct) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    topicPerformance: TopicPerformance[],
    sessionContext?: any
  ): LearningInsights['recommendations'] {
    const recommendations: LearningInsights['recommendations'] = [];

    // Enhanced review recommendations using mastery levels
    topicPerformance
      .filter(topic => topic.needsReview)
      .sort((a, b) => a.masteryLevel - b.masteryLevel) // Lowest mastery first
      .slice(0, 2) // Limit to top 2
      .forEach(topic => {
        let reason = `${topic.accuracy}% accuracy`;
        if (topic.masteryLevel < 40) {
          reason += ` and low confidence - needs focused review`;
        } else if (topic.masteryLevel < 60) {
          reason += ` - review fundamentals`;
        }
        
        recommendations.push({
          type: 'review',
          topicId: topic.topicId,
          topicName: topic.topicName,
          reason,
          priority: topic.masteryLevel < 40 ? 'high' : 'medium'
        });
      });

    // Practice recommendations for improving topics
    topicPerformance
      .filter(topic => topic.accuracy >= 60 && topic.accuracy < 85 && topic.masteryLevel >= 40)
      .sort((a, b) => b.masteryLevel - a.masteryLevel) // Highest potential first
      .slice(0, 2)
      .forEach(topic => {
        recommendations.push({
          type: 'practice',
          topicId: topic.topicId,
          topicName: topic.topicName,
          reason: `${topic.accuracy}% accuracy with ${topic.masteryLevel}% mastery - practice to excel`,
          priority: 'medium'
        });
      });

    // Advance recommendations for mastered topics
    topicPerformance
      .filter(topic => topic.masteryLevel >= 80 && topic.accuracy >= 85)
      .slice(0, 1)
      .forEach(topic => {
        recommendations.push({
          type: 'advance',
          topicId: topic.topicId,
          topicName: topic.topicName,
          reason: `Strong mastery (${topic.masteryLevel}%) - ready for advanced concepts`,
          priority: 'low'
        });
      });

    // Add session-specific recommendation with enhanced context
    if (sessionContext && sessionContext.score !== undefined) {
      const contextualRecommendation = sessionContext.score >= 80 ? 'advance' : 
                                     sessionContext.score >= 60 ? 'practice' : 'review';
      
      let reason = `Based on your ${sessionContext.score}% score`;
      if (sessionContext.timeSpent && sessionContext.totalQuestions) {
        const timePerQuestion = sessionContext.timeSpent / sessionContext.totalQuestions;
        if (timePerQuestion < 10) {
          reason += ` with quick completion`;
        } else if (timePerQuestion > 30) {
          reason += ` - take time to build confidence`;
        }
      }
      
      recommendations.unshift({
        type: contextualRecommendation as any,
        topicId: sessionContext.topicId || 'current',
        topicName: sessionContext.topicTitle || 'Current Topic',
        reason,
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Calculate learning trends and patterns
   */
  private static calculateLearningTrends(
    responses: QuestionResponse[],
    attempts: QuizAttempt[]
  ): LearningInsights['learningTrends'] {
    // Analyze improvement areas (topics with recent poor performance)
    const recentResponses = responses.slice(0, 50); // Last 50 responses
    const poorPerformanceTopics = Object.entries(this.groupResponsesByTopic(recentResponses))
      .filter(([_, topicResponses]) => {
        const accuracy = topicResponses.filter(r => r.is_correct).length / topicResponses.length;
        return accuracy < 0.6;
      })
      .map(([topicId, _]) => topicId);

    // Analyze strength areas (topics with consistent good performance)
    const strongPerformanceTopics = Object.entries(this.groupResponsesByTopic(recentResponses))
      .filter(([_, topicResponses]) => {
        const accuracy = topicResponses.filter(r => r.is_correct).length / topicResponses.length;
        return accuracy >= 0.8 && topicResponses.length >= 5;
      })
      .map(([topicId, _]) => topicId);

    // Calculate optimal study time (based on best performance times)
    const bestPerformanceTimes = responses
      .filter(r => r.is_correct && r.created_at)
      .map(r => new Date(r.created_at).getHours());
    
    const timeFrequency = bestPerformanceTimes.reduce((freq, hour) => {
      freq[hour] = (freq[hour] || 0) + 1;
      return freq;
    }, {} as Record<number, number>);

    const optimalHour = Object.entries(timeFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    const optimalStudyTime = optimalHour ? 
      `${optimalHour}:00 - ${parseInt(optimalHour) + 1}:00` : 
      'No pattern detected yet';

    // Calculate consistency score
    const dailyPerformance = this.calculateDailyPerformance(responses);
    const consistencyScore = this.calculateConsistencyScore(dailyPerformance);

    return {
      improvementAreas: poorPerformanceTopics.slice(0, 3),
      strengthAreas: strongPerformanceTopics.slice(0, 3),
      optimalStudyTime,
      consistencyScore
    };
  }

  /**
   * Calculate daily performance for consistency analysis
   */
  private static calculateDailyPerformance(responses: QuestionResponse[]): Record<string, number> {
    const dailyStats = responses.reduce((stats, response) => {
      const date = new Date(response.created_at).toDateString();
      if (!stats[date]) {
        stats[date] = { correct: 0, total: 0 };
      }
      stats[date].total++;
      if (response.is_correct) {
        stats[date].correct++;
      }
      return stats;
    }, {} as Record<string, { correct: number; total: number }>);

    return Object.entries(dailyStats).reduce((performance, [date, stats]) => {
      performance[date] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      return performance;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate consistency score from daily performance
   */
  private static calculateConsistencyScore(dailyPerformance: Record<string, number>): number {
    const scores = Object.values(dailyPerformance);
    if (scores.length < 2) return 100; // Not enough data

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to consistency score (lower deviation = higher consistency)
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
    return Math.round(consistencyScore);
  }

  /**
   * Generate recent activity timeline
   */
  private static generateRecentActivity(
    responses: QuestionResponse[],
    attempts: QuizAttempt[],
    sessionContext?: any
  ): LearningInsights['recentActivity'] {
    const recentActivity: LearningInsights['recentActivity'] = [];

    // Add recent quiz attempts
    attempts.slice(0, 5).forEach(attempt => {
      if (attempt.completed_at) {
        recentActivity.push({
          date: attempt.completed_at,
          activity: `Completed ${attempt.total_questions || 0} question quiz`,
          performance: attempt.score || 0
        });
      }
    });

    // Sort by date (most recent first)
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return recentActivity.slice(0, 5); // Keep last 5 activities
  }

  /**
   * Generate actionable next steps
   */
  private static generateNextSteps(
    topicPerformance: TopicPerformance[],
    sessionContext?: any
  ): LearningInsights['nextSteps'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate steps based on current performance
    if (sessionContext && sessionContext.score < 70) {
      immediate.push(`Review the questions you missed in ${sessionContext.topicTitle || 'this quiz'}`);
      immediate.push('Practice similar questions to reinforce learning');
    } else if (sessionContext && sessionContext.score >= 80) {
      immediate.push('Challenge yourself with advanced topics');
      immediate.push('Share your knowledge by helping others');
    }

    // Short-term steps based on topic performance
    const needsReviewTopics = topicPerformance.filter(t => t.needsReview).slice(0, 2);
    if (needsReviewTopics.length > 0 && needsReviewTopics[0]) {
      shortTerm.push(`Focus on improving ${needsReviewTopics[0]?.topicName ?? ''} (${needsReviewTopics[0]?.accuracy ?? 0}% accuracy)`);
    }

    const strongTopics = topicPerformance.filter(t => t.accuracy >= 85).slice(0, 1);
    if (strongTopics.length > 0 && strongTopics[0]) {
      shortTerm.push(`Explore advanced concepts in ${strongTopics[0]?.topicName ?? ''}`);
    }

    // Long-term steps for comprehensive learning
    longTerm.push('Complete the full civic knowledge assessment');
    longTerm.push('Build a consistent daily practice routine');
    longTerm.push('Connect your learning to real-world civic participation');

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Get default insights when data is limited or there's an error
   */
  private static getDefaultInsights(sessionContext?: any): LearningInsights {
    const currentScore = sessionContext?.score || 0;
    const topicTitle = sessionContext?.topicTitle || 'Quiz Topic';

    return {
      overallPerformance: {
        totalQuizzes: sessionContext ? 1 : 0,
        averageScore: currentScore,
        totalTimeSpent: sessionContext?.timeSpent || 0,
        questionsAnswered: sessionContext?.totalQuestions || 0,
        correctAnswers: sessionContext?.correctAnswers || 0,
        currentStreak: currentScore >= 80 ? 1 : 0,
        longestStreak: currentScore >= 80 ? 1 : 0
      },
      topicPerformance: sessionContext ? [{
        topicId: sessionContext.topicId || 'current',
        topicName: topicTitle,
        totalQuestions: sessionContext.totalQuestions || 0,
        correctAnswers: sessionContext.correctAnswers || 0,
        accuracy: currentScore,
        averageTime: Math.round((sessionContext.timeSpent || 0) / (sessionContext.totalQuestions || 1)),
        difficultyDistribution: { medium: sessionContext.totalQuestions || 0 },
        lastAttempt: new Date().toISOString(),
        streak: currentScore >= 80 ? 1 : 0,
        masteryLevel: currentScore,
        needsReview: currentScore < 70
      }] : [],
      recentActivity: sessionContext ? [{
        date: new Date().toISOString(),
        activity: `Completed ${topicTitle}`,
        performance: currentScore
      }] : [],
      recommendations: sessionContext ? [{
        type: currentScore >= 80 ? 'advance' : currentScore >= 60 ? 'practice' : 'review',
        topicId: sessionContext.topicId || 'current',
        topicName: topicTitle,
        reason: `Based on your ${currentScore}% score`,
        priority: 'high' as const
      }] : [],
      learningTrends: {
        improvementAreas: sessionContext && currentScore < 70 ? [topicTitle] : [],
        strengthAreas: sessionContext && currentScore >= 85 ? [topicTitle] : [],
        optimalStudyTime: 'Continue practicing to establish patterns',
        consistencyScore: 100 // Default high score for new users
      },
      nextSteps: {
        immediate: sessionContext ? [
          currentScore < 70 
            ? `Review the concepts in ${topicTitle}` 
            : `Great job on ${topicTitle}! Try another topic.`
        ] : ['Take your first quiz to start building insights'],
        shortTerm: ['Practice regularly to build knowledge', 'Explore different topic areas'],
        longTerm: ['Complete comprehensive civic knowledge assessment', 'Apply learning to real-world situations']
      }
    };
  }

  /**
   * Get real-time learning updates for a user
   */
  static async getRealTimeLearningUpdate(userId: string, lastResponseId?: string): Promise<RealTimeLearningUpdate> {
    try {
      let query = supabase
        .from('user_question_responses')
        .select(`
          *,
          questions (
            category,
            difficulty_level
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (lastResponseId) {
        query = query.gt('id', lastResponseId)
      }

      const { data, error } = await query

      if (error) {
        console.warn('Could not fetch real-time updates:', error)
        return {
          newResponses: [],
          quickInsights: {
            recentAccuracy: 0,
            avgResponseTime: 0,
            strugglingAreas: [],
            improvementSuggestion: "Keep practicing to improve your civic knowledge!"
          },
          lastUpdateId: undefined
        }
      }

      const recentResponses = (data || []) as QuestionResponse[]
      const quickInsights = {
        recentAccuracy: recentResponses.length > 0 ? 
          (recentResponses.filter(r => r.is_correct).length / recentResponses.length) * 100 : 0,
        avgResponseTime: recentResponses.length > 0 ?
          recentResponses.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0) / recentResponses.length : 0,
        strugglingAreas: this.identifyStrugglingAreas(recentResponses),
        improvementSuggestion: this.generateQuickSuggestion(recentResponses)
      }

      return {
        newResponses: recentResponses,
        quickInsights,
        lastUpdateId: recentResponses[0]?.id
      }
    } catch (error) {
      console.error('Error getting real-time learning update:', error)
      throw error
    }
  }

  private static identifyStrugglingAreas(responses: QuestionResponse[]): string[] {
    const wrongResponses = responses.filter(r => !r.is_correct)
    const categories = wrongResponses
      .map(r => r.question?.category)
      .filter((cat): cat is string => Boolean(cat))
    
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category)
  }

  private static generateQuickSuggestion(responses: QuestionResponse[]): string {
    if (responses.length === 0) return "Keep practicing to improve your civic knowledge!"

    const accuracy = (responses.filter(r => r.is_correct).length / responses.length) * 100
    const avgTime = responses.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0) / responses.length

    if (accuracy < 50) {
      return "Focus on understanding key concepts. Review explanations carefully."
    } else if (avgTime > 60) {
      return "Great accuracy! Try to increase your response speed with practice."
    } else if (accuracy > 80 && avgTime < 30) {
      return "Excellent performance! You're mastering these civic concepts."
    } else {
      return "Good progress! Keep practicing to build consistency."
    }
  }

  // ============================================================================
  // BACKWARD COMPATIBILITY HELPERS (v1.x)
  // ============================================================================

  /**
   * Backwards-compatibility wrapper. Older components call `getUserLearningInsights`.
   * This simply proxies to the newer `getLearningInsights` API so we don't break
   * existing code. Once all call sites are updated we can remove this.
   */
  static async getUserLearningInsights(userId: string, topicId?: string) {
    return await this.getLearningInsights(userId, topicId)
  }

  // ============================================================================
  // UTILITY HELPERS
  // ============================================================================
}

export default MobileAnalyticsService 