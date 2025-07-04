"use client"

import { useMemo, useCallback } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./game-modes/base-multiplayer-engine"
import { SpeedRoundEngine } from "./game-modes/speed-round-engine"
import { MatchingEngine } from "./game-modes/matching-engine"
import { EliminationEngine } from "./game-modes/elimination-engine"
import { LearningLabEngine } from "./game-modes/learning-lab-engine"
import { useMultiplayerRoom } from '../lib/multiplayer/operations'
import type { QuizQuestion } from '@civicsense/types/quiz'
import React from "react"

import { debug } from '@civicsense/business-logic/utils/debug-config'

// Development-only logging utility
const devLog = (message: string, data?: any) => {
  debug.log('multiplayer', `[MultiplayerQuizRouter] ${message}`, data)
}

// =============================================================================
// ERROR BOUNDARY FOR MULTIPLAYER ROUTER
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class MultiplayerRouterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    devLog('Error caught by boundary', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    devLog('Component error details', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md mx-auto p-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-light text-slate-900 dark:text-white">Game Engine Error</h1>
                <p className="text-slate-600 dark:text-slate-400 font-light">
                  {this.state.error?.message || 'A game engine error occurred.'}
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-500">Error Details</summary>
                  <pre className="mt-2 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-8 py-3 rounded-full font-light"
              >
                Reload Game
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// =============================================================================
// MULTIPLAYER QUIZ ROUTER COMPONENT
// =============================================================================

interface MultiplayerQuizRouterProps {
  questions: QuizQuestion[]
  topicId: string
  roomId: string
  playerId: string
  onComplete: () => void
  currentTopic: {
    id: string
    title: string
    emoji: string
    date: string
    dayOfWeek: string
  }
}

function MultiplayerQuizRouterInternal({
  questions,
  topicId,
  roomId,
  playerId,
  onComplete,
  currentTopic
}: MultiplayerQuizRouterProps) {
  devLog('Component render', {
    questionsCount: questions.length,
    topicId,
    roomId,
    playerId,
    hasCurrentTopic: !!currentTopic
  })

  const { room, isLoading, error } = useMultiplayerRoom(roomId)

  // Validate questions first
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-900 dark:text-white">No Questions Available</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                This quiz doesn't have any questions yet.
              </p>
            </div>
            <button
              onClick={onComplete}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-8 py-3 rounded-full font-light"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Validate and transform questions for multiplayer
  const validatedQuestions = useMemo(() => {
    const validated = questions.map((question, index) => {
      // Ensure question has required fields with proper types
      const validatedQuestion: QuizQuestion = {
        ...question,
        question_number: question.question_number || (index + 1),
        question_type: question.question_type || 'multiple_choice',
        category: question.category || 'General',
        hint: question.hint || '',
        explanation: question.explanation || '',
        tags: Array.isArray(question.tags) ? question.tags : [],
        sources: Array.isArray(question.sources) ? question.sources : []
      }
      
      // Validate multiple choice questions have options
      if (validatedQuestion.question_type === 'multiple_choice') {
        if (!validatedQuestion.option_a || !validatedQuestion.option_b) {
          devLog('Question missing required options', {
            questionNumber: validatedQuestion.question_number,
            hasOptions: {
              a: !!validatedQuestion.option_a,
              b: !!validatedQuestion.option_b,
              c: !!validatedQuestion.option_c,
              d: !!validatedQuestion.option_d
            }
          })
        }
      }
      
      return validatedQuestion
    })
    
    devLog('Questions validated', {
      originalCount: questions.length,
      validatedCount: validated.length
    })
    
    return validated
  }, [questions])

  // Determine game mode from room settings with proper typing
  const gameMode = useMemo(() => {
    const mode = room?.game_mode || 'classic'
    devLog('Game mode determined', { mode, fromRoom: !!room?.game_mode })
    return mode as keyof typeof GAME_MODE_CONFIGS
  }, [room?.game_mode])

  // Prepare props for game mode engines
  const engineProps = useMemo<BaseMultiplayerEngineProps>(() => ({
    questions: validatedQuestions,
    topicId,
    roomId,
    playerId,
    gameMode,
    onComplete,
    config: GAME_MODE_CONFIGS[gameMode] || GAME_MODE_CONFIGS.classic,
    currentTopic
  }), [validatedQuestions, topicId, roomId, playerId, gameMode, onComplete, currentTopic])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-xl font-light text-slate-900 dark:text-white">Loading multiplayer quiz...</h2>
              <p className="text-sm font-light text-slate-500 dark:text-slate-500">
                Preparing {gameMode.replace('_', ' ')} mode...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-900 dark:text-white">Room Not Available</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                {error || "The multiplayer room could not be loaded."}
              </p>
            </div>
            <button
              onClick={onComplete}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-8 py-3 rounded-full font-light"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Route to appropriate game mode engine
  devLog('Routing to game engine', { gameMode })
  
  try {
    switch (gameMode) {
      case 'speed_round':
        return <SpeedRoundEngine {...engineProps} />
      
      case 'matching':
        return <MatchingEngine {...engineProps} />
      
      case 'elimination':
        return <EliminationEngine {...engineProps} />
      
      case 'learning_lab':
        return <LearningLabEngine {...engineProps} />
      
      case 'classic':
      default:
        return <BaseMultiplayerEngine {...engineProps} />
    }
  } catch (error) {
    devLog('Error during engine routing', error)
    throw error // Let error boundary catch this
  }
}

// Export with error boundary wrapper
export const MultiplayerQuizRouter = React.memo(function MultiplayerQuizRouter(props: MultiplayerQuizRouterProps) {
  return (
    <MultiplayerRouterErrorBoundary>
      <MultiplayerQuizRouterInternal {...props} />
    </MultiplayerRouterErrorBoundary>
  )
})

// =============================================================================
// GAME MODE DISPLAY HELPERS
// =============================================================================

export function getGameModeDisplayName(gameMode: string): string {
  const config = GAME_MODE_CONFIGS[gameMode as keyof typeof GAME_MODE_CONFIGS]
  return config?.name || 'Classic Quiz'
}

export function getGameModeDescription(gameMode: string): string {
  switch (gameMode) {
    case 'classic':
      return 'Traditional quiz format with detailed explanations and balanced pacing'
    case 'speed_round':
      return 'Fast-paced competitive quiz with real-time leaderboards and speed bonuses'
    case 'matching':
      return 'Collaborative puzzle-solving with team hints and matching challenges'
    case 'elimination':
      return 'High-stakes survival mode where wrong answers eliminate players'
    case 'learning_lab':
      return 'Collaborative learning with AI teachers and group discussion features'
    default:
      return 'Multiplayer quiz experience'
  }
}

export function getGameModeIcon(gameMode: string): string {
  switch (gameMode) {
    case 'classic':
      return '📚'
    case 'speed_round':
      return '⚡'
    case 'matching':
      return '🧩'
    case 'elimination':
      return '🏆'
    case 'learning_lab':
      return '🧪'
    default:
      return '🎮'
  }
} 