import type { QuizQuestion } from "@/lib/quiz-data"

export interface GameModeConfig {
  name: string
  timePerQuestion: number
  showExplanations: boolean
  allowHints: boolean
  allowBoosts: boolean
  showRealTimeScores?: boolean
  speedBonusEnabled?: boolean
  eliminationMode?: boolean
  collaborativeMode?: boolean
  autoAdvanceDelay?: number // seconds to auto-advance after everyone answers
  countdownDuration?: number // seconds for game start countdown
}

export interface GameState {
  currentQuestionIndex: number
  gamePhase: 'waiting' | 'countdown' | 'question' | 'between_questions' | 'completed'
  showFeedback: boolean
  selectedAnswer: string | null
  isAnswerSubmitted: boolean
  score: number
  correctAnswers: number
  timeSpentSeconds: number
  startTime: number | null
  questionStartTime: number | null
  countdownStartTime?: number
  answeredPlayers?: string[]
}

export interface HostSettings {
  allowNewPlayers: boolean
  allowBoosts: boolean
  allowHints: boolean
  autoAdvanceQuestions: boolean
  showRealTimeScores: boolean
  chatEnabled: boolean
}

export interface CurrentTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

export interface BaseMultiplayerEngineProps {
  questions: QuizQuestion[]
  topicId: string
  roomId: string
  playerId: string
  gameMode: string
  onComplete: () => void
  config: GameModeConfig
  currentTopic: CurrentTopic
}

export interface GamePhaseProps {
  gameState: GameState
  currentQuestion: QuizQuestion | undefined
  config: GameModeConfig
  currentTopic: CurrentTopic
  questions: QuizQuestion[]
  onStartGame: () => void
  isHost: boolean
  allPlayersReady: boolean
  countdown: number
}

export interface QuestionPhaseProps {
  currentQuestion: QuizQuestion
  gameState: GameState
  config: GameModeConfig
  onAnswerSelect: (answer: string) => void
  onSubmitAnswer: (answer: string) => void
  onShowHint: () => void
  isAnswerSubmitted: boolean
  showHint: boolean
}

export const GAME_MODE_CONFIGS: Record<string, GameModeConfig> = {
  classic: {
    name: "Classic Quiz",
    timePerQuestion: 45000,
    showExplanations: true,
    allowHints: true,
    allowBoosts: true,
    showRealTimeScores: true,
    autoAdvanceDelay: 8,
    countdownDuration: 5
  },
  speed_round: {
    name: "Speed Round",
    timePerQuestion: 15000,
    showExplanations: false,
    allowHints: false,
    allowBoosts: false,
    speedBonusEnabled: true,
    showRealTimeScores: true,
    autoAdvanceDelay: 3,
    countdownDuration: 3
  },
  elimination: {
    name: "Elimination",
    timePerQuestion: 30000,
    showExplanations: true,
    allowHints: false,
    allowBoosts: false,
    eliminationMode: true,
    showRealTimeScores: true,
    autoAdvanceDelay: 5,
    countdownDuration: 5
  },
  learning_lab: {
    name: "Learning Lab",
    timePerQuestion: 60000,
    showExplanations: true,
    allowHints: true,
    allowBoosts: true,
    collaborativeMode: true,
    showRealTimeScores: false,
    autoAdvanceDelay: 10,
    countdownDuration: 3
  },
  matching: {
    name: "Matching Challenge",
    timePerQuestion: 120000, // 2 minutes for matching puzzles
    showExplanations: true,
    allowHints: true,
    allowBoosts: false,
    collaborativeMode: true,
    showRealTimeScores: true,
    speedBonusEnabled: true,
    autoAdvanceDelay: 8,
    countdownDuration: 5
  }
} 