import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  StandardTopic, 
  StandardQuestion, 
  StandardCategory,
  StandardResponse 
} from './standardized-data-service';
import { 
  DbCategories,
  DbQuestionTopics, 
  DbQuestions 
} from './database-constants';

// Import types from Database type
type DbCategory = DbCategories;
type DbQuestionTopic = DbQuestionTopics;
type DbQuestion = DbQuestions;

// Enhanced cache configuration
const CACHE_CONFIG = {
  // Long-term cache for static content (24 hours)
  CONTENT_TTL: 24 * 60 * 60 * 1000, // 24 hours
  // Short-term cache for dynamic content (5 minutes)
  DYNAMIC_TTL: 5 * 60 * 1000, // 5 minutes
  // User-specific cache (30 minutes)
  USER_TTL: 30 * 60 * 1000, // 30 minutes
} as const;

// Cache keys for different data types
const CACHE_KEYS = {
  ALL_TOPICS: 'cached_all_topics',
  ALL_QUESTIONS: 'cached_all_questions', 
  ALL_CATEGORIES: 'cached_all_categories',
  TOPICS_BY_CATEGORY: 'cached_topics_by_category_',
  QUESTIONS_BY_TOPIC: 'cached_questions_by_topic_',
  USER_PROGRESS: 'cached_user_progress_',
  CACHE_MANIFEST: 'cache_manifest',
  LAST_FULL_SYNC: 'last_full_sync',
} as const;

type CacheKeyType = typeof CACHE_KEYS[keyof typeof CACHE_KEYS] | string;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

interface CacheManifest {
  lastFullSync: number;
  dataVersion: string;
  cachedKeys: string[];
  totalTopics: number;
  totalQuestions: number;
  totalCategories: number;
}

class EnhancedCacheService {
  private static instance: EnhancedCacheService;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly CURRENT_VERSION = '1.0.0';

  static getInstance(): EnhancedCacheService {
    if (!this.instance) {
      this.instance = new EnhancedCacheService();
    }
    return this.instance;
  }

  // ============================================================================
  // CORE CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry)) {
        return memoryEntry.data;
      }

      // Check persistent storage
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Validate cache entry
      if (!this.isValid(entry)) {
        await this.delete(key);
        return null;
      }

      // Store in memory cache for faster access
      this.memoryCache.set(key, entry);
      return entry.data;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl: number = CACHE_CONFIG.CONTENT_TTL
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.CURRENT_VERSION,
      };

      // Store in both memory and persistent storage
      this.memoryCache.set(key, entry);
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  private isValid<T>(entry: CacheEntry<T>): boolean {
    if (!entry || !entry.timestamp || !entry.version) return false;
    
    // Check version compatibility
    if (entry.version !== this.CURRENT_VERSION) return false;
    
    // Check TTL
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  // ============================================================================
  // BULK DATA OPERATIONS
  // ============================================================================

  async storeAllTopics(topics: StandardTopic[]): Promise<void> {
    console.log(`📦 Caching ${topics.length} topics for 24 hours`);
    await this.set(CACHE_KEYS.ALL_TOPICS, topics, CACHE_CONFIG.CONTENT_TTL);
    
    // Also cache by category for faster filtered access
    const topicsByCategory = new Map<string, StandardTopic[]>();
    
    topics.forEach(topic => {
      topic.categories.forEach(categoryId => {
        if (!topicsByCategory.has(categoryId)) {
          topicsByCategory.set(categoryId, []);
        }
        topicsByCategory.get(categoryId)!.push(topic);
      });
    });

    // Store category-specific caches
    for (const [categoryId, categoryTopics] of topicsByCategory) {
      await this.set(
        `${CACHE_KEYS.TOPICS_BY_CATEGORY}${categoryId}`,
        categoryTopics,
        CACHE_CONFIG.CONTENT_TTL
      );
    }
  }

  async getAllTopics(): Promise<StandardTopic[] | null> {
    return this.get<StandardTopic[]>(CACHE_KEYS.ALL_TOPICS);
  }

  async getTopicsForCategory(categoryId: string): Promise<StandardTopic[] | null> {
    return this.get<StandardTopic[]>(`${CACHE_KEYS.TOPICS_BY_CATEGORY}${categoryId}`);
  }

  async storeAllQuestions(questions: StandardQuestion[]): Promise<void> {
    console.log(`📦 Caching ${questions.length} questions for 24 hours`);
    await this.set(CACHE_KEYS.ALL_QUESTIONS, questions, CACHE_CONFIG.CONTENT_TTL);
    
    // Also cache by topic for faster filtered access
    const questionsByTopic = new Map<string, StandardQuestion[]>();
    
    questions.forEach(question => {
      if (!questionsByTopic.has(question.topic_id)) {
        questionsByTopic.set(question.topic_id, []);
      }
      questionsByTopic.get(question.topic_id)!.push(question);
    });

    // Store topic-specific caches
    for (const [topicId, topicQuestions] of questionsByTopic) {
      await this.set(
        `${CACHE_KEYS.QUESTIONS_BY_TOPIC}${topicId}`,
        topicQuestions,
        CACHE_CONFIG.CONTENT_TTL
      );
    }
  }

  async getAllQuestions(): Promise<StandardQuestion[] | null> {
    return this.get<StandardQuestion[]>(CACHE_KEYS.ALL_QUESTIONS);
  }

  async getQuestionsForTopic(topicId: string): Promise<StandardQuestion[] | null> {
    return this.get<StandardQuestion[]>(`${CACHE_KEYS.QUESTIONS_BY_TOPIC}${topicId}`);
  }

  async storeAllCategories(categories: StandardCategory[]): Promise<void> {
    console.log(`📦 Caching ${categories.length} categories for 24 hours`);
    await this.set(CACHE_KEYS.ALL_CATEGORIES, categories, CACHE_CONFIG.CONTENT_TTL);
  }

  async getAllCategories(): Promise<StandardCategory[] | null> {
    return this.get<StandardCategory[]>(CACHE_KEYS.ALL_CATEGORIES);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async getCacheManifest(): Promise<CacheManifest | null> {
    return this.get<CacheManifest>(CACHE_KEYS.CACHE_MANIFEST);
  }

  async updateCacheManifest(manifest: Partial<CacheManifest>): Promise<void> {
    const existing = await this.getCacheManifest() || {
      lastFullSync: 0,
      dataVersion: this.CURRENT_VERSION,
      cachedKeys: [],
      totalTopics: 0,
      totalQuestions: 0,
      totalCategories: 0,
    };

    const updated: CacheManifest = { ...existing, ...manifest };
    await this.set(CACHE_KEYS.CACHE_MANIFEST, updated, CACHE_CONFIG.CONTENT_TTL);
  }

  async needsFullSync(): Promise<boolean> {
    const manifest = await this.getCacheManifest();
    if (!manifest) return true;

    const daysSinceSync = (Date.now() - manifest.lastFullSync) / (1000 * 60 * 60 * 24);
    return daysSinceSync >= 1; // Sync once per day
  }

  async getLastSyncTime(): Promise<number> {
    const manifest = await this.getCacheManifest();
    return manifest?.lastFullSync || 0;
  }

  async getCacheStats(): Promise<{
    totalTopics: number;
    totalQuestions: number;
    totalCategories: number;
    lastSync: number;
    cacheSize: number;
  }> {
    const manifest = await this.getCacheManifest();
    const topics = await this.getAllTopics();
    const questions = await this.getAllQuestions();
    const categories = await this.getAllCategories();

    return {
      totalTopics: topics?.length || 0,
      totalQuestions: questions?.length || 0,
      totalCategories: categories?.length || 0,
      lastSync: manifest?.lastFullSync || 0,
      cacheSize: this.memoryCache.size,
    };
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  async clearContentCache(): Promise<void> {
    console.log('🗑️ Clearing content cache');
    
    const keysToDelete = [
      CACHE_KEYS.ALL_TOPICS,
      CACHE_KEYS.ALL_QUESTIONS,
      CACHE_KEYS.ALL_CATEGORIES,
      CACHE_KEYS.CACHE_MANIFEST,
    ];

    // Also clear category and topic specific caches
    const allKeys = await AsyncStorage.getAllKeys();
    const dynamicKeys = allKeys.filter(key => 
      key.startsWith(CACHE_KEYS.TOPICS_BY_CATEGORY) ||
      key.startsWith(CACHE_KEYS.QUESTIONS_BY_TOPIC)
    );

    keysToDelete.push(...dynamicKeys);

    await Promise.all([
      ...keysToDelete.map(key => this.delete(key)),
      // Clear memory cache
      this.memoryCache.clear(),
    ]);
  }

  async clearExpiredCache(): Promise<void> {
    console.log('🧹 Cleaning expired cache entries');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const expiredKeys: string[] = [];

    for (const key of allKeys) {
      if (key.startsWith('cached_')) {
        const entry = await this.get(key);
        if (!entry) {
          expiredKeys.push(key);
        }
      }
    }

    if (expiredKeys.length > 0) {
      console.log(`🗑️ Removing ${expiredKeys.length} expired cache entries`);
      await AsyncStorage.multiRemove(expiredKeys);
    }
  }

  // ============================================================================
  // USER-SPECIFIC CACHE
  // ============================================================================

  async setUserProgress(userId: string, progress: any[]): Promise<void> {
    await this.set(
      `${CACHE_KEYS.USER_PROGRESS}${userId}`,
      progress,
      CACHE_CONFIG.USER_TTL
    );
  }

  async getUserProgress(userId: string): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.USER_PROGRESS}${userId}`);
  }

  async clearUserCache(userId: string): Promise<void> {
    await this.delete(`${CACHE_KEYS.USER_PROGRESS}${userId}`);
  }
}

// Legacy compatibility exports
export async function getCachedData<T>(
  key: string,
  maxAge: number
): Promise<T | null> {
  const cacheService = EnhancedCacheService.getInstance();
  return cacheService.get<T>(key);
}

export async function setCachedData<T>(
  key: string,
  data: T
): Promise<void> {
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.set(key, data);
}

export async function getCachedCategoriesWithTopics(): Promise<any[] | null> {
  const cacheService = EnhancedCacheService.getInstance();
  return cacheService.getAllCategories();
}

export async function setCachedCategoriesWithTopics(
  categories: any[]
): Promise<void> {
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.storeAllCategories(categories);
}

export async function getCachedTopicsForCategory(
  categoryId: string
): Promise<any[] | null> {
  const cacheService = EnhancedCacheService.getInstance();
  return cacheService.getTopicsForCategory(categoryId);
}

export async function setCachedTopicsForCategory(
  categoryId: string,
  topics: any[]
): Promise<void> {
  // This is handled automatically by storeAllTopics
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.set(
    `${CACHE_KEYS.TOPICS_BY_CATEGORY}${categoryId}`,
    topics
  );
}

export async function getCachedQuestionsForTopic(
  topicId: string
): Promise<any[] | null> {
  const cacheService = EnhancedCacheService.getInstance();
  return cacheService.getQuestionsForTopic(topicId);
}

export async function setCachedQuestionsForTopic(
  topicId: string,
  questions: any[]
): Promise<void> {
  // This is handled automatically by storeAllQuestions
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.set(
    `${CACHE_KEYS.QUESTIONS_BY_TOPIC}${topicId}`,
    questions
  );
}

export async function clearCache(): Promise<void> {
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.clearContentCache();
}

export async function clearExpiredCache(): Promise<void> {
  const cacheService = EnhancedCacheService.getInstance();
  await cacheService.clearExpiredCache();
}

// Export the enhanced cache service
export const cacheService = EnhancedCacheService.getInstance(); 