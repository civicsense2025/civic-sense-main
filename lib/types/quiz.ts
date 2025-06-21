export interface QuizResults {
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  answers: Array<{
    questionId: number
    answer: string
    isCorrect: boolean
    timeSpent: number
  }>
}

export interface QuizTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

export type QuizGameMode = 
  // Solo Modes
  | 'standard'           // Regular quiz mode
  | 'practice'          // Practice mode with hints and explanations
  | 'assessment'        // Formal assessment mode
  | 'npc_battle'        // AI opponent battles
  | 'civics_test_quick'
  | 'civics_test_full'
  
  // Multiplayer Modes
  | 'classic_quiz'      // Traditional multiplayer quiz
  | 'speed_round'       // Fast-paced competitive mode
  | 'matching_challenge' // Team-based matching game
  | 'debate_mode'       // Discussion-based mode

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