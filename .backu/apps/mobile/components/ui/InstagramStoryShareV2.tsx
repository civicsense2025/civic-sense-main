/**
 * Enhanced Instagram/Facebook Story Share Component
 * Uses the CivicSense Dynamic Image Generation System
 * Mobile-optimized for React Native
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
  Share,
  PermissionsAndroid,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {
  generateInstagramStory,
  generateQuizResultImage,
  generateAchievementImage,
  trackImageUsage,
  type ImageGenerationParams,
} from '@/lib/image-generator';

// Simple theme interface for this component
interface SimpleTheme {
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
  };
}

// Mock theme hook if not available
const useTheme = (): { theme: SimpleTheme } => ({
  theme: {
    colors: {
      primary: '#E0A63E', // CivicSense primary color
      secondary: '#2E4057',
      background: '#FDFCF9',
      text: '#1B1B1B',
      textSecondary: '#6B7280',
      border: '#E2E8F0',
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
  userId?: string;
  achievement?: {
    title: string;
    description: string;
    badge: string;
    unlockedAt: Date;
  };
  contentUrl?: string;
  customMessage?: string;
  onShareStart?: () => void;
  onShareComplete?: (result: { success: boolean; method?: string; error?: string }) => void;
  onError?: (error: string) => void;
  style?: any;
}

export function InstagramStoryShareV2({
  type,
  topic,
  userProgress,
  streakCount,
  userName,
  userId,
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Generate appropriate image based on type
  const generateImage = async (): Promise<string | null> => {
    try {
      let imageUrl: string | null = null;

      switch (type) {
        case 'topic':
          if (topic) {
            imageUrl = generateInstagramStory({
              title: topic.title,
              description: topic.description,
              emoji: topic.emoji,
              userId,
              theme: 'default',
              variant: 'bold'
            });
          }
          break;

        case 'result':
          if (topic && userProgress) {
            imageUrl = generateQuizResultImage({
              title: topic.title,
              score: userProgress.score,
              totalQuestions: userProgress.totalQuestions,
              userName,
              template: 'instagram-story',
              userId,
              theme: 'default',
              variant: 'bold'
            });
          }
          break;

        case 'streak':
          if (streakCount) {
            imageUrl = generateInstagramStory({
              title: `${streakCount}-Day Learning Streak! 🔥`,
              description: `Continuing my civic education journey with CivicSense`,
              emoji: '🔥',
              userName,
              userId,
              theme: 'default',
              variant: 'bold'
            });
          }
          break;

        case 'achievement':
          if (achievement) {
            imageUrl = generateAchievementImage({
              title: achievement.title,
              badge: achievement.badge,
              userName,
              template: 'instagram-story',
              userId,
              theme: 'default',
              variant: 'bold'
            });
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

  // Generate image on component mount
  const initializeImage = async () => {
    try {
      setIsLoading(true);
      setImageError(false);
      const imageUrl = await generateImage();
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      setImageError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeImage();
  }, [type, topic, userProgress, streakCount, userId, achievement]);

  // Handle sharing
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

      // Track usage
      if (userId) {
        await trackImageUsage({
          template: 'instagram-story',
          variant: 'bold',
          theme: 'default',
          userId,
          engagementType: 'share'
        });
      }

      // Prepare sharing content
      const shareContent = getShareContent();
      const socialMessage = `${shareContent.message}\n\n#CivicSense #Democracy #CivicEducation #PowerAwareness`;

      // Use platform share
      await Share.share({
        message: socialMessage,
        title: shareContent.title,
        url: imageUrl,
      });

      onShareComplete?.({ success: true, method: 'platform_share' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sharing failed';
      console.error('Share error:', error);
      onError?.(errorMessage);
      onShareComplete?.({ success: false, error: errorMessage });
      
      // Don't show alert for user cancellation
      if (!errorMessage.includes('User cancelled') && !errorMessage.includes('User canceled')) {
        Alert.alert('Sharing Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download for mobile
  const handleDownload = async () => {
    if (!generatedImageUrl || imageError) {
      Alert.alert('Download Failed', 'No image available to download.');
      return;
    }

    try {
      setIsDownloading(true);

      // Request permission on Android
      if (Platform.OS === 'android') {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please grant permission to save images to your device.');
          return;
        }
      }

      // Track download
      if (userId) {
        await trackImageUsage({
          template: 'instagram-story',
          variant: 'bold', 
          theme: 'default',
          userId,
          engagementType: 'download'
        });
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `civicsense-${type}-${timestamp}.jpg`;

      // Download the image
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Download from URL to local file
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUrl,
        fileUri
      );

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('CivicSense', asset, false);

      Alert.alert(
        'Download Complete! 📱',
        'Image saved to your Photos. You can now share it directly to your Instagram story.',
        [{ text: 'Great!', style: 'default' }]
      );

      // Optional: Open sharing sheet with the saved image
      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          'Share Now?',
          'Would you like to share the image now?',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Share', 
              onPress: async () => {
                await Sharing.shareAsync(downloadResult.uri);
              }
            }
          ]
        );
      }

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to save image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate appropriate share content
  const getShareContent = () => {
    const baseUrl = contentUrl || 'https://civicsense.com';

    switch (type) {
      case 'topic':
        return {
          title: `Learning about ${topic?.title || 'Civic Topics'} with CivicSense`,
          message: customMessage || `Exploring "${topic?.title}" with CivicSense\n\n${topic?.description || 'Understanding how power really works in America.'}\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${baseUrl}`,
        };
      case 'result':
        return {
          title: `Completed ${topic?.title || 'Quiz'} with ${userProgress?.score || 0}% score!`,
          message: customMessage || `I scored ${userProgress?.score || 0}% on "${topic?.title}" with CivicSense!\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${baseUrl}`,
        };
      case 'streak':
        return {
          title: `${streakCount} day learning streak with CivicSense!`,
          message: customMessage || `${streakCount} days of civic learning with CivicSense!\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${baseUrl}`,
        };
      case 'achievement':
        return {
          title: `Unlocked "${achievement?.title || 'Achievement'}" in CivicSense!`,
          message: customMessage || `Unlocked "${achievement?.title}" achievement in CivicSense!\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${baseUrl}`,
        };
      default:
        return {
          title: 'Learning with CivicSense',
          message: customMessage || `Learning with CivicSense\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${baseUrl}`,
        };
    }
  };

  // Get appropriate button text
  const getButtonText = () => {
    if (isLoading) return 'Generating...';
    return 'Share to Stories';
  };

  const getDownloadButtonText = () => {
    if (isDownloading) return 'Saving...';
    return 'Save to Photos';
  };

  const shareContent = getShareContent();

  return (
    <View style={[styles.container, style]}>
      {/* Generated image preview */}
      {generatedImageUrl && !imageError && (
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: generatedImageUrl }} 
            style={styles.previewImage}
            resizeMode="contain"
          />
          <Text style={[styles.previewLabel, { color: theme.colors.primary }]}>
            Ready to share!
          </Text>
        </View>
      )}

      {/* Loading state */}
      {isLoading && !generatedImageUrl && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Generating branded image...
          </Text>
        </View>
      )}

      {/* Error state */}
      {imageError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Image generation failed
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.colors.primary }]}
            onPress={() => initializeImage()}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content preview */}
      <View style={[styles.contentPreview, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
          {shareContent.title}
        </Text>
        <Text style={[styles.contentMessage, { color: theme.colors.textSecondary }]} numberOfLines={3}>
          {shareContent.message.split('\n\n')[0]}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        {/* Share button */}
        <TouchableOpacity
          style={[
            styles.shareButton,
            { backgroundColor: theme.colors.primary },
            (isLoading || isDownloading) && styles.buttonDisabled,
          ]}
          onPress={handleShare}
          disabled={isLoading || isDownloading || imageError}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.shareIcon}>📱</Text>
          )}
          <Text style={styles.shareButtonText}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>

        {/* Download button */}
        {generatedImageUrl && !imageError && (
          <TouchableOpacity
            style={[
              styles.downloadButton, 
              { borderColor: theme.colors.primary },
              (isLoading || isDownloading) && styles.buttonDisabled,
            ]}
            onPress={handleDownload}
            disabled={isLoading || isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <Text style={styles.downloadIcon}>📥</Text>
            )}
            <Text style={[styles.downloadButtonText, { color: theme.colors.primary }]}>
              {getDownloadButtonText()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Branded image auto-generated for maximum social media impact
        </Text>
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
    gap: spacing.md,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  previewLabel: {
    fontSize: responsiveFontSizes.small,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: responsiveFontSizes.small,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: responsiveFontSizes.small,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontSize: responsiveFontSizes.small,
    fontWeight: '600',
  },
  contentPreview: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  contentTitle: {
    fontSize: responsiveFontSizes.medium,
    fontWeight: '600',
  },
  contentMessage: {
    fontSize: responsiveFontSizes.small,
    lineHeight: responsiveFontSizes.small * 1.4,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  shareIcon: {
    fontSize: 20,
  },
  downloadIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSizes.medium,
    fontWeight: '600',
  },
  downloadButtonText: {
    fontSize: responsiveFontSizes.medium,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: responsiveFontSizes.small,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
}); 