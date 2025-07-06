/**
 * Global Data Cache Service
 * 
 * Prevents redundant data fetching by implementing:
 * - Request deduplication across all components
 * - Global cache shared between all hooks and services
 * - Intelligent cache invalidation strategies
 * - Memory management and cleanup
 */

import { supabase } from './supabase';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  promise?: Promise<T>;
  isLoading: boolean;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxEntries: number; // Maximum cache entries
}

class GlobalDataCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxEntries: 1000
  };

  /**
   * Get data with aggressive deduplication
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    // 1. Return cached data if valid
    if (entry && entry.expiresAt > now && !entry.isLoading) {
      console.log(`🎯 Cache HIT: ${key}`);
      return entry.data;
    }

    // 2. Return pending request if already in progress
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Deduplicating request: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    console.log(`📡 Cache MISS: ${key} - fetching...`);

    // 3. Create deduplication promise
    const promise = this.executeFetch(key, fetcher, ttl || this.config.ttl);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Execute fetch with caching
   */
  private async executeFetch<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const now = Date.now();

    // Mark as loading
    this.cache.set(key, {
      data: null,
      timestamp: now,
      expiresAt: now + ttl,
      isLoading: true
    });

    try {
      const data = await fetcher();
      
      // Cache successful result
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        isLoading: false
      });

      // Clean up old entries
      this.cleanup();

      return data;
    } catch (error) {
      // Remove failed entry
      this.cache.delete(key);
      throw error;
    }
  }

  /**
   * Invalidate cache entries
   */
  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      this.pendingRequests.clear();
      console.log('🧹 All cache cleared');
      return;
    }

    const regex = new RegExp(keyPattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      }
    }
    console.log(`🧹 Cache cleared for pattern: ${keyPattern}`);
  }

  /**
   * Clean up expired entries and manage memory
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    let removed = 0;
    for (const [key, entry] of entries) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size > this.config.maxEntries) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.cache.size - this.config.maxEntries);

      for (const [key] of sortedEntries) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned ${removed} cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      expiredEntries: entries.filter(e => e.expiresAt < now).length,
      loadingEntries: entries.filter(e => e.isLoading).length,
      validEntries: entries.filter(e => e.expiresAt > now && !e.isLoading).length,
      memoryUsage: this.cache.size * 1024 // Rough estimate
    };
  }
}

// Global singleton instance
export const globalDataCache = new GlobalDataCache();

/**
 * Optimized data fetchers with deduplication
 */
export const optimizedFetchers = {
  /**
   * Get categories with deduplication
   */
  getCategories: () => globalDataCache.get(
    'categories',
    async () => {
      const { data, error } = await supabase
        .from('question_topics_with_category_junction')
        .select(`
          category_id,
          category_name,
          category_emoji,
          category_description,
          topic_count
        `)
        .order('category_name');

      if (error) throw error;

      // Transform to unique categories
      const categoryMap = new Map();
      data?.forEach(row => {
        if (!categoryMap.has(row.category_id)) {
          categoryMap.set(row.category_id, {
            id: row.category_id,
            name: row.category_name,
            emoji: row.category_emoji,
            description: row.category_description,
            topic_count: 0
          });
        }
        categoryMap.get(row.category_id).topic_count += 1;
      });

      return Array.from(categoryMap.values());
    },
    10 * 60 * 1000 // 10 minutes TTL for categories
  ),

  /**
   * Get topics for category with deduplication
   */
  getTopicsForCategory: (categoryId: string) => globalDataCache.get(
    `topics-${categoryId}`,
    async () => {
      const { data, error } = await supabase
        .from('question_topics')
        .select('*')
        .contains('categories', [categoryId])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    5 * 60 * 1000 // 5 minutes TTL for topics
  ),

  /**
   * Get questions for topic with deduplication
   */
  getQuestionsForTopic: (topicId: string, limit = 15) => globalDataCache.get(
    `questions-${topicId}-${limit}`,
    async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    2 * 60 * 1000 // 2 minutes TTL for questions
  ),

  /**
   * Get user progress with deduplication
   */
  getUserProgress: (userId: string) => globalDataCache.get(
    `user-progress-${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('user_question_attempts')
        .select(`
          topic_id,
          question_id,
          is_correct,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    1 * 60 * 1000 // 1 minute TTL for user progress
  ),

  /**
   * Get user skills with deduplication
   */
  getUserSkills: (userId: string) => globalDataCache.get(
    `user-skills-${userId}`,
    async () => {
      // Use a simpler query to avoid the relationship issue
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('User skills query failed, returning empty array:', error);
        return [];
      }
      return data || [];
    },
    2 * 60 * 1000 // 2 minutes TTL for skills
  )
};

/**
 * Cache management helpers
 */
export const cacheHelpers = {
  /**
   * Invalidate all data
   */
  clearAll: () => globalDataCache.invalidate(),

  /**
   * Invalidate categories
   */
  clearCategories: () => globalDataCache.invalidate('categories'),

  /**
   * Invalidate topics for category
   */
  clearTopics: (categoryId?: string) => {
    const pattern = categoryId ? `topics-${categoryId}` : 'topics-';
    globalDataCache.invalidate(pattern);
  },

  /**
   * Invalidate user data
   */
  clearUserData: (userId: string) => {
    globalDataCache.invalidate(`user-(progress|skills)-${userId}`);
  },

  /**
   * Get cache performance stats
   */
  getStats: () => globalDataCache.getStats(),

  /**
   * Log cache performance
   */
  logStats: () => {
    const stats = globalDataCache.getStats();
    console.log('📊 Cache Stats:', stats);
  }
}; 