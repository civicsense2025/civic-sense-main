import type { ReactNode } from 'react'
import type { QuizGameMode, QuizQuestion, QuizResults, QuizModeConfig } from '../lib/types/quiz'
import type { QuizAttemptData, QuizModeSettings, GameMetadata, UserAnswer } from '../types/database'

// Core game mode types - just 3 main modes
export type GameModeId = 'standard' | 'ai-battle' | 'pvp'

// Settings for standard mode that replace multiple separate modes
export interface StandardModeSettings {
  // Timing
  timeLimit?: number | null // null = unlimited, number = seconds per question
  totalTimeLimit?: number | null // null = unlimited, number = total seconds for quiz
  
  // Practice features
  allowHints: boolean
  allowSkip: boolean
  allowReview: boolean
  showExplanations: boolean
  instantFeedback: boolean
  
  // Scoring
  scoringMode: 'standard' | 'speed-bonus' | 'survival' // survival = one wrong ends quiz
  streakBonus: boolean
  
  // Question selection
  questionCount?: number // null = all questions
  shuffleQuestions: boolean
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  
  // Multi-topic support
  topics: string[] // Array of topic IDs
  mixTopics: boolean // true = shuffle questions from all topics
}

// Settings for AI Battle mode
export interface AIBattleSettings {
  npcId: string // Which NPC opponent
  npcDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  timeLimit?: number
  powerupsEnabled: boolean
  topics: string[]
}

// Settings for PVP mode
export interface PVPSettings {
  roomSize: number // 2-8 players
  timeLimit?: number
  chatEnabled: boolean
  spectatorMode: boolean
  topics: string[]
  isPrivate: boolean
  roomCode?: string
}

// Base interface that all game modes must implement
export interface GameModePlugin<T = any> {
  // Mode identification
  mode: QuizGameMode
  displayName: string
  description: string
  category: 'solo' | 'multiplayer' | 'assessment' | 'special'
  
  // Mode configuration
  config: QuizModeConfig
  isEnabled: boolean
  requiresPremium: boolean
  requiresAuth: boolean
  
  // Game mode lifecycle hooks
  onModeStart?: (context: QuizEngineContext) => Promise<void> | void
  onQuestionStart?: (question: QuizQuestion, index: number, context: QuizEngineContext) => Promise<void> | void
  onAnswerSubmit?: (answer: UserAnswer, context: QuizEngineContext) => Promise<boolean> | boolean
  onQuestionComplete?: (question: QuizQuestion, answer: UserAnswer, context: QuizEngineContext) => Promise<void> | void
  onModeComplete?: (results: QuizResults, context: QuizEngineContext) => Promise<void> | void
  onModeExit?: (context: QuizEngineContext) => Promise<void> | void
  
  // Custom rendering functions (optional)
  renderHeader?: (context: QuizEngineContext) => ReactNode
  renderQuestion?: (question: QuizQuestion, context: QuizEngineContext) => ReactNode
  renderInterface?: (context: QuizEngineContext) => ReactNode
  renderFooter?: (context: QuizEngineContext) => ReactNode
  renderResults?: (results: QuizResults, context: QuizEngineContext) => ReactNode
  
  // Mode-specific state management
  getInitialState?: () => T
  stateReducer?: (state: T, action: GameModeAction) => T
  
  // Progress storage customization
  shouldSaveProgress?: (context: QuizEngineContext) => boolean
  getProgressData?: (context: QuizEngineContext) => any
  restoreFromProgress?: (progressData: any, context: QuizEngineContext) => Promise<void> | void
  
  // Validation and business logic
  validateAnswer?: (answer: string, question: QuizQuestion, context: QuizEngineContext) => boolean
  calculateScore?: (answers: UserAnswer[], questions: QuizQuestion[]) => number
  getTimeLimit?: (question: QuizQuestion, context: QuizEngineContext) => number | null
  
  // Accessibility and UX
  getAriaLabel?: (context: QuizEngineContext) => string
  getKeyboardShortcuts?: () => KeyboardShortcut[]
  
  // Analytics and tracking
  getAnalyticsData?: (context: QuizEngineContext) => Record<string, any>
}

// Context passed to all game mode plugins
export interface QuizEngineContext {
  // Current state
  questions: QuizQuestion[]
  currentQuestionIndex: number
  userAnswers: UserAnswer[]
  timeRemaining: number | null
  score: number
  streak: number
  maxStreak: number
  
  // Session data
  sessionId: string
  startTime: number
  attemptData?: QuizAttemptData
  
  // User context
  userId?: string
  guestToken?: string
  isAuthenticated: boolean
  
  // Topic context
  topicId: string
  topicData?: any
  
  // Mode-specific state
  modeState?: any
  modeSettings: QuizModeSettings
  gameMetadata: GameMetadata
  
  // Actions
  actions: QuizEngineActions
}

// Actions available to game mode plugins
export interface QuizEngineActions {
  // Navigation
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void
  goToQuestion: (index: number) => void
  
  // Answer handling
  submitAnswer: (answer: string) => void
  setAnswerConfidence: (confidence: number) => void
  useHint: () => void
  skipQuestion: () => void
  
  // Timer control
  pauseTimer: () => void
  resumeTimer: () => void
  extendTime: (seconds: number) => void
  
  // Mode state management
  updateModeState: (update: any) => void
  updateGameMetadata: (update: GameMetadata) => void
  
  // UI control
  showModal: (content: ReactNode) => void
  hideModal: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  
  // Progress management
  saveProgress: () => void
  clearProgress: () => void
  
  // Completion
  completeQuiz: (results?: Partial<QuizResults>) => void
  exitQuiz: () => void
}

// Action types for mode state reducers
export type GameModeAction =
  | { type: 'START_MODE'; payload?: any }
  | { type: 'QUESTION_START'; payload: { question: QuizQuestion; index: number } }
  | { type: 'ANSWER_SUBMIT'; payload: { answer: UserAnswer } }
  | { type: 'QUESTION_COMPLETE'; payload: { question: QuizQuestion; answer: UserAnswer } }
  | { type: 'TIMER_UPDATE'; payload: { timeRemaining: number } }
  | { type: 'USE_POWERUP'; payload: { powerup: string } }
  | { type: 'MULTIPLAYER_EVENT'; payload: any }
  | { type: 'CUSTOM'; payload: any }

// Keyboard shortcuts for accessibility
export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifier?: 'ctrl' | 'alt' | 'shift'
}

// Registry for managing game mode plugins
export class GameModeRegistry {
  private modes = new Map<QuizGameMode, GameModePlugin>()
  
  register<T = any>(plugin: GameModePlugin<T>): void {
    this.modes.set(plugin.mode, plugin)
  }
  
  unregister(mode: QuizGameMode): void {
    this.modes.delete(mode)
  }
  
  get(mode: QuizGameMode): GameModePlugin | undefined {
    return this.modes.get(mode)
  }
  
  getAll(): GameModePlugin[] {
    return Array.from(this.modes.values())
  }
  
  getByCategory(category: GameModePlugin['category']): GameModePlugin[] {
    return this.getAll().filter(plugin => plugin.category === category)
  }
  
  getEnabled(): GameModePlugin[] {
    return this.getAll().filter(plugin => plugin.isEnabled)
  }
  
  getAccessible(isAuthenticated: boolean, isPremium: boolean): GameModePlugin[] {
    return this.getEnabled().filter(plugin => {
      if (plugin.requiresAuth && !isAuthenticated) return false
      if (plugin.requiresPremium && !isPremium) return false
      return true
    })
  }
}

// Global registry instance
export const gameModeRegistry = new GameModeRegistry()

// Helper function to create a basic game mode plugin
export function createGameModePlugin<T = any>(
  config: Partial<GameModePlugin<T>> & Pick<GameModePlugin<T>, 'mode' | 'displayName'>
): GameModePlugin<T> {
  return {
    category: 'solo',
    description: '',
    isEnabled: true,
    requiresPremium: false,
    requiresAuth: false,
    config: {
      mode: config.mode,
      settings: {}
    },
    ...config
  }
}

// Type guards for checking mode capabilities
export function hasCustomRender(plugin: GameModePlugin): boolean {
  return !!(
    plugin.renderHeader ||
    plugin.renderQuestion ||
    plugin.renderInterface ||
    plugin.renderFooter ||
    plugin.renderResults
  )
}

export function hasStateManagement(plugin: GameModePlugin): boolean {
  return !!(plugin.getInitialState || plugin.stateReducer)
}

export function hasCustomLogic(plugin: GameModePlugin): boolean {
  return !!(
    plugin.validateAnswer ||
    plugin.calculateScore ||
    plugin.getTimeLimit
  )
}

// Base game mode interface
export interface GameMode<TSettings = any> {
  id: GameModeId
  displayName: string
  description: string
  icon: string
  
  // Default settings for this mode
  defaultSettings: TSettings
  
  // Validation
  validateSettings?: (settings: TSettings) => { valid: boolean; errors?: string[] }
  
  // Hooks for mode-specific behavior
  onModeStart?: (settings: TSettings) => void
  onQuestionStart?: (question: QuizQuestion, questionIndex: number, settings: TSettings) => void
  onAnswerSubmit?: (answer: string, isCorrect: boolean, timeSpent: number, settings: TSettings) => void
  onQuizComplete?: (results: QuizResults, settings: TSettings) => void
  
  // UI customization
  getSettingsUI?: () => React.ReactNode
  getQuestionUI?: (question: QuizQuestion, defaultUI: React.ReactNode, settings: TSettings) => React.ReactNode
  getResultsUI?: (results: QuizResults, defaultUI: React.ReactNode, settings: TSettings) => React.ReactNode
}

// Mode state that can be passed around
export interface ModeState {
  powerupsUsed: string[]
  achievementsEarned: string[]
  bonusPoints: number
  hintsUsed: number
  questionsSkipped: number
  customData?: Record<string, any>
}

// Multi-topic quiz session
export interface MultiTopicQuizSession {
  sessionId: string
  topics: string[]
  questions: QuizQuestion[] // Mixed from all topics
  topicProgress: Record<string, {
    questionsAnswered: number
    correctAnswers: number
  }>
  settings: StandardModeSettings | AIBattleSettings | PVPSettings
} 