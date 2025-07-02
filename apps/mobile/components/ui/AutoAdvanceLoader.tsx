import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';

interface AutoAdvanceLoaderProps {
  onComplete: () => void;
  onSkip?: () => void;
  duration?: number; // Duration in seconds, defaults to 5
  message?: string;
  compact?: boolean;
}

export function AutoAdvanceLoader({
  onComplete,
  onSkip,
  duration = 5,
  message = "Next question loading...",
  compact = false,
}: AutoAdvanceLoaderProps) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<number>();
  const progressValue = useSharedValue(0);

  // Start countdown and animation
  useEffect(() => {
    // Start progress animation
    progressValue.value = withTiming(1, {
      duration: duration * 1000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    });

    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== undefined) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, onComplete, progressValue]);

  // Handle skip action
  const handleSkip = () => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  // Animated progress style for circular progress
  const animatedProgressStyle = useAnimatedStyle(() => {
    const rotation = progressValue.value * 360;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Animated progress style for progress bar
  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  const iconSize = compact ? 16 : 20;
  const textSize = compact ? 12 : 14;
  const circleSize = compact ? 32 : 40;

  return (
    <View style={[
      styles.container,
      compact ? styles.containerCompact : styles.containerFull,
      { backgroundColor: `${theme.primary}08` }
    ]}>
      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={[
          styles.progressContainer,
          { 
            width: circleSize, 
            height: circleSize,
            borderColor: theme.border,
          }
        ]}>
          <Animated.View 
            style={[
              styles.progressCircle,
              { 
                width: circleSize, 
                height: circleSize,
                borderColor: theme.primary,
              },
              animatedProgressStyle
            ]}
          />
          
          {/* Countdown number */}
          <Text style={[
            styles.countdown,
            { 
              color: theme.primary,
              fontSize: compact ? 12 : 14,
              fontWeight: '600'
            }
          ]}>
            {timeLeft}
          </Text>
        </View>

        {/* Message and Skip button */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.message,
            { 
              color: theme.foregroundSecondary,
              fontSize: textSize
            }
          ]}>
            {message}
          </Text>
          
          {onSkip && (
            <Pressable 
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.skipButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[
                styles.skipText,
                { 
                  color: theme.primary,
                  fontSize: textSize
                }
              ]}>
                Skip
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={iconSize} 
                color={theme.primary} 
              />
            </Pressable>
          )}
        </View>
      </View>
      
      {/* Progress bar at bottom */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <Animated.View 
          style={[
            styles.progressBar,
            { backgroundColor: theme.primary },
            animatedBarStyle
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  containerCompact: {
    padding: 8,
    marginVertical: 4,
  },
  containerFull: {
    padding: 16,
    marginVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    borderWidth: 2,
  },
  progressCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  countdown: {
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  skipText: {
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 2,
    marginTop: 12,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
  },
}); 