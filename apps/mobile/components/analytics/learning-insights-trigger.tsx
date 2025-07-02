import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../molecules/LoadingSpinner';
import { AdvancedLearningInsights } from './advanced-learning-insights';
import { spacing, borderRadius } from '../../lib/theme';
import useUIStrings from '../../lib/hooks/useUIStrings'

const { width: screenWidth } = Dimensions.get('window');

interface QuizPerformanceData {
  questionId?: string;
  isCorrect?: boolean;
  responseTime?: number;
  difficulty?: string;
  topicId?: string;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  streak?: number;
}

interface LearningInsightsTriggerProps {
  /** User ID for personalized insights */
  userId: string;
  
  /** Current quiz/game performance data */
  performanceData?: QuizPerformanceData;
  
  /** When to show insights trigger */
  triggerCondition?: 'never' | 'poor_performance' | 'good_streak' | 'quiz_complete' | 'always';
  
  /** Position of the trigger button */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  
  /** Whether to show as floating action button or inline component */
  variant?: 'fab' | 'inline' | 'banner';
  
  /** Custom styling */
  style?: any;
  
  /** Callback when insights are viewed */
  onInsightsViewed?: () => void;
  
  /** Callback when trigger is dismissed */
  onDismiss?: () => void;
}

export const LearningInsightsTrigger: React.FC<LearningInsightsTriggerProps> = ({
  userId,
  performanceData,
  triggerCondition = 'quiz_complete',
  position = 'bottom-right',
  variant = 'fab',
  style,
  onInsightsViewed,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { uiStrings } = useUIStrings();
  
  const [showTrigger, setShowTrigger] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightPreview, setInsightPreview] = useState<any>(null);
  const [triggerAnimation] = useState(new Animated.Value(0));

  // Memoize the condition check to avoid recreating on every render
  const shouldShow = useMemo(() => {
    if (!performanceData || triggerCondition === 'never') return false;
    if (triggerCondition === 'always') return true;

    const {
      isCorrect,
      currentQuestionIndex = 0,
      totalQuestions = 0,
      streak = 0,
    } = performanceData;

    switch (triggerCondition) {
      case 'poor_performance':
        // Show if user got 2 wrong in last 3 questions
        return currentQuestionIndex >= 3 && streak === 0;
        
      case 'good_streak':
        // Show if user has 3+ correct in a row
        return streak >= 3;
        
      case 'quiz_complete':
        // Show when quiz is finished
        return currentQuestionIndex >= totalQuestions && totalQuestions > 0;
        
      default:
        return false;
    }
  }, [performanceData, triggerCondition]);

  // Memoize the insight preview generation to avoid recreation
  const preview = useMemo(() => {
    if (!performanceData) return null;

    const {
      isCorrect,
      responseTime = 0,
      streak = 0,
      currentQuestionIndex = 0,
      totalQuestions = 0,
    } = performanceData;

    // Calculate quick insights
    const accuracy = currentQuestionIndex > 0 ? (streak / currentQuestionIndex) * 100 : 0;
    const avgResponseTime = responseTime;
    
    let insight = '';
    let emoji = '';
    let color: string = theme.primary;

    if (triggerCondition === 'quiz_complete') {
      if (accuracy >= 80) {
        insight = uiStrings.analytics?.excellentPerformance || 'Excellent performance!';
        emoji = '🎯';
        color = '#10B981';
      } else if (accuracy >= 60) {
        insight = uiStrings.analytics?.goodProgress || 'Good progress!';
        emoji = '📈';
        color = '#F59E0B';
      } else {
        insight = uiStrings.analytics?.keepLearning || 'Keep learning!';
        emoji = '💪';
        color = '#EF4444';
      }
    } else if (triggerCondition === 'good_streak') {
      insight = `${streak} in a row! You're on fire! 🔥`;
      emoji = '⚡';
      color = '#10B981';
    } else if (triggerCondition === 'poor_performance') {
      insight = uiStrings.analytics?.needHelp || 'Need some help?';
      emoji = '🤔';
      color = '#F59E0B';
    }

    return { insight, emoji, color };
  }, [performanceData, triggerCondition, theme.primary, uiStrings.analytics]);

  // Update preview when it changes
  useEffect(() => {
    setInsightPreview(preview);
  }, [preview]);

  // Handle trigger visibility separately to avoid infinite loops
  useEffect(() => {
    if (shouldShow && !showTrigger) {
      setShowTrigger(true);
      // Animate in
      Animated.spring(triggerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    } else if (!shouldShow && showTrigger) {
      // Animate out
      Animated.spring(triggerAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setShowTrigger(false);
      });
    }
  }, [shouldShow, showTrigger, triggerAnimation]);

  const handleOpenInsights = useCallback(() => {
    setShowInsights(true);
    onInsightsViewed?.();
  }, [onInsightsViewed]);

  const handleCloseInsights = useCallback(() => {
    setShowInsights(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowTrigger(false);
    Animated.spring(triggerAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    onDismiss?.();
  }, [triggerAnimation, onDismiss]);

  // Memoize position styles to avoid recreation
  const positionStyles = useMemo(() => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: spacing.lg, right: spacing.lg };
      case 'bottom-left':
        return { ...base, bottom: spacing.lg, left: spacing.lg };
      case 'top-right':
        return { ...base, top: spacing.lg, right: spacing.lg };
      case 'top-left':
        return { ...base, top: spacing.lg, left: spacing.lg };
      case 'center':
        return { 
          ...base, 
          top: '50%', 
          left: '50%',
          transform: [{ translateX: -screenWidth * 0.4 }, { translateY: -50 }]
        };
      default:
        return base;
    }
  }, [position]);

  if (!showTrigger || !insightPreview) return null;

  // FAB Variant
  if (variant === 'fab') {
    return (
      <>
        <Animated.View
          style={[
            positionStyles,
            {
              transform: [
                {
                  scale: triggerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
                {
                  rotate: triggerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '0deg'],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fab,
              { backgroundColor: insightPreview.color, shadowColor: insightPreview.color },
            ]}
            onPress={handleOpenInsights}
            activeOpacity={0.8}
          >
            <Text style={styles.fabEmoji}>{insightPreview.emoji}</Text>
          </TouchableOpacity>
          
          {/* Tooltip */}
          <View style={[styles.tooltip, { backgroundColor: theme.background }]}>
            <Text style={[styles.tooltipText, { color: theme.foreground }]}>
              {insightPreview.insight}
            </Text>
            <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={[styles.dismissText, { color: theme.foregroundSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Full Insights Modal */}
        <Modal
          visible={showInsights}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={handleCloseInsights}
        >
          <AdvancedLearningInsights 
            userId={userId} 
            onClose={handleCloseInsights}
          />
        </Modal>
      </>
    );
  }

  // Banner Variant
  if (variant === 'banner') {
    return (
      <>
        <Animated.View
          style={[
            styles.banner,
            { backgroundColor: theme.background },
            {
              transform: [
                {
                  translateY: triggerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
              opacity: triggerAnimation,
            },
            style,
          ]}
        >
          <TouchableOpacity
            style={styles.bannerContent}
            onPress={handleOpenInsights}
            activeOpacity={0.7}
          >
            <Text style={styles.bannerEmoji}>{insightPreview.emoji}</Text>
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerText, { color: theme.foreground }]}>
                {insightPreview.insight}
              </Text>
              <Text style={[styles.bannerSubtext, { color: theme.primary }]}>
                Tap for personalized insights →
              </Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.bannerDismiss}>
              <Text style={[styles.dismissText, { color: theme.foregroundSecondary }]}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>

        <Modal
          visible={showInsights}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={handleCloseInsights}
        >
          <AdvancedLearningInsights 
            userId={userId} 
            onClose={handleCloseInsights}
          />
        </Modal>
      </>
    );
  }

  // Inline Variant
  return (
    <>
      <Animated.View
        style={[
          styles.inline,
          {
            opacity: triggerAnimation,
            transform: [
              {
                scale: triggerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
          style,
        ]}
      >
        <Card style={[styles.inlineCard, { backgroundColor: theme.background }] as any} variant="outlined">
          <TouchableOpacity
            style={styles.inlineContent}
            onPress={handleOpenInsights}
            activeOpacity={0.7}
          >
            <Text style={styles.inlineEmoji}>{insightPreview.emoji}</Text>
            <View style={styles.inlineTextContainer}>
              <Text style={[styles.inlineTitle, { color: theme.foreground }]}>
                Learning Insights Available
              </Text>
              <Text style={[styles.inlineText, { color: theme.foregroundSecondary }]}>
                {insightPreview.insight}
              </Text>
            </View>
            <Text style={[styles.inlineArrow, { color: theme.primary }]}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDismiss} style={styles.inlineDismiss}>
            <Text style={[styles.dismissText, { color: theme.foregroundSecondary }]}>✕</Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      <Modal
        visible={showInsights}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={handleCloseInsights}
      >
        <AdvancedLearningInsights 
          userId={userId} 
          onClose={handleCloseInsights}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // FAB Styles
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabEmoji: {
    fontSize: 24,
  },
  tooltip: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    minWidth: 200,
    maxWidth: 250,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Banner Styles
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  bannerEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontSize: 12,
  },
  bannerDismiss: {
    padding: spacing.sm,
  },

  // Inline Styles
  inline: {
    marginVertical: spacing.sm,
  },
  inlineCard: {
    margin: spacing.md,
    position: 'relative',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  inlineEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  inlineTextContainer: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  inlineText: {
    fontSize: 14,
  },
  inlineArrow: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  inlineDismiss: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
  },
}); 