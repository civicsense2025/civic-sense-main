import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  StandardTopic, 
  StandardQuestion, 
  StandardCategory,
  StandardizedDataService 
} from './standardized-data-service';

// Cache configuration for content
const CONTENT_CACHE_CONFIG = {
  // Cache content for 24 hours
  TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  VERSION: '1.0.0',
} as const;

// Cache keys
const CACHE_KEYS = {
  ALL_TOPICS: 'content_cache_all_topics',
  ALL_QUESTIONS: 'content_cache_all_questions',
  ALL_CATEGORIES: 'content_cache_all_categories',
  TOPICS_BY_CATEGORY_PREFIX: 'content_cache_topics_category_',
  QUESTIONS_BY_TOPIC_PREFIX: 'content_cache_questions_topic_',
  CACHE_METADATA: 'content_cache_metadata',
};

interface ContentCacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface ContentCacheMetadata {
  lastFullSync: number;
  totalTopics: number;
  totalQuestions: number;
  totalCategories: number;
  version: string;
}

export class ContentCacheService {
  private static instance: ContentCacheService;
  private memoryCache = new Map<string, ContentCacheEntry<any>>();
  private dataService: StandardizedDataService;
  private initialized = false;

  constructor() {
    // Don't initialize dataService immediately - wait for Supabase
    this.dataService = StandardizedDataService.getInstance();
  }

  static getInstance(): ContentCacheService {
    if (!this.instance) {
      this.instance = new ContentCacheService();
    }
    return this.instance;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      // Ensure Supabase is ready before using dataService
      const { ensureSupabaseInitialized } = await import('./supabase');
      await ensureSupabaseInitialized();
      this.initialized = true;
    }
  }

  // ============================================================================
  // CORE CACHE OPERATIONS
  // ============================================================================

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        return memoryEntry.data;
      }

      // Check persistent storage
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: ContentCacheEntry<T> = JSON.parse(cached);
      
      // Validate cache entry
      if (!this.isValidEntry(entry)) {
        await this.removeFromCache(key);
        return null;
      }

      // Store in memory cache for faster access
      this.memoryCache.set(key, entry);
      return entry.data;
    } catch (error) {
      console.warn(`ContentCache get error for key ${key}:`, error);
      return null;
    }
  }

  private async setInCache<T>(key: string, data: T): Promise<void> {
    try {
      const entry: ContentCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CONTENT_CACHE_CONFIG.VERSION,
      };

      // Store in both memory and persistent storage
      this.memoryCache.set(key, entry);
      
      try {
        await AsyncStorage.setItem(key, JSON.stringify(entry));
      } catch (storageError: any) {
        // Handle quota exceeded errors gracefully
        if (storageError.name === 'QuotaExceededError' || 
            storageError.message?.includes('quota') || 
            storageError.message?.includes('storage')) {
          console.warn(`💾 Storage quota exceeded for key ${key}, keeping in memory only`);
          
          // Try to free up some space by clearing old entries
          await this.clearOldEntries();
          
          // Try one more time with reduced data
          try {
            // For large datasets, try storing a smaller portion
            if (Array.isArray(data) && data.length > 10) {
              const reducedData = data.slice(0, Math.min(10, data.length));
              const reducedEntry: ContentCacheEntry<T> = {
                data: reducedData as T,
                timestamp: Date.now(),
                version: CONTENT_CACHE_CONFIG.VERSION,
              };
              await AsyncStorage.setItem(key + '_reduced', JSON.stringify(reducedEntry));
              console.log(`💾 Stored reduced dataset for ${key} (${reducedData.length} items)`);
            }
          } catch (retryError) {
            console.warn(`💾 Even reduced storage failed for ${key}:`, retryError);
          }
        } else {
          console.error(`ContentCache set error for key ${key}:`, storageError);
        }
      }
    } catch (error) {
      console.error(`ContentCache set error for key ${key}:`, error);
      // Don't throw - allow app to continue
    }
  }

  private async removeFromCache(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`ContentCache delete error for key ${key}:`, error);
    }
  }

  private isValidEntry<T>(entry: ContentCacheEntry<T>): boolean {
    if (!entry || !entry.timestamp || !entry.version) return false;
    
    // Check version compatibility
    if (entry.version !== CONTENT_CACHE_CONFIG.VERSION) return false;
    
    // Check TTL
    const age = Date.now() - entry.timestamp;
    return age < CONTENT_CACHE_CONFIG.TTL;
  }

  // ============================================================================
  // CONTENT PREFETCHING AND CACHING
  // ============================================================================

  async initializeContentCache(): Promise<void> {
    if (__DEV__) console.log('[CACHE] Initializing content cache with lazy loading...');
    
    try {
      await this.ensureInitialized();
      console.log('[CACHE] ✅ Supabase client ready for content cache operations');
      
      // Only load categories initially - much lighter operation
      const needsCategorySync = await this.needsCategorySync();
      
      if (needsCategorySync) {
        if (__DEV__) console.log('[CACHE] Loading categories with topic counts...');
        await this.loadCategoriesWithCounts();
      } else {
        if (__DEV__) console.log('[CACHE] Categories cache is up to date');
        await this.logCacheStats();
      }
      
      if (__DEV__) console.log('[CACHE] Content cache initialized with lazy loading strategy');
    } catch (error) {
      console.error('[CACHE] Failed to initialize content cache:', error);
      
      // Try to continue with minimal functionality rather than blocking the app
      try {
        if (__DEV__) console.log('[CACHE] Attempting graceful fallback...');
        
        // Just log stats if possible
        const stats = await this.getCacheStats();
        if (stats.isInitialized) {
          if (__DEV__) console.log('[CACHE] Using existing cache data');
          await this.logCacheStats();
        } else {
          if (__DEV__) console.log('[CACHE] Starting with empty cache - data will load on demand');
        }
      } catch (fallbackError) {
        console.warn('⚠️ Even fallback failed, continuing without cache:', fallbackError);
      }
      
      // Don't throw - app should work without cache
    }
  }

  // ============================================================================
  // LAZY LOADING METHODS
  // ============================================================================

  private async loadCategoriesWithCounts(): Promise<void> {
    await this.ensureInitialized();
    
    console.log('📊 Loading categories with topic counts (lazy strategy)...');
    
    try {
      // Fetch categories with topic counts but not the actual topics
      const categoriesResponse = await this.dataService.fetchCategories({ useCache: false });
      
      if (categoriesResponse.error) {
        console.error('Failed to load categories:', categoriesResponse.error);
        return;
      }

      const categories = categoriesResponse.data || [];
      console.log(`✅ Loaded ${categories.length} categories`);
      
      // Cache categories
      await this.cacheAllCategories(categories);
      
      // Update metadata with lighter data
      await this.updateCacheMetadata({
        lastFullSync: Date.now(),
        totalCategories: categories.length,
        totalTopics: 0, // We'll update this as topics are loaded
        totalQuestions: 0, // We'll update this as questions are loaded
        version: CONTENT_CACHE_CONFIG.VERSION,
      });

      await this.logCacheStats();
    } catch (error) {
      console.error('❌ Failed to load categories with counts:', error);
      throw error;
    }
  }

  // Load topics for a specific category (on-demand)
  async loadTopicsForCategory(categoryId: string, forceRefresh: boolean = false): Promise<StandardTopic[]> {
    await this.ensureInitialized();
    
    const cacheKey = `${CACHE_KEYS.TOPICS_BY_CATEGORY_PREFIX}${categoryId}`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.getFromCache<StandardTopic[]>(cacheKey);
      if (cached) {
        console.log(`💾 Retrieved ${cached.length} topics for category ${categoryId} from cache`);
        return cached;
      }
    }

    console.log(`📥 Loading topics for category ${categoryId} from network...`);
    
    try {
      const response = await this.dataService.fetchTopics(categoryId, { useCache: false });
      
      if (response.error) {
        console.error(`Failed to load topics for category ${categoryId}:`, response.error);
        return [];
      }

      const topics = response.data || [];
      console.log(`✅ Loaded ${topics.length} topics for category ${categoryId}`);
      
      // Cache these topics
      await this.setInCache(cacheKey, topics);
      
      return topics;
    } catch (error) {
      console.error(`❌ Failed to load topics for category ${categoryId}:`, error);
      return [];
    }
  }

  // Load questions for a specific topic (on-demand)
  async loadQuestionsForTopic(topicId: string, limit: number = 50, forceRefresh: boolean = false): Promise<StandardQuestion[]> {
    await this.ensureInitialized();
    
    const cacheKey = `${CACHE_KEYS.QUESTIONS_BY_TOPIC_PREFIX}${topicId}`;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.getFromCache<StandardQuestion[]>(cacheKey);
      if (cached) {
        console.log(`💾 Retrieved ${cached.length} questions for topic ${topicId} from cache`);
        return cached;
      }
    }

    console.log(`📥 Loading questions for topic ${topicId} from network...`);
    
    try {
      const response = await this.dataService.fetchQuestions(topicId, { 
        limit,
        useCache: false 
      });
      
      if (response.error) {
        console.error(`Failed to load questions for topic ${topicId}:`, response.error);
        return [];
      }

      const questions = response.data || [];
      console.log(`✅ Loaded ${questions.length} questions for topic ${topicId}`);
      
      // Cache these questions
      await this.setInCache(cacheKey, questions);
      
      return questions;
    } catch (error) {
      console.error(`❌ Failed to load questions for topic ${topicId}:`, error);
      return [];
    }
  }

  // ============================================================================
  // UPDATED CACHE CHECKING
  // ============================================================================

  private async needsCategorySync(): Promise<boolean> {
    const metadata = await this.getCacheMetadata();
    if (!metadata) {
      console.log('📋 No cache metadata found - category sync needed');
      return true;
    }

    const hoursSinceSync = (Date.now() - metadata.lastFullSync) / (1000 * 60 * 60);
    const needsSync = hoursSinceSync >= 6; // Sync categories every 6 hours (lighter)
    
    console.log(`📋 Last category sync: ${hoursSinceSync.toFixed(1)} hours ago - ${needsSync ? 'sync needed' : 'up to date'}`);
    return needsSync;
  }

  // ============================================================================
  // REMOVE HEAVY SYNC METHODS (keeping for compatibility but making them lighter)
  // ============================================================================

  private async performFullSync(): Promise<void> {
    console.log('⚠️  performFullSync called - switching to lazy loading strategy');
    await this.loadCategoriesWithCounts();
  }

  private async cacheAllCategories(categories: StandardCategory[]): Promise<void> {
    console.log(`📦 Caching ${categories.length} categories`);
    await this.setInCache(CACHE_KEYS.ALL_CATEGORIES, categories);
  }

  private async cacheAllTopics(topics: StandardTopic[]): Promise<void> {
    console.log(`⚠️  cacheAllTopics called with ${topics.length} topics - this is now handled lazily per category`);
    // Don't cache all topics at once anymore - too heavy
    // Instead, we'll cache them per category when requested
  }

  private async cacheAllQuestions(questions: StandardQuestion[]): Promise<void> {
    console.log(`⚠️  cacheAllQuestions called with ${questions.length} questions - this is now handled lazily per topic`);
    // Don't cache all questions at once anymore - too heavy
    // Instead, we'll cache them per topic when requested
  }

  // ============================================================================
  // UPDATED PUBLIC API FOR LAZY LOADING
  // ============================================================================

  async getAllCategories(): Promise<StandardCategory[]> {
    await this.ensureInitialized();
    
    const cached = await this.getFromCache<StandardCategory[]>(CACHE_KEYS.ALL_CATEGORIES);
    if (cached) {
      console.log(`💾 Retrieved ${cached.length} categories from cache`);
      return cached;
    }

    console.log('🌐 Fetching categories from network (cache miss)');
    const response = await this.dataService.fetchCategories();
    if (response.data) {
      await this.cacheAllCategories(response.data);
    }
    return response.data || [];
  }

  async getAllTopics(): Promise<StandardTopic[]> {
    console.log('⚠️  getAllTopics called - this is not recommended with lazy loading. Use getTopicsForCategory instead.');
    
    // For now, just return empty array and suggest using category-specific loading
    console.log('💡 Suggestion: Use loadTopicsForCategory(categoryId) for better performance');
    return [];
  }

  async getTopicsForCategory(categoryId: string): Promise<StandardTopic[]> {
    return this.loadTopicsForCategory(categoryId);
  }

  async getAllQuestions(): Promise<StandardQuestion[]> {
    console.log('⚠️  getAllQuestions called - this is not recommended with lazy loading. Use getQuestionsForTopic instead.');
    
    // For now, just return empty array and suggest using topic-specific loading
    console.log('💡 Suggestion: Use loadQuestionsForTopic(topicId) for better performance');
    return [];
  }

  async getQuestionsForTopic(topicId: string): Promise<StandardQuestion[]> {
    return this.loadQuestionsForTopic(topicId);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private async getCacheMetadata(): Promise<ContentCacheMetadata | null> {
    return this.getFromCache<ContentCacheMetadata>(CACHE_KEYS.CACHE_METADATA);
  }

  private async updateCacheMetadata(metadata: ContentCacheMetadata): Promise<void> {
    await this.setInCache(CACHE_KEYS.CACHE_METADATA, metadata);
  }

  private async needsFullSync(): Promise<boolean> {
    const metadata = await this.getCacheMetadata();
    if (!metadata) {
      console.log('📋 No cache metadata found - full sync needed');
      return true;
    }

    const hoursSinceSync = (Date.now() - metadata.lastFullSync) / (1000 * 60 * 60);
    const needsSync = hoursSinceSync >= 24; // Sync once per day
    
    console.log(`📋 Last sync: ${hoursSinceSync.toFixed(1)} hours ago - ${needsSync ? 'sync needed' : 'up to date'}`);
    return needsSync;
  }

  async getCacheStats(): Promise<{
    totalTopics: number;
    totalQuestions: number;
    totalCategories: number;
    lastSync: number;
    memorySize: number;
    isInitialized: boolean;
  }> {
    const metadata = await this.getCacheMetadata();
    
    return {
      totalTopics: metadata?.totalTopics || 0,
      totalQuestions: metadata?.totalQuestions || 0,
      totalCategories: metadata?.totalCategories || 0,
      lastSync: metadata?.lastFullSync || 0,
      memorySize: this.memoryCache.size,
      isInitialized: !!metadata,
    };
  }

  private async logCacheStats(): Promise<void> {
    const stats = await this.getCacheStats();
    console.log('📊 Cache Stats:', {
      categories: stats.totalCategories,
      topics: stats.totalTopics,
      questions: stats.totalQuestions,
      memory: stats.memorySize,
      lastSync: new Date(stats.lastSync).toLocaleString(),
    });
  }

  async clearContentCache(): Promise<void> {
    console.log('🗑️ Clearing content cache');
    
    const keysToDelete = [
      CACHE_KEYS.ALL_TOPICS,
      CACHE_KEYS.ALL_QUESTIONS,
      CACHE_KEYS.ALL_CATEGORIES,
      CACHE_KEYS.CACHE_METADATA,
    ];

    // Also clear category and topic specific caches
    const allKeys = await AsyncStorage.getAllKeys();
    const dynamicKeys = allKeys.filter(key => 
      key.startsWith(CACHE_KEYS.TOPICS_BY_CATEGORY_PREFIX) ||
      key.startsWith(CACHE_KEYS.QUESTIONS_BY_TOPIC_PREFIX)
    );

    keysToDelete.push(...dynamicKeys);

    await Promise.all([
      ...keysToDelete.map(key => this.removeFromCache(key)),
      // Clear memory cache
      Promise.resolve(this.memoryCache.clear()),
    ]);

    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries`);
  }

  // ============================================================================
  // BACKGROUND SYNC
  // ============================================================================

  async performBackgroundSync(): Promise<void> {
    try {
      console.log('🔄 Performing background content sync...');
      const needsSync = await this.needsFullSync();
      
      if (needsSync) {
        await this.performFullSync();
      }
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error);
      // Don't throw - background sync failures shouldn't crash the app
    }
  }

  private async clearOldEntries(): Promise<void> {
    try {
      console.log('🧹 Attempting to clear old cache entries...');
      
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        key.startsWith('content_cache_') || 
        key.startsWith(CACHE_KEYS.TOPICS_BY_CATEGORY_PREFIX) ||
        key.startsWith(CACHE_KEYS.QUESTIONS_BY_TOPIC_PREFIX)
      );
      
      // Remove oldest entries (keep only recent ones)
      const keysToRemove = cacheKeys.slice(0, Math.floor(cacheKeys.length * 0.3)); // Remove 30% of cache
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🧹 Cleared ${keysToRemove.length} old cache entries`);
      }
    } catch (error) {
      console.warn('🧹 Failed to clear old entries:', error);
    }
  }
}

// Export singleton instance
export const contentCacheService = ContentCacheService.getInstance(); 