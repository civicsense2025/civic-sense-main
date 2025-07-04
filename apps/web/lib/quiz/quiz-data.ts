// Quiz game modes
export type QuizGameMode = 'standard' | 'classic_quiz' | 'npc_battle'

// Topic metadata
export interface TopicMetadata {
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  date: string
  dayOfWeek: string
  categories: string[]
  is_breaking: boolean
  is_featured: boolean
}

export interface QuizConfig {
  mode: QuizGameMode
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number
  questionCount?: number
} 