// lib/data-service.ts - Optimized with database-level filtering and proper joins

import { topicOperations, questionOperations, categoryOperations } from './database'
import type { TopicMetadata, QuizQuestion } from './quiz-data'
import { allCategories } from './quiz-data'
import { cleanObjectContent } from './utils'
import { supabase } from './supabase'

// Cache for database availability check
let isDatabaseAvailable: boolean | null = null
let lastDbCheck = 0
const DB_CHECK_INTERVAL = 30000 // 30 seconds

/**
 * Check if the database is available with timeout
 */
async function checkDatabaseAvailability(): Promise<boolean> {
  const now = Date.now()
  
  // Use cached result if recent
  if (isDatabaseAvailable !== null && now - lastDbCheck < DB_CHECK_INTERVAL) {
    return isDatabaseAvailable
  }
  
  try {
    // Check if supabase client is initialized
    if (!supabase) {
      console.warn('⚠️ Supabase client not initialized')
      isDatabaseAvailable = false
      lastDbCheck = now
      return false
    }
    
    // Try a simple database query with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 3000) // 3 second timeout
    )
    
    // Use a simple ping query instead of getting all topics
    const dbCheckPromise = supabase
      .from('question_topics')
      .select('count', { count: 'exact', head: true })
      .limit(1)
      .then(response => {
        if (response.error) {
          throw new Error(`Database check failed: ${response.error.message}`)
        }
        return true
      })
    
    await Promise.race([dbCheckPromise, timeoutPromise])
    
    isDatabaseAvailable = true
    lastDbCheck = now
    console.log('✅ Database is available')
    return true
  } catch (error) {
    // Extract error message safely
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message)
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error)
    }
    
    isDatabaseAvailable = false
    lastDbCheck = now
    console.warn(`⚠️ Database unavailable: ${errorMessage}`)
    return false
  }
}

/**
 * Convert database topic to app format
 */
function dbTopicToAppFormat(dbTopic: any): TopicMetadata {
  const topic = {
    topic_id: dbTopic.topic_id,
    topic_title: dbTopic.topic_title,
    description: dbTopic.description,
    why_this_matters: dbTopic.why_this_matters,
    emoji: dbTopic.emoji,
    date: dbTopic.date,
    dayOfWeek: dbTopic.day_of_week,
    categories: Array.isArray(dbTopic.categories) ? dbTopic.categories : [],
    is_breaking: dbTopic.is_breaking === true,
    is_featured: dbTopic.is_featured === true,
  }
  
  return cleanObjectContent(topic)
}

/**
 * Get topics in date range (database-level filtering)
 */
async function getTopicsInDateRange(startDate: Date, endDate: Date): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .filter('date', 'gte', startDate.toISOString().split('T')[0])
      .filter('date', 'lte', endDate.toISOString().split('T')[0])
      .eq('is_active', true)
      .order('is_breaking', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase query error:', error.message)
      throw error;
    }
    
    if (!data) {
      console.warn('No data returned from Supabase')
      return [];
    }
    
    // Additional filtering to ensure valid dates
    return data.filter(topic => {
      if (!topic.date || typeof topic.date !== 'string' || topic.date.trim() === '') return false;
      try {
        const date = new Date(topic.date);
        return !isNaN(date.getTime());
      } catch (e) {
        return false;
      }
    });
  } catch (error) {
    console.error(`Error in getTopicsInDateRange:`, error);
    throw error; // Don't fall back to mock data
  }
}

/**
 * Get all topics with valid dates only (database-level filtering)
 */
async function getAllTopicsWithValidDates() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .eq('is_active', true)
      .order('is_breaking', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase query error:', error.message)
      throw error;
    }
    
    if (!data) {
      console.warn('No data returned from Supabase')
      return [];
    }
    
    // Additional filtering to ensure valid dates
    return data.filter(topic => {
      if (!topic.date || typeof topic.date !== 'string' || topic.date.trim() === '') return false;
      try {
        const date = new Date(topic.date);
        return !isNaN(date.getTime());
      } catch (e) {
        return false;
      }
    });
  } catch (error) {
    console.error(`Error in getAllTopicsWithValidDates:`, error);
    throw error; // Don't fall back to mock data
  }
}

/**
 * Get topics for a specific date (like today)
 */
async function getTopicsForDate(targetDate: Date): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const dateString = targetDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('date', dateString)
      .eq('is_active', true)
      .order('is_breaking', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase query error for specific date:', error.message)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error(`Error getting topics for date ${targetDate.toISOString().split('T')[0]}:`, error)
    throw error; // Don't fall back to mock data
  }
}

/**
 * Get all featured topics regardless of date
 */
async function getAllFeaturedTopics(): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('is_breaking', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase query error for featured topics:', error.message)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error getting featured topics:', error)
    throw error; // Don't fall back to mock data
  }
}

/**
 * Get questions for a topic with proper join to ensure topic exists and is active
 */
async function getQuestionsWithTopicJoin(topicId: string): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    console.log(`📊 Querying questions for topic ${topicId} with topic join`)
    
    // Try multiple query approaches to find questions
    let questions: any[] = []
    let querySuccess = false

    // First try: Direct query on questions table using topic_identifier
    console.log(`📊 Attempting query 1: direct questions query on topic_identifier`)
    try {
      const result1 = await supabase
        .from('questions')
        .select('*')
        .eq('topic_identifier', topicId)
        .eq('is_active', true)
        .order('question_number', { ascending: true })
      
      if (!result1.error && result1.data && result1.data.length > 0) {
        questions = result1.data
        querySuccess = true
        console.log(`📊 Query 1 succeeded: found ${questions.length} questions`)
      } else {
        console.log(`📊 Query 1 failed or found no data:`, result1.error?.message || 'No data')
      }
    } catch (err) {
      console.log(`📊 Query 1 error:`, err)
    }

    // Second try: Direct query on questions table using topic_id
    if (!querySuccess) {
      console.log(`📊 Attempting query 2: direct questions query on topic_id`)
      try {
        const result2 = await supabase
          .from('questions')
          .select('*')
          .eq('topic_id', topicId)
          .eq('is_active', true)
          .order('question_number', { ascending: true })
        
        if (!result2.error && result2.data && result2.data.length > 0) {
          questions = result2.data
          querySuccess = true
          console.log(`📊 Query 2 succeeded: found ${questions.length} questions`)
        } else {
          console.log(`📊 Query 2 failed or found no data:`, result2.error?.message || 'No data')
        }
      } catch (err) {
        console.log(`📊 Query 2 error:`, err)
      }
    }

    // Third try: Query from question_topics and join to questions using topic_id
    if (!querySuccess) {
      console.log(`📊 Attempting query 3: question_topics -> questions join on topic_id`)
      try {
        const result3 = await supabase
          .from('question_topics')
          .select(`
            topic_id,
            topic_title,
            is_active,
            questions!inner (*)
          `)
          .eq('topic_id', topicId)
          .eq('is_active', true)
          .eq('questions.is_active', true)
          .order('questions.question_number', { ascending: true })
        
        if (!result3.error && result3.data && result3.data.length > 0) {
          // Flatten the joined data
          questions = result3.data.flatMap((item: any) => item.questions || [])
          querySuccess = true
          console.log(`📊 Query 3 succeeded: found ${questions.length} questions`)
        } else {
          console.log(`📊 Query 3 failed or found no data:`, result3.error?.message || 'No data')
        }
      } catch (err) {
        console.log(`📊 Query 3 error:`, err)
      }
    }

    if (!querySuccess) {
      console.log(`📊 All query attempts failed for topic ${topicId}`)
      return []
    }
    
    console.log(`📊 Database returned ${questions.length} questions for topic ${topicId}`)
    if (questions[0]) {
      console.log(`📊 Sample question data:`, {
        question_number: questions[0].question_number,
        question_type: questions[0].question_type,
        topic_id: questions[0].topic_id,
        topic_identifier: questions[0].topic_identifier,
        hasQuestion: !!questions[0].question,
        hasCorrectAnswer: !!questions[0].correct_answer
      })
    }
    
    return questions
  } catch (error) {
    console.error(`Error in getQuestionsWithTopicJoin for topic ${topicId}:`, error)
    throw error; // Don't fall back to mock data
  }
}

/**
 * Check if topic has questions with proper join
 */
async function checkTopicHasQuestionsWithJoin(topicId: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // Use a join to ensure both topic and questions exist and are active
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('is_active', true)
      // We can also add a separate check for topic existence
      
    if (error) {
      console.error(`Error checking questions for topic ${topicId}:`, error)
      throw error
    }

    // Additional check to ensure topic exists and is active
    const { data: topicData, error: topicError } = await supabase
      .from('question_topics')
      .select('topic_id')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .single()

    if (topicError) {
      console.error(`Topic ${topicId} not found or not active:`, topicError)
      return false
    }

    return count !== null && count > 0 && !!topicData
  } catch (error) {
    console.error(`Error in checkTopicHasQuestionsWithJoin for topic ${topicId}:`, error)
    return false
  }
}

/**
 * Data service with proper database queries and joins
 */
export const dataService = {
  /**
   * Get all featured topics regardless of date (always show these)
   */
  async getFeaturedTopics(): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (!isDbAvailable) {
      console.error('Database not available for getFeaturedTopics')
      return {}
    }

    try {
      const dbTopics = await getAllFeaturedTopics()
      const topicsRecord: Record<string, TopicMetadata> = {}
      
      dbTopics.forEach((dbTopic: any) => {
        const appTopic = dbTopicToAppFormat(dbTopic)
        topicsRecord[appTopic.topic_id] = appTopic
      })
      
      console.log(`📊 Loaded ${Object.keys(topicsRecord).length} featured topics from database`)
      return topicsRecord
    } catch (error) {
      console.error('Error loading featured topics from database:', error)
      return {} // Return empty object instead of mock data
    }
  },

  /**
   * Get all topics for a specific date (prioritizes breaking news)
   */
  async getTopicsForDate(targetDate: Date): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (!isDbAvailable) {
      console.error('Database not available for getTopicsForDate')
      return {}
    }

    try {
      const dbTopics = await getTopicsForDate(targetDate)
      const topicsRecord: Record<string, TopicMetadata> = {}
      
      dbTopics.forEach((dbTopic: any) => {
        const appTopic = dbTopicToAppFormat(dbTopic)
        topicsRecord[appTopic.topic_id] = appTopic
      })
      
      console.log(`📊 Loaded ${Object.keys(topicsRecord).length} topics for ${targetDate.toISOString().split('T')[0]} from database`)
      return topicsRecord
    } catch (error) {
      console.error('Error loading topics for specific date from database:', error)
      return {} // Return empty object instead of mock data
    }
  },

  /**
   * Get topics in a date range
   */
  async getTopicsInRange(startDate: Date, endDate: Date): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (!isDbAvailable) {
      console.error('Database not available for getTopicsInRange')
      return {}
    }

    try {
      const dbTopics = await getTopicsInDateRange(startDate, endDate)
      const validTopics: Record<string, TopicMetadata> = {}
      
      // Convert to app format
      dbTopics.forEach((dbTopic) => {
        const topic = dbTopicToAppFormat(dbTopic)
        validTopics[topic.topic_id] = topic
      })
      
      console.log(`📊 Loaded ${Object.keys(validTopics).length} topics in date range from database`)
      return validTopics
    } catch (error) {
      console.error('Error loading topics from database:', error)
      return {} // Return empty object instead of mock data
    }
  },

  /**
   * Get all topics (now optimized to only fetch valid ones)
   */
  async getAllTopics(): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (!isDbAvailable) {
      console.error('Database not available for getAllTopics')
      return {}
    }

    try {
      const dbTopics = await getAllTopicsWithValidDates();
      const topicsRecord: Record<string, TopicMetadata> = {}
      
      dbTopics.forEach((dbTopic: any) => {
        const appTopic = dbTopicToAppFormat(dbTopic)
        topicsRecord[appTopic.topic_id] = appTopic
      })
      
      console.log(`📊 Loaded ${Object.keys(topicsRecord).length} valid topics from database`)
      return topicsRecord
    } catch (error) {
      console.error('Error fetching topics from database:', error)
      return {} // Return empty object instead of mock data
    }
  },

  /**
   * Get topic by ID
   */
  async getTopicById(topicId: string): Promise<TopicMetadata | null> {
    console.log('📊 dataService.getTopicById - Called with:', topicId)
    
    const isDbAvailable = await checkDatabaseAvailability()
    console.log('📊 dataService.getTopicById - Database available:', isDbAvailable)
    
    if (!isDbAvailable) {
      console.error('Database not available for getTopicById')
      return null
    }

    try {
      console.log('📊 dataService.getTopicById - Querying database for topic:', topicId)
      const dbTopic = await topicOperations.getById(topicId)
      console.log('📊 dataService.getTopicById - Database result:', {
        found: !!dbTopic,
        topicData: dbTopic ? {
          topic_id: dbTopic.topic_id,
          topic_title: dbTopic.topic_title,
          emoji: dbTopic.emoji,
          date: dbTopic.date
        } : null
      })
      
      const result = dbTopic ? dbTopicToAppFormat(dbTopic) : null
      console.log('📊 dataService.getTopicById - Returning from database:', !!result)
      return result
    } catch (error) {
      console.error('📊 dataService.getTopicById - Database error:', error)
      return null // Return null instead of mock data
    }
  },

  /**
   * Get questions for a topic with proper topic validation
   */
  async getQuestionsByTopic(topicId: string): Promise<QuizQuestion[]> {
    console.log('📊 dataService.getQuestionsByTopic - Called with:', topicId)
    
    const isDbAvailable = await checkDatabaseAvailability()
    console.log('📊 dataService.getQuestionsByTopic - Database available:', isDbAvailable)
    
    if (!isDbAvailable) {
      console.error('Database not available for getQuestionsByTopic')
      return []
    }

    try {
      console.log('📊 dataService.getQuestionsByTopic - Querying database with topic join:', topicId)
      const dbQuestions = await getQuestionsWithTopicJoin(topicId)
      console.log('📊 dataService.getQuestionsByTopic - Database questions result:', {
        count: dbQuestions.length,
        firstQuestion: dbQuestions[0] ? {
          question_number: dbQuestions[0].question_number,
          question_type: dbQuestions[0].question_type,
          hasOptions: !!(dbQuestions[0].option_a && dbQuestions[0].option_b),
          question: dbQuestions[0].question.substring(0, 100) + '...'
        } : null
      })
      
      const questions = dbQuestions.map(dbQuestion => questionOperations.toQuestionAppFormat(dbQuestion))
      console.log('📊 dataService.getQuestionsByTopic - Transformed questions:', {
        count: questions.length,
        firstTransformed: questions[0] ? {
          question_number: questions[0].question_number,
          question_type: questions[0].question_type,
          hasOptions: !!(questions[0].option_a && questions[0].option_b),
          correct_answer: questions[0].correct_answer
        } : null
      })
      
      const result = cleanObjectContent(questions)
      console.log('📊 dataService.getQuestionsByTopic - Returning from database, count:', result.length)
      
      return result
    } catch (error) {
      console.error('📊 dataService.getQuestionsByTopic - Database error:', error)
      return [] // Return empty array instead of mock data
    }
  },

  /**
   * Get topic with questions
   */
  async getTopicWithQuestions(topicId: string): Promise<{
    topic: TopicMetadata | null
    questions: QuizQuestion[]
  }> {
    const [topic, questions] = await Promise.all([
      this.getTopicById(topicId),
      this.getQuestionsByTopic(topicId)
    ])
    
    return { topic, questions }
  },

  /**
   * Get categories (optimized)
   */
  async getCategories(): Promise<Array<{ name: string; emoji: string; description?: string }>> {
    // Try API first (fastest)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const { categories } = await response.json()
        return categories.map((cat: any) => ({
          name: cat.name,
          emoji: cat.emoji || '📚',
          description: cat.description || ''
        }))
      }
    } catch (error) {
      console.error('Failed to fetch categories from API:', error)
    }

    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        const categoriesFromTable = await categoryOperations.getAll()
        if (categoriesFromTable) {
          return categoriesFromTable.map(cat => ({
            name: cat.name,
            emoji: cat.emoji,
            description: cat.description || ''
          }))
        }
      } catch (error) {
        console.error('Error fetching categories from database:', error)
      }
    }
    
    // Fallback to hardcoded categories (this is acceptable as it's configuration data)
    return allCategories.map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      description: ''
    }))
  },

  /**
   * Check if we're using database or mock data
   */
  async isUsingDatabase(): Promise<boolean> {
    return await checkDatabaseAvailability()
  },

  /**
   * Check if a topic has questions without loading all question data
   */
  async checkTopicHasQuestions(topicId: string): Promise<boolean> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (!isDbAvailable) {
      console.error('Database not available for checkTopicHasQuestions')
      return false
    }

    try {
      return await checkTopicHasQuestionsWithJoin(topicId)
    } catch (error) {
      console.error('Error checking if topic has questions:', error)
      return false // Return false instead of checking mock data
    }
  }
}