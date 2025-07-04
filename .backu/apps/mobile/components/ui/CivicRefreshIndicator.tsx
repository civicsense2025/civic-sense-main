/**
 * ============================================================================
 * CIVIC REFRESH INDICATOR
 * ============================================================================
 * 
 * Custom refresh indicator for CivicSense that provides smooth visual feedback
 * during pull-to-refresh operations. Features branded animations and progress.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface CivicRefreshIndicatorProps {
  /** Whether refresh is in progress */
  refreshing: boolean;
  /** Current progress (0-1) */
  progress?: number;
  /** Current refresh stage description */
  stage?: string;
  /** Custom refresh message */
  message?: string;
  /** Show detailed progress */
  showProgress?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

// ============================================================================
// CIVIC REFRESH INDICATOR COMPONENT
// ============================================================================

export function CivicRefreshIndicator({
  refreshing,
  progress = 0,
  stage = '',
  message = 'Refreshing civic content...',
  showProgress = false,
  compact = false,
}: CivicRefreshIndicatorProps) {
  const { theme } = useTheme();
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  // Spin animation for the refresh icon
  useEffect(() => {
    if (refreshing) {
      // Start animations
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // End animations
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset spin
      spinValue.setValue(0);
    }
  }, [refreshing]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!refreshing && !compact) return null;

  const containerStyle = compact ? styles.compactContainer : styles.container;
  const iconSize = compact ? 16 : 20;
  const textVariant = compact ? 'caption1' : 'footnote';

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      {/* Main content */}
      <View style={styles.content}>
        {/* Civic-themed icon with spin animation */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons 
            name="refresh-outline" 
            size={iconSize} 
            color={theme.primary} 
          />
        </Animated.View>

        {/* Message and stage */}
        <View style={styles.textContainer}>
          <Text variant={textVariant} color="inherit" style={styles.message}>
            {message}
          </Text>
          
          {showProgress && stage && (
            <Text variant="caption" color="secondary" style={styles.stage}>
              {stage}
            </Text>
          )}
        </View>

        {/* Democracy icon for branding */}
        <View style={[styles.brandIcon, { backgroundColor: theme.primary + '15' }]}>
          <Text style={styles.brandEmoji}>🗳️</Text>
        </View>
      </View>

      {/* Progress bar */}
      {showProgress && (
        <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.primary,
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// SPECIALIZED REFRESH INDICATORS
// ============================================================================

/**
 * Minimal refresh indicator for compact spaces
 */
export function CompactRefreshIndicator(props: Omit<CivicRefreshIndicatorProps, 'compact'>) {
  return (
    <CivicRefreshIndicator
      {...props}
      compact
    />
  );
}

/**
 * Detailed refresh indicator with progress
 */
export function DetailedRefreshIndicator(props: Omit<CivicRefreshIndicatorProps, 'showProgress'>) {
  return (
    <CivicRefreshIndicator
      {...props}
      showProgress
    />
  );
}

/**
 * Home screen refresh indicator with civic messaging
 */
export function HomeRefreshIndicator(props: { refreshing: boolean } & Partial<Omit<CivicRefreshIndicatorProps, 'refreshing'>>) {
  return (
    <CivicRefreshIndicator
      message="Updating civic content..."
      showProgress
      {...props}
    />
  );
}

/**
 * Quiz refresh indicator
 */
export function QuizRefreshIndicator(props: { refreshing: boolean } & Partial<Omit<CivicRefreshIndicatorProps, 'refreshing'>>) {
  return (
    <CivicRefreshIndicator
      message="Loading fresh quiz content..."
      {...props}
    />
  );
}

/**
 * Profile refresh indicator
 */
export function ProfileRefreshIndicator(props: { refreshing: boolean } & Partial<Omit<CivicRefreshIndicatorProps, 'refreshing'>>) {
  return (
    <CivicRefreshIndicator
      message="Refreshing your progress..."
      {...props}
    />
  );
}

// ============================================================================
// PULL-TO-REFRESH VISUAL FEEDBACK
// ============================================================================

/**
 * Custom pull-to-refresh visual that appears during the pull gesture
 */
export function PullToRefreshFeedback({
  pullDistance = 0,
  triggerDistance = 60,
  isTriggered = false,
}: {
  pullDistance?: number;
  triggerDistance?: number;
  isTriggered?: boolean;
}) {
  const { theme } = useTheme();
  
  const progress = Math.min(pullDistance / triggerDistance, 1);
  const rotation = progress * 180; // Half rotation at trigger
  
  return (
    <View style={[styles.pullFeedback, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.pullIndicator,
          {
            backgroundColor: isTriggered ? theme.primary : theme.border,
            transform: [
              { scale: 0.8 + (progress * 0.2) },
              { rotate: `${rotation}deg` },
            ],
          },
        ]}
      >
        <Ionicons
          name={isTriggered ? "checkmark" : "arrow-down"}
          size={16}
          color={isTriggered ? 'white' : theme.foregroundSecondary}
        />
      </View>
      
      <Text 
        variant="caption1" 
        color={isTriggered ? 'primary' : 'secondary'} 
        style={styles.pullText}
      >
        {isTriggered ? 'Release to refresh' : 'Pull to refresh'}
      </Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontWeight: '500',
  },
  stage: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  brandIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: {
    fontSize: 12,
  },
  progressContainer: {
    height: 3,
    borderRadius: 1.5,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },

  // Pull-to-refresh feedback
  pullFeedback: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  pullIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullText: {
    fontSize: 11,
    fontWeight: '500',
  },
}); 