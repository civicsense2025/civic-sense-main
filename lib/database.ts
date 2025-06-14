import { supabase } from "./supabase"
import type { TopicMetadata, QuizQuestion, QuestionType } from "./quiz-data"
import type { 
  DbQuestionTopic, 
  DbQuestion, 
  DbUserQuizAttempt, 
  DbUserProgress,
  DbQuestionFeedback,
  DbQuestionTopicInsert,
  DbQuestionInsert,
  DbUserQuizAttemptInsert,
  DbUserProgressInsert,
  DbQuestionFeedbackInsert,
  DbQuestionTopicUpdate,
  DbQuestionUpdate,
  DbUserQuizAttemptUpdate,
  DbUserProgressUpdate,
  DbQuestionFeedbackUpdate
} from "./database.types"

// Database types that match our tables
// Database types that match our tables are now imported above

// Topic operations
export const topicOperations = {
  // Get all active topics
  async getAll() {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data as DbQuestionTopic[]
  },

  // Get topic by topic_id
  async getById(topicId: string) {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data as DbQuestionTopic
  },

  // Get topics by category
  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .contains('categories', [category])
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data as DbQuestionTopic[]
  },

  // Search topics
  async search(query: string) {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .or(`topic_title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data as DbQuestionTopic[]
  },

  // Create new topic
  async create(topic: DbQuestionTopicInsert) {
    const { data, error } = await supabase
      .from('question_topics')
      .insert(topic)
      .select()
      .single()

    if (error) throw error
    return data as DbQuestionTopic
  },

  // Update topic
  async update(topicId: string, updates: Partial<DbQuestionTopic>) {
    const { data, error } = await supabase
      .from('question_topics')
      .update(updates)
      .eq('topic_id', topicId)
      .select()
      .single()

    if (error) throw error
    return data as DbQuestionTopic
  },

  // Convert DB topic to app format
  toAppFormat(dbTopic: DbQuestionTopic): TopicMetadata {
    return {
      topic_id: dbTopic.topic_id,
      topic_title: dbTopic.topic_title,
      description: dbTopic.description,
      why_this_matters: dbTopic.why_this_matters,
      emoji: dbTopic.emoji,
      date: dbTopic.date,
      dayOfWeek: dbTopic.day_of_week,
      categories: Array.isArray(dbTopic.categories) ? dbTopic.categories as string[] : [],
    }
  }
}

// Question operations
export const questionOperations = {
  // Get questions by topic
  async getByTopic(topicId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (error) throw error
    return data as DbQuestion[]
  },

  // Get question by ID
  async getById(questionId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data as DbQuestion
  },

  // Get questions by category
  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('topic_id', { ascending: true })
      .order('question_number', { ascending: true })

    if (error) throw error
    return data as DbQuestion[]
  },

  // Get questions by difficulty
  async getByDifficulty(level: number) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('difficulty_level', level)
      .eq('is_active', true)
      .order('topic_id', { ascending: true })
      .order('question_number', { ascending: true })

    if (error) throw error
    return data as DbQuestion[]
  },

  // Create new question
  async create(question: DbQuestionInsert) {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single()

    if (error) throw error
    return data as DbQuestion
  },

  // Bulk create questions
  async createMany(questions: DbQuestionInsert[]) {
    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select()

    if (error) throw error
    return data as DbQuestion[]
  },

  // Update question
  async update(questionId: string, updates: Partial<DbQuestion>) {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single()

    if (error) throw error
    return data as DbQuestion
  },

  // Convert DB question to app format
  toAppFormat(dbQuestion: DbQuestion): QuizQuestion {
    return {
      topic_id: dbQuestion.topic_id,
      question_number: dbQuestion.question_number,
      question_type: dbQuestion.question_type as QuestionType,
      category: dbQuestion.category,
      question: dbQuestion.question,
      option_a: dbQuestion.option_a ?? undefined,
      option_b: dbQuestion.option_b ?? undefined,
      option_c: dbQuestion.option_c ?? undefined,
      option_d: dbQuestion.option_d ?? undefined,
      correct_answer: dbQuestion.correct_answer,
      hint: dbQuestion.hint,
      explanation: dbQuestion.explanation,
      tags: Array.isArray(dbQuestion.tags) ? dbQuestion.tags as string[] : [],
      sources: Array.isArray(dbQuestion.sources) ? dbQuestion.sources as Array<{ name: string; url: string }> : [],
    }
  }
}

// Quiz attempt operations
export const quizAttemptOperations = {
  // Start a new quiz attempt
  async start(userId: string, topicId: string, totalQuestions: number) {
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .insert({
        user_id: userId,
        topic_id: topicId,
        total_questions: totalQuestions,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as DbUserQuizAttempt
  },

  // Complete a quiz attempt
  async complete(attemptId: string, score: number, correctAnswers: number, timeSpentSeconds?: number) {
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score,
        correct_answers: correctAnswers,
        time_spent_seconds: timeSpentSeconds,
        is_completed: true
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (error) throw error
    return data as DbUserQuizAttempt
  },

  // Get user's quiz attempts
  async getByUser(userId: string, limit?: number) {
    let query = supabase
      .from('user_quiz_attempts')
      .select(`
        *,
        question_topics (
          topic_title,
          emoji
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data as (DbUserQuizAttempt & { question_topics: { topic_title: string; emoji: string } })[]
  },

  // Get completed quizzes for a user
  async getCompletedByUser(userId: string) {
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('topic_id')
      .eq('user_id', userId)
      .eq('is_completed', true)

    if (error) throw error
    return data.map(row => row.topic_id)
  }
}

// User progress operations
export const userProgressOperations = {
  // Get or create user progress
  async getOrCreate(userId: string) {
    // First try to get existing progress
    const { data: existing, error: getError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return existing as DbUserProgress
    }

    // If not found, create new progress record
    if (getError?.code === 'PGRST116') { // No rows returned
      const { data, error } = await supabase
        .from('user_progress')
        .insert({ user_id: userId })
        .select()
        .single()

      if (error) throw error
      return data as DbUserProgress
    }

    throw getError
  },

  // Update user progress after quiz completion
  async updateAfterQuiz(userId: string, correctAnswers: number, totalQuestions: number) {
    const progress = await this.getOrCreate(userId)
    const today = new Date().toISOString().split('T')[0]
    const lastActivityDate = progress.last_activity_date

    // Calculate new streak
    let newStreak = 1
    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate)
      const todayDate = new Date(today)
      const diffTime = todayDate.getTime() - lastDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        newStreak = (progress.current_streak ?? 0) + 1
      } else if (diffDays === 0) {
        // Same day
        newStreak = progress.current_streak ?? 1
      }
      // If more than 1 day, streak resets to 1
    }

    const { data, error } = await supabase
      .from('user_progress')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, progress.longest_streak ?? 0),
        last_activity_date: today,
        total_quizzes_completed: (progress.total_quizzes_completed ?? 0) + 1,
        total_questions_answered: (progress.total_questions_answered ?? 0) + totalQuestions,
        total_correct_answers: (progress.total_correct_answers ?? 0) + correctAnswers
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as DbUserProgress
  }
}

// Utility functions
export const dbUtils = {
  // Get comprehensive quiz data (topics + questions)
  async getTopicWithQuestions(topicId: string) {
    const [topic, questions] = await Promise.all([
      topicOperations.getById(topicId),
      questionOperations.getByTopic(topicId)
    ])

    return {
      topic,
      questions
    }
  },

  // Get user's dashboard data
  async getUserDashboard(userId: string) {
    const [progress, recentAttempts, completedTopics] = await Promise.all([
      userProgressOperations.getOrCreate(userId),
      quizAttemptOperations.getByUser(userId, 10),
      quizAttemptOperations.getCompletedByUser(userId)
    ])

    return {
      progress,
      recentAttempts,
      completedTopics
    }
  },

  // Import topics and questions from existing data
  async importFromStaticData(topicsData: Record<string, TopicMetadata>, questionsData: Record<string, QuizQuestion[]>) {
    const results = []

    for (const [topicId, topicMeta] of Object.entries(topicsData)) {
      // Create topic
      const dbTopic: DbQuestionTopicInsert = {
        topic_id: topicMeta.topic_id,
        topic_title: topicMeta.topic_title,
        description: topicMeta.description,
        why_this_matters: topicMeta.why_this_matters,
        emoji: topicMeta.emoji,
        date: topicMeta.date,
        day_of_week: topicMeta.dayOfWeek,
        categories: topicMeta.categories as any, // Cast to Json
        is_active: true
      }

      const createdTopic = await topicOperations.create(dbTopic)

      // Create questions
      const questions = questionsData[topicId] || []
      const dbQuestions: DbQuestionInsert[] = questions.map(q => ({
        topic_id: q.topic_id,
        question_number: q.question_number,
        question_type: q.question_type,
        category: q.category,
        question: q.question,
        option_a: q.option_a ?? null,
        option_b: q.option_b ?? null,
        option_c: q.option_c ?? null,
        option_d: q.option_d ?? null,
        correct_answer: q.correct_answer,
        hint: q.hint,
        explanation: q.explanation,
        tags: q.tags as any, // Cast to Json
        sources: q.sources as any, // Cast to Json
        difficulty_level: 2, // Default difficulty
        is_active: true
      }))

      const createdQuestions = dbQuestions.length > 0 
        ? await questionOperations.createMany(dbQuestions)
        : []

      results.push({
        topic: createdTopic,
        questions: createdQuestions
      })
    }

    return results
  }
}

// Question feedback operations
export const questionFeedbackOperations = {
  // Submit a rating (thumbs up/down)
  async submitRating(questionId: string, userId: string, rating: 'up' | 'down') {
    const { data, error } = await supabase
      .from('question_feedback')
      .upsert({
        question_id: questionId,
        user_id: userId,
        feedback_type: 'rating',
        rating: rating
      }, {
        onConflict: 'question_id,user_id,feedback_type'
      })
      .select()
      .single()

    if (error) throw error
    return data as DbQuestionFeedback
  },

  // Submit a report
  async submitReport(
    questionId: string, 
    userId: string, 
    reason: string, 
    details?: string
  ) {
    const { data, error } = await supabase
      .from('question_feedback')
      .upsert({
        question_id: questionId,
        user_id: userId,
        feedback_type: 'report',
        report_reason: reason,
        report_details: details || null
      }, {
        onConflict: 'question_id,user_id,feedback_type'
      })
      .select()
      .single()

    if (error) throw error
    return data as DbQuestionFeedback
  },

  // Get user's feedback for a question
  async getUserFeedback(questionId: string, userId: string) {
    try {
      console.log('Fetching user feedback for question:', questionId, 'user:', userId)
      
      const { data, error } = await supabase
        .from('question_feedback')
        .select('*')
        .eq('question_id', questionId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user feedback:', error)
        throw error
      }
      
      console.log('User feedback fetched successfully:', data)
      return data as DbQuestionFeedback[]
    } catch (err) {
      console.error('Exception in getUserFeedback:', err)
      throw err
    }
  },

  // Get feedback statistics for a question
  async getQuestionStats(questionId: string) {
    try {
      console.log('Fetching question stats for:', questionId)
      
      const { data, error } = await supabase
        .from('question_feedback_stats')
        .select('*')
        .eq('question_id', questionId)
        .single()

      if (error) {
        console.log('Question stats error:', error)
        if (error.code !== 'PGRST116') {
          console.error('Unexpected error fetching question stats:', error)
          throw error
        }
        // PGRST116 means no rows found, which is expected for new questions
        console.log('No stats found for question (expected for new questions)')
        return null
      }
      
      console.log('Question stats fetched successfully:', data)
      return data
    } catch (err) {
      console.error('Exception in getQuestionStats:', err)
      throw err
    }
  },

  // Get feedback statistics for multiple questions
  async getQuestionsStats(questionIds: string[]) {
    const { data, error } = await supabase
      .from('question_feedback_stats')
      .select('*')
      .in('question_id', questionIds)

    if (error) throw error
    return data
  },

  // Get questions with low quality scores (for admin review)
  async getLowQualityQuestions(threshold: number = 50) {
    const { data, error } = await supabase
      .from('question_feedback_stats')
      .select('*')
      .lt('quality_score', threshold)
      .order('quality_score', { ascending: true })

    if (error) throw error
    return data
  },

  // Delete user's feedback
  async deleteFeedback(questionId: string, userId: string, feedbackType: 'rating' | 'report') {
    const { error } = await supabase
      .from('question_feedback')
      .delete()
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .eq('feedback_type', feedbackType)

    if (error) throw error
  }
}

// Category operations
export const categoryOperations = {
  // Get all categories from the categories table
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data
  },

  // Get unique categories from actual topic data (more dynamic)
  async getFromTopics() {
    const { data, error } = await supabase
      .from('question_topics')
      .select('categories')
      .eq('is_active', true)

    if (error) throw error

    // Extract unique categories from all topics
    const categorySet = new Set<string>()
    data.forEach(topic => {
      if (topic.categories && Array.isArray(topic.categories)) {
        (topic.categories as string[]).forEach(cat => {
          if (typeof cat === 'string') {
            categorySet.add(cat)
          }
        })
      }
    })

    // Convert to array and sort
    const uniqueCategories = Array.from(categorySet).sort()

    // Get category details from the categories table for each unique category
    if (uniqueCategories.length > 0) {
      const { data: categoryDetails, error: categoryError } = await supabase
        .from('categories')
        .select('name, emoji, description')
        .in('name', uniqueCategories)
        .eq('is_active', true)

      if (categoryError) throw categoryError

      // Create a map for quick lookup
      const categoryMap = new Map(categoryDetails.map(cat => [cat.name, cat]))

      // Return categories with their details, maintaining order
      return uniqueCategories.map(categoryName => {
        const details = categoryMap.get(categoryName)
        return {
          name: categoryName,
          emoji: details?.emoji || '📚',
          description: details?.description || ''
        }
      })
    }

    return []
  },

  // Get category by name
  async getByName(name: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
} 