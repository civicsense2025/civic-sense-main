/**
 * DaySwitcher Component for CivicSense Mobile
 * 
 * Provides swipe-based navigation between days with smooth animations
 * and visual indicators for the current date. Supports both gesture-based
 * and button-based navigation for accessibility.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '../atoms/Text';
import { useTheme } from '../../lib/theme-context';
import { spacing, borderRadius, typography } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DayData {
  date: Date;
  displayText: string;
  isToday?: boolean;
  hasContent?: boolean;
  contentCount?: number;
}

export interface DaySwitcherProps {
  /** Current selected date */
  selectedDate: Date;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
  /** Maximum days to show in the past (default: 30) */
  maxPastDays?: number;
  /** Maximum days to show in the future (default: 7) */
  maxFutureDays?: number;
  /** Loading state */
  loading?: boolean;
  /** Custom date formatter - can return string or undefined */
  formatDate?: (date: Date) => string | undefined;
  /** Content count for each day */
  dayContentCounts?: Record<string, number>;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateKey(date1) === formatDateKey(date2);
};

const getRelativeDayText = (date: Date): string => {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -2) return '2 days ago';
  if (diffDays === 2) return 'In 2 days';
  
  // For other days, show abbreviated day name
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[date.getDay()];
};

// =============================================================================
// DAY SWITCHER COMPONENT
// =============================================================================

export const DaySwitcher: React.FC<DaySwitcherProps> = ({
  selectedDate,
  onDateChange,
  maxPastDays = 30,
  maxFutureDays = 0, // Future dates locked - content not available yet
  loading = false,
  formatDate,
  dayContentCounts = {},
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  
  // Generate available dates
  const availableDates = React.useMemo(() => {
    const dates: DayData[] = [];
    const today = new Date();
    
    // Helper function to safely get display text
    const getDisplayText = (date: Date, fallback: string): string => {
      if (formatDate) {
        try {
          const formatted = formatDate(date);
          return formatted || fallback;
        } catch (error) {
          console.warn('Error formatting date:', error);
          return fallback;
        }
      }
      return fallback;
    };
    
    // Add past dates
    for (let i = maxPastDays; i > 0; i--) {
      const date = addDays(today, -i);
      const dateKey = formatDateKey(date);
      dates.push({
        date,
        displayText: getDisplayText(date, getRelativeDayText(date)),
        isToday: false,
        hasContent: (dayContentCounts[dateKey] || 0) > 0,
        contentCount: dayContentCounts[dateKey] || 0,
      });
    }
    
    // Add today
    const todayKey = formatDateKey(today);
    dates.push({
      date: today,
      displayText: getDisplayText(today, 'Today'),
      isToday: true,
      hasContent: (dayContentCounts[todayKey] || 0) > 0,
      contentCount: dayContentCounts[todayKey] || 0,
    });
    
    // Don't add future dates - content might not be available yet
    // Future dates are locked until content is generated
    // (maxFutureDays is now 0 by default)
    
    return dates;
  }, [maxPastDays, maxFutureDays, formatDate, dayContentCounts]);
  
  // Find current date index
  const currentIndex = availableDates.findIndex(d => 
    isSameDay(d.date, selectedDate)
  );
  
  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    
    onPanResponderGrant: () => {
      setIsDragging(true);
      scale.value = withSpring(0.95);
    },
    
    onPanResponderMove: (_, gestureState) => {
      translateX.value = gestureState.dx;
    },
    
    onPanResponderRelease: (_, gestureState) => {
      const { dx, vx } = gestureState;
      const threshold = SCREEN_WIDTH * 0.25;
      const velocity = Math.abs(vx);
      
      if (Math.abs(dx) > threshold || velocity > 0.5) {
        if (dx > 0) {
          // Swipe right - go to previous day
          navigateToDay(-1);
        } else {
          // Swipe left - go to next day
          navigateToDay(1);
        }
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
      }
      
      setIsDragging(false);
    },
  });
  
  const navigateToDay = useCallback((direction: number) => {
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < availableDates.length && availableDates[newIndex]) {
      const newDate = availableDates[newIndex]!.date;
      
      // Animate transition
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withTiming(0.7, { duration: 150 }, () => {
        runOnJS(onDateChange)(newDate);
        opacity.value = withTiming(1, { duration: 150 });
      });
    } else {
      // Bounce back if at boundary
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [currentIndex, availableDates, onDateChange, translateX, scale, opacity]);
  
  const handlePreviousDay = () => navigateToDay(-1);
  const handleNextDay = () => navigateToDay(1);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });
  
  const indicatorStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / (SCREEN_WIDTH * 0.25);
    return {
      opacity: interpolate(progress, [0, 1], [0.3, 0.8]),
    };
  });
  
  // Validate we have a current day
  if (currentIndex === -1 || !availableDates[currentIndex]) {
    return null; // Invalid date or no data
  }
  
  const currentDay = availableDates[currentIndex]!; // We've validated this exists
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < availableDates.length - 1;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Swipe Indicators */}
      <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, indicatorStyle]}>
        <Text style={[styles.indicatorText, { color: theme.foregroundSecondary }]}>
          {canGoPrevious ? '‹ Yesterday' : ''}
        </Text>
      </Animated.View>
      
      <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, indicatorStyle]}>
        <Text style={[styles.indicatorText, { color: theme.foregroundSecondary }]}>
          {canGoNext ? 'Tomorrow ›' : ''}
        </Text>
      </Animated.View>
      
      {/* Main Day Switcher */}
      <Animated.View
        style={[styles.daySwitcher, containerStyle]}
        {...panResponder.panHandlers}
      >
        {/* Previous Day Button */}
        <TouchableOpacity
          onPress={handlePreviousDay}
          disabled={!canGoPrevious || loading}
          style={[
            styles.navButton,
            !canGoPrevious && styles.navButtonDisabled,
          ]}
          accessible
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Text style={[
            styles.navButtonText,
            { color: canGoPrevious ? theme.primary : theme.foregroundSecondary },
          ]}>
            ‹
          </Text>
        </TouchableOpacity>
        
        {/* Current Day Display */}
        <View style={[styles.currentDay, { backgroundColor: theme.card }]}>
          <Text style={[styles.dayText, { color: theme.foreground }]}>
            {currentDay.displayText}
          </Text>
          
          <Text style={[styles.dateText, { color: theme.foregroundSecondary }]}>
            {currentDay.date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          
          {/* Content Indicator */}
          {currentDay.hasContent && (
            <View style={[styles.contentIndicator, { backgroundColor: theme.primary }]}>
              <Text style={styles.contentCount}>
                {currentDay.contentCount}
              </Text>
            </View>
          )}
          
          {/* Today Badge */}
          {currentDay.isToday && (
            <View style={[styles.todayBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>
        
        {/* Next Day Button */}
        <TouchableOpacity
          onPress={handleNextDay}
          disabled={!canGoNext || loading}
          style={[
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
          ]}
          accessible
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <Text style={[
            styles.navButtonText,
            { color: canGoNext ? theme.primary : theme.foregroundSecondary },
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingDot, { backgroundColor: theme.primary }]} />
        </View>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  
  leftIndicator: {
    left: spacing.sm,
  },
  
  rightIndicator: {
    right: spacing.sm,
  },
  
  indicatorText: {
    ...typography.caption,
    fontWeight: '500',
  },
  
  daySwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  navButtonDisabled: {
    opacity: 0.3,
  },
  
  navButtonText: {
    ...typography.title2,
    fontWeight: '600',
  },
  
  currentDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  dayText: {
    ...typography.title3,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  dateText: {
    ...typography.caption,
    fontWeight: '500',
  },
  
  contentIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  contentCount: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  
  todayBadge: {
    position: 'absolute',
    bottom: -2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  
  todayBadgeText: {
    ...typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
}); 