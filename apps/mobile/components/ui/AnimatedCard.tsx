import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { Card } from './Card';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'multiplayer';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: CardVariant;
  delay?: number;
  duration?: number;
  scale?: number;
  disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  delay = 0,
  duration = 300,
  scale = 0.98,
  disabled = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay, duration]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  };

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[animatedStyle, style]}>
          <Card variant={variant}>
            {children}
          </Card>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Card variant={variant}>
        {children}
      </Card>
    </Animated.View>
  );
}; 