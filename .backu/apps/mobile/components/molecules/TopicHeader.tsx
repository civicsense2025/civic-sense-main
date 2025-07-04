import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { spacing } from '../../lib/theme';

interface TopicHeaderProps {
  emoji?: string | undefined;
  title: string;
  description: string;
  createdAt?: string | undefined;
  categories?: string[] | undefined;
  questionCount?: number | undefined;
  estimatedMinutes?: number;
  rating?: number;
  showStats?: boolean;
  showToggle?: boolean;
  onToggle?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.categoryBadge, { 
      backgroundColor: `${theme.primary}08`, 
      borderColor: `${theme.primary}20` 
    }]}>
      <Text style={[styles.categoryBadgeText, { color: theme.foreground }]}>
        {category}
      </Text>
    </View>
  );
};

const formatPublishDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    return 'recently';
  }
};

export const TopicHeader: React.FC<TopicHeaderProps> = ({
  emoji,
  title,
  description,
  createdAt,
  categories,
  questionCount = 10,
  estimatedMinutes,
  rating = 4.2,
  showStats = true,
  showToggle = false,
  onToggle,
  isExpanded = false,
}) => {
  const { theme } = useTheme();
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isExpanded);
    }
  };
  
  return (
    <View style={styles.topicHeader}>
      {emoji && (
        <Text style={styles.topicEmoji}>{emoji}</Text>
      )}
      <Text style={[styles.topicTitle, { color: theme.foreground }]}>
        {title}
      </Text>
      
      {/* Publication Date */}
      {createdAt && (
        <Text style={[styles.topicDate, { color: theme.foregroundSecondary }]}>
          Published {formatPublishDate(createdAt)}
        </Text>
      )}
      
              {/* Description with toggle */}
        <View>
          {/* Only show description when not using toggle or when expanded */}
          {(!showToggle || isExpanded) && (
            <Text style={[styles.topicDescription, { color: theme.foregroundSecondary }]}>
              {description}
            </Text>
          )}
          
          {showToggle && (
            <TouchableOpacity onPress={handleToggle} style={styles.toggleButton}>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleText, { color: theme.primary }]}>
                  {isExpanded ? 'Hide description' : 'See description'}
                </Text>
                <Text style={[styles.toggleCaret, { color: theme.primary }]}>
                  {isExpanded ? '⌃' : '⌄'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      
      {/* Expandable content */}
      {(!showToggle || isExpanded) && (
        <>
          {/* Categories */}
          {categories && categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {categories.slice(0, 3).map((category, index) => {
                const categoryText = typeof category === 'string' ? category : 
                                   typeof category === 'object' && category !== null ? 
                                   ((category as any).name || String(category)) : 
                                   String(category);
                
                return (
                  <CategoryBadge key={index} category={categoryText} />
                );
              })}
            </View>
          )}

          {/* Topic Stats */}
          {showStats && (
            <View style={styles.topicStats}>
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>📝</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {questionCount}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>Questions</Text>
              </View>
              
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>⏱️</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {estimatedMinutes || Math.ceil((questionCount * 30) / 60)}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>Est. Min</Text>
              </View>
              
              <View style={styles.topicStatItem}>
                <Text style={[styles.statIcon, { color: theme.foregroundSecondary }]}>⭐</Text>
                <Text style={[styles.topicStatValue, { color: theme.primary }]}>
                  {rating}
                </Text>
                <Text style={[styles.topicStatLabel, { color: theme.foregroundSecondary }]}>Rating</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Topic Header - exact copy from topic/[id].tsx
  topicHeader: {
    marginBottom: spacing.xl,
  },
  topicEmoji: {
    fontSize: 64,
    lineHeight: 64,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  topicTitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 34,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  topicDate: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: spacing.md,
    textAlign: 'left',
    opacity: 0.8,
  },
  topicDescription: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  topicStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  topicStatValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  topicStatLabel: {
    fontFamily: 'HelveticaNeue',
    fontSize: 12,
    fontWeight: '400',
  },
  
  // Toggle styles
  toggleButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  toggleText: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleCaret: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
  },
}); 