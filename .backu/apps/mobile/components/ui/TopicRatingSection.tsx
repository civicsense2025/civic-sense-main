import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, typography } from '../../lib/theme';
import { UserContentService, type UserContentAnnotation } from '../../lib/services/user-content-service';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// INTERFACES
// ============================================================================

interface TopicRatingSectionProps {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  style?: any;
}

interface RatingOption {
  value: number;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

interface UserReview extends UserContentAnnotation {
  user_display_name?: string;
  user_avatar?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RATING_OPTIONS: RatingOption[] = [
  {
    value: 1,
    emoji: '😞',
    label: 'Poor',
    description: 'Not helpful at all',
    color: '#EF4444',
  },
  {
    value: 2,
    emoji: '😐',
    label: 'Fair',
    description: 'Somewhat helpful',
    color: '#F97316',
  },
  {
    value: 3,
    emoji: '🙂',
    label: 'Good',
    description: 'Pretty helpful',
    color: '#EAB308',
  },
  {
    value: 4,
    emoji: '😊',
    label: 'Very Good',
    description: 'Very helpful',
    color: '#22C55E',
  },
  {
    value: 5,
    emoji: '🤩',
    label: 'Excellent',
    description: 'Extremely helpful',
    color: '#10B981',
  },
];

const SAMPLE_REVIEWS: UserReview[] = [
  {
    id: 'sample-1',
    user_id: 'sample-user-1',
    content_type: 'topic',
    content_id: '',
    content_title: '',
    personal_rating: 5,
    personal_notes: 'This topic really opened my eyes to how healthcare policy actually works. The sources were credible and the explanations were clear without being overwhelming.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_accessed_at: new Date().toISOString(),
    times_accessed: 1,
    user_display_name: 'Sarah K.',
  },
  {
    id: 'sample-2',
    user_id: 'sample-user-2',
    content_type: 'topic',
    content_id: '',
    content_title: '',
    personal_rating: 4,
    personal_notes: 'Great breakdown of complex topics. I wish there were more interactive elements, but the content quality is solid.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_accessed_at: new Date().toISOString(),
    times_accessed: 1,
    user_display_name: 'Mike R.',
  },
  {
    id: 'sample-3',
    user_id: 'sample-user-3',
    content_type: 'topic',
    content_id: '',
    content_title: '',
    personal_rating: 5,
    personal_notes: 'Finally, civic education that doesn\'t talk down to people! The "Why This Matters" section helped me understand how this affects my daily life.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    last_accessed_at: new Date().toISOString(),
    times_accessed: 1,
    user_display_name: 'Jennifer L.',
  },
];

// ============================================================================
// ANIMATED STAR COMPONENT
// ============================================================================

const AnimatedStar: React.FC<{
  filled: boolean;
  index: number;
  onPress: () => void;
  size?: number;
}> = ({ filled, index, onPress, size = 28 }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(1.2, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    rotation.value = withTiming(360, { duration: 200 }, () => {
      rotation.value = 0;
    });
    
    setTimeout(onPress, 50);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.starButton}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={filled ? "star" : "star-outline"}
          size={size}
          color={filled ? "#F59E0B" : theme.border}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============================================================================
// RATING DISPLAY COMPONENT
// ============================================================================

const RatingDisplay: React.FC<{
  rating: number;
  totalRatings: number;
  showDetails?: boolean;
}> = ({ rating, totalRatings, showDetails = true }) => {
  const { theme } = useTheme();

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#F59E0B" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#F59E0B" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color={theme.border} />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.ratingDisplay}>
      <View style={styles.ratingStars}>
        {renderStars(rating, 20)}
      </View>
      <Text style={[styles.ratingValue, { color: theme.foreground }]}>
        {rating.toFixed(1)}
      </Text>
      {showDetails && (
        <Text style={[styles.ratingCount, { color: theme.foregroundSecondary }]}>
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// REVIEW CARD COMPONENT
// ============================================================================

const ReviewCard: React.FC<{
  review: UserReview;
  isCurrentUser?: boolean;
}> = ({ review, isCurrentUser = false }) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getRatingOption = (rating: number) => {
    return RATING_OPTIONS.find(opt => opt.value === rating);
  };

  const ratingOption = getRatingOption(review.personal_rating || 0);

  return (
    <Card style={[styles.reviewCard, { backgroundColor: theme.card }]} variant="outlined">
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthor}>
          <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.authorInitial, { color: theme.primary }]}>
              {review.user_display_name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.foreground }]}>
              {isCurrentUser ? 'You' : review.user_display_name || 'Anonymous'}
            </Text>
            <Text style={[styles.reviewDate, { color: theme.foregroundSecondary }]}>
              {formatDate(review.created_at)}
            </Text>
          </View>
        </View>
        
        {ratingOption && (
          <View style={[styles.ratingBadge, { backgroundColor: ratingOption.color + '20' }]}>
            <Text style={styles.ratingEmoji}>{ratingOption.emoji}</Text>
            <Text style={[styles.ratingText, { color: ratingOption.color }]}>
              {ratingOption.label}
            </Text>
          </View>
        )}
      </View>
      
      {review.personal_notes && (
        <Text style={[styles.reviewText, { color: theme.foreground }]}>
          {review.personal_notes}
        </Text>
      )}
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TopicRatingSection: React.FC<TopicRatingSectionProps> = ({
  topicId,
  topicTitle,
  topicDescription,
  style,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userAnnotation, setUserAnnotation] = useState<UserContentAnnotation | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Sample data for now
  const averageRating = 4.3;
  const totalRatings = 127;
  const reviews = SAMPLE_REVIEWS;

  // Load user's existing rating/review
  useEffect(() => {
    loadUserAnnotation();
  }, [topicId, user?.id]);

  const loadUserAnnotation = async () => {
    if (!user?.id || !topicId) {
      setLoading(false);
      return;
    }

    try {
      const { annotation, error } = await UserContentService.getAnnotation(
        user.id,
        'topic',
        topicId
      );

      if (annotation) {
        setUserAnnotation(annotation);
        setUserRating(annotation.personal_rating || null);
        setUserReview(annotation.personal_notes || '');
      }
    } catch (error) {
      console.error('Error loading user annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingPress = (rating: number) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to rate this topic.',
        [{ text: 'OK' }]
      );
      return;
    }

    setUserRating(rating);
    
    // Show review modal for ratings of 3 or lower to get feedback
    if (rating <= 3) {
      setShowReviewModal(true);
    } else {
      // Auto-submit for high ratings
      submitRating(rating, '');
    }
  };

  const submitRating = async (rating: number, reviewText: string) => {
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const annotationData = {
        user_id: user.id,
        content_type: 'topic' as const,
        content_id: topicId,
        content_title: topicTitle,
        personal_rating: rating,
        personal_notes: reviewText || undefined,
      };

      const { annotation, error } = await UserContentService.saveAnnotation(annotationData);

      if (error) {
        console.error('Error saving rating:', error);
        Alert.alert('Error', 'Failed to save your rating. Please try again.');
        return;
      }

      setUserAnnotation(annotation);
      setUserRating(rating);
      setUserReview(reviewText);
      setShowReviewModal(false);

      Alert.alert(
        'Thank you!',
        'Your rating has been saved and helps improve the content for everyone.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to save your rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingBreakdown = () => {
    // Sample rating distribution
    const ratingDistribution = [
      { stars: 5, count: 78, percentage: 61 },
      { stars: 4, count: 32, percentage: 25 },
      { stars: 3, count: 12, percentage: 9 },
      { stars: 2, count: 4, percentage: 3 },
      { stars: 1, count: 1, percentage: 1 },
    ];

    return (
      <View style={styles.ratingBreakdown}>
        <Text style={[styles.breakdownTitle, { color: theme.foreground }]}>
          Rating Breakdown
        </Text>
        {ratingDistribution.map((item) => (
          <View key={item.stars} style={styles.breakdownRow}>
            <Text style={[styles.breakdownStars, { color: theme.foregroundSecondary }]}>
              {item.stars} ⭐
            </Text>
            <View style={[styles.breakdownBar, { backgroundColor: theme.muted }]}>
              <View
                style={[
                  styles.breakdownFill,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.breakdownCount, { color: theme.foregroundSecondary }]}>
              {item.count}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <Card style={[styles.container, style]} variant="outlined">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
            Loading ratings...
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Overall Rating Header */}
      <Card style={styles.headerCard} variant="outlined">
        <LinearGradient
          colors={[theme.primary + '10', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>⭐</Text>
            <Text style={[styles.headerTitle, { color: theme.foreground }]}>
              Ratings & Reviews
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.foregroundSecondary }]}>
              Community feedback on this topic
            </Text>
            
            <View style={styles.overallRating}>
              <RatingDisplay
                rating={averageRating}
                totalRatings={totalRatings}
              />
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* User Rating Section */}
      <Card style={styles.userRatingCard} variant="outlined">
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {userRating ? 'Your Rating' : 'Rate This Topic'}
        </Text>
        
        {userRating ? (
          <View style={styles.userRatingDisplay}>
            <RatingDisplay rating={userRating} totalRatings={1} showDetails={false} />
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={[styles.editButtonText, { color: theme.primary }]}>
                Edit Rating
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ratingInput}>
            <Text style={[styles.ratingPrompt, { color: theme.foregroundSecondary }]}>
              How helpful was this topic?
            </Text>
            <View style={styles.starRating}>
              {RATING_OPTIONS.map((option, index) => (
                <AnimatedStar
                  key={option.value}
                  filled={userRating ? option.value <= userRating : false}
                  index={index}
                  onPress={() => handleRatingPress(option.value)}
                />
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Rating Breakdown */}
      <Card style={styles.breakdownCard} variant="outlined">
        {renderRatingBreakdown()}
      </Card>

      {/* Recent Reviews */}
      <Card style={styles.reviewsCard} variant="outlined">
        <View style={styles.reviewsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Recent Reviews
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowAllReviews(true)}
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewsList}>
          {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isCurrentUser={review.user_id === user?.id}
            />
          ))}
        </View>

        {!showAllReviews && reviews.length > 2 && (
          <TouchableOpacity
            style={[styles.showMoreButton, { backgroundColor: theme.muted }]}
            onPress={() => setShowAllReviews(true)}
          >
            <Text style={[styles.showMoreText, { color: theme.foreground }]}>
              Show {reviews.length - 2} more reviews
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setShowReviewModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.foreground }]}>
              Rate & Review
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (userRating) {
                  submitRating(userRating, userReview);
                }
              }}
              disabled={!userRating || submitting}
              style={[
                styles.modalSaveButton,
                {
                  backgroundColor: userRating && !submitting ? theme.primary : theme.muted,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: theme.foregroundSecondary }]}>
              How would you rate "{topicTitle}"?
            </Text>

            <View style={styles.modalStarRating}>
              {RATING_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalRatingOption,
                    {
                      backgroundColor: userRating === option.value ? option.color + '20' : theme.card,
                      borderColor: userRating === option.value ? option.color : theme.border,
                    },
                  ]}
                  onPress={() => setUserRating(option.value)}
                >
                  <Text style={styles.modalRatingEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.modalRatingLabel,
                    { color: userRating === option.value ? option.color : theme.foreground }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.reviewLabel, { color: theme.foreground }]}>
              Share your thoughts (optional)
            </Text>
            <TextInput
              style={[
                styles.reviewTextInput,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.foreground,
                },
              ]}
              placeholder="What did you think of this topic? How could it be improved?"
              placeholderTextColor={theme.foregroundSecondary}
              value={userReview}
              onChangeText={setUserReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },

  // Header
  headerCard: {
    overflow: 'hidden',
  },
  headerGradient: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  overallRating: {
    alignItems: 'center',
  },

  // Rating Display
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 14,
  },

  // User Rating
  userRatingCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  userRatingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingInput: {
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingPrompt: {
    fontSize: 16,
    textAlign: 'center',
  },
  starRating: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },

  // Rating Breakdown
  breakdownCard: {
    padding: spacing.lg,
  },
  ratingBreakdown: {
    gap: spacing.sm,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownStars: {
    fontSize: 12,
    width: 40,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownCount: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },

  // Reviews
  reviewsCard: {
    padding: spacing.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  viewAllButton: {
    padding: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewCard: {
    padding: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  ratingEmoji: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalStarRating: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modalRatingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  modalRatingEmoji: {
    fontSize: 24,
  },
  modalRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 16,
  },
}); 