import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
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

const { width: screenWidth } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'quiz' | 'streak' | 'social' | 'learning' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
  requirements: string[];
  hint?: string;
}

interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface UserAchievementStats {
  totalUnlocked: number;
  totalPoints: number;
  completionPercentage: number;
  recentAchievements: Achievement[];
  nextMilestone?: Achievement;
}

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserAchievementStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories: AchievementCategory[] = [
    { id: 'all', name: 'All', icon: '🏆', color: theme.primary },
    { id: 'quiz', name: 'Quiz Master', icon: '🧠', color: '#10B981' },
    { id: 'streak', name: 'Consistency', icon: '🔥', color: '#F59E0B' },
    { id: 'social', name: 'Community', icon: '👥', color: '#8B5CF6' },
    { id: 'learning', name: 'Scholar', icon: '📚', color: '#06B6D4' },
    { id: 'special', name: 'Special', icon: '⭐', color: '#EF4444' },
  ];

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real app, fetch from database
      const mockAchievements: Achievement[] = [
        {
          id: 'first-quiz',
          title: 'First Steps',
          description: 'Complete your first quiz',
          icon: '🎯',
          category: 'quiz',
          rarity: 'common',
          points: 10,
          isUnlocked: true,
          unlockedAt: new Date('2024-01-15'),
          requirements: ['Complete 1 quiz'],
        },
        {
          id: 'quiz-master',
          title: 'Quiz Master',
          description: 'Complete 50 quizzes',
          icon: '🧠',
          category: 'quiz',
          rarity: 'rare',
          points: 100,
          isUnlocked: false,
          progress: {
            current: 23,
            target: 50,
            unit: 'quizzes'
          },
          requirements: ['Complete 50 quizzes'],
          hint: 'Keep taking quizzes to unlock this achievement!'
        },
        {
          id: 'perfect-score',
          title: 'Perfect Score',
          description: 'Get 100% on any quiz',
          icon: '💯',
          category: 'quiz',
          rarity: 'epic',
          points: 50,
          isUnlocked: true,
          unlockedAt: new Date('2024-01-20'),
          requirements: ['Score 100% on a quiz'],
        },
        {
          id: 'streak-week',
          title: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          category: 'streak',
          rarity: 'common',
          points: 25,
          isUnlocked: false,
          progress: {
            current: 4,
            target: 7,
            unit: 'days'
          },
          requirements: ['Take a quiz for 7 consecutive days'],
          hint: 'Take a quiz daily to build your streak!'
        },
        {
          id: 'constitution-expert',
          title: 'Constitution Expert',
          description: 'Master all constitutional topics',
          icon: '📜',
          category: 'learning',
          rarity: 'legendary',
          points: 200,
          isUnlocked: false,
          progress: {
            current: 3,
            target: 8,
            unit: 'topics'
          },
          requirements: ['Complete all constitutional law topics'],
          hint: 'Study constitutional topics to unlock this rare achievement!'
        },
        {
          id: 'early-adopter',
          title: 'Early Adopter',
          description: 'One of the first 100 users',
          icon: '🚀',
          category: 'special',
          rarity: 'legendary',
          points: 500,
          isUnlocked: true,
          unlockedAt: new Date('2024-01-01'),
          requirements: ['Be among the first 100 users'],
        },
      ];
      
      const mockStats: UserAchievementStats = {
        totalUnlocked: mockAchievements.filter(a => a.isUnlocked).length,
        totalPoints: mockAchievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0),
        completionPercentage: (mockAchievements.filter(a => a.isUnlocked).length / mockAchievements.length) * 100,
        recentAchievements: mockAchievements.filter(a => a.isUnlocked).slice(0, 3),
        nextMilestone: mockAchievements.find(a => !a.isUnlocked && a.progress),
      };
      
      setAchievements(mockAchievements);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9B59B6';
      case 'rare': return '#3498DB';
      default: return theme.primary;
    }
  };

  const getRarityGradient = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return ['#FFD700', '#FFA500'];
      case 'epic': return ['#9B59B6', '#8E44AD'];
      case 'rare': return ['#3498DB', '#2980B9'];
      default: return [theme.primary, theme.primaryDark || theme.primary];
    }
  };

  const renderAchievement = ({ item, index }: { item: Achievement; index: number }) => (
    <AnimatedCard
      style={[
        styles.achievementCard,
        !item.isUnlocked && styles.lockedCard
      ]}
      variant={item.isUnlocked ? "elevated" : "outlined"}
      delay={index * 100}
    >
      <View style={styles.achievementContent}>
        {/* Icon and Rarity */}
        <View style={[
          styles.iconContainer,
          { borderColor: getRarityColor(item.rarity) }
        ]}>
          <Text style={[
            styles.achievementIcon,
            !item.isUnlocked && styles.lockedIcon
          ]}>
            {item.isUnlocked ? item.icon : '🔒'}
          </Text>
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(item.rarity) }
            ]}
          >
            <Text style={styles.rarityText}>
              {item.rarity.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.achievementInfo}>
          <Text
            variant="callout"
            color={item.isUnlocked ? "inherit" : "secondary"}
            style={styles.achievementTitle}
          >
            {item.title}
          </Text>
          <Text
            variant="footnote"
            color="secondary"
            style={styles.achievementDescription}
          >
            {item.isUnlocked ? item.description : (item.hint || item.description)}
          </Text>
          
          {/* Progress Bar */}
          {item.progress && !item.isUnlocked && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={item.progress.current / item.progress.target}
                height={6}
                backgroundColor="rgba(0,0,0,0.1)"
                fillColor={getRarityColor(item.rarity)}
                style={styles.progressBar}
              />
              <Text variant="footnote" color="secondary" style={styles.progressText}>
                {item.progress.current} / {item.progress.target} {item.progress.unit}
              </Text>
            </View>
          )}
          
          {/* Unlock Date */}
          {item.isUnlocked && item.unlockedAt && (
            <Text variant="footnote" color="secondary" style={styles.unlockedDate}>
              Unlocked {item.unlockedAt.toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text variant="callout" color={item.isUnlocked ? "primary" : "secondary"}>
            {item.points}
          </Text>
          <Text variant="footnote" color="secondary">pts</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading achievements..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text variant="title2" color="inherit">Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Summary */}
      {stats && (
        <Card style={styles.statsCard} variant="elevated">
          <View style={styles.statsContent}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="title2" color="primary">
                  <AnimatedCounter value={stats.totalUnlocked} />
                </Text>
                <Text variant="footnote" color="secondary">Unlocked</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="title2" color="inherit">
                  <AnimatedCounter value={stats.totalPoints} />
                </Text>
                <Text variant="footnote" color="secondary">Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="title2" color="inherit">
                  <AnimatedCounter value={Math.round(stats.completionPercentage)} suffix="%" />
                </Text>
                <Text variant="footnote" color="secondary">Complete</Text>
              </View>
            </View>
            
            {/* Next Milestone */}
            {stats.nextMilestone && (
              <View style={styles.nextMilestone}>
                <Text variant="callout" color="inherit" style={styles.milestoneTitle}>
                  🎯 Next Milestone: {stats.nextMilestone.title}
                </Text>
                {stats.nextMilestone.progress && (
                  <ProgressBar
                    progress={stats.nextMilestone.progress.current / stats.nextMilestone.progress.target}
                    height={8}
                    backgroundColor="rgba(0,0,0,0.1)"
                    fillColor={theme.primary}
                    style={styles.milestoneProgress}
                  />
                )}
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && {
                backgroundColor: category.color,
              },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              variant="footnote"
              style={[
                styles.categoryButtonText,
                {
                  color: selectedCategory === category.id ? '#FFFFFF' : theme.foreground,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        style={styles.achievementsList}
        contentContainerStyle={styles.achievementsContent}
        showsVerticalScrollIndicator={false}
      />
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
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  statsContent: {
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  nextMilestone: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  milestoneTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  milestoneProgress: {
    marginTop: spacing.xs,
  },
  categoryFilter: {
    maxHeight: 80,
  },
  categoryFilterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 80,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  categoryButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  achievementsList: {
    flex: 1,
  },
  achievementsContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  achievementCard: {
    marginBottom: spacing.sm,
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  achievementIcon: {
    fontSize: 32,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    marginBottom: spacing.xs,
  },
  progressText: {
    textAlign: 'right',
  },
  unlockedDate: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  pointsContainer: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
}); 