import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  variant?: 'spinner' | 'pulse' | 'fade';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  message,
  variant = 'spinner',
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0.3)).current;

  const spinnerColor = color || theme.primary;
  
  const sizes = {
    small: 20,
    medium: 32,
    large: 48,
  };

  useEffect(() => {
    if (variant === 'spinner') {
      const spinAnimation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else if (variant === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else if (variant === 'fade') {
      const fadeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fadeValue, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      fadeAnimation.start();
      return () => fadeAnimation.stop();
    }
  }, [variant, animatedValue, pulseValue, fadeValue]);

  const spin = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSpinner = () => {
    if (variant === 'spinner') {
      return (
        <Animated.View
          style={[
            styles.spinner,
            {
              width: sizes[size],
              height: sizes[size],
              borderColor: `${spinnerColor}20`,
              borderTopColor: spinnerColor,
              transform: [{ rotate: spin }],
            },
          ]}
        />
      );
    } else if (variant === 'pulse') {
      return (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: sizes[size],
              height: sizes[size],
              backgroundColor: spinnerColor,
              transform: [{ scale: pulseValue }],
            },
          ]}
        />
      );
    } else if (variant === 'fade') {
      return (
        <Animated.View style={{ opacity: fadeValue }}>
          <View
            style={[
              styles.fade,
              {
                width: sizes[size],
                height: sizes[size],
                backgroundColor: spinnerColor,
              },
            ]}
          />
        </Animated.View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderSpinner()}
      {message && (
        <Text variant="body" color="secondary" style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 50,
  },
  pulse: {
    borderRadius: 50,
  },
  fade: {
    borderRadius: 50,
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
  },
}); 