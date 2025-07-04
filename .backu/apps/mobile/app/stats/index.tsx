import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius } from '../../lib/theme';
import { 
  getUserOverallStats,
  getUserCategoryProgress,
  getUserWeeklyActivity,
  getUserAchievementCount,
  calculateLevel,
  calculateXPToNextLevel,
  calculateTotalXPForNextLevel,
  generateLearningInsights
} from '../../lib/services/user-stats-service';

const { width: screenWidth } = Dimensions.get('window');

interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number; // in minutes
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

interface CategoryProgress {
  id: string;
  name: string;
  emoji: string;
  completed: number;
  total: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: Date;
}

interface WeeklyActivity {
  day: string;
  quizzes: number;
  score: number;
  timeSpent: number;
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'streak' | 'milestone';
  title: string;
  description: string;
  icon: string;
  actionable?: boolean;
  action?: () => void;
}

export default function StatsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load real user statistics from database
      const [
        userStatsResult,
        categoryProgressResult, 
        weeklyActivityResult,
        achievementsResult
      ] = await Promise.all([
        // User overall stats
        getUserOverallStats(user.id),
        // Category progress  
        getUserCategoryProgress(user.id),
        // Weekly activity
        getUserWeeklyActivity(user.id),
        // Achievement count
        getUserAchievementCount(user.id)
      ]);

      // Calculate derived stats
      const overallStats: UserStats = {
        totalQuizzes: userStatsResult.totalQuizzes || 0,
        totalQuestions: userStatsResult.totalQuestions || 0,
        correctAnswers: userStatsResult.correctAnswers || 0,
        averageScore: userStatsResult.totalQuestions > 0 
          ? Math.round((userStatsResult.correctAnswers / userStatsResult.totalQuestions) * 100)
          : 0,
        totalTimeSpent: userStatsResult.totalTimeSpent || 0,
        currentStreak: userStatsResult.currentStreak || 0,
        longestStreak: userStatsResult.longestStreak || 0,
        totalXP: userStatsResult.totalXP || 0,
        level: calculateLevel(userStatsResult.totalXP || 0),
        xpToNextLevel: calculateXPToNextLevel(userStatsResult.totalXP || 0),
        totalXPForNextLevel: calculateTotalXPForNextLevel(userStatsResult.totalXP || 0),
        achievements: achievementsResult.count || 0,
        rank: userStatsResult.globalRank || 0,
        totalUsers: userStatsResult.totalUsers || 1,
      };

      // Generate learning insights based on real data
      const insights = generateLearningInsights(overallStats, categoryProgressResult, weeklyActivityResult);

      setStats(overallStats);
      setCategoryProgress(categoryProgressResult);
      setWeeklyActivity(weeklyActivityResult);
      setInsights(insights);
    } catch (error) {
      console.error('Error loading stats:', error);
      
      // Fallback to empty stats if error occurs
      const emptyStats: UserStats = {
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
        totalUsers: 0,
      };

      const emptyWeeklyActivity: WeeklyActivity[] = [
        { day: 'Mon', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Tue', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Wed', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Thu', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Fri', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Sat', quizzes: 0, score: 0, timeSpent: 0 },
        { day: 'Sun', quizzes: 0, score: 0, timeSpent: 0 },
      ];

      setStats(emptyStats);
      setCategoryProgress([]);
      setWeeklyActivity(emptyWeeklyActivity);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const getInsightColor = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength': return '#10B981';
      case 'improvement': return '#F59E0B';
      case 'streak': return '#EF4444';
      case 'milestone': return '#8B5CF6';
      default: return theme.primary;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getActivityHeight = (quizzes: number) => {
    const maxQuizzes = Math.max(...weeklyActivity.map(d => d.quizzes));
    return Math.max((quizzes / maxQuizzes) * 60, 4);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading your stats..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit">Stats not available</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <Text variant="title2" color="inherit">Your Stats</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Level Progress */}
        <Card style={styles.levelCard} variant="elevated">
          <View style={styles.levelContent}>
            <View style={styles.levelInfo}>
              <Text variant="title1" color="primary">Level {stats.level}</Text>
              <Text variant="body" color="secondary">
                {stats.xpToNextLevel} XP to Level {stats.level + 1}
              </Text>
            </View>
            <View style={styles.xpContainer}>
              <Text variant="title3" color="inherit">
                <AnimatedCounter value={stats.totalXP} /> XP
              </Text>
              <ProgressBar
                progress={1 - (stats.xpToNextLevel / stats.totalXPForNextLevel)}
                height={8}
                backgroundColor="rgba(0,0,0,0.1)"
                color={theme.primary}
                style={styles.xpProgress}
              />
            </View>
          </View>
        </Card>

        {/* Overview Stats */}
        <View style={styles.overviewGrid}>
          <AnimatedCard style={styles.statCard} variant="outlined">
            <View style={styles.statContent}>
              <Text variant="title2" color="primary">
                <AnimatedCounter value={stats.totalQuizzes} />
              </Text>
              <Text variant="footnote" color="secondary">Quizzes Taken</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard} variant="outlined">
            <View style={styles.statContent}>
              <Text variant="title2" color="primary">
                <AnimatedCounter value={stats.averageScore} suffix="%" />
              </Text>
              <Text variant="footnote" color="secondary">Average Score</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard} variant="outlined">
            <View style={styles.statContent}>
              <Text variant="title2" color="primary">
                <AnimatedCounter value={stats.currentStreak} />
              </Text>
              <Text variant="footnote" color="secondary">Current Streak</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard} variant="outlined">
            <View style={styles.statContent}>
              <Text variant="title2" color="primary">
                #{stats.rank}
              </Text>
              <Text variant="footnote" color="secondary">Global Rank</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Weekly Activity */}
        <Card style={styles.activityCard} variant="outlined">
          <View style={styles.activityContent}>
            <Text variant="title3" color="inherit" style={styles.sectionTitle}>
              📊 This Week's Activity
            </Text>
            <View style={styles.activityChart}>
              {weeklyActivity.map((day, index) => (
                <View key={day.day} style={styles.activityBar}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: getActivityHeight(day.quizzes),
                        backgroundColor: day.quizzes > 0 ? theme.primary : 'rgba(0,0,0,0.1)',
                      }
                    ]}
                  />
                  <Text variant="footnote" color="secondary" style={styles.dayLabel}>
                    {day.day}
                  </Text>
                  <Text variant="footnote" color="primary" style={styles.dayCount}>
                    {day.quizzes}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Category Progress */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            📚 Category Progress
          </Text>
          {categoryProgress.map((category, index) => (
            <AnimatedCard
              key={category.id}
              style={styles.categoryCard}
              variant="outlined"
              delay={index * 100}
              onPress={() => router.push(`/category/${category.id}` as any)}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <View style={styles.categoryInfo}>
                    <Text variant="callout" color="inherit">{category.name}</Text>
                    <Text variant="footnote" color="secondary">
                      {category.completed}/{category.total} topics • {category.averageScore}% avg
                    </Text>
                  </View>
                  <Text variant="footnote" color="primary">
                    {formatTime(category.timeSpent)}
                  </Text>
                </View>
                <ProgressBar
                  progress={category.completed / category.total}
                  height={6}
                  backgroundColor="rgba(0,0,0,0.1)"
                  color={theme.primary}
                  style={styles.categoryProgress}
                />
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Learning Insights */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            💡 Learning Insights
          </Text>
          {insights.map((insight, index) => (
            <AnimatedCard
              key={insight.id}
              style={styles.insightCard}
              variant="outlined"
              delay={index * 100}
              onPress={insight.actionable && insight.action ? insight.action : () => {}}
            >
              <View style={styles.insightContent}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: `${getInsightColor(insight.type)}20` }
                  ]}
                >
                  <Text style={styles.insightEmoji}>{insight.icon}</Text>
                </View>
                <View style={styles.insightInfo}>
                  <Text variant="callout" color="inherit">{insight.title}</Text>
                  <Text variant="footnote" color="secondary">{insight.description}</Text>
                </View>
                {insight.actionable && (
                  <Text style={[styles.arrow, { color: theme.primary }]}>→</Text>
                )}
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Detailed Stats */}
        <Card style={styles.detailedStatsCard} variant="outlined">
          <View style={styles.detailedStatsContent}>
            <Text variant="title3" color="inherit" style={styles.sectionTitle}>
              📈 Detailed Statistics
            </Text>
            <View style={styles.detailedStatsGrid}>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Total Questions</Text>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={stats.totalQuestions} />
                </Text>
              </View>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Correct Answers</Text>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={stats.correctAnswers} />
                </Text>
              </View>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Time Spent</Text>
                <Text variant="title3" color="inherit">
                  {formatTime(stats.totalTimeSpent)}
                </Text>
              </View>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Longest Streak</Text>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={stats.longestStreak} /> days
                </Text>
              </View>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Achievements</Text>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={stats.achievements} />
                </Text>
              </View>
              <View style={styles.detailedStat}>
                <Text variant="body" color="secondary">Accuracy Rate</Text>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter 
                    value={Math.round((stats.correctAnswers / stats.totalQuestions) * 100)} 
                    suffix="%" 
                  />
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  levelCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  xpContainer: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  xpProgress: {
    marginTop: spacing.sm,
    width: 120,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    width: (screenWidth - spacing.md * 3) / 2,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  activityCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  activityContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  activityChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  activityBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  dayLabel: {
    marginBottom: spacing.xs,
  },
  dayCount: {
    fontWeight: '600',
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
  },
  categoryCard: {
    marginBottom: spacing.sm,
  },
  categoryContent: {
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryProgress: {
    marginTop: spacing.sm,
  },
  insightCard: {
    marginBottom: spacing.sm,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightInfo: {
    flex: 1,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailedStatsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  detailedStatsContent: {
    padding: spacing.md,
  },
  detailedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailedStat: {
    width: (screenWidth - spacing.md * 4) / 2,
    alignItems: 'center',
    padding: spacing.sm,
  },
}); 