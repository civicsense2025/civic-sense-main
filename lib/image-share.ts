/**
 * CivicSense Mobile Image Sharing Utility
 * Handles downloading and sharing generated images on mobile devices
 */

import { Share, Alert, Platform } from 'react-native';
import { generateFallbackText, type ImageGenerationParams } from './image-generator';

export interface ShareResult {
  success: boolean;
  shared?: boolean;
  error?: string;
  method?: 'image' | 'text' | 'url';
}

export interface ShareOptions {
  includeImage?: boolean;
  saveToGallery?: boolean;
  dialogTitle?: string;
  fallbackToText?: boolean;
  customMessage?: string;
}

/**
 * Downloads an image from URL and caches it locally
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const FileSystem = await import('expo-file-system');
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    if (downloadResult.status === 200) {
      return downloadResult.uri;
    } else {
      console.warn('Failed to download image:', downloadResult.status);
      return null;
    }
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Converts SVG to PNG using a web service (for better mobile compatibility)
 */
export async function convertSvgToPng(svgUrl: string): Promise<string | null> {
  try {
    // Add PNG conversion parameter to the URL
    const pngUrl = svgUrl + '&format=png';
    return pngUrl;
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    return null;
  }
}

/**
 * Saves an image to the device's photo gallery (optional feature)
 */
export async function saveToGallery(imageUri: string): Promise<boolean> {
  try {
    // Try to import expo-media-library (optional dependency)
    const MediaLibrary = await import('expo-media-library').catch(() => null);
    
    if (!MediaLibrary) {
      console.warn('expo-media-library not available');
      return false;
    }
    
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions to save images.');
      return false;
    }
    
    // Save to gallery
    await MediaLibrary.saveToLibraryAsync(imageUri);
    return true;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return false;
  }
}

/**
 * Shares an image with text using React Native's Share API
 */
export async function shareImageWithText(
  imageUrl: string,
  message: string,
  options: ShareOptions = {}
): Promise<ShareResult> {
  try {
    const {
      includeImage = true,
      saveToGallery = false,
      dialogTitle = 'Share CivicSense Content',
      fallbackToText = true,
    } = options;

    let localImageUri: string | null = null;

    if (includeImage) {
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `civicsense_share_${timestamp}.png`;
      
      // Convert SVG to PNG for better mobile compatibility
      const pngUrl = await convertSvgToPng(imageUrl);
      if (pngUrl) {
        localImageUri = await downloadImage(pngUrl, filename);
      }
      
      // Save to gallery if requested
      if (localImageUri && saveToGallery) {
        await saveToGallery(localImageUri);
      }
    }

    // Prepare share content
    const shareContent: any = {
      message,
      title: dialogTitle,
    };

    // Add image if available
    if (localImageUri && Platform.OS === 'ios') {
      shareContent.url = localImageUri;
    } else if (localImageUri && Platform.OS === 'android') {
      // Android handles images differently
      try {
        const Sharing = await import('expo-sharing');
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(localImageUri, {
            dialogTitle,
            mimeType: 'image/png',
          });
          return { success: true, shared: true, method: 'image' };
        }
      } catch (error) {
        console.warn('Failed to share image via Sharing API:', error);
      }
    }

    // Share using React Native's Share API
    if (Platform.OS === 'ios') {
      const result = await Share.share(shareContent, {
        dialogTitle,
        excludedActivityTypes: [
          'com.apple.UIKit.activity.Print',
          'com.apple.UIKit.activity.AssignToContact',
          'com.apple.UIKit.activity.SaveToCameraRoll',
        ],
      });
      
      return {
        success: true,
        shared: result.action === Share.sharedAction,
        method: localImageUri ? 'image' : 'text',
      };
    } else {
      // Android
      await Share.share(shareContent);
      return { success: true, shared: true, method: localImageUri ? 'image' : 'text' };
    }

  } catch (error) {
    console.error('Error sharing content:', error);
    
    // Fallback to text-only sharing
    if (options.fallbackToText) {
      try {
        await Share.share({
          message,
          title: options.dialogTitle || 'Share CivicSense Content',
        });
        return { success: true, shared: true, method: 'text' };
      } catch (fallbackError) {
        return { 
          success: false, 
          error: 'Failed to share content',
          method: 'text'
        };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Shares a dynamically generated image with optimized message
 */
export async function shareDynamicImage(
  imageUrl: string,
  params: ImageGenerationParams,
  options: ShareOptions = {}
): Promise<ShareResult> {
  const message = options.customMessage || generateFallbackText(params);
  const webUrl = `https://civicsense.com/topic/${params.title?.toLowerCase().replace(/\s+/g, '-')}`;
  
  const fullMessage = `${message}\n\nLearn more: ${webUrl}\n\n#CivicSense #Democracy #CivicEducation`;
  
  return shareImageWithText(imageUrl, fullMessage, {
    ...options,
    dialogTitle: options.dialogTitle || `CivicSense - ${params.title}`,
  });
}

/**
 * Quick share function for different content types
 */
export async function quickShare(
  type: 'topic' | 'completion' | 'streak' | 'achievement',
  imageUrl: string,
  params: ImageGenerationParams,
  options: ShareOptions = {}
): Promise<ShareResult> {
  const shareOptions: ShareOptions = {
    includeImage: true,
    fallbackToText: true,
    saveToGallery: false,
    ...options,
  };

  switch (type) {
    case 'completion':
      shareOptions.dialogTitle = 'Share Quiz Completion';
      break;
    case 'streak':
      shareOptions.dialogTitle = 'Share Learning Streak';
      break;
    case 'achievement':
      shareOptions.dialogTitle = 'Share Achievement';
      break;
    default:
      shareOptions.dialogTitle = 'Share Topic';
  }

  return shareDynamicImage(imageUrl, params, shareOptions);
}

/**
 * Copy image URL to clipboard (fallback option)
 */
export async function copyImageUrl(imageUrl: string): Promise<boolean> {
  try {
    // Try to import expo-clipboard (optional dependency)
    const Clipboard = await import('expo-clipboard').catch(() => null);
    
    if (Clipboard) {
      await Clipboard.setStringAsync(imageUrl);
      return true;
    } else {
      console.warn('expo-clipboard not available');
      return false;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Check if sharing is available on the current platform
 */
export async function isSharingAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    
    // Check if Expo Sharing is available
    const Sharing = await import('expo-sharing').catch(() => null);
    if (Sharing) {
      await Sharing.isAvailableAsync();
    }
    
    // React Native Share is always available on native platforms
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get optimal sharing method for current platform
 */
export function getOptimalSharingMethod(): 'native' | 'expo' | 'url' {
  if (Platform.OS === 'web') {
    return 'url';
  }
  
  // For native platforms, prefer React Native's Share API
  return 'native';
}

/**
 * Clean up cached images (call periodically to manage storage)
 */
export async function cleanupImageCache(): Promise<void> {
  try {
    const FileSystem = await import('expo-file-system');
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;
    
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const imageFiles = files.filter((file: string) => 
      file.startsWith('civicsense_share_') && 
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg'))
    );
    
    // Keep only the 10 most recent files
    if (imageFiles.length > 10) {
      const filesToDelete = imageFiles.slice(0, imageFiles.length - 10);
      
      for (const file of filesToDelete) {
        try {
          await FileSystem.deleteAsync(`${cacheDir}${file}`);
        } catch (error) {
          console.warn('Failed to delete cached file:', file, error);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up image cache:', error);
  }
} 