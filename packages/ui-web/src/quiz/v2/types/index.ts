/**
 * Centralized type exports for Quiz Engine V2
 */

// Re-export database types
export * from './database'

// Re-export quiz types from lib
export type { 
  QuizGameMode, 
  QuizQuestion, 
  QuizResults, 
  QuizTopic,
  QuizModeConfig 
} from '@/lib/types/quiz'

// Import types we need for our interfaces
import type { QuizGameMode, QuizQuestion, QuizTopic } from '@/lib/types/quiz'
import type { QuizModeSettings } from './database'

// Define core V2 types
export interface QuizState {
  // Core quiz state
  currentQuestionIndex: number
  answers: { [questionId: string]: string }
  score: number
  correctAnswers: number
  streak: number
  maxStreak: number
  timeRemaining: number | null
  
  // Timing
  startTime: number
  questionTimes: { [questionId: string]: number }
  
  // Category tracking
  categoryScores?: Record<string, { correct: number; total: number }>
  
  // Metadata
  isCompleted: boolean
  showResults: boolean
}

export interface QuizConfig {
  questions: QuizQuestion[]
  topicId: string
  topicData: QuizTopic
  mode: QuizGameMode
  practiceMode?: boolean
  settings?: QuizModeSettings
}

export interface QuizPluginContext {
  userId?: string
  guestToken?: string
  sessionId: string
  attemptId?: string
  metadata?: {
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    [key: string]: any
  }
}

// Re-export mode types
export type { 
  GameModePlugin,
  QuizEngineContext,
  QuizEngineActions,
  GameModeAction,
  KeyboardShortcut
} from '../modes/types'

export { gameModeRegistry } from '../modes/types' 