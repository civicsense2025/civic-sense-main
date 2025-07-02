import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../auth-context';

// ============================================================================
// DATA LOADING OPTIMIZATION HOOK
// ============================================================================

/**
 * Cache for storing ongoing data fetches to prevent duplicates
 */
const fetchCache = new Map<string, Promise<any>>();

/**
 * Debounced data cache to prevent excessive API calls
 */
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Utility to create a cache key
 */
const createCacheKey = (key: string, params?: Record<string, any>): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${key}:${paramString}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheKey: string): boolean => {
  const cached = dataCache.get(cacheKey);
  if (!cached) return false;
  return Date.now() - cached.timestamp < cached.ttl;
};

/**
 * Generic optimized data fetching hook with:
 * - Deduplication of concurrent requests
 * - Caching with TTL
 * - Debounced loading states
 * - Automatic cleanup
 */
export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    ttl?: number; // Time to live in milliseconds
    debounceMs?: number;
    params?: Record<string, any>;
  } = {}
) {
  const {
    enabled = true,
    ttl = 300000, // 5 minutes default TTL
    debounceMs = 500,
    params,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cacheKey = useMemo(() => createCacheKey(key, params), [key, params]);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = dataCache.get(cacheKey);
      if (cached && isMountedRef.current) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Check if there's already a pending request for this data
    let fetchPromise = fetchCache.get(cacheKey);
    
    if (!fetchPromise) {
      // Create new fetch promise
      fetchPromise = (async () => {
        try {
          console.log(`📊 Fetching data for key: ${key}`);
          const result = await fetcher();
          
          // Cache the result
          dataCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            ttl,
          });
          
          return result;
        } catch (err) {
          console.error(`❌ Error fetching data for key: ${key}`, err);
          throw err;
        } finally {
          // Remove from fetch cache when done
          fetchCache.delete(cacheKey);
        }
      })();

      // Store the promise to deduplicate requests
      fetchCache.set(cacheKey, fetchPromise);
    }

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPromise;
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, [enabled, cacheKey, fetcher, key, ttl]);

  // Debounced fetch function
  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, debounceMs);
  }, [fetchData, debounceMs]);

  // Effect to trigger data fetching
  useEffect(() => {
    if (!enabled) return;

    // Use debounced fetch for performance
    debouncedFetch();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, debouncedFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(async () => {
    // Clear cache for this key
    dataCache.delete(cacheKey);
    fetchCache.delete(cacheKey);
    
    await fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// ============================================================================
// SPECIALIZED HOOKS FOR COMMON DATA TYPES
// ============================================================================

/**
 * Optimized hook for user progress data
 */
export function useUserProgress(userId?: string) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useOptimizedData(
    'user-progress',
    async () => {
      if (!effectiveUserId) throw new Error('No user ID available');
      
      // Import database function dynamically to avoid circular dependencies
      const { getUserProgress } = await import('../database');
      return getUserProgress(effectiveUserId);
    },
    {
      enabled: !!effectiveUserId,
      ttl: 180000, // 3 minutes for user progress
      params: { userId: effectiveUserId },
    }
  );
}

/**
 * Optimized hook for topics data
 */
export function useTopics(category?: string) {
  return useOptimizedData(
    'topics',
    async () => {
      const { getQuestionTopics } = await import('../database');
      return getQuestionTopics(category);
    },
    {
      ttl: 600000, // 10 minutes for topics (they don't change often)
      params: { category },
    }
  );
}

/**
 * Optimized hook for daily topics (using recent topics as substitute)
 */
export function useDailyTopics() {
  return useOptimizedData(
    'daily-topics',
    async () => {
      const { getRecentQuestionTopics } = await import('../database');
      return getRecentQuestionTopics(3); // Get 3 recent topics as "daily" topics
    },
    {
      ttl: 3600000, // 1 hour for daily topics
      debounceMs: 1000, // Longer debounce for daily topics
    }
  );
}

/**
 * Optimized hook for recent topics
 */
export function useRecentTopics(limit = 5) {
  return useOptimizedData(
    'recent-topics',
    async () => {
      const { getRecentQuestionTopics } = await import('../database');
      return getRecentQuestionTopics(limit);
    },
    {
      ttl: 300000, // 5 minutes for recent topics
      params: { limit },
    }
  );
}

// ============================================================================
// CACHE MANAGEMENT UTILITIES
// ============================================================================

/**
 * Clear all cached data (useful for logout/refresh scenarios)
 */
export const clearDataCache = () => {
  dataCache.clear();
  fetchCache.clear();
  console.log('🧹 Data cache cleared');
};

/**
 * Clear cache for specific key pattern
 */
export const clearCacheByPattern = (pattern: string) => {
  for (const key of dataCache.keys()) {
    if (key.includes(pattern)) {
      dataCache.delete(key);
    }
  }
  for (const key of fetchCache.keys()) {
    if (key.includes(pattern)) {
      fetchCache.delete(key);
    }
  }
  console.log(`🧹 Cache cleared for pattern: ${pattern}`);
};

/**
 * Get cache statistics (useful for debugging)
 */
export const getCacheStats = () => {
  return {
    dataCacheSize: dataCache.size,
    fetchCacheSize: fetchCache.size,
    dataKeys: Array.from(dataCache.keys()),
    fetchKeys: Array.from(fetchCache.keys()),
  };
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

if (__DEV__) {
  // Monitor cache performance
  setInterval(() => {
    const stats = getCacheStats();
    if (stats.dataCacheSize > 20) {
      console.warn('⚠️ Data cache getting large:', stats.dataCacheSize, 'entries');
    }
    if (stats.fetchCacheSize > 5) {
      console.warn('⚠️ Multiple concurrent fetches detected:', stats.fetchCacheSize);
    }
  }, 30000); // Check every 30 seconds
} 