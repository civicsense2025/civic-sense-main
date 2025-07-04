import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../lib/theme-context';

const LOADING_DURATION = 5000; // 5 seconds
const QUIP_DURATION = 1000; // 1 second per quip

// Witty, genuine quips that give personality
const LOADING_QUIPS = [
  "Powering up your civic superpowers...",
  "Making democracy less confusing...",
  "Finding your voice in the crowd...",
  "Turning complex politics into plain talk...",
  "Brewing a fresh batch of civic knowledge...",
  "Untangling the political web...",
  "Loading your toolkit for change...",
  "Preparing your seat at the table...",
  "Getting ready to amplify your impact...",
  "Starting your journey to civic mastery...",
];

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const { theme } = useTheme();
  const [currentQuipIndex, setCurrentQuipIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: LOADING_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onFinish();
    });

    // Animate quips
    const quipInterval = setInterval(() => {
      // Fade out and slide up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: QUIP_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(textPosition, {
          toValue: -20,
          duration: QUIP_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change text and reset position
        setCurrentQuipIndex((prev) => (prev + 1) % LOADING_QUIPS.length);
        textPosition.setValue(20);

        // Fade in and slide up to center
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: QUIP_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(textPosition, {
            toValue: 0,
            duration: QUIP_DURATION / 2,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, QUIP_DURATION);

    return () => {
      clearInterval(quipInterval);
    };
  }, []);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* App Logo or Icon */}
        <Text style={[styles.logo, { color: theme.primary }]}>CivicSense</Text>

        {/* Animated Quips */}
        <Animated.Text
          style={[
            styles.quip,
            { 
              color: theme.foreground,
              opacity: textOpacity,
              transform: [{ translateY: textPosition }],
            },
          ]}
        >
          {LOADING_QUIPS[currentQuipIndex]}
        </Animated.Text>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              { width, backgroundColor: theme.primary },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '80%',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 48,
  },
  quip: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: 'center',
    height: 24, // Fixed height to prevent layout shift
  },
  progressContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
}); 