import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { AssessmentProgress } from '../../lib/enhanced-progress-storage';

interface ProgressAnalyticsProps {
  assessments: AssessmentProgress[];
  userProgress?: any[];
}

interface AnalyticsData {
  totalAssessments: number;
  completedAssessments: number;
  totalTimeSpent: number;
  averageProgress: number;
  categoryBreakdown: Record<string, { answered: number; total: number }>;
  streakData: {
    currentStreak: number;
    longestStreak: number;
  };
  performanceMetrics: {
    averageTimePerQuestion: number;
    mostActiveCategory: string;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  assessments,
  userProgress = [],
}) => {
  const { theme } = useTheme();

  const calculateAnalytics = (): AnalyticsData => {
    const totalAssessments = assessments.length;
    const completedAssessments = assessments.filter(a => 
      a.currentQuestionIndex >= a.metadata.totalQuestions - 1
    ).length;

    const totalTimeSpent = assessments.reduce((sum, a) => sum + a.timeSpent, 0);
    const totalQuestions = assessments.reduce((sum, a) => sum + a.metadata.questionsAnswered, 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    const averageProgress = totalAssessments > 0 
      ? assessments.reduce((sum, a) => {
          const progress = a.metadata.totalQuestions > 0 
            ? (a.metadata.questionsAnswered / a.metadata.totalQuestions) * 100 
            : 0;
          return sum + progress;
        }, 0) / totalAssessments
      : 0;

    // Aggregate category progress
    const categoryBreakdown: Record<string, { answered: number; total: number }> = {};
    assessments.forEach(assessment => {
      if (assessment.metadata.categoryProgress) {
        Object.entries(assessment.metadata.categoryProgress).forEach(([category, progress]) => {
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = { answered: 0, total: 0 };
          }
          categoryBreakdown[category].answered += progress.answered;
          categoryBreakdown[category].total += progress.total;
        });
      }
    });

    // Find most active category
    const mostActiveCategory = Object.entries(categoryBreakdown)
      .reduce((max, [category, data]) => {
        return data.answered > (categoryBreakdown[max]?.answered || 0) ? category : max;
      }, Object.keys(categoryBreakdown)[0] || 'General');

    // Calculate improvement trend (simplified)
    const improvementTrend: 'improving' | 'stable' | 'declining' = 
      averageProgress > 70 ? 'improving' : 
      averageProgress > 40 ? 'stable' : 'declining';

    return {
      totalAssessments,
      completedAssessments,
      totalTimeSpent,
      averageProgress,
      categoryBreakdown,
      streakData: {
        currentStreak: 0, // Would be calculated from user progress
        longestStreak: 0,
      },
      performanceMetrics: {
        averageTimePerQuestion,
        mostActiveCategory,
        improvementTrend,
      },
    };
  };

  const analytics = calculateAnalytics();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimePerQuestion = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    return `${Math.round(seconds / 60)}m`;
  };

  const getImprovementColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#10B981';
      case 'stable': return '#F59E0B';
      case 'declining': return '#EF4444';
      default: return theme.foregroundSecondary;
    }
  };

  const getImprovementIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'stable': return 'remove';
      case 'declining': return 'trending-down';
      default: return 'remove';
    }
  };

  if (assessments.length === 0) {
    return (
      <Card style={styles.emptyCard} variant="outlined">
        <View style={styles.emptyContent}>
          <Ionicons name="analytics-outline" size={48} color={theme.foregroundSecondary + '40'} />
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
            No Assessment Data
          </Text>
          <Text style={[styles.emptyText, { color: theme.foregroundSecondary }]}>
            Start taking assessments to see your progress analytics
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
      {/* Overview Card */}
      <Card style={[styles.analyticsCard, { backgroundColor: theme.card }] as any} variant="outlined">
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={24} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>Overview</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {analytics.totalAssessments}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.foregroundSecondary }]}>
              Total Assessments
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {analytics.completedAssessments}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.foregroundSecondary }]}>
              Completed
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={[styles.progressLabel, { color: theme.foregroundSecondary }]}>
            Average Progress
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border + '30' }]}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(analytics.averageProgress, 100)}%`,
                  backgroundColor: theme.primary,
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressValue, { color: theme.primary }]}>
            {Math.round(analytics.averageProgress)}%
          </Text>
        </View>
      </Card>

      {/* Time Analytics Card */}
      <Card style={[styles.analyticsCard, { backgroundColor: theme.card }] as any} variant="outlined">
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={[styles.cardTitle, { color: theme.foreground }]}>Time Analytics</Text>
        </View>
        
        <View style={styles.timeMetrics}>
          <View style={styles.timeMetric}>
            <Text style={[styles.timeValue, { color: '#F59E0B' }]}>
              {formatTime(analytics.totalTimeSpent)}
            </Text>
            <Text style={[styles.timeLabel, { color: theme.foregroundSecondary }]}>
              Total Time Spent
            </Text>
          </View>
          
          <View style={styles.timeMetric}>
            <Text style={[styles.timeValue, { color: theme.foreground }]}>
              {formatTimePerQuestion(analytics.performanceMetrics.averageTimePerQuestion)}
            </Text>
            <Text style={[styles.timeLabel, { color: theme.foregroundSecondary }]}>
              Avg per Question
            </Text>
          </View>
        </View>

        <View style={styles.trendSection}>
          <View style={styles.trendHeader}>
            <Ionicons 
              name={getImprovementIcon(analytics.performanceMetrics.improvementTrend) as any} 
              size={20} 
              color={getImprovementColor(analytics.performanceMetrics.improvementTrend)} 
            />
            <Text style={[styles.trendText, { color: getImprovementColor(analytics.performanceMetrics.improvementTrend) }]}>
              {analytics.performanceMetrics.improvementTrend.charAt(0).toUpperCase() + 
               analytics.performanceMetrics.improvementTrend.slice(1)}
            </Text>
          </View>
          <Text style={[styles.trendDescription, { color: theme.foregroundSecondary }]}>
            Performance Trend
          </Text>
        </View>
      </Card>

      {/* Category Breakdown Card */}
      {Object.keys(analytics.categoryBreakdown).length > 0 && (
        <Card style={[styles.analyticsCard, { backgroundColor: theme.card }] as any} variant="outlined">
          <View style={styles.cardHeader}>
            <Ionicons name="library" size={24} color="#8B5CF6" />
            <Text style={[styles.cardTitle, { color: theme.foreground }]}>Categories</Text>
          </View>
          
          <View style={styles.categoryList}>
            {Object.entries(analytics.categoryBreakdown)
              .sort(([,a], [,b]) => b.answered - a.answered)
              .slice(0, 4) // Show top 4 categories
              .map(([category, data]) => {
                const percentage = data.total > 0 ? (data.answered / data.total) * 100 : 0;
                const isTopCategory = category === analytics.performanceMetrics.mostActiveCategory;
                
                return (
                  <View key={category} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryName, { color: theme.foreground }]} numberOfLines={1}>
                        {category}
                        {isTopCategory && ' 🏆'}
                      </Text>
                      <Text style={[styles.categoryProgress, { color: theme.primary }]}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                    <View style={[styles.categoryProgressBar, { backgroundColor: theme.border + '30' }]}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          { 
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: isTopCategory ? '#10B981' : theme.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.categoryStats, { color: theme.foregroundSecondary }]}>
                      {data.answered}/{data.total} questions
                    </Text>
                  </View>
                );
              })}
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  analyticsCard: {
    width: 280,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.callout,
    fontWeight: '600',
  },

  // Overview metrics
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.title1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...typography.caption1,
    textAlign: 'center',
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabel: {
    ...typography.footnote,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Time metrics
  timeMetrics: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  timeMetric: {
    alignItems: 'center',
  },
  timeValue: {
    ...typography.title2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timeLabel: {
    ...typography.caption1,
    textAlign: 'center',
  },
  trendSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  trendText: {
    ...typography.callout,
    fontWeight: '600',
  },
  trendDescription: {
    ...typography.caption1,
  },

  // Category breakdown
  categoryList: {
    gap: spacing.md,
  },
  categoryItem: {
    paddingBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.footnote,
    fontWeight: '500',
    flex: 1,
  },
  categoryProgress: {
    ...typography.footnote,
    fontWeight: '600',
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryStats: {
    ...typography.caption,
    textAlign: 'center',
  },

  // Empty state
  emptyCard: {
    margin: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.footnote,
    textAlign: 'center',
  },
}); 