import { supabase } from '../supabase';

// ============================================================================
// INTERFACE DEFINITIONS  
// ============================================================================

export interface UserStatsResult {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  globalRank: number;
  totalUsers: number;
}

export interface CategoryProgress {
  id: string;
  name: string;
  emoji: string;
  completed: number;
  total: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: Date;
}

export interface WeeklyActivity {
  day: string;
  quizzes: number;
  score: number;
  timeSpent: number;
}

export interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'streak' | 'milestone';
  title: string;
  description: string;
  icon: string;
  actionable?: boolean;
  action?: () => void;
}

export interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  totalXPForNextLevel: number;
  achievements: number;
  rank: number;
  totalUsers: number;
}

// ============================================================================
// USER STATS QUERIES
// ============================================================================

/**
 * Get user's overall statistics from database
 */
export const getUserOverallStats = async (userId: string): Promise<UserStatsResult> => {
  try {
    // Get quiz attempt statistics
    const { data: quizStats } = await supabase
      .from('quiz_attempts')
      .select('score, total_questions, time_spent_seconds, completed_at')
      .eq('user_id', userId)
      .eq('completed', true);

    // Get current streak and XP from user profile or stats table
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, total_xp')
      .eq('id', userId)
      .single();

    // Calculate stats from quiz attempts
    const totalQuizzes = quizStats?.length || 0;
    const totalQuestions = quizStats?.reduce((sum, quiz) => sum + (quiz.total_questions || 0), 0) || 0;
    const correctAnswers = quizStats?.reduce((sum, quiz) => sum + (quiz.score || 0), 0) || 0;
    const totalTimeSpent = Math.round((quizStats?.reduce((sum, quiz) => sum + (quiz.time_spent_seconds || 0), 0) || 0) / 60); // Convert to minutes

    // Get global ranking
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: usersWithHigherXP } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', userProfile?.total_xp || 0);

    const globalRank = (usersWithHigherXP || 0) + 1;

    return {
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      totalTimeSpent,
      currentStreak: userProfile?.current_streak || 0,
      longestStreak: userProfile?.longest_streak || 0,
      totalXP: userProfile?.total_xp || 0,
      globalRank,
      totalUsers: totalUsers || 1,
    };
  } catch (error) {
    console.error('Error fetching user overall stats:', error);
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      globalRank: 0,
      totalUsers: 1,
    };
  }
};

/**
 * Get user's category progress
 */
export const getUserCategoryProgress = async (userId: string): Promise<CategoryProgress[]> => {
  try {
    // Get all categories with user's progress
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (!categories) return [];

    // Get user's progress for each category
    const categoryProgress = await Promise.all(
      categories.map(async (category) => {
        // Get topics in this category
        const { data: topics } = await supabase
          .from('question_topics')
          .select('topic_id')
          .contains('categories', JSON.stringify([category.id]))
          .eq('is_active', true);

        const topicIds = topics?.map(t => t.topic_id) || [];
        const total = topicIds.length;

        if (total === 0) {
          return {
            id: category.id,
            name: category.name,
            emoji: category.emoji || '📚',
            completed: 0,
            total: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
          };
        }

        // Get user's quiz attempts for topics in this category
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('topic_id, score, total_questions, time_spent_seconds, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .in('topic_id', topicIds);

        const completedTopics = new Set(attempts?.map(a => a.topic_id) || []);
        const completed = completedTopics.size;

        const totalQuestions = attempts?.reduce((sum, a) => sum + (a.total_questions || 0), 0) || 0;
        const correctAnswers = attempts?.reduce((sum, a) => sum + (a.score || 0), 0) || 0;
        const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        
        const timeSpent = Math.round((attempts?.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) || 0) / 60);
        
        const lastActivity = (attempts && attempts.length > 0)
          ? new Date(Math.max(...attempts.map(a => new Date(a.completed_at).getTime())))
          : new Date();

        return {
          id: category.id,
          name: category.name,
          emoji: category.emoji || '📚',
          completed,
          total,
          averageScore,
          timeSpent,
          lastActivity,
        };
      })
    );

    return categoryProgress.filter(cp => cp.total > 0); // Only show categories with topics
  } catch (error) {
    console.error('Error fetching user category progress:', error);
    return [];
  }
};

/**
 * Get user's weekly activity
 */
export const getUserWeeklyActivity = async (userId: string): Promise<WeeklyActivity[]> => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)

    // Get quiz attempts for this week
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score, total_questions, time_spent_seconds, completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', startOfWeek.toISOString())
      .lte('completed_at', endOfWeek.toISOString());

    // Initialize week structure
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity: WeeklyActivity[] = weekDays.map(day => ({
      day,
      quizzes: 0,
      score: 0,
      timeSpent: 0,
    }));

    // Process attempts by day
    attempts?.forEach(attempt => {
      const attemptDate = new Date(attempt.completed_at);
      const dayIndex = attemptDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (dayIndex >= 0 && dayIndex < weeklyActivity.length) {
        const dayActivity = weeklyActivity[dayIndex];
        if (dayActivity) {
          dayActivity.quizzes += 1;
          const questions = attempt.total_questions || 0;
          const correct = attempt.score || 0;
          const score = questions > 0 ? Math.round((correct / questions) * 100) : 0;
          
          // Calculate average score for the day
          const currentAvg = dayActivity.score;
          const currentCount = dayActivity.quizzes;
          dayActivity.score = Math.round(((currentAvg * (currentCount - 1)) + score) / currentCount);
          
          dayActivity.timeSpent += Math.round((attempt.time_spent_seconds || 0) / 60);
        }
      }
    });

    // Convert to mobile display format (Mon-Sun)
    const reorderedActivity: WeeklyActivity[] = [
      weeklyActivity[1] || { day: 'Mon', quizzes: 0, score: 0, timeSpent: 0 }, // Mon
      weeklyActivity[2] || { day: 'Tue', quizzes: 0, score: 0, timeSpent: 0 }, // Tue  
      weeklyActivity[3] || { day: 'Wed', quizzes: 0, score: 0, timeSpent: 0 }, // Wed
      weeklyActivity[4] || { day: 'Thu', quizzes: 0, score: 0, timeSpent: 0 }, // Thu
      weeklyActivity[5] || { day: 'Fri', quizzes: 0, score: 0, timeSpent: 0 }, // Fri
      weeklyActivity[6] || { day: 'Sat', quizzes: 0, score: 0, timeSpent: 0 }, // Sat
      weeklyActivity[0] || { day: 'Sun', quizzes: 0, score: 0, timeSpent: 0 }, // Sun
    ];

    return reorderedActivity;
  } catch (error) {
    console.error('Error fetching user weekly activity:', error);
    return [
      { day: 'Mon', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Tue', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Wed', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Thu', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Fri', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Sat', quizzes: 0, score: 0, timeSpent: 0 },
      { day: 'Sun', quizzes: 0, score: 0, timeSpent: 0 },
    ];
  }
};

/**
 * Get user's achievement count
 */
export const getUserAchievementCount = async (userId: string): Promise<{ count: number }> => {
  try {
    const { count } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return { count: count || 0 };
  } catch (error) {
    console.error('Error fetching user achievement count:', error);
    return { count: 0 };
  }
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate user level based on total XP
 */
export const calculateLevel = (totalXP: number): number => {
  // Level formula: Level = floor(sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

/**
 * Calculate XP needed to reach next level
 */
export const calculateXPToNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevel(totalXP);
  const nextLevelXP = calculateTotalXPForNextLevel(totalXP);
  return nextLevelXP - totalXP;
};

/**
 * Calculate total XP required for next level
 */
export const calculateTotalXPForNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevel(totalXP);
  const nextLevel = currentLevel + 1;
  // XP required for level N = (N-1)^2 * 100
  return Math.pow(nextLevel - 1, 2) * 100;
};

/**
 * Generate learning insights based on user data
 */
export const generateLearningInsights = (
  stats: UserStats,
  categoryProgress: CategoryProgress[],
  weeklyActivity: WeeklyActivity[]
): LearningInsight[] => {
  const insights: LearningInsight[] = [];

  // Strength insights
  if (stats.averageScore >= 80) {
    insights.push({
      id: 'high-accuracy',
      type: 'strength',
      title: 'Excellent Accuracy!',
      description: `You're maintaining a ${stats.averageScore}% average score. Keep up the great work!`,
      icon: '🎯',
      actionable: false,
    });
  }

  // Streak insights
  if (stats.currentStreak >= 7) {
    insights.push({
      id: 'strong-streak',
      type: 'streak',
      title: `${stats.currentStreak}-Day Streak! 🔥`,
      description: 'You\'re on fire! Consistency is key to mastering civic knowledge.',
      icon: '🔥',
      actionable: false,
    });
  }

  // Category insights
  if (categoryProgress.length > 0) {
    const bestCategory = categoryProgress.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );

    if (bestCategory && bestCategory.averageScore >= 70) {
      insights.push({
        id: 'category-strength',
        type: 'strength',
        title: `${bestCategory.name} Expert`,
        description: `You excel in ${bestCategory.name} with ${bestCategory.averageScore}% average!`,
        icon: bestCategory.emoji,
        actionable: false,
      });
    }
  }

  // Improvement opportunities
  const weeklyQuizzes = weeklyActivity.reduce((sum, day) => sum + day.quizzes, 0);
  if (weeklyQuizzes < 5) {
    insights.push({
      id: 'practice-more',
      type: 'improvement',
      title: 'Practice More Regularly',
      description: 'Try to complete at least one quiz per day to build momentum.',
      icon: '📈',
      actionable: true,
    });
  }

  // Milestone insights
  if (stats.level >= 5) {
    insights.push({
      id: 'level-milestone',
      type: 'milestone',
      title: `Level ${stats.level} Achieved!`,
      description: 'You\'re becoming a civic knowledge expert. Keep learning!',
      icon: '🏆',
      actionable: false,
    });
  }

  return insights;
};

export class UserStatsService {
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const totalQuizzes = quizAttempts?.length || 0;
      const totalQuestions = quizAttempts?.reduce((sum, attempt) => sum + (attempt.total_questions || 0), 0) || 0;
      const correctAnswers = quizAttempts?.reduce((sum, attempt) => sum + (attempt.questions_correct || 0), 0) || 0;
      const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Calculate total time spent in seconds
      const totalTimeSpent = quizAttempts?.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || 0), 0) || 0;

      // Get streak (simplified for now)
      const currentStreak = await this.calculateCurrentStreak(userId);

      // Get achievements count
      const { count: achievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        totalQuizzes,
        totalQuestions,
        correctAnswers,
        averageScore,
        totalTimeSpent,
        currentStreak,
        longestStreak: currentStreak, // TODO: Calculate actual longest streak
        totalXP: 0, // TODO: Implement XP system
        level: 1, // TODO: Calculate level from XP
        xpToNextLevel: 100, // TODO: Calculate from XP
        totalXPForNextLevel: 100, // TODO: Calculate from level
        achievements: achievementsCount || 0,
        rank: 0, // TODO: Implement ranking system
        totalUsers: 1, // TODO: Get total user count
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        level: 1,
        xpToNextLevel: 100,
        totalXPForNextLevel: 100,
        achievements: 0,
        rank: 0,
        totalUsers: 1,
      };
    }
  }

  /**
   * Initialize user progress tracking
   */
  static async initializeUserProgress(userId: string): Promise<void> {
    try {
      // Check if user already has a progress record
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existing) {
        // Create initial progress record
        await supabase
          .from('user_progress')
          .insert([{
            user_id: userId,
            total_quizzes: 0,
            total_score: 0,
            current_streak: 0,
            longest_streak: 0,
            created_at: new Date().toISOString(),
          }]);
      }
    } catch (error) {
      console.error('Error initializing user progress:', error);
    }
  }

  /**
   * Calculate current streak of consecutive days with quiz activity
   */
  private static async calculateCurrentStreak(userId: string): Promise<number> {
    try {
      // Get recent quiz attempts ordered by date
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (!attempts || attempts.length === 0) return 0;

      // Group by date and count consecutive days
      const dates = [...new Set(attempts.map(attempt => 
        new Date(attempt.completed_at).toDateString()
      ))];

      let streak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Check if user has activity today or yesterday
      if (dates.includes(today) || dates.includes(yesterday)) {
        let currentDate = dates.includes(today) ? new Date() : new Date(Date.now() - 86400000);
        
        for (const dateStr of dates) {
          const checkDate = new Date(dateStr);
          if (checkDate.toDateString() === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }
} 