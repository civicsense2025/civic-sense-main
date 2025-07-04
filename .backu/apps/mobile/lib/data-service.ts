/**
 * CivicSense Mobile Data Service
 * 
 * Standardized data access layer with consistent patterns for:
 * - Fetching (with caching and error handling)
 * - Posting (with validation and retries) 
 * - Real-time subscriptions
 * - Type safety and error recovery
 * 
 * This consolidates all the scattered database operations into 
 * predictable, testable patterns.
 */

import { supabase, type DbQuestion, type DbQuestionTopic, type DbCategory } from './supabase';
import { DB_TABLES, DB_COLUMNS } from './database-constants';
import { MOBILE_CONSTANTS, GAME_SETTINGS } from './mobile-constants';
import type { QuizGameMode, QuizGameMetadata } from './quiz-types';
import { contentCacheService } from './content-cache-service';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface DataServiceError {
  code: string;
  message: string;
  context?: any;
}

export interface QueryOptions {
  useCache?: boolean;
  cacheKey?: string;
  retries?: number;
  timeout?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

// Extended types that match successful patterns from HomeScreen
export interface CategoryWithStats extends DbCategory {
  topic_count: number;
  question_count: number;
  topics?: TopicWithStats[];
}

export interface TopicWithStats extends DbQuestionTopic {
  question_count: number;
  difficulty_avg: number;
  category?: DbCategory;
}

export interface QuestionWithTopic extends DbQuestion {
  topic?: DbQuestionTopic;
  category?: DbCategory;
}

// =============================================================================
// CORE DATA SERVICE CLASS
// =============================================================================

export class CivicSenseDataService {
  private static instance: CivicSenseDataService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CivicSenseDataService {
    if (!CivicSenseDataService.instance) {
      CivicSenseDataService.instance = new CivicSenseDataService();
    }
    return CivicSenseDataService.instance;
  }

  // =============================================================================
  // CATEGORY OPERATIONS
  // =============================================================================

  async getCategories(options: QueryOptions = {}): Promise<CategoryWithStats[]> {
    const cacheKey = 'categories_with_stats';
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache<CategoryWithStats[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log('🏛️ Fetching categories with statistics...');

      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
        .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

      if (categoriesError) {
        throw this.createError('CATEGORIES_FETCH_ERROR', categoriesError.message, { categoriesError });
      }

      if (!categories || categories.length === 0) {
        return [];
      }

      // Enrich with statistics
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const stats = await this.getCategoryStats(category.id);
          return {
            ...category,
            ...stats
          };
        })
      );

      // Cache results
      this.setCache(cacheKey, categoriesWithStats);
      return categoriesWithStats;

    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId: string, options: QueryOptions = {}): Promise<CategoryWithStats | null> {
    const cacheKey = `category_${categoryId}`;
    
    if (options.useCache !== false) {
      const cached = this.getFromCache<CategoryWithStats>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.ID, categoryId)
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw this.createError('CATEGORY_FETCH_ERROR', error.message, { categoryId, error });
      }

      const stats = await this.getCategoryStats(categoryId);
      const result = { ...data, ...stats };
      
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      throw error;
    }
  }

  private async getCategoryStats(categoryId: string): Promise<{ topic_count: number; question_count: number }> {
    try {
      // Get topic count for this category
      const { count: topicCount } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('*', { count: 'exact', head: true })
        .contains('categories', JSON.stringify([categoryId]))
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

      // Get question count for this category (through topics)
      const { data: topicsInCategory } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('topic_id')
        .contains('categories', JSON.stringify([categoryId]))
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true);

      let questionCount = 0;
      if (topicsInCategory && topicsInCategory.length > 0) {
        const topicIds = topicsInCategory.map(t => t.topic_id);
        const { count } = await supabase
          .from(DB_TABLES.QUESTIONS)
          .select('*', { count: 'exact', head: true })
          .in(DB_COLUMNS.QUESTIONS.TOPIC_ID, topicIds)
          .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);
        
        questionCount = count || 0;
      }

      return {
        topic_count: topicCount || 0,
        question_count: questionCount
      };

    } catch (error) {
      console.warn(`Error getting stats for category ${categoryId}:`, error);
      return { topic_count: 0, question_count: 0 };
    }
  }

  // =============================================================================
  // TOPIC OPERATIONS
  // =============================================================================

  async getTopics(categoryId?: string, options: QueryOptions = {}): Promise<TopicWithStats[]> {
    const cacheKey = categoryId ? `topics_category_${categoryId}` : 'topics_all';
    
    if (options.useCache !== false) {
      const cached = this.getFromCache<TopicWithStats[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log(`📚 Fetching topics${categoryId ? ` for category ${categoryId}` : ''}...`);

      // Build query
      let query = supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select(`
          *,
          topic_id,
          topic_title,
          description,
          categories,
          difficulty_level,
          is_active,
          created_at,
          updated_at
        `)
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
        .not('date', 'is', null) // Only include topics with valid dates
        .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE);

      // Filter by category if provided
      if (categoryId) {
        query = query.contains('categories', JSON.stringify([categoryId]));
      }

      const { data: topics, error } = await query;

      if (error) {
        throw this.createError('TOPICS_FETCH_ERROR', error.message, { categoryId, error });
      }

      if (!topics || topics.length === 0) {
        return [];
      }

      // Enrich with statistics and category info
      const topicsWithStats = await Promise.all(
        topics.map(async (topic) => {
          const [questionCount, category] = await Promise.all([
            this.getTopicQuestionCount(topic.topic_id),
            this.getTopicPrimaryCategory(topic)
          ]);

          return {
            ...topic,
            id: topic.topic_id, // Ensure consistent ID field
            title: topic.topic_title, // Ensure consistent title field
            question_count: questionCount,
            difficulty_avg: topic.difficulty_level || 1,
            category
          };
        })
      );

      this.setCache(cacheKey, topicsWithStats);
      return topicsWithStats;

    } catch (error) {
      console.error(`Error in getTopics for category ${categoryId}:`, error);
      throw error;
    }
  }

  async getTopicById(topicId: string, options: QueryOptions = {}): Promise<TopicWithStats | null> {
    const cacheKey = `topic_${topicId}`;
    
    if (options.useCache !== false) {
      const cached = this.getFromCache<TopicWithStats>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('*')
        .eq(DB_COLUMNS.QUESTION_TOPICS.TOPIC_ID, topicId)
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw this.createError('TOPIC_FETCH_ERROR', error.message, { topicId, error });
      }

      const [questionCount, category] = await Promise.all([
        this.getTopicQuestionCount(topicId),
        this.getTopicPrimaryCategory(data)
      ]);

      const result = {
        ...data,
        id: data.topic_id,
        title: data.topic_title,
        question_count: questionCount,
        difficulty_avg: data.difficulty_level || 1,
        category
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error(`Error fetching topic ${topicId}:`, error);
      throw error;
    }
  }

  private async getTopicQuestionCount(topicId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(DB_TABLES.QUESTIONS)
        .select('*', { count: 'exact', head: true })
        .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topicId)
        .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

      if (error) {
        console.warn(`Error counting questions for topic ${topicId}:`, error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn(`Error in getTopicQuestionCount for ${topicId}:`, error);
      return 0;
    }
  }

  private async getTopicPrimaryCategory(topic: any): Promise<DbCategory | undefined> {
    try {
      if (!topic.categories || !Array.isArray(topic.categories) || topic.categories.length === 0) {
        return undefined;
      }

      const primaryCategoryId = topic.categories[0];
      const { data, error } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.ID, primaryCategoryId)
        .single();

      if (error) {
        console.warn(`Error fetching primary category ${primaryCategoryId}:`, error);
        return undefined;
      }

      return data;
    } catch (error) {
      console.warn('Error in getTopicPrimaryCategory:', error);
      return undefined;
    }
  }

  // =============================================================================
  // QUESTION OPERATIONS  
  // =============================================================================

  async getQuestions(
    topicId: string, 
    options: { 
      limit?: number; 
      randomize?: boolean; 
      includeMetadata?: boolean;
    } & QueryOptions = {}
  ): Promise<QuestionWithTopic[]> {
    
    const { 
      limit = GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
      randomize = false,
      includeMetadata = false
    } = options;

    const cacheKey = `questions_${topicId}_${limit}_${randomize}_${includeMetadata}`;
    
    if (options.useCache !== false) {
      const cached = this.getFromCache<QuestionWithTopic[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log(`❓ Fetching questions for topic ${topicId} (limit: ${limit}, randomize: ${randomize})`);

      // Build base query
      let query = supabase
        .from(DB_TABLES.QUESTIONS)
        .select(`
          *,
          ${includeMetadata ? `source_links:${DB_TABLES.QUESTION_SOURCE_LINKS}(*)` : ''}
        `)
        .eq(DB_COLUMNS.QUESTIONS.TOPIC_ID, topicId)
        .eq(DB_COLUMNS.QUESTIONS.IS_ACTIVE, true);

      // Apply ordering and limits
      if (randomize) {
        query = query.order('RANDOM()').limit(limit);
      } else {
        query = query
          .order(DB_COLUMNS.QUESTIONS.DIFFICULTY_LEVEL, { ascending: true })
          .order('id', { ascending: true })
          .limit(limit);
      }

      const { data: questions, error } = await query;

      if (error) {
        throw this.createError('QUESTIONS_FETCH_ERROR', error.message, { topicId, error });
      }

      if (!questions || questions.length === 0) {
        console.warn(`No questions found for topic ${topicId}`);
        return [];
      }

      // Enrich with topic and category info if needed
      let enrichedQuestions = questions;
      if (includeMetadata) {
        const topic = await this.getTopicById(topicId);
        enrichedQuestions = questions.map(question => ({
          ...question,
          topic,
          category: topic?.category
        }));
      }

      console.log(`✅ Found ${enrichedQuestions.length} questions for topic ${topicId}`);
      
      // Cache for shorter time since questions change less frequently
      this.setCache(cacheKey, enrichedQuestions, this.DEFAULT_CACHE_TTL * 2);
      return enrichedQuestions;

    } catch (error) {
      console.error(`Error in getQuestions for topic ${topicId}:`, error);
      throw error;
    }
  }

  async getRandomQuestions(
    topicId: string, 
    count: number = 10, 
    options: QueryOptions = {}
  ): Promise<QuestionWithTopic[]> {
    return this.getQuestions(topicId, { 
      limit: count, 
      randomize: true, 
      ...options 
    });
  }

  // =============================================================================
  // GAME SESSION OPERATIONS
  // =============================================================================

  async createGameSession(
    userId: string,
    topicId: string,
    gameMode: QuizGameMode = 'practice',
    metadata: QuizGameMetadata = {}
  ) {
    try {
      console.log(`🎮 Creating game session: ${gameMode} for topic ${topicId}`);

      const sessionData = {
        user_id: userId,
        topic_id: topicId,
        total_questions: metadata.question_count || GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
        started_at: new Date().toISOString(),
        game_mode: gameMode,
        game_metadata: metadata,
      };

      const { data, error } = await supabase
        .from(DB_TABLES.USER_QUIZ_ATTEMPTS)
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw this.createError('SESSION_CREATE_ERROR', error.message, { sessionData, error });
      }

      console.log(`✅ Created game session: ${data.id}`);
      return data;

    } catch (error) {
      console.error('Error in createGameSession:', error);
      throw error;
    }
  }

  async saveQuestionResponse(
    sessionId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    metadata: any = {}
  ) {
    try {
      const responseData = {
        session_id: sessionId,
        question_id: questionId,
        user_answer: answer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
        response_metadata: metadata,
      };

      const { data, error } = await supabase
        .from(DB_TABLES.USER_QUIZ_RESPONSES)
        .insert(responseData)
        .select()
        .single();

      if (error) {
        throw this.createError('RESPONSE_SAVE_ERROR', error.message, { responseData, error });
      }

      return data;

    } catch (error) {
      console.error('Error in saveQuestionResponse:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER PROGRESS OPERATIONS
  // =============================================================================

  async getUserProgress(userId: string, options: QueryOptions = {}) {
    const cacheKey = `user_progress_${userId}`;
    
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.USER_QUIZ_ATTEMPTS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw this.createError('USER_PROGRESS_ERROR', error.message, { userId, error });
      }

      this.setCache(cacheKey, data || [], this.DEFAULT_CACHE_TTL / 2); // Shorter cache for user data
      return data || [];

    } catch (error) {
      console.error(`Error fetching user progress for ${userId}:`, error);
      throw error;
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  private createError(code: string, message: string, context?: any): DataServiceError {
    return {
      code,
      message,
      context
    };
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

// Export singleton instance
export const dataService = CivicSenseDataService.getInstance();

// Export commonly used functions for backward compatibility
export const getCategories = () => dataService.getCategories();
export const getTopics = (categoryId?: string) => dataService.getTopics(categoryId);
export const getQuestions = (topicId: string, limit?: number, randomize?: boolean) => 
  dataService.getQuestions(topicId, { limit, randomize });
export const createGameSession = (userId: string, topicId: string, gameMode?: QuizGameMode, metadata?: QuizGameMetadata) =>
  dataService.createGameSession(userId, topicId, gameMode, metadata);
export const getUserProgress = (userId: string) => dataService.getUserProgress(userId);

// Backward compatibility aliases
export const getCategoriesWithTopics = getCategories;
export const getQuestionsFromDeck = getQuestions;
export const getQuestionTopics = getTopics;

export async function fetchCategoriesWithTopics(): Promise<CategoryWithTopics[]> {
  console.log('🗂️ Fetching categories with topics...');
  
  try {
    // Use the content cache service for better performance
    const categories = await contentCacheService.getAllCategories();
    
    const categoriesWithTopics: CategoryWithTopics[] = await Promise.all(
      categories.map(async (category) => {
        const topics = await contentCacheService.getTopicsForCategory(category.id);
        
        return {
          id: category.id,
          name: category.name,
          emoji: category.emoji || '📚',
          description: category.description || '',
          is_active: category.is_active,
          display_order: category.display_order,
          topics: topics.map(topic => ({
            topic_id: topic.topic_id,
            topic_title: topic.topic_title,
            description: topic.description || '',
            categories: topic.categories,
            is_active: topic.is_active,
            question_count: topic.question_count || 0
          }))
        };
      })
    );

    console.log(`✅ Loaded ${categoriesWithTopics.length} categories with topics from cache`);
    return categoriesWithTopics;
  } catch (error) {
    console.error('❌ Failed to fetch categories with topics:', error);
    return [];
  }
}

export async function fetchQuestionsForTopic(topicId: string): Promise<DbQuestion[]> {
  console.log(`❓ Fetching questions for topic: ${topicId}`);

  try {
    // Use the content cache service for better performance
    const questions = await contentCacheService.getQuestionsForTopic(topicId);
    
    // Convert from StandardQuestion to DbQuestion format
    const dbQuestions: DbQuestion[] = questions.map(q => ({
      id: q.id,
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1], 
      option_c: q.options[2],
      option_d: q.options[3],
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      topic_id: q.topic_id,
      difficulty_level: q.difficulty_level,
      is_active: q.is_active,
      sources: q.sources || null,
      question_number: q.question_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`✅ Loaded ${dbQuestions.length} questions for topic ${topicId} from cache`);
    return dbQuestions;
  } catch (error) {
    console.error(`❌ Failed to fetch questions for topic ${topicId}:`, error);
    return [];
  }
} 