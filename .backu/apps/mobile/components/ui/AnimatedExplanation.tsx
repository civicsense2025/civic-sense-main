/**
 * Animated Explanation Component for Quiz Session
 * 
 * Creates a word-by-word animation effect that makes explanations feel like
 * live gameplay without complex functionality. Optimized for iOS performance.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnimatedExplanationProps {
  /** The explanation text to animate */
  explanation: string;
  /** Whether the user's answer was correct */
  isCorrect: boolean;
  /** The user's selected answer */
  userAnswer?: string | undefined;
  /** The correct answer */
  correctAnswer: string;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Animation speed (words per minute) */
  wordsPerMinute?: number;
}

interface WordData {
  word: string;
  opacity: Animated.Value;
  scale: Animated.Value;
}

// ============================================================================
// ANIMATED EXPLANATION COMPONENT
// ============================================================================

export const AnimatedExplanation: React.FC<AnimatedExplanationProps> = ({
  explanation,
  isCorrect,
  userAnswer,
  correctAnswer,
  onAnimationComplete,
  wordsPerMinute = 180, // Natural reading speed
}) => {
  const { theme } = useTheme();
  const [words, setWords] = useState<WordData[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;

  // ============================================================================
  // ANIMATION SETUP
  // ============================================================================

  useEffect(() => {
    const setupAnimation = () => {
      // Split explanation into words and create animation values
      const wordsArray = explanation.split(' ').filter(word => word.length > 0);
      const wordData: WordData[] = wordsArray.map(word => ({
        word,
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.8),
      }));

      setWords(wordData);

      // Show feedback first
      setShowFeedback(true);
      
      // Animate feedback appearance
      Animated.parallel([
        Animated.timing(fadeInAnimation, {
          toValue: 1,
          duration: 200, // Reduced from 400ms
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnimation, {
          toValue: 0,
          duration: 200, // Reduced from 400ms
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start word animation after feedback is shown
        setTimeout(() => {
          animateWords(wordData);
        }, 300); // Reduced from 800ms for faster start
      });
    };

    setupAnimation();
  }, [explanation]);

  const animateWords = (wordData: WordData[]) => {
    const delayBetweenWords = (60 / wordsPerMinute) * 1000; // Convert WPM to ms
    
    wordData.forEach((word, index) => {
      // Use requestAnimationFrame for smoother 60fps animation
      requestAnimationFrame(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(word.opacity, {
              toValue: 1,
              duration: 120, // Reduced from 300ms for faster animation
              useNativeDriver: true,
            }),
            Animated.spring(word.scale, {
              toValue: 1,
              tension: 200, // Increased from 150 for snappier animation
              friction: 10, // Increased from 8 for quicker settle
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Call completion callback when last word finishes
            if (index === wordData.length - 1 && onAnimationComplete) {
              setTimeout(() => {
                onAnimationComplete();
              }, 500); // Reduced from 1000ms
            }
          });
        }, index * delayBetweenWords);
      });
    });
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderFeedbackSection = () => {
    const feedbackStyles = StyleSheet.create({
      feedbackContainer: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        backgroundColor: isCorrect 
          ? 'rgba(34, 197, 94, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        borderColor: isCorrect 
          ? 'rgba(34, 197, 94, 0.3)' 
          : 'rgba(239, 68, 68, 0.3)',
      },
      feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
      },
      feedbackIcon: {
        fontSize: 28,
        marginRight: spacing.sm,
      },
      feedbackTitle: {
        fontFamily: fontFamily.display,
        fontWeight: '600',
        fontSize: 18,
        color: isCorrect ? '#059669' : '#DC2626',
      },
      answerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xs,
        flexWrap: 'wrap',
      },
      answerLabel: {
        fontFamily: fontFamily.text,
        fontSize: 16,
        color: theme.foregroundSecondary,
        marginRight: spacing.sm,
      },
      answerValue: {
        fontFamily: fontFamily.text,
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
      correctAnswer: {
        color: '#059669',
      },
      incorrectAnswer: {
        color: '#DC2626',
      },
    });

    return (
      <Animated.View
        style={[
          feedbackStyles.feedbackContainer,
          {
            opacity: fadeInAnimation,
            transform: [{ translateY: slideUpAnimation }],
          },
        ]}
      >
        <View style={feedbackStyles.feedbackHeader}>
          <Text style={feedbackStyles.feedbackIcon}>
            {isCorrect ? '✅' : '❌'}
          </Text>
          <Text style={feedbackStyles.feedbackTitle}>
            {isCorrect ? 'Correct!' : 'Not quite right'}
          </Text>
        </View>

        {!isCorrect && userAnswer && (
          <View style={feedbackStyles.answerRow}>
            <Text style={feedbackStyles.answerLabel}>Your answer:</Text>
            <Text style={[feedbackStyles.answerValue, feedbackStyles.incorrectAnswer]}>
              {userAnswer}
            </Text>
          </View>
        )}

        <View style={feedbackStyles.answerRow}>
          <Text style={feedbackStyles.answerLabel}>
            {isCorrect ? 'You chose:' : 'Correct answer:'}
          </Text>
          <Text style={[feedbackStyles.answerValue, feedbackStyles.correctAnswer]}>
            {correctAnswer}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderAnimatedText = () => {
    return (
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationHeader}>💡 Explanation</Text>
        <View style={styles.wordsContainer}>
          {words.map((wordData, index) => (
            <Animated.View
              key={`word-${index}`}
              style={{
                opacity: wordData.opacity,
                transform: [{ scale: wordData.scale }],
              }}
            >
              <Text style={styles.animatedWord}>
                {wordData.word}
                {index < words.length - 1 ? ' ' : ''}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const styles = StyleSheet.create({
    container: {
      marginTop: spacing.lg,
    },
    explanationContainer: {
      padding: spacing.lg,
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    explanationHeader: {
      fontFamily: fontFamily.display,
      fontWeight: '600',
      fontSize: 16,
      color: '#2563EB',
      marginBottom: spacing.md,
    },
    wordsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    animatedWord: {
      fontFamily: fontFamily.text,
      fontSize: 16,
      lineHeight: 24,
      color: theme.foreground,
    },
  });

  return (
    <View style={styles.container}>
      {showFeedback && renderFeedbackSection()}
      {words.length > 0 && renderAnimatedText()}
    </View>
  );
};

export default AnimatedExplanation; 