// Topic metadata structure
export interface TopicMetadata {
  topic_id: string
  topic_title: string
  description?: string
  why_this_matters: string // HTML content
  emoji?: string
  date: string
  dayOfWeek: string
  categories: string[] // Added categories field
  is_breaking?: boolean // Breaking news flag for priority sorting
  is_featured?: boolean // Featured topics flag for priority sorting
  category?: string
  subcategory?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  source_url?: string
  last_updated?: string
}

// Source structure
export interface Source {
  title: string
  url: string
  type: 'article' | 'video' | 'document'
  date?: string
  author?: string
  publisher?: string
}

// Base question structure
export interface BaseQuestion {
  topic_id: string
  question_number: number
  question: string
  correct_answer: string
  explanation?: string
  hint?: string
  tags?: string[]
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type?: QuestionType
  media_url?: string
  media_type?: 'image' | 'video' | 'audio'
  media_credit?: string
  created_at?: string
  updated_at?: string
  sources?: Source[]
}

// Question types
export type QuestionType = 
  | "multiple_choice" 
  | "true_false" 
  | "short_answer" 
  | "matching" 
  | "fill_in_blank" 
  | "drag_and_drop" 
  | "ordering" 
  | "crossword"

// Multiple choice question
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
  // Legacy fields for backward compatibility
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false'
  options: ['True', 'False']
}

// Short answer question
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer'
  keywords?: string[]
  sample_answer?: string
}

// Matching question
export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  matching_pairs: Array<{ left: string; right: string }>
}

// Fill in the blank question
export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank'
  fill_in_blanks: Array<{ text: string; answer: string }>
}

// Drag and drop question
export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop'
  drag_items: Array<{ id: string; content: string; category?: string }>
}

// Ordering question
export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering'
  ordering_items: Array<{ id: string; content: string; correct_order: number }>
}

// Crossword question
export interface CrosswordQuestion extends BaseQuestion {
  type: 'crossword'
  crossword_data: {
    metadata?: {
      title?: string
      author?: string
      description?: string
      difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
      created_at?: string
    }
    size: { rows: number; cols: number }
    layout?: string[]
    words: Array<{
      number: number
      word: string
      clue: string
      position: { row: number; col: number }
      direction: 'across' | 'down'
      length?: number
    }>
  }
}

// Union type for all question types
export type QuizQuestion = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | ShortAnswerQuestion
  | MatchingQuestion
  | FillInBlankQuestion
  | DragAndDropQuestion
  | OrderingQuestion
  | CrosswordQuestion

// Quiz attempt structure
export interface QuizAttempt {
  attempt_id: string
  user_id: string
  topic_id: string
  score: number
  completed: boolean
  started_at: string
  completed_at?: string
  answers: {
    question_id: string
    answer: string
    correct: boolean
    time_taken: number
  }[]
  game_mode: string
  platform: string
  session_id?: string
  guest_token?: string
  streak_count?: number
  participants?: {
    user_id: string
    name: string
    score: number
  }[]
  social_interactions?: {
    type: string
    target_user_id: string
    timestamp: string
  }[]
}

// All available categories with emojis
export const allCategories = [
  { name: "Government", emoji: "🏛️" },
  { name: "Elections", emoji: "🗳️" },
  { name: "Economy", emoji: "💰" },
  { name: "Foreign Policy", emoji: "🌐" },
  { name: "Justice", emoji: "⚖️" },
  { name: "Civil Rights", emoji: "✊" },
  { name: "Environment", emoji: "🌱" },
  { name: "Media", emoji: "📱" },
  { name: "Local Issues", emoji: "🏙️" },
  { name: "Constitutional Law", emoji: "📜" },
] as const

export type CategoryType = (typeof allCategories)[number]["name"]

// Helper function to get category emoji
export function getCategoryEmoji(categoryName: string): string {
  const category = allCategories.find((cat) => cat.name === categoryName)
  return category?.emoji || "📚"
}
