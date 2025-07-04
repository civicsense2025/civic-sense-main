import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  duration?: number;
  style?: ViewStyle;
  showGlow?: boolean;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  duration = 800,
  style,
  showGlow = true,
  color,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();

    // Animate glow effect
    if (showGlow && progress > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [progress, duration, showGlow]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: backgroundColor || theme.input,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width: progressWidth,
            backgroundColor: color || theme.primary,
            height: '100%',
          },
        ]}
      />
      {showGlow && progress > 0 && (
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              backgroundColor: color || theme.primary,
              height: '100%',
              width: progressWidth,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  glow: {
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    top: 0,
    shadowRadius: 8,
    shadowOpacity: 0.5,
    elevation: 4,
  },
}); 