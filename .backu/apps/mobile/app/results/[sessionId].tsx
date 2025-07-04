import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { Card } from '../../components/ui/Card';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius } from '../../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

interface QuizResults {
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
  achievements: Achievement[];
  recommendations: Recommendation[];
  questionBreakdown: QuestionResult[];
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
  type: 'topic' | 'skill' | 'category';
  title: string;
  description: string;
  confidence: number;
}

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  skill?: string;
}

export default function QuizResultsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in real app, fetch from database
      const mockResults: QuizResults = {
        sessionId: sessionId || '',
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpent: 180, // 3 minutes
        topicId: 'topic-1',
        topicName: 'Constitutional Principles',
        categoryId: 'cat-1',
        categoryName: 'Government Structure',
        difficulty: 'intermediate',
        streak: 5,
        xpEarned: 120,
        achievements: [
          {
            id: 'first-quiz',
            title: 'First Steps',
            description: 'Completed your first quiz!',
            icon: '🎯',
            rarity: 'common'
          },
          {
            id: 'streak-master',
            title: 'Streak Master',
            description: 'Answered 5 questions in a row correctly!',
            icon: '🔥',
            rarity: 'rare'
          }
        ],
        recommendations: [
          {
            id: 'rec-1',
            type: 'topic',
            title: 'Judicial Review',
            description: 'Based on your interest in constitutional principles',
            confidence: 0.85
          },
          {
            id: 'rec-2',
            type: 'skill',
            title: 'Critical Analysis',
            description: 'Strengthen your analytical thinking skills',
            confidence: 0.72
          }
        ],
        questionBreakdown: [
          {
            questionId: 'q1',
            question: 'What are the three branches of government?',
            userAnswer: 'Legislative, Executive, Judicial',
            correctAnswer: 'Legislative, Executive, Judicial',
            isCorrect: true,
            timeSpent: 15,
            skill: 'Government Structure'
          },
          // Add more questions...
        ]
      };
      
      setResults(mockResults);
    } catch (error) {
      console.error('Error loading quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceMessage = useCallback(() => {
    if (!results) return '';
    
    const percentage = (results.correctAnswers / results.totalQuestions) * 100;
    
    if (percentage >= 90) return 'Outstanding! 🌟';
    if (percentage >= 80) return 'Excellent work! 🎉';
    if (percentage >= 70) return 'Great job! 👏';
    if (percentage >= 60) return 'Good effort! 👍';
    return 'Keep practicing! 💪';
  }, [results]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9B59B6';
      case 'rare': return '#3498DB';
      default: return theme.primary;
    }
  };

  const handleShare = async () => {
    if (!results) return;
    
    const message = `I just scored ${results.score}% on "${results.topicName}" in CivicSense! 🏛️

Join me in learning about democracy and civic engagement!`;
    
    try {
      await Share.share({
        message,
        title: 'CivicSense Quiz Results',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  const handleRetakeQuiz = () => {
    if (!results) return;
    router.push(`/quiz-session/${results.topicId}` as any);
  };

  const handleExploreRecommendation = (recommendation: Recommendation) => {
    if (recommendation.type === 'topic') {
      router.push(`/topic/${recommendation.id}` as any);
    } else if (recommendation.type === 'category') {
      router.push(`/category/${recommendation.id}` as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading your results..." />
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
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
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
          <Text variant="title2" color="inherit">Quiz Results</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={[styles.shareIcon, { color: theme.primary }]}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Summary */}
        <AnimatedCard style={styles.summaryCard} variant="elevated">
          <View style={styles.summaryContent}>
            <Text variant="title1" color="inherit" style={styles.performanceMessage}>
              {getPerformanceMessage()}
            </Text>
            
            <View style={styles.scoreContainer}>
              <AnimatedCounter
                value={results.score}
                suffix="%"
                style={{
                  fontSize: 48,
                  fontWeight: '700',
                  marginBottom: spacing.xs,
                  color: theme.primary
                }}
                duration={1500}
              />
              <Text variant="body" color="secondary">
                {results.correctAnswers} of {results.totalQuestions} correct
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={results.xpEarned} suffix=" XP" />
                </Text>
                <Text variant="footnote" color="secondary">Experience</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={results.timeSpent} suffix="s" />
                </Text>
                <Text variant="footnote" color="secondary">Time Spent</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="title3" color="inherit">
                  <AnimatedCounter value={results.streak} />
                </Text>
                <Text variant="footnote" color="secondary">Best Streak</Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* Topic Info */}
        <Card style={styles.topicCard} variant="outlined">
          <View style={styles.topicInfo}>
            <Text variant="title3" color="inherit">{results.topicName}</Text>
            <Text variant="body" color="secondary">{results.categoryName}</Text>
            <View style={styles.difficultyBadge}>
              <Text variant="footnote" style={[styles.difficultyText, { color: theme.primary }]}>
                {results.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Achievements */}
        {results.achievements.length > 0 && (
          <View style={styles.section}>
            <Text variant="title3" color="inherit" style={styles.sectionTitle}>
              🏆 Achievements Unlocked
            </Text>
            {results.achievements.map((achievement, index) => (
              <AnimatedCard
                key={achievement.id}
                style={styles.achievementCard}
                variant="outlined"
                delay={index * 100}
              >
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementText}>
                    <Text variant="callout" color="inherit">{achievement.title}</Text>
                    <Text variant="footnote" color="secondary">{achievement.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.rarityBadge,
                      { backgroundColor: getRarityColor(achievement.rarity) }
                    ]}
                  >
                    <Text style={styles.rarityText}>{achievement.rarity}</Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            📚 Recommended for You
          </Text>
          {results.recommendations.map((recommendation, index) => (
            <AnimatedCard
              key={recommendation.id}
              style={styles.recommendationCard}
              variant="outlined"
              onPress={() => handleExploreRecommendation(recommendation)}
              delay={index * 100}
            >
              <View style={styles.recommendationContent}>
                <View style={styles.recommendationText}>
                  <Text variant="callout" color="inherit">{recommendation.title}</Text>
                  <Text variant="footnote" color="secondary">{recommendation.description}</Text>
                  <Text variant="footnote" color="primary">
                    {Math.round(recommendation.confidence * 100)}% match
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: theme.primary }]}>→</Text>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Question Breakdown */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.breakdownHeader}
            onPress={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          >
            <Text variant="title3" color="inherit">
              📊 Question Breakdown
            </Text>
            <Text style={[styles.expandIcon, { color: theme.primary }]}>
              {showDetailedBreakdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showDetailedBreakdown && (
            <View style={styles.breakdownContent}>
              {results.questionBreakdown.map((question, index) => (
                <Card
                  key={question.questionId}
                  style={{
                    marginBottom: spacing.md,
                    borderLeftColor: question.isCorrect ? '#10B981' : '#EF4444',
                    borderLeftWidth: 4,
                  }}
                  variant="outlined"
                >
                  <View style={styles.questionContent}>
                    <Text variant="callout" color="inherit" numberOfLines={2}>
                      {index + 1}. {question.question}
                    </Text>
                    <View style={styles.answerRow}>
                      <Text variant="footnote" color="secondary">Your answer:</Text>
                      <Text
                        variant="footnote"
                        style={{
                          color: question.isCorrect ? '#10B981' : '#EF4444',
                          fontWeight: '600'
                        }}
                      >
                        {question.userAnswer}
                      </Text>
                    </View>
                    {!question.isCorrect && (
                      <View style={styles.answerRow}>
                        <Text variant="footnote" color="secondary">Correct answer:</Text>
                        <Text variant="footnote" style={{ color: '#10B981', fontWeight: '600' }}>
                          {question.correctAnswer}
                        </Text>
                      </View>
                    )}
                    <View style={styles.questionMeta}>
                      <Text variant="footnote" color="secondary">
                        {question.timeSpent}s
                      </Text>
                      {question.skill && (
                        <Text variant="footnote" color="primary">
                          {question.skill}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Retake Quiz"
            onPress={handleRetakeQuiz}
            variant="outlined"
            style={styles.actionButton}
          />
          <Button
            title="Continue Learning"
            onPress={() => router.push('/(tabs)/discover')}
            style={styles.actionButton}
          />
        </View>
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
  shareButton: {
    padding: spacing.sm,
  },
  shareIcon: {
    fontSize: 20,
  },
  summaryCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  summaryContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  performanceMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  topicCard: {
    margin: spacing.md,
    marginTop: 0,
  },
  topicInfo: {
    padding: spacing.md,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  achievementCard: {
    marginBottom: spacing.sm,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  achievementText: {
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationCard: {
    marginBottom: spacing.sm,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  recommendationText: {
    flex: 1,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownContent: {
    gap: spacing.sm,
  },
  questionCard: {
    marginBottom: spacing.sm,
  },
  questionContent: {
    padding: spacing.md,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
}); 