export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'fill_in_blank' | 'drag_and_drop' | 'ordering' | 'crossword'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface BaseQuestion {
  topic_id: string
  question_number: number
  question: string
  correct_answer: string
  explanation?: string
  hint?: string
  tags?: string[]
  category?: string
  difficulty?: Difficulty
  type?: QuestionType
  media_url?: string
  media_type?: 'image' | 'video' | 'audio'
  media_credit?: string
  created_at?: string
  updated_at?: string
  sources?: Array<{
    title: string
    url: string
    type: 'article' | 'video' | 'document'
    date?: string
    author?: string
    publisher?: string
  }>
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false'
  options: ['True', 'False']
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer'
  keywords?: string[]
  sample_answer?: string
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  matching_pairs: Array<{ left: string; right: string }>
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank'
  fill_in_blanks: Array<{ text: string; answer: string }>
}

export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop'
  drag_items: Array<{ id: string; content: string; category?: string }>
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering'
  ordering_items: Array<{ id: string; content: string; correct_order: number }>
}

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

export type QuizQuestion = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | ShortAnswerQuestion 
  | MatchingQuestion 
  | FillInBlankQuestion 
  | DragAndDropQuestion 
  | OrderingQuestion 
  | CrosswordQuestion

export interface QuizTopic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
  difficulty: Difficulty
  is_published: boolean
  why_this_matters?: string
  is_breaking?: boolean
  is_featured?: boolean
  category?: string
  subcategory?: string
  tags?: string[]
  source_url?: string
  last_updated?: string
}

export interface QuizResults {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  score: number
  timeTaken: number
  timeSpentSeconds: number
  questions: {
    question: QuizQuestion
    userAnswer: string
    isCorrect: boolean
  }[]
}

// Solo Modes
export type SoloQuizMode = 
  | 'standard'           // Regular quiz mode
  | 'practice'          // Practice mode with hints and explanations
  | 'assessment'        // Formal assessment mode
  | 'npc_battle'        // AI opponent battles
  | 'civics_test_quick'
  | 'civics_test_full'

// Multiplayer Modes
export type MultiplayerQuizMode = 
  | 'classic_quiz'      // Traditional multiplay
  | 'speed_round'       // Fast-paced competitive mode
  | 'matching_challenge' // Team-based matching game
  | 'debate_mode'       // Discussion-based mode

export type QuizGameMode = SoloQuizMode | MultiplayerQuizMode

export function getQuestionOptions(question: QuizQuestion): string[] {
  switch (question.type) {
    case 'multiple_choice':
      return question.options
    case 'true_false':
      return question.options
    case 'matching':
      return question.matching_pairs.map(pair => pair.left)
    case 'ordering':
      return question.ordering_items.map(item => item.content)
    case 'drag_and_drop':
      return question.drag_items.map(item => item.content)
    default:
      return []
  }
}

export interface QuizModeConfig {
  mode: QuizGameMode
  settings: {
    timeLimit?: number // seconds per question
    showHints?: boolean
    showExplanations?: boolean
    allowSkip?: boolean
    requireEvidence?: boolean
    autoAdvance?: boolean
    powerUpsEnabled?: boolean
    npcDifficulty?: 'easy' | 'medium' | 'hard'
    npcPersonality?: string
  }
}

export const DEFAULT_MODE_CONFIGS: Record<QuizGameMode, QuizModeConfig['settings']> = {
  standard: {
    timeLimit: 60,
    showHints: false,
    showExplanations: true,
    allowSkip: false,
    autoAdvance: true
  },
  practice: {
    timeLimit: 0, // no time limit
    showHints: true,
    showExplanations: true,
    allowSkip: true,
    autoAdvance: false
  },
  assessment: {
    timeLimit: 90,
    showHints: false,
    showExplanations: false,
    allowSkip: false,
    autoAdvance: true
  },
  npc_battle: {
    timeLimit: 30,
    showHints: false,
    showExplanations: true,
    allowSkip: false,
    autoAdvance: true,
    powerUpsEnabled: true,
    npcDifficulty: 'medium'
  },
  civics_test_quick: {
    timeLimit: 45,
    showHints: false,
    showExplanations: true,
    allowSkip: false,
    autoAdvance: true
  },
  civics_test_full: {
    timeLimit: 90,
    showHints: false,
    showExplanations: true,
    allowSkip: true,
    autoAdvance: false
  },
  classic_quiz: {
    timeLimit: 45,
    showHints: false,
    showExplanations: true,
    allowSkip: false,
    autoAdvance: true
  },
  speed_round: {
    timeLimit: 15,
    showHints: false,
    showExplanations: false,
    allowSkip: false,
    autoAdvance: true
  },
  matching_challenge: {
    timeLimit: 60,
    showHints: true,
    showExplanations: true,
    allowSkip: false,
    autoAdvance: false
  },
  debate_mode: {
    timeLimit: 120,
    showHints: false,
    showExplanations: true,
    allowSkip: false,
    requireEvidence: true,
    autoAdvance: false
  }
}

// Helper function to create full QuizModeConfig from mode
export function createModeConfig(mode: QuizGameMode): QuizModeConfig {
  return {
    mode,
    settings: DEFAULT_MODE_CONFIGS[mode]
  }
}

// Helper to get full mode configs
export const FULL_MODE_CONFIGS: Record<QuizGameMode, QuizModeConfig> = Object.keys(DEFAULT_MODE_CONFIGS).reduce((acc, mode) => {
  acc[mode as QuizGameMode] = createModeConfig(mode as QuizGameMode)
  return acc
}, {} as Record<QuizGameMode, QuizModeConfig>) 