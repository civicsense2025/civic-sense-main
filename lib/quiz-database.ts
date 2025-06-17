import { supabase } from "./supabase"
import type { Database } from "./database.types"
import type { QuizQuestion } from "./quiz-data"

// Types for quiz database operations
export interface QuizAttemptData {
  userId: string
  topicId: string
  topicTitle: string
  totalQuestions: number
  correctAnswers: number
  score: number
  timeSpentSeconds: number
  userAnswers: Array<{
    questionId: number
    answer: string
    isCorrect: boolean
    timeSpent: number
  }>
  attemptId?: string | null  // Optional ID of an existing attempt to update
}

export interface SavedQuizAttempt {
  id: string
  userId: string
  topicId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  completedAt: string
  startedAt: string
}

export interface RecentActivity {
  attemptId: string
  topicId: string
  topicTitle: string
  score: number
  completedAt: string
  timeSpent?: number
}

// Add QuizAttempt interface after SavedQuizAttempt
export interface QuizAttempt {
  id: string
  userId: string
  topicId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  completedAt: string
  startedAt: string
  isCompleted: boolean
}

// Quiz database operations
export const quizDatabase = {
  /**
   * Save a completed quiz attempt to the database
   */
  async saveQuizAttempt(attemptData: QuizAttemptData): Promise<SavedQuizAttempt> {
    try {
      let existingAttempt = null;
      
      // If an attemptId is provided, use that directly
      if (attemptData.attemptId) {
        const { data, error } = await supabase
          .from('user_quiz_attempts')
          .select('*')
          .eq('id', attemptData.attemptId)
          .single();
          
        if (error) {
          console.error(`Error finding attempt with id ${attemptData.attemptId}:`, error);
        } else {
          existingAttempt = data;
        }
      } else {
        // Otherwise check for an incomplete attempt for this user and topic
        const { data: incompleteAttempt, error: findError } = await supabase
          .from('user_quiz_attempts')
          .select('*')
          .eq('user_id', attemptData.userId)
          .eq('topic_id', attemptData.topicId)
          .eq('is_completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
  
        if (findError) {
          console.error('Error finding existing attempt:', findError)
        } else {
          existingAttempt = incompleteAttempt;
        }
      }

      let attempt;
      let attemptError;

      if (existingAttempt) {
        // Update the existing attempt
        console.log(`Updating attempt ${existingAttempt.id} for topic ${attemptData.topicId}`)
        const { data, error } = await supabase
          .from('user_quiz_attempts')
          .update({
            total_questions: attemptData.totalQuestions,
            correct_answers: attemptData.correctAnswers,
            score: attemptData.score,
            time_spent_seconds: attemptData.timeSpentSeconds,
            completed_at: new Date().toISOString(),
            is_completed: true
          })
          .eq('id', existingAttempt.id)
          .select()
          .single()
          
        attempt = data
        attemptError = error
      } else {
        // Create a new attempt record
        console.log(`Creating new attempt for topic ${attemptData.topicId}`)
        const { data, error } = await supabase
          .from('user_quiz_attempts')
          .insert({
            user_id: attemptData.userId,
            topic_id: attemptData.topicId,
            total_questions: attemptData.totalQuestions,
            correct_answers: attemptData.correctAnswers,
            score: attemptData.score,
            time_spent_seconds: attemptData.timeSpentSeconds,
            started_at: new Date(Date.now() - attemptData.timeSpentSeconds * 1000).toISOString(),
            completed_at: new Date().toISOString(),
            is_completed: true
          })
          .select()
          .single()
          
        attempt = data
        attemptError = error
      }

      if (attemptError) {
        console.error('Error saving quiz attempt:', attemptError)
        throw attemptError
      }

      // Make sure attempt exists (for TypeScript)
      if (!attempt) {
        throw new Error('No attempt data returned from database operation')
      }

      // 2. Save individual question responses
      if (attemptData.userAnswers.length > 0) {
        // First, get the question IDs from the database
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_number')
          .eq('topic_id', attemptData.topicId)

        if (questionsError) {
          console.warn('Could not fetch questions for responses:', questionsError)
        } else {
          // Map user answers to database question IDs
          const questionResponses = attemptData.userAnswers.map(userAnswer => {
            const dbQuestion = questions.find(q => q.question_number === userAnswer.questionId)
            if (!dbQuestion) {
              console.warn(`Could not find database question for question_number ${userAnswer.questionId}`)
              return null
            }

            return {
              attempt_id: attempt.id,
              question_id: dbQuestion.id,
              user_answer: userAnswer.answer,
              is_correct: userAnswer.isCorrect,
              time_spent_seconds: userAnswer.timeSpent,
              hint_used: false // We don't track this yet
            }
          }).filter((response): response is NonNullable<typeof response> => response !== null)

          if (questionResponses.length > 0) {
            // Delete any existing responses for this attempt first (for the update case)
            if (existingAttempt) {
              await supabase
                .from('user_question_responses')
                .delete()
                .eq('attempt_id', attempt.id)
            }
            
            const { error: responsesError } = await supabase
              .from('user_question_responses')
              .insert(questionResponses)

            if (responsesError) {
              console.warn('Error saving question responses:', responsesError)
              // Don't throw here - the main attempt was saved successfully
            }
          }
        }
      }

      // 3. Update user progress
      await this.updateUserProgress(attemptData.userId, attemptData.correctAnswers, attemptData.totalQuestions)

      // TODO: Add skill progress updates here once database types are updated
      // This would call updateSkillProgress() to track granular skill development

      return {
        id: attempt.id,
        userId: attempt.user_id,
        topicId: attempt.topic_id,
        score: attempt.score || 0,
        correctAnswers: attempt.correct_answers || 0,
        totalQuestions: attempt.total_questions,
        timeSpentSeconds: attempt.time_spent_seconds || 0,
        completedAt: attempt.completed_at || new Date().toISOString(),
        startedAt: attempt.started_at || new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to save quiz attempt:', error)
      throw error
    }
  },

  /**
   * Update user progress after completing a quiz
   */
  async updateUserProgress(userId: string, correctAnswers: number, totalQuestions: number): Promise<void> {
    try {
      // Get or create user progress record
      const { data: existingProgress, error: getError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      const today = new Date().toISOString().split('T')[0]
      let newStreak = 1
      let newLongestStreak = 1

      if (existingProgress) {
        const lastActivityDate = existingProgress.last_activity_date
        
        if (lastActivityDate) {
          const lastDate = new Date(lastActivityDate)
          const todayDate = new Date(today)
          const diffTime = todayDate.getTime() - lastDate.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            // Consecutive day
            newStreak = (existingProgress.current_streak || 0) + 1
          } else if (diffDays === 0) {
            // Same day - keep current streak
            newStreak = existingProgress.current_streak || 1
          }
          // If more than 1 day, streak resets to 1
        }

        newLongestStreak = Math.max(newStreak, existingProgress.longest_streak || 0)

        // Update existing progress
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            total_quizzes_completed: (existingProgress.total_quizzes_completed || 0) + 1,
            total_questions_answered: (existingProgress.total_questions_answered || 0) + totalQuestions,
            total_correct_answers: (existingProgress.total_correct_answers || 0) + correctAnswers,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Error updating user progress:', updateError)
          throw updateError
        }
      } else {
        // Create new progress record
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            total_quizzes_completed: 1,
            total_questions_answered: totalQuestions,
            total_correct_answers: correctAnswers
          })

        if (insertError) {
          console.error('Error creating user progress:', insertError)
          throw insertError
        }
      }
    } catch (error) {
      console.error('Failed to update user progress:', error)
      throw error
    }
  },

  /**
   * Get recent quiz activity for a user (deduplicated by topic_id, most recent attempt only)
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          id,
          topic_id,
          score,
          completed_at,
          time_spent_seconds,
          question_topics ( topic_title )
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching recent activity:', error)
        return []
      }

      if (!data) return []

      // Deduplicate by topic_id keeping the most recent attempt
      const uniqueAttemptsMap = new Map<string, typeof data[number]>()
      for (const attempt of data) {
        if (!uniqueAttemptsMap.has(attempt.topic_id)) {
          uniqueAttemptsMap.set(attempt.topic_id, attempt)
        }
        if (uniqueAttemptsMap.size >= limit) break
      }

      const uniqueAttempts = Array.from(uniqueAttemptsMap.values())
        .sort((a, b) => {
          const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
          const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
          return dateB - dateA
        })
        .slice(0, limit)

      return uniqueAttempts.map(attempt => ({
        attemptId: attempt.id,
        topicId: attempt.topic_id,
        topicTitle: (attempt.question_topics as any)?.topic_title || 'Unknown Topic',
        score: attempt.score || 0,
        completedAt: attempt.completed_at || new Date().toISOString(),
        timeSpent: attempt.time_spent_seconds || undefined
      }))
    } catch (error) {
      console.error('Failed to get recent activity:', error)
      return []
    }
  },

  /**
   * Get completed topic IDs for a user
   */
  async getCompletedTopics(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('topic_id')
        .eq('user_id', userId)
        .eq('is_completed', true)

      if (error) {
        console.error('Error fetching completed topics:', error)
        return []
      }

      // Return unique topic IDs
      return [...new Set(data.map(attempt => attempt.topic_id))]
    } catch (error) {
      console.error('Failed to get completed topics:', error)
      return []
    }
  },

  /**
   * Save partial quiz state to localStorage (for resuming later)
   */
  savePartialQuizState(userId: string, topicId: string, state: {
    currentQuestionIndex: number
    userAnswers: Array<{
      questionId: number
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>
    startTime: number
  }): void {
    try {
      const key = `civicAppPartialQuiz_${userId}_${topicId}`
      const partialState = {
        ...state,
        savedAt: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(partialState))
    } catch (error) {
      console.warn('Failed to save partial quiz state:', error)
    }
  },

  /**
   * Load partial quiz state from localStorage
   */
  loadPartialQuizState(userId: string, topicId: string): {
    currentQuestionIndex: number
    userAnswers: Array<{
      questionId: number
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>
    startTime: number
    savedAt: number
  } | null {
    try {
      const key = `civicAppPartialQuiz_${userId}_${topicId}`
      const saved = localStorage.getItem(key)
      if (!saved) return null

      const state = JSON.parse(saved)
      
      // Check if the saved state is too old (more than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (Date.now() - state.savedAt > maxAge) {
        localStorage.removeItem(key)
        return null
      }

      return state
    } catch (error) {
      console.warn('Failed to load partial quiz state:', error)
      return null
    }
  },

  /**
   * Clear partial quiz state after completion
   */
  clearPartialQuizState(userId: string, topicId: string): void {
    try {
      const key = `civicAppPartialQuiz_${userId}_${topicId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error clearing partial quiz state:', error)
    }
  },

  /**
   * Get all quiz attempts for a user
   */
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching user quiz attempts:', error)
        return []
      }

      return data.map(attempt => ({
        id: attempt.id,
        userId: attempt.user_id,
        topicId: attempt.topic_id,
        score: attempt.score || 0,
        correctAnswers: attempt.correct_answers || 0,
        totalQuestions: attempt.total_questions || 0,
        timeSpentSeconds: attempt.time_spent_seconds || 0,
        completedAt: attempt.completed_at || new Date().toISOString(),
        startedAt: attempt.started_at || new Date().toISOString(),
        isCompleted: attempt.is_completed || false
      }))
    } catch (error) {
      console.error('Failed to get user quiz attempts:', error)
      return []
    }
  },

  /**
   * Fetch a quiz attempt with its question responses and full question details
   */
  async getQuizAttemptDetails(attemptId: string): Promise<{
    attempt: QuizAttempt | null,
    userAnswers: Array<{
      questionNumber: number
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>,
    questions: QuizQuestion[]
  }> {
    try {
      // Fetch the attempt record first
      const { data: attemptData, error: attemptError } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (attemptError) {
        console.error('Error fetching attempt details:', attemptError)
        return { attempt: null, userAnswers: [], questions: [] }
      }

      // Fetch question responses first
      const { data: responsesData, error: responsesError } = await supabase
        .from('user_question_responses')
        .select('*')
        .eq('attempt_id', attemptId)

      if (responsesError) {
        console.error('Error fetching attempt responses:', responsesError)
        return { attempt: null, userAnswers: [], questions: [] }
      }

      const responsesArray: any[] = (responsesData as any[]) || []
      if (responsesError || responsesArray.length === 0) {
        console.warn('No question responses found for attempt', attemptId)
        const attemptFallback: QuizAttempt = {
          id: attemptData.id,
          userId: attemptData.user_id,
          topicId: attemptData.topic_id,
          score: attemptData.score || 0,
          correctAnswers: attemptData.correct_answers || 0,
          totalQuestions: attemptData.total_questions || 0,
          timeSpentSeconds: attemptData.time_spent_seconds || 0,
          completedAt: attemptData.completed_at || new Date().toISOString(),
          startedAt: attemptData.started_at || new Date().toISOString(),
          isCompleted: attemptData.is_completed || false
        }
        return { attempt: attemptFallback, userAnswers: [], questions: [] }
      }

      // Batch fetch related questions by ID
      const questionIds = responsesArray.map(r => r.question_id)
      let questionsMap: Record<string, any> = {}

      if (questionIds.length > 0) {
        const { data: qsData, error: qsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (qsError) {
          console.error('Error fetching questions for attempt:', qsError)
        } else {
          questionsMap = Object.fromEntries((qsData || []).map(q => [q.id, q]))
        }
      }

      const userAnswers: Array<{
        questionNumber: number
        answer: string
        isCorrect: boolean
        timeSpent: number
      }> = []
      const questions: QuizQuestion[] = []

      responsesArray.forEach(resp => {
        const q = questionsMap[resp.question_id]
        if (!q) return
        questions.push({
          topic_id: q.topic_id,
          question_number: q.question_number,
          question_type: q.question_type as any,
          category: q.category,
          question: q.question,
          option_a: q.option_a ?? undefined,
          option_b: q.option_b ?? undefined,
          option_c: q.option_c ?? undefined,
          option_d: q.option_d ?? undefined,
          correct_answer: q.correct_answer,
          hint: q.hint,
          explanation: q.explanation,
          tags: Array.isArray(q.tags) ? q.tags : [],
          sources: Array.isArray(q.sources) ? q.sources : []
        })
        userAnswers.push({
          questionNumber: q.question_number,
          answer: resp.user_answer,
          isCorrect: resp.is_correct,
          timeSpent: resp.time_spent_seconds || 0
        })
      })

      const attempt: QuizAttempt = {
        id: attemptData.id,
        userId: attemptData.user_id,
        topicId: attemptData.topic_id,
        score: attemptData.score || 0,
        correctAnswers: attemptData.correct_answers || 0,
        totalQuestions: attemptData.total_questions || questions.length,
        timeSpentSeconds: attemptData.time_spent_seconds || 0,
        completedAt: attemptData.completed_at || new Date().toISOString(),
        startedAt: attemptData.started_at || new Date().toISOString(),
        isCompleted: attemptData.is_completed || false
      }

      return { attempt, userAnswers, questions }
    } catch (error) {
      console.error('Failed to fetch quiz attempt details:', error)
      return { attempt: null, userAnswers: [], questions: [] }
    }
  },

  // TODO: Add skill progress tracking functions here once database types are updated
  // These would include:
  // - updateSkillProgress() - Update user skill progress based on question responses
  // - updateIndividualSkillProgress() - Update progress for individual skills
  // - getSkillProgress() - Get user's progress for specific skills
  // - getSkillsNeedingReview() - Get skills that need spaced repetition review
} 