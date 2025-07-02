import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { getRecentQuestionTopics } from '../../lib/database';
import { Text } from '../atoms/Text';
import { Card } from './Card';
import { spacing, borderRadius, fontFamily } from '../../lib/theme';
import type { DbQuestionTopic } from '../../lib/supabase';

// Extended interface to match what getRecentQuestionTopics returns
interface EnrichedQuestionTopic extends DbQuestionTopic {
  category?: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
  } | null;
  question_count?: number;
  is_breaking?: boolean | null;
  is_featured?: boolean | null;
}

interface RecentTopicsListProps {
  maxItems?: number;
  onTopicPress?: (topicId: string) => void;
  showHeader?: boolean;
}

interface BadgeProps {
  type: 'breaking' | 'featured';
  label: string;
}

const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const getBadgeColors = () => {
    switch (type) {
      case 'breaking':
        return {
          bg: '#DC2626', // Red for breaking news
          text: '#FFFFFF'
        };
      case 'featured':
        return {
          bg: '#1D4ED8', // Blue for featured content
          text: '#FFFFFF'
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text variant="caption" style={[styles.badgeText, { color: colors.text }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

export const RecentTopicsList: React.FC<RecentTopicsListProps> = ({
  maxItems = 6,
  onTopicPress,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<EnrichedQuestionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentTopics();
  }, [maxItems]);

  const loadRecentTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📚 Loading recent topics for home screen...');
      
      const recentTopics = await getRecentQuestionTopics(maxItems);
      
      // Transform topics to include sample breaking/featured status
      const enrichedTopics: EnrichedQuestionTopic[] = recentTopics.map((topic, index) => {
        // Sample logic for breaking/featured - replace with real data
        const isBreaking = index === 0 && Math.random() > 0.8; // First topic has 20% chance to be breaking
        const isFeatured = !isBreaking && Math.random() > 0.6; // 40% chance to be featured if not breaking
        
        return {
          ...topic,
          is_breaking: isBreaking,
          is_featured: isFeatured,
        };
      });
      
      setTopics(enrichedTopics);
      console.log(`✅ Loaded ${enrichedTopics.length} recent topics`);
    } catch (err) {
      console.error('Error loading recent topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: EnrichedQuestionTopic) => {
    if (onTopicPress) {
      onTopicPress(topic.id);
      return;
    }

    // Default behavior: navigate to quiz session
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to start a quiz session.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to practice mode for this topic
    router.push(`/quiz-session/${topic.id}?mode=practice` as any);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString();
  };

  const getDifficultyColor = (level?: number) => {
    if (!level) return theme.foregroundSecondary;
    if (level <= 2) return '#10B981'; // Green for easy
    if (level <= 4) return '#F59E0B'; // Orange for medium
    return '#EF4444'; // Red for hard
  };

  const getDifficultyLabel = (level?: number) => {
    if (!level) return 'Beginner';
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    return 'Advanced';
  };

  const renderTopicItem = ({ item: topic, index }: { item: EnrichedQuestionTopic; index: number }) => (
    <TouchableOpacity
      key={topic.id}
      onPress={() => handleTopicPress(topic)}
      activeOpacity={0.7}
    >
      <Card style={styles.topicCard} variant="outlined">
        <View style={styles.topicContent}>
          {/* Header with category and time */}
          <View style={styles.topicHeader}>
            <View style={styles.categoryInfo}>
              {topic.category?.emoji && (
                <Text style={styles.categoryEmoji}>{topic.category.emoji}</Text>
              )}
              <Text variant="caption" color="secondary" style={styles.categoryName}>
                {topic.category?.name || 'General'}
              </Text>
            </View>
            {topic.created_at && (
              <Text variant="caption" color="secondary" style={styles.timeAgo}>
                {formatTimeAgo(topic.created_at)}
              </Text>
            )}
          </View>

          {/* Badges section */}
          {(topic.is_breaking || topic.is_featured) && (
            <View style={styles.badgesContainer}>
              {/* Breaking badge takes priority */}
              {topic.is_breaking && (
                <Badge type="breaking" label="BREAKING" />
              )}
              
              {/* Featured badge (only show if not breaking) */}
              {!topic.is_breaking && topic.is_featured && (
                <Badge type="featured" label="FEATURED" />
              )}
            </View>
          )}

          {/* Topic title */}
          <Text variant="callout" color="inherit" style={styles.topicTitle} numberOfLines={2}>
            {topic.title || topic.topic_title}
          </Text>

          {/* Description */}
          {topic.description && (
            <Text variant="footnote" color="secondary" style={styles.topicDescription} numberOfLines={2}>
              {topic.description}
            </Text>
          )}

          {/* Stats footer */}
          <View style={styles.topicFooter}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📝</Text>
                <Text variant="caption" color="secondary">
                  {(topic as any).question_count || 0} questions
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[
                  styles.difficultyDot,
                  { backgroundColor: getDifficultyColor((topic as any).difficulty_level) }
                ]} />
                <Text variant="caption" color="secondary">
                  {getDifficultyLabel((topic as any).difficulty_level)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: theme.primary }]}
              onPress={() => handleTopicPress(topic)}
            >
              <Text variant="caption" style={styles.startButtonText}>
                Start Quiz
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <Text variant="title2" color="inherit" style={styles.sectionTitle}>
            Recent Topics
          </Text>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading recent topics...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <Text variant="title2" color="inherit" style={styles.sectionTitle}>
            Recent Topics
          </Text>
        )}
        <Card style={styles.errorCard} variant="outlined">
          <Text variant="callout" color="inherit" style={styles.errorTitle}>
            Unable to Load Topics
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadRecentTopics}
          >
            <Text variant="callout" style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  }

  if (topics.length === 0) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <Text variant="title2" color="inherit" style={styles.sectionTitle}>
            Recent Topics
          </Text>
        )}
        <Card style={styles.emptyCard} variant="outlined">
          <Text style={styles.emptyIcon}>📚</Text>
          <Text variant="callout" color="inherit" style={styles.emptyTitle}>
            No Topics Available
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyMessage}>
            New topics will appear here as they're added.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.headerContainer}>
          <Text variant="title2" color="inherit" style={styles.sectionTitle}>
            Recent Topics
          </Text>
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <Text variant="callout" color="primary" style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={topics}
        renderItem={renderTopicItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false} // Let parent handle scrolling
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '600',
  },
  seeAllText: {
    fontFamily: fontFamily.text,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fontFamily.text,
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  errorMessage: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
  },
  emptyMessage: {
    fontFamily: fontFamily.text,
    textAlign: 'center',
  },
  listContent: {
    gap: spacing.md,
  },
  topicCard: {
    overflow: 'hidden',
  },
  topicContent: {
    padding: spacing.lg,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryName: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  topicTitle: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  topicDescription: {
    fontFamily: fontFamily.text,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: 12,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  startButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  startButtonText: {
    color: 'white',
    fontFamily: fontFamily.text,
    fontWeight: '600',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontFamily: fontFamily.text,
    fontWeight: '600',
    fontSize: 10,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
}); 