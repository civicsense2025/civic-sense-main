export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'fill_in_blank' | 'drag_and_drop' | 'ordering' | 'crossword' | 'timeline' | 'scenario_simulation' | 'matching_interactive' | 'fill_in_blanks_enhanced' | 'categorization' | 'network_diagram'
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
  // Interactive data for enhanced question types
  interactive_data?: any // JSON data from database
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

// NEW INTERACTIVE QUESTION TYPES

export interface TimelineQuestion extends BaseQuestion {
  type: 'timeline'
  // Timeline events will be stored in interactive_data as JSONB
  // Legacy support for basic timeline without interactive_data
  timeline_events?: Array<{
    id: string
    title: string
    content: string
    date: string
    category?: string
  }>
}

export interface ScenarioSimulationQuestion extends BaseQuestion {
  type: 'scenario_simulation'
  // Scenario data will be stored in interactive_data as JSONB
  // Legacy support for basic scenario without interactive_data
  scenario_stages?: Array<{
    id: string
    prompt: string
    choices: Array<{
      id: string
      text: string
      consequence: string
    }>
  }>
}

export interface MatchingInteractiveQuestion extends BaseQuestion {
  type: 'matching_interactive'
  // Enhanced matching with interactive_data as JSONB
  // Legacy support for basic matching without interactive_data
  matching_pairs?: Array<{ left: string; right: string }>
}

export interface FillInBlanksEnhancedQuestion extends BaseQuestion {
  type: 'fill_in_blanks_enhanced'
  // Enhanced fill-in-blanks with interactive_data as JSONB
  // Legacy support for basic fill-in-blanks without interactive_data
  fill_in_blanks?: Array<{ text: string; answer: string }>
}

export interface CategorizationQuestion extends BaseQuestion {
  type: 'categorization'
  // Data in interactive_data as JSONB
  // Legacy support: categories and items fields (optional)
  categories?: Array<{ id: string; name: string; description?: string }>
  items?: Array<{ id: string; content: string }>
}

export interface NetworkDiagramQuestion extends BaseQuestion {
  type: 'network_diagram'
  // Data in interactive_data as JSONB
  // Legacy support: nodes and connections fields (optional)
  nodes?: Array<{ id: string; label: string; description?: string }>
  connections?: Array<{ from: string; to: string; label?: string }>
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
  | TimelineQuestion
  | ScenarioSimulationQuestion
  | MatchingInteractiveQuestion
  | FillInBlanksEnhancedQuestion
  | CategorizationQuestion
  | NetworkDiagramQuestion

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
    case 'matching_interactive':
      return question.matching_pairs?.map(pair => pair.left) || []
    case 'ordering':
      return question.ordering_items.map(item => item.content)
    case 'drag_and_drop':
      return question.drag_items.map(item => item.content)
    case 'timeline':
      return question.timeline_events?.map(event => event.title) || []
    case 'scenario_simulation':
      return question.scenario_stages?.flatMap(stage => 
        stage.choices.map(choice => choice.text)
      ) || []
    case 'fill_in_blanks_enhanced':
      return question.fill_in_blanks?.map(blank => blank.text) || []
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