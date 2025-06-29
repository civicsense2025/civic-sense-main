/**
 * Enhanced Instagram/Facebook Story Share Component
 * Uses Facebook SDK for official Instagram and Facebook Story sharing
 * Integrates with CivicSense dynamic image generation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
// Note: @expo/vector-icons should be available in mobile app
// const Ionicons = require('@expo/vector-icons/Ionicons').default;
import {
  generateTopicInstagramStory,
  generateCompletionInstagramStory,
  generateStreakInstagramStory,
  generateAchievementInstagramStory,
  generateFallbackText,
  type TopicImageParams,
  type ResultImageParams,
  type StreakImageParams,
  type AchievementImageParams,
} from '../../lib/image-generator';
import {
  shareWithFallback,
  showSharingOptions,
  isInstagramAvailable,
  isFacebookAvailable,
  initializeFacebookSDK,
  type ShareResult,
} from '../../lib/facebook-sdk';

// Simple theme interface for this component
interface SimpleTheme {
  colors: {
    primary: string;
  };
}

// Mock theme hook if not available
const useTheme = (): { theme: SimpleTheme } => ({
  theme: {
    colors: {
      primary: '#E0A63E', // CivicSense primary color
    },
  },
});

// Mock spacing and sizing values
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

const responsiveFontSizes = {
  small: 12,
  medium: 16,
  large: 20,
};

interface InstagramStoryShareV2Props {
  type: 'topic' | 'result' | 'streak' | 'achievement';
  topic?: {
    id: string;
    title: string;
    description?: string;
    emoji?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  userProgress?: {
    score: number;
    totalQuestions: number;
    streak?: number;
    timeSpent?: number;
    completedAt?: Date;
  };
  streakCount?: number;
  userName?: string;
  achievement?: {
    title: string;
    description: string;
    badge: string;
    unlockedAt: Date;
  };
  contentUrl?: string;
  customMessage?: string;
  onShareStart?: () => void;
  onShareComplete?: (result: ShareResult) => void;
  onError?: (error: string) => void;
  style?: any;
}

export function InstagramStoryShareV2({
  type,
  topic,
  userProgress,
  streakCount,
  userName,
  achievement,
  contentUrl,
  customMessage,
  onShareStart,
  onShareComplete,
  onError,
  style,
}: InstagramStoryShareV2Props) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [shareAvailability, setShareAvailability] = useState({
    instagram: false,
    facebook: false,
    sdkInitialized: false,
  });

  // Initialize Facebook SDK and check availability on mount
  useEffect(() => {
    const initializeSharing = async () => {
      const sdkInitialized = initializeFacebookSDK();
      const [instagramAvailable, facebookAvailable] = await Promise.all([
        isInstagramAvailable(),
        isFacebookAvailable(),
      ]);

      setShareAvailability({
        instagram: instagramAvailable,
        facebook: facebookAvailable,
        sdkInitialized,
      });
    };

    initializeSharing();
  }, []);

  // Generate appropriate image based on type
  const generateImage = async (): Promise<string | null> => {
    try {
      let imageUrl: string | null = null;

      switch (type) {
        case 'topic':
          if (topic) {
            const params: TopicImageParams = {
              id: topic.id,
              title: topic.title,
              description: topic.description,
              emoji: topic.emoji,
              category: topic.category,
              difficulty: topic.difficulty,
            };
            imageUrl = await generateTopicInstagramStory(params);
          }
          break;

        case 'result':
          if (topic && userProgress) {
            const params: ResultImageParams = {
              title: topic.title,
              score: userProgress.score,
              totalQuestions: userProgress.totalQuestions,
              emoji: topic.emoji,
              type: 'result',
              userName,
              timeSpent: userProgress.timeSpent,
              completedAt: userProgress.completedAt?.toISOString(),
            };
            imageUrl = await generateCompletionInstagramStory(params);
          }
          break;

        case 'streak':
          if (streakCount) {
            const params: StreakImageParams = {
              streakCount,
              userName,
              type: 'streak',
            };
            imageUrl = await generateStreakInstagramStory(params);
          }
          break;

        case 'achievement':
          if (achievement) {
            const params: AchievementImageParams = {
              title: achievement.title,
              description: achievement.description,
              badge: achievement.badge,
              userName,
              type: 'achievement',
              unlockedAt: achievement.unlockedAt.toISOString(),
            };
            imageUrl = await generateAchievementInstagramStory(params);
          }
          break;

        default:
          throw new Error(`Unsupported share type: ${type}`);
      }

      return imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  };

  // Handle sharing with Facebook SDK
  const handleShare = async () => {
    try {
      setIsLoading(true);
      onShareStart?.();

      // Generate image if not already generated
      let imageUrl = generatedImageUrl;
      if (!imageUrl) {
        imageUrl = await generateImage();
        if (imageUrl) {
          setGeneratedImageUrl(imageUrl);
        }
      }

      if (!imageUrl) {
        throw new Error('Failed to generate share image');
      }

      // Prepare sharing options
      const shareOptions = {
        contentUrl: contentUrl || 'https://civicsense.com',
        title: getShareTitle(),
        message: customMessage || generateFallbackText({
          type,
          topic,
          userProgress,
          streakCount,
          userName,
          achievement,
        }),
      };

      // Use Facebook SDK for official Instagram/Facebook Story sharing
      if (shareAvailability.instagram || shareAvailability.facebook) {
        const result = await shareWithFallback(imageUrl, shareOptions);
        onShareComplete?.(result);

        if (result.success) {
          Alert.alert(
            'Shared Successfully!',
            `Your civic learning progress has been shared via ${result.method}.`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          throw new Error(result.error || 'Sharing failed');
        }
      } else {
        // Fallback to showing sharing options dialog
        await showSharingOptions(imageUrl, shareOptions);
        onShareComplete?.({ success: true, method: 'fallback' });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sharing failed';
      console.error('Share error:', error);
      onError?.(errorMessage);
      Alert.alert('Sharing Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate appropriate share title
  const getShareTitle = (): string => {
    switch (type) {
      case 'topic':
        return `Learning about ${topic?.title || 'Civic Topics'} with CivicSense`;
      case 'result':
        return `Completed ${topic?.title || 'Quiz'} with ${userProgress?.score || 0}% score!`;
      case 'streak':
        return `${streakCount} day learning streak with CivicSense!`;
      case 'achievement':
        return `Unlocked "${achievement?.title || 'Achievement'}" in CivicSense!`;
      default:
        return 'Learning with CivicSense';
    }
  };

  // Get appropriate icon based on sharing availability
  const getShareIcon = () => {
    if (shareAvailability.instagram) {
      return 'logo-instagram';
    } else if (shareAvailability.facebook) {
      return 'logo-facebook';
    } else {
      return 'share-outline';
    }
  };

  // Get appropriate button text
  const getButtonText = () => {
    if (isLoading) return 'Generating...';
    
    if (shareAvailability.instagram) {
      return 'Share to Instagram Stories';
    } else if (shareAvailability.facebook) {
      return 'Share to Facebook Stories';
    } else {
      return 'Share Progress';
    }
  };

  // Show preview if image is generated
  const showPreview = async () => {
    try {
      setIsLoading(true);
      let imageUrl = generatedImageUrl;
      
      if (!imageUrl) {
        imageUrl = await generateImage();
        if (imageUrl) {
          setGeneratedImageUrl(imageUrl);
        }
      }

      if (imageUrl) {
        Alert.alert(
          'Preview',
          'Image generated successfully! Ready to share.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share Now', onPress: handleShare }
          ]
        );
      }
    } catch (error) {
      console.error('Preview error:', error);
      Alert.alert('Preview Failed', 'Could not generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Generated image preview */}
      {generatedImageUrl && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: generatedImageUrl }} style={styles.previewImage} />
          <Text style={styles.previewLabel}>Ready to share!</Text>
        </View>
      )}

      {/* Share button */}
      <TouchableOpacity
        style={[
          styles.shareButton,
          { backgroundColor: theme.colors.primary },
          isLoading && styles.shareButtonDisabled,
        ]}
        onPress={handleShare}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.shareIcon}>📱</Text> // Using emoji instead of Ionicons
        )}
        <Text style={styles.shareButtonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Preview button */}
      {!generatedImageUrl && !isLoading && (
        <TouchableOpacity
          style={[styles.previewButton, { borderColor: theme.colors.primary }]}
          onPress={showPreview}
          activeOpacity={0.8}
        >
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={[styles.previewButtonText, { color: theme.colors.primary }]}>
            Preview
          </Text>
        </TouchableOpacity>
      )}

      {/* Platform availability info */}
      <View style={styles.availabilityInfo}>
        {shareAvailability.instagram && (
          <View style={styles.platformAvailable}>
            <Text style={styles.platformIcon}>📷</Text>
            <Text style={styles.platformText}>Instagram Stories</Text>
          </View>
        )}
        {shareAvailability.facebook && (
          <View style={styles.platformAvailable}>
            <Text style={styles.platformIcon}>📘</Text>
            <Text style={styles.platformText}>Facebook Stories</Text>
          </View>
        )}
        {!shareAvailability.instagram && !shareAvailability.facebook && (
          <View style={styles.platformUnavailable}>
            <Text style={styles.platformIcon}>📤</Text>
            <Text style={styles.platformTextUnavailable}>General Sharing</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  previewLabel: {
    fontSize: responsiveFontSizes.small,
    color: '#22C55E',
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSizes.medium,
    fontWeight: '600',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  previewIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  previewButtonText: {
    fontSize: responsiveFontSizes.medium,
    fontWeight: '600',
  },
  availabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  platformAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.sm,
  },
  platformUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#F9F9F9',
    borderRadius: borderRadius.sm,
  },
  platformIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  platformText: {
    fontSize: responsiveFontSizes.small,
    color: '#333',
    fontWeight: '500',
  },
  platformTextUnavailable: {
    fontSize: responsiveFontSizes.small,
    color: '#666',
  },
}); 