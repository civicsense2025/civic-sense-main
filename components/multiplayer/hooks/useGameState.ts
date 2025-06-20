import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createMultiplayerQuizProgress, type BaseQuizState } from '@/lib/progress-storage'
import { multiplayerOperations, type GameState as ServerGameState, useMultiplayerRoom } from '@/lib/multiplayer'
import type { GameState, GameModeConfig } from '../types/game-types'
import type { QuizQuestion } from '@/lib/quiz-data'
import { 
  devLog, 
  isGameCompleted, 
  getNextGameState, 
  generateSessionId,
  updateCountdown
} from '../utils/game-utils'

interface UseGameStateProps {
  roomId: string // This might be a room code or room ID
  playerId: string
  questions: QuizQuestion[]
  config: GameModeConfig
}

interface UseGameStateReturn {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  countdown: number
  sessionId: string
  advanceToNextQuestion: () => Promise<void>
  startCountdown: (duration: number) => void
  saveGameState: () => void
  loadGameState: () => void
  clearGameState: () => void
}

export function useGameState({
  roomId: roomIdOrCode, // Rename to be clearer about what this might be
  playerId,
  questions,
  config
}: UseGameStateProps): UseGameStateReturn {
  const { user } = useAuth()
  
  // Get the actual room data and real UUID room ID
  const { room } = useMultiplayerRoom(roomIdOrCode)
  const actualRoomId = room?.id // This is the actual UUID
  
  // Generate session ID for multiplayer state persistence
  const sessionId = useRef<string>(generateSessionId(roomIdOrCode, playerId))
  
  // Progress storage for multiplayer sessions - use the original roomIdOrCode for consistency
  const progressManager = createMultiplayerQuizProgress(user?.id, undefined, roomIdOrCode)

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    gamePhase: 'waiting',
    showFeedback: false,
    selectedAnswer: null,
    isAnswerSubmitted: false,
    score: 0,
    correctAnswers: 0,
    timeSpentSeconds: 0,
    startTime: null,
    questionStartTime: null,
    answeredPlayers: []
  })

  const [countdown, setCountdown] = useState<number>(0)

  // Convert game state to BaseQuizState for progress storage
  const convertToBaseQuizState = (state: GameState): BaseQuizState => ({
    sessionId: sessionId.current,
    quizType: 'multiplayer',
    topicId: roomIdOrCode, // Use original for storage consistency
    questions,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: {}, // Multiplayer answers are managed server-side
    streak: 0,
    maxStreak: 0,
    startTime: state.startTime || Date.now(),
    responseTimes: {},
    savedAt: Date.now(),
    // Multiplayer-specific fields
    roomId: roomIdOrCode,
    playerId,
    gameMode: config.name,
    playerScores: {
      [playerId]: {
        score: state.score,
        correctAnswers: state.correctAnswers,
        gamePhase: state.gamePhase
      }
    }
  })

  // Save multiplayer state
  const saveGameState = useCallback(() => {
    if (questions.length > 0) {
      const baseState = convertToBaseQuizState(gameState)
      progressManager.save(baseState)
      devLog('useGameState', 'Saved progress', { 
        roomId: roomIdOrCode, 
        playerId, 
        questionIndex: gameState.currentQuestionIndex 
      })
    }
  }, [gameState, questions.length, progressManager, roomIdOrCode, playerId])

  // Load multiplayer state
  const loadGameState = useCallback(() => {
    const baseState = progressManager.load()
    if (baseState && baseState.playerScores) {
      devLog('useGameState', 'Restored progress', { 
        roomId: roomIdOrCode, 
        playerId, 
        questionIndex: baseState.currentQuestionIndex 
      })
      
      const playerData = baseState.playerScores[playerId] || {}
      
      setGameState({
        currentQuestionIndex: baseState.currentQuestionIndex,
        gamePhase: (playerData.gamePhase as GameState['gamePhase']) || 'waiting',
        showFeedback: false,
        selectedAnswer: null,
        isAnswerSubmitted: false,
        score: playerData.score || 0,
        correctAnswers: playerData.correctAnswers || 0,
        timeSpentSeconds: 0,
        startTime: baseState.startTime,
        questionStartTime: null,
        answeredPlayers: []
      })
    }
  }, [progressManager, roomIdOrCode, playerId])

  // Clear multiplayer state
  const clearGameState = useCallback(() => {
    progressManager.clear()
    devLog('useGameState', 'Cleared progress', { roomId: roomIdOrCode, playerId })
  }, [progressManager, roomIdOrCode, playerId])

  // Advance to next question
  const advanceToNextQuestion = useCallback(async () => {
    const isQuizComplete = isGameCompleted(gameState.currentQuestionIndex, questions.length)
    
    if (isQuizComplete) {
      clearGameState()
      setGameState(prev => ({ 
        ...prev, 
        gamePhase: 'completed',
        showFeedback: false
      }))
      devLog('useGameState', 'Quiz completed', { 
        finalScore: gameState.score,
        correctAnswers: gameState.correctAnswers
      })
      return
    }

    // Move to next question
    const nextState = getNextGameState(gameState, false)
    setGameState(prev => ({
      ...prev,
      ...nextState
    }))

    devLog('useGameState', 'Advanced to next question', { 
      newIndex: gameState.currentQuestionIndex + 1 
    })
  }, [gameState, questions.length, clearGameState])

  // Start countdown
  const startCountdown = useCallback((duration: number) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'countdown',
      countdownStartTime: Date.now()
    }))
    setCountdown(duration)
    
    devLog('useGameState', 'Started countdown', { duration })
  }, [])

  // Sync with server game state - only when we have the actual room ID
  useEffect(() => {
    if (!actualRoomId) {
      devLog('useGameState', 'No actual room ID available yet, skipping server sync')
      return
    }

    const syncGameState = async () => {
      try {
        const serverGameState = await multiplayerOperations.getGameState(actualRoomId)
        if (serverGameState) {
          // Map server game state to local game state
          setGameState(prev => ({
            ...prev,
            currentQuestionIndex: serverGameState.currentQuestionIndex || 0,
            gamePhase: serverGameState.gamePhase === 'countdown' ? 'countdown' : 
                      serverGameState.gamePhase === 'question' ? 'question' : 
                      serverGameState.gamePhase === 'completed' ? 'completed' : 'waiting',
            countdownStartTime: serverGameState.countdownStartTime,
            answeredPlayers: serverGameState.answeredPlayers || []
          }))
          
          devLog('useGameState', 'Synced with server game state', serverGameState)
        }
      } catch (error) {
        devLog('useGameState', 'Failed to sync game state', error)
      }
    }

    syncGameState()
    
    // Set up periodic sync every 2 seconds
    const syncInterval = setInterval(syncGameState, 2000)
    return () => clearInterval(syncInterval)
  }, [actualRoomId]) // Use actualRoomId instead of roomIdOrCode

  // Handle countdown phase
  useEffect(() => {
    if (gameState.gamePhase === 'countdown' && gameState.countdownStartTime) {
      const startTime = gameState.countdownStartTime
      const duration = config.countdownDuration || 5
      
      const updateCountdownTimer = () => {
        const { remaining, isComplete } = updateCountdown(startTime, duration)
        setCountdown(remaining)
        
        if (isComplete) {
          // Countdown finished, advance to first question
          setGameState(prev => ({ 
            ...prev, 
            gamePhase: 'question',
            questionStartTime: Date.now()
          }))
          devLog('useGameState', 'Countdown completed, starting questions')
        }
      }

      updateCountdownTimer()
      const countdownInterval = setInterval(updateCountdownTimer, 100)
      return () => clearInterval(countdownInterval)
    }
  }, [gameState.gamePhase, gameState.countdownStartTime, config.countdownDuration])

  // Save state whenever it changes (debounced)
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveGameState()
    }, 1000) // Debounce saves by 1 second

    return () => clearTimeout(saveTimeout)
  }, [saveGameState])

  // Restore state on mount
  useEffect(() => {
    loadGameState()
  }, []) // Only run once on mount

  return {
    gameState,
    setGameState,
    countdown,
    sessionId: sessionId.current,
    advanceToNextQuestion,
    startCountdown,
    saveGameState,
    loadGameState,
    clearGameState
  }
} 