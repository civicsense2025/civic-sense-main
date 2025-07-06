// CivicSense Learning Analytics Export Service
// Comprehensive, branded progress reports with real PDF generation
import { Platform, Alert } from 'react-native';
import { supabase } from '../supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningHistoryData {
  user: {
    name: string;
    email: string;
    joinDate: string;
    profilePicture?: string;
    membershipTier: 'Free' | 'Plus' | 'Pro';
  };
  stats: {
    totalQuizzes: number;
    averageScore: number;
    currentStreak: number;
    longestStreak: number;
    hoursSpent: number;
    rank: number;
    achievementsUnlocked: number;
    totalTopicsCompleted: number;
    xpEarned: number;
    level: number;
    masteryCategories: string[];
  };
  recentActivity: QuizAttempt[];
  topicProgress: TopicProgress[];
  achievements: Achievement[];
  learningPods: LearningPodSummary[];
  strengths: string[];
  improvementAreas: string[];
  monthlyProgress: MonthlyProgress[];
  assessmentHistory: AssessmentResult[];
  learningInsights: LearningInsights;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  score: number;
  completedAt: string;
  timeSpent: number;
  questionsTotal: number;
  questionsCorrect: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface TopicProgress {
  topicId: string;
  topicName: string;
  category: string;
  attempts: number;
  averageScore: number;
  lastAttempt: string;
  mastery: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  icon: string;
  improvementTrend: 'improving' | 'stable' | 'declining';
  timeSpent: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'quiz' | 'streak' | 'mastery' | 'participation' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface LearningPodSummary {
  id: string;
  name: string;
  memberCount: number;
  joinedAt: string;
  sessionsAttended: number;
  contributions: number;
  role: 'member' | 'moderator' | 'leader';
}

export interface MonthlyProgress {
  month: string;
  quizzesCompleted: number;
  averageScore: number;
  hoursSpent: number;
  newTopicsExplored: number;
  xpEarned: number;
  streakDays: number;
}

export interface AssessmentResult {
  id: string;
  type: 'civic_literacy' | 'constitutional_knowledge' | 'government_structure';
  score: number;
  percentile: number;
  completedAt: string;
  timeSpent: number;
  strengths: string[];
  improvementAreas: string[];
}

export interface LearningInsights {
  processingSpeed: 'fast' | 'moderate' | 'deliberate';
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  optimalStudyTime: 'morning' | 'afternoon' | 'evening';
  learningStyle: 'visual' | 'analytical' | 'practical';
  retentionRate: number;
  consistencyScore: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

// ============================================================================
// CIVICSENSE LEARNING EXPORT SERVICE
// ============================================================================

export class LearningExportService {
  private static readonly BRAND_COLORS = {
    primary: '#3B82F6',      // Authority Blue
    secondary: '#10B981',    // Empowerment Green
    accent: '#F59E0B',       // Insight Gold
    text: '#1B1B1B',
    textSecondary: '#4A4A4A',
    background: '#FDFCF9',   // Truth White
    surface: '#FFF5D9',      // Warm Surface
  };

  private static readonly BRAND_INFO = {
    name: 'CivicSense',
    domain: 'civicsense.one',
    tagline: 'Harder to manipulate. More difficult to ignore. Impossible to fool.',
    mission: 'Empowering Democratic Participation Through Understanding Power',
    logo: '🏛️',
  };

  /**
   * Generate comprehensive learning history data for a user
   */
  static async generateLearningHistory(userId: string): Promise<LearningHistoryData> {
    try {
      console.log('🔄 Generating comprehensive learning history for user:', userId);

      // Fetch user profile with membership info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch quiz attempts with topic information
      const { data: quizAttempts } = await supabase
        .from('user_quiz_attempts')
        .select(`
          *,
          question_topics:topic_id (
            topic_title,
            category,
            description,
            difficulty
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(100);

      // Fetch topic progress and stats
      const { data: topicStats } = await supabase
        .from('user_topic_stats')
        .select('*')
        .eq('user_id', userId);

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            title,
            description,
            icon,
            category,
            rarity
          )
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      // Fetch assessment results
      const { data: assessments } = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      // Calculate comprehensive stats
      const stats = await this.calculateComprehensiveStats(userId, quizAttempts || []);
      
      // Process topic progress with insights
      const topicProgress = await this.processTopicProgress(topicStats || [], quizAttempts || []);
      
      // Format recent activity
      const recentActivity = this.formatRecentActivity(quizAttempts || []);
      
      // Process achievements with rarity
      const processedAchievements = this.processAchievements(achievements || []);
      
      // Generate monthly progress with XP tracking
      const monthlyProgress = this.generateMonthlyProgress(quizAttempts || []);
      
      // Analyze performance with detailed insights
      const { strengths, improvementAreas } = this.analyzePerformance(topicProgress);

      // Process assessment results
      const assessmentHistory = this.processAssessments(assessments || []);

      // Generate learning insights
      const learningInsights = this.generateLearningInsights(quizAttempts || [], topicProgress);

      console.log('✅ Learning history generated successfully');

      return {
        user: {
          name: profile?.full_name || 'Democratic Citizen',
          email: profile?.email || 'citizen@civicsense.one',
          joinDate: profile?.created_at || new Date().toISOString(),
          profilePicture: profile?.avatar_url,
          membershipTier: profile?.membership_tier || 'Free',
        },
        stats,
        recentActivity,
        topicProgress,
        achievements: processedAchievements,
        learningPods: [], // TODO: Implement when learning pods are ready
        strengths,
        improvementAreas,
        monthlyProgress,
        assessmentHistory,
        learningInsights,
      };
    } catch (error) {
      console.error('❌ Error generating learning history:', error);
      throw new Error('Failed to generate learning history. Please try again.');
    }
  }

  /**
   * Export learning history as branded PDF
   */
  static async exportToPDF(userId: string): Promise<{ success: boolean; uri?: string; error?: string }> {
    try {
      console.log('📄 Starting PDF export for user:', userId);
      
      const learningData = await this.generateLearningHistory(userId);
      const htmlContent = this.generateBrandedPDFHTML(learningData);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612, // 8.5 inches
        height: 792, // 11 inches
        margins: {
          left: 40,
          top: 40,
          right: 40,
          bottom: 40,
        },
      });

      // Move to a more accessible location with branded filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `CivicSense_Analytics_${learningData.user.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      const documentDirectory = FileSystem.documentDirectory;
      const newUri = documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      console.log('✅ PDF exported successfully:', newUri);
      return { success: true, uri: newUri };
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PDF export failed' 
      };
    }
  }

  /**
   * Share learning progress with pod members
   */
  static async shareWithPod(userId: string, podId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const learningData = await this.generateLearningHistory(userId);
      
      // Create a comprehensive summary for pod sharing
      const podSummary = {
        user_id: userId,
        user_name: learningData.user.name,
        shared_at: new Date().toISOString(),
        stats: {
          totalQuizzes: learningData.stats.totalQuizzes,
          averageScore: learningData.stats.averageScore,
          currentStreak: learningData.stats.currentStreak,
          level: learningData.stats.level,
          xpEarned: learningData.stats.xpEarned,
          topTopics: learningData.topicProgress
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5)
            .map(topic => ({
              name: topic.topicName,
              score: topic.averageScore,
              mastery: topic.mastery,
              category: topic.category
            }))
        },
        achievements: learningData.achievements
          .filter(a => a.rarity === 'rare' || a.rarity === 'legendary')
          .slice(-3), // Last 3 rare achievements
        insights: learningData.learningInsights,
        message: `${learningData.user.name} shared their democratic learning journey with the pod! 🏛️`,
        branding: {
          platform: 'CivicSense',
          domain: 'civicsense.one',
          mission: 'Empowering Democratic Participation'
        }
      };

      // Store in pod activity feed
      const { error } = await supabase
        .from('pod_activity_feed')
        .insert([{
          pod_id: podId,
          user_id: userId,
          activity_type: 'progress_share',
          content: podSummary,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Error sharing with pod:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sharing failed' 
      };
    }
  }

  /**
   * Share PDF externally using device sharing
   */
  static async sharePDF(pdfUri: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Your CivicSense Learning Analytics',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'PDF Saved Successfully! 📄',
          'Your CivicSense learning analytics report has been saved to your device. You can find it in your Files app.',
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('❌ Error sharing PDF:', error);
      Alert.alert(
        'Sharing Error',
        'Unable to share PDF. The report has been saved to your device.',
        [{ text: 'OK' }]
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async calculateComprehensiveStats(userId: string, quizAttempts: any[]) {
    const totalQuizzes = quizAttempts.length;
    const averageScore = totalQuizzes > 0 
      ? Math.round(quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalQuizzes)
      : 0;

    // Calculate streaks with proper date logic
    const currentStreak = await this.calculateCurrentStreak(userId, quizAttempts);
    const longestStreak = await this.calculateLongestStreak(userId, quizAttempts);

    // Calculate total hours spent
    const hoursSpent = Math.round(
      quizAttempts.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || 0), 0) / 3600 * 10
    ) / 10;

    // Get unique topics completed
    const uniqueTopics = new Set(quizAttempts.map(attempt => attempt.topic_id));
    const totalTopicsCompleted = uniqueTopics.size;

    // Calculate XP and level
    const xpEarned = quizAttempts.reduce((sum, attempt) => {
      const baseXP = Math.max(10, Math.floor((attempt.score || 0) * 0.5));
      const difficultyMultiplier = attempt.difficulty === 'hard' ? 1.5 : attempt.difficulty === 'medium' ? 1.2 : 1.0;
      return sum + Math.floor(baseXP * difficultyMultiplier);
    }, 0);

    const level = Math.floor(Math.sqrt(xpEarned / 100)) + 1;

    // Calculate mastery categories (topics with 80%+ average score)
    const masteryCategories = Array.from(new Set(
      quizAttempts
        .filter(attempt => (attempt.score || 0) >= 80)
        .map(attempt => attempt.question_topics?.category)
        .filter(Boolean)
    ));

    return {
      totalQuizzes,
      averageScore,
      currentStreak,
      longestStreak,
      hoursSpent,
      rank: 0, // TODO: Implement ranking system
      achievementsUnlocked: 0, // Will be updated when fetching achievements
      totalTopicsCompleted,
      xpEarned,
      level,
      masteryCategories,
    };
  }

  private static async calculateCurrentStreak(userId: string, quizAttempts: any[]): Promise<number> {
    // Group attempts by date
    const attemptsByDate = new Map<string, any[]>();
    quizAttempts.forEach(attempt => {
      const date = new Date(attempt.completed_at).toDateString();
      if (!attemptsByDate.has(date)) {
        attemptsByDate.set(date, []);
      }
      attemptsByDate.get(date)!.push(attempt);
    });

    // Calculate consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to 1 year
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (attemptsByDate.has(dateString)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private static async calculateLongestStreak(userId: string, quizAttempts: any[]): Promise<number> {
    // Group attempts by date
    const attemptsByDate = new Map<string, boolean>();
    quizAttempts.forEach(attempt => {
      if (attempt.completed_at) {
        const date = new Date(attempt.completed_at).toDateString();
        attemptsByDate.set(date, true);
      }
    });

    // Find longest consecutive sequence
    const dates = Array.from(attemptsByDate.keys()).sort();
    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDateStr = dates[i - 1];
        const currentDateStr = dates[i];
        if (prevDateStr && currentDateStr) {
          const prevDate = new Date(prevDateStr);
          const currentDate = new Date(currentDateStr);
          const dayDiff = Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
        }
      }
    }
    
    return Math.max(longestStreak, currentStreak);
  }

  private static async processTopicProgress(topicStats: any[], quizAttempts: any[]): Promise<TopicProgress[]> {
    return topicStats.map(stat => {
      const topicAttempts = quizAttempts.filter(attempt => attempt.topic_id === stat.topic_id);
      const totalTimeSpent = topicAttempts.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || 0), 0);
      
      // Calculate improvement trend
      const recentScores = topicAttempts.slice(0, 5).map(a => a.score || 0);
      const olderScores = topicAttempts.slice(-5).map(a => a.score || 0);
      const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length || 0;
      const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length || 0;
      
      let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > olderAvg + 5) improvementTrend = 'improving';
      else if (recentAvg < olderAvg - 5) improvementTrend = 'declining';

      return {
        topicId: stat.topic_id,
        topicName: stat.topic_name || 'Unknown Topic',
        category: stat.category || 'General',
        attempts: stat.attempts_count || 0,
        averageScore: stat.average_score || 0,
        lastAttempt: stat.last_attempt_at || '',
        mastery: this.determineMastery(stat.average_score, stat.attempts_count),
        icon: this.getTopicIcon(stat.category || 'default'),
        improvementTrend,
        timeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
      };
    });
  }

  private static determineMastery(averageScore: number, attempts: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (attempts < 2) return 'beginner';
    if (averageScore < 50) return 'beginner';
    if (averageScore < 70) return 'intermediate';
    if (averageScore < 85) return 'advanced';
    return 'expert';
  }

  private static getTopicIcon(category?: string): string {
    const categoryIcons: Record<string, string> = {
      'constitutional_law': '⚖️',
      'government_structure': '🏛️',
      'voting_rights': '🗳️',
      'civil_liberties': '🗽',
      'federal_system': '🇺🇸',
      'legislative_process': '📜',
      'executive_powers': '🏢',
      'judicial_system': '⚖️',
      'state_government': '🏛️',
      'local_government': '🏙️',
      'political_parties': '🎭',
      'elections': '📊',
      'civic_participation': '🤝',
      'policy_analysis': '📈',
      'political_history': '📚',
      'current_events': '📰',
      'economics': '💰',
      'international_relations': '🌍',
      'media_literacy': '📺',
      'activism': '✊',
      'default': '📚',
    };
    const safeCategory = category ? category.toLowerCase() : 'default';
    const icon = categoryIcons[safeCategory];
    return icon || categoryIcons.default!;
  }

  private static formatRecentActivity(quizAttempts: any[]): QuizAttempt[] {
    return quizAttempts.slice(0, 15).map(attempt => ({
      id: attempt.id,
      topic: attempt.question_topics?.topic_title || 'Unknown Topic',
      score: attempt.score || 0,
      completedAt: attempt.completed_at,
      timeSpent: attempt.time_spent_seconds || 0,
      questionsTotal: attempt.total_questions || 0,
      questionsCorrect: attempt.questions_correct || 0,
      difficulty: attempt.question_topics?.difficulty || 'medium',
      category: attempt.question_topics?.category || 'General',
    }));
  }

  private static processAchievements(achievements: any[]): Achievement[] {
    return achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.achievements?.title || 'Achievement',
      description: achievement.achievements?.description || 'Unlocked achievement',
      icon: achievement.achievements?.icon || '🏆',
      unlockedAt: achievement.unlocked_at,
      category: achievement.achievements?.category || 'quiz',
      rarity: achievement.achievements?.rarity || 'common',
    }));
  }

  private static generateMonthlyProgress(quizAttempts: any[]): MonthlyProgress[] {
    const monthlyData: Record<string, any> = {};

    quizAttempts.forEach(attempt => {
      if (attempt.completed_at) {
        const date = new Date(attempt.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            quizzesCompleted: 0,
            totalScore: 0,
            hoursSpent: 0,
            topics: new Set(),
            xpEarned: 0,
            dates: new Set(),
          };
        }
        
        monthlyData[monthKey].quizzesCompleted++;
        monthlyData[monthKey].totalScore += attempt.score || 0;
        monthlyData[monthKey].hoursSpent += (attempt.time_spent_seconds || 0) / 3600;
        monthlyData[monthKey].topics.add(attempt.topic_id);
        monthlyData[monthKey].xpEarned += Math.floor((attempt.score || 0) * 0.5);
        monthlyData[monthKey].dates.add(date.toDateString());
      }
    });

    return Object.values(monthlyData)
      .map((data: any) => ({
        month: data.month,
        quizzesCompleted: data.quizzesCompleted,
        averageScore: Math.round(data.totalScore / data.quizzesCompleted) || 0,
        hoursSpent: Math.round(data.hoursSpent * 10) / 10,
        newTopicsExplored: data.topics.size,
        xpEarned: data.xpEarned,
        streakDays: data.dates.size,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months
  }

  private static processAssessments(assessments: any[]): AssessmentResult[] {
    return assessments.map(assessment => ({
      id: assessment.id,
      type: assessment.assessment_type,
      score: assessment.score || 0,
      percentile: assessment.percentile || 0,
      completedAt: assessment.completed_at,
      timeSpent: assessment.time_spent_seconds || 0,
      strengths: assessment.strengths || [],
      improvementAreas: assessment.improvement_areas || [],
    }));
  }

  private static generateLearningInsights(quizAttempts: any[], topicProgress: TopicProgress[]): LearningInsights {
    // Calculate processing speed based on time per question
    const avgTimePerQuestion = quizAttempts.reduce((sum, attempt) => {
      const timePerQ = (attempt.time_spent_seconds || 0) / (attempt.total_questions || 1);
      return sum + timePerQ;
    }, 0) / (quizAttempts.length || 1);

    const processingSpeed = avgTimePerQuestion < 30 ? 'fast' : avgTimePerQuestion < 60 ? 'moderate' : 'deliberate';

    // Determine preferred difficulty based on performance
    const difficultyPerformance = {
      easy: quizAttempts.filter(a => a.question_topics?.difficulty === 'easy').reduce((sum, a) => sum + (a.score || 0), 0),
      medium: quizAttempts.filter(a => a.question_topics?.difficulty === 'medium').reduce((sum, a) => sum + (a.score || 0), 0),
      hard: quizAttempts.filter(a => a.question_topics?.difficulty === 'hard').reduce((sum, a) => sum + (a.score || 0), 0),
    };

    // Find the difficulty with the highest total score
    let preferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    let maxScore = 0;
    
    (Object.entries(difficultyPerformance) as [string, number][]).forEach(([difficulty, score]) => {
      if (score > maxScore) {
        maxScore = score;
        preferredDifficulty = difficulty as 'easy' | 'medium' | 'hard';
      }
    });

    // Calculate retention rate (improvement over time)
    const retentionRate = topicProgress.filter(t => t.improvementTrend === 'improving').length / (topicProgress.length || 1) * 100;

    // Calculate consistency score (how regular study sessions are)
    const dates = quizAttempts.map(a => new Date(a.completed_at).toDateString());
    const uniqueDates = new Set(dates);
    const consistencyScore = Math.min(100, (uniqueDates.size / 30) * 100); // Based on 30-day period

    return {
      processingSpeed,
      preferredDifficulty,
      optimalStudyTime: 'evening', // TODO: Calculate based on performance by time of day
      learningStyle: 'analytical', // TODO: Implement based on question type performance
      retentionRate: Math.round(retentionRate),
      consistencyScore: Math.round(consistencyScore),
      engagementLevel: quizAttempts.length > 50 ? 'high' : quizAttempts.length > 20 ? 'medium' : 'low',
    };
  }

  private static analyzePerformance(topicProgress: TopicProgress[]): { strengths: string[]; improvementAreas: string[] } {
    const strengths = topicProgress
      .filter(topic => topic.averageScore >= 80 && topic.attempts >= 3)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5)
      .map(topic => topic.topicName);

    const improvementAreas = topicProgress
      .filter(topic => topic.averageScore < 60 && topic.attempts >= 2)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5)
      .map(topic => topic.topicName);

    return { strengths, improvementAreas };
  }

  /**
   * Generate comprehensive branded HTML content for PDF export
   */
  private static generateBrandedPDFHTML(data: LearningHistoryData): string {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CivicSense Learning Analytics Report</title>
        <style>
            * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
            }
            
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                line-height: 1.6; 
                color: ${this.BRAND_COLORS.text}; 
                background: ${this.BRAND_COLORS.background};
                padding: 0;
                margin: 0;
            }

            /* Header with CivicSense Branding */
            .header { 
                background: linear-gradient(135deg, ${this.BRAND_COLORS.primary} 0%, ${this.BRAND_COLORS.secondary} 100%);
                color: white;
                padding: 30px 40px;
                margin-bottom: 30px;
                text-align: center;
                border-bottom: 4px solid ${this.BRAND_COLORS.accent};
            }
            
            .logo-section {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .logo { 
                font-size: 36px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            
            .brand-name {
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }
            
            .tagline {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 500;
                margin-bottom: 20px;
                font-style: italic;
            }
            
            .report-title {
                font-size: 28px;
                font-weight: 600;
                margin: 0;
            }
            
            .report-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin-top: 8px;
            }

            /* User Information */
            .user-section {
                background: white;
                border-radius: 16px;
                padding: 30px;
                margin: 0 40px 30px 40px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .user-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${this.BRAND_COLORS.primary}, ${this.BRAND_COLORS.secondary});
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 32px;
                font-weight: 600;
            }
            
            .user-details h2 {
                color: ${this.BRAND_COLORS.text};
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .user-meta {
                color: ${this.BRAND_COLORS.textSecondary};
                font-size: 14px;
                line-height: 1.5;
            }
            
            .membership-badge {
                display: inline-block;
                background: ${this.BRAND_COLORS.accent};
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-top: 8px;
            }

            /* Statistics Grid */
            .stats-section {
                margin: 30px 40px;
            }
            
            .section-title {
                font-size: 22px;
                font-weight: 600;
                color: ${this.BRAND_COLORS.text};
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 2px solid ${this.BRAND_COLORS.primary};
                padding-bottom: 8px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                border: 1px solid #e5e7eb;
                transition: transform 0.2s;
            }
            
            .stat-value {
                font-size: 28px;
                font-weight: 700;
                color: ${this.BRAND_COLORS.primary};
                margin-bottom: 8px;
                display: block;
            }
            
            .stat-label {
                font-size: 12px;
                color: ${this.BRAND_COLORS.textSecondary};
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            /* Learning Insights */
            .insights-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .insight-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #e5e7eb;
            }
            
            .insight-title {
                font-size: 16px;
                font-weight: 600;
                color: ${this.BRAND_COLORS.text};
                margin-bottom: 8px;
            }
            
            .insight-value {
                font-size: 18px;
                font-weight: 700;
                color: ${this.BRAND_COLORS.secondary};
                text-transform: capitalize;
            }

            /* Topic Progress */
            .topics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .topic-card {
                background: white;
                border-radius: 10px;
                padding: 16px;
                border: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .topic-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .topic-icon {
                font-size: 20px;
            }
            
            .topic-details h4 {
                font-size: 14px;
                font-weight: 600;
                color: ${this.BRAND_COLORS.text};
                margin-bottom: 4px;
            }
            
            .mastery-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .mastery-expert { background: #10B981; color: white; }
            .mastery-advanced { background: #3B82F6; color: white; }
            .mastery-intermediate { background: #F59E0B; color: white; }
            .mastery-beginner { background: #EF4444; color: white; }
            
            .topic-score {
                font-size: 18px;
                font-weight: 700;
                color: ${this.BRAND_COLORS.primary};
            }

            /* Recent Activity */
            .activity-list {
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                overflow: hidden;
            }
            
            .activity-item {
                padding: 16px 20px;
                border-bottom: 1px solid #f1f5f9;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .activity-item:last-child { border-bottom: none; }
            
            .activity-details h4 {
                font-size: 14px;
                font-weight: 600;
                color: ${this.BRAND_COLORS.text};
                margin-bottom: 4px;
            }
            
            .activity-meta {
                font-size: 12px;
                color: ${this.BRAND_COLORS.textSecondary};
            }
            
            .activity-score {
                text-align: right;
            }
            
            .score-value {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            
            .score-time {
                font-size: 11px;
                color: ${this.BRAND_COLORS.textSecondary};
            }

            /* Performance Analysis */
            .performance-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            
            .performance-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .strengths h3 { color: ${this.BRAND_COLORS.secondary}; }
            .improvements h3 { color: ${this.BRAND_COLORS.accent}; }
            
            .performance-list {
                list-style: none;
                background: white;
                border-radius: 10px;
                padding: 20px;
                border: 1px solid #e5e7eb;
            }
            
            .performance-list li {
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .performance-list li:last-child { border-bottom: none; }

            /* Achievements */
            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .achievement-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                border: 1px solid #e5e7eb;
            }
            
            .achievement-icon {
                font-size: 28px;
                margin-bottom: 10px;
                display: block;
            }
            
            .achievement-title {
                font-size: 14px;
                font-weight: 600;
                color: ${this.BRAND_COLORS.text};
                margin-bottom: 6px;
            }
            
            .achievement-date {
                font-size: 11px;
                color: ${this.BRAND_COLORS.textSecondary};
            }
            
            .rarity-legendary { border-color: #9333EA; background: #F3E8FF; }
            .rarity-rare { border-color: #2563EB; background: #EFF6FF; }
            .rarity-uncommon { border-color: #059669; background: #ECFDF5; }

            /* Footer */
            .footer {
                background: ${this.BRAND_COLORS.surface};
                padding: 30px 40px;
                text-align: center;
                margin-top: 40px;
                border-top: 3px solid ${this.BRAND_COLORS.primary};
            }
            
            .footer-content {
                max-width: 600px;
                margin: 0 auto;
            }
            
            .footer h3 {
                color: ${this.BRAND_COLORS.primary};
                font-size: 20px;
                margin-bottom: 15px;
            }
            
            .footer p {
                color: ${this.BRAND_COLORS.textSecondary};
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 15px;
            }
            
            .footer-link {
                color: ${this.BRAND_COLORS.primary};
                font-weight: 600;
                text-decoration: none;
                font-size: 16px;
            }

            /* Page breaks */
            .page-break { page-break-before: always; }
            
            /* Print optimizations */
            @media print {
                .stats-grid { grid-template-columns: repeat(2, 1fr); }
                .topics-grid { grid-template-columns: 1fr; }
                .achievements-grid { grid-template-columns: repeat(2, 1fr); }
            }
        </style>
    </head>
    <body>
        <!-- Branded Header -->
        <div class="header">
            <div class="logo-section">
                <span class="logo">${this.BRAND_INFO.logo}</span>
                <span class="brand-name">${this.BRAND_INFO.name}</span>
            </div>
            <div class="tagline">${this.BRAND_INFO.tagline}</div>
            <h1 class="report-title">Learning Analytics Report</h1>
            <p class="report-subtitle">Comprehensive Democratic Education Progress • Generated on ${currentDate}</p>
        </div>

        <!-- User Information -->
        <div class="user-section">
            <div class="user-info">
                <div class="user-avatar">
                    ${data.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div class="user-details">
                    <h2>${data.user.name}</h2>
                    <div class="user-meta">
                        <div><strong>Email:</strong> ${data.user.email}</div>
                        <div><strong>Member Since:</strong> ${new Date(data.user.joinDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</div>
                        <div><strong>Current Level:</strong> ${data.stats.level}</div>
                        <span class="membership-badge">${data.user.membershipTier} Member</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Learning Statistics -->
        <div class="stats-section">
            <h2 class="section-title">📊 Learning Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${data.stats.totalQuizzes}</span>
                    <div class="stat-label">Quizzes Completed</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.averageScore}%</span>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.currentStreak}</span>
                    <div class="stat-label">Current Streak</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.hoursSpent}h</span>
                    <div class="stat-label">Study Time</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.level}</span>
                    <div class="stat-label">Current Level</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.xpEarned.toLocaleString()}</span>
                    <div class="stat-label">XP Earned</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.totalTopicsCompleted}</span>
                    <div class="stat-label">Topics Mastered</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.stats.achievementsUnlocked}</span>
                    <div class="stat-label">Achievements</div>
                </div>
            </div>
        </div>

        <!-- Learning Insights -->
        <div class="stats-section">
            <h2 class="section-title">🧠 Learning Insights</h2>
            <div class="insights-grid">
                <div class="insight-card">
                    <div class="insight-title">Processing Speed</div>
                    <div class="insight-value">${data.learningInsights.processingSpeed}</div>
                </div>
                <div class="insight-card">
                    <div class="insight-title">Preferred Difficulty</div>
                    <div class="insight-value">${data.learningInsights.preferredDifficulty}</div>
                </div>
                <div class="insight-card">
                    <div class="insight-title">Retention Rate</div>
                    <div class="insight-value">${data.learningInsights.retentionRate}%</div>
                </div>
                <div class="insight-card">
                    <div class="insight-title">Consistency Score</div>
                    <div class="insight-value">${data.learningInsights.consistencyScore}%</div>
                </div>
            </div>
        </div>

        <!-- Topic Mastery -->
        <div class="stats-section">
            <h2 class="section-title">📚 Topic Mastery</h2>
            <div class="topics-grid">
                ${data.topicProgress.slice(0, 20).map(topic => `
                    <div class="topic-card">
                        <div class="topic-info">
                            <span class="topic-icon">${topic.icon}</span>
                            <div class="topic-details">
                                <h4>${topic.topicName}</h4>
                                <span class="mastery-badge mastery-${topic.mastery}">${topic.mastery}</span>
                            </div>
                        </div>
                        <div class="topic-score">${topic.averageScore}%</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Page Break -->
        <div class="page-break"></div>

        <!-- Recent Activity -->
        <div class="stats-section">
            <h2 class="section-title">📈 Recent Activity</h2>
            <div class="activity-list">
                ${data.recentActivity.slice(0, 15).map(activity => `
                    <div class="activity-item">
                        <div class="activity-details">
                            <h4>${activity.topic}</h4>
                            <div class="activity-meta">
                                ${new Date(activity.completedAt).toLocaleDateString()} • ${activity.category} • ${activity.difficulty}
                            </div>
                        </div>
                        <div class="activity-score">
                            <div class="score-value" style="color: ${activity.score >= 80 ? '#10B981' : activity.score >= 60 ? '#F59E0B' : '#EF4444'}">
                                ${activity.score}%
                            </div>
                            <div class="score-time">${Math.round(activity.timeSpent / 60)} min</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Performance Analysis -->
        <div class="stats-section">
            <h2 class="section-title">💪 Performance Analysis</h2>
            <div class="performance-grid">
                <div class="strengths">
                    <h3>✅ Strengths</h3>
                    <ul class="performance-list">
                        ${data.strengths.slice(0, 5).map(strength => `
                            <li>🎯 ${strength}</li>
                        `).join('')}
                        ${data.strengths.length === 0 ? '<li>Keep learning to discover your strengths!</li>' : ''}
                    </ul>
                </div>
                <div class="improvements">
                    <h3>📈 Growth Opportunities</h3>
                    <ul class="performance-list">
                        ${data.improvementAreas.slice(0, 5).map(area => `
                            <li>💡 ${area}</li>
                        `).join('')}
                        ${data.improvementAreas.length === 0 ? '<li>Great work! Continue challenging yourself.</li>' : ''}
                    </ul>
                </div>
            </div>
        </div>

        <!-- Achievements -->
        ${data.achievements.length > 0 ? `
        <div class="stats-section">
            <h2 class="section-title">🏆 Recent Achievements</h2>
            <div class="achievements-grid">
                ${data.achievements.slice(0, 9).map(achievement => `
                    <div class="achievement-card rarity-${achievement.rarity}">
                        <span class="achievement-icon">${achievement.icon}</span>
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-date">${new Date(achievement.unlockedAt).toLocaleDateString()}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <h3>Continue Your Democratic Learning Journey</h3>
                <p>
                    This report represents your progress in understanding how power works in America. 
                    You're developing the knowledge and skills needed to be an informed, engaged citizen 
                    who can't be manipulated, ignored, or fooled.
                </p>
                <p>
                    <strong>${this.BRAND_INFO.mission}</strong>
                </p>
                <p>
                    Keep learning, keep questioning, keep participating in democracy.
                </p>
                <a href="https://${this.BRAND_INFO.domain}" class="footer-link">
                    Visit ${this.BRAND_INFO.domain} to continue your journey
                </a>
            </div>
        </div>
    </body>
    </html>
    `;
  }
} 