/**
 * ============================================================================
 * CIVICSENSE ENHANCED REACT QUERY HOOKS
 * ============================================================================
 * Advanced data fetching with infinite queries, performance monitoring,
 * and intelligent caching strategies
 */

import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../auth-context';
import { optimizedDataService } from '../optimized-data-service';
import { enhancedPerformanceMonitor } from '../enhanced-performance-monitor';

// ============================================================================
// ENHANCED QUERY TYPES & INTERFACES
// ============================================================================

interface CategoryWithStats {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  display_order: number;
  is_active: boolean;
  topic_count: number;
  question_count: number;
  active_topics: number;
  avg_difficulty: number;
}

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

interface PaginatedTopicsResponse {
  topics: TopicWithStats[];
  hasMore: boolean;
  total: number;
}

interface QuestionWithOptions {
  topic_id: string;
  question_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: number;
  sources?: any;
}

interface UserProgressSummary {
  total_quizzes: number;
  avg_score: number;
  total_time_minutes: number;
  current_streak: number;
  max_streak: number;
  favorite_categories: any[];
  recent_activity: any[];
  performance_trend: any[];
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const queryKeys = {
  // Categories
  categories: () => ['categories'] as const,
  categoriesWithStats: () => ['categories', 'withStats'] as const,
  
  // Topics
  topics: () => ['topics'] as const,
  topicsByCategory: (categoryId?: string) => ['topics', 'byCategory', categoryId] as const,
  topicsPaginated: (categoryId?: string, limit?: number) => 
    ['topics', 'paginated', categoryId, limit] as const,
  topicsInfinite: (categoryId?: string) => ['topics', 'infinite', categoryId] as const,
  
  // Questions
  questions: () => ['questions'] as const,
  questionsByTopics: (topicIds: string[]) => ['questions', 'byTopics', ...topicIds.sort()] as const,
  
  // User Progress
  userProgress: () => ['userProgress'] as const,
  userProgressById: (userId: string) => ['userProgress', userId] as const,
  
  // Performance
  performance: () => ['performance'] as const,
} as const;

// ============================================================================
// ENHANCED CATEGORIES HOOKS
// ============================================================================

/**
 * Enhanced hook for fetching categories with comprehensive stats and caching
 */
export function useEnhancedCategories(
  options: Omit<UseQueryOptions<CategoryWithStats[]>, 'queryKey' | 'queryFn'> = {}
) {
  return useQuery({
    queryKey: queryKeys.categoriesWithStats(),
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        const categories = await optimizedDataService.getCategoriesWithStatsOptimized();
        
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getCategoriesWithStats',
          startTime,
          {
            queryType: 'rpc',
            recordCount: categories.length,
            cacheStrategy: 'optimized',
          }
        );
        
        return categories;
      } catch (error) {
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getCategoriesWithStats',
          startTime,
          {
            queryType: 'rpc',
            error: true,
          }
        );
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// ============================================================================
// ENHANCED TOPICS HOOKS
// ============================================================================

/**
 * Enhanced infinite query hook for topics with performance monitoring
 */
export function useEnhancedTopicsInfinite(
  categoryId?: string,
  options: Omit<
    UseInfiniteQueryOptions<PaginatedTopicsResponse, Error, PaginatedTopicsResponse, PaginatedTopicsResponse, string[]>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  > = {}
) {
  return useInfiniteQuery({
    queryKey: queryKeys.topicsInfinite(categoryId),
    queryFn: async ({ pageParam = 0 }) => {
      const startTime = performance.now();
      const limit = 20;
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      
      try {
        const result = await optimizedDataService.getTopicsWithStatsPaginated(
          categoryId,
          limit,
          offset
        );
        
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getTopicsWithStatsPaginated',
          startTime,
          {
            queryType: 'rpc',
            recordCount: result.topics.length,
            cacheStrategy: 'paginated',
            metadata: { categoryId, limit, offset },
          }
        );
        
        return result;
      } catch (error) {
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getTopicsWithStatsPaginated',
          startTime,
          {
            queryType: 'rpc',
            error: true,
            metadata: { categoryId, limit, offset },
          }
        );
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 20; // Calculate next offset
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Enhanced hook for paginated topics with prefetching
 */
export function useEnhancedTopicsPaginated(
  categoryId?: string,
  page: number = 0,
  limit: number = 20,
  options: Omit<UseQueryOptions<PaginatedTopicsResponse>, 'queryKey' | 'queryFn'> = {}
) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: [...queryKeys.topicsPaginated(categoryId, limit), page],
    queryFn: async () => {
      const startTime = performance.now();
      const offset = page * limit;
      
      try {
        const result = await optimizedDataService.getTopicsWithStatsPaginated(
          categoryId,
          limit,
          offset
        );
        
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getTopicsWithStatsPaginated',
          startTime,
          {
            queryType: 'rpc',
            recordCount: result.topics.length,
            cacheStrategy: 'paginated',
            metadata: { categoryId, limit, offset, page },
          }
        );
        
        return result;
      } catch (error) {
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getTopicsWithStatsPaginated',
          startTime,
          {
            queryType: 'rpc',
            error: true,
          }
        );
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });

  // Prefetch next page
  useEffect(() => {
    if (query.data?.hasMore && page >= 0) {
      queryClient.prefetchQuery({
        queryKey: [...queryKeys.topicsPaginated(categoryId, limit), page + 1],
        queryFn: async () => {
          const offset = (page + 1) * limit;
          return optimizedDataService.getTopicsWithStatsPaginated(
            categoryId,
            limit,
            offset
          );
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [query.data?.hasMore, page, categoryId, limit, queryClient]);

  return query;
}

// ============================================================================
// ENHANCED QUESTIONS HOOKS
// ============================================================================

/**
 * Enhanced hook for fetching questions with batch optimization
 */
export function useEnhancedQuestions(
  topicIds: string[],
  limitPerTopic: number = 10,
  randomize: boolean = false,
  options: Omit<UseQueryOptions<QuestionWithOptions[]>, 'queryKey' | 'queryFn'> = {}
) {
  const sortedTopicIds = useMemo(() => [...topicIds].sort(), [topicIds]);
  
  return useQuery({
    queryKey: [...queryKeys.questionsByTopics(sortedTopicIds), limitPerTopic, randomize],
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        const questions = await optimizedDataService.getQuestionsOptimized(
          sortedTopicIds,
          limitPerTopic,
          randomize
        );
        
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getQuestionsOptimized',
          startTime,
          {
            queryType: 'rpc',
            recordCount: questions.length,
            cacheStrategy: 'batch',
            metadata: { topicCount: sortedTopicIds.length, limitPerTopic, randomize },
          }
        );
        
        return questions;
      } catch (error) {
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getQuestionsOptimized',
          startTime,
          {
            queryType: 'rpc',
            error: true,
          }
        );
        throw error;
      }
    },
    enabled: sortedTopicIds.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes (questions change less frequently)
    gcTime: 45 * 60 * 1000, // 45 minutes
    retry: 2,
    ...options,
  });
}

// ============================================================================
// ENHANCED USER PROGRESS HOOKS
// ============================================================================

/**
 * Enhanced hook for user progress with real-time updates
 */
export function useEnhancedUserProgress(
  userId?: string,
  options: Omit<UseQueryOptions<UserProgressSummary>, 'queryKey' | 'queryFn'> = {}
) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  
  return useQuery({
    queryKey: queryKeys.userProgressById(effectiveUserId || 'anonymous'),
    queryFn: async () => {
      if (!effectiveUserId) {
        throw new Error('No user ID available for progress tracking');
      }
      
      const startTime = performance.now();
      
      try {
        const progress = await optimizedDataService.getUserProgressOptimized(effectiveUserId);
        
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getUserProgressOptimized',
          startTime,
          {
            queryType: 'rpc',
            recordCount: 1,
            cacheStrategy: 'user_specific',
            metadata: { userId: effectiveUserId },
          }
        );
        
        return progress;
      } catch (error) {
        enhancedPerformanceMonitor.trackDatabaseQuery(
          'getUserProgressOptimized',
          startTime,
          {
            queryType: 'rpc',
            error: true,
          }
        );
        throw error;
      }
    },
    enabled: !!effectiveUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes (user data changes more frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
}

// ============================================================================
// PRELOADING & CACHE WARMING HOOKS
// ============================================================================

/**
 * Hook for preloading critical data on app startup
 */
export function usePreloadCriticalData() {
  const queryClient = useQueryClient();
  
  const preloadData = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // Preload categories first (most critical)
      await queryClient.prefetchQuery({
        queryKey: queryKeys.categoriesWithStats(),
        queryFn: () => optimizedDataService.getCategoriesWithStatsOptimized(),
        staleTime: 10 * 60 * 1000,
      });
      
      // Preload first page of topics for popular categories
      const categories = queryClient.getQueryData<CategoryWithStats[]>(
        queryKeys.categoriesWithStats()
      );
      
      if (categories) {
        const topCategories = categories
          .sort((a, b) => b.topic_count - a.topic_count)
          .slice(0, 3);
        
        // Preload topics for top categories in background
        const preloadPromises = topCategories.map(category =>
          queryClient.prefetchQuery({
            queryKey: [...queryKeys.topicsPaginated(category.id, 10), 0],
            queryFn: () => optimizedDataService.getTopicsWithStatsPaginated(category.id, 10, 0),
            staleTime: 5 * 60 * 1000,
          })
        );
        
        await Promise.allSettled(preloadPromises);
      }
      
      enhancedPerformanceMonitor.trackOperation(
        'preloadCriticalData',
        startTime,
        {
          category: 'data_loading',
          metadata: { categoriesCount: categories?.length || 0 },
        }
      );
      
      console.log('✅ Critical data preloading completed');
    } catch (error) {
      console.warn('⚠️ Critical data preloading failed:', error);
      
      enhancedPerformanceMonitor.trackOperation(
        'preloadCriticalData',
        startTime,
        {
          category: 'data_loading',
          metadata: { error: true },
        }
      );
    }
  }, [queryClient]);
  
  return { preloadData };
}

/**
 * Hook for warming cache with upcoming data
 */
export function useCacheWarming() {
  const queryClient = useQueryClient();
  
  const warmTopicsCache = useCallback(async (categoryId: string) => {
    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.topicsPaginated(categoryId, 20), 0],
      queryFn: () => optimizedDataService.getTopicsWithStatsPaginated(categoryId, 20, 0),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
  
  const warmQuestionsCache = useCallback(async (topicIds: string[]) => {
    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.questionsByTopics(topicIds), 10, false],
      queryFn: () => optimizedDataService.getQuestionsOptimized(topicIds, 10, false),
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);
  
  return {
    warmTopicsCache,
    warmQuestionsCache,
  };
}

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

/**
 * Hook for monitoring query performance in real-time
 */
export function useQueryPerformanceMonitor() {
  const queryClient = useQueryClient();
  
  const getQueryStats = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      pendingQueries: queries.filter(q => q.state.status === 'pending').length,
    };
  }, [queryClient]);
  
  const clearStaleQueries = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const staleQueries = queryCache.getAll().filter(q => q.isStale());
    
    staleQueries.forEach(query => {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    });
    
    console.log(`🧹 Cleared ${staleQueries.length} stale queries`);
  }, [queryClient]);
  
  return {
    getQueryStats,
    clearStaleQueries,
  };
}

// ============================================================================
// CACHE INVALIDATION UTILITIES
// ============================================================================

/**
 * Utility hook for smart cache invalidation
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
  }, [queryClient]);
  
  const invalidateTopics = useCallback((categoryId?: string) => {
    if (categoryId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.topicsByCategory(categoryId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics() });
    }
  }, [queryClient]);
  
  const invalidateUserProgress = useCallback((userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProgressById(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProgress() });
    }
  }, [queryClient]);
  
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
    console.log('🧹 All queries invalidated');
  }, [queryClient]);
  
  return {
    invalidateCategories,
    invalidateTopics,
    invalidateUserProgress,
    invalidateAll,
  };
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (__DEV__) {
  // Development helpers for debugging query performance
  const logQueryPerformance = () => {
    const report = enhancedPerformanceMonitor.getPerformanceSnapshot();
    console.group('🔍 Query Performance Report');
    console.log('Total Queries:', report.totalQueries);
    console.log('Average Query Time:', report.averageQueryTime.toFixed(1), 'ms');
    console.log('Cache Hit Rate:', (report.cacheHitRate * 100).toFixed(1), '%');
    console.log('Slow Queries:', report.slowQueries.length);
    console.groupEnd();
  };
  
  // Auto-log performance every 10 minutes in development
  setInterval(logQueryPerformance, 600000);
} 