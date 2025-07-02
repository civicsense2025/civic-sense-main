/**
 * Standardized Quiz Data Service
 * 
 * This service consolidates all the successful fetching patterns from HomeScreen and DailyCardStack
 * to ensure consistent, reliable data fetching across the entire app.
 */

import React from 'react';
import { 
  getCategoriesWithTopics, 
  getQuestionTopics, 
  getQuestionsFromDeck, 
  getUserProgress,
  getCategories,
  debugTopicQuestionRelationships
} from './database';
import type { DbCategory, DbQuestionTopic, DbQuestion } from './supabase';
import { MOBILE_CONSTANTS } from './mobile-constants';
import {
  getCachedCategoriesWithTopics,
  setCachedCategoriesWithTopics,
  getCachedTopicsForCategory,
  setCachedTopicsForCategory,
  getCachedQuestionsForTopic,
  setCachedQuestionsForTopic
} from './cache-service';

// Extended types that match what's working in HomeScreen
export interface CategoryWithTopics extends DbCategory {
  topic_count: number;
  topics?: DbQuestionTopicWithCount[];
}

export interface DbQuestionTopicWithCount extends Omit<DbQuestionTopic, 'title'> {
  topic_title: string;
  questions?: {
    count: number;
  }[];
  date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: {
    id: string;
    name: string;
    description: string | null;
    emoji: string;
    is_active: boolean | null;
    display_order: number | null;
  };
}

export interface QuizDataState {
  categories: CategoryWithTopics[];
  topics: DbQuestionTopicWithCount[];
  questions: DbQuestion[];
  userProgress: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Standardized data loading function that replicates HomeScreen's successful pattern
 */
export const loadQuizData = async (userId?: string): Promise<{
  categories: CategoryWithTopics[];
  topics: DbQuestionTopicWithCount[];
  questions: DbQuestion[];
  userProgress: any[];
}> => {
  try {
    // Debug topic-question relationships in development
    if (__DEV__) {
      console.log('🔧 Debug function temporarily disabled to avoid 500 errors');
      // await debugTopicQuestionRelationships();
    }

    // Clear cache in development to get fresh data with enhanced loading
    if (__DEV__) {
      console.log('🔧 Clearing categories cache in development mode...');
      await setCachedCategoriesWithTopics([]); // Clear cache
    }

    // Try to get categories from cache first
    let categoriesData = await getCachedCategoriesWithTopics();
    
    if (!categoriesData) {
      // Cache miss - fetch from API
      console.log('📚 Cache miss - loading categories from API...');
      const rawCategoriesData = await getCategoriesWithTopics();
      
      // Convert to CategoryWithTopics format with proper typing
      categoriesData = rawCategoriesData.map(category => {
        const convertedTopics = category.topics?.map(topic => ({
          ...topic,
          topic_title: topic.topic_title || topic.title || '',
          date: topic.date || null,
          created_at: topic.created_at || null,
          updated_at: topic.updated_at || null,
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            emoji: category.emoji,
            is_active: category.is_active,
            display_order: category.display_order
          }
        })) || [];

        return {
          ...category,
          topics: convertedTopics as DbQuestionTopicWithCount[],
          topic_count: category.topic_count || 0
        };
      });
      
      // Cache the results
      if (categoriesData && categoriesData.length > 0) {
        await setCachedCategoriesWithTopics(categoriesData);
      }
    } else {
      console.log('📚 Using cached categories data');
    }

    if (!categoriesData || categoriesData.length === 0) {
      throw new Error('No quiz categories found');
    }

    // Load all topics directly (not just from categories) to ensure we get everything
    console.log('📚 Loading all topics directly...');
    let allTopics: DbQuestionTopicWithCount[] = [];
    
    try {
      const directTopics = await getQuestionTopics();
      
      // Convert to DbQuestionTopicWithCount format
      allTopics = directTopics.map(topic => {
        const matchingCategory = topic.categories?.[0] ? 
          categoriesData.find(cat => cat.id === topic.categories?.[0]) : null;
          
        return {
          ...topic,
          topic_title: topic.topic_title || topic.title || '',
          date: topic.date || null,
          created_at: topic.created_at || null,
          updated_at: topic.updated_at || null,
          // Only include category if we found a match
          ...(matchingCategory && {
            category: {
              id: matchingCategory.id,
              name: matchingCategory.name,
              description: matchingCategory.description,
              emoji: matchingCategory.emoji,
              is_active: matchingCategory.is_active,
              display_order: matchingCategory.display_order
            }
          })
        };
      });
      
      console.log(`📚 Loaded ${allTopics.length} topics directly`);
    } catch (topicsError) {
      console.warn('Error loading topics directly, falling back to category topics:', topicsError);
      
      // Fallback: collect topics from categories
      allTopics = categoriesData.reduce<DbQuestionTopicWithCount[]>((acc, category) => {
        if (!category.topics) return acc;
        return [...acc, ...category.topics];
      }, []);
    }

    // Load a sample of questions from the first available topic
    let questions: DbQuestion[] = [];
    const firstTopic = allTopics[0];
    if (firstTopic?.id) {
      // Try to get questions from cache first
      const cachedQuestions = await getCachedQuestionsForTopic(firstTopic.id);
      questions = cachedQuestions || [];
      
      if (questions.length === 0) {
        // Cache miss - fetch from API
        console.log('📚 Cache miss - loading questions from API...');
        questions = await getQuestionsFromDeck(firstTopic.id, 5);
        
        // Cache the results
        if (questions.length > 0) {
          await setCachedQuestionsForTopic(firstTopic.id, questions);
        }
      } else {
        console.log('📚 Using cached questions data');
      }
    }

    // Load user progress if logged in
    let userProgress: any[] = [];
    if (userId) {
      try {
        userProgress = await getUserProgress(userId);
      } catch (progressError) {
        console.warn('Error loading user progress:', progressError);
      }
    }

    return {
      categories: categoriesData,
      topics: allTopics,
      questions,
      userProgress,
    };
  } catch (error) {
    console.error('Error in loadQuizData:', error);
    throw error;
  }
};

/**
 * Load topics for a specific category with caching
 */
export const loadTopicsForCategory = async (categoryId: string): Promise<DbQuestionTopicWithCount[]> => {
  try {
    // Try to get topics from cache first
    const cachedTopics = await getCachedTopicsForCategory(categoryId);
    if (cachedTopics) {
      console.log(`📚 Using cached topics for category ${categoryId}`);
      return cachedTopics;
    }

    // Cache miss - fetch from API
    console.log(`📚 Cache miss - loading topics for category ${categoryId} from API...`);
    const categoriesData = await getCategoriesWithTopics();
    const category = categoriesData.find(cat => cat.id === categoryId);
    
    if (!category?.topics) {
      return [];
    }

    const topics: DbQuestionTopicWithCount[] = category.topics.map(topic => ({
      ...topic,
      topic_title: topic.topic_title || topic.title || '',
      date: topic.date || null,
      created_at: topic.created_at || null,
      updated_at: topic.updated_at || null,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        emoji: category.emoji,
        is_active: category.is_active,
        display_order: category.display_order
      }
    }));
    
    // Cache the results
    await setCachedTopicsForCategory(categoryId, topics);
    return topics;
  } catch (error) {
    console.error('Error loading topics for category:', error);
    return [];
  }
};

/**
 * Load categories only (used by discover, practice screens)
 */
export const loadCategories = async (): Promise<DbCategory[]> => {
  try {
    console.log('📂 Loading categories...');
    
    const categoriesData = await getCategories();
    console.log(`📂 Loaded ${categoriesData.length} categories`);
    
    return categoriesData;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
};

// Extended interface for DailyTopic
export interface DailyTopic extends DbQuestionTopicWithCount {
  category_id: string | null;
  date: string;
  isToday: boolean;
  isLocked: boolean;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  topic_title: string;
  title?: string;
}

/**
 * Load daily topics (used by DailyCardStack) - generates full DailyTopic objects
 */
export const loadDailyTopics = async (maxCards: number = 5): Promise<DailyTopic[]> => {
  try {
    console.log('📅 Loading daily topics...');
    
    const allTopics = await getQuestionTopics();
    
    // Filter out topics without an id (same as DailyCardStack)
    const validTopics = allTopics.filter(topic => typeof topic.id === 'string');
    
    if (validTopics.length === 0) {
      return [];
    }
    
    // Generate daily selection (same algorithm as DailyCardStack)
    const today = new Date();
    const dailyTopics: DailyTopic[] = [];
    
    for (let i = 0; i < maxCards && validTopics.length > 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Select a topic for this day (consistent seed for same day)
      const topicIndex = (date.getDate() + date.getMonth()) % validTopics.length;
      const topic = validTopics[topicIndex]!;
      
      const isToday = i === 0;
      const isLocked = i > 0; // Future topics are locked
      const dateStr = date.toISOString().split('T')[0];
      
      // Get completion status from user progress
      const completionStatus = await getTopicCompletionStatus(topic.id);
      
      dailyTopics.push({
        ...topic,
        category_id: topic.categories?.[0] || null, // Use first category as category_id
        date: dateStr,
        isToday,
        isLocked,
        completionStatus,
      } as DailyTopic);
    }
    
    console.log(`📅 Generated ${dailyTopics.length} daily topics`);
    return dailyTopics;
  } catch (error) {
    console.error('Error loading daily topics:', error);
    return [];
  }
};

/**
 * Get topic completion status for a user
 */
const getTopicCompletionStatus = async (topicId: string): Promise<'not_started' | 'in_progress' | 'completed'> => {
  try {
    // Import getUserProgress from database to check completion status
    const { getUserProgress } = await import('./database');
    
    // For now, we'll check if there are any quiz attempts for this topic
    // In a real implementation, you might want to pass userId as a parameter
    // For the daily topics, we can check anonymously or use a global user context
    
    // Since we don't have userId in this context, return 'not_started' for now
    // This function can be enhanced when user context is available
    return 'not_started';
    
    // Future implementation with userId:
    /*
    if (userId) {
      const progress = await getUserProgress(userId);
      const topicProgress = progress.find(p => p.topic_id === topicId);
      
      if (!topicProgress) return 'not_started';
      if (topicProgress.completed) return 'completed';
      if (topicProgress.questions_answered > 0) return 'in_progress';
    }
    return 'not_started';
    */
  } catch (error) {
    console.error('Error getting topic completion status:', error);
    return 'not_started';
  }
};

/**
 * Clear all quiz-related caches to force fresh data loading
 * Useful during development or when data structure changes
 */
export const clearAllQuizCaches = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all quiz caches...');
    
    // Clear categories cache
    await setCachedCategoriesWithTopics([]);
    
    // Note: Individual topic and question caches will be cleared as needed
    // We don't have a universal clear function, but categories cache is the main one
    
    console.log('✅ Quiz caches cleared');
  } catch (error) {
    console.error('Error clearing quiz caches:', error);
  }
};

/**
 * Standardized error handling and retry wrapper
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

/**
 * React hook for standardized quiz data loading
 */
export const useQuizData = (userId?: string) => {
  const [state, setState] = React.useState<QuizDataState>({
    categories: [],
    topics: [],
    questions: [],
    userProgress: [],
    loading: true,
    error: null
  });

  const loadData = React.useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await loadQuizData(userId);
      
      setState({
        ...data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading quiz data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load quiz data'
      }));
    }
  }, [userId]);

  const refreshData = React.useCallback(async () => {
    await loadData();
  }, [loadData]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...state,
    loadData,
    refreshData
  };
};

// For non-React contexts, provide direct functions
export const QuizDataService = {
  loadQuizData,
  loadTopicsForCategory,
  loadCategories,
  loadDailyTopics,
  withRetry,
  debugTopicQuestionRelationships,
  clearAllQuizCaches
}; 