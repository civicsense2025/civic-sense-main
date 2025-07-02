import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useUIStrings } from '../../hooks/useUIStrings';
import { LoadingSpinner } from '../../components/molecules/LoadingSpinner';
import { spacing, borderRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import MobileAnalyticsService, { type LearningInsights } from '../../lib/analytics-service';

interface Topic {
  topic_id: string;
  topic_title: string;
  category: string;
  emoji: string;
  description: string;
  action: () => void;
}

export default function PracticeQuizScreen() {
  const { getString } = useUIStrings();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        loadTopics();
      } else {
        // Redirect to login
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.replace('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      // First try to get topics with question counts
      const { data: topicsData, error: topicsError } = await supabase
        .from('question_topics')
        .select('*')
        .limit(20);

      if (topicsError) {
        throw topicsError;
      }

      // Get question counts for each topic
      const topicsWithCounts = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.topic_id);

          return {
            ...topic,
            count: count || 0
          };
        })
      );

      // Filter topics that have questions
      const availableTopics = topicsWithCounts
        .filter(topic => topic.count > 0)
        .map(topic => ({
          topic_id: topic.topic_id,
          topic_title: topic.topic_title,
          category: topic.category || 'General',
          emoji: topic.emoji || '📚',
          description: topic.description || getString('quiz.practiceQuestionsAbout').replace('{topic}', topic.topic_title),
          action: () => startQuiz(topic.topic_id, topic.topic_title)
        }));

      setTopics(availableTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
      Alert.alert(getString('errors.error'), getString('quiz.couldNotLoadTopics'));
    } finally {
      setLoadingTopics(false);
    }
  };

  const startQuiz = (topicId: string, title: string) => {
    // Navigate to the actual quiz screen with the topic
    router.push({
      pathname: '/quiz-session/[topicId]',
      params: { topicId, title }
    });
  };

  const loadLearningInsights = async () => {
    if (!user || loadingInsights) return;

    setLoadingInsights(true);
    try {
      const insights = await MobileAnalyticsService.getUserLearningInsights(user.id);
      setLearningInsights(insights);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error loading insights:', error);
      Alert.alert(getString('errors.error'), getString('quiz.couldNotLoadInsights'));
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>{getString('quiz.loadingPracticeQuizzes')}</Text>
      </View>
    );
  }

  if (showAnalytics && learningInsights) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.analyticsHeader}>
          <TouchableOpacity onPress={() => setShowAnalytics(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {getString('quiz.backToPractice')}</Text>
          </TouchableOpacity>
          <Text style={styles.analyticsTitle}>📊 {getString('quiz.yourLearningInsights')}</Text>
        </View>

        {/* Cognitive Patterns */}
        <View style={styles.insightSection}>
          <Text style={styles.sectionTitle}>🧠 {getString('quiz.cognitivePatterns')}</Text>
          
          <View style={styles.insightCard}>
            <Text style={styles.cardTitle}>{getString('quiz.processingSpeed')}</Text>
            <Text style={styles.cardContent}>
              {getString('quiz.trend')}: {learningInsights.cognitivePatterns.processingSpeed.speedTrend}
            </Text>
            <Text style={styles.cardSubtext}>
              {getString('quiz.fastQuestions')}: {learningInsights.cognitivePatterns.processingSpeed.fastQuestions.length}
            </Text>
            <Text style={styles.cardSubtext}>
              {getString('quiz.slowerQuestions')}: {learningInsights.cognitivePatterns.processingSpeed.slowQuestions.length}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.cardTitle}>{getString('quiz.confidenceMetrics')}</Text>
            <Text style={styles.cardContent}>
              {getString('quiz.quickCorrectAnswers')}: {Math.round(learningInsights.cognitivePatterns.confidenceMetrics.quickCorrect)}%
            </Text>
            <Text style={styles.cardSubtext}>
              {getString('quiz.hintUsage')}: {learningInsights.cognitivePatterns.confidenceMetrics.hintUsagePattern}
            </Text>
          </View>
        </View>

        {/* Learning Trajectory */}
        <View style={styles.insightSection}>
          <Text style={styles.sectionTitle}>📈 {getString('quiz.learningTrajectory')}</Text>
          
          <View style={styles.insightCard}>
            <Text style={styles.cardTitle}>{getString('quiz.currentLevel')}</Text>
            <Text style={styles.cardContent}>{learningInsights.learningTrajectory.currentLevel}</Text>
            <Text style={styles.cardSubtext}>
              {getString('quiz.growth')}: {learningInsights.learningTrajectory.projectedGrowth}
            </Text>
            <Text style={styles.cardSubtext}>
              {getString('quiz.timeToNextLevel')}: {learningInsights.learningTrajectory.timeToNextLevel}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.cardTitle}>{getString('quiz.recommendedFocus')}</Text>
            {learningInsights.learningTrajectory.recommendedFocus.map((area, index) => (
              <Text key={index} style={styles.cardSubtext}>• {area}</Text>
            ))}
          </View>
        </View>

        {/* Personalized Recommendations */}
        {learningInsights.personalizedRecommendations.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>💡 {getString('quiz.personalizedRecommendations')}</Text>
            
            {learningInsights.personalizedRecommendations.map((rec, index) => (
              <View key={index} style={[styles.insightCard, rec.priority === 'high' && styles.highPriorityCard]}>
                <Text style={styles.cardTitle}>{rec.title}</Text>
                <Text style={styles.cardContent}>{rec.description}</Text>
                <Text style={styles.cardSubtext}>{getString('quiz.expectedImpact')}: {rec.expectedImpact}</Text>
                <Text style={styles.cardSubtext}>{getString('quiz.timeframe')}: {rec.timeframe}</Text>
                
                <View style={styles.actionItems}>
                  <Text style={styles.actionTitle}>{getString('quiz.actionSteps')}:</Text>
                  {rec.actionItems.map((action, actionIndex) => (
                    <Text key={actionIndex} style={styles.actionItem}>• {action}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={() => setShowAnalytics(false)}>
          <Text style={styles.doneButtonText}>{getString('quiz.backToPractice')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getString('quiz.practiceQuizzes')}</Text>
        <Text style={styles.subtitle}>
          {getString('quiz.sharpenYourCivicKnowledge')}
        </Text>
      </View>

      {/* Learning Insights Button */}
      {user && (
        <View style={styles.insightsSection}>
          <TouchableOpacity 
            style={styles.insightsButton} 
            onPress={loadLearningInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.insightsButtonText}>📊 {getString('quiz.viewLearningInsights')}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.insightsDescription}>
            {getString('quiz.analyzeLearningPatterns')}
          </Text>
        </View>
      )}

      <ScrollView style={styles.topicsContainer}>
        {loadingTopics ? (
          <View style={styles.loadingTopics}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>{getString('quiz.loadingTopics')}</Text>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{getString('quiz.noPracticeTopics')}</Text>
            <Text style={styles.emptyStateSubtext}>{getString('quiz.checkBackSoon')}</Text>
          </View>
        ) : (
          topics.map((topic) => (
            <TouchableOpacity
              key={topic.topic_id}
              style={styles.topicCard}
              onPress={topic.action}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.topic_title}</Text>
                <Text style={styles.topicCategory}>{topic.category}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  insightsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: '#f8fafc',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  insightsButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  insightsDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  topicsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingTopics: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topicEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  topicCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  topicDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 18,
    color: '#9CA3AF',
    marginLeft: spacing.sm,
  },
  // Analytics styles
  analyticsHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  analyticsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  insightSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  highPriorityCard: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  actionItems: {
    marginTop: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  actionItem: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    marginBottom: 2,
  },
  doneButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 