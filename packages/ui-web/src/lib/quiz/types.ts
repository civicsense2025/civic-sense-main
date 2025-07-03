import { Database } from '@/lib/types/database'

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  source?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type QuizAnswer = {
  questionId: string
  selectedOption: number
  isCorrect: boolean
  timeSpent: number
}

export type QuizSession = {
  id: string
  userId: string
  startedAt: Date
  completedAt?: Date
  score: number
  totalQuestions: number
  correctAnswers: number
  answers: QuizAnswer[]
}

export type QuizCategory = {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalQuestions: number
}

export type QuizProgress = Database['public']['Tables']['quiz_progress']['Row'] 