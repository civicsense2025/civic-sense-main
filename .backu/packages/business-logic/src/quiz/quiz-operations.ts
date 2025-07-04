import type {
  TopicMetadata,
  QuizQuestion,
  MultipleChoiceQuestion,
  QuizAttempt,
  QuizAnswer
} from '@civicsense/types';
import type {
  DbQuestionTopic,
  DbQuestion,
  DbUserQuizAttempt,
  DbUserQuestionMemory
} from '../database/types';
import { supabase } from '../database/supabase-client';

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

  // Convert DB topic to app format
  toTopicAppFormat(dbTopic: DbQuestionTopic): TopicMetadata {
    return {
      topic_id: dbTopic.topic_id,
      topic_title: dbTopic.topic_title,
      description: dbTopic.description,
      why_this_matters: dbTopic.why_this_matters,
      emoji: dbTopic.emoji,
      date: dbTopic.date,
      dayOfWeek: dbTopic.day_of_week,
      categories: Array.isArray(dbTopic.categories) ? dbTopic.categories as string[] : []
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

  // Convert DB question to app format
  toQuestionAppFormat(dbQuestion: DbQuestion): QuizQuestion {
    // Process sources with better validation
    let processedSources: Array<{ title: string; url: string; type: 'article' }> = []
    
    if (dbQuestion.sources) {
      if (Array.isArray(dbQuestion.sources)) {
        processedSources = dbQuestion.sources.filter((source: any): source is { name: string; url: string } => 
          source !== null &&
          typeof source === 'object' && 
          'name' in source &&
          'url' in source &&
          typeof source.name === 'string' && 
          typeof source.url === 'string' &&
          source.name.trim() !== '' &&
          source.url.trim() !== ''
        ).map(source => ({
          title: source.name,
          url: source.url,
          type: 'article' as const
        }))
      } else if (typeof dbQuestion.sources === 'string') {
        try {
          const parsed = JSON.parse(dbQuestion.sources)
          if (Array.isArray(parsed)) {
            processedSources = parsed.filter((source): source is { name: string; url: string } => 
              source !== null &&
              typeof source === 'object' && 
              'name' in source &&
              'url' in source &&
              typeof source.name === 'string' && 
              typeof source.url === 'string' &&
              source.name.trim() !== '' &&
              source.url.trim() !== ''
            ).map(source => ({
              title: source.name,
              url: source.url,
              type: 'article' as const
            }))
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
        topic_id: dbQuestion.topic_id,
        question_number: dbQuestion.question_number,
        type: 'multiple_choice',
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
        sources: processedSources,
        options: [
          dbQuestion.option_a,
          dbQuestion.option_b,
          dbQuestion.option_c,
          dbQuestion.option_d
        ].filter((option): option is string => typeof option === 'string')
      } as MultipleChoiceQuestion
    }

    // For other types, return the base structure and cast as QuizQuestion
    return {
      topic_id: dbQuestion.topic_id,
      question_number: dbQuestion.question_number,
      type: qType as QuizQuestion['type'],
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
      sources: processedSources
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
        time_spent_seconds: typeof timeSpentSeconds === 'number' ? timeSpentSeconds : null,
        is_completed: true
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (error) throw error
    return data as DbUserQuizAttempt
  },

  // Get quiz attempts by user
  async getByUser(userId: string, limit?: number) {
    const query = supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as DbUserQuizAttempt[]
  },

  // Get completed quiz attempts by user
  async getCompletedByUser(userId: string) {
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return data as DbUserQuizAttempt[]
  }
}

// Question memory operations
export const questionMemoryOperations = {
  // Get or create question memory
  async getOrCreate(userId: string, questionId: string) {
    const { data, error } = await supabase
      .from('user_question_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        const { data: newMemory, error: createError } = await supabase
          .from('user_question_memory')
          .insert({
            user_id: userId,
            question_id: questionId,
            times_seen: 0,
            times_correct: 0,
            last_seen_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) throw createError
        return newMemory as DbUserQuestionMemory
      }
      throw error
    }

    return data as DbUserQuestionMemory
  },

  // Update question memory after answer
  async update(userId: string, questionId: string, isCorrect: boolean) {
    const memory = await this.getOrCreate(userId, questionId)

    const { data, error } = await supabase
      .from('user_question_memory')
      .update({
        times_seen: memory.times_seen + 1,
        times_correct: memory.times_correct + (isCorrect ? 1 : 0),
        last_seen_at: new Date().toISOString()
      })
      .eq('id', memory.id)
      .select()
      .single()

    if (error) throw error
    return data as DbUserQuestionMemory
  }
} 