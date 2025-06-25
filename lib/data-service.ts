// lib/data-service.ts - Fixed with proper question-topic relationships and source handling

import { topicOperations, questionOperations, categoryOperations } from './database'
import type { TopicMetadata, QuizQuestion } from './quiz-data'
import { allCategories } from './quiz-data'
import { cleanObjectContent } from './utils'
import { supabase } from './supabase/client'

// Cache for database availability check
let isDatabaseAvailable: boolean | null = null
let lastDbCheck = 0
const DB_CHECK_INTERVAL = 30000 // 30 seconds

// Cache for topic data to prevent duplicate fetches
const topicCache = new Map<string, { data: TopicMetadata | null; timestamp: number }>()
const CACHE_DURATION = 3600000 // 1 hour cache for topics (they rarely change)
const MAX_CACHE_SIZE = 100 // Maximum number of cached topics

// Cache for categories data
let categoriesGlobalCache: { data: any[] | null; timestamp: number } | null = null
const CATEGORIES_CACHE_DURATION = 3600000 // 1 hour cache for categories

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
    
    // Try a simple database query with increased timeout for initial connections
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 8000) // Increased to 8 seconds
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
 * Transform database question to app format with enhanced source handling
 */
function dbQuestionToAppFormat(dbQuestion: any): QuizQuestion {
  let tags: string[] = []
  let sources: any[] = []

  // Parse sources if they exist
  if (dbQuestion.sources) {
    try {
      if (typeof dbQuestion.sources === 'string') {
        sources = JSON.parse(dbQuestion.sources)
      } else if (Array.isArray(dbQuestion.sources)) {
        sources = dbQuestion.sources
      }
    } catch (e) {
      console.warn(`Failed to parse question sources for question ${dbQuestion.question_number}:`, e)
      sources = []
    }
  }

  // Parse tags if they exist
  if (dbQuestion.tags) {
    try {
      if (typeof dbQuestion.tags === 'string') {
        tags = JSON.parse(dbQuestion.tags)
      } else if (Array.isArray(dbQuestion.tags)) {
        tags = dbQuestion.tags
      }
      
      // Ensure tags are strings
      tags = tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
      
    } catch (e) {
      console.warn(`Failed to parse question tags for question ${dbQuestion.question_number}:`, e)
      tags = []
    }
  }

  // Map difficulty level from number to string
  let difficulty: 'easy' | 'medium' | 'hard'
  switch (dbQuestion.difficulty_level) {
    case 1:
      difficulty = 'easy'
      break
    case 3:
    case 4:
      difficulty = 'hard'
      break
    case 2:
    default:
      difficulty = 'medium'
  }

  // Create base question properties
  const baseQuestion = {
    topic_id: dbQuestion.topic_id,
    question_number: dbQuestion.question_number || 1,
    question: dbQuestion.question || '',
    correct_answer: dbQuestion.correct_answer || '',
    explanation: dbQuestion.explanation || '',
    hint: dbQuestion.hint || '',
    tags,
    sources,
    difficulty,
    category: dbQuestion.category || 'General',
    type: dbQuestion.question_type || 'multiple_choice'
  }

  // Create the specific question type based on question_type
  let question: QuizQuestion
  switch (dbQuestion.question_type) {
    case 'multiple_choice':
      const options = [
        dbQuestion.option_a,
        dbQuestion.option_b,
        dbQuestion.option_c,
        dbQuestion.option_d
      ].filter((opt): opt is string => typeof opt === 'string')
      
      question = {
        ...baseQuestion,
        type: 'multiple_choice' as const,
        options,
        // Keep the individual option fields for backward compatibility
        option_a: dbQuestion.option_a || undefined,
        option_b: dbQuestion.option_b || undefined,
        option_c: dbQuestion.option_c || undefined,
        option_d: dbQuestion.option_d || undefined
      }
      break
    case 'true_false':
      question = {
        ...baseQuestion,
        type: 'true_false' as const,
        options: ['True', 'False']
      }
      break
    default:
      // Default to multiple choice if type is unknown
      question = {
        ...baseQuestion,
        type: 'multiple_choice' as const,
        options: [
          dbQuestion.option_a,
          dbQuestion.option_b,
          dbQuestion.option_c,
          dbQuestion.option_d
        ].filter((opt): opt is string => typeof opt === 'string')
      }
  }
  
  // Log the final transformed question for debugging
  console.log(`📊 Transformed question ${dbQuestion.question_number}:`, {
    topic_id: question.topic_id,
    question_number: question.question_number,
    type: question.type,
    hasQuestion: !!question.question,
    hasCorrectAnswer: !!question.correct_answer,
    sourcesCount: sources.length,
    tagsCount: tags.length,
    hasExplanation: !!question.explanation,
    hasHint: !!question.hint,
    difficulty: question.difficulty
  })
  
  return cleanObjectContent(question)
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
}

/**
 * Get questions for a topic using the correct foreign key relationship
 */
async function getQuestionsForTopic(topicId: string): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    console.log(`📊 Querying questions for topic ${topicId}`)
    
    // Enhanced query to get all question fields including sources
    console.log(`📊 Attempting direct query on questions table with topic_id`)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        topic_id,
        question_number,
        question_type,
        category,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        hint,
        explanation,
        tags,
        sources,
        difficulty_level,
        is_active,
        created_at,
        updated_at,
        fact_check_notes,
        fact_check_status,
        last_fact_check,
        translations
      `)
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (questionsError) {
      console.error(`📊 Error querying questions:`, questionsError)
      throw questionsError
    }

    if (!questions || questions.length === 0) {
      console.log(`📊 No questions found for topic ${topicId}`)
      return []
    }

    console.log(`📊 Found ${questions.length} questions for topic ${topicId}`)
    
    // Enhanced logging for debugging
    if (questions[0]) {
      console.log(`📊 Sample question structure:`, {
        id: questions[0].id,
        topic_id: questions[0].topic_id,
        question_number: questions[0].question_number,
        question_type: questions[0].question_type,
        hasQuestion: !!questions[0].question,
        hasCorrectAnswer: !!questions[0].correct_answer,
        hasSources: !!questions[0].sources,
        sourcesType: typeof questions[0].sources,
        sourcesContent: questions[0].sources ? (typeof questions[0].sources === 'string' ? 'JSON string' : 'Object/Array') : 'None',
        sourcesPreview: questions[0].sources ? JSON.stringify(questions[0].sources).substring(0, 100) + '...' : 'None',
        hasExplanation: !!questions[0].explanation,
        hasHint: !!questions[0].hint
      })
    }
    
    return questions
  } catch (error) {
    console.error(`Error in getQuestionsForTopic for topic ${topicId}:`, error)
    throw error;
  }
}

/**
 * Verify topic exists and is active
 */
async function verifyTopicExists(topicId: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { data, error } = await supabase
      .from('question_topics')
      .select('topic_id, is_active')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - topic doesn't exist or isn't active
        console.log(`📊 Topic ${topicId} not found or not active`)
        return false
      }
      console.error(`📊 Error verifying topic exists:`, error)
      throw error
    }

    console.log(`📊 Topic ${topicId} verified as existing and active`)
    return !!data
  } catch (error) {
    console.error(`Error in verifyTopicExists for topic ${topicId}:`, error)
    return false
  }
}

/**
 * Check if topic has questions
 */
async function checkTopicHasQuestions(topicId: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // First verify the topic exists
    const topicExists = await verifyTopicExists(topicId)
    if (!topicExists) {
      return false
    }
    
    // Then check for questions
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('is_active', true)
      
    if (error) {
      console.error(`Error checking questions for topic ${topicId}:`, error)
      throw error
    }

    const hasQuestions = count !== null && count > 0
    console.log(`📊 Topic ${topicId} has ${count || 0} questions`)
    return hasQuestions
  } catch (error) {
    console.error(`Error in checkTopicHasQuestions for topic ${topicId}:`, error)
    return false
  }
}

/**
 * Helper function to get cached topic or fetch if not cached/expired
 */
const getCachedTopic = async (topicId: string): Promise<TopicMetadata | null> => {
  const now = Date.now()
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to trigger cleanup
    cleanupCache()
  }
  
  const cached = topicCache.get(topicId)
  
  // Return cached data if it exists and is fresh
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('📊 dataService.getTopicById - Using cached data for:', topicId)
    return cached.data
  }
  
  // Fetch fresh data
  console.log('📊 dataService.getTopicById - Called with:', topicId)
  
  const isDbAvailable = await checkDatabaseAvailability()
  console.log('📊 dataService.getTopicById - Database available:', isDbAvailable)
  
  if (!isDbAvailable) {
    console.error('Database not available for getTopicById')
    return null
  }

  try {
    console.log('📊 dataService.getTopicById - Querying database for topic:', topicId)
    
    const { data: dbTopic, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📊 dataService.getTopicById - Topic not found:', topicId)
        // Cache null result to prevent repeated failed fetches
        topicCache.set(topicId, { data: null, timestamp: now })
        return null
      }
      throw error
    }
    
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
    
    // Cache the result
    topicCache.set(topicId, { data: result, timestamp: now })
    
    console.log('📊 dataService.getTopicById - Returning from database:', !!result)
    return result
  } catch (error) {
    console.error('📊 dataService.getTopicById - Database error:', error)
    return null
  }
}

// Helper function to clean up old cache entries
const cleanupCache = () => {
  const now = Date.now()
  const entriesToDelete: string[] = []
  
  for (const [key, value] of topicCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      entriesToDelete.push(key)
    }
  }
  
  entriesToDelete.forEach(key => topicCache.delete(key))
  
  // If cache is still too large, remove oldest entries
  if (topicCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(topicCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, topicCache.size - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => topicCache.delete(key))
  }
}

/**
 * Data service with proper database queries and foreign key relationships
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
      return {}
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
      return {}
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
      return {}
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
      return {}
    }
  },

  /**
   * Get topic by ID
   */
  async getTopicById(topicId: string): Promise<TopicMetadata | null> {
    return getCachedTopic(topicId)
  },

  /**
   * Get questions for a topic with proper foreign key relationship
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
      // First verify the topic exists and is active
      const topicExists = await verifyTopicExists(topicId)
      if (!topicExists) {
        console.log('📊 dataService.getQuestionsByTopic - Topic does not exist or is not active:', topicId)
        return []
      }

      console.log('📊 dataService.getQuestionsByTopic - Querying questions for verified topic:', topicId)
      const dbQuestions = await getQuestionsForTopic(topicId)
      
      console.log('📊 dataService.getQuestionsByTopic - Database questions result:', {
        count: dbQuestions.length,
        firstQuestion: dbQuestions[0] ? {
          id: dbQuestions[0].id,
          question_number: dbQuestions[0].question_number,
          type: dbQuestions[0].question_type,
          hasOptions: !!(dbQuestions[0].option_a && dbQuestions[0].option_b),
          question: dbQuestions[0].question ? dbQuestions[0].question.substring(0, 100) + '...' : 'No question text',
          hasSources: !!dbQuestions[0].sources,
          sourcesType: typeof dbQuestions[0].sources
        } : null
      })
      
      if (dbQuestions.length === 0) {
        console.log('📊 dataService.getQuestionsByTopic - No questions found in database')
        return []
      }
      
      // Transform questions with better error handling and source parsing
      const questions: QuizQuestion[] = []
      
      for (const dbQuestion of dbQuestions) {
        try {
          const transformedQuestion = dbQuestionToAppFormat(dbQuestion)
          
          // Validate that the question has required fields
          if (transformedQuestion.question && transformedQuestion.correct_answer) {
            questions.push(transformedQuestion)
          } else {
            console.warn('📊 Skipping invalid question:', {
              id: dbQuestion.id,
              question_number: dbQuestion.question_number,
              hasQuestion: !!transformedQuestion.question,
              hasCorrectAnswer: !!transformedQuestion.correct_answer
            })
          }
        } catch (transformError) {
          console.error('📊 Error transforming question:', transformError, {
            id: dbQuestion.id,
            question_number: dbQuestion.question_number
          })
        }
      }
      
      console.log('📊 dataService.getQuestionsByTopic - Transformed questions:', {
        count: questions.length,
        firstQuestion: dbQuestions[0] ? {
          id: dbQuestions[0].id,
          question_number: dbQuestions[0].question_number,
          type: dbQuestions[0].question_type,
          hasOptions: !!(dbQuestions[0].option_a && dbQuestions[0].option_b),
          question: dbQuestions[0].question ? dbQuestions[0].question.substring(0, 100) + '...' : 'No question text',
          hasSources: !!dbQuestions[0].sources,
          sourcesType: typeof dbQuestions[0].sources
        } : null
      })
      
      const result = cleanObjectContent(questions)
      console.log('📊 dataService.getQuestionsByTopic - Returning from database, count:', result.length)
      
      return result
    } catch (error) {
      console.error('📊 dataService.getQuestionsByTopic - Database error:', error)
      return []
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
      return await checkTopicHasQuestions(topicId)
    } catch (error) {
      console.error('Error checking if topic has questions:', error)
      return false
    }
  },

  /**
   * Clear the topic cache (useful for development or when data changes)
   */
  clearTopicCache(): void {
    topicCache.clear()
    console.log('📊 dataService: Topic cache cleared')
  },

  /**
   * Get categories with caching
   */
  async getCachedCategories(): Promise<any[]> {
    const now = Date.now()
    
    // Return cached data if available and fresh
    if (categoriesGlobalCache && (now - categoriesGlobalCache.timestamp) < CATEGORIES_CACHE_DURATION) {
      console.log('📊 dataService.getCachedCategories - Using cached data')
      return categoriesGlobalCache.data || []
    }
    
    try {
      console.log('📊 dataService.getCachedCategories - Fetching from API')
      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }
      
      const categories = data.categories || []
      
      // Cache the data
      categoriesGlobalCache = {
        data: categories,
        timestamp: now
      }
      
      console.log(`📊 dataService.getCachedCategories - Cached ${categories.length} categories`)
      return categories
    } catch (error) {
      console.error('📊 dataService.getCachedCategories - Error:', error)
      
      // Return cached data even if stale, as fallback
      if (categoriesGlobalCache?.data) {
        console.log('📊 dataService.getCachedCategories - Using stale cache as fallback')
        return categoriesGlobalCache.data
      }
      
      return []
    }
  },

  /**
   * Clear the categories cache
   */
  clearCategoriesCache(): void {
    categoriesGlobalCache = null
    console.log('📊 dataService: Categories cache cleared')
  }
}