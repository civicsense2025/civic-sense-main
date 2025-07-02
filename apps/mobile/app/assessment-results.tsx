import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { Text } from '../components/atoms/Text';
import { Card } from '../components/ui/Card';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/molecules/LoadingSpinner';
import { ResultIcon } from '../components/atoms/ResultIcon';
import { spacing, borderRadius } from '../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  EnhancedAssessmentProgressStorage, 
  type AssessmentProgress 
} from '../lib/enhanced-progress-storage';
import { 
  AssessmentEngine, 
  type AssessmentQuestion, 
  type AssessmentResult 
} from '../lib/services/assessment-engine';

const { width: screenWidth } = Dimensions.get('window');

interface MockAssessmentResult {
  session_id: string;
  total_score: number;
  percentage: number;
  category_breakdown: Record<string, {
    correct: number;
    total: number;
    percentage: number;
  }>;
  passed: boolean;
  passing_threshold: number;
  recommendations: string[];
}

interface DetailedQuestionResult {
  question: {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    category: string;
    difficulty: number;
  };
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}

// Helper function to generate personalized insights from results data
const generatePersonalizedInsights = (
  results: MockAssessmentResult,
  questionDetails: DetailedQuestionResult[]
): PersonalizedInsights => {
  const categoryPerformance = Object.entries(results.category_breakdown);
  const sortedByPerformance = categoryPerformance.sort((a, b) => b[1].percentage - a[1].percentage);
  
  const strongestCategories = sortedByPerformance.slice(0, 2).map(([cat]) => cat);
  const weakestCategories = sortedByPerformance.slice(-2).map(([cat]) => cat);
  
  const avgResponseTime = questionDetails.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / questionDetails.length;
  
  // Calculate consistency (how evenly distributed the correct answers are)
  const correctAnswers = questionDetails.filter(q => q.isCorrect).length;
  const consistency = Math.round((correctAnswers / questionDetails.length) * 100);
  
  const improvementAreas = weakestCategories.map(cat => 
    `Focus on ${cat} - scored ${results.category_breakdown[cat]?.percentage || 0}%`
  );
  
  const nextSteps = [
    `Study ${weakestCategories[0] || 'core concepts'} in detail`,
    `Practice more questions in ${weakestCategories[1] || 'weak areas'}`,
    `Review explanations for incorrect answers`,
    results.passed ? 'Maintain your strong performance' : 'Retake assessment when ready'
  ];
  
  return {
    strongestCategories,
    weakestCategories,
    avgResponseTime: Math.round(avgResponseTime),
    consistency,
    improvementAreas,
    nextSteps
  };
};

interface PersonalizedInsights {
  strongestCategories: string[];
  weakestCategories: string[];
  avgResponseTime: number;
  consistency: number;
  improvementAreas: string[];
  nextSteps: string[];
}

export default function AssessmentResultsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<MockAssessmentResult | null>(null);
  const [questionDetails, setQuestionDetails] = useState<DetailedQuestionResult[]>([]);
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsights | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const [showDetailedReview, setShowDetailedReview] = useState(false);

  useEffect(() => {
    loadAssessmentResults();
  }, []);

  const loadAssessmentResults = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        Alert.alert('Error', 'User session not found');
        router.back();
        return;
      }

      // Try to load actual results from AsyncStorage first
      try {
        const storedResults = await AsyncStorage.getItem('latest_assessment_results');
        if (storedResults) {
          const resultsData = JSON.parse(storedResults);
          
          // Convert stored data to our format
          const actualResults: MockAssessmentResult = resultsData.results;
          const actualQuestions: AssessmentQuestion[] = resultsData.questions;
          const actualAnswers: Record<string, string> = resultsData.answers;
          
          // Generate question details from actual data
          const actualQuestionDetails: DetailedQuestionResult[] = actualQuestions.map(question => ({
            question: {
              id: question.id,
              question: question.question,
              options: question.options,
              correct_answer: question.correct_answer,
              explanation: question.explanation,
              category: question.category,
              difficulty: question.difficulty
            },
            userAnswer: actualAnswers[question.id] || '',
            isCorrect: actualAnswers[question.id] === question.correct_answer,
            timeSpent: Math.floor(resultsData.timeSpent / actualQuestions.length), // Distribute time evenly
          }));
          
          // Generate personalized insights from actual data
          const actualInsights = generatePersonalizedInsights(actualResults, actualQuestionDetails);
          
          setResults(actualResults);
          setQuestionDetails(actualQuestionDetails);
          setPersonalizedInsights(actualInsights);
          
          // Clear the stored results after loading
          await AsyncStorage.removeItem('latest_assessment_results');
          
          console.log('✅ Loaded actual assessment results');
          return;
        }
      } catch (storageError) {
        console.warn('⚠️ Failed to load stored results:', storageError);
      }

      // Fallback to mock results if no actual results available
      console.log('📝 Using mock results for demo');
      const mockData = generateMockResults();
      
      setResults(mockData.results);
      setQuestionDetails(mockData.questionDetails);
      setPersonalizedInsights(mockData.insights);

    } catch (error) {
      console.error('❌ Error loading assessment results:', error);
      Alert.alert('Error', 'Failed to load assessment results');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = () => {
    const mockQuestions = [
      {
        id: 'q1',
        question: 'What are the three branches of the U.S. government?',
        options: ['Legislative, Executive, Judicial', 'Congress, Senate, House', 'Federal, State, Local', 'Democracy, Republic, Constitution'],
        correct_answer: 'Legislative, Executive, Judicial',
        explanation: 'The three branches are Legislative (makes laws), Executive (enforces laws), and Judicial (interprets laws), designed to provide checks and balances.',
        category: 'Government Structure',
        difficulty: 1
      },
      {
        id: 'q2',
        question: 'How many amendments are there to the Constitution?',
        options: ['25', '27', '28', '30'],
        correct_answer: '27',
        explanation: 'There are currently 27 amendments to the U.S. Constitution, with the most recent being the 27th Amendment ratified in 1992.',
        category: 'Constitutional Law',
        difficulty: 2
      },
      {
        id: 'q3',
        question: 'What is the purpose of the Electoral College?',
        options: ['To educate voters', 'To count popular votes', 'To elect the President', 'To register voters'],
        correct_answer: 'To elect the President',
        explanation: 'The Electoral College is the mechanism by which the President and Vice President are elected, not by direct popular vote.',
        category: 'Elections',
        difficulty: 2
      },
      {
        id: 'q4',
        question: 'Which amendment guarantees freedom of speech?',
        options: ['First Amendment', 'Second Amendment', 'Fourth Amendment', 'Fifth Amendment'],
        correct_answer: 'First Amendment',
        explanation: 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.',
        category: 'Constitutional Rights',
        difficulty: 1
      },
      {
        id: 'q5',
        question: 'What is the term length for a U.S. Senator?',
        options: ['2 years', '4 years', '6 years', '8 years'],
        correct_answer: '6 years',
        explanation: 'U.S. Senators serve 6-year terms, while House Representatives serve 2-year terms.',
        category: 'Government Structure',
        difficulty: 2
      }
    ];

    const mockAnswers: Record<string, string> = {
      'q1': 'Legislative, Executive, Judicial', // Correct
      'q2': '25', // Incorrect
      'q3': 'To elect the President', // Correct
      'q4': 'First Amendment', // Correct
      'q5': '4 years', // Incorrect
    };

    // Calculate results
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    let totalCorrect = 0;

    mockQuestions.forEach(question => {
      const userAnswer = mockAnswers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) totalCorrect++;

      if (!categoryStats[question.category]) {
        categoryStats[question.category] = { correct: 0, total: 0 };
      }
      
      const categoryData = categoryStats[question.category];
      if (categoryData) {
        categoryData.total++;
        if (isCorrect) categoryData.correct++;
      }
    });

    const percentage = Math.round((totalCorrect / mockQuestions.length) * 100);
    const passed = percentage >= 70;

    const category_breakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      category_breakdown[category] = {
        correct: stats.correct,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      };
    });

    const recommendations = [
      'Study Constitutional amendments and their historical context',
      'Review the election process and Electoral College system',
      'Practice more questions about government structure',
      'Focus on Constitutional Law - your weakest area'
    ];

    const results: MockAssessmentResult = {
      session_id: 'mock_session',
      total_score: totalCorrect,
      percentage,
      category_breakdown,
      passed,
      passing_threshold: 70,
      recommendations
    };
    
    const questionDetails: DetailedQuestionResult[] = mockQuestions.map(question => ({
      question,
      userAnswer: mockAnswers[question.id] || '',
      isCorrect: mockAnswers[question.id] === question.correct_answer,
      timeSpent: Math.floor(Math.random() * 30) + 10,
    }));

    const insights: PersonalizedInsights = {
      strongestCategories: ['Government Structure', 'Constitutional Rights'],
      weakestCategories: ['Constitutional Law', 'Elections'],
      avgResponseTime: 22,
      consistency: 75,
      improvementAreas: [
        'Study the amendment process and Constitutional history',
        'Review election procedures and voting systems',
        'Practice more questions about Constitutional Law'
      ],
      nextSteps: [
        'Take the Constitutional Amendments quiz',
        'Read about the Electoral College system',
        'Review the Bill of Rights in detail',
        'Practice with intermediate-level civics questions'
      ]
    };

    return { results, questionDetails, insights };
  };

  const getPerformanceMessage = useCallback(() => {
    if (!results) return '';
    
    if (results.passed) {
      if (results.percentage >= 90) return 'Outstanding Performance! 🌟';
      if (results.percentage >= 80) return 'Excellent Work! 🎉';
      return 'Great Job - You Passed! 👏';
    } else {
      return 'Keep Learning - You\'ll Get There! 💪';
    }
  }, [results]);

  const getCategoryColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getPassingStatusColor = () => {
    return results?.passed ? '#10B981' : '#EF4444';
  };

  const incorrectQuestions = questionDetails.filter(q => !q.isCorrect);
  const displayQuestions = showIncorrectOnly ? incorrectQuestions : questionDetails;

  const handleShare = async () => {
    if (!results) return;
    
    const message = `I just completed the CivicSense Civics Assessment and scored ${results.percentage}%! 🏛️

${results.passed ? '✅ Passed' : '📚 Still learning'} - Join me in building civic knowledge that strengthens democracy!

#CivicEducation #Democracy`;
    
    try {
      await Share.share({
        message,
        title: 'CivicSense Assessment Results',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Analyzing your results..." />
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
            onPress={() => router.push('/(tabs)/home' as any)}
          >
            <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
          <Text variant="title2" color="inherit">Assessment Results</Text>
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
                value={results.percentage}
                suffix="%"
                style={{
                  fontSize: 48,
                  fontWeight: '700',
                  marginBottom: spacing.xs,
                  color: getPassingStatusColor()
                }}
                duration={1500}
              />
              <Text variant="body" color="secondary">
                {results.total_score} of {Object.keys(results.category_breakdown).reduce((sum, cat) => sum + (results.category_breakdown[cat]?.total || 0), 0)} correct
              </Text>
            </View>

            <View style={[styles.passingStatus, { backgroundColor: getPassingStatusColor() + '20' }]}>
              <Text variant="callout" style={{ color: getPassingStatusColor(), fontWeight: '600' }}>
                {results.passed ? '✅ PASSED' : '📚 NEEDS IMPROVEMENT'}
              </Text>
              <Text variant="footnote" color="secondary">
                Passing score: {results.passing_threshold}%
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            📊 Performance by Category
          </Text>
          {Object.entries(results.category_breakdown).map(([category, stats], index) => (
            <AnimatedCard
              key={category}
              style={styles.categoryCard}
              variant="outlined"
              delay={index * 100}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <Text variant="callout" color="inherit">{category}</Text>
                  <Text variant="callout" style={{ color: getCategoryColor(stats.percentage), fontWeight: '600' }}>
                    {stats.percentage}%
                  </Text>
                </View>
                <Text variant="footnote" color="secondary">
                  {stats.correct} of {stats.total} questions correct
                </Text>
                <View style={[styles.progressBar, { backgroundColor: theme.border + '30' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${stats.percentage}%`,
                        backgroundColor: getCategoryColor(stats.percentage),
                      }
                    ]} 
                  />
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Personalized Insights */}
        {personalizedInsights && (
          <View style={styles.section}>
            <Text variant="title3" color="inherit" style={styles.sectionTitle}>
              🧠 Your Learning Profile
            </Text>
            
            <Card style={styles.insightsCard} variant="outlined">
              <View style={styles.insightRow}>
                <Text variant="callout" color="inherit">💪 Strongest Areas</Text>
                <Text variant="body" color="secondary">
                  {personalizedInsights.strongestCategories.join(', ')}
                </Text>
              </View>
              
              <View style={styles.insightRow}>
                <Text variant="callout" color="inherit">📈 Focus Areas</Text>
                <Text variant="body" color="secondary">
                  {personalizedInsights.weakestCategories.join(', ')}
                </Text>
              </View>
              
              <View style={styles.insightRow}>
                <Text variant="callout" color="inherit">⏱️ Average Response Time</Text>
                <Text variant="body" color="secondary">
                  {personalizedInsights.avgResponseTime} seconds
                </Text>
              </View>
              
              <View style={styles.insightRow}>
                <Text variant="callout" color="inherit">🎯 Consistency Score</Text>
                <Text variant="body" color="secondary">
                  {personalizedInsights.consistency}%
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text variant="title3" color="inherit" style={styles.sectionTitle}>
            💡 Personalized Recommendations
          </Text>
          {results.recommendations.map((rec, index) => (
            <AnimatedCard
              key={index}
              style={styles.recommendationCard}
              variant="outlined"
              delay={index * 100}
            >
              <Text variant="body" color="inherit" style={styles.recommendationText}>
                {rec}
              </Text>
            </AnimatedCard>
          ))}
        </View>

        {/* Next Steps */}
        {personalizedInsights && (
          <View style={styles.section}>
            <Text variant="title3" color="inherit" style={styles.sectionTitle}>
              🎯 Your Next Steps
            </Text>
            {personalizedInsights.nextSteps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={styles.nextStepCard}
              >
                <Card variant="outlined">
                  <View style={styles.nextStepContent}>
                    <Text variant="body" color="inherit" style={styles.nextStepText}>
                      {index + 1}. {step}
                    </Text>
                    <Text style={[styles.arrow, { color: theme.primary }]}>→</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Question Review */}
        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text variant="title3" color="inherit">
              📝 Question Review
            </Text>
            <View style={styles.reviewFilters}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  !showIncorrectOnly && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => setShowIncorrectOnly(false)}
              >
                <Text variant="footnote" style={{ 
                  color: !showIncorrectOnly ? theme.primary : theme.foregroundSecondary 
                }}>
                  All ({questionDetails.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  showIncorrectOnly && { backgroundColor: '#EF4444' + '20' }
                ]}
                onPress={() => setShowIncorrectOnly(true)}
              >
                <Text variant="footnote" style={{ 
                  color: showIncorrectOnly ? '#EF4444' : theme.foregroundSecondary 
                }}>
                  Incorrect ({incorrectQuestions.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setShowDetailedReview(!showDetailedReview)}
          >
            <Text variant="body" color="primary">
              {showDetailedReview ? 'Hide Details' : 'Show Detailed Review'}
            </Text>
            <Text style={[styles.expandIcon, { color: theme.primary }]}>
              {showDetailedReview ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showDetailedReview && (
            <View style={styles.questionReviewContainer}>
              {displayQuestions.map((questionResult, index) => (
                <Card
                  key={questionResult.question.id}
                  style={[
                    styles.questionReviewCard,
                    {
                      borderLeftColor: questionResult.isCorrect ? '#10B981' : '#EF4444',
                      borderLeftWidth: 4,
                    }
                  ] as any}
                  variant="outlined"
                >
                  <View style={styles.questionReviewContent}>
                    <View style={styles.questionHeader}>
                      <Text variant="callout" color="inherit" style={styles.questionNumber}>
                        Question {questionDetails.indexOf(questionResult) + 1}
                      </Text>
                      <ResultIcon
                        isCorrect={questionResult.isCorrect}
                        size={20}
                      />
                    </View>
                    
                    <Text variant="body" color="inherit" style={styles.questionText}>
                      {questionResult.question.question}
                    </Text>
                    
                    <View style={styles.answerSection}>
                      <View style={styles.answerRow}>
                        <Text variant="footnote" color="secondary">Your answer:</Text>
                        <Text
                          variant="footnote"
                          style={{
                            color: questionResult.isCorrect ? '#10B981' : '#EF4444',
                            fontWeight: '600'
                          }}
                        >
                          {questionResult.userAnswer}
                        </Text>
                      </View>
                      
                      {!questionResult.isCorrect && (
                        <View style={styles.answerRow}>
                          <Text variant="footnote" color="secondary">Correct answer:</Text>
                          <Text variant="footnote" style={{ color: '#10B981', fontWeight: '600' }}>
                            {questionResult.question.correct_answer}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {questionResult.question.explanation && (
                      <View style={styles.explanationSection}>
                        <Text variant="footnote" color="secondary" style={styles.explanationLabel}>
                          Explanation:
                        </Text>
                        <Text variant="footnote" color="secondary" style={styles.explanationText}>
                          {questionResult.question.explanation}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.questionMeta}>
                      <Text variant="footnote" color="secondary">
                        Category: {questionResult.question.category}
                      </Text>
                      {questionResult.timeSpent && (
                        <Text variant="footnote" color="secondary">
                          Time: {questionResult.timeSpent}s
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
            title="Retake Assessment"
            onPress={() => router.push('/civics-test' as any)}
            variant="outlined"
            style={styles.actionButton}
          />
          <Button
            title="Continue Learning"
            onPress={() => router.push('/(tabs)/discover' as any)}
            style={styles.actionButton}
          />
        </View>
        
        <View style={styles.bottomSpacing} />
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
    paddingTop: spacing.lg,
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
    alignItems: 'center',
    padding: spacing.lg,
  },
  performanceMessage: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passingStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.sm,
  },
  categoryContent: {
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightsCard: {
    padding: spacing.md,
  },
  insightRow: {
    marginBottom: spacing.md,
  },
  recommendationCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  recommendationText: {
    lineHeight: 20,
  },
  nextStepCard: {
    marginBottom: spacing.sm,
  },
  nextStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  nextStepText: {
    flex: 1,
    lineHeight: 20,
  },
  arrow: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewFilters: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  questionReviewContainer: {
    gap: spacing.md,
  },
  questionReviewCard: {
    marginBottom: spacing.sm,
  },
  questionReviewContent: {
    padding: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionNumber: {
    fontWeight: '600',
  },
  questionText: {
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  answerSection: {
    marginBottom: spacing.md,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  explanationSection: {
    backgroundColor: '#F3F4F6',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  explanationLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  explanationText: {
    lineHeight: 18,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    margin: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: spacing.lg,
  },
}); 