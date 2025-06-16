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
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .filter('date', 'gte', startDate.toISOString().split('T')[0])
      .filter('date', 'lte', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

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
    
    // Only filter for date IS NOT NULL in Supabase
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .filter('date', 'not.is', null)
      .order('date', { ascending: false });

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
 * Data service with optimized database queries
 */
export const dataService = {
  /**
   * Get topics within a date range (optimized for lazy loading)
   */
  async getTopicsInRange(startDate: Date, endDate: Date): Promise<Record<string, TopicMetadata>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        // Use database-level filtering for better performance
        const dbTopics = await getTopicsInDateRange(startDate, endDate);
        const topicsRecord: Record<string, TopicMetadata> = {}
        
        dbTopics.forEach((dbTopic: any) => {
          const appTopic = dbTopicToAppFormat(dbTopic)
          topicsRecord[appTopic.topic_id] = appTopic
        })
        
        console.log(`📊 Loaded ${Object.keys(topicsRecord).length} topics from database in date range`)
        return topicsRecord
      } catch (error) {
        console.error('Error fetching topics in range from database:', error)
      }
    }
    
    // Fallback: filter mock data by date range
    const validMockTopics = getValidMockTopics()
    const filteredTopics: Record<string, TopicMetadata> = {}
    
    Object.entries(validMockTopics).forEach(([topicId, topic]) => {
      try {
        let topicDate: Date | null = null
        
        if (typeof topic.date === 'string') {
          if (topic.date.includes('-') && topic.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = topic.date.split('-').map(Number)
            topicDate = new Date(year, month - 1, day)
          } else {
            topicDate = new Date(topic.date)
          }
        }
        
        if (topicDate && 
            !isNaN(topicDate.getTime()) && 
            topicDate >= startDate && 
            topicDate <= endDate) {
          filteredTopics[topicId] = topic
        }
      } catch (error) {
        console.warn(`Error parsing date for topic ${topic.topic_title}:`, error)
      }
    })
    
    console.log(`📋 Using mock data: ${Object.keys(filteredTopics).length} topics in date range`)
    return filteredTopics
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
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        const dbTopic = await topicOperations.getById(topicId)
        return dbTopic ? dbTopicToAppFormat(dbTopic) : null
      } catch (error) {
        console.error('Error fetching topic from database:', error)
      }
    }
    
    // Fallback to mock data
    const validMockTopics = getValidMockTopics()
    return validMockTopics[topicId] || null
  },

  /**
   * Get questions for a topic
   */
  async getQuestionsByTopic(topicId: string): Promise<QuizQuestion[]> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        const dbQuestions = await questionOperations.getByTopic(topicId)
        const questions = dbQuestions.map(dbQuestion => questionOperations.toAppFormat(dbQuestion))
        return cleanObjectContent(questions)
      } catch (error) {
        console.error('Error fetching questions from database:', error)
      }
    }
    
    // Fallback to mock data
    const questions = mockQuestionsData[topicId] || []
    return cleanObjectContent(questions)
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