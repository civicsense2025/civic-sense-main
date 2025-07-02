/**
 * Standardized Data Service for CivicSense Mobile
 * 
 * This service establishes consistent patterns for all database operations:
 * 1. Fetch operations with predictable response shapes
 * 2. Standardized error handling and recovery
 * 3. Built-in caching with intelligent invalidation
 * 4. Consistent field mapping (resolves topic_title/title issues)
 * 5. Proper relationships between categories/topics/questions
 * 
 * Key Problems This Solves:
 * - Questions and question_topics relationship complexity
 * - Inconsistent field names across different functions
 * - Scattered database operations without consistent patterns
 * - No centralized error handling or retry logic
 */

import { ensureSupabaseInitialized, type DbQuestion, type DbQuestionTopic, type DbCategory } from './supabase';
import { DB_TABLES, DB_COLUMNS } from './database-constants';
import { MOBILE_CONSTANTS, GAME_SETTINGS } from './mobile-constants';
import type { QuizGameMode, QuizGameMetadata } from './quiz-types';
import { getCategoryIdByNameOrAlias } from './database';
import { globalDataCache, cacheHelpers } from './global-data-cache';
import { CIVICS_TEST_QUESTIONS } from './constants/civics-questions';
import { AssessmentEngine } from './services/assessment-engine';

// =============================================================================
// STANDARDIZED TYPE DEFINITIONS
// =============================================================================

export interface StandardResponse<T = any> {
  data: T | null;
  error: DataError | null;
  metadata?: {
    count?: number;
    cached?: boolean;
    timestamp?: number;
  };
}

export interface DataError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

export interface FetchOptions {
  useCache?: boolean;
  maxAge?: number; // Cache TTL in ms
  retries?: number;
  includeInactive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
  page: number;
}

// Standardized data shapes - these resolve field inconsistencies
export interface StandardCategory {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color?: string; // Category color for UI theming
  is_active: boolean;
  display_order: number;
  created_at?: string; // Creation timestamp
  updated_at?: string; // Update timestamp
  // Computed fields
  topic_count?: number;
  question_count?: number;
  topics?: StandardTopic[];
}

export interface StandardTopic {
  id: string; // Always maps to topic_id
  title: string; // Always maps to topic_title
  topic_id: string; // Keep original for compatibility
  topic_title: string; // Keep original for compatibility
  description?: string;
  why_this_matters?: string; // Content explaining why this topic matters
  emoji?: string; // Topic emoji for display
  color?: string; // Topic color for UI theming
  categories: string[];
  is_active: boolean;
  created_at?: string; // Creation timestamp
  updated_at?: string; // Update timestamp
  // Computed fields
  question_count?: number;
  category?: StandardCategory; // Primary category
  questions?: StandardQuestion[];
  // Note: difficulty_level is NOT in question_topics - it's in questions table
}

export interface StandardQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  topic_id: string;
  difficulty_level: number;
  is_active: boolean;
  sources?: string[] | string | Record<string, any>; // Handle JSONB sources field
  question_number?: number;
  // Computed fields
  topic?: StandardTopic;
  category?: StandardCategory | undefined;
}

// =============================================================================
// CACHE MANAGER
// =============================================================================

class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// =============================================================================
// STANDARDIZED DATA SERVICE
// =============================================================================

export class StandardizedDataService {
  private static instance: StandardizedDataService;
  private cache = new CacheManager();

  static getInstance(): StandardizedDataService {
    if (!StandardizedDataService.instance) {
      StandardizedDataService.instance = new StandardizedDataService();
    }
    return StandardizedDataService.instance;
  }

  // =============================================================================
  // CATEGORY OPERATIONS
  // =============================================================================

  async fetchCategoriesPaginated(
    pagination: PaginationOptions = {}, 
    options: FetchOptions = {}
  ): Promise<StandardResponse<PaginatedResponse<StandardCategory>>> {
    const { page = 0, limit = 20 } = pagination;
    const offset = page * limit;
    const cacheKey = `categories_paginated_${page}_${limit}`;
    
    try {
      // Check cache
      if (options.useCache !== false) {
        const cached = this.cache.get<PaginatedResponse<StandardCategory>>(cacheKey);
        if (cached) {
          return {
            data: cached,
            error: null,
            metadata: { cached: true, count: cached.items.length }
          };
        }
      }

      console.log(`🏛️ Fetching categories page ${page} (limit: ${limit}, offset: ${offset})...`);

      // Get total count first
      const supabase = await ensureSupabaseInitialized();
      const { count, error: countError } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*', { count: 'exact', head: true })
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, options.includeInactive ? undefined : true);

      if (countError) {
        throw countError;
      }

      // Fetch categories with pagination
      const { data: rawCategories, error } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, options.includeInactive ? undefined : true)
        .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER)
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          data: null,
          error: {
            code: 'CATEGORIES_FETCH_ERROR',
            message: error.message,
            details: error,
            retryable: true
          }
        };
      }

      if (!rawCategories || rawCategories.length === 0) {
        const emptyResponse: PaginatedResponse<StandardCategory> = {
          items: [],
          hasMore: false,
          total: count || 0,
          page
        };
        return { data: emptyResponse, error: null, metadata: { count: 0 } };
      }

      // Enrich with statistics and standardize
      const categories = await Promise.all(
        rawCategories.map(async (cat) => {
          const stats = await this.getCategoryStatistics(cat.id);
          return this.standardizeCategory(cat, stats);
        })
      );

      const hasMore = offset + rawCategories.length < (count || 0);
      const response: PaginatedResponse<StandardCategory> = {
        items: categories,
        hasMore,
        total: count || 0,
        page
      };

      // Cache results
      this.cache.set(cacheKey, response, options.maxAge);

      return {
        data: response,
        error: null,
        metadata: { count: categories.length, timestamp: Date.now() }
      };

    } catch (error) {
      console.error('Error in fetchCategoriesPaginated:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  async fetchCategories(options: FetchOptions = {}): Promise<StandardResponse<StandardCategory[]>> {
    const cacheKey = `categories_${options.includeInactive ? 'all' : 'active'}`;
    
    try {
      // Use global cache for deduplication
      const categories = await globalDataCache.get(
        cacheKey,
        async () => {
          console.log('🏛️ Fetching categories...');

          // Fetch categories
          const supabase = await ensureSupabaseInitialized();
          const { data: rawCategories, error } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .select('*')
            .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, options.includeInactive ? undefined : true)
            .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER);

          if (error) {
            throw new Error(`Categories fetch error: ${error.message}`);
          }

          if (!rawCategories || rawCategories.length === 0) {
            return [];
          }

          // Enrich with statistics and standardize
          const enrichedCategories = await Promise.all(
            rawCategories.map(async (cat) => {
              const stats = await this.getCategoryStatistics(cat.id);
              return this.standardizeCategory(cat, stats);
            })
          );

          return enrichedCategories;
        },
        options.maxAge || 10 * 60 * 1000 // 10 minutes default TTL
      );

      return {
        data: categories,
        error: null,
        metadata: { count: categories.length, timestamp: Date.now() }
      };

    } catch (error) {
      console.error('Error in fetchCategories:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  async fetchCategoryById(categoryId: string, options: FetchOptions = {}): Promise<StandardResponse<StandardCategory>> {
    const cacheKey = `category_${categoryId}`;
    
    try {
      // Validate categoryId is a UUID before proceeding
      if (!categoryId || !/^[0-9a-fA-F-]{36}$/.test(categoryId)) {
        console.warn(`🚨 Invalid category ID format: "${categoryId}" - must be a valid UUID`);
        return {
          data: null,
          error: {
            code: 'INVALID_CATEGORY_ID',
            message: `Invalid category ID format: "${categoryId}" must be a valid UUID`,
            details: { categoryId },
            retryable: false
          }
        };
      }

      if (options.useCache !== false) {
        const cached = this.cache.get<StandardCategory>(cacheKey);
        if (cached) {
          return { data: cached, error: null, metadata: { cached: true } };
        }
      }

      const supabase = await ensureSupabaseInitialized();
      const { data, error } = await supabase
        .from(DB_TABLES.CATEGORIES)
        .select('*')
        .eq(DB_COLUMNS.CATEGORIES.ID, categoryId)
        .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, options.includeInactive ? undefined : true)
        .maybeSingle();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'CATEGORY_FETCH_ERROR',
            message: error.message,
            details: error,
            retryable: error.code !== 'PGRST116'
          }
        };
      }

      const stats = await this.getCategoryStatistics(categoryId);
      const category = this.standardizeCategory(data, stats);
      
      this.cache.set(cacheKey, category, options.maxAge);
      return { data: category, error: null };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  // =============================================================================
  // TOPIC OPERATIONS
  // =============================================================================

  async fetchTopicsPaginated(
    categoryId?: string, 
    pagination: PaginationOptions = {}, 
    options: FetchOptions = {}
  ): Promise<StandardResponse<PaginatedResponse<StandardTopic>>> {
    const { page = 0, limit = 20 } = pagination;
    const offset = page * limit;
    const cacheKey = `topics_paginated_${categoryId || 'all'}_${page}_${limit}`;
    
    try {
      if (options.useCache !== false) {
        const cached = this.cache.get<PaginatedResponse<StandardTopic>>(cacheKey);
        if (cached) {
          return {
            data: cached,
            error: null,
            metadata: { cached: true, count: cached.items.length }
          };
        }
      }

      console.log(`📚 Fetching topics page ${page} (limit: ${limit}, offset: ${offset})${categoryId ? ` for category ${categoryId}` : ''}...`);

      // First get total count for pagination
      const supabase = await ensureSupabaseInitialized();
      let countQuery = supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('*', { count: 'exact', head: true })
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, options.includeInactive ? undefined : true)
        .not('date', 'is', null); // Only count topics with valid dates

      if (categoryId) {
        countQuery = countQuery.contains('categories', JSON.stringify([categoryId]));
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        throw countError;
      }

      // Build main query with pagination
      let query = supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select(`
          topic_id,
          topic_title,
          description,
          categories,
          is_active,
          created_at,
          updated_at
        `)
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, options.includeInactive ? undefined : true)
        .not('date', 'is', null) // Only include topics with valid dates
        .order(DB_COLUMNS.QUESTION_TOPICS.TOPIC_TITLE)
        .range(offset, offset + limit - 1);

      if (categoryId) {
        query = query.contains('categories', JSON.stringify([categoryId]));
      }

      const { data: rawTopics, error } = await query;

      if (error) {
        return {
          data: null,
          error: {
            code: 'TOPICS_FETCH_ERROR',
            message: error.message,
            details: error,
            retryable: true
          }
        };
      }

      if (!rawTopics || rawTopics.length === 0) {
        const emptyResponse: PaginatedResponse<StandardTopic> = {
          items: [],
          hasMore: false,
          total: count || 0,
          page
        };
        return { data: emptyResponse, error: null, metadata: { count: 0 } };
      }

      // Standardize and enrich topics
      const topics = await Promise.all(
        rawTopics.map(async (topic) => {
          const [questionCount, primaryCategory] = await Promise.all([
            this.getTopicQuestionCount(topic.topic_id),
            this.getTopicPrimaryCategory(topic.categories)
          ]);

          return this.standardizeTopic(topic, { 
            question_count: questionCount,
            category: primaryCategory 
          });
        })
      );

      const hasMore = offset + rawTopics.length < (count || 0);
      const response: PaginatedResponse<StandardTopic> = {
        items: topics,
        hasMore,
        total: count || 0,
        page
      };

      this.cache.set(cacheKey, response, options.maxAge);

      return {
        data: response,
        error: null,
        metadata: { count: topics.length, timestamp: Date.now() }
      };

    } catch (error) {
      console.error(`Error in fetchTopicsPaginated for category ${categoryId}:`, error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  async fetchTopics(categoryId?: string, options: FetchOptions = {}): Promise<StandardResponse<StandardTopic[]>> {
    const cacheKey = `topics_${categoryId || 'all'}_${options.includeInactive ? 'all' : 'active'}`;
    
    try {
      // Use global cache for deduplication
      const topics = await globalDataCache.get(
        cacheKey,
        async () => {
          console.log('📚 Fetching topics...');

          // Initialize Supabase client once for this function
          const supabase = await ensureSupabaseInitialized();

          // Add diagnostic logging to understand category issues
          if (!categoryId) {
            // When fetching all topics, also diagnose category issues
            console.log('🔍 Diagnosing category data...');
            
            // Get actual categories from database
            const { data: actualCategories } = await supabase
              .from(DB_TABLES.CATEGORIES)
              .select('id, name')
              .eq(DB_COLUMNS.CATEGORIES.IS_ACTIVE, true)
              .limit(10);
            
            console.log('📋 Actual categories in database:');
            actualCategories?.slice(0, 5).forEach((cat: any) => {
              console.log(`  - "${cat.name}" (${cat.id})`);
            });
            
            // Sample a few topics to see their category structure
            const { data: sampleTopics } = await supabase
              .from(DB_TABLES.QUESTION_TOPICS)
              .select('topic_title, categories')
              .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
              .limit(5);
            
            console.log('📝 Sample topic categories:');
            sampleTopics?.forEach((topic: any) => {
              console.log(`  - "${topic.topic_title}": [${(topic.categories || []).join(', ')}]`);
            });
          }

          // Build query with proper field selection
          let query = supabase
            .from(DB_TABLES.QUESTION_TOPICS)
            .select(`
              topic_id,
              topic_title,
              description,
              why_this_matters,
              emoji,
              categories,
              is_active,
              created_at,
              updated_at
            `)
            .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, true)
            .not('date', 'is', null); // Only include topics with valid dates

          // Add category filter if provided  
          if (categoryId) {
            // Validate categoryId is a UUID before proceeding
            if (!/^[0-9a-fA-F-]{36}$/.test(categoryId)) {
              console.warn(`🚨 Invalid category ID format: "${categoryId}" - must be a valid UUID`);
              // Don't throw error, just skip the filter
              // This allows the query to return all topics when category name is passed instead of UUID
            } else {
              query = query.contains('categories', JSON.stringify([categoryId]));
            }
          }

          const { data: rawTopics, error } = await query;

          if (error) {
            throw new Error(`Topics fetch error: ${error.message}`);
          }

          if (!rawTopics || rawTopics.length === 0) {
            console.log(`No topics found${categoryId ? ` for category ${categoryId}` : ''}`);
            return [];
          }

          // Standardize topics and add computed fields
          const enrichedTopics = await Promise.all(
            rawTopics.map(async (rawTopic: any) => {
              const questionCount = await this.getTopicQuestionCount(rawTopic.topic_id);
              const primaryCategory = await this.getTopicPrimaryCategory(rawTopic.categories || []);
              
              return this.standardizeTopic(rawTopic, { 
                question_count: questionCount,
                category: primaryCategory 
              });
            })
          );

          console.log(`✅ Loaded ${enrichedTopics.length} topics${categoryId ? ` for category ${categoryId}` : ''}`);
          return enrichedTopics;
        },
        options.maxAge || 5 * 60 * 1000 // 5 minutes default TTL
      );

      return {
        data: topics,
        error: null,
        metadata: { count: topics.length, timestamp: Date.now() }
      };

    } catch (error) {
      console.error(`Error in fetchTopics:`, error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  async fetchTopicById(topicId: string, options: FetchOptions = {}): Promise<StandardResponse<StandardTopic>> {
    const cacheKey = `topic_${topicId}`;
    
    try {
      // Special handling for civics comprehensive test
      if (topicId === 'civics-comprehensive-test') {
        const civicsTestTopic: StandardTopic = {
          id: 'civics-comprehensive-test',
          title: 'U.S. Civics Test',
          topic_id: 'civics-comprehensive-test',
          topic_title: 'U.S. Civics Test',
          description: 'Comprehensive civics test covering American government, history, and geography',
          why_this_matters: 'Understanding civics is essential for active citizenship and democratic participation.',
          emoji: '🏛️',
          color: '#1E40AF',
          categories: ['civics', 'government', 'history'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          question_count: CIVICS_TEST_QUESTIONS.length,
        };
        
        return { data: civicsTestTopic, error: null };
      }

      if (options.useCache !== false) {
        const cached = this.cache.get<StandardTopic>(cacheKey);
        if (cached) {
          return { data: cached, error: null, metadata: { cached: true } };
        }
      }

      const supabase = await ensureSupabaseInitialized();
      const { data, error } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('*')
        .eq(DB_COLUMNS.QUESTION_TOPICS.TOPIC_ID, topicId)
        .eq(DB_COLUMNS.QUESTION_TOPICS.IS_ACTIVE, options.includeInactive ? undefined : true)
        .maybeSingle();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'TOPIC_FETCH_ERROR',
            message: error.message,
            details: error,
            retryable: error.code !== 'PGRST116'
          }
        };
      }

      // Check if topic was found
      if (!data) {
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: `Topic with ID ${topicId} not found`,
            details: { topicId },
            retryable: false
          }
        };
      }

      const [questionCount, primaryCategory] = await Promise.all([
        this.getTopicQuestionCount(topicId),
        this.getTopicPrimaryCategory(data.categories || [])
      ]);

      const topic = this.standardizeTopic(data, {
        question_count: questionCount,
        category: primaryCategory
      });

      this.cache.set(cacheKey, topic, options.maxAge);
      return { data: topic, error: null };

    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  // =============================================================================
  // QUESTION OPERATIONS - This is where the major fixes are
  // =============================================================================

  async fetchQuestions(
    topicId: string,
    options: {
      limit?: number;
      randomize?: boolean;
      includeTopicInfo?: boolean;
    } & FetchOptions = {}
  ): Promise<StandardResponse<StandardQuestion[]>> {
    
    const {
      limit = GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
      randomize = false,
      includeTopicInfo = false
    } = options;

    const cacheKey = `questions_${topicId}_${limit}_${randomize}_${includeTopicInfo}`;

    try {
      // Special handling for civics comprehensive test - load from user_assessment_questions table
      if (topicId === 'civics-comprehensive-test') {
        console.log(`🏛️ Loading civics test questions from user_assessment_questions table...`);
        
        // Use the AssessmentEngine to load questions
        const assessmentResponse = await AssessmentEngine.loadCivicsTestQuestions({
          limit: limit === GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK ? 50 : limit,
          randomize: randomize,
        });

        if (assessmentResponse.error) {
          console.error('❌ Error loading assessment questions:', assessmentResponse.error);
          return {
            data: [],
            error: assessmentResponse.error,
            metadata: { count: 0, timestamp: Date.now() }
          };
        }

        if (!assessmentResponse.data || assessmentResponse.data.length === 0) {
          console.warn('⚠️ No assessment questions found');
          return {
            data: [],
            error: {
              code: 'NO_QUESTIONS_FOUND',
              message: 'No civics test questions found',
              retryable: false
            },
            metadata: { count: 0, timestamp: Date.now() }
          };
        }

        // Convert assessment questions to standard format
        const standardQuestions = AssessmentEngine.convertToStandardQuestions(assessmentResponse.data);

        console.log(`✅ Loaded ${standardQuestions.length} civics test questions`);

        // Cache the results
        this.cache.set(cacheKey, standardQuestions, options.maxAge);

        return {
          data: standardQuestions,
          error: null,
          metadata: { 
            count: standardQuestions.length, 
            timestamp: Date.now()
          }
        };
      }

      // Check cache first for regular topics
      if (options.useCache !== false) {
        const cached = this.cache.get<StandardQuestion[]>(cacheKey);
        if (cached) {
          console.log(`📚 Using cached questions for topic: ${topicId}`);
          return {
            data: cached,
            error: null,
            metadata: { cached: true, count: cached.length, timestamp: Date.now() }
          };
        }
      }

      console.log(`📚 Fetching questions for topic: ${topicId}`);

      // Build the query for regular questions
      const supabase = await ensureSupabaseInitialized();
      let query = supabase
        .from(DB_TABLES.QUESTIONS)
        .select(`
          id,
          question,
          correct_answer,
          explanation,
          difficulty_level,
          is_active,
          sources,
          option_a,
          option_b,
          option_c,
          option_d
        `)
        .eq('is_active', true);

      // Add topic filter
      query = query.eq('topic_id', topicId);

      // Add randomization
      if (randomize) {
        // PostgreSQL random ordering
        query = query.order('random()');
      } else {
        query = query.order('id');
      }

      // Apply limit
      query = query.limit(limit);

      const { data: questions, error } = await query;

      if (error) {
        console.error('❌ Error fetching questions:', error);
        return {
          data: null,
          error: {
            code: 'QUESTIONS_FETCH_ERROR',
            message: error.message,
            details: { topicId, error },
            retryable: true
          }
        };
      }

      if (!questions || questions.length === 0) {
        console.warn(`⚠️ No questions found for topic: ${topicId}`);
        return {
          data: [],
          error: null,
          metadata: { count: 0, timestamp: Date.now() }
        };
      }

      // Convert to StandardQuestion format
      const standardizedQuestions: StandardQuestion[] = questions.map((q: any, index: number) => ({
        id: q.id,
        question: q.question,
        options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        topic_id: topicId,
        difficulty_level: q.difficulty_level || 1,
        is_active: q.is_active ?? true,
        sources: q.sources || [],
        question_number: index + 1,
      }));

      // Cache the results
      if (options.useCache !== false) {
        this.cache.set(cacheKey, standardizedQuestions, options.maxAge);
      }

      console.log(`✅ Fetched ${standardizedQuestions.length} questions for topic: ${topicId}`);

      return {
        data: standardizedQuestions,
        error: null,
        metadata: { count: standardizedQuestions.length, timestamp: Date.now() }
      };
    } catch (error) {
      console.error('❌ Error in fetchQuestions:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: { topicId, error },
          retryable: true
        }
      };
    }
  }

  // =============================================================================
  // GAME SESSION OPERATIONS
  // =============================================================================

  async createSession(
    userId: string,
    topicId: string,
    gameMode: QuizGameMode = 'practice',
    metadata: QuizGameMetadata = {}
  ): Promise<StandardResponse<any>> {
    try {
      console.log(`🎮 Creating game session: ${gameMode} for topic ${topicId}`);

      // Create a simple session ID for offline mode fallback
      const offlineSessionId = `offline_${userId}_${topicId}_${Date.now()}`;

      // Use minimal session data to avoid trigger issues from the start
      const sessionData = {
        user_id: userId,
        topic_id: topicId,
        total_questions: metadata.question_count || GAME_SETTINGS.DEFAULT_QUESTIONS_PER_DECK,
        started_at: new Date().toISOString(),
        game_mode: gameMode,
        // Avoid setting pod_id and complex metadata to prevent trigger conflicts
        pod_id: null,
        game_metadata: null, // Set to null instead of complex object
        is_completed: false,
        score: null,
        correct_answers: null,
        time_spent_seconds: null,
        completed_at: null,
      };

      const supabase = await ensureSupabaseInitialized();
      const { data, error } = await supabase
        .from(DB_TABLES.USER_QUIZ_ATTEMPTS)
        .insert(sessionData)
        .select()
        .maybeSingle();

      if (error) {
        // Handle specific database function errors and constraint violations
        if (error.message?.includes('function update_pod_analytics') || 
            error.message?.includes('is not unique') ||
            error.code === '42725' || // Function not unique error
            error.code === '23505' || // Unique constraint violation
            error.code === '23503' || // Foreign key constraint violation
            error.code === '42501' || // RLS policy violation
            error.message?.includes('foreign key constraint') ||
            error.message?.includes('row-level security policy')) {
          
          console.warn('⚠️ Database constraint conflict detected, using fallback approach...');
          
          // First, check if we can continue in offline mode for practice and assessment modes
          if (gameMode === 'practice' || gameMode === 'assessment' || gameMode === 'daily' || gameMode === 'challenge') {
            console.warn('⚠️ Continuing in offline mode due to session creation failure');
            
            try {
              // Use the offline session manager
              const { offlineSessionManager } = await import('./offline/offline-session-manager');
              
              const offlineSession = await offlineSessionManager.createOfflineSession({
                session_type: 'quiz',
                user_id: userId,
                topic_id: topicId,
                questions: [], // Will be populated by quiz session
                game_mode: gameMode,
                metadata,
              });
              
              // Also cache it for backward compatibility
              this.cache.set(`offline_session_${offlineSession.id}`, offlineSession, 24 * 60 * 60 * 1000);
              
              return { 
                data: offlineSession, 
                error: null
              };
            } catch (offlineError) {
              console.error('❌ Failed to create offline session:', offlineError);
            }
          }
          
          // For multiplayer modes, we can't continue offline
          return {
            data: null,
            error: {
              code: 'SESSION_CREATE_ERROR',
              message: `Failed to create session: ${error.message}`,
              details: { sessionData, error, retryable: false },
              retryable: false
            }
          };
        }

        // Handle other errors
        console.error('❌ Session creation error:', error);
        return {
          data: null,
          error: {
            code: 'SESSION_CREATE_ERROR',
            message: error.message,
            details: { sessionData, error },
            retryable: error.code !== '23505' // Don't retry constraint violations
          }
        };
      }

      // Invalidate user progress cache
      this.cache.invalidate(`user_progress_${userId}`);

      console.log(`✅ Session created successfully: ${data?.id || offlineSessionId}`);

      return { data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error in createSession:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  // User Progress Operations
  async fetchUserProgress(userId: string, options: FetchOptions = {}): Promise<StandardResponse<any[]>> {
    const cacheKey = `user_progress_${userId}`;
    
    try {
      if (options.useCache !== false) {
        const cached = this.cache.get<any[]>(cacheKey);
        if (cached) {
          return { data: cached, error: null, metadata: { cached: true } };
        }
      }

      const supabase = await ensureSupabaseInitialized();
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        return {
          data: null,
          error: {
            code: 'USER_PROGRESS_FETCH_ERROR',
            message: error.message,
            details: error,
            retryable: true
          }
        };
      }

      this.cache.set(cacheKey, data || [], options.maxAge);
      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          retryable: true
        }
      };
    }
  }

  // Helper methods
  private async getTopicQuestionCount(topicId: string): Promise<number> {
    try {
      const supabase = await ensureSupabaseInitialized();
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)
        .eq('is_active', true);
      return count || 0;
    } catch {
      return 0;
    }
  }

  private async getTopicPrimaryCategory(categories: string[]): Promise<StandardCategory | undefined> {
    if (!categories || categories.length === 0) return undefined;
    
    try {
      const supabase = await ensureSupabaseInitialized();
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categories[0])
        .eq('is_active', true)
        .maybeSingle();
      
      return data ? this.standardizeCategory(data) : undefined;
    } catch {
      return undefined;
    }
  }

  private standardizeTopic(rawTopic: any, computedFields: any = {}): StandardTopic {
    return {
      id: rawTopic.topic_id,
      title: rawTopic.topic_title,
      topic_id: rawTopic.topic_id,
      topic_title: rawTopic.topic_title,
      description: rawTopic.description,
      why_this_matters: rawTopic.why_this_matters,
      emoji: rawTopic.emoji,
      categories: rawTopic.categories || [],
      is_active: rawTopic.is_active ?? true,
      created_at: rawTopic.created_at,
      updated_at: rawTopic.updated_at,
      ...computedFields
    };
  }

  private standardizeCategory(rawCategory: any, computedFields: any = {}): StandardCategory {
    return {
      id: rawCategory.id,
      name: rawCategory.name,
      description: rawCategory.description,
      emoji: rawCategory.emoji,
      color: rawCategory.color,
      is_active: rawCategory.is_active ?? true,
      display_order: rawCategory.display_order || 0,
      created_at: rawCategory.created_at,
      updated_at: rawCategory.updated_at,
      ...computedFields
    };
  }

  private async getCategoryStatistics(categoryId: string): Promise<{ topic_count: number; question_count: number }> {
    try {
      const supabase = await ensureSupabaseInitialized();
      const { count: topicCount } = await supabase
        .from('question_topics')
        .select('*', { count: 'exact', head: true })
        .contains('categories', JSON.stringify([categoryId]))
        .eq('is_active', true);

      return {
        topic_count: topicCount || 0,
        question_count: 0 // Simplified for now
      };
    } catch {
      return { topic_count: 0, question_count: 0 };
    }
  }
}

// Global instance
const standardizedDataService = StandardizedDataService.getInstance();

// Named exports for convenience
export const fetchCategories = (options?: FetchOptions) => 
  standardizedDataService.fetchCategories(options);

export const fetchUserProgress = (userId: string, options?: FetchOptions) => 
  standardizedDataService.fetchUserProgress(userId, options);

export const fetchTopics = (categoryId?: string, options?: FetchOptions) => 
  standardizedDataService.fetchTopics(categoryId, options);

export const fetchQuestions = (topicId: string, options?: any) => 
  standardizedDataService.fetchQuestions(topicId, options);

// Default export
export default standardizedDataService;