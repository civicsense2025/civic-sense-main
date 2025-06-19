// lib/data-service.ts - Optimized with database-level filtering

import { topicOperations, questionOperations, categoryOperations } from './database'
import { mockTopicsData, mockQuestionsData } from './mock-data'
import type { TopicMetadata, QuizQuestion } from './quiz-data'
import { allCategories } from './quiz-data'
import { cleanObjectContent } from './utils'
import { supabase } from './supabase' // Correct import path

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
    console.warn(`⚠️ Database unavailable: ${errorMessage}. Using mock data.`)
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
    is_breaking: dbTopic.is_breaking === true, // Include breaking news flag
    is_featured: dbTopic.is_featured === true, // Include featured topics flag
  }
  
  return cleanObjectContent(topic)
}

/**
 * Filter mock data to only include topics with valid dates
 */
function getValidMockTopics(): Record<string, TopicMetadata> {
  const validTopics: Record<string, TopicMetadata> = {}
  
  Object.entries(mockTopicsData).forEach(([topicId, topic]) => {
    // Only include topics with valid dates
    if (topic.date && 
        topic.date !== null && 
        topic.date !== undefined && 
        !(typeof topic.date === 'string' && topic.date.trim() === '')) {
      validTopics[topicId] = topic
    }
  })
  
  return cleanObjectContent(validTopics)
}

/**
 * Get topics in date range (database-level filtering)
 */
async function getTopicsInDateRange(startDate: Date, endDate: Date): Promise<any[]> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // For Supabase - use a more robust approach to filter out invalid dates
    // Note: Removing any implicit limits to ensure we get ALL topics in range
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .filter('date', 'gte', startDate.toISOString().split('T')[0])
      .filter('date', 'lte', endDate.toISOString().split('T')[0])
      .eq('is_active', true) // Only active topics
      .order('is_breaking', { ascending: false }) // Breaking first
      .order('is_featured', { ascending: false }) // Featured second  
      .order('date', { ascending: false }); // Most recent first

    if (error) {
      console.warn('Supabase query error:', error.message)
      throw error;
    }
    
    if (!data) {
      console.warn('No data returned from Supabase')
      return [];
    }
    
    // Additional filtering to ensure valid dates and exclude empty/invalid
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
    // Extract error message safely
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message)
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error)
    }
    
    console.error(`Error in getTopicsInDateRange: ${errorMessage}`);
    
    // Fallback to filtering in memory
    try {
      const allTopics = await topicOperations.getAll();
      return allTopics.filter(topic => {
        if (!topic.date) return false;
        try {
          const topicDate = new Date(topic.date);
          return !isNaN(topicDate.getTime()) && topicDate >= startDate && topicDate <= endDate;
        } catch (e) {
          return false;
        }
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // Return empty array as last resort
    }
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
    
    // Load ALL active topics with valid dates - no limits!
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .eq('is_active', true) // Only active topics
      .order('is_breaking', { ascending: false }) // Breaking first
      .order('is_featured', { ascending: false }) // Featured second
      .order('date', { ascending: false }); // Most recent first

    if (error) {
      console.warn('Supabase query error:', error.message)
      throw error;
    }
    
    if (!data) {
      console.warn('No data returned from Supabase')
      return [];
    }
    
    // Additional filtering to ensure valid dates and exclude empty/invalid
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
    // Extract error message safely
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message)
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error)
    }
    
    console.error(`Error in getAllTopicsWithValidDates: ${errorMessage}`);
    
    // Fallback to filtering in memory
    try {
      const allTopics = await topicOperations.getAll();
      return allTopics.filter(topic => {
        if (!topic.date) return false;
        try {
          const date = new Date(topic.date);
          return !isNaN(date.getTime());
        } catch (e) {
          return false;
        }
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // Return empty array as last resort
    }
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
      .order('is_breaking', { ascending: false }) // Breaking news first
      .order('is_featured', { ascending: false }) // Featured topics second
      .order('created_at', { ascending: false }) // Then by creation time

    if (error) {
      console.warn('Supabase query error for specific date:', error.message)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error(`Error getting topics for date ${targetDate.toISOString().split('T')[0]}:`, error)
    
    // Fallback to filtering all topics
    try {
      const allTopics = await topicOperations.getAll()
      const dateString = targetDate.toISOString().split('T')[0]
      return allTopics.filter(topic => topic.date === dateString)
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return []
    }
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
      .order('is_breaking', { ascending: false }) // Breaking featured first
      .order('created_at', { ascending: false }) as any // Cast to any for new fields

    if (error) {
      console.warn('Supabase query error for featured topics:', error.message)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error getting featured topics:', error)
    
    // Fallback to filtering all topics
    try {
      const allTopics = await topicOperations.getAll()
      return allTopics.filter(topic => (topic as any).is_featured === true)
    } catch (fallbackError) {
      console.error('Featured topics fallback also failed:', fallbackError)
      return []
    }
  }
}

/**
 * Data service with optimized database queries
 */
export const dataService = {
  /**
   * Get all featured topics regardless of date (always show these)
   */
  async getFeaturedTopics(): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
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
      }
    }
    
    // Fallback to mock data filtered by featured
    const validTopics = getValidMockTopics()
    const filteredTopics: Record<string, TopicMetadata> = {}
    
    Object.entries(validTopics).forEach(([topicId, topic]) => {
      try {
        if (topic.is_featured === true) {
          filteredTopics[topicId] = topic
        }
      } catch (e) {
        // Skip invalid topics
      }
    })
    
    return cleanObjectContent(filteredTopics)
  },

  /**
   * Get all topics for a specific date (prioritizes breaking news)
   */
  async getTopicsForDate(targetDate: Date): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
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
      }
    }
    
    // Fallback to mock data filtered by date
    const validTopics = getValidMockTopics()
    const targetDateString = targetDate.toISOString().split('T')[0]
    const filteredTopics: Record<string, TopicMetadata> = {}
    
    Object.entries(validTopics).forEach(([topicId, topic]) => {
      try {
        if (topic.date && topic.date === targetDateString) {
          filteredTopics[topicId] = topic
        }
      } catch (e) {
        // Skip invalid dates
      }
    })
    
    return cleanObjectContent(filteredTopics)
  },

  /**
   * Get topics in a date range
   */
  async getTopicsInRange(startDate: Date, endDate: Date): Promise<Record<string, TopicMetadata>> {
    // Check database availability
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        const validTopics: Record<string, TopicMetadata> = {}
        let dbTopics: any[] = []
        
        if (supabase) {
          // Use database-level filtering with enhanced approach
          dbTopics = await getTopicsInDateRange(startDate, endDate)
        } else {
          dbTopics = await topicOperations.getAll()
          // Filter in memory if needed
          dbTopics = dbTopics.filter((topic) => {
            if (!topic.date) return false
            try {
              const topicDate = new Date(topic.date)
              return !isNaN(topicDate.getTime()) && topicDate >= startDate && topicDate <= endDate
            } catch (e) {
              return false
            }
          })
        }
        
        // Convert to app format
        dbTopics.forEach((dbTopic) => {
          const topic = dbTopicToAppFormat(dbTopic)
          validTopics[topic.topic_id] = topic
        })
        
        console.log(`📊 Loaded ${Object.keys(validTopics).length} topics in date range from database`)
        return validTopics
      } catch (error) {
        console.error('Error loading topics from database:', error)
      }
    }
    
    // Fallback to mock data
    const validTopics = getValidMockTopics()
    const filteredTopics: Record<string, TopicMetadata> = {}
    
    Object.entries(validTopics).forEach(([topicId, topic]) => {
      try {
        if (topic.date) {
          const topicDate = new Date(topic.date)
          if (!isNaN(topicDate.getTime()) && topicDate >= startDate && topicDate <= endDate) {
            filteredTopics[topicId] = topic
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    })
    
    return cleanObjectContent(filteredTopics)
  },

  /**
   * Get all topics (now optimized to only fetch valid ones)
   */
  async getAllTopics(): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        // Get only topics with valid dates from database
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
      }
    }
    
    // Fallback to filtered mock data
    console.log(`📋 Using filtered mock data`)
    return getValidMockTopics()
  },

  /**
   * Get topic by ID
   */
  async getTopicById(topicId: string): Promise<TopicMetadata | null> {
    console.log('📊 dataService.getTopicById - Called with:', topicId)
    
    const isDbAvailable = await checkDatabaseAvailability()
    console.log('📊 dataService.getTopicById - Database available:', isDbAvailable)
    
    if (isDbAvailable) {
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
      }
    }
    
    // Fallback to mock data
    console.log('📊 dataService.getTopicById - Falling back to mock data')
    const validMockTopics = getValidMockTopics()
    const result = validMockTopics[topicId] || null
    console.log('📊 dataService.getTopicById - Mock data result:', {
      found: !!result,
      topicData: result ? {
        topic_id: result.topic_id,
        topic_title: result.topic_title,
        emoji: result.emoji,
        date: result.date
      } : null
    })
    return result
  },

  /**
   * Get questions for a topic
   */
  async getQuestionsByTopic(topicId: string): Promise<QuizQuestion[]> {
    console.log('📊 dataService.getQuestionsByTopic - Called with:', topicId)
    
    const isDbAvailable = await checkDatabaseAvailability()
    console.log('📊 dataService.getQuestionsByTopic - Database available:', isDbAvailable)
    
    if (isDbAvailable) {
      try {
        console.log('📊 dataService.getQuestionsByTopic - Querying database for questions:', topicId)
        const dbQuestions = await questionOperations.getByTopic(topicId)
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
      }
    }
    
    // Fallback to mock data
    console.log('📊 dataService.getQuestionsByTopic - Falling back to mock data')
    const questions = mockQuestionsData[topicId] || []
    console.log('📊 dataService.getQuestionsByTopic - Mock data result:', {
      count: questions.length,
      firstQuestion: questions[0] ? {
        question_number: questions[0].question_number,
        question_type: questions[0].question_type,
        hasOptions: !!(questions[0].option_a && questions[0].option_b)
      } : null
    })
    
    const result = cleanObjectContent(questions)
    console.log('📊 dataService.getQuestionsByTopic - Returning from mock data, count:', result.length)
    return result
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
    
    // Fallback to hardcoded categories
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
    
    if (isDbAvailable) {
      try {
        return await questionOperations.checkTopicHasQuestions(topicId)
      } catch (error) {
        console.error('Error checking if topic has questions:', error)
      }
    }
    
    // Fallback to mock data
    const questions = mockQuestionsData[topicId] || []
    return questions.length > 0
  }
}

// Add these methods to your topicOperations (you'll need to implement these in your database layer):
/*
// In your database operations file, add these optimized queries:

// Get topics with valid dates only
async getAllWithValidDates() {
  return await db.query(`
    SELECT * FROM topics 
    WHERE date IS NOT NULL 
    AND date != '' 
    AND date != 'null' 
    AND date != 'undefined'
    ORDER BY date DESC
  `)
}

// Get topics in date range (database-level filtering)
async getInDateRange(startDate: Date, endDate: Date) {
  return await db.query(`
    SELECT * FROM topics 
    WHERE date IS NOT NULL 
    AND date != '' 
    AND date != 'null' 
    AND date != 'undefined'
    AND date >= ? 
    AND date <= ?
    ORDER BY date DESC
  `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]])
}
*/