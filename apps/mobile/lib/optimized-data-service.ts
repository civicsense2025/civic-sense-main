import { supabase } from './supabase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

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

export class OptimizedDataService {
  private static instance: OptimizedDataService;
  private cache = new Map<string, CacheEntry<any>>();
  
  static getInstance(): OptimizedDataService {
    if (!this.instance) {
      this.instance = new OptimizedDataService();
    }
    return this.instance;
  }

  // ============================================================================
  // OPTIMIZED CATEGORY OPERATIONS
  // ============================================================================

  async getCategoriesWithStatsOptimized(): Promise<CategoryWithStats[]> {
    const startTime = performance.now();
    const cacheKey = 'categories_optimized_v2';
    
    try {
      // Check cache first
      const cached = this.getFromCache<CategoryWithStats[]>(cacheKey);
      if (cached) {
        this.trackDatabaseQuery(
          'getCategoriesWithStats', 
          performance.now() - startTime, 
          true,
          cached.length
        );
        return cached;
      }

      console.log('🏛️ Fetching optimized categories with stats...');

      // Get categories first with covering index
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description, emoji, display_order, is_active')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      if (!categories || categories.length === 0) {
        return [];
      }

      // Batch get statistics for all categories using RPC
      const categoryIds = categories.map(c => c.id);
      const { data: stats, error: statsError } = await supabase
        .rpc('get_category_stats_batch', { category_ids: categoryIds });

      if (statsError) {
        console.warn('Stats RPC failed, falling back to individual queries:', statsError);
        // Fallback to individual queries if RPC fails
        return this.getCategoriesWithStatsFallback(categories);
      }

        // Combine data efficiently
  const categoriesWithStats = categories.map(category => {
    const stat = stats?.find((s: any) => s.category_id === category.id);
    return {
      ...category,
      topic_count: stat?.topic_count || 0,
      question_count: stat?.question_count || 0,
      active_topics: stat?.active_topics || 0,
      avg_difficulty: stat?.avg_difficulty || 1.0,
    };
  });

      // Cache with 10 minute TTL
      this.setInCache(cacheKey, categoriesWithStats, 10 * 60 * 1000);
      
      this.trackDatabaseQuery(
        'getCategoriesWithStats', 
        performance.now() - startTime, 
        false,
        categoriesWithStats.length
      );

      console.log(`✅ Loaded ${categoriesWithStats.length} categories with stats`);
      return categoriesWithStats;

    } catch (error) {
      this.trackDatabaseQuery(
        'getCategoriesWithStats', 
        performance.now() - startTime, 
        false,
        0
      );
      console.error('Error loading categories with stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPTIMIZED TOPIC OPERATIONS
  // ============================================================================

  async getTopicsWithStatsPaginated(
    categoryId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ topics: TopicWithStats[]; hasMore: boolean; total: number }> {
    const startTime = performance.now();
    const cacheKey = `topics_paginated_v2_${categoryId || 'all'}_${limit}_${offset}`;
    
    try {
      // Check cache first
      const cached = this.getFromCache<{ topics: TopicWithStats[]; hasMore: boolean; total: number }>(cacheKey);
      if (cached) {
        this.trackDatabaseQuery(
          'getTopicsWithStats', 
          performance.now() - startTime, 
          true,
          cached.topics.length
        );
        return cached;
      }

      console.log(`📚 Fetching optimized topics with stats (category: ${categoryId || 'all'}, limit: ${limit}, offset: ${offset})...`);

      // Use RPC function for optimized query
      const { data: topics, error } = await supabase
        .rpc('get_topics_with_stats_batch', {
          p_category_id: categoryId || null,
          p_limit: limit + 1, // Get one extra to check hasMore
          p_offset: offset
        });

      if (error) throw error;

      const hasMore = topics && topics.length > limit;
      const resultTopics = topics ? topics.slice(0, limit) : [];
      
      // Get total count for pagination UI (cached separately)
      let total = 0;
      const totalCacheKey = `topics_total_${categoryId || 'all'}`;
      const cachedTotal = this.getFromCache<number>(totalCacheKey);
      
      if (cachedTotal !== null) {
        total = cachedTotal;
      } else {
        // Only query total on first page
        if (offset === 0) {
          const { count } = await supabase
            .from('question_topics')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .then(result => {
              if (categoryId && !result.error) {
                return supabase
                  .from('question_topics')
                  .select('*', { count: 'exact', head: true })
                  .eq('is_active', true)
                  .contains('categories', JSON.stringify([categoryId]));
              }
              return result;
            });
          
          total = count || 0;
          this.setInCache(totalCacheKey, total, 30 * 60 * 1000); // 30 min cache for total
        }
      }

      const result = {
        topics: resultTopics,
        hasMore,
        total
      };

      // Cache with 5 minute TTL
      this.setInCache(cacheKey, result, 5 * 60 * 1000);
      
      this.trackDatabaseQuery(
        'getTopicsWithStats', 
        performance.now() - startTime, 
        false,
        resultTopics.length
      );

      console.log(`✅ Loaded ${resultTopics.length} topics with stats (hasMore: ${hasMore})`);
      return result;

    } catch (error) {
      this.trackDatabaseQuery(
        'getTopicsWithStats', 
        performance.now() - startTime, 
        false,
        0
      );
      console.error('Error loading topics with stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPTIMIZED QUESTION OPERATIONS
  // ============================================================================

  async getQuestionsOptimized(
    topicIds: string[],
    limitPerTopic: number = 10,
    randomize: boolean = false
  ): Promise<QuestionWithOptions[]> {
    const startTime = performance.now();
    const cacheKey = `questions_batch_${topicIds.join(',')}_${limitPerTopic}_${randomize}`;
    
    try {
      // Check cache first
      const cached = this.getFromCache<QuestionWithOptions[]>(cacheKey);
      if (cached) {
        this.trackDatabaseQuery(
          'getQuestions', 
          performance.now() - startTime, 
          true,
          cached.length
        );
        return cached;
      }

      console.log(`❓ Fetching optimized questions for ${topicIds.length} topics...`);

      // Use RPC function for optimized batch query
      const { data: questions, error } = await supabase
        .rpc('get_questions_batch', {
          p_topic_ids: topicIds,
          p_limit_per_topic: limitPerTopic,
          p_randomize: randomize
        });

      if (error) throw error;

      // Transform to standard format
      const formattedQuestions: QuestionWithOptions[] = (questions || []).map((q: any) => ({
        topic_id: q.topic_id,
        question_id: q.question_id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level,
        sources: q.sources
      }));

      // Cache with 15 minute TTL (questions change less frequently)
      this.setInCache(cacheKey, formattedQuestions, 15 * 60 * 1000);
      
      this.trackDatabaseQuery(
        'getQuestions', 
        performance.now() - startTime, 
        false,
        formattedQuestions.length
      );

      console.log(`✅ Loaded ${formattedQuestions.length} questions for ${topicIds.length} topics`);
      return formattedQuestions;

    } catch (error) {
      this.trackDatabaseQuery(
        'getQuestions', 
        performance.now() - startTime, 
        false,
        0
      );
      console.error('Error loading questions:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPTIMIZED USER PROGRESS OPERATIONS
  // ============================================================================

  async getUserProgressOptimized(userId: string): Promise<UserProgressSummary> {
    const startTime = performance.now();
    const cacheKey = `user_progress_v2_${userId}`;
    
    try {
      // Check cache first
      const cached = this.getFromCache<UserProgressSummary>(cacheKey);
      if (cached) {
        this.trackDatabaseQuery(
          'getUserProgress', 
          performance.now() - startTime, 
          true,
          1
        );
        return cached;
      }

      console.log(`👤 Fetching optimized user progress for ${userId}...`);

      // Use RPC function for optimized query
      const { data, error } = await supabase
        .rpc('get_user_progress_summary', { p_user_id: userId });

      if (error) throw error;

      const progressSummary: UserProgressSummary = data?.[0] || {
        total_quizzes: 0,
        avg_score: 0,
        total_time_minutes: 0,
        current_streak: 0,
        max_streak: 0,
        favorite_categories: [],
        recent_activity: [],
        performance_trend: []
      };

      // Cache with 2 minute TTL (shorter for user data)
      this.setInCache(cacheKey, progressSummary, 2 * 60 * 1000);
      
      this.trackDatabaseQuery(
        'getUserProgress', 
        performance.now() - startTime, 
        false,
        1
      );

      console.log(`✅ Loaded user progress: ${progressSummary.total_quizzes} quizzes, ${progressSummary.avg_score.toFixed(1)}% avg score`);
      return progressSummary;

    } catch (error) {
      this.trackDatabaseQuery(
        'getUserProgress', 
        performance.now() - startTime, 
        false,
        0
      );
      console.error('Error loading user progress:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRELOADING STRATEGIES
  // ============================================================================

  async preloadCriticalData(): Promise<void> {
    try {
      console.log('🚀 Preloading critical data...');
      
      // Start with categories (most critical)
      const categoriesPromise = this.getCategoriesWithStatsOptimized();
      
      // Preload first page of topics for top categories
      const categories = await categoriesPromise;
      if (categories.length > 0) {
        const topCategories = categories
          .sort((a, b) => b.topic_count - a.topic_count)
          .slice(0, 3);
        
        // Preload in background without blocking
        Promise.all(
          topCategories.map(category =>
            this.getTopicsWithStatsPaginated(category.id, 10, 0)
          )
        ).catch(error => {
          console.warn('Background preloading failed:', error);
        });
      }
      
      console.log('✅ Critical data preloading initiated');
    } catch (error) {
      console.warn('⚠️ Preloading failed, continuing without cache:', error);
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  private trackDatabaseQuery(
    operation: string,
    duration: number,
    cacheHit: boolean,
    recordCount?: number
  ): void {
    // Alert on slow queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query: ${operation} took ${duration}ms`);
    }

    // Performance insights
    if (!cacheHit && duration > 500) {
      console.info(`💡 Consider indexing: ${operation} (${duration}ms, ${recordCount} records)`);
      
      // Specific recommendations
      if (operation.includes('Category') && duration > 300) {
        console.info(`📊 Category query optimization: Consider composite index on (is_active, display_order)`);
      }
      
      if (operation.includes('Topic') && duration > 400) {
        console.info(`📚 Topic query optimization: Consider GIN index on categories JSONB field`);
      }
    }

    // Development logging
    if (__DEV__) {
      console.log(`📊 ${operation}: ${duration.toFixed(1)}ms ${cacheHit ? '(cached)' : '(db)'} ${recordCount ? `${recordCount} records` : ''}`);
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setInCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup old entries periodically
    if (this.cache.size > 100) {
      this.cleanupExpiredCache();
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Fallback method for category stats
  private async getCategoriesWithStatsFallback(categories: any[]): Promise<CategoryWithStats[]> {
    console.log('📊 Using fallback method for category stats...');
    
    return Promise.all(
      categories.map(async (category) => {
        try {
          // Get basic topic count
          const { count: topicCount } = await supabase
            .from('question_topics')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .contains('categories', JSON.stringify([category.id]));

          return {
            ...category,
            topic_count: topicCount || 0,
            question_count: 0, // Skip expensive query in fallback
            active_topics: topicCount || 0,
            avg_difficulty: 1.0,
          };
        } catch (error) {
          console.warn(`Fallback stats failed for category ${category.id}:`, error);
          return {
            ...category,
            topic_count: 0,
            question_count: 0,
            active_topics: 0,
            avg_difficulty: 1.0,
          };
        }
      })
    );
  }

  // Clear cache methods
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Optimized data service cache cleared');
  }

  clearUserCache(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
    console.log(`🧹 User cache cleared for ${userId}`);
  }

  // Cache statistics
  getCacheStats() {
    const stats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: 0
    };

    // Rough memory usage calculation
    for (const [key, entry] of this.cache.entries()) {
      stats.memoryUsage += JSON.stringify({ key, entry }).length;
    }

    return stats;
  }
}

export const optimizedDataService = OptimizedDataService.getInstance(); 