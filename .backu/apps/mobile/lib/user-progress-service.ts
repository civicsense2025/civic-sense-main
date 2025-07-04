/**
 * CivicSense User Progress Service
 * 
 * Comprehensive progress tracking system that integrates badges, skills, and analytics
 * for personalized learning experiences and Spotify-style recommendation engines.
 */

import { supabase } from './supabase';

// ==================== Core Types from Database Schema ====================

export interface Skill {
  id: string;
  skill_name: string;
  skill_slug: string;
  category_id: string;
  description?: string;
  difficulty_level?: number; // 1-5 scale
  display_order?: number;
  emoji?: string;
  is_active?: boolean;
  is_core_skill?: boolean;
  parent_skill_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SkillBadge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_level: string; // 'bronze', 'silver', 'gold', 'platinum'
  created_at?: string;
  updated_at?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  current_level?: number;
  current_streak?: number;
  longest_streak?: number;
  total_xp?: number;
  xp_to_next_level?: number;
  total_questions_answered?: number;
  total_correct_answers?: number;
  total_quizzes_completed?: number;
  weekly_goal?: number;
  weekly_completed?: number;
  week_start_date?: string;
  last_activity_date?: string;
  learning_style?: string;
  adaptive_difficulty?: boolean;
  preferred_categories?: any; // JSON
  favorite_categories?: any; // JSON
  created_at?: string;
  updated_at?: string;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_id: string;
  skill_level?: number; // 1-100 scale
  mastery_level?: string; // 'novice', 'beginner', 'intermediate', 'advanced', 'expert'
  questions_attempted?: number;
  questions_correct?: number;
  confidence_level?: number; // 1-10 scale
  consecutive_correct?: number;
  last_practiced_at?: string;
  mastery_achieved_at?: string;
  next_review_date?: string;
  review_interval_days?: number;
  improvement_rate?: number;
  average_time_per_question?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_data?: any; // JSON
  earned_at?: string;
  is_milestone?: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id?: string;
  earned_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCategorySkills {
  id: string;
  user_id: string;
  category: string;
  skill_level?: number;
  mastery_level?: string;
  questions_attempted?: number;
  questions_correct?: number;
  last_practiced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  topic_id: string;
  total_questions: number;
  correct_answers?: number;
  score?: number;
  time_spent_seconds?: number;
  is_completed?: boolean;
  started_at?: string;
  completed_at?: string;
  game_mode?: string;
  current_streak?: number;
  max_streak?: number;
  response_data?: any; // JSON
  created_at?: string;
  updated_at?: string;
}

export interface QuestionResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  hint_used?: boolean;
  created_at?: string;
}

// ==================== Analytics & Performance Types ====================

export interface PerformanceAnalytics {
  // Overall Performance
  overallAccuracy: number;
  averageQuizScore: number;
  totalXpEarned: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  
  // Category Breakdown
  categoryPerformance: Record<string, {
    accuracy: number;
    questionsAnswered: number;
    averageScore: number;
    skillLevel: number;
    weakestSkills: string[];
    strongestSkills: string[];
  }>;
  
  // Skill Progression
  skillMastery: Record<string, {
    level: number;
    masteryLevel: string;
    confidenceLevel: number;
    consecutiveCorrect: number;
    needsReview: boolean;
    nextReviewDate?: string;
  }>;
  
  // Time-based Analytics
  studyPatterns: {
    averageSessionLength: number;
    preferredStudyTime: string;
    weeklyGoalProgress: number;
    streakHistory: Array<{
      date: string;
      streak: number;
      quizzesCompleted: number;
    }>;
  };
  
  // Improvement Tracking
  improvementTrends: {
    accuracyTrend: number; // Positive/negative percentage change
    speedTrend: number;
    consistencyScore: number;
    difficultyProgression: number;
  };
  
  // Recommendation Data
  recommendationData: {
    weakestCategories: string[];
    recentIncorrectQuestions: string[];
    readyForAdvancement: string[];
    needsReview: string[];
    personalizedDecks: PersonalizedDeckCriteria[];
  };
}

export interface PersonalizedDeckCriteria {
  type: 'performance' | 'adaptive' | 'time-based' | 'achievement';
  includeIncorrect?: boolean;
  includeStrong?: boolean;
  categories?: string[];
  skillLevels?: string[];
  difficultyRange?: [number, number];
  maxAge?: number; // days
  minAccuracy?: number;
  adaptiveDifficulty?: boolean;
}

export interface UserStats {
  // Quick performance metrics
  weeklyAccuracy: number;
  recentPerformance: number; // Last 7 days
  improvementRate: number;
  
  // Categorized weaknesses and strengths  
  weakestCategories: string[];
  strongestCategories: string[];
  recentIncorrectQuestions: string[];
  masteredSkills: string[];
  
  // Learning insights
  optimalDifficulty: 'easy' | 'medium' | 'hard';
  learningVelocity: number;
  retentionRate: number;
  engagementLevel: number;
  
  // Achievement progress
  recentBadges: UserBadge[];
  nextMilestone?: {
    type: string;
    progress: number;
    target: number;
    description: string;
  } | undefined;
}

// ==================== Main User Progress Service ====================

export class UserProgressService {
  private static instance: UserProgressService;
  
  static getInstance(): UserProgressService {
    if (!UserProgressService.instance) {
      UserProgressService.instance = new UserProgressService();
    }
    return UserProgressService.instance;
  }
  
  // ==================== Core Data Fetching ====================
  
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user progress:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      return null;
    }
  }
  
  async getUserSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    try {
      const { data, error } = await supabase
        .from('user_skill_progress')
        .select(`
          *,
          skills:skill_id (
            skill_name,
            skill_slug,
            category_id,
            difficulty_level,
            emoji,
            is_core_skill
          )
        `)
        .eq('user_id', userId)
        .order('last_practiced_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user skill progress:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserSkillProgress:', error);
      return [];
    }
  }
  
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          skill_badges:badge_id (
            badge_name,
            badge_description,
            badge_icon,
            badge_level
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user badges:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserBadges:', error);
      return [];
    }
  }
  
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }
  
  async getRecentQuizAttempts(userId: string, limit: number = 50): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching quiz attempts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getRecentQuizAttempts:', error);
      return [];
    }
  }
  
  async getCategoryPerformance(userId: string): Promise<UserCategorySkills[]> {
    try {
      const { data, error } = await supabase
        .from('user_category_skills')
        .select('*')
        .eq('user_id', userId)
        .order('skill_level', { ascending: false });
      
      if (error) {
        console.error('Error fetching category performance:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      return [];
    }
  }
  
  // ==================== Quick Stats Generation ====================
  
  /**
   * Generate simplified user stats for the personalized deck system
   * This is optimized for mobile performance and matches the interface from quiz.tsx
   */
  async generateUserStats(userId: string): Promise<UserStats> {
    try {
      const [
        userProgress,
        skillProgress,
        recentAttempts,
        categoryPerformance,
        badges
      ] = await Promise.all([
        this.getUserProgress(userId),
        this.getUserSkillProgress(userId),
        this.getRecentQuizAttempts(userId, 30),
        this.getCategoryPerformance(userId),
        this.getUserBadges(userId)
      ]);
      
      // Calculate quick metrics
      const weeklyAccuracy = this.calculateWeeklyAccuracy(recentAttempts);
      const recentPerformance = this.calculateRecentPerformance(recentAttempts);
      const improvementRate = this.calculateImprovementRate(recentAttempts);
      
      // Identify weak and strong categories
      const weakestCategories = this.findWeakestCategories(categoryPerformance);
      const strongestCategories = this.findStrongestCategories(categoryPerformance);
      
      // Get recent incorrect questions for retry deck
      const recentIncorrectQuestions = await this.getRecentIncorrectQuestions(userId, 20);
      
      // Find mastered skills
      const masteredSkills = this.getMasteredSkills(skillProgress);
      
      // Calculate learning insights
      const optimalDifficulty = this.calculateOptimalDifficulty(recentAttempts);
      const learningVelocity = this.calculateLearningVelocity(recentAttempts);
      const retentionRate = this.calculateRetentionRate(skillProgress);
      const engagementLevel = this.calculateEngagementLevel(userProgress, recentAttempts);
      
      // Next milestone
      const nextMilestone = this.calculateNextMilestone(userProgress, skillProgress);
      
      return {
        weeklyAccuracy,
        recentPerformance,
        improvementRate,
        weakestCategories,
        strongestCategories,
        recentIncorrectQuestions,
        masteredSkills,
        optimalDifficulty,
        learningVelocity,
        retentionRate,
        engagementLevel,
        recentBadges: badges.slice(0, 3),
        nextMilestone
      };
    } catch (error) {
      console.error('Error generating user stats:', error);
      
      // Return default stats if there's an error
      return {
        weeklyAccuracy: 0,
        recentPerformance: 0,
        improvementRate: 0,
        weakestCategories: [],
        strongestCategories: [],
        recentIncorrectQuestions: [],
        masteredSkills: [],
        optimalDifficulty: 'medium',
        learningVelocity: 0,
        retentionRate: 0,
        engagementLevel: 0,
        recentBadges: [],
        nextMilestone: undefined
      };
    }
  }
  
  // ==================== Helper Methods ====================
  
  private async getRecentIncorrectQuestions(userId: string, limit: number): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_question_responses')
        .select(`
          question_id,
          user_quiz_attempts!inner(user_id)
        `)
        .eq('user_quiz_attempts.user_id', userId)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching incorrect questions:', error);
        return [];
      }
      
      return (data || []).map(item => item.question_id);
    } catch (error) {
      console.error('Error in getRecentIncorrectQuestions:', error);
      return [];
    }
  }
  
  private calculateWeeklyAccuracy(attempts: QuizAttempt[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyAttempts = attempts.filter(attempt => 
      attempt.completed_at && new Date(attempt.completed_at) >= oneWeekAgo
    );
    
    if (weeklyAttempts.length === 0) return 0;
    
    const totalCorrect = weeklyAttempts.reduce((sum, attempt) => sum + (attempt.correct_answers || 0), 0);
    const totalQuestions = weeklyAttempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
    
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }
  
  private calculateRecentPerformance(attempts: QuizAttempt[]): number {
    if (attempts.length === 0) return 0;
    
    const recent = attempts.slice(0, 5); // Last 5 attempts
    const scores = recent.filter(a => a.score !== null).map(a => a.score!);
    
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }
  
  private calculateImprovementRate(attempts: QuizAttempt[]): number {
    if (attempts.length < 10) return 0;
    
    const recent = attempts.slice(0, 5);
    const older = attempts.slice(5, 10);
    
    const recentAvg = recent.reduce((sum, a) => sum + (a.score || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + (a.score || 0), 0) / older.length;
    
    return olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  }
  
  private findWeakestCategories(categoryPerformance: UserCategorySkills[]): string[] {
    return categoryPerformance
      .filter(cat => cat.questions_attempted && cat.questions_attempted > 3)
      .sort((a, b) => this.calculateCategoryAccuracy(a) - this.calculateCategoryAccuracy(b))
      .slice(0, 3)
      .map(cat => cat.category);
  }
  
  private findStrongestCategories(categoryPerformance: UserCategorySkills[]): string[] {
    return categoryPerformance
      .filter(cat => cat.questions_attempted && cat.questions_attempted > 3)
      .sort((a, b) => this.calculateCategoryAccuracy(b) - this.calculateCategoryAccuracy(a))
      .slice(0, 3)
      .map(cat => cat.category);
  }
  
  private calculateCategoryAccuracy(category: UserCategorySkills): number {
    if (!category.questions_attempted || category.questions_attempted === 0) return 0;
    return Math.round(((category.questions_correct || 0) / category.questions_attempted) * 100);
  }
  
  private getMasteredSkills(skillProgress: UserSkillProgress[]): string[] {
    return skillProgress
      .filter(skill => 
        skill.mastery_level === 'expert' || 
        skill.mastery_level === 'advanced' ||
        (skill.skill_level || 0) >= 80
      )
      .map(skill => skill.skill_id);
  }
  
  private calculateOptimalDifficulty(attempts: QuizAttempt[]): 'easy' | 'medium' | 'hard' {
    if (attempts.length === 0) return 'medium';
    
    const averageScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length;
    
    if (averageScore >= 85) return 'hard';
    if (averageScore >= 70) return 'medium';
    return 'easy';
  }
  
  private calculateLearningVelocity(attempts: QuizAttempt[]): number {
    if (attempts.length < 5) return 0;
    
    // Calculate based on frequency of quiz completion and score improvement
    const recent = attempts.slice(0, 5);
    const avgScore = recent.reduce((sum, a) => sum + (a.score || 0), 0) / recent.length;
    const frequency = recent.length; // In a given time period
    
    return Math.round((avgScore + frequency * 5) / 2); // Simplified velocity calculation
  }
  
  private calculateRetentionRate(skillProgress: UserSkillProgress[]): number {
    if (skillProgress.length === 0) return 0;
    
    const skillsWithConsistentPerformance = skillProgress.filter(skill => 
      (skill.consecutive_correct || 0) >= 3
    );
    
    return Math.round((skillsWithConsistentPerformance.length / skillProgress.length) * 100);
  }
  
  private calculateEngagementLevel(userProgress: UserProgress | null, attempts: QuizAttempt[]): number {
    let engagement = 0;
    
    // Weekly goal progress
    if (userProgress?.weekly_goal && userProgress.weekly_completed) {
      engagement += Math.min(50, (userProgress.weekly_completed / userProgress.weekly_goal) * 50);
    }
    
    // Current streak bonus
    const streakBonus = Math.min(30, (userProgress?.current_streak || 0) * 3);
    engagement += streakBonus;
    
    // Recent activity bonus
    const recentActivityBonus = Math.min(20, attempts.length * 2);
    engagement += recentActivityBonus;
    
    return Math.round(Math.min(100, engagement));
  }
  
  private calculateNextMilestone(userProgress: UserProgress | null, skillProgress: UserSkillProgress[]): any {
    if (!userProgress) return undefined;
    
    // Level up milestone
    const currentXp = userProgress.total_xp || 0;
    const currentLevel = userProgress.current_level || 1;
    const nextLevelXp = currentLevel * 1000; // Simplified XP calculation
    const progressToNext = currentXp % 1000;
    
    if (progressToNext > 0) {
      return {
        type: 'level_up',
        progress: progressToNext,
        target: 1000,
        description: `Reach level ${currentLevel + 1}`
      };
    }
    
    // Skill mastery milestone
    const nearMasterySkills = skillProgress.filter(skill => 
      (skill.skill_level || 0) >= 70 && skill.mastery_level !== 'expert'
    );
    
    if (nearMasterySkills.length > 0) {
      const skill = nearMasterySkills[0];
      if (skill) {
        return {
          type: 'skill_mastery',
          progress: skill.skill_level || 0,
          target: 100,
          description: 'Master a civic skill'
        };
      }
    }
    
    // Streak milestone
    const currentStreak = userProgress.current_streak || 0;
    const nextStreakTarget = Math.ceil((currentStreak + 1) / 5) * 5; // Next multiple of 5
    
    return {
      type: 'streak',
      progress: currentStreak,
      target: nextStreakTarget,
      description: `Reach ${nextStreakTarget}-day streak`
    };
  }
}

// ==================== Singleton Export ====================

export const userProgressService = UserProgressService.getInstance(); 