import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { AssessmentProgress, EnhancedAssessmentProgressStorage } from '../../lib/enhanced-progress-storage';
import { AssessmentCleanupService } from '../../lib/services/assessment-cleanup-service';

interface IncompleteAssessmentCardProps {
  assessment: AssessmentProgress;
  onResume?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  simultaneousHandlers?: React.RefObject<any>[];
}

export const IncompleteAssessmentCard: React.FC<IncompleteAssessmentCardProps> = ({
  assessment,
  onResume,
  onDelete,
  compact = false,
  simultaneousHandlers,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // Animation refs for swipe-to-delete
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const getAssessmentTitle = () => {
    switch (assessment.assessmentType) {
      case 'civics_test':
        return 'Civics Comprehensive Test';
      case 'skill_assessment':
        return 'Skills Assessment';
      case 'placement_test':
        return 'Placement Test';
      default:
        return 'Assessment';
    }
  };

  const getAssessmentIcon = () => {
    switch (assessment.assessmentType) {
      case 'civics_test':
        return 'school-outline';
      case 'skill_assessment':
        return 'analytics-outline';
      case 'placement_test':
        return 'checkmark-circle-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getProgressPercentage = () => {
    if (assessment.metadata.totalQuestions === 0) return 0;
    return Math.round((assessment.metadata.questionsAnswered / assessment.metadata.totalQuestions) * 100);
  };

  const getTimeElapsed = () => {
    const hours = Math.floor(assessment.timeSpent / 3600);
    const minutes = Math.floor((assessment.timeSpent % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTimeSinceLastSaved = () => {
    const now = new Date();
    const lastSaved = new Date(assessment.lastSavedAt);
    const diffInMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const handleResume = () => {
    if (onResume) {
      onResume();
    } else {
      // Default navigation
      router.push(`/assessment-session/${assessment.sessionId}?type=${assessment.assessmentType}` as any);
    }
  };

  // Enhanced delete with comprehensive cleanup
  const handleDelete = async () => {
    const assessmentTitle = getAssessmentTitle();
    
    Alert.alert(
      'Delete Assessment Progress?',
      `This will permanently delete your progress on "${assessmentTitle}". You'll need to start over.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Start deletion animation
              Animated.parallel([
                Animated.timing(scale, {
                  toValue: 0.9,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 0.5,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();

              if (user?.id) {
                // Use comprehensive cleanup service for authenticated users
                const result = await AssessmentCleanupService.cleanupCivicsTestData(user.id, assessment.sessionId);
                if (!result.success) {
                  console.error('Cleanup service error:', result.error);
                }
              }
              
              // Clear local progress storage
              await EnhancedAssessmentProgressStorage.clearProgress(assessment.sessionId, 'abandoned');
              
              console.log(`🗑️ Successfully deleted assessment progress: ${assessment.sessionId}`);
              
              // Call onDelete callback
              if (onDelete) {
                onDelete();
              }
              
            } catch (error) {
              console.error('❌ Error deleting assessment progress:', error);
              
              // Reset animations on error
              Animated.parallel([
                Animated.timing(scale, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
              
              Alert.alert('Error', 'Failed to delete assessment progress. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle pan gesture for swipe-to-delete
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const swipeThreshold = 100; // Reduced threshold for easier triggering
      const velocityThreshold = 400; // Reduced velocity threshold
      
      const shouldDelete = Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold;
      
      if (shouldDelete && translationX < 0) { // Left swipe only
        // Animate to delete position and trigger delete
        Animated.timing(translateX, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          handleDelete();
        });
      } else {
        // Animate back to original position
        Animated.spring(translateX, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const progressPercentage = getProgressPercentage();

  if (compact) {
    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-15, 10]}  // More specific: easier to trigger left swipe (-15), harder right swipe (10)
        failOffsetY={[-20, 20]}    // Allow vertical scrolling to work
        {...(simultaneousHandlers && { simultaneousHandlers })}
        shouldCancelWhenOutside={true}
      >
        <Animated.View
          style={[
            {
              transform: [
                { translateX },
                { scale },
              ],
              opacity,
            },
          ]}
        >
          <TouchableOpacity onPress={handleResume} style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.compactContent}>
              <View style={styles.compactHeader}>
                <Ionicons name={getAssessmentIcon() as any} size={20} color={theme.primary} />
                <Text style={[styles.compactTitle, { color: theme.foreground }]} numberOfLines={1}>
                  {getAssessmentTitle()}
                </Text>
              </View>
              
              <View style={styles.compactProgress}>
                <View style={[styles.compactProgressBar, { backgroundColor: theme.border + '30' }]}>
                  <View
                    style={[
                      styles.compactProgressFill,
                      { 
                        width: `${progressPercentage}%`,
                        backgroundColor: theme.primary,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.compactProgressText, { color: theme.foregroundSecondary }]}>
                  {progressPercentage}%
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={16} color={theme.foregroundSecondary} />
          </TouchableOpacity>
          
          {/* Swipe indicator */}
          <Animated.View
            style={[
              styles.swipeIndicator,
              {
                opacity: translateX.interpolate({
                  inputRange: [-120, -60, 0],
                  outputRange: [1, 0.7, 0],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [-120, 0],
                      outputRange: [0, 40],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.swipeText}>Delete</Text>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-15, 10]}  // More specific: easier to trigger left swipe (-15), harder right swipe (10)
      failOffsetY={[-20, 20]}    // Allow vertical scrolling to work
      {...(simultaneousHandlers && { simultaneousHandlers })}
      shouldCancelWhenOutside={true}
    >
      <Animated.View
        style={[
          {
            transform: [
              { translateX },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        <Card style={StyleSheet.flatten([styles.card, { backgroundColor: theme.card }])} variant="outlined">
          <View style={styles.cardContent}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name={getAssessmentIcon() as any} size={24} color={theme.primary} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: theme.foreground }]}>
                    {getAssessmentTitle()}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.foregroundSecondary }]}>
                    Last saved {getTimeSinceLastSaved()}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={theme.foregroundSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressLabel, { color: theme.foregroundSecondary }]}>
                  Progress
                </Text>
                <Text style={[styles.progressValue, { color: theme.foreground }]}>
                  {assessment.metadata.questionsAnswered} of {assessment.metadata.totalQuestions} questions
                </Text>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: theme.border + '30' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: theme.primary,
                    }
                  ]} 
                />
              </View>
              
              <Text style={[styles.progressPercentage, { color: theme.primary }]}>
                {progressPercentage}% Complete
              </Text>
            </View>

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={theme.foregroundSecondary} />
                <Text style={[styles.metaText, { color: theme.foregroundSecondary }]}>
                  {getTimeElapsed()} spent
                </Text>
              </View>
              
              {assessment.metadata.categoryProgress && (
                <View style={styles.metaItem}>
                  <Ionicons name="analytics-outline" size={16} color={theme.foregroundSecondary} />
                  <Text style={[styles.metaText, { color: theme.foregroundSecondary }]}>
                    {Object.keys(assessment.metadata.categoryProgress).length} categories
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.resumeButton, { backgroundColor: theme.primary }]}
              onPress={handleResume}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.resumeButtonText}>Continue Assessment</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Swipe indicator for full card */}
        <Animated.View
          style={[
            styles.swipeIndicatorFull,
            {
              opacity: translateX.interpolate({
                inputRange: [-120, -60, 0],
                outputRange: [1, 0.7, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-120, 0],
                    outputRange: [0, 40],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="trash" size={24} color="#FFFFFF" />
          <Text style={styles.swipeText}>Delete</Text>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.footnote,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.footnote,
    fontWeight: '500',
  },
  progressValue: {
    ...typography.footnote,
    fontWeight: '600',
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
  progressPercentage: {
    ...typography.footnote,
    fontWeight: '600',
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption1,
    fontWeight: '500',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  resumeButtonText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  compactTitle: {
    ...typography.callout,
    fontWeight: '600',
    flex: 1,
  },
  compactProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactProgressText: {
    ...typography.caption1,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  // Swipe-to-delete styles
  swipeIndicator: {
    position: 'absolute',
    right: -80,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    gap: spacing.xs,
  },
  swipeText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  swipeIndicatorFull: {
    position: 'absolute',
    right: -100,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#EF4444',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    gap: spacing.xs,
  },
}); 