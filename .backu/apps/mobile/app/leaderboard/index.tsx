import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { useUIStrings } from '../../hooks/useUIStrings';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { Avatar } from '../../components/atoms/Avatar';
import { spacing, borderRadius } from '../../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  xp: number;
  rank: number;
  streak: number;
  totalQuizzes: number;
  achievements: number;
  isCurrentUser?: boolean;
  change: 'up' | 'down' | 'same' | 'new';
  changeAmount?: number;
}

interface LeaderboardPeriod {
  id: string;
  label: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

interface UserStats {
  currentRank: number;
  totalUsers: number;
  percentile: number;
  weeklyChange: number;
  bestRank: number;
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { getString } = useUIStrings();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod['id']>('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periods: LeaderboardPeriod[] = [
    { id: 'daily', label: getString('leaderboard.today'), timeframe: 'daily' },
    { id: 'weekly', label: getString('leaderboard.thisWeek'), timeframe: 'weekly' },
    { id: 'monthly', label: getString('leaderboard.thisMonth'), timeframe: 'monthly' },
    { id: 'allTime', label: getString('leaderboard.allTime'), timeframe: 'allTime' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real app, fetch from database
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          displayName: 'Alex Democracy',
          avatar: undefined,
          score: 95,
          xp: 2450,
          rank: 1,
          streak: 12,
          totalQuizzes: 45,
          achievements: 8,
          change: 'up',
          changeAmount: 2,
        },
        {
          id: '2',
          userId: 'user-2',
          displayName: 'Sam Civic',
          avatar: undefined,
          score: 92,
          xp: 2380,
          rank: 2,
          streak: 8,
          totalQuizzes: 38,
          achievements: 6,
          change: 'same',
        },
        {
          id: '3',
          userId: user?.id || 'current-user',
          displayName: profile?.full_name || getString('leaderboard.you'),
          avatar: profile?.avatar_url || undefined,
          score: 88,
          xp: 2120,
          rank: 3,
          streak: 5,
          totalQuizzes: 32,
          achievements: 5,
          isCurrentUser: true,
          change: 'up',
          changeAmount: 1,
        },
        // Add more entries...
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 4}`,
          userId: `user-${i + 4}`,
          displayName: `Citizen ${i + 4}`,
          avatar: undefined,
          score: Math.floor(Math.random() * 40) + 50,
          xp: Math.floor(Math.random() * 2000) + 500,
          rank: i + 4,
          streak: Math.floor(Math.random() * 10),
          totalQuizzes: Math.floor(Math.random() * 30) + 10,
          achievements: Math.floor(Math.random() * 8),
          change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as any,
          changeAmount: Math.floor(Math.random() * 5) + 1,
        })),
      ];
      
      const mockUserStats: UserStats = {
        currentRank: 3,
        totalUsers: 1247,
        percentile: 95,
        weeklyChange: 1,
        bestRank: 2,
      };
      
      setLeaderboard(mockLeaderboard);
      setUserStats(mockUserStats);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeaderboard();
  }, [selectedPeriod]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getChangeIcon = (change: LeaderboardEntry['change'], amount?: number) => {
    switch (change) {
      case 'up': return `↗️ +${amount}`;
      case 'down': return `↘️ -${amount}`;
      case 'new': return `✨ ${getString('leaderboard.new')}`;
      default: return '➖';
    }
  };

  const getChangeColor = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      case 'new': return '#8B5CF6';
      default: return theme.foregroundSecondary;
    }
  };

  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    return (
    <AnimatedCard
      style={StyleSheet.flatten([
        styles.leaderboardEntry,
        item.isCurrentUser && { backgroundColor: `${theme.primary}10` }
      ])}
      variant={item.isCurrentUser ? "elevated" : "outlined"}
      delay={index * 50}
    >
      <View style={styles.entryContent}>
        {/* Rank */}
        <View style={styles.rankContainer}>
          <Text variant="title3" color="inherit" style={styles.rankText}>
            {getRankIcon(item.rank)}
          </Text>
          <Text
            variant="footnote"
            style={[
              styles.changeText,
              { color: getChangeColor(item.change) }
            ]}
          >
            {getChangeIcon(item.change, item.changeAmount)}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Avatar
            source={item.avatar}
            name={item.displayName}
            size="md"
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text variant="callout" color="inherit" numberOfLines={1}>
              {item.displayName}
              {item.isCurrentUser && (
                <Text variant="callout" color="primary"> ({getString('leaderboard.you')})</Text>
              )}
            </Text>
            <Text variant="footnote" color="secondary">
              {item.totalQuizzes} {getString('leaderboard.quizzes')} • {item.achievements} {getString('leaderboard.achievements')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.entryStats}>
          <View style={styles.statColumn}>
            <Text variant="title3" color="inherit">{item.score}%</Text>
            <Text variant="footnote" color="secondary">{getString('leaderboard.score')}</Text>
          </View>
          <View style={styles.statColumn}>
            <Text variant="title3" color="inherit">
              <AnimatedCounter value={item.xp} />
            </Text>
            <Text variant="footnote" color="secondary">{getString('leaderboard.xp')}</Text>
          </View>
          <View style={styles.statColumn}>
            <Text variant="title3" color="inherit">{item.streak}</Text>
            <Text variant="footnote" color="secondary">{getString('leaderboard.streak')}</Text>
          </View>
        </View>
      </View>
    </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message={getString('leaderboard.loadingLeaderboard')} />
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
        <Text variant="title2" color="inherit">{getString('leaderboard.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* User Stats Summary */}
      {userStats && (
        <Card style={styles.userStatsCard} variant="elevated">
          <View style={styles.userStatsContent}>
            <Text variant="title3" color="inherit" style={styles.userStatsTitle}>
              {getString('leaderboard.yourRanking')}
            </Text>
            <View style={styles.userStatsRow}>
              <View style={styles.userStatItem}>
                <Text variant="title2" color="primary">#{userStats?.currentRank}</Text>
                <Text variant="footnote" color="secondary">{getString('leaderboard.currentRank')}</Text>
              </View>
              <View style={styles.userStatItem}>
                <Text variant="title2" color="inherit">
                  {userStats?.percentile}%
                </Text>
                <Text variant="footnote" color="secondary">{getString('leaderboard.topPercentile')}</Text>
              </View>
              <View style={styles.userStatItem}>
                <Text variant="title2" color="inherit">
                  {userStats?.totalUsers.toLocaleString()}
                </Text>
                <Text variant="footnote" color="secondary">{getString('leaderboard.totalUsers')}</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              selectedPeriod === period.id && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              variant="callout"
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period.id ? '#FFFFFF' : theme.foreground,
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardEntry}
        keyExtractor={(item) => item.id}
        style={styles.leaderboardList}
        contentContainerStyle={styles.leaderboardContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <Button
          title={getString('leaderboard.takeQuizToClimb')}
          onPress={() => router.push('/(tabs)/quiz')}
          style={styles.ctaButton}
        />
      </View>
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
  userStatsCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  userStatsContent: {
    padding: spacing.md,
  },
  userStatsTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStatItem: {
    alignItems: 'center',
  },
  periodSelector: {
    maxHeight: 60,
  },
  periodSelectorContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  periodButtonText: {
    fontWeight: '600',
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  leaderboardEntry: {
    marginBottom: spacing.sm,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  rankContainer: {
    alignItems: 'center',
    width: 60,
  },
  rankText: {
    fontSize: 20,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.md,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  entryStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statColumn: {
    alignItems: 'center',
    minWidth: 40,
  },
  ctaContainer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  ctaButton: {
    width: '100%',
  },
}); 