"use client"

import { topicOperations, questionOperations, categoryOperations } from './database'
import { mockTopicsData, mockQuestionsData } from './mock-data'
import type { TopicMetadata, QuizQuestion } from './quiz-data'
import { allCategories } from './quiz-data'
import { cleanObjectContent } from './utils'

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
    // Try a simple database query with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 5000)
    )
    
    await Promise.race([
      topicOperations.getAll(),
      timeoutPromise
    ])
    
    isDatabaseAvailable = true
    lastDbCheck = now
    console.log('✅ Database is available')
    return true
  } catch (error) {
    isDatabaseAvailable = false
    lastDbCheck = now
    console.warn('⚠️ Database unavailable, falling back to mock data:', error)
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
  
  // Clean any citation strings from the content
  return cleanObjectContent(topic)
}

/**
 * Data service that tries database first, falls back to mock data
 */
export const dataService = {
  /**
   * Get all topics
   */
  async getAllTopics(): Promise<Record<string, TopicMetadata>> {
    try {
      const isDbAvailable = await checkDatabaseAvailability()
      
      if (isDbAvailable) {
        try {
          const dbTopics = await topicOperations.getAll()
          const topicsRecord: Record<string, TopicMetadata> = {}
          
          dbTopics.forEach(dbTopic => {
            const appTopic = dbTopicToAppFormat(dbTopic)
            topicsRecord[appTopic.topic_id] = appTopic
          })
          
          console.log(`📊 Loaded ${Object.keys(topicsRecord).length} topics from database`)
          return topicsRecord
        } catch (error) {
          console.error('Error fetching topics from database:', error)
        }
      }
    } catch (error) {
      console.error('Database availability check failed:', error)
    }
    
    // Fallback to mock data (also clean it)
    console.log(`📋 Using mock data: ${Object.keys(mockTopicsData).length} topics`)
    return cleanObjectContent(mockTopicsData)
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
    
    // Fallback to mock data (also clean it)
    const topic = mockTopicsData[topicId] || null
    return topic ? cleanObjectContent(topic) : null
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
        // Clean citation strings from questions
        return cleanObjectContent(questions)
      } catch (error) {
        console.error('Error fetching questions from database:', error)
      }
    }
    
    // Fallback to mock data (also clean it)
    const questions = mockQuestionsData[topicId] || []
    return cleanObjectContent(questions)
  },

  /**
   * Get all questions (by fetching all topics first, then questions for each)
   */
  async getAllQuestions(): Promise<Record<string, QuizQuestion[]>> {
    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        // Get all topics first
        const topics = await this.getAllTopics()
        const questionsRecord: Record<string, QuizQuestion[]> = {}
        
        // Fetch questions for each topic
        await Promise.all(
          Object.keys(topics).map(async (topicId) => {
            const questions = await this.getQuestionsByTopic(topicId)
            if (questions.length > 0) {
              questionsRecord[topicId] = questions
            }
          })
        )
        
        return questionsRecord
      } catch (error) {
        console.error('Error fetching all questions from database:', error)
      }
    }
    
    // Fallback to mock data (also clean it)
    return cleanObjectContent(mockQuestionsData)
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
   * Get categories dynamically from database
   * Note: This method is deprecated in favor of the /api/categories endpoint
   * which provides canonical categories with synonym mapping
   */
  async getCategories(): Promise<Array<{ name: string; emoji: string; description?: string }>> {
    // Try to use the new canonical categories API first
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const { categories } = await response.json()
        console.log(`📊 Loaded ${categories.length} canonical categories from API`)
        return categories.map((cat: any) => ({
          name: cat.name,
          emoji: cat.emoji || '📚',
          description: cat.description || ''
        }))
      }
    } catch (error) {
      console.error('Failed to fetch canonical categories from API:', error)
    }

    const isDbAvailable = await checkDatabaseAvailability()
    
    if (isDbAvailable) {
      try {
        // Try to get categories from actual topic data first (more dynamic)
        const categoriesFromTopics = await categoryOperations.getFromTopics()
        if (categoriesFromTopics.length > 0) {
          console.log(`📊 Loaded ${categoriesFromTopics.length} categories from topic data`)
          return categoriesFromTopics
        }
        
        // Fallback to categories table
        const categoriesFromTable = await categoryOperations.getAll()
        if (categoriesFromTable) {
          const formattedCategories = categoriesFromTable.map(cat => ({
            name: cat.name,
            emoji: cat.emoji,
            description: cat.description || ''
          }))
          console.log(`📊 Loaded ${formattedCategories.length} categories from categories table`)
          return formattedCategories
        }
      } catch (error) {
        console.error('Error fetching categories from database:', error)
      }
    }
    
    // Fallback to hardcoded categories
    console.log(`📋 Using hardcoded categories: ${allCategories.length} categories`)
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