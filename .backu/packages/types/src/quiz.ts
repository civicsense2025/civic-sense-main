// CivicSense Quiz Types
// Core quiz-related type definitions

export interface TopicMetadata {
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  date: string
  dayOfWeek: string
  categories: string[]
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

export interface QuizQuestion {
  topic_id: string
  question_number: number
  type: QuestionType
  category: string
  question: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  hint: string
  explanation: string
  tags: string[]
  sources: Array<{
    title: string
    url: string
    type: 'article'
  }>
}

export interface MultipleChoiceQuestion extends QuizQuestion {
  type: 'multiple_choice'
  options: string[] // Computed from option_a, option_b, etc.
}

export interface TrueFalseQuestion extends QuizQuestion {
  type: 'true_false'
  options: ['True', 'False']
}

export interface ShortAnswerQuestion extends QuizQuestion {
  type: 'short_answer'
  keywords: string[]
}

export interface QuizAttempt {
  id: string
  user_id: string
  topic_id: string
  started_at: Date
  completed_at: Date | null
  score: number | null
  total_questions: number
  correct_answers: number
  time_spent_seconds: number | null
  is_completed: boolean
  answers: QuizAnswer[]
}

export interface QuizAnswer {
  question_id: string
  user_answer: string
  is_correct: boolean
  time_spent_seconds: number | null
  hint_used: boolean
}

export interface QuizProgress {
  user_id: string
  topic_id: string
  current_question_index: number
  answers: QuizAnswer[]
  started_at: Date
  last_updated: Date
  is_complete: boolean
}

export interface QuizStats {
  total_attempts: number
  average_score: number
  best_score: number
  total_time_spent: number
  completion_rate: number
  strength_areas: string[]
  improvement_areas: string[]
}

// Helper function to get question options in a type-safe way
export function getQuestionOptions(question: MultipleChoiceQuestion): string[] {
  return [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d
  ].filter((option): option is string => typeof option === 'string')
}

// Helper function to calculate quiz score
export function calculateQuizScore(answers: QuizAnswer[]): number {
  const correctAnswers = answers.filter(answer => answer.is_correct).length
  return Math.round((correctAnswers / answers.length) * 100)
} 