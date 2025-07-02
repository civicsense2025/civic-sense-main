/**
 * Daily Challenge Tracker Service
 * Comprehensive service for managing daily challenges with Supabase integration
 */

import { supabase } from './supabase';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  total_topics: number;
  topic_ids: string[];
  featured_topic_id?: string;
  difficulty_level: number;
  estimated_duration_minutes: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDailyProgress {
  id: string;
  user_id: string;
  challenge_date: string;
  completed_topics: string[];
  total_topics: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  total_score: number;
  total_questions_answered: number;
  total_correct_answers: number;
  accuracy_percentage: number;
  time_spent_seconds: number;
  xp_earned: number;
  bonus_xp: number;
  created_at: string;
  updated_at: string;
}

export interface DailyChallengeStreak {
  id: string;
  user_id: string;
  current_streak: number;
  current_streak_start_date?: string;
  current_streak_end_date?: string;
  longest_streak: number;
  longest_streak_start_date?: string;
  longest_streak_end_date?: string;
  total_challenges_completed: number;
  total_days_participated: number;
  average_completion_percentage: number;
  last_completed_date?: string;
  last_activity_date?: string;
  milestones_achieved: string[];
  created_at: string;
  updated_at: string;
}

export interface ChallengeTopicProgress {
  id: string;
  user_id: string;
  challenge_date: string;
  topic_id: string;
  is_started: boolean;
  is_completed: boolean;
  questions_answered: number;
  questions_correct: number;
  total_questions: number;
  score: number;
  accuracy_percentage: number;
  time_spent_seconds: number;
  quiz_session_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyChallengeStats {
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  completion_rate: number;
  average_score: number;
  total_xp_earned: number;
}

export interface TopicWithProgress {
  id: string;
  topic_id: string;
  title: string;
  topic_title: string;
  description?: string;
  emoji?: string;
  image_url?: string;
  blurhash?: string;
  categories?: any[];
  categoryNames?: string[];
  question_count?: number;
  estimated_duration?: number;
  difficulty_level?: number;
  date?: string;
  is_breaking?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  // Progress fields
  is_started?: boolean;
  is_completed?: boolean;
  progress_percentage?: number;
  questions_answered?: number;
  questions_correct?: number;
  accuracy_percentage?: number;
  time_spent_seconds?: number;
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper: extract category names directly from JSONB categories column
const resolveCategoryNames = async (rawCategories: any = []): Promise<string[]> => {
  if (!rawCategories || rawCategories.length === 0) return [];

  // If rawCategories is already an array of objects with name property
  if (Array.isArray(rawCategories)) {
    return rawCategories.map(cat => {
      if (typeof cat === 'object' && cat?.name) {
        return cat.name;
      }
      if (typeof cat === 'string') {
        return cat;
      }
      return 'General';
    }).filter(Boolean);
  }

  // If it's a single object
  if (typeof rawCategories === 'object' && rawCategories?.name) {
    return [rawCategories.name];
  }

  // If it's a string, just return it
  if (typeof rawCategories === 'string') {
    return [rawCategories];
  }

  return [];
};

// =====================================================================================
// DAILY CHALLENGE TRACKER CLASS
// =====================================================================================

export class DailyChallengeTracker {
  private static instance: DailyChallengeTracker;
  
  public static getInstance(): DailyChallengeTracker {
    if (!DailyChallengeTracker.instance) {
      DailyChallengeTracker.instance = new DailyChallengeTracker();
    }
    return DailyChallengeTracker.instance;
  }

  // =====================================================================================
  // CHALLENGE MANAGEMENT
  // =====================================================================================

  /**
   * Get or create daily challenge for a specific date
   */
  async getOrCreateDailyChallenge(date: Date): Promise<{ data: DailyChallenge | null; error: any }> {
    try {
      const challengeDate = formatDateKey(date);
      
      // Use the database function to get or create challenge
      const { data, error } = await supabase.rpc('get_or_create_daily_challenge', {
        target_date: challengeDate
      });

      if (error) {
        console.error('Error getting/creating daily challenge:', error);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No challenge data returned' };
      }

      const challengeData = data[0];
      const challenge: DailyChallenge = {
        id: challengeData.challenge_id,
        challenge_date: challengeData.challenge_date,
        total_topics: challengeData.total_topics,
        topic_ids: challengeData.topic_ids || [],
        featured_topic_id: challengeData.featured_topic_id,
        difficulty_level: challengeData.difficulty_level,
        estimated_duration_minutes: challengeData.estimated_duration_minutes,
        is_active: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { data: challenge, error: null };
    } catch (error) {
      console.error('Error in getOrCreateDailyChallenge:', error);
      return { data: null, error };
    }
  }

  /**
   * Get daily challenges for a date range
   */
  async getDailyChallenges(startDate: Date, endDate: Date): Promise<{ data: DailyChallenge[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .gte('challenge_date', formatDateKey(startDate))
        .lte('challenge_date', formatDateKey(endDate))
        .eq('is_active', true)
        .order('challenge_date', { ascending: true });

      if (error) {
        console.error('Error fetching daily challenges:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getDailyChallenges:', error);
      return { data: [], error };
    }
  }

  // =====================================================================================
  // USER PROGRESS TRACKING
  // =====================================================================================

  /**
   * Get user progress for a specific date
   */
  async getUserDailyProgress(userId: string, date: Date): Promise<{ data: UserDailyProgress | null; error: any }> {
    try {
      const challengeDate = formatDateKey(date);
      
      const { data, error } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user daily progress:', error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error in getUserDailyProgress:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user progress for multiple dates
   */
  async getUserProgressRange(userId: string, startDate: Date, endDate: Date): Promise<{ data: UserDailyProgress[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('challenge_date', formatDateKey(startDate))
        .lte('challenge_date', formatDateKey(endDate))
        .order('challenge_date', { ascending: true });

      if (error) {
        console.error('Error fetching user progress range:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserProgressRange:', error);
      return { data: [], error };
    }
  }

  /**
   * Update user progress when they complete a topic
   */
  async updateUserProgress(
    userId: string,
    challengeDate: Date,
    topicId: string,
    quizSessionId?: string,
    questionsAnswered: number = 0,
    questionsCorrect: number = 0,
    totalQuestions: number = 0,
    timeSpentSeconds: number = 0
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('update_user_daily_progress', {
        p_user_id: userId,
        p_challenge_date: formatDateKey(challengeDate),
        p_topic_id: topicId,
        p_quiz_session_id: quizSessionId,
        p_questions_answered: questionsAnswered,
        p_questions_correct: questionsCorrect,
        p_total_questions: totalQuestions,
        p_time_spent_seconds: timeSpentSeconds,
      });

      if (error) {
        console.error('Error updating user progress:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateUserProgress:', error);
      return { data: null, error };
    }
  }

  // =====================================================================================
  // STREAK MANAGEMENT
  // =====================================================================================

  /**
   * Get user streak information
   */
  async getUserStreak(userId: string): Promise<{ data: DailyChallengeStreak | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_challenge_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user streak:', error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error in getUserStreak:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user streak (usually called automatically by the database function)
   */
  async updateUserStreak(userId: string, completionDate: Date): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId,
        p_completion_date: formatDateKey(completionDate),
      });

      if (error) {
        console.error('Error updating user streak:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateUserStreak:', error);
      return { data: null, error };
    }
  }

  // =====================================================================================
  // TOPIC PROGRESS TRACKING
  // =====================================================================================

  /**
   * Get topic progress for a user on a specific date
   */
  async getChallengeTopicProgress(userId: string, challengeDate: Date): Promise<{ data: ChallengeTopicProgress[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('challenge_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', formatDateKey(challengeDate))
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching challenge topic progress:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getChallengeTopicProgress:', error);
      return { data: [], error };
    }
  }

  /**
   * Get topics for a specific date with user progress
   */
  async getTopicsForDateWithProgress(userId: string, date: Date): Promise<{ data: TopicWithProgress[]; error: any }> {
    try {
      const challengeDate = formatDateKey(date);
      
      // Get topics for the date
      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select(`
          id,
          topic_id,
          title,
          topic_title,
          description,
          emoji,
          image_url,
          blurhash,
          categories,
          question_count,
          estimated_duration,
          difficulty_level,
          date,
          is_breaking,
          is_featured,
          is_active
        `)
        .eq('date', challengeDate)
        .eq('is_active', true)
        .order('is_breaking', { ascending: false })
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: true });

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        return { data: [], error: topicsError };
      }

      if (!topics || topics.length === 0) {
        return { data: [], error: null };
      }

      // Get user progress for these topics
      const { data: progressData, error: progressError } = await supabase
        .from('challenge_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate);

      if (progressError) {
        console.error('Error fetching topic progress:', progressError);
        // Continue without progress data
      }

      // Combine topics with progress and resolve category names
      const topicsWithProgress: TopicWithProgress[] = await Promise.all(
        topics.map(async (topic) => {
          const progress = progressData?.find(p => p.topic_id === topic.id);
          const categoryNames = await resolveCategoryNames(topic.categories || []);
          
          return {
            ...topic,
            categoryNames,
            is_started: progress?.is_started || false,
            is_completed: progress?.is_completed || false,
            progress_percentage: progress ? Math.round((progress.questions_answered / Math.max(1, progress.total_questions)) * 100) : 0,
            questions_answered: progress?.questions_answered || 0,
            questions_correct: progress?.questions_correct || 0,
            accuracy_percentage: progress?.accuracy_percentage || 0,
            time_spent_seconds: progress?.time_spent_seconds || 0,
          };
        })
      );

      return { data: topicsWithProgress, error: null };
    } catch (error) {
      console.error('Error in getTopicsForDateWithProgress:', error);
      return { data: [], error };
    }
  }

  /**
   * Get incomplete quizzes for today (for continue section)
   */
  async getIncompleteQuizzesForToday(userId: string): Promise<{ data: TopicWithProgress[]; error: any }> {
    try {
      const today = new Date();
      const challengeDate = formatDateKey(today);
      
      // Get incomplete topic progress for today
      const { data: incompleteProgress, error: progressError } = await supabase
        .from('challenge_topic_progress')
        .select(`
          *,
          question_topics (
            id,
            topic_id,
            title,
            topic_title,
            description,
            emoji,
            image_url,
            blurhash,
            categories,
            question_count,
            estimated_duration,
            difficulty_level,
            date,
            is_breaking,
            is_featured,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate)
        .eq('is_started', true)
        .eq('is_completed', false)
        .order('started_at', { ascending: false });

      if (progressError) {
        console.error('Error fetching incomplete quizzes:', progressError);
        return { data: [], error: progressError };
      }

      if (!incompleteProgress || incompleteProgress.length === 0) {
        return { data: [], error: null };
      }

      // Map to TopicWithProgress format with category names
      const incompleteTopics: TopicWithProgress[] = await Promise.all(
        incompleteProgress
          .filter(progress => progress.question_topics) // Ensure topic exists
          .map(async (progress) => {
            const topic = progress.question_topics;
            const categoryNames = await resolveCategoryNames(topic.categories || []);
            return {
              ...topic,
              categoryNames,
              is_started: true,
              is_completed: false,
              progress_percentage: Math.round((progress.questions_answered / Math.max(1, progress.total_questions)) * 100),
              questions_answered: progress.questions_answered,
              questions_correct: progress.questions_correct,
              accuracy_percentage: progress.accuracy_percentage,
              time_spent_seconds: progress.time_spent_seconds,
            };
          })
      );

      return { data: incompleteTopics, error: null };
    } catch (error) {
      console.error('Error in getIncompleteQuizzesForToday:', error);
      return { data: [], error };
    }
  }

  // =====================================================================================
  // STATISTICS AND ANALYTICS
  // =====================================================================================

  /**
   * Get comprehensive daily challenge statistics for a user
   */
  async getUserStats(userId: string): Promise<{ data: DailyChallengeStats | null; error: any }> {
    try {
      // Get streak information
      const { data: streakData, error: streakError } = await this.getUserStreak(userId);
      
      if (streakError && streakError.code !== 'PGRST116') {
        console.error('Error fetching streak data for stats:', streakError);
        return { data: null, error: streakError };
      }

      // Get overall progress statistics
      const { data: progressStats, error: progressError } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        console.error('Error fetching progress stats:', progressError);
        return { data: null, error: progressError };
      }

      const completedChallenges = progressStats?.filter(p => p.is_completed) || [];
      const totalChallenges = progressStats?.length || 0;
      
      const stats: DailyChallengeStats = {
        current_streak: streakData?.current_streak || 0,
        longest_streak: streakData?.longest_streak || 0,
        total_completed: completedChallenges.length,
        completion_rate: totalChallenges > 0 ? Math.round((completedChallenges.length / totalChallenges) * 100) : 0,
        average_score: completedChallenges.length > 0 
          ? Math.round(completedChallenges.reduce((sum, p) => sum + p.accuracy_percentage, 0) / completedChallenges.length)
          : 0,
        total_xp_earned: progressStats?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return { data: null, error };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Check if user can participate in challenge for a specific date
   * (Based on when they joined vs challenge date)
   */
  async canParticipateInChallenge(userId: string, challengeDate: Date): Promise<boolean> {
    try {
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error || !user?.user) {
        return false;
      }

      const userCreatedAt = new Date(user.user.created_at);
      const challengeDateObj = new Date(challengeDate);
      
      // User can only participate in challenges from the day they joined or later
      return challengeDateObj >= userCreatedAt;
    } catch (error) {
      console.error('Error checking challenge participation eligibility:', error);
      return false;
    }
  }

  /**
   * Get user's join date for UI purposes
   */
  async getUserJoinDate(): Promise<Date | null> {
    try {
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error || !user?.user) {
        return null;
      }

      return new Date(user.user.created_at);
    } catch (error) {
      console.error('Error getting user join date:', error);
      return null;
    }
  }

  // =====================================================================================
  // MOCK FALLBACK METHODS (for development when DB isn't available)
  // =====================================================================================

  /**
   * Fallback method for when database functions aren't available
   */
  async fetchUserProgress(userId: string): Promise<Map<string, any>> {
    const progressMap = new Map();
    
    try {
      // Try to get real data first
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const { data, error } = await this.getUserProgressRange(userId, startDate, endDate);
      
      if (!error && data) {
        data.forEach(progress => {
          progressMap.set(progress.challenge_date, {
            completed: progress.is_completed,
            progress: progress.progress_percentage,
            score: progress.accuracy_percentage,
          });
        });
      }
      
      return progressMap;
    } catch (error) {
      console.error('Error in fetchUserProgress fallback:', error);
      return progressMap;
    }
  }
} 