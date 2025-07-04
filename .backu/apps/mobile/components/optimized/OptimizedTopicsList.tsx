/**
 * ============================================================================
 * CIVICSENSE OPTIMIZED TOPICS LIST COMPONENT
 * ============================================================================
 * High-performance topics list with FlashList, infinite scrolling,
 * memoization, and comprehensive performance monitoring
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { enhancedPerformanceMonitor } from '../../lib/enhanced-performance-monitor';
import { 
  useEnhancedTopicsInfinite, 
  useCacheWarming,
  useQueryPerformanceMonitor 
} from '../../lib/hooks/use-optimized-data-enhanced';

// ============================================================================
// TYPES & INTERFACES  
// ============================================================================

interface TopicWithStats {
  topic_id: string;
  topic_title: string;
  description?: string;
  categories: any[];
  question_count: number;
  difficulty_avg: number;
  is_active: boolean;
  created_at: string;
  primary_category_name?: string;
  primary_category_emoji?: string;
}

interface OptimizedTopicsListProps {
  categoryId?: string;
  onTopicPress?: (topicId: string, topic: TopicWithStats) => void;
  showPerformanceDebug?: boolean;
  testID?: string;
}

interface TopicCardProps {
  topic: TopicWithStats;
  onPress?: (topicId: string, topic: TopicWithStats) => void;
  testID?: string;
}

// ============================================================================
// MEMOIZED TOPIC CARD COMPONENT
// ============================================================================

const TopicCard: React.FC<TopicCardProps> = memo(({ 
  topic, 
  onPress,
  testID = 'topic-card'
}) => {
  const renderStartTime = useRef(performance.now());
  
  useEffect(() => {
    enhancedPerformanceMonitor.trackComponentRender(
      'TopicCard',
      'mount',
      renderStartTime.current,
      {
        metadata: { topicId: topic.topic_id },
      }
    );
  }, [topic.topic_id]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(topic.topic_id, topic);
    }
  }, [onPress, topic.topic_id, topic]);

  const difficultyColor = useMemo(() => {
    if (topic.difficulty_avg <= 1.5) return '#10B981'; // Easy - Green
    if (topic.difficulty_avg <= 2.5) return '#F59E0B'; // Medium - Yellow
    return '#EF4444'; // Hard - Red
  }, [topic.difficulty_avg]);

  const difficultyText = useMemo(() => {
    if (topic.difficulty_avg <= 1.5) return 'Easy';
    if (topic.difficulty_avg <= 2.5) return 'Medium';
    return 'Hard';
  }, [topic.difficulty_avg]);

  const questionCountText = useMemo(() => {
    const count = topic.question_count;
    return count === 1 ? '1 question' : `${count} questions`;
  }, [topic.question_count]);

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Topic: ${topic.topic_title}`}
      accessibilityHint={`${questionCountText}, ${difficultyText} difficulty. Double tap to start quiz.`}
      style={({ pressed }) => [
        styles.topicCard,
        pressed && styles.topicCardPressed
      ]}
    >
      <View style={styles.topicHeader}>
        <View style={styles.topicTitleContainer}>
          {topic.primary_category_emoji && (
            <Text style={styles.categoryEmoji}>
              {topic.primary_category_emoji}
            </Text>
          )}
          <Text style={styles.topicTitle} numberOfLines={2}>
            {topic.topic_title}
          </Text>
        </View>
        
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
          <Text style={styles.difficultyText}>{difficultyText}</Text>
        </View>
      </View>

      {topic.description && (
        <Text style={styles.topicDescription} numberOfLines={3}>
          {topic.description}
        </Text>
      )}

      <View style={styles.topicFooter}>
        <View style={styles.topicStats}>
          <Text style={styles.questionCount}>
            {questionCountText}
          </Text>
          
          {topic.primary_category_name && (
            <Text style={styles.categoryName}>
              {topic.primary_category_name}
            </Text>
          )}
        </View>
        
        <View style={styles.actionHint}>
          <Text style={styles.actionText}>Tap to start</Text>
        </View>
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return (
    prevProps.topic.topic_id === nextProps.topic.topic_id &&
    prevProps.topic.question_count === nextProps.topic.question_count &&
    prevProps.topic.difficulty_avg === nextProps.topic.difficulty_avg
  );
});

TopicCard.displayName = 'TopicCard';

// ============================================================================
// LOADING & ERROR COMPONENTS
// ============================================================================

const TopicCardSkeleton: React.FC<{ testID?: string }> = memo(({ testID = 'topic-skeleton' }) => (
  <View style={[styles.topicCard, styles.skeletonCard]} testID={testID}>
    <View style={styles.topicHeader}>
      <View style={styles.skeletonTitleContainer}>
        <View style={styles.skeletonEmoji} />
        <View style={styles.skeletonTitle} />
      </View>
      <View style={styles.skeletonBadge} />
    </View>
    
    <View style={styles.skeletonDescription} />
    <View style={[styles.skeletonDescription, { width: '60%' }]} />
    
    <View style={styles.topicFooter}>
      <View style={styles.skeletonStats}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>
    </View>
  </View>
));

TopicCardSkeleton.displayName = 'TopicCardSkeleton';

const LoadingFooter: React.FC = memo(() => (
  <View style={styles.loadingFooter} testID="loading-footer">
    <ActivityIndicator size="small" color="#1E3A8A" />
    <Text style={styles.loadingText}>Loading more topics...</Text>
  </View>
));

LoadingFooter.displayName = 'LoadingFooter';

const EmptyState: React.FC<{ categoryId?: string }> = memo(({ categoryId }) => (
  <View style={styles.emptyState} testID="empty-state">
    <Text style={styles.emptyEmoji}>📚</Text>
    <Text style={styles.emptyTitle}>
      {categoryId ? 'No topics in this category' : 'No topics available'}
    </Text>
    <Text style={styles.emptyDescription}>
      {categoryId 
        ? 'Try selecting a different category or check back later.'
        : 'Topics will appear here once they\'re added to the system.'
      }
    </Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ============================================================================
// MAIN OPTIMIZED TOPICS LIST COMPONENT
// ============================================================================

export const OptimizedTopicsList: React.FC<OptimizedTopicsListProps> = memo(({
  categoryId,
  onTopicPress,
  showPerformanceDebug = false,
  testID = 'optimized-topics-list'
}) => {
  const mountTime = useRef(performance.now());
  const { warmTopicsCache } = useCacheWarming();
  const { getQueryStats } = useQueryPerformanceMonitor();

  // Enhanced infinite query with performance monitoring
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch
  } = useEnhancedTopicsInfinite(categoryId, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track component mount performance
  useEffect(() => {
    enhancedPerformanceMonitor.trackComponentRender(
      'OptimizedTopicsList',
      'mount',
      mountTime.current,
      {
        metadata: { 
          categoryId,
          hasTopics: !!data?.pages?.[0]?.topics?.length 
        },
      }
    );

    return () => {
      enhancedPerformanceMonitor.trackComponentRender(
        'OptimizedTopicsList',
        'unmount',
        performance.now(),
        {
          metadata: { categoryId },
        }
      );
    };
  }, [categoryId, data?.pages]);

  // Preload cache for related categories
  useEffect(() => {
    if (categoryId) {
      // Warm cache for this category in background
      warmTopicsCache(categoryId).catch(error => {
        console.warn('Cache warming failed:', error);
      });
    }
  }, [categoryId, warmTopicsCache]);

  // Flatten paginated data for FlatList
  const topics = useMemo(() => {
    if (!data?.pages) return [];
    
    const startTime = performance.now();
    const flattened = data.pages.flatMap((page: any) => page.topics);
    
    enhancedPerformanceMonitor.trackOperation(
      'flattenTopicsData',
      startTime,
      {
        category: 'data_processing',
        recordCount: flattened.length,
        metadata: { pagesCount: data.pages.length },
      }
    );

    return flattened;
  }, [data?.pages]);

  // Optimized render item with performance tracking
  const renderItem: ListRenderItem<TopicWithStats> = useCallback(({ item, index }: { item: TopicWithStats; index: number }) => {
    const renderStartTime = performance.now();
    
    const component = (
      <TopicCard
        topic={item}
        {...(onTopicPress && { onPress: onTopicPress })}
        testID={`topic-card-${index}`}
      />
    );

    // Track render performance for first few items
    if (index < 10) {
      setTimeout(() => {
        enhancedPerformanceMonitor.trackComponentRender(
          'TopicCard',
          'update',
          renderStartTime,
          {
            metadata: { index, topicId: item.topic_id },
          }
        );
      }, 0);
    }

    return component;
  }, [onTopicPress]);

  // Optimized key extractor
  const keyExtractor = useCallback((item: TopicWithStats) => item.topic_id, []);

  // Get item layout for better performance
  const getItemLayout = useCallback((data: ArrayLike<TopicWithStats> | null | undefined, index: number) => ({
    length: 140, // Estimated item height
    offset: 140 * index,
    index,
  }), []);

  // Handle load more with performance tracking
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      const startTime = performance.now();
      
      fetchNextPage().then(() => {
        enhancedPerformanceMonitor.trackOperation(
          'loadMoreTopics',
          startTime,
          {
            category: 'pagination',
            metadata: { categoryId },
          }
        );
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, categoryId]);

  // Render loading footer
  const renderLoadingFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return <LoadingFooter />;
    }
    return null;
  }, [isFetchingNextPage]);

  // Performance debug info
  const debugInfo = useMemo(() => {
    if (!showPerformanceDebug) return null;
    
    const stats = getQueryStats();
    const snapshot = enhancedPerformanceMonitor.getPerformanceSnapshot();
    
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          📊 Queries: {stats.totalQueries} | Cache: {(snapshot.cacheHitRate * 100).toFixed(1)}%
        </Text>
        <Text style={styles.debugText}>
          🏠 Topics: {topics.length} | Avg: {snapshot.averageQueryTime.toFixed(1)}ms
        </Text>
      </View>
    );
  }, [showPerformanceDebug, getQueryStats, topics.length]);

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer} testID="error-state">
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>
          Unable to load topics. Please check your connection and try again.
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={`${testID}-loading`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <TopicCardSkeleton key={index} testID={`skeleton-${index}`} />
        ))}
      </View>
    );
  }

  // Empty state
  if (!topics.length) {
    return <EmptyState {...(categoryId && { categoryId })} />;
  }

  return (
    <View style={styles.container} testID={testID}>
      {debugInfo}
      
      <FlatList
        data={topics}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderLoadingFooter}
        removeClippedSubviews
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        testID={`${testID}-flatlist`}
      />
    </View>
  );
});

OptimizedTopicsList.displayName = 'OptimizedTopicsList';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Topic Card Styles
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },

  topicCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  topicTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },

  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },

  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  topicDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },

  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topicStats: {
    flex: 1,
  },

  questionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 2,
  },

  categoryName: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  actionHint: {
    paddingHorizontal: 8,
  },

  actionText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500',
  },

  // Skeleton Styles
  skeletonCard: {
    backgroundColor: '#F3F4F6',
  },

  skeletonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  skeletonEmoji: {
    width: 20,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },

  skeletonTitle: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  skeletonBadge: {
    width: 60,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },

  skeletonDescription: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },

  skeletonStats: {
    flexDirection: 'row',
    gap: 12,
  },

  skeletonStat: {
    width: 80,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  // Loading Footer
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },

  errorDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  retryButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Debug Info
  debugContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    margin: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  debugText: {
    fontSize: 11,
    color: '#92400E',
    fontFamily: 'monospace',
  },
});

export default OptimizedTopicsList; 