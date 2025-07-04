import { createClient } from '@supabase/supabase-js'
import type { Database } from '@civicsense/types'
import type { TopicMetadata, QuizQuestion, QuestionType, MultipleChoiceQuestion } from '@civicsense/types'
import { MultiplayerRoom, MultiplayerPlayer } from '@civicsense/types'

// Define Tables types from Database type
type Tables = Database['public']['Tables']
type TableRow<T extends keyof Tables> = Tables[T]['Row']
type TableInsert<T extends keyof Tables> = Tables[T]['Insert']
type TableUpdate<T extends keyof Tables> = Tables[T]['Update']

// Re-export database types for convenience
export type { Database }
export type { Tables }
export type { TableRow, TableInsert, TableUpdate }

// Database types using the correct structure
export type DbQuestionTopic = TableRow<'question_topics'>
export type DbQuestion = TableRow<'questions'>
export type DbUserQuizAttempt = TableRow<'user_quiz_attempts'>
export type DbUserProgress = TableRow<'user_progress'>
export type DbQuestionFeedback = TableRow<'question_feedback'>

export type DbQuestionTopicInsert = TableInsert<'question_topics'>
export type DbQuestionInsert = TableInsert<'questions'>
export type DbUserQuizAttemptInsert = TableInsert<'user_quiz_attempts'>
export type DbUserProgressInsert = TableInsert<'user_progress'>
export type DbQuestionFeedbackInsert = TableInsert<'question_feedback'>

export type DbQuestionTopicUpdate = TableUpdate<'question_topics'>
export type DbQuestionUpdate = TableUpdate<'questions'>
export type DbUserQuizAttemptUpdate = TableUpdate<'user_quiz_attempts'>
export type DbUserProgressUpdate = TableUpdate<'user_progress'>
export type DbQuestionFeedbackUpdate = TableUpdate<'question_feedback'>

// Additional types for enhanced gamification
export type DbUserCategorySkill = TableRow<'user_category_skills'>
export type DbUserCategorySkillInsert = TableInsert<'user_category_skills'>
export type DbUserCategorySkillUpdate = TableUpdate<'user_category_skills'>

export type DbUserAchievement = TableRow<'user_achievements'>
export type DbUserAchievementInsert = TableInsert<'user_achievements'>

export type DbUserCustomDeck = TableRow<'user_custom_decks'>
export type DbUserCustomDeckInsert = TableInsert<'user_custom_decks'>
export type DbUserCustomDeckUpdate = TableUpdate<'user_custom_decks'>

export type DbUserDeckContent = TableRow<'user_deck_content'>
export type DbUserDeckContentInsert = TableInsert<'user_deck_content'>

export type DbUserQuestionMemory = TableRow<'user_question_memory'>
export type DbUserQuestionMemoryInsert = TableInsert<'user_question_memory'>
export type DbUserQuestionMemoryUpdate = TableUpdate<'user_question_memory'>

export type DbUserStreakHistory = TableRow<'user_streak_history'>
export type DbUserStreakHistoryInsert = TableInsert<'user_streak_history'>

export type DbUserLearningGoal = TableRow<'user_learning_goals'>
export type DbUserLearningGoalInsert = TableInsert<'user_learning_goals'>
export type DbUserLearningGoalUpdate = TableUpdate<'user_learning_goals'>

export type DbSourceMetadata = TableRow<'source_metadata'>

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Singleton Supabase client instance
 * Use this instead of creating multiple clients
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

/**
 * Helper function to create a new client with custom auth
 * Use this for server-side operations that need custom auth
 */
export function createCustomClient(customToken?: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      ...(customToken && { global: { headers: { Authorization: `Bearer ${customToken}` } } })
    }
  })
}

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
    try {
      // First check if junction table exists and has data
      const { data: junctionExists } = await supabase
        .from('question_topic_categories')
        .select('topic_id')
        .limit(1)
      
      if (junctionExists && junctionExists.length > 0) {
        // Use optimized junction table approach
        const { data: topicIds } = await supabase
          .from('question_topic_categories')
          .select('topic_id')
          .eq('category_id', category)
        
        if (!topicIds || topicIds.length === 0) {
          return []
        }
        
        const { data, error } = await supabase
          .from('question_topics')
          .select('*')
          .in('topic_id', topicIds.map(row => row.topic_id))
          .eq('is_active', true)
          .order('date', { ascending: true })

        if (error) throw error
        return data as DbQuestionTopic[]
      } else {
        // Fallback to JSONB approach if junction table not populated yet
        const { data, error } = await supabase
          .from('question_topics')
          .select('*')
          .eq('is_active', true)
          .order('date', { ascending: true })

        if (error) throw error
        
        // Filter client-side for matching category
        const filteredData = (data || []).filter(topic => {
          if (Array.isArray(topic.categories)) {
            return topic.categories.includes(category)
          }
          // Handle case where categories might be stored as string
          if (typeof topic.categories === 'string') {
            try {
              const parsed = JSON.parse(topic.categories)
              return Array.isArray(parsed) && parsed.includes(category)
            } catch {
              return topic.categories === category
            }
          }
          return false
        })
        
        return filteredData as DbQuestionTopic[]
      }
    } catch (error) {
      console.error(`Error getting topics by category '${category}':`, error)
      return []
    }
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
  toTopicAppFormat(dbTopic: DbQuestionTopic): TopicMetadata {
    return {
      topic_id: dbTopic.topic_id ?? '',
      topic_title: dbTopic.topic_title ?? '',
      description: dbTopic.description ?? '',
      why_this_matters: dbTopic.why_this_matters ?? '',
      emoji: dbTopic.emoji ?? '',
      date: dbTopic.date ?? '',
      dayOfWeek: dbTopic.day_of_week ?? '',
      categories: Array.isArray(dbTopic.categories) ? dbTopic.categories as string[] : [],
    }
  }
}

// Question operations
export const questionOperations = {
  // Get questions by topic
  async getByTopic(topicId: string) {
    console.log(`Database query: fetching questions for topic ${topicId}`)
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (error) {
      console.error(`Database error fetching questions for topic ${topicId}:`, error)
      throw error
    }
    
    console.log(`Database returned ${data?.length || 0} questions for topic ${topicId}`)
    
    // Check for potential duplicates at database level
    if (data && data.length > 0) {
      const questionNumbers = data.map(q => q.question_number)
      const uniqueNumbers = new Set(questionNumbers)
      
      if (questionNumbers.length !== uniqueNumbers.size) {
        console.warn(`Potential duplicate question numbers detected for topic ${topicId}:`, {
          total: questionNumbers.length,
          unique: uniqueNumbers.size,
          numbers: questionNumbers
        })
      }
      
      console.log(`Question numbers for topic ${topicId}:`, questionNumbers)
    }
    
    return data as DbQuestion[]
  },

  // Check if topic has questions without loading all question data
  async checkTopicHasQuestions(topicId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('is_active', true)

    if (error) {
      console.error(`Error checking questions for topic ${topicId}:`, error)
      throw error
    }

    return count !== null && count > 0
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
  toQuestionAppFormat(dbQuestion: DbQuestion): QuizQuestion {
    // Process sources with proper type assertions
    let processedSources: ProcessedSource[] = []
    
    if (dbQuestion.sources) {
      if (Array.isArray(dbQuestion.sources)) {
        processedSources = processSourceArray(dbQuestion.sources)
      } else if (typeof dbQuestion.sources === 'string') {
        try {
          const parsed = JSON.parse(dbQuestion.sources)
          if (Array.isArray(parsed)) {
            processedSources = processSourceArray(parsed)
          }
        } catch (error) {
          console.warn('Failed to parse sources JSON:', error)
        }
      }
    }
    
    // Handle multiple choice questions
    let qType: string | undefined = dbQuestion.question_type;
    if (!qType && (dbQuestion as any).type) {
      qType = (dbQuestion as any).type;
    }
    if (qType === 'multiple_choice') {
      return {
        topic_id: dbQuestion.topic_id ?? '',
        question_number: dbQuestion.question_number ?? 1,
        type: 'multiple_choice',
        category: dbQuestion.category ?? '',
        question: dbQuestion.question ?? '',
        option_a: dbQuestion.option_a ?? undefined,
        option_b: dbQuestion.option_b ?? undefined,
        option_c: dbQuestion.option_c ?? undefined,
        option_d: dbQuestion.option_d ?? undefined,
        correct_answer: dbQuestion.correct_answer ?? '',
        hint: dbQuestion.hint ?? '',
        explanation: dbQuestion.explanation ?? '',
        tags: Array.isArray(dbQuestion.tags) ? dbQuestion.tags as string[] : [],
        sources: processedSources,
        options: [
          dbQuestion.option_a ?? '',
          dbQuestion.option_b ?? '',
          dbQuestion.option_c ?? '',
          dbQuestion.option_d ?? ''
        ].filter(Boolean) as string[]
      } as MultipleChoiceQuestion
    }

    // For other types, return the base structure and cast as QuizQuestion
    return {
      topic_id: dbQuestion.topic_id ?? '',
      question_number: dbQuestion.question_number ?? 1,
      type: qType as QuestionType,
      category: dbQuestion.category ?? '',
      question: dbQuestion.question ?? '',
      option_a: dbQuestion.option_a ?? undefined,
      option_b: dbQuestion.option_b ?? undefined,
      option_c: dbQuestion.option_c ?? undefined,
      option_d: dbQuestion.option_d ?? undefined,
      correct_answer: dbQuestion.correct_answer ?? '',
      hint: dbQuestion.hint ?? '',
      explanation: dbQuestion.explanation ?? '',
      tags: Array.isArray(dbQuestion.tags) ? dbQuestion.tags as string[] : [],
      sources: processedSources,
    } as QuizQuestion
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
        time_spent_seconds: typeof timeSpentSeconds === 'number' ? timeSpentSeconds : null,
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
    // Handle the fact that Supabase returns question_topics as an array but we expect a single object
    return data.map(attempt => ({
      ...attempt,
      question_topics: Array.isArray(attempt.question_topics) 
        ? attempt.question_topics[0] || { topic_title: '', emoji: '' }
        : attempt.question_topics
    })) as (DbUserQuizAttempt & { question_topics: { topic_title: string; emoji: string } })[]
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
      // Ensure today is a string before passing to Date constructor
      const todayDate = today ? new Date(today) : new Date()
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
        last_activity_date: today ?? null,
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
        description: topicMeta.description ?? '',
        why_this_matters: topicMeta.why_this_matters,
        emoji: topicMeta.emoji ?? '',
        date: topicMeta.date ?? '',
        day_of_week: topicMeta.dayOfWeek ?? '',
        categories: topicMeta.categories as any, // Cast to Json
        is_active: true
      }

      const createdTopic = await topicOperations.create(dbTopic)

      // Create questions
      const questions = questionsData[topicId] || []
      const dbQuestions: DbQuestionInsert[] = questions.map(q => ({
        topic_id: q.topic_id ?? '',
        question_number: q.question_number ?? 1,
        question_type: (q as any).type || 'multiple_choice',
        category: q.category ?? '',
        question: q.question ?? '',
        option_a: (q as any).option_a ?? (q as any).options?.[0] ?? '',
        option_b: (q as any).option_b ?? (q as any).options?.[1] ?? '',
        option_c: (q as any).option_c ?? (q as any).options?.[2] ?? '',
        option_d: (q as any).option_d ?? (q as any).options?.[3] ?? '',
        correct_answer: q.correct_answer ?? '',
        hint: q.hint ?? '',
        explanation: q.explanation ?? '',
        tags: q.tags as any, // Cast to Json
        sources: q.sources ? JSON.stringify(q.sources) : null,
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
        if (error.code === 'PGRST116') {
          // PGRST116 means no rows found, which is expected for new questions
          console.log('No stats found for question (expected for new questions)')
          return null
        }
        console.error('Unexpected error fetching question stats:', error)
        throw error
      }
      
      console.log('Question stats fetched successfully:', data)
      return data
    } catch (err) {
      console.error('Exception in getQuestionStats:', err)
      throw err
    }
  },

  // Helper function to get question ID by topic and question number
  async getQuestionIdByNumber(topicId: string, questionNumber: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id')
        .eq('topic_id', topicId)
        .eq('question_number', questionNumber)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`No question found for topic ${topicId}, question number ${questionNumber}`)
          return null
        }
        console.error('Error fetching question ID:', error)
        throw error
      }

      return data.id
    } catch (err) {
      console.error('Exception in getQuestionIdByNumber:', err)
      throw err
    }
  },

  // Get feedback statistics for a question by topic and question number
  async getQuestionStatsByNumber(topicId: string, questionNumber: number) {
    try {
      const questionId = await this.getQuestionIdByNumber(topicId, questionNumber)
      if (!questionId) {
        return null
      }
      return await this.getQuestionStats(questionId)
    } catch (err) {
      console.error('Exception in getQuestionStatsByNumber:', err)
      throw err
    }
  },

  // Submit a rating by topic and question number
  async submitRatingByNumber(topicId: string, questionNumber: number, userId: string, rating: 'up' | 'down') {
    try {
      const questionId = await this.getQuestionIdByNumber(topicId, questionNumber)
      if (!questionId) {
        throw new Error(`Question not found: topic ${topicId}, question ${questionNumber}`)
      }
      return await this.submitRating(questionId, userId, rating)
    } catch (err) {
      console.error('Exception in submitRatingByNumber:', err)
      throw err
    }
  },

  // Submit a report by topic and question number
  async submitReportByNumber(
    topicId: string, 
    questionNumber: number, 
    userId: string, 
    reason: string, 
    details?: string
  ) {
    try {
      const questionId = await this.getQuestionIdByNumber(topicId, questionNumber)
      if (!questionId) {
        throw new Error(`Question not found: topic ${topicId}, question ${questionNumber}`)
      }
      return await this.submitReport(questionId, userId, reason, details)
    } catch (err) {
      console.error('Exception in submitReportByNumber:', err)
      throw err
    }
  },

  // Get user's feedback for a question by topic and question number
  async getUserFeedbackByNumber(topicId: string, questionNumber: number, userId: string) {
    try {
      const questionId = await this.getQuestionIdByNumber(topicId, questionNumber)
      if (!questionId) {
        return []
      }
      return await this.getUserFeedback(questionId, userId)
    } catch (err) {
      console.error('Exception in getUserFeedbackByNumber:', err)
      throw err
    }
  },

  // Delete user's feedback by topic and question number
  async deleteFeedbackByNumber(topicId: string, questionNumber: number, userId: string, feedbackType: 'rating' | 'report') {
    try {
      const questionId = await this.getQuestionIdByNumber(topicId, questionNumber)
      if (!questionId) {
        throw new Error(`Question not found: topic ${topicId}, question ${questionNumber}`)
      }
      return await this.deleteFeedback(questionId, userId, feedbackType)
    } catch (err) {
      console.error('Exception in deleteFeedbackByNumber:', err)
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
    try {
      // First check if junction table exists and has data
      const { data: junctionExists } = await supabase
        .from('question_topic_categories')
        .select('category_id')
        .limit(1)
      
      if (junctionExists && junctionExists.length > 0) {
        // Use optimized junction table approach
        const { data: categoryIds, error: junctionError } = await supabase
          .from('question_topic_categories')
          .select('category_id')
          .not('category_id', 'is', null)
        
        if (junctionError) throw junctionError
        
        // Get unique category IDs
        const uniqueCategoryIds = [...new Set(categoryIds?.map(row => row.category_id) || [])]
        
        if (uniqueCategoryIds.length > 0) {
          // Get category details from the categories table
          const { data: categoryDetails, error: categoryError } = await supabase
            .from('categories')
            .select('name, emoji, description')
            .in('name', uniqueCategoryIds)
            .eq('is_active', true)

          if (categoryError) throw categoryError

          return (categoryDetails || []).map(cat => ({
            name: cat.name,
            emoji: cat.emoji || '📚',
            description: cat.description || ''
          }))
        }
        
        return []
      } else {
        // Fallback to JSONB approach if junction table not populated yet
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
      }
    } catch (error) {
      console.error('Error getting categories from topics:', error)
      return []
    }
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

// Skills operations
export const skillOperations = {
  // Get all active skills by categories
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        emoji,
        description,
        display_order
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data
  },

  // Get skills by category
  async getByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('user_category_skills')
      .select(`
        id,
        category,
        skill_level,
        mastery_level
      `)
      .eq('category', categoryId)
      .order('id')

    if (error) throw error
    return data
  },

  // Get core skills only
  async getCoreSkills() {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        emoji,
        description,
        display_order
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(5) // Get top 5 core categories

    if (error) throw error
    return data
  },

  // Get user's skill progress
  async getUserSkillProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_category_skills')
      .select(`
        id,
        category,
        skill_level,
        mastery_level,
        questions_attempted,
        questions_correct,
        last_practiced_at
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  // Get user's skills with progress for dashboard
  async getUserSkillsForDashboard(userId: string) {
    // First get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        emoji,
        description
      `)
      .eq('is_active', true)
      .order('display_order')

    if (categoriesError) throw categoriesError

    // Then get user progress for these categories
    const { data: userProgress, error: progressError } = await supabase
      .from('user_category_skills')
      .select(`
        id,
        category,
        skill_level,
        mastery_level,
        questions_attempted,
        questions_correct,
        last_practiced_at
      `)
      .eq('user_id', userId)

    if (progressError) throw progressError

    // Create a map for quick lookup
    const progressMap = new Map()
    userProgress?.forEach(progress => {
      progressMap.set(progress.category, progress)
    })

    // Combine category info with user progress
    return categories?.map(category => {
      const progress = progressMap.get(category.name) || {}
      const progressPercentage = progress.skill_level || 0
      
      return {
        id: category.id,
        skill_name: category.name,
        skill_slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        category_name: category.name,
        description: category.description,
        difficulty_level: 1,
        is_core_skill: true,
        mastery_level: progress.mastery_level || 'novice',
        progress_percentage: Math.round(progressPercentage),
        questions_attempted: progress.questions_attempted || 0,
        questions_correct: progress.questions_correct || 0,
        last_practiced_at: progress.last_practiced_at,
        needs_practice: progress.last_practiced_at ? 
          (new Date().getTime() - new Date(progress.last_practiced_at).getTime()) > (7 * 24 * 60 * 60 * 1000) : true
      }
    }) || []
  },

  // Update user skill progress
  async updateUserSkillProgress(userId: string, skillId: string, isCorrect: boolean, timeSpent?: number) {
    // Find the category for this skill
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', skillId)
      .single()
      
    if (!category) throw new Error('Category not found')
    
    // Update the user's progress for this category
    const { data, error } = await supabase
      .from('user_category_skills')
      .upsert({
        user_id: userId,
        category: category.name,
        questions_attempted: 1,
        questions_correct: isCorrect ? 1 : 0,
        last_practiced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,category',
        ignoreDuplicates: false
      })

    if (error) throw error
    return data
  },

  // Get recommended skills for user
  async getRecommendedSkills(userId: string, limit: number = 5) {
    // Get categories user hasn't practiced much
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_category_skills')
      .select('*')
      .eq('user_id', userId)
      .order('questions_attempted', { ascending: true })
      .limit(limit)

    if (skillsError) throw skillsError
    
    // If user has no skills yet, recommend some core ones
    if (!userSkills || userSkills.length < limit) {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .limit(limit)
        
      if (catError) throw catError
      return categories
    }
    
    return userSkills
  }
}

// Define source types
interface SourceData {
  name: string
  url: string
}

interface ProcessedSource {
  title: string
  url: string
  type: 'article'
}

// Update source processing functions
function processSource(source: unknown): source is SourceData {
  return (
    source !== null &&
    typeof source === 'object' && 
    'name' in source &&
    'url' in source &&
    typeof (source as SourceData).name === 'string' && 
    typeof (source as SourceData).url === 'string' &&
    (source as SourceData).name.trim() !== '' &&
    (source as SourceData).url.trim() !== ''
  )
}

function convertToProcessedSource(source: SourceData): ProcessedSource {
  return {
    title: source.name,
    url: source.url,
    type: 'article' as const
  }
}

// Process sources with proper type assertions
function processSourceArray(sources: unknown[]): ProcessedSource[] {
  return sources
    .filter(processSource)
    .map(source => convertToProcessedSource(source))
}

export const multiplayerOperations = {
  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    try {
      // Remove player from room
      await supabase
        .from('multiplayer_room_players')
        .delete()
        .eq('id', playerId)
        .eq('room_id', roomId)

      // Update room player count
      const { data: room } = await supabase
        .from('multiplayer_rooms')
        .select('current_players')
        .eq('id', roomId)
        .single()

      if (room) {
        await supabase
          .from('multiplayer_rooms')
          .update({ current_players: Math.max(0, room.current_players - 1) })
          .eq('id', roomId)
      }
    } catch (error) {
      console.error('Error leaving room:', error)
      throw error
    }
  }
}

export type { MultiplayerRoom, MultiplayerPlayer }