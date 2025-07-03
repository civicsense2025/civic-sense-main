import { debug } from "@/lib/debug-config"
import type { GameState, GameModeConfig } from "../types/game-types"
import type { QuizQuestion } from "@/lib/quiz-data"

// Development-only logging utility
export const devLog = (component: string, action: string, data?: any) => {
  debug.log('multiplayer', `[${component}] ${action}`, data)
}

// Game state calculations
export const calculateProgress = (currentQuestionIndex: number, totalQuestions: number, gamePhase: string): number => {
  if (gamePhase === 'waiting' || gamePhase === 'countdown') {
    return 0
  }
  return ((currentQuestionIndex + 1) / totalQuestions) * 100
}

export const isGameCompleted = (currentQuestionIndex: number, totalQuestions: number): boolean => {
  return currentQuestionIndex >= totalQuestions - 1
}

export const getTimerDuration = (gamePhase: string, countdown: number, config: GameModeConfig): number => {
  if (gamePhase === 'countdown') return countdown
  return config.timePerQuestion / 1000
}

// Player state utilities
export const isPlayerHost = (players: any[], playerId: string): boolean => {
  return players.find(p => p.id === playerId)?.is_host ?? false
}

export const areAllPlayersReady = (players: any[]): boolean => {
  const humanPlayers = players.filter(p => 
    !p.player_name.includes('🤖') && 
    !p.player_name.includes('AI') &&
    !p.guest_token?.includes('npc_')
  )
  return humanPlayers.length > 0 && humanPlayers.every(p => p.is_ready)
}

export const getNPCPlayers = (players: any[]) => {
  return players.filter(p => 
    p.player_name.includes('🤖') || 
    p.player_name.includes('AI') ||
    p.guest_token?.includes('npc_')
  )
}

export const getHumanPlayers = (players: any[]) => {
  return players.filter(p => 
    !p.player_name.includes('🤖') && 
    !p.player_name.includes('AI') &&
    !p.guest_token?.includes('npc_')
  )
}

// Answer validation
export const isAnswerCorrect = (selectedAnswer: string, correctAnswer: string): boolean => {
  return selectedAnswer === correctAnswer
}

export const calculateResponseTime = (questionStartTime: number | null, timePerQuestion: number): number => {
  if (!questionStartTime) return Math.round(timePerQuestion / 1000)
  return Math.round((Date.now() - questionStartTime) / 1000)
}

// Score calculations
export const calculateScore = (isCorrect: boolean, baseScore: number = 100, speedBonus: number = 0): number => {
  if (!isCorrect) return 0
  return baseScore + speedBonus
}

export const calculateSpeedBonus = (responseTime: number, timePerQuestion: number, maxBonus: number = 50): number => {
  const timePerQuestionSeconds = timePerQuestion / 1000
  const speedRatio = Math.max(0, (timePerQuestionSeconds - responseTime) / timePerQuestionSeconds)
  return Math.round(speedRatio * maxBonus)
}

// Game state transitions
export const getNextGameState = (
  currentState: GameState, 
  isQuizComplete: boolean
): Partial<GameState> => {
  if (isQuizComplete) {
    return {
      gamePhase: 'completed',
      showFeedback: false
    }
  }

  return {
    currentQuestionIndex: currentState.currentQuestionIndex + 1,
    selectedAnswer: null,
    isAnswerSubmitted: false,
    showFeedback: false,
    questionStartTime: null
  }
}

// Countdown utilities
export const updateCountdown = (
  startTime: number, 
  duration: number
): { remaining: number; isComplete: boolean } => {
  const elapsed = (Date.now() - startTime) / 1000
  const remaining = Math.max(0, duration - elapsed)
  return {
    remaining: Math.ceil(remaining),
    isComplete: remaining <= 0
  }
}

// Question utilities
export const getQuestionOptions = (question: QuizQuestion) => {
  return [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d }
  ].filter(option => option.text)
}

export const getOptionKey = (options: Array<{key: string, text: string | null}>, text: string): string => {
  return options.find(option => option.text === text)?.key || ''
}

// Session management
export const generateSessionId = (roomId: string, playerId: string): string => {
  return `multiplayer-${roomId}-${playerId}-${Date.now()}`
}

// NPC utilities
export const shouldTriggerNPCAnswers = (
  players: any[], 
  gamePhase: string, 
  isAnswerSubmitted: boolean
): boolean => {
  const npcPlayers = getNPCPlayers(players)
  return npcPlayers.length > 0 && gamePhase === 'question' && isAnswerSubmitted
}

export const generateNPCThinkingTime = (): number => {
  return Math.random() * 3000 + 1000 // 1-4 seconds
}

export const generateNPCAccuracy = (): boolean => {
  return Math.random() > 0.3 // NPCs get 70% correct
}

// Auto-advance utilities
export const shouldAutoAdvance = (
  answeredPlayers: string[], 
  totalPlayers: number, 
  autoAdvanceDelay: number,
  questionStartTime: number | null
): boolean => {
  if (!questionStartTime) return false
  
  const allAnswered = answeredPlayers.length >= totalPlayers
  const timeElapsed = (Date.now() - questionStartTime) / 1000
  const delayPassed = timeElapsed >= autoAdvanceDelay
  
  return allAnswered && delayPassed
}

// Error handling utilities
export const handleGameError = (error: unknown, context: string): string => {
  devLog('GameUtils', `Error in ${context}`, error)
  
  if (error instanceof Error) {
    return error.message
  } else if (error && typeof error === 'object') {
    if ('message' in error) {
      return String(error.message)
    } else if ('error' in error) {
      return String(error.error)
    }
  }
  
  return 'An unexpected error occurred'
} 