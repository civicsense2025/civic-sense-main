import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { BookmarkService } from '../../lib/services/bookmark-service';
import { spacing } from '../../lib/theme';

// ============================================================================
// INTERFACES
// ============================================================================

interface BookmarkButtonProps {
  contentId: string;
  contentType: 'topic' | 'topics' | 'article' | 'articles' | 'quiz' | 'quizzes' | 'event' | 'events' | 'question' | 'questions' | 'other';
  title: string;
  description?: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  onBookmarkToggle?: (isBookmarked: boolean) => void;
  testID?: string;
}

// ============================================================================
// BOOKMARK BUTTON COMPONENT
// ============================================================================

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  contentId,
  contentType,
  title,
  description,
  imageUrl,
  size = 'medium',
  style,
  onBookmarkToggle,
  testID = 'bookmark-button',
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Check if content is already bookmarked when component mounts
  React.useEffect(() => {
    checkBookmarkStatus();
  }, [contentId, user?.id]);

  const checkBookmarkStatus = async () => {
    if (!user?.id) return;

    try {
      const { bookmarks } = await BookmarkService.getBookmarks(user.id, {
        limit: 1,
      });

      // Check if this content is already bookmarked
      const existingBookmark = bookmarks.find(
        (bookmark) => bookmark.content_id === contentId && bookmark.content_type === contentType
      );

      if (existingBookmark) {
        setIsBookmarked(true);
        setBookmarkId(existingBookmark.id);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleToggleBookmark = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark content.', [
        { text: 'OK' }
      ]);
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // Haptic feedback could be added here if needed

      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const { success, error } = await BookmarkService.deleteBookmark(user.id, bookmarkId);
        
        if (error) throw error;

        if (success) {
          setIsBookmarked(false);
          setBookmarkId(null);
          onBookmarkToggle?.(false);
          
          // Optional: Show success message
          if (Platform.OS === 'ios') {
            Alert.alert('🗑️ Bookmark Removed', 'Content removed from your saved items.');
          }
        }
      } else {
        // Add bookmark
        const { bookmark, error } = await BookmarkService.createBookmark(user.id, {
          contentId,
          contentType,
          title,
          description: description || null,
          thumbnailUrl: imageUrl || null,
          contentUrl: getContentUrl(contentType, contentId),
          sourceDomain: 'civicsense.com',
        });

        if (error) throw error;

        if (bookmark) {
          setIsBookmarked(true);
          setBookmarkId(bookmark.id);
          onBookmarkToggle?.(true);
          
          // Update bookmark access count
          await BookmarkService.updateBookmarkAccess(user.id, bookmark.id);
          
          // Optional: Show success message
          if (Platform.OS === 'ios') {
            Alert.alert('⭐ Bookmarked!', 'Content saved to your bookmarks.');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      
      const errorMessage = error instanceof Error && error.message === 'Content already bookmarked'
        ? 'This content is already in your bookmarks!'
        : 'Failed to update bookmark. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, contentId, contentType, title, description, imageUrl, isBookmarked, bookmarkId, loading, onBookmarkToggle]);

  const getContentUrl = (type: string, id: string): string => {
    switch (type) {
      case 'topic':
      case 'topics': return `/topics/${id}`;
      case 'article':
      case 'articles': return `/articles/${id}`;
      case 'quiz':
      case 'quizzes': return `/quiz/${id}`;
      case 'event':
      case 'events': return `/events/${id}`;
      case 'question':
      case 'questions': return `/questions/${id}`;
      default: return `/content/${id}`;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 20; // medium
    }
  };

  const getButtonSize = () => {
    const iconSize = getIconSize();
    const padding = size === 'small' ? spacing.xs : spacing.sm;
    return {
      width: iconSize + padding * 2,
      height: iconSize + padding * 2,
      borderRadius: (iconSize + padding * 2) / 2,
    };
  };

  const buttonStyle = getButtonSize();
  const iconSize = getIconSize();

  return (
    <TouchableOpacity
      style={[
        styles.bookmarkButton,
        buttonStyle,
        {
          backgroundColor: isBookmarked ? theme.primary : theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
      onPress={handleToggleBookmark}
      disabled={loading || !user}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isBookmarked ? '#FFFFFF' : theme.primary} 
        />
      ) : (
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={iconSize}
          color={isBookmarked ? '#FFFFFF' : theme.foregroundSecondary}
        />
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  bookmarkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
}); 