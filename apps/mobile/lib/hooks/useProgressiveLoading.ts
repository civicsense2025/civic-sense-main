/**
 * Progressive Loading Hook for CivicSense Mobile
 * 
 * Provides paginated data loading with:
 * - Auto-loading on scroll (onEndReached)
 * - Loading states and error handling
 * - Refresh and retry functionality
 * - Optimized for mobile performance
 * - iOS-specific optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProgressiveLoadingOptions<T> {
  /** Initial page size */
  pageSize?: number;
  /** Maximum items to load (-1 for unlimited) */
  maxItems?: number;
  /** Auto-load on mount */
  autoLoad?: boolean;
  /** Cache key for this dataset */
  cacheKey?: string;
  /** Enable pull-to-refresh */
  refreshEnabled?: boolean;
}

export interface ProgressiveLoadingState<T> {
  // Data state
  items: T[];
  hasMore: boolean;
  total: number | undefined;
  
  // Loading states
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  
  // Error handling
  error: string | null;
  canRetry: boolean;
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
  page: number;
}

export interface ProgressiveDataFetcher<T> {
  (page: number, pageSize: number): Promise<PaginatedResponse<T>>;
}

// ============================================================================
// PROGRESSIVE LOADING HOOK
// ============================================================================

export function useProgressiveLoading<T>(
  fetcher: ProgressiveDataFetcher<T>,
  options: ProgressiveLoadingOptions<T> = {}
): ProgressiveLoadingState<T> {
  const {
    pageSize = 20,
    maxItems = -1,
    autoLoad = true,
    refreshEnabled = true
  } = options;

  // State management
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  // Refs for pagination state
  const currentPage = useRef(0);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // iOS-specific optimizations
  const optimizeForIOS = Platform.OS === 'ios';

  useEffect(() => {
    mountedRef.current = true;
    if (autoLoad) {
      loadInitial();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [autoLoad]);

  // ============================================================================
  // LOADING FUNCTIONS
  // ============================================================================

  const loadInitial = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      setCanRetry(false);
      isLoadingRef.current = true;
      
      console.log(`📱 Loading initial page (size: ${pageSize})`);
      
      const response = await fetcher(0, pageSize);
      
      if (!mountedRef.current) return;
      
      setItems(response.items);
      setHasMore(response.hasMore && (maxItems === -1 || response.items.length < maxItems));
      setTotal(response.total);
      currentPage.current = 0;
      
      console.log(`✅ Loaded ${response.items.length} items (hasMore: ${response.hasMore})`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setCanRetry(true);
      setItems([]);
      setHasMore(false);
      
      console.error('❌ Error loading initial data:', errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [fetcher, pageSize, maxItems]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || loadingMore) {
      console.log('📱 Skipping loadMore - already loading or no more items');
      return;
    }

    // Check max items limit
    if (maxItems !== -1 && items.length >= maxItems) {
      console.log(`📱 Reached max items limit: ${maxItems}`);
      setHasMore(false);
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);
      isLoadingRef.current = true;
      
      const nextPage = currentPage.current + 1;
      console.log(`📱 Loading page ${nextPage} (current items: ${items.length})`);
      
      const response = await fetcher(nextPage, pageSize);
      
      if (!mountedRef.current) return;
      
      // Calculate how many items we can actually add
      const remainingSlots = maxItems === -1 ? response.items.length : maxItems - items.length;
      const itemsToAdd = response.items.slice(0, remainingSlots);
      
      setItems(prev => [...prev, ...itemsToAdd]);
      setHasMore(
        response.hasMore && 
        itemsToAdd.length === response.items.length && 
        (maxItems === -1 || items.length + itemsToAdd.length < maxItems)
      );
      setTotal(response.total);
      currentPage.current = nextPage;
      
      console.log(`✅ Added ${itemsToAdd.length} more items (total: ${items.length + itemsToAdd.length})`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more data';
      setError(errorMessage);
      setCanRetry(true);
      
      console.error('❌ Error loading more data:', errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    }
  }, [fetcher, pageSize, hasMore, loadingMore, items.length, maxItems]);

  const refresh = useCallback(async () => {
    if (!refreshEnabled || isLoadingRef.current) return;
    
    try {
      setRefreshing(true);
      setError(null);
      setCanRetry(false);
      isLoadingRef.current = true;
      
      console.log('🔄 Refreshing data...');
      
      const response = await fetcher(0, pageSize);
      
      if (!mountedRef.current) return;
      
      setItems(response.items);
      setHasMore(response.hasMore && (maxItems === -1 || response.items.length < maxItems));
      setTotal(response.total);
      currentPage.current = 0;
      
      console.log(`✅ Refreshed with ${response.items.length} items`);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      setCanRetry(true);
      
      console.error('❌ Error refreshing data:', errorMessage);
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
        isLoadingRef.current = false;
      }
    }
  }, [fetcher, pageSize, refreshEnabled, maxItems]);

  const retry = useCallback(async () => {
    if (items.length === 0) {
      await loadInitial();
    } else {
      await loadMore();
    }
  }, [items.length, loadInitial, loadMore]);

  const reset = useCallback(() => {
    setItems([]);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
    setError(null);
    setHasMore(true);
    setTotal(undefined);
    setCanRetry(false);
    currentPage.current = 0;
    isLoadingRef.current = false;
  }, []);

  // ============================================================================
  // RETURN STATE
  // ============================================================================

  return {
    // Data state
    items,
    hasMore,
    total,
    
    // Loading states
    loading,
    loadingMore,
    refreshing,
    
    // Error handling
    error,
    canRetry,
    
    // Actions
    loadMore,
    refresh: refreshEnabled ? refresh : async () => {},
    retry,
    reset
  };
}

// ============================================================================
// SPECIALIZED HOOKS FOR CIVICSENSE DATA
// ============================================================================

export interface TopicProgressiveOptions {
  categoryId?: string | undefined;
  searchQuery?: string | undefined;
  pageSize?: number | undefined;
  maxItems?: number | undefined;
}

export interface CategoryProgressiveOptions {
  includeStats?: boolean;
  pageSize?: number;
  maxItems?: number;
}

export interface SkillProgressiveOptions {
  level?: string;
  pageSize?: number;
  maxItems?: number;
}

// Import CivicSense data services
import { 
  fetchTopicsPaginated, 
  fetchCategoriesPaginated,
  type StandardTopic, 
  type StandardCategory 
} from '../standardized-data-service';

/**
 * Progressive loading hook for topics with CivicSense-specific features
 */
export function useTopicsProgressive(options: TopicProgressiveOptions = {}) {
  const { categoryId, pageSize = 15, maxItems = 200 } = options;

  const fetcher: ProgressiveDataFetcher<StandardTopic> = async (page, limit) => {
    console.log(`🔍 Fetching topics page ${page} for category: ${categoryId || 'all'}`);
    
    const response = await fetchTopicsPaginated(
      categoryId, 
      { page, limit },
      { useCache: true, maxAge: 5 * 60 * 1000 } // 5 minute cache
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  };

  return useProgressiveLoading(fetcher, {
    pageSize,
    maxItems,
    autoLoad: true,
    refreshEnabled: true
  });
}

/**
 * Progressive loading hook for categories with statistics
 */
export function useCategoriesProgressive(options: CategoryProgressiveOptions = {}) {
  const { pageSize = 10, maxItems = 50 } = options;

  const fetcher: ProgressiveDataFetcher<StandardCategory> = async (page, limit) => {
    console.log(`🏛️ Fetching categories page ${page}`);
    
    const response = await fetchCategoriesPaginated(
      { page, limit },
      { useCache: true, maxAge: 10 * 60 * 1000 } // 10 minute cache for categories
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data!;
  };

  return useProgressiveLoading(fetcher, {
    pageSize,
    maxItems,
    autoLoad: true,
    refreshEnabled: true
  });
}

/**
 * Lightweight progressive loading for multiplayer game creation
 * Optimized for smaller page sizes and faster loading
 */
export function useTopicsForMultiplayer(categoryId?: string) {
  return useTopicsProgressive({
    categoryId,
    pageSize: 10, // Smaller pages for faster initial load
    maxItems: 50   // Limit for multiplayer context
  });
}

/**
 * Progressive loading optimized for quiz discovery
 * Loads more items per page for browsing experience
 */
export function useTopicsForQuizBrowsing(categoryId?: string) {
  return useTopicsProgressive({
    categoryId,
    pageSize: 20, // Larger pages for browsing
    maxItems: 300  // Allow more items for comprehensive browsing
  });
} 