import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../lib/theme-context';
import { useAuth } from '../../../lib/auth-context';
import { Text } from '../../../components/atoms/Text';
import { Card } from '../../../components/ui/Card';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AnimatedCounter } from '../../../components/ui/AnimatedCounter';
import { Button } from '../../../components/Button';
import { LoadingSpinner } from '../../../components/molecules/LoadingSpinner';
import { spacing, borderRadius, fontFamily } from '../../../lib/theme';
import { AdvancedLearningInsights } from '../../../components/analytics/advanced-learning-insights';
import { QuestionResponseService } from '../../../lib/services/question-response-service';

const { width: screenWidth } = Dimensions.get('window');

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  rank: number;
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;
  accuracyRate: number;
  isCurrentUser: boolean;
  achievements?: string[];
}

interface GameResults {
  gameId: string;
  roomCode: string;
  topicName: string;
  categoryName: string;
  difficulty: string;
  gameMode: string;
  duration: number;
  totalQuestions: number;
  players: PlayerResult[];
  teamStats?: {
    averageScore: number;
    teamAccuracy: number;
    collaborationScore: number;
    knowledgeGaps: string[];
    strongAreas: string[];
  };
}

// Comparative Learning Insights Component
const ComparativeInsights: React.FC<{
  currentUser: PlayerResult;
  allPlayers: PlayerResult[];
  onViewPersonalInsights: () => void;
}> = ({ currentUser, allPlayers, onViewPersonalInsights }) => {
  const { theme } = useTheme();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const generateComparativeInsights = useCallback(() => {
    setTimeout(() => {
      // Calculate comparative metrics
      const avgScore = allPlayers.reduce((sum, p) => sum + p.score, 0) / allPlayers.length;
      const avgResponseTime = allPlayers.reduce((sum, p) => sum + p.averageResponseTime, 0) / allPlayers.length;
      
      const userRank = currentUser.rank;
      const userScore = currentUser.score;
      const userResponseTime = currentUser.averageResponseTime;
      
      const insights = {
        scoreComparison: {
          userScore,
          avgScore: Math.round(avgScore),
          percentile: Math.round(((allPlayers.length - userRank + 1) / allPlayers.length) * 100),
          trend: userScore > avgScore ? 'above_average' : userScore === avgScore ? 'average' : 'below_average'
        },
        speedComparison: {
          userSpeed: userResponseTime,
          avgSpeed: Math.round(avgResponseTime),
          classification: userResponseTime < avgResponseTime ? 'fast' : userResponseTime === avgResponseTime ? 'average' : 'deliberate'
        },
        learningStyle: {
          pattern: userScore > avgScore && userResponseTime < avgResponseTime ? 'quick_learner' :
                   userScore > avgScore && userResponseTime > avgResponseTime ? 'thorough_analyzer' :
                   userScore < avgScore && userResponseTime < avgResponseTime ? 'speed_focused' : 'developing'
        },
        recommendations: [
          userScore < avgScore ? 'Focus on accuracy over speed' : 'Try more challenging topics',
          userResponseTime > avgResponseTime ? 'Practice quick decision making' : 'Consider deeper analysis',
          'Review questions you missed with the group'
        ]
      };
      
      setInsights(insights);
      setLoading(false);
    }, 1000);
  }, [currentUser, allPlayers]);

  useEffect(() => {
    generateComparativeInsights();
  }, [generateComparativeInsights]);

  if (loading) {
    return (
      <AnimatedCard style={styles.comparativeCard} variant="outlined" delay={400}>
        <View style={styles.insightsLoading}>
          <LoadingSpinner size="small" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Analyzing group performance...
          </Text>
        </View>
      </AnimatedCard>
    );
  }

  if (!insights) return null;

  return (
    <AnimatedCard style={styles.comparativeCard} variant="outlined" delay={400}>
      <View style={styles.insightsHeader}>
        <Text style={styles.insightsTitle}>📊 Performance Analysis</Text>
        <TouchableOpacity onPress={onViewPersonalInsights} style={styles.detailsButton}>
          <Text style={[styles.detailsButtonText, { color: theme.primary }]}>
            Personal Insights →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Score Comparison */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>📈 Score Performance</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: theme.primary }]}>
              {insights.scoreComparison.userScore}
            </Text>
            <Text style={styles.comparisonLabel}>Your Score</Text>
          </View>
          <View style={styles.comparisonDivider} />
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonValue, { color: theme.foregroundSecondary }]}>
              {insights.scoreComparison.avgScore}
            </Text>
            <Text style={styles.comparisonLabel}>Group Avg</Text>
          </View>
          <View style={styles.comparisonDivider} />
          <View style={styles.comparisonItem}>
            <Text style={[
              styles.comparisonValue, 
              { color: insights.scoreComparison.percentile >= 75 ? '#10B981' : 
                       insights.scoreComparison.percentile >= 50 ? '#F59E0B' : '#EF4444' }
            ]}>
              {insights.scoreComparison.percentile}%
            </Text>
            <Text style={styles.comparisonLabel}>Percentile</Text>
          </View>
        </View>
      </View>

      {/* Learning Style Analysis */}
      <View style={styles.learningStyleSection}>
        <Text style={styles.learningStyleTitle}>🧠 Learning Style</Text>
        <Text style={[styles.learningStyleValue, { color: theme.foreground }]}>
          {insights.learningStyle.pattern === 'quick_learner' && '⚡ Quick Learner'}
          {insights.learningStyle.pattern === 'thorough_analyzer' && '🎯 Thorough Analyzer'}
          {insights.learningStyle.pattern === 'speed_focused' && '🏃 Speed Focused'}
          {insights.learningStyle.pattern === 'developing' && '📚 Developing'}
        </Text>
        <Text style={[styles.learningStyleDesc, { color: theme.foregroundSecondary }]}>
          {insights.learningStyle.pattern === 'quick_learner' && 'You process information quickly and accurately'}
          {insights.learningStyle.pattern === 'thorough_analyzer' && 'You take time to think through complex problems'}
          {insights.learningStyle.pattern === 'speed_focused' && 'You respond quickly but can improve accuracy'}
          {insights.learningStyle.pattern === 'developing' && 'Your understanding is growing with practice'}
        </Text>
      </View>

      {/* Quick Recommendations */}
      <View style={styles.recommendationsPreview}>
        <Text style={styles.recommendationsTitle}>💡 Quick Tips</Text>
        <Text style={[styles.recommendationText, { color: theme.foregroundSecondary }]}>
          • {insights.recommendations[0]}
        </Text>
        {insights.recommendations.length > 1 && (
          <Text style={[styles.moreRecommendations, { color: theme.primary }]}>
            +{insights.recommendations.length - 1} more insights available
          </Text>
        )}
      </View>
    </AnimatedCard>
  );
};

// Team Performance Overview Component
const TeamPerformanceOverview: React.FC<{
  teamStats: GameResults['teamStats'];
}> = ({ teamStats }) => {
  const { theme } = useTheme();

  if (!teamStats) return null;

  return (
    <AnimatedCard style={styles.teamStatsCard} variant="outlined" delay={300}>
      <Text style={styles.teamStatsTitle}>👥 Team Performance</Text>
      
      <View style={styles.teamMetricsGrid}>
        <View style={styles.teamMetric}>
          <Text style={[styles.teamMetricValue, { color: theme.primary }]}>
            {teamStats.averageScore}%
          </Text>
          <Text style={styles.teamMetricLabel}>Team Average</Text>
        </View>
        
        <View style={styles.teamMetric}>
          <Text style={[styles.teamMetricValue, { color: '#10B981' }]}>
            {teamStats.teamAccuracy}%
          </Text>
          <Text style={styles.teamMetricLabel}>Group Accuracy</Text>
        </View>
        
        <View style={styles.teamMetric}>
          <Text style={[styles.teamMetricValue, { color: '#8B5CF6' }]}>
            {teamStats.collaborationScore}
          </Text>
          <Text style={styles.teamMetricLabel}>Collaboration</Text>
        </View>
      </View>

      {/* Team Strengths & Gaps */}
      <View style={styles.teamInsightsSection}>
        <View style={styles.teamInsightItem}>
          <Text style={styles.teamInsightTitle}>💪 Team Strengths</Text>
          {teamStats.strongAreas.map((area, index) => (
            <Text key={index} style={[styles.teamInsightText, { color: '#10B981' }]}>
              • {area}
            </Text>
          ))}
        </View>
        
        <View style={styles.teamInsightItem}>
          <Text style={styles.teamInsightTitle}>🎯 Focus Areas</Text>
          {teamStats.knowledgeGaps.map((gap, index) => (
            <Text key={index} style={[styles.teamInsightText, { color: '#F59E0B' }]}>
              • {gap}
            </Text>
          ))}
        </View>
      </View>
    </AnimatedCard>
  );
};

export default function MultiplayerResultsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  // Using QuestionResponseService directly for better performance
  
  const [results, setResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPersonalInsights, setShowPersonalInsights] = useState(false);
  const [masteryData, setMasteryData] = useState<any>(null);

  useEffect(() => {
    if (code) {
      loadResults();
    }
  }, [code]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Load user's mastery data from QuestionResponseService
      if (user?.id) {
        try {
          const [masteryStats, reviewQuestions] = await Promise.all([
            QuestionResponseService.getUserMasteryStats(user.id),
            QuestionResponseService.getQuestionsForReview(user.id, 5)
          ]);
          
          setMasteryData({
            masteryStats,
            reviewQuestions,
            hasData: true
          });
          
          console.log('✅ Loaded post-game mastery data:', {
            masteryStats,
            reviewQuestions: reviewQuestions.length
          });
        } catch (error) {
          console.error('❌ Failed to load mastery data:', error);
          setMasteryData({ hasData: false });
        }
      }
      
      // Mock data - in real app, fetch from database
      const mockResults: GameResults = {
        gameId: code || '',
        roomCode: code || '',
        topicName: 'Constitutional Principles',
        categoryName: 'Government Structure',
        difficulty: 'intermediate',
        gameMode: 'competitive',
        duration: 180000, // 3 minutes
        totalQuestions: 10,
        players: [
          {
            id: user?.id || 'user-1',
            name: user?.email?.split('@')[0] || 'You',
            score: 85,
            rank: 2,
            correctAnswers: 8,
            totalQuestions: 10,
            averageResponseTime: 12,
            accuracyRate: 80,
            isCurrentUser: true,
            achievements: ['streak_master', 'quick_thinker']
          },
          {
            id: 'user-2',
            name: 'Sarah Chen',
            score: 90,
            rank: 1,
            correctAnswers: 9,
            totalQuestions: 10,
            averageResponseTime: 15,
            accuracyRate: 90,
            isCurrentUser: false,
            achievements: ['perfectionist', 'civic_scholar']
          },
          {
            id: 'user-3',
            name: 'Alex Rivera',
            score: 75,
            rank: 3,
            correctAnswers: 7,
            totalQuestions: 10,
            averageResponseTime: 8,
            accuracyRate: 70,
            isCurrentUser: false,
            achievements: ['speed_demon']
          },
          {
            id: 'user-4',
            name: 'Jordan Kim',
            score: 70,
            rank: 4,
            correctAnswers: 7,
            totalQuestions: 10,
            averageResponseTime: 18,
            accuracyRate: 70,
            isCurrentUser: false,
            achievements: ['thoughtful_learner']
          }
        ],
        teamStats: {
          averageScore: 80,
          teamAccuracy: 78,
          collaborationScore: 85,
          knowledgeGaps: ['Separation of Powers', 'Judicial Review'],
          strongAreas: ['Constitutional Amendments', 'Bill of Rights', 'Executive Powers']
        }
      };
      
      setResults(mockResults);
    } catch (error) {
      console.error('Error loading multiplayer results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const handleShare = async () => {
    if (!results) return;
    
    const currentUser = results.players.find(p => p.isCurrentUser);
    if (!currentUser) return;
    
    try {
      const message = `Just finished a multiplayer CivicSense quiz! 🏛️\n\nTopic: ${results.topicName}\nMy Score: ${currentUser.score}% (Rank #${currentUser.rank})\nTeam Average: ${results.teamStats?.averageScore}%\n\nJoin the civic learning community!`;
      
      await Share.share({
        message,
        title: 'CivicSense Multiplayer Results',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  const handlePlayAgain = () => {
    router.push('/multiplayer/lobby' as any);
  };

  const handleViewPersonalInsights = () => {
    setShowPersonalInsights(true);
  };

  const handleClosePersonalInsights = () => {
    setShowPersonalInsights(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Calculating results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!results) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit">Results not found</Text>
          <Button
            title="Back to Lobby"
            onPress={() => router.push('/multiplayer/lobby' as any)}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show personal insights modal
  if (showPersonalInsights && user?.id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <AdvancedLearningInsights 
          userId={user.id} 
          onClose={handleClosePersonalInsights}
        />
      </SafeAreaView>
    );
  }

  const currentUser = results.players.find(p => p.isCurrentUser);
  const sortedPlayers = [...results.players].sort((a, b) => a.rank - b.rank);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/multiplayer/lobby' as any)}
          >
            <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text variant="title2" color="inherit">Game Complete!</Text>
            <Text variant="footnote" color="secondary">Room: {results.roomCode}</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={[styles.shareIcon, { color: theme.primary }]}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Current User Performance Highlight */}
        {currentUser && (
          <AnimatedCard style={styles.userPerformanceCard} variant="elevated" delay={100}>
            <View style={styles.userPerformanceContent}>
              <Text style={styles.userRankIcon}>{getRankIcon(currentUser.rank)}</Text>
              <View style={styles.userPerformanceStats}>
                <Text variant="title1" color="inherit" style={styles.userRank}>
                  Rank #{currentUser.rank}
                </Text>
                <AnimatedCounter
                  value={currentUser.score}
                  suffix="%"
                  style={{
                    fontSize: 32,
                    fontWeight: '700',
                    color: theme.primary,
                    marginBottom: spacing.xs,
                  }}
                  duration={1500}
                />
                <Text variant="body" color="secondary">
                  {currentUser.correctAnswers}/{currentUser.totalQuestions} correct
                </Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Team Performance Overview */}
        <View style={styles.section}>
          <TeamPerformanceOverview teamStats={results.teamStats} />
        </View>

        {/* Comparative Learning Insights */}
        {currentUser && (
          <View style={styles.section}>
            <ComparativeInsights
              currentUser={currentUser}
              allPlayers={results.players}
              onViewPersonalInsights={handleViewPersonalInsights}
            />
          </View>
        )}

        {/* Post-Game Mastery Insights */}
        {masteryData?.hasData && (
          <View style={styles.section}>
            <AnimatedCard style={styles.masteryInsightsCard} variant="outlined" delay={600}>
              <View style={styles.masteryHeader}>
                <Text style={styles.masteryTitle}>🎯 Your Learning Progress</Text>
                <Text style={[styles.masterySubtitle, { color: theme.foregroundSecondary }]}>
                  Based on your question responses
                </Text>
              </View>

              {masteryData.reviewQuestions?.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewTitle}>📚 Questions to Review</Text>
                  <Text style={[styles.reviewDescription, { color: theme.foregroundSecondary }]}>
                    {masteryData.reviewQuestions.length} questions are ready for spaced repetition review
                  </Text>
                  <TouchableOpacity 
                    style={[styles.reviewButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      // Navigate to review session
                      router.push('/review-session' as any);
                    }}
                  >
                    <Text style={styles.reviewButtonText}>Start Review Session</Text>
                  </TouchableOpacity>
                </View>
              )}

              {masteryData.masteryStats && (
                <View style={styles.masteryStatsSection}>
                  <Text style={styles.masteryStatsTitle}>📈 Knowledge Mastery</Text>
                  <Text style={[styles.masteryStatsDescription, { color: theme.foregroundSecondary }]}>
                    Your understanding is growing stronger with each game
                  </Text>
                </View>
              )}
            </AnimatedCard>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            🏆 Final Leaderboard
          </Text>
          
          {sortedPlayers.map((player, index) => (
            <AnimatedCard
              key={player.id}
              style={[
                styles.playerCard,
                player.isCurrentUser && styles.currentUserCard
              ]}
              variant="outlined"
              delay={500 + index * 100}
            >
              <View style={styles.playerContent}>
                <View style={styles.playerRank}>
                  <Text style={styles.rankIcon}>{getRankIcon(player.rank)}</Text>
                </View>
                
                <View style={styles.playerInfo}>
                  <Text variant="callout" color="inherit" style={styles.playerName}>
                    {player.name} {player.isCurrentUser && '(You)'}
                  </Text>
                  <View style={styles.playerStats}>
                    <Text variant="footnote" color="secondary">
                      {player.correctAnswers}/{player.totalQuestions} • {player.averageResponseTime}s avg
                    </Text>
                  </View>
                  
                  {player.achievements && player.achievements.length > 0 && (
                    <View style={styles.achievementsList}>
                      {player.achievements.slice(0, 2).map((achievement, i) => (
                        <View key={i} style={styles.achievementBadge}>
                          <Text style={styles.achievementText}>
                            {achievement === 'streak_master' && '🔥'}
                            {achievement === 'quick_thinker' && '⚡'}
                            {achievement === 'perfectionist' && '💎'}
                            {achievement === 'civic_scholar' && '🎓'}
                            {achievement === 'speed_demon' && '🏃'}
                            {achievement === 'thoughtful_learner' && '🤔'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.playerScore}>
                  <Text variant="title3" color="primary" style={styles.scoreValue}>
                    {player.score}%
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Game Info */}
        <View style={styles.section}>
          <Card style={styles.gameInfoCard} variant="outlined">
            <Text variant="title3" color="inherit" style={styles.gameInfoTitle}>
              📝 Game Summary
            </Text>
            <View style={styles.gameInfoGrid}>
              <View style={styles.gameInfoItem}>
                <Text variant="footnote" color="secondary">Topic</Text>
                <Text variant="body" color="inherit">{results.topicName}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text variant="footnote" color="secondary">Difficulty</Text>
                <Text variant="body" color="inherit">{results.difficulty}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text variant="footnote" color="secondary">Duration</Text>
                <Text variant="body" color="inherit">
                  {Math.floor(results.duration / 60000)}:{((results.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text variant="footnote" color="secondary">Questions</Text>
                <Text variant="body" color="inherit">{results.totalQuestions}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Play Again"
            onPress={handlePlayAgain}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="View Study Materials"
            onPress={() => router.push(`/topic/${results.topicName}` as any)}
            variant="outlined"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },

  // User Performance Card
  userPerformanceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: 'white',
  },
  userPerformanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRankIcon: {
    fontSize: 48,
    marginRight: spacing.lg,
  },
  userPerformanceStats: {
    flex: 1,
    alignItems: 'center',
  },
  userRank: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
  },

  // Team Performance
  teamStatsCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
  },
  teamStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.md,
  },
  teamMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  teamMetric: {
    alignItems: 'center',
  },
  teamMetricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  teamMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  teamInsightsSection: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  teamInsightItem: {
    flex: 1,
  },
  teamInsightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  teamInsightText: {
    fontSize: 12,
    marginBottom: 2,
  },

  // Comparative Insights
  comparativeCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  detailsButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  comparisonSection: {
    marginBottom: spacing.lg,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  comparisonDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.sm,
  },
  learningStyleSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  learningStyleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  learningStyleValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  learningStyleDesc: {
    fontSize: 14,
  },
  recommendationsPreview: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  recommendationText: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  moreRecommendations: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Leaderboard
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
  },
  playerCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'white',
  },
  currentUserCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerRank: {
    width: 50,
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  playerStats: {
    marginBottom: spacing.xs,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  achievementBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  achievementText: {
    fontSize: 12,
  },
  playerScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
  },

  // Game Info
  gameInfoCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
  },
  gameInfoTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
  },
  gameInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  gameInfoItem: {
    width: '45%',
  },

  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },

  // Post-Game Mastery Insights
  masteryInsightsCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  masteryHeader: {
    marginBottom: spacing.lg,
  },
  masteryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  masterySubtitle: {
    fontSize: 14,
  },
  reviewSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  reviewDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  reviewButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  masteryStatsSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  masteryStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  masteryStatsDescription: {
    fontSize: 14,
  },
}); 