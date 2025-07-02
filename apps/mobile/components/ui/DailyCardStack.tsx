import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { QuizDataService, type DailyTopic } from '../../lib/quiz-data-service';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import { useUIStrings } from '../../lib/hooks/useUIStrings';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.92;
const CARD_HEIGHT = screenHeight * 0.65;
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;

// Update the ExtendedDailyTopic interface
interface ExtendedDailyTopic extends DailyTopic {
  is_breaking?: boolean;
  is_featured?: boolean;
  emoji?: string;
  topic_title: string;
  title?: string;
}

interface DailyCardStackProps {
  onTopicSelect?: (topic: ExtendedDailyTopic) => void;
  maxCards?: number;
  selectedCategory?: string | null;
  searchQuery?: string;
}

interface BadgeProps {
  type: 'breaking' | 'featured' | 'category';
  label: string;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ type, label, style }) => {
  const { theme } = useTheme();
  
  const getBadgeColors = () => {
    switch (type) {
      case 'breaking':
        return {
          bg: '#DC2626', // Red for breaking news
          text: '#FFFFFF'
        };
      case 'featured':
        return {
          bg: theme.primary,
          text: theme.foreground
        };
      case 'category':
        return {
          bg: theme.secondary,
          text: theme.foreground
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text variant="caption" style={[styles.badgeText, { color: colors.text }]}>
        {type === 'category' ? label : label.toUpperCase()}
      </Text>
    </View>
  );
};

export const DailyCardStack: React.FC<DailyCardStackProps> = ({
  onTopicSelect,
  maxCards = 5,
  selectedCategory,
  searchQuery = '',
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { uiStrings } = useUIStrings();
  const router = useRouter();

  // Early return if uiStrings is not ready to prevent crashes
  if (!uiStrings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text variant="body" color="secondary" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }
  
  const [topics, setTopics] = useState<ExtendedDailyTopic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const swipedCards = useRef(new Set()).current;
  const rotation = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  // PanResponder setup
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const swipedRight = gesture.dx > SWIPE_THRESHOLD;
        const swipedLeft = gesture.dx < -SWIPE_THRESHOLD;

        if (swipedRight) {
          forceSwipe('right');
        } else if (swipedLeft) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = useCallback((direction: 'right' | 'left') => {
    const x = direction === 'right' ? screenWidth : -screenWidth;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true
    }).start(() => onSwipeComplete(direction));
  }, []);

  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const item = topics[currentIndex];
    direction === 'right' ? handlePrevious() : handleNext();
    position.setValue({ x: 0, y: 0 });
  }, [currentIndex, topics]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true
    }).start();
  }, []);

  const getCardStyle = useCallback(() => {
    const rotate = rotation;
    const opacity = position.x.interpolate({
      inputRange: [-screenWidth / 2, 0, screenWidth / 2],
      outputRange: [0.5, 1, 0.5]
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
      opacity
    };
  }, [rotation]);

  // Load daily topics
  useEffect(() => {
    loadDailyTopics();
  }, []);

  const loadDailyTopics = async () => {
    try {
      setLoading(true);
      const dailyTopics = await QuizDataService.loadDailyTopics(maxCards);
      
      // Transform DailyTopic to ExtendedDailyTopic with sample featured/breaking logic
      const extendedTopics: ExtendedDailyTopic[] = dailyTopics.map((topic, index) => {
        // Sample logic for featured/breaking - you can replace this with real data
        const isBreaking = index === 0 && Math.random() > 0.7; // First topic has 30% chance to be breaking
        const isFeatured = !isBreaking && Math.random() > 0.5; // 50% chance to be featured if not breaking
        
        return {
          ...topic,
          is_breaking: isBreaking,
          is_featured: isFeatured,
          emoji: isBreaking ? '🚨' : isFeatured ? '⭐' : '📝'
        };
      });
      
      setTopics(extendedTopics);
      setTotalTopicsCount(extendedTopics.length);
    } catch (error) {
      console.error('Error loading daily topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = useCallback((topic: ExtendedDailyTopic) => {
    if (!topic.isLocked) {
      console.log('🎯 Starting quiz for topic:', topic);
      onTopicSelect?.(topic);
      
      // Use the correct ID property - prioritize topic_id, fallback to id
      const topicId = topic.topic_id || topic.id;
      if (!topicId) {
        console.error('No valid topic ID found:', topic);
        return;
      }
      
      router.push({
        pathname: `/quiz-session/${topicId}`,
        params: { 
          id: topicId,
          mode: 'daily' 
        }
      });
    }
  }, [onTopicSelect, router]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(topics.length - 1, prev + 1));
  }, [topics.length]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text variant="body" color="secondary" style={styles.loadingText}>
          {uiStrings?.home?.loadingYourCivicJourney || 'Preparing your civic learning journey...'}
        </Text>
        <Text variant="footnote" color="secondary" style={styles.loadingSubtext}>
          {totalTopicsCount > 0 
            ? `Loading from our catalog of ${totalTopicsCount} topics...`
            : uiStrings?.home?.loadingContent || "Loading today's most important topics..."}
        </Text>
      </View>
    );
  }

  // Empty state
  if (topics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="title3" color="inherit" style={styles.emptyTitle}>
          Looking for more civic content?
        </Text>
        <Text variant="body" color="secondary" style={styles.emptyDescription}>
          {selectedCategory || searchQuery
            ? "Try adjusting your search - we're always adding new content!"
            : "We're working hard to bring you fresh civic education content. Check back soon!"}
        </Text>
      </View>
    );
  }

  const renderCard = (topic: ExtendedDailyTopic, index: number) => {
    if (index < currentIndex) return null;

    const isFirst = index === currentIndex;
    const cardStyle = isFirst ? getCardStyle() : {
      top: 10 * (index - currentIndex),
      transform: [{ scale: 1 - (index - currentIndex) * 0.05 }]
    };

    return (
      <Animated.View
        key={topic.topic_id}
        style={[styles.cardContainer, cardStyle]}
        {...(isFirst ? panResponder.panHandlers : {})}
      >
        <Card style={styles.card} variant="elevated">
          <View style={styles.cardContent}>
            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{topic.emoji || '📝'}</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text variant="title2" color="inherit" style={styles.title}>
                {topic.topic_title}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.dateContainer}>
              <Text variant="footnote" color="secondary" style={styles.dateText}>
                {new Date(topic.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {/* Badges */}
            {(topic.is_breaking || topic.is_featured || (topic.categories?.length ?? 0) > 0) && (
              <View style={styles.badgesContainer}>
                {/* Breaking badge takes priority */}
                {topic.is_breaking && (
                  <Badge 
                    type="breaking" 
                    label="BREAKING" 
                  />
                )}
                
                {/* Featured badge (only show if not breaking) */}
                {!topic.is_breaking && topic.is_featured && (
                  <Badge 
                    type="featured" 
                    label="FEATURED" 
                  />
                )}
                
                {/* Category badges */}
                {topic.categories?.map((category) => (
                  <Badge 
                    key={category}
                    type="category" 
                    label={category} 
                  />
                ))}
              </View>
            )}

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text variant="body" color="secondary" style={styles.description}>
                {topic.description}
              </Text>
            </View>

            {/* Action button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: topic.isLocked ? theme.muted : theme.primary },
                  topic.isLocked && styles.actionButtonDisabled
                ]}
                onPress={() => handleCardPress(topic)}
                disabled={topic.isLocked}
                activeOpacity={0.8}
              >
                <Text variant="callout" style={[
                  styles.actionButtonText, 
                  { color: topic.isLocked ? theme.mutedForeground : theme.foreground }
                ]}>
                  {topic.isLocked ? 'Coming Soon' : uiStrings?.topic?.startQuiz || 'Start Quiz'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      {topics.length > 1 && (
        <View style={styles.progressContainer}>
          <Text variant="footnote" color="secondary" style={styles.progressText}>
            {currentIndex + 1} {uiStrings?.quiz?.of || 'of'} {topics.length}
          </Text>
        </View>
      )}

      {/* Stack of cards */}
      <View style={styles.cardsContainer}>
        {topics.map((topic, index) => renderCard(topic, index)).reverse()}
      </View>

      {/* Navigation dots */}
      {topics.length > 1 && (
        <View style={styles.navigationDots}>
          {topics.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? theme.primary : theme.border,
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: CARD_HEIGHT + 100, // Add space for progress and navigation
  },
  progressContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fontFamily.mono,
    fontSize: 14,
  },
  cardsContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  emojiContainer: {
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  titleContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontFamily: fontFamily.display,
    fontWeight: '600',
    lineHeight: 28,
  },
  dateContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    opacity: 0.7,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  },
  descriptionContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationDots: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  emptyTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
}); 