import { useCallback } from 'react'
import { useQuestionTimer } from '@/components/quiz/question-timer'
import { multiplayerOperations } from '@/lib/multiplayer'
import { multiplayerNPCIntegration } from '@/lib/multiplayer-npc-integration'
import type { GameState, GameModeConfig } from '../types/game-types'
import type { QuizQuestion } from '@/lib/quiz-data'
import { 
  devLog, 
  isAnswerCorrect, 
  calculateResponseTime, 
  calculateScore,
  calculateSpeedBonus,
  getNPCPlayers,
  generateNPCThinkingTime,
  generateNPCAccuracy
} from '../utils/game-utils'

interface UseAnswerSubmissionProps {
  roomId: string
  playerId: string
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  config: GameModeConfig
  currentQuestion: QuizQuestion | undefined
  players: any[]
  submitResponse: (
    questionNumber: number,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTime: number
  ) => Promise<void>
  stopTimer: () => void
  onAdvanceQuestion: () => Promise<void>
}

interface UseAnswerSubmissionReturn {
  handleAnswerSelect: (answer: string) => void
  handleSubmitAnswer: (answer: string) => Promise<void>
  handleTimeUp: () => Promise<void>
  triggerNPCAnswers: () => void
  showFeedbackAndAdvance: () => Promise<void>
}

export function useAnswerSubmission({
  roomId,
  playerId,
  gameState,
  setGameState,
  config,
  currentQuestion,
  players,
  submitResponse,
  stopTimer,
  onAdvanceQuestion
}: UseAnswerSubmissionProps): UseAnswerSubmissionReturn {

  const handleAnswerSelect = useCallback((answer: string) => {
    if (gameState.isAnswerSubmitted || gameState.gamePhase !== 'question') return
    
    setGameState(prev => ({ ...prev, selectedAnswer: answer }))
    devLog('useAnswerSubmission', 'Answer selected', { answer })
  }, [gameState.isAnswerSubmitted, gameState.gamePhase, setGameState])

  const submitMultiplayerAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || gameState.isAnswerSubmitted) {
      devLog('useAnswerSubmission', 'Answer submission blocked', { 
        hasQuestion: !!currentQuestion, 
        isAnswerSubmitted: gameState.isAnswerSubmitted 
      })
      return
    }

    try {
      devLog('useAnswerSubmission', 'Submitting multiplayer answer', { 
        answer, 
        correctAnswer: currentQuestion.correct_answer,
        questionNumber: currentQuestion.question_number
      })

      const isCorrect = isAnswerCorrect(answer, currentQuestion.correct_answer)
      const responseTime = calculateResponseTime(gameState.questionStartTime, config.timePerQuestion)
      
      // Calculate score with speed bonus if enabled
      let scoreToAdd = calculateScore(isCorrect, 100)
      if (config.speedBonusEnabled && isCorrect) {
        const speedBonus = calculateSpeedBonus(responseTime, config.timePerQuestion)
        scoreToAdd += speedBonus
      }

      devLog('useAnswerSubmission', 'Calling submitResponse', { 
        questionNumber: currentQuestion.question_number,
        questionId: currentQuestion.question_number.toString(),
        selectedAnswer: answer,
        isCorrect,
        responseTime
      })

      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        responseTime
      )

      // Record answer with server for auto-advance logic
      await multiplayerOperations.recordPlayerAnswer(
        roomId, 
        playerId, 
        gameState.currentQuestionIndex,
        config.autoAdvanceDelay || 5
      )

      devLog('useAnswerSubmission', 'Answer submitted successfully', { 
        isCorrect, 
        responseTime,
        scoreAdded: scoreToAdd
      })

      // Update local state
      setGameState(prev => ({
        ...prev,
        selectedAnswer: answer,
        isAnswerSubmitted: true,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        score: prev.score + scoreToAdd
      }))

      // Stop timer
      stopTimer()

    } catch (error) {
      devLog('useAnswerSubmission', 'Failed to submit answer', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error
      })
      console.error('Failed to submit multiplayer answer:', error)
    }
  }, [
    currentQuestion, 
    gameState.isAnswerSubmitted, 
    gameState.questionStartTime, 
    gameState.currentQuestionIndex,
    config.timePerQuestion,
    config.speedBonusEnabled,
    config.autoAdvanceDelay,
    submitResponse, 
    roomId, 
    playerId, 
    setGameState,
    stopTimer
  ])

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    devLog('useAnswerSubmission', 'Handle submit answer called', { answer })
    
    if (gameState.isAnswerSubmitted) {
      devLog('useAnswerSubmission', 'Answer already submitted, ignoring')
      return
    }

    try {
      await submitMultiplayerAnswer(answer)
    } catch (error) {
      devLog('useAnswerSubmission', 'Error in handleSubmitAnswer', { error })
      console.error('Error submitting answer:', error)
    }
  }, [gameState.isAnswerSubmitted, submitMultiplayerAnswer])

  const handleTimeUp = useCallback(async () => {
    devLog('useAnswerSubmission', 'Time up triggered')
    
    if (!gameState.isAnswerSubmitted && currentQuestion) {
      devLog('useAnswerSubmission', 'Auto-submitting empty answer due to timeout')
      
      try {
        const timeoutAnswer = gameState.selectedAnswer || "timeout"
        await submitMultiplayerAnswer(timeoutAnswer)
      } catch (error) {
        devLog('useAnswerSubmission', 'Error in handleTimeUp', { error })
        console.error('Error submitting timeout answer:', error)
      }
    }
  }, [gameState.isAnswerSubmitted, gameState.selectedAnswer, currentQuestion, submitMultiplayerAnswer])

  const triggerNPCAnswers = useCallback(() => {
    // Trigger NPCs to answer after human players
    const npcPlayers = getNPCPlayers(players)

    npcPlayers.forEach((npc, index) => {
      setTimeout(() => {
        // Simulate NPC thinking and answering
        const thinkingTime = generateNPCThinkingTime()
        
        setTimeout(async () => {
          try {
            // Simulate NPC answer submission
            const isCorrect = generateNPCAccuracy()
            const npcAnswer = isCorrect ? currentQuestion?.correct_answer : (currentQuestion?.option_a || "wrong")
            
            if (currentQuestion) {
              await submitResponse(
                currentQuestion.question_number,
                currentQuestion.question_number.toString(),
                npcAnswer || "unknown",
                isCorrect,
                Math.round(thinkingTime / 1000)
              )
              
              devLog('useAnswerSubmission', 'NPC answer submitted', { 
                npcName: npc.player_name,
                answer: npcAnswer,
                isCorrect,
                thinkingTime
              })
            }
          } catch (error) {
            console.warn('NPC answer submission failed:', error)
          }
        }, thinkingTime)
      }, index * 500) // Stagger NPC responses
    })
  }, [players, currentQuestion, submitResponse])

  const showFeedbackAndAdvance = useCallback(async () => {
    if (!currentQuestion) return

    devLog('useAnswerSubmission', 'Showing feedback and preparing to advance')

    // Show feedback first
    setGameState(prev => ({ ...prev, showFeedback: true }))

    // Trigger NPC responses after a delay
    setTimeout(() => {
      triggerNPCAnswers()
    }, Math.random() * 3000 + 1000) // 1-4 seconds delay

    // Wait for feedback display, then advance
    setTimeout(async () => {
      if (config.showExplanations) {
        // Show explanation for a bit longer
        setTimeout(onAdvanceQuestion, 2000)
      } else {
        // Advance quickly for speed modes
        await onAdvanceQuestion()
      }
    }, config.showExplanations ? 3000 : 1500)
  }, [currentQuestion, config.showExplanations, setGameState, triggerNPCAnswers, onAdvanceQuestion])

  return {
    handleAnswerSelect,
    handleSubmitAnswer,
    handleTimeUp,
    triggerNPCAnswers,
    showFeedbackAndAdvance
  }
} 