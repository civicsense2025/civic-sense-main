/**
 * ============================================================================
 * ADVANCED LEARNING INSIGHTS COMPONENT (MOBILE)
 * ============================================================================
 * Displays comprehensive learning analytics from the MobileAnalyticsService
 * with real-time updates and intervention suggestions
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native'
import MobileAnalyticsService, { 
  type LearningInsights, 
  type RealTimeLearningUpdate 
} from '../../lib/analytics-service'

interface AdvancedLearningInsightsProps {
  userId: string
  onClose?: () => void
}

export function AdvancedLearningInsights({ 
  userId, 
  onClose 
}: AdvancedLearningInsightsProps) {
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeLearningUpdate | null>(null)
  const [lastUpdateId, setLastUpdateId] = useState<string | undefined>()

  // Load initial insights
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true)
      const data = typeof (MobileAnalyticsService as any).getUserLearningInsights === 'function'
        ? await (MobileAnalyticsService as any).getUserLearningInsights(userId)
        : await MobileAnalyticsService.getLearningInsights(userId)
      setInsights(data)
    } catch (error) {
      console.error('Error loading insights:', error)
      Alert.alert('Error', 'Could not load learning insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    try {
      setRefreshing(true)
      const data = typeof (MobileAnalyticsService as any).getUserLearningInsights === 'function'
        ? await (MobileAnalyticsService as any).getUserLearningInsights(userId)
        : await MobileAnalyticsService.getLearningInsights(userId)
      setInsights(data)
    } catch (error) {
      console.error('Error refreshing insights:', error)
      Alert.alert('Error', 'Could not refresh insights. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }, [userId])

  // Get real-time updates
  const getRealTimeUpdates = useCallback(async () => {
    try {
      const updates = await MobileAnalyticsService.getRealTimeLearningUpdate(userId, lastUpdateId)
      setRealTimeUpdates(updates)
      if (updates.lastUpdateId) {
        setLastUpdateId(updates.lastUpdateId)
      }
    } catch (error) {
      console.error('Error getting real-time updates:', error)
    }
  }, [userId, lastUpdateId])

  // Load insights on mount
  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  // Set up real-time update polling
  useEffect(() => {
    const interval = setInterval(() => {
      getRealTimeUpdates()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [getRealTimeUpdates])

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'strength': return '💪'
      case 'improvement': return '📈'
      case 'strategy': return '🎯'
      case 'warning': return '⚠️'
      default: return '💡'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626'
      case 'medium': return '#f59e0b'
      case 'low': return '#059669'
      default: return '#6b7280'
    }
  }

  const formatTimeframe = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'Act now'
      case 'short-term': return '1-2 weeks'
      case 'long-term': return '3+ weeks'
      default: return timeframe
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Analyzing your learning patterns...</Text>
        <Text style={styles.loadingSubtext}>This may take a moment</Text>
      </View>
    )
  }

  if (!insights) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load learning insights</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshInsights} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>📊 Learning Analytics</Text>
        <Text style={styles.subtitle}>Comprehensive insights into your civic learning journey</Text>
      </View>

      {/* Real-time Updates Banner */}
      {realTimeUpdates && realTimeUpdates.newResponses.length > 0 && (
        <View style={styles.realTimeSection}>
          <Text style={styles.realTimeTitle}>🔄 Recent Activity</Text>
          <View style={styles.realTimeCard}>
            <Text style={styles.realTimeText}>
              Recent accuracy: {Math.round(realTimeUpdates.quickInsights.recentAccuracy)}%
            </Text>
            <Text style={styles.realTimeText}>
              Avg response time: {Math.round(realTimeUpdates.quickInsights.avgResponseTime)}s
            </Text>
            <Text style={styles.realTimeSuggestion}>
              {realTimeUpdates.quickInsights.improvementSuggestion}
            </Text>
          </View>
        </View>
      )}

      {/* Cognitive Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Cognitive Patterns</Text>
        
        {/* Processing Speed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Processing Speed</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Trend:</Text>
            <Text style={[
              styles.metricValue,
              { color: insights.cognitivePatterns.processingSpeed.speedTrend === 'improving' ? '#059669' : 
                       insights.cognitivePatterns.processingSpeed.speedTrend === 'declining' ? '#dc2626' : '#6b7280' }
            ]}>
              {insights.cognitivePatterns.processingSpeed.speedTrend}
            </Text>
          </View>
          <Text style={styles.cardDetail}>
            Fast questions: {insights.cognitivePatterns.processingSpeed.fastQuestions.length}
          </Text>
          <Text style={styles.cardDetail}>
            Slower questions: {insights.cognitivePatterns.processingSpeed.slowQuestions.length}
          </Text>
        </View>

        {/* Confidence Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Confidence Patterns</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Quick correct:</Text>
            <Text style={styles.metricValue}>
              {Math.round(insights.cognitivePatterns.confidenceMetrics.quickCorrect)}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Hint usage:</Text>
            <Text style={styles.metricValue}>
              {insights.cognitivePatterns.confidenceMetrics.hintUsagePattern}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Hesitation index:</Text>
            <Text style={styles.metricValue}>
              {(insights.cognitivePatterns.confidenceMetrics.hesitationIndex * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Learning Style */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Learning Style</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Preferred question types:</Text>
          </View>
          {insights.cognitivePatterns.learningStyle.preferredQuestionTypes.map((type, index) => (
            <Text key={index} style={styles.cardDetail}>• {type}</Text>
          ))}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Processing style:</Text>
            <Text style={styles.metricValue}>
              {insights.cognitivePatterns.learningStyle.visualVsTextual}
            </Text>
          </View>
        </View>
      </View>

      {/* Learning Trajectory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Learning Trajectory</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎓 Current Level</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>
              {insights.learningTrajectory.currentLevel.toUpperCase()}
            </Text>
            <Text style={styles.levelSubtext}>
              Growth: {insights.learningTrajectory.projectedGrowth}
            </Text>
          </View>
          <Text style={styles.cardDetail}>
            Time to next level: {insights.learningTrajectory.timeToNextLevel}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Recommended Focus Areas</Text>
          {insights.learningTrajectory.recommendedFocus.length > 0 ? (
            insights.learningTrajectory.recommendedFocus.map((area, index) => (
              <Text key={index} style={styles.cardDetail}>• {area}</Text>
            ))
          ) : (
            <Text style={styles.cardDetail}>Continue your current learning path</Text>
          )}
        </View>
      </View>

      {/* Personalized Recommendations */}
      {insights.personalizedRecommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Personalized Recommendations</Text>
          
          {insights.personalizedRecommendations.map((rec, index) => (
            <View 
              key={index} 
              style={[
                styles.recommendationCard,
                { borderLeftColor: getPriorityColor(rec.priority) }
              ]}
            >
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationIcon}>
                  {getRecommendationIcon(rec.type)}
                </Text>
                <View style={styles.recommendationTitleContainer}>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <View style={styles.recommendationMeta}>
                    <Text style={[styles.priority, { color: getPriorityColor(rec.priority) }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                    <Text style={styles.timeframe}>
                      {formatTimeframe(rec.timeframe)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.recommendationDescription}>
                {rec.description}
              </Text>
              
              <Text style={styles.recommendationImpact}>
                Expected impact: {rec.expectedImpact}
              </Text>
              
              <View style={styles.actionSteps}>
                <Text style={styles.actionStepsTitle}>Action Steps:</Text>
                {rec.actionItems.map((action, actionIndex) => (
                  <Text key={actionIndex} style={styles.actionStep}>
                    • {action}
                  </Text>
                ))}
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { width: `${rec.confidence * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(rec.confidence * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 These insights are based on your recent quiz performance and learning patterns.
        </Text>
        <Text style={styles.footerSubtext}>
          Keep practicing to see your progress evolve!
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8fafc'
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
    zIndex: 1
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24
  },
  realTimeSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8fafc'
  },
  realTimeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  realTimeCard: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6'
  },
  realTimeText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4
  },
  realTimeSuggestion: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginTop: 8
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  cardDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 8
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 12
  },
  levelText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a'
  },
  levelSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2
  },
  recommendationTitleContainer: {
    flex: 1
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  recommendationMeta: {
    flexDirection: 'row',
    gap: 12
  },
  priority: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  timeframe: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600'
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12
  },
  recommendationImpact: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12
  },
  actionSteps: {
    marginBottom: 16
  },
  actionStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  actionStep: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    marginLeft: 8
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3
  },
  confidenceText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600'
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4
  }
})

export default AdvancedLearningInsights 