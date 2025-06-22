import React, { useState, useRef, useCallback, useEffect } from 'react';
import type {
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
} from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import type { Theme } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import type { CategoryType, TopicMetadata } from '@/lib/quiz-data';

interface DailyCardStackProps {
  selectedCategory: CategoryType | null;
  searchQuery: string;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
  showGuestBanner?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
  showGuestBanner = true,
}: DailyCardStackProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topics, setTopics] = useState<TopicMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  // PanResponder setup for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event: GestureResponderEvent, gesture: PanResponderGestureState) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = useCallback((direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => onSwipeComplete(direction));
  }, []);

  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const item = topics[currentIndex];
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prevIndex) => {
      if (direction === 'right') {
        return Math.max(0, prevIndex - 1);
      } else {
        return Math.min(topics.length - 1, prevIndex + 1);
      }
    });
  }, [currentIndex, topics.length]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  }, []);

  // Card animation styles
  const getCardStyle = () => {
    const scale = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: [0.8, 1, 0.8],
    });

    return {
      transform: [
        { translateX: position.x },
        { rotate: rotation },
        { scale },
      ],
    };
  };

  // Load topics
  useEffect(() => {
    // TODO: Implement topic loading logic
    setIsLoading(false);
  }, [selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Preparing your civic learning journey...
        </Text>
      </View>
    );
  }

  if (topics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Looking for more civic content?
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.text }]}>
          {selectedCategory || searchQuery
            ? "Try adjusting your search - we're always adding new content!"
            : "We're working hard to bring you fresh civic education content. Check back soon!"}
        </Text>
      </View>
    );
  }

  const currentTopic = topics[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {currentIndex + 1} of {topics.length}
        </Text>
      </View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card },
          getCardStyle(),
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.cardContent}>
          {/* Emoji */}
          <Text style={styles.emoji}>{currentTopic.emoji || '📝'}</Text>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentTopic.topic_title}
          </Text>

          {/* Categories and badges */}
          {((currentTopic.categories && currentTopic.categories.length > 0) ||
            currentTopic.is_breaking ||
            (currentTopic.is_featured && !currentTopic.is_breaking)) && (
            <View style={styles.badgesContainer}>
              {currentTopic.is_breaking && (
                <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
                  <Text style={styles.badgeText}>Breaking</Text>
                </View>
              )}
              {currentTopic.is_featured && !currentTopic.is_breaking && (
                <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.badgeText}>Featured</Text>
                </View>
              )}
              {currentTopic.categories?.map((category) => (
                <View
                  key={category}
                  style={[styles.badge, { backgroundColor: theme.colors.border }]}
                >
                  <Text style={[styles.badgeText, { color: theme.colors.text }]}>
                    {category}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.text }]}>
            {currentTopic.description}
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => {/* TODO: Implement quiz start */}}
          >
            <Text style={[styles.buttonText, { color: theme.colors.background }]}>
              Start Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    opacity: 0.7,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    minHeight: 400,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 