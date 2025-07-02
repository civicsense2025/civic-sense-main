import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { spacing, borderRadius, responsiveFontSizes } from '../../lib/theme';
import {
  generateInstagramStory,
  generateQuizThumbnail,
  generateQuizResultImage,
  generateAchievementImage,
  downloadImage,
  trackImageUsage,
  type ImageGenerationParams,
} from '@/lib/image-generator';

interface InstagramStoryShareProps {
  topic: {
    id: string;
    title: string;
    description?: string;
    emoji?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedTime?: number;
    isBreaking?: boolean;
    isFeatured?: boolean;
  };
  userProgress?: {
    score?: number;
    completedAt?: string;
    totalQuestions?: number;
    correctAnswers?: number;
  };
  type?: 'topic' | 'completion' | 'streak' | 'achievement';
  streakCount?: number;
  userName?: string;
  userId?: string;
  onShareComplete?: () => void;
}

export const InstagramStoryShare: React.FC<InstagramStoryShareProps> = ({
  topic,
  userProgress,
  type = 'topic',
  streakCount,
  userName,
  userId,
  onShareComplete,
}) => {
  const { theme } = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Generate dynamic image URL based on type
  useEffect(() => {
    const generateImageUrl = () => {
      try {
        let generatedUrl: string;

        switch (type) {
          case 'completion':
            if (userProgress?.score !== undefined && userProgress?.totalQuestions) {
              generatedUrl = generateQuizResultImage({
                title: topic.title,
                score: userProgress.score,
                totalQuestions: userProgress.totalQuestions,
                userName,
                template: 'instagram-story',
                userId,
                theme: 'default',
                variant: 'bold'
              });
            } else {
              generatedUrl = generateInstagramStory({
                title: topic.title,
                description: topic.description,
                emoji: topic.emoji,
                userId,
                theme: 'default',
                variant: 'bold'
              });
            }
            break;

          case 'streak':
            if (streakCount) {
              generatedUrl = generateInstagramStory({
                title: `${streakCount}-Day Learning Streak! 🔥`,
                description: `Currently learning about ${topic.title}`,
                emoji: '🔥',
                userName,
                userId,
                theme: 'default',
                variant: 'bold'
              });
            } else {
              generatedUrl = generateInstagramStory({
                title: topic.title,
                description: topic.description,
                emoji: topic.emoji,
                userId,
                theme: 'default',
                variant: 'bold'
              });
            }
            break;

          case 'achievement':
            generatedUrl = generateAchievementImage({
              title: topic.title,
              badge: topic.emoji || '🏆',
              userName,
              template: 'instagram-story',
              userId,
              theme: 'default',
              variant: 'bold'
            });
            break;

          default: // 'topic'
            generatedUrl = generateInstagramStory({
              title: topic.title,
              description: topic.description,
              emoji: topic.emoji,
              userId,
              theme: 'default',
              variant: 'bold'
            });
        }

        setImageUrl(generatedUrl);
        setImageLoading(false);
      } catch (error) {
        console.error('Error generating image URL:', error);
        setImageError(true);
        setImageLoading(false);
      }
    };

    generateImageUrl();
  }, [topic, userProgress, type, streakCount, userName, userId]);

  const getShareContent = () => {
    const webUrl = `https://civicsense.com/topic/${topic.id}`;

    switch (type) {
      case 'completion':
        return {
          title: 'Quiz Completed! 🎉',
          message: `I scored ${userProgress?.score || 0}% on "${topic.title}" with CivicSense!\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${webUrl}`,
        };
      
      case 'streak':
        return {
          title: `${streakCount}-Day Streak! 🔥`,
          message: `${streakCount} days of civic learning with CivicSense! Currently exploring "${topic.title}"\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${webUrl}`,
        };
      
      case 'achievement':
        return {
          title: 'New Achievement! ⭐',
          message: `Unlocked "${topic.title}" achievement in CivicSense!\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${webUrl}`,
        };
      
      default: // 'topic'
        return {
          title: topic.isBreaking ? 'Breaking News 🚨' : topic.isFeatured ? 'Featured Topic ✨' : 'Learn About This 🧠',
          message: `Exploring "${topic.title}" with CivicSense\n\n${topic.description || 'Understanding how power really works in America.'}\n\nCivic education that politicians don't want you to have.\n\nLearn more: ${webUrl}`,
        };
    }
  };

  const shareWithImage = async () => {
    try {
      setIsSharing(true);

      if (userId) {
        await trackImageUsage({
          template: 'instagram-story',
          variant: 'bold',
          theme: 'default',
          userId,
          engagementType: 'share'
        });
      }

      const shareContent = getShareContent();
      const webUrl = `https://civicsense.com/topic/${topic.id}`;
      
      // Enhanced message with hashtags for social media
      const socialMessage = `${shareContent.message}\n\n#CivicSense #Democracy #CivicEducation #PowerAwareness`;

      if (Platform.OS === 'ios') {
        // iOS: Use share sheet with image URL
        const shareOptions: any = {
          message: socialMessage,
          title: `CivicSense - ${shareContent.title}`,
        };

        // Add image URL if available
        if (imageUrl && !imageError) {
          shareOptions.url = imageUrl;
        }

        const result = await Share.share(shareOptions, {
          dialogTitle: 'Share CivicSense Content',
          excludedActivityTypes: [
            'com.apple.UIKit.activity.Print',
            'com.apple.UIKit.activity.AssignToContact',
            'com.apple.UIKit.activity.SaveToCameraRoll',
          ],
        });
        
        if (result.action === Share.sharedAction) {
          onShareComplete?.();
        }
      } else {
        // Android: Use basic share (image URLs work in many apps)
        await Share.share({
          message: imageUrl && !imageError ? `${socialMessage}\n\nImage: ${imageUrl}` : socialMessage,
          title: `CivicSense - ${shareContent.title}`,
        });
        onShareComplete?.();
      }

    } catch (error) {
      console.error('❌ Error sharing content:', error);
      Alert.alert('Sharing Failed', 'Unable to share content. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareTextOnly = async () => {
    try {
      const shareContent = getShareContent();
      await Share.share({
        message: shareContent.message,
        title: `CivicSense - ${shareContent.title}`,
      });
      onShareComplete?.();
    } catch (error) {
      console.error('❌ Error sharing text:', error);
      Alert.alert('Sharing Failed', 'Unable to share content. Please try again.');
    }
  };

  const downloadInstagramImage = async () => {
    if (!imageUrl || imageError) {
      Alert.alert('Download Failed', 'No image available to download.');
      return;
    }

    try {
      setIsDownloading(true);

      if (userId) {
        await trackImageUsage({
          template: 'instagram-story',
          variant: 'bold',
          theme: 'default',
          userId,
          engagementType: 'download'
        });
      }

      // Generate filename based on content
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `civicsense-${type}-${topic.id}-${timestamp}.svg`;

      await downloadImage(imageUrl, filename, userId);

      Alert.alert(
        'Download Complete! 📱',
        'Instagram story image saved to your device. You can now share it directly to your Instagram story.',
        [{ text: 'Great!', style: 'default' }]
      );

    } catch (error) {
      console.error('❌ Error downloading image:', error);
      Alert.alert('Download Failed', 'Unable to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const shareContent = getShareContent();

  return (
    <View style={styles.container}>
      {/* Dynamic Image Preview */}
      {imageUrl && (
        <View style={[styles.imagePreview, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.foregroundSecondary }]}>
                  Generating branded image...
                </Text>
              </View>
            ) : imageError ? (
              <View style={styles.imageError}>
                <Ionicons name="image-outline" size={48} color={theme.foregroundSecondary} />
                <Text style={[styles.errorText, { color: theme.foregroundSecondary }]}>
                  Preview unavailable
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            )}
          </View>
          <Text style={[styles.imageLabel, { color: theme.foregroundSecondary }]}>
            CivicSense Instagram Story • 1080×1920
          </Text>
        </View>
      )}

      {/* Content Preview */}
      <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.previewHeader}>
          <View style={[styles.topicIcon, { backgroundColor: theme.primary + '15' }]}>
            <Text style={styles.topicEmoji}>{topic.emoji || '📚'}</Text>
          </View>
          <View style={styles.previewContent}>
            <Text style={[styles.previewTitle, { color: theme.foreground }]} numberOfLines={2}>
              {shareContent.title}
            </Text>
            <Text style={[styles.previewMessage, { color: theme.foregroundSecondary }]} numberOfLines={3}>
              {shareContent.message.split('\n\n')[0]} {/* Show first part before URL */}
            </Text>
          </View>
        </View>
        
        <View style={styles.previewFooter}>
          <Text style={[styles.previewUrl, { color: theme.primary }]}>
            civicsense.com/topic/{topic.id}
          </Text>
        </View>
      </View>

      {/* Enhanced Share and Download buttons */}
      <View style={styles.shareButtonsContainer}>
        <TouchableOpacity
          style={[styles.shareButton, styles.primaryShareButton, { backgroundColor: theme.primary }]}
          onPress={shareWithImage}
          disabled={isSharing || isDownloading}
          activeOpacity={0.8}
        >
          <View style={styles.shareButtonContent}>
            {isSharing ? (
              <>
                <ActivityIndicator size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Sharing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share with Image</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.shareButton, styles.downloadButton, { borderColor: theme.primary }]}
          onPress={downloadInstagramImage}
          disabled={isSharing || isDownloading || !imageUrl || imageError}
          activeOpacity={0.8}
        >
          <View style={styles.shareButtonContent}>
            {isDownloading ? (
              <>
                <ActivityIndicator size={20} color={theme.primary} />
                <Text style={[styles.shareButtonSecondaryText, { color: theme.primary }]}>Downloading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={theme.primary} />
                <Text style={[styles.shareButtonSecondaryText, { color: theme.primary }]}>Download Image</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Text-only share option */}
      <TouchableOpacity
        style={[styles.textOnlyButton, { borderColor: theme.border }]}
        onPress={shareTextOnly}
        disabled={isSharing || isDownloading}
        activeOpacity={0.8}
      >
        <View style={styles.shareButtonContent}>
          <Ionicons name="text-outline" size={16} color={theme.foregroundSecondary} />
          <Text style={[styles.textOnlyText, { color: theme.foregroundSecondary }]}>Share Text Only</Text>
        </View>
      </TouchableOpacity>

      {/* Image Generation Info */}
      {imageUrl && !imageError && (
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={16} color={theme.foregroundSecondary} />
          <Text style={[styles.infoText, { color: theme.foregroundSecondary }]}>
            Branded image auto-generated for maximum social media impact
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  imagePreview: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  imageContainer: {
    aspectRatio: 9 / 16, // Instagram Story ratio
    backgroundColor: '#f8f9fa',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: responsiveFontSizes.textSmall,
    textAlign: 'center',
  },
  imageError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    fontSize: responsiveFontSizes.textSmall,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    fontSize: responsiveFontSizes.textSmall,
    textAlign: 'center',
    fontWeight: '500',
  },
  previewCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicEmoji: {
    fontSize: responsiveFontSizes.emojiMedium,
    lineHeight: responsiveFontSizes.emojiMedium * 1.2,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: responsiveFontSizes.textLarge,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: responsiveFontSizes.textLarge * 1.3,
  },
  previewMessage: {
    fontSize: responsiveFontSizes.textBase,
    lineHeight: responsiveFontSizes.textBase * 1.4,
  },
  previewFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewUrl: {
    fontSize: responsiveFontSizes.textSmall,
    fontWeight: '500',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  shareButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  primaryShareButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  downloadButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  textOnlyButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 400,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSizes.textMedium,
    fontWeight: '600',
  },
  shareButtonSecondaryText: {
    fontSize: responsiveFontSizes.textMedium,
    fontWeight: '600',
  },
  textOnlyText: {
    fontSize: responsiveFontSizes.textSmall,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  infoText: {
    fontSize: responsiveFontSizes.textSmall,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
}); 