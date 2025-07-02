/**
 * Progressive List Component for CivicSense Mobile
 * 
 * High-performance list with:
 * - FlashList for 60fps scrolling on iOS/Android
 * - Progressive loading with onEndReached
 * - Skeleton loading states
 * - Pull-to-refresh support
 * - iOS-specific optimizations
 * - Accessibility features
 */

import React, { useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { FlatList } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from '../atoms/Text';
import { LoadingSkeleton } from './LoadingSkeleton';
import { spacing, borderRadius, shadows } from '../../lib/theme';
import type { ProgressiveLoadingState } from '../../lib/hooks/useProgressiveLoading';

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProgressiveListProps<T> {
  /** Progressive loading state from hook */
  progressiveState: ProgressiveLoadingState<T>;
  
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactElement;
  
  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string;
  
  /** Estimated item size for performance optimization */
  estimatedItemSize?: number;
  
  /** Number of skeleton items to show while loading */
  skeletonCount?: number;
  
  /** Custom skeleton component */
  SkeletonComponent?: React.ComponentType<any>;
  
  /** Empty state component */
  EmptyComponent?: React.ComponentType<any>;
  
  /** Error state component */
  ErrorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  
  /** Additional FlatList props */
  flatListProps?: any;
  
  /** Test ID for automation */
  testID?: string;
  
  /** Custom styles */
  style?: any;
  
  /** Content container style */
  contentContainerStyle?: any;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

const DefaultSkeletonItem = memo(() => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonItem, { backgroundColor: theme.card }]}>
      <View style={styles.skeletonContent}>
        <LoadingSkeleton width={40} height={40} borderRadius={20} />
        <View style={styles.skeletonText}>
          <LoadingSkeleton width="80%" height={20} style={{ marginBottom: 8 }} />
          <LoadingSkeleton width="100%" height={16} style={{ marginBottom: 4 }} />
          <LoadingSkeleton width="60%" height={14} />
        </View>
      </View>
    </View>
  );
});

DefaultSkeletonItem.displayName = 'DefaultSkeletonItem';

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const DefaultEmptyComponent = memo(() => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}>
        <Text variant="title2" color="secondary">📚</Text>
      </View>
      <Text variant="headline" color="inherit" style={styles.emptyTitle}>
        No items found
      </Text>
      <Text variant="body" color="secondary" style={styles.emptyDescription}>
        Try adjusting your search or check back later for new content.
      </Text>
    </View>
  );
});

DefaultEmptyComponent.displayName = 'DefaultEmptyComponent';

// ============================================================================
// ERROR STATE COMPONENT  
// ============================================================================

const DefaultErrorComponent = memo<{ error: string; onRetry: () => void }>(({ error, onRetry }) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.errorContainer}>
      <View style={[styles.errorIcon, { backgroundColor: theme.destructive }]}>
        <Text variant="title2" color="primary">⚠️</Text>
      </View>
      <Text variant="headline" color="inherit" style={styles.errorTitle}>
        Unable to load content
      </Text>
      <Text variant="body" color="secondary" style={styles.errorDescription}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading content"
      >
        <Text variant="callout" style={[styles.retryButtonText, { color: theme.foreground }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
});

DefaultErrorComponent.displayName = 'DefaultErrorComponent';

// ============================================================================
// FOOTER LOADING COMPONENT
// ============================================================================

const LoadingFooter = memo<{ loading: boolean; hasMore: boolean }>(({ loading, hasMore }) => {
  const { theme } = useTheme();
  
  if (!hasMore && !loading) return null;
  
  return (
    <View style={styles.footerContainer}>
      {loading && (
        <>
          <ActivityIndicator 
            size="small" 
            color={theme.primary} 
            style={styles.footerSpinner}
          />
          <Text variant="footnote" color="secondary" style={styles.footerText}>
            Loading more...
          </Text>
        </>
      )}
      {!hasMore && !loading && (
        <Text variant="footnote" color="secondary" style={styles.footerText}>
          That's everything for now!
        </Text>
      )}
    </View>
  );
});

LoadingFooter.displayName = 'LoadingFooter';

// ============================================================================
// MAIN PROGRESSIVE LIST COMPONENT
// ============================================================================

export function ProgressiveList<T>({
  progressiveState,
  renderItem,
  keyExtractor,
  estimatedItemSize = 120,
  skeletonCount = 8,
  SkeletonComponent = DefaultSkeletonItem,
  EmptyComponent = DefaultEmptyComponent,
  ErrorComponent = DefaultErrorComponent,
  flatListProps = {},
  testID = 'progressive-list',
  style,
  contentContainerStyle,
}: ProgressiveListProps<T>) {
  const { theme } = useTheme();
  
  const {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    canRetry,
    loadMore,
    refresh,
    retry
  } = progressiveState;

  // ============================================================================
  // MEMOIZED CALLBACKS FOR PERFORMANCE
  // ============================================================================

  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      console.log('📱 End reached, loading more items...');
      loadMore();
    }
  }, [loading, loadingMore, hasMore, loadMore]);

  const handleRefresh = useCallback(() => {
    if (refresh) {
      console.log('🔄 Pull to refresh triggered');
      refresh();
    }
  }, [refresh]);

  const handleRetry = useCallback(() => {
    if (canRetry && retry) {
      retry();
    }
  }, [canRetry, retry]);

  // Memoized render function to prevent unnecessary re-renders
  const renderListItem = useCallback(({ item, index }: { item: T; index: number }) => {
    return renderItem(item, index);
  }, [renderItem]);

  // Memoized key extractor
  const getItemKey = useCallback((item: T, index: number) => {
    return keyExtractor(item, index);
  }, [keyExtractor]);

  // Footer component with loading state
  const ListFooterComponent = useMemo(() => (
    <LoadingFooter loading={loadingMore} hasMore={hasMore} />
  ), [loadingMore, hasMore]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  // Initial loading with skeletons
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, style]} testID={`${testID}-loading`}>
        <FlatList
          data={Array(skeletonCount).fill({})}
          renderItem={() => <SkeletonComponent />}
          keyExtractor={(_: any, index: number) => `skeleton-${index}`}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          {...flatListProps}
        />
      </View>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, style]} testID={`${testID}-error`}>
        <ErrorComponent error={error} onRetry={handleRetry} />
      </View>
    );
  }

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <View style={[styles.container, style]} testID={`${testID}-empty`}>
        <EmptyComponent />
      </View>
    );
  }

  // ============================================================================
  // MAIN LIST RENDER
  // ============================================================================

      return (
    <View style={[styles.container, style]} testID={testID}>
      <FlatList
        data={items}
        renderItem={renderListItem}
        keyExtractor={getItemKey}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8} // iOS optimization - trigger slightly earlier
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.background}
          />
        }
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'} // iOS handles this automatically
        maxToRenderPerBatch={10} // Optimize for smooth scrolling
        updateCellsBatchingPeriod={50} // iOS optimization
        windowSize={10} // Reduce memory usage
        initialNumToRender={8} // Match skeleton count
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        {...flatListProps}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  // Skeleton styles
  skeletonItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  skeletonText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 2,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDescription: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 44, // iOS touch target
  },
  retryButtonText: {
    fontWeight: '600',
  },
  // Footer styles
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  footerSpinner: {
    marginRight: spacing.sm,
  },
  footerText: {
    textAlign: 'center',
  },
});

export default ProgressiveList; 