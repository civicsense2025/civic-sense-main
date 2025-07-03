import type { QuizGameMode } from './types/quiz'

export interface QuizModeConfig {
  timeLimit: number
  showHints: boolean
  showExplanations: boolean
  allowSkip: boolean
  requireEvidence?: boolean
  autoAdvance?: boolean
  powerUpsEnabled?: boolean
  npcDifficulty?: 'easy' | 'medium' | 'hard'
  npcPersonality?: string
}

export const DEFAULT_MODE_CONFIGS: Record<QuizGameMode, QuizModeConfig> = {
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
    autoAdvance: false
  }
} as const 