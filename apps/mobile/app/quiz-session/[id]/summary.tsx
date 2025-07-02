import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ViewStyle,
  TextStyle,
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdvancedLearningInsights } from '../../../components/analytics/advanced-learning-insights';
import useUIStrings from '../../../lib/hooks/useUIStrings';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface QuizSummary {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  topicId: string;
  topicName: string;
  categoryId: string;
  categoryName: string;
  difficulty: string;
  streak: number;
  xpEarned: number;
  mode: string;
  percentage: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Recommendation {
  id: string;
  type: 'topic' | 'category' | 'skill';
  title: string;
  description: string;
  confidence: number;
}

// Quick Learning Insights Preview Component
const QuickInsightsPreview: React.FC<{
  userId: string;
  quizResults: QuizSummary;
  onViewDetails: () => void;
}> = ({ userId, quizResults, onViewDetails }) => {
  const { theme } = useTheme();
  const [quickInsights, setQuickInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Generate quick insights based on quiz performance - memoize to prevent infinite loops
  const generateQuickInsights = useCallback(() => {
    setLoading(true);
    
    // Simulate analysis based on quiz results
    const insights = {
      performancePattern: quizResults.percentage >= 80 ? 'strong' : 
                         quizResults.percentage >= 60 ? 'moderate' : 'needs_improvement',
      learningVelocity: quizResults.timeSpent < 180 ? 'fast' : 'deliberate',
      strengthAreas: quizResults.percentage >= 70 ? ['conceptual understanding'] : [],
      improvementAreas: quizResults.percentage < 70 ? ['topic mastery', 'time management'] : [],
      nextSteps: [
        quizResults.percentage >= 80 ? 'Try advanced topics' : 'Review fundamentals',
        'Practice related concepts',
        'Join discussion groups'
      ]
    };
    
    setTimeout(() => {
      setQuickInsights(insights);
      setLoading(false);
    }, 1500); // Simulate processing time
  }, [quizResults.percentage, quizResults.timeSpent]); // Only depend on specific values that matter

  useEffect(() => {
    if (!quickInsights && !loading) {
      generateQuickInsights();
    }
  }, [generateQuickInsights, quickInsights, loading]);

  if (loading) {
    return (
      <AnimatedCard style={styles.insightsPreviewCard} variant="outlined" delay={600}>
        <View style={styles.insightsHeader}>
          <Text style={styles.insightsTitle}>🧠 Analyzing Performance...</Text>
        </View>
        <View style={styles.insightsLoading}>
          <LoadingSpinner size="small" />
          <Text style={[styles.insightsLoadingText, { color: theme.foregroundSecondary }]}>
            Generating personalized insights
          </Text>
        </View>
      </AnimatedCard>
    );
  }

  if (!quickInsights) return null;

  return (
    <AnimatedCard style={styles.insightsPreviewCard} variant="outlined" delay={600}>
      <View style={styles.insightsHeader}>
        <Text style={styles.insightsTitle}>🧠 Learning Insights</Text>
        <TouchableOpacity onPress={onViewDetails} style={styles.viewDetailsButton}>
          <Text style={[styles.viewDetailsText, { color: theme.primary }]}>
            View Details →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Performance Pattern */}
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Performance Pattern:</Text>
        <Text style={[
          styles.insightValue,
          { 
            color: quickInsights.performancePattern === 'strong' ? '#10B981' : 
                   quickInsights.performancePattern === 'moderate' ? '#F59E0B' : '#EF4444'
          }
        ]}>
          {quickInsights.performancePattern === 'strong' ? '💪 Strong' :
           quickInsights.performancePattern === 'moderate' ? '📈 Developing' : '🎯 Focus Needed'}
        </Text>
      </View>

      {/* Learning Velocity */}
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Learning Style:</Text>
        <Text style={[styles.insightValue, { color: theme.foreground }]}>
          {quickInsights.learningVelocity === 'fast' ? '⚡ Quick Processing' : '🎯 Thoughtful Analysis'}
        </Text>
      </View>

      {/* Next Steps Preview */}
      {quickInsights.nextSteps.length > 0 && (
        <View style={styles.nextStepsPreview}>
          <Text style={styles.nextStepsTitle}>💡 Next Steps:</Text>
          <Text style={[styles.nextStepsText, { color: theme.foregroundSecondary }]}>
            • {quickInsights.nextSteps[0]}
          </Text>
          {quickInsights.nextSteps.length > 1 && (
            <Text style={[styles.moreStepsText, { color: theme.primary }]}>
              +{quickInsights.nextSteps.length - 1} more recommendations
            </Text>
          )}
        </View>
      )}
    </AnimatedCard>
  );
};

export default function QuizSummaryScreen() {
  // Hooks with error handling and fallbacks
  const themeResult = useTheme();
  const authResult = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id: string;
    score?: string;
    total?: string;
    correct?: string;
    time?: string;
    topicTitle?: string;
    topicEmoji?: string;
    mode?: string;
  }>();
  
  // Safely extract values with fallbacks
  const theme = themeResult?.theme || {
    background: '#FFFFFF',
    foreground: '#000000',
    primary: '#007AFF',
    border: '#E5E7EB',
    card: '#F9FAFB',
    foregroundSecondary: '#6B7280',
    foregroundTertiary: '#9CA3AF'
  };
  
  const user = authResult?.user;
  const { uiStrings } = useUIStrings() || { uiStrings: { quiz: {}, common: {}, navigation: {} } };

  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showFullInsights, setShowFullInsights] = useState(false);

  // Check if we have URL parameters first (immediate results from quiz completion)
  const hasUrlParams = useMemo(() => {
    return !!(params.score && params.total && params.correct && params.time);
  }, [params.score, params.total, params.correct, params.time]);

  // Memoize the URL summary to prevent recreation on every render
  const urlSummary = useMemo(() => {
    if (!hasUrlParams) return null;
    
    return {
      sessionId: params.id || '',
      score: parseInt(params.score!) || 0,
      totalQuestions: parseInt(params.total!) || 0,
      correctAnswers: parseInt(params.correct!) || 0,
      timeSpent: parseInt(params.time!) || 0,
      topicId: params.id || '',
      topicName: params.topicTitle || 'Quiz',
      categoryId: 'general',
      categoryName: 'General',
      difficulty: 'normal',
      streak: 0,
      xpEarned: Math.round((parseInt(params.correct!) || 0) * 10),
      mode: params.mode || 'practice',
      percentage: parseInt(params.score!) || 0
    };
  }, [hasUrlParams, params.id, params.score, params.total, params.correct, params.time, params.topicTitle, params.mode]);

  const loadSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from AsyncStorage first
      const storageKey = `quiz_summary_${params.id}`;
      const storedSummary = await AsyncStorage.getItem(storageKey);
      
      if (storedSummary) {
        const parsedSummary = JSON.parse(storedSummary);
        console.log('✅ Quiz Summary: Loaded from storage:', parsedSummary);
        setSummary(parsedSummary);
      } else {
        // Create minimal summary from what we know
        const fallbackSummary: QuizSummary = {
          sessionId: params.id || '',
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0,
          topicId: params.id || '',
          topicName: 'Quiz Completed',
          categoryId: 'general',
          categoryName: 'General',
          difficulty: 'normal',
          streak: 0,
          xpEarned: 0,
          mode: 'practice',
          percentage: 0
        };
        
        console.log('⚠️ Quiz Summary: Using fallback summary');
        setSummary(fallbackSummary);
      }
    } catch (error) {
      console.error('❌ Error loading summary:', error);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (hasUrlParams && urlSummary) {
      console.log('✅ Quiz Summary: Using URL parameters for immediate display:', urlSummary);
      setSummary(urlSummary);
      setLoading(false);
    } else if (!hasUrlParams) {
      // Fallback to loading from storage/API
      loadSummaryData();
    }
  }, [hasUrlParams, urlSummary, loadSummaryData]);

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { message: 'Outstanding!', emoji: '🏆', color: '#10B981' };
    if (percentage >= 80) return { message: 'Excellent!', emoji: '🎉', color: '#059669' };
    if (percentage >= 70) return { message: 'Great job!', emoji: '👏', color: '#0891B2' };
    if (percentage >= 60) return { message: 'Good work!', emoji: '👍', color: '#0284C7' };
    if (percentage >= 50) return { message: 'Keep practicing!', emoji: '💪', color: '#7C3AED' };
    return { message: 'Try again!', emoji: '🔄', color: '#DC2626' };
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return theme.primary;
    }
  };

  const handleShare = async () => {
    if (!summary) return;
    
    try {
      const message = `I just completed a CivicSense quiz and scored ${summary.percentage}% on ${summary.topicName}! 🎯\n\nAccuracy: ${summary.percentage}%\nTime: ${Math.floor(summary.timeSpent / 60)}:${(summary.timeSpent % 60).toString().padStart(2, '0')}\n\nJoin me in learning about civic topics!`;
      
      await Share.share({
        message,
        title: uiStrings.quiz?.results || 'My CivicSense Quiz Results',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
      Alert.alert(uiStrings.common?.error || 'Error', 'Failed to share results. Please try again.');
    }
  };

  const handleRetakeQuiz = () => {
    router.push(`/quiz-session/${params.id}` as any);
  };

  const handleExploreRecommendation = (recommendation: Recommendation) => {
    if (recommendation.type === 'topic') {
      router.push(`/topic/${recommendation.id}` as any);
    } else if (recommendation.type === 'category') {
      router.push(`/category/${recommendation.id}` as any);
    }
  };

  const handleViewFullInsights = () => {
    setShowFullInsights(true);
  };

  const handleCloseFullInsights = () => {
    setShowFullInsights(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Calculating your results..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="title2" color="inherit">Results not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show full insights modal
  if (showFullInsights && user?.id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <AdvancedLearningInsights 
          userId={user.id} 
          onClose={handleCloseFullInsights}
        />
      </SafeAreaView>
    );
  }

  const performance = getPerformanceMessage(summary.percentage);

  return (
    <LinearGradient colors={["#2563EB", "#1D4ED8", "#1E40AF"]} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text variant="title2" style={styles.headerTitle}>{uiStrings.quiz?.complete || 'Quiz Complete!'}</Text>
            <Text variant="body" style={styles.headerSubtitle}>
              {summary.topicName}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text variant="title1" style={styles.scoreText}>
                {summary.score}/{summary.totalQuestions}
              </Text>
              <Text variant="body" style={styles.scoreLabel}>
                {uiStrings.quiz?.finalScore || 'Final Score'}
              </Text>
            </View>
            
            <View style={styles.accuracyContainer}>
              <Text variant="title3" style={styles.accuracyText}>
                {summary.percentage}%
              </Text>
              <Text variant="caption1" style={styles.accuracyLabel}>
                {uiStrings.quiz?.accuracy || 'Accuracy'}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text variant="title3" style={styles.statValue}>
                {summary.correctAnswers}
              </Text>
              <Text variant="caption1" style={styles.statLabel}>
                {uiStrings.quiz?.correct || 'Correct'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text variant="title3" style={styles.statValue}>
                {summary.totalQuestions - summary.correctAnswers}
              </Text>
              <Text variant="caption1" style={styles.statLabel}>
                {uiStrings.quiz?.incorrect || 'Incorrect'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#F59E0B" />
              <Text variant="title3" style={styles.statValue}>
                {Math.floor(summary.timeSpent / 60)}:{(summary.timeSpent % 60).toString().padStart(2, '0')}
              </Text>
              <Text variant="caption1" style={styles.statLabel}>
                {uiStrings.quiz?.timeSpent || 'Time'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#8B5CF6" />
              <Text variant="title3" style={styles.statValue}>
                {summary.xpEarned}
              </Text>
              <Text variant="caption1" style={styles.statLabel}>
                XP Earned
              </Text>
            </View>
          </View>

          {/* Quick Insights */}
          {user?.id && (
            <View style={styles.section}>
              <QuickInsightsPreview 
                userId={user.id}
                quizResults={summary}
                onViewDetails={handleViewFullInsights}
              />
            </View>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <View style={styles.section}>
              <Text variant="title3" color="inherit" style={styles.sectionTitle}>
                🏆 Achievements Unlocked
              </Text>
              {achievements.map((achievement, index) => (
                <AnimatedCard
                  key={achievement.id}
                  style={{
                    ...styles.achievementCard,
                    borderLeftColor: getRarityColor(achievement.rarity),
                  }}
                  variant="outlined"
                  delay={500 + index * 100}
                >
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.achievementInfo}>
                      <Text variant="callout" color="inherit" style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      <Text variant="footnote" color="secondary">
                        {achievement.description}
                      </Text>
                    </View>
                    <View style={[
                      styles.rarityBadge,
                      { backgroundColor: getRarityColor(achievement.rarity) }
                    ]}>
                      <Text variant="caption1" style={styles.rarityText}>
                        {achievement.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text variant="title3" color="inherit" style={styles.sectionTitle}>
                📚 Continue Learning
              </Text>
              {recommendations.map((recommendation, index) => (
                <AnimatedCard
                  key={recommendation.id}
                  style={styles.recommendationCard}
                  variant="outlined"
                  delay={700 + index * 100}
                  onPress={() => handleExploreRecommendation(recommendation)}
                >
                  <View style={styles.recommendationContent}>
                    <View style={styles.recommendationInfo}>
                      <Text variant="callout" color="inherit" style={styles.recommendationTitle}>
                        {recommendation.title}
                      </Text>
                      <Text variant="footnote" color="secondary">
                        {recommendation.description}
                      </Text>
                    </View>
                    <Text style={[styles.confidenceText, { color: theme.primary }]}>
                      {recommendation.confidence}% match
                    </Text>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Take Another Quiz"
              onPress={handleRetakeQuiz}
              style={styles.primaryButton}
            />
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push(`/topic/${summary.topicId}`)}
            >
              <Text variant="body" style={styles.secondaryButtonText}>
                Review Topic
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  shareIcon: {
    fontSize: 16,
  },
  scoreCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 0,
  },
  scoreContent: {
    alignItems: 'center',
  },
  performanceEmoji: {
    marginBottom: spacing.sm,
  },
  performanceMessage: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: fontFamily.display,
  },
  scoreLabel: {
    textAlign: 'center',
  },
  accuracyContainer: {
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: fontFamily.display,
  },
  accuracyLabel: {
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  statContent: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fontFamily.display,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.md,
  },

  // Quick Insights Preview Styles
  insightsPreviewCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewDetailsButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  insightsLoadingText: {
    fontSize: 14,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  insightLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  nextStepsPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  nextStepsText: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  moreStepsText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Existing styles continue...
  achievementCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'white',
    borderLeftWidth: 4,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recommendationCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'white',
  },
  recommendationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontFamily: fontFamily.text,
    marginBottom: spacing.xs,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionButtons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
}); 