"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { QuizResults } from "@/components/quiz/quiz-results"
import { QuestionFeedbackDisplay } from "@/components/quiz/question-feedback-display"
import { QuestionTimer, useQuestionTimer } from "@/components/quiz/question-timer"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { useMultiplayerRoom, multiplayerOperations } from "@/lib/multiplayer"
import { usePremium } from "@/hooks/usePremium"
import { useAnalytics } from "@/utils/analytics"

// =============================================================================
// BASE MULTIPLAYER ENGINE TYPES
// =============================================================================

export interface MultiplayerGameState {
  currentQuestionIndex: number
  userAnswers: MultiplayerUserAnswer[]
  showResults: boolean
  gamePhase: 'waiting' | 'active' | 'between_questions' | 'completed'
  timeRemaining: number
  playerScores: Record<string, PlayerScore>
  eliminatedPlayers?: string[]
  currentRound?: number
}

export interface MultiplayerUserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
  submittedAt: number
  playerId: string
}

export interface PlayerScore {
  playerId: string
  playerName: string
  score: number
  correctAnswers: number
  totalAnswered: number
  averageTime: number
  isEliminated?: boolean
  rank?: number
}

export interface GameModeConfig {
  id: string
  name: string
  timePerQuestion: number
  showRealTimeScores: boolean
  allowHints: boolean
  showExplanations: boolean
  eliminationEnabled: boolean
  speedBonusEnabled: boolean
  collaborativeFeatures: boolean
}

export interface BaseMultiplayerEngineProps {
  questions: QuizQuestion[]
  topicId: string
  roomId: string
  playerId: string
  gameMode: string
  onComplete: () => void
  config: GameModeConfig
  currentTopic?: {
    id: string
    title: string
    emoji: string
    date: string
    dayOfWeek: string
  }
}

// =============================================================================
// BASE MULTIPLAYER ENGINE COMPONENT
// =============================================================================

export function BaseMultiplayerEngine({
  questions,
  topicId,
  roomId,
  playerId,
  gameMode,
  onComplete,
  config
}: BaseMultiplayerEngineProps) {
  const { user } = useAuth()
  const { isPremium } = usePremium()
  const { trackQuiz } = useAnalytics()

  console.log('🎮 BaseMultiplayerEngine - Initializing with:', {
    questionsCount: questions.length,
    topicId,
    roomId,
    playerId,
    gameMode,
    config: config.name
  })

  // Room state from multiplayer hook
  const { room, players } = useMultiplayerRoom(roomId)

  // Game state
  const [gameState, setGameState] = useState<MultiplayerGameState>({
    currentQuestionIndex: 0,
    userAnswers: [],
    showResults: false,
    gamePhase: 'active',
    timeRemaining: config.timePerQuestion,
    playerScores: {},
    eliminatedPlayers: [],
    currentRound: 1
  })

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionStartTime] = useState(Date.now())

  // Timer integration
  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer(config.timePerQuestion)

  // Current question
  const currentQuestion = useMemo(() => {
    const question = questions[gameState.currentQuestionIndex]
    console.log('🎮 BaseMultiplayerEngine - Current question:', {
      index: gameState.currentQuestionIndex,
      question: question ? question.question : 'NO QUESTION',
      questionType: question?.question_type
    })
    return question
  }, [questions, gameState.currentQuestionIndex])
  
  const isLastQuestion = useMemo(() => gameState.currentQuestionIndex === questions.length - 1, [gameState.currentQuestionIndex, questions.length])
  const progress = useMemo(() => ((gameState.currentQuestionIndex + 1) / questions.length) * 100, [gameState.currentQuestionIndex, questions.length])

  // Add validation for required data
  if (!questions || questions.length === 0) {
    console.error('🎮 BaseMultiplayerEngine - No questions provided!')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
            <p className="text-muted-foreground mb-6">
              This quiz doesn't have any questions yet.
            </p>
            <Button onClick={onComplete}>
              Back to Lobby
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    console.error('🎮 BaseMultiplayerEngine - Current question is undefined!')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Question Loading Error</h1>
            <p className="text-muted-foreground mb-6">
              Unable to load the current question. Question index: {gameState.currentQuestionIndex}
            </p>
            <Button onClick={onComplete}>
              Back to Lobby
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // CORE MULTIPLAYER FUNCTIONALITY
  // =============================================================================

  // Submit answer to multiplayer system
  const submitMultiplayerAnswer = useCallback(async (
    answer: string,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    try {
      // Create attempt if not exists
      const attemptId = `attempt_${playerId}_${Date.now()}`
      
      // Submit to multiplayer system
      await multiplayerOperations.submitQuestionResponse({
        room_id: roomId,
        player_id: playerId,
        attempt_id: attemptId,
        question_number: gameState.currentQuestionIndex + 1,
        question_id: currentQuestion.question_number.toString(),
        selected_answer: answer,
        is_correct: isCorrect,
        response_time_seconds: timeSpent
      })

      // Update local game state
      const newAnswer: MultiplayerUserAnswer = {
        questionId: currentQuestion.question_number,
        answer,
        isCorrect,
        timeSpent,
        submittedAt: Date.now(),
        playerId
      }

      setGameState(prev => ({
        ...prev,
        userAnswers: [...prev.userAnswers, newAnswer]
      }))

    } catch (error) {
      console.error('Failed to submit multiplayer answer:', error)
    }
  }, [roomId, playerId, gameState.currentQuestionIndex, currentQuestion])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer: string) => {
    if (isAnswerSubmitted) return
    setSelectedAnswer(answer)
  }, [isAnswerSubmitted])

  // Handle answer submission
  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || isAnswerSubmitted) return

    setIsAnswerSubmitted(true)
    stopTimer()

    const isCorrect = selectedAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim()
    const timeSpent = Math.max(1, config.timePerQuestion - timeLeft)

    await submitMultiplayerAnswer(selectedAnswer, isCorrect, timeSpent)

    if (config.showExplanations) {
      setShowFeedback(true)
    } else {
      // Move to next question immediately for speed modes
      setTimeout(() => handleNextQuestion(), 1000)
    }
  }, [selectedAnswer, isAnswerSubmitted, currentQuestion.correct_answer, config.timePerQuestion, timeLeft, config.showExplanations, submitMultiplayerAnswer, stopTimer])

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setGameState(prev => ({ ...prev, showResults: true, gamePhase: 'completed' }))
      onComplete()
    } else {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        gamePhase: 'active'
      }))
      setSelectedAnswer(null)
      setIsAnswerSubmitted(false)
      setShowHint(false)
      setShowFeedback(false)
      resetTimer()
    }
  }, [isLastQuestion, onComplete, resetTimer])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!isAnswerSubmitted) {
      handleSubmitAnswer()
    }
  }, [isAnswerSubmitted, handleSubmitAnswer])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && isTimerActive) {
      handleTimeUp()
    }
  }, [timeLeft, isTimerActive, handleTimeUp])

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderGameModeHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="flex items-center gap-2">
          {gameMode === 'speed_round' && <Zap className="h-4 w-4" />}
          {gameMode === 'elimination' && <Trophy className="h-4 w-4" />}
          {gameMode === 'classic' && <Users className="h-4 w-4" />}
          {config.name}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Question {gameState.currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {config.showRealTimeScores && (
          <div className="text-sm font-medium">
            Your Score: {gameState.playerScores[playerId]?.score || 0}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {timeLeft}s
        </div>
      </div>
    </div>
  )

  const renderQuestion = () => (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto">
        <GlossaryLinkText text={currentQuestion.question} />
      </h1>

      {showHint && config.allowHints && currentQuestion.hint && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg p-6 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              💡 <GlossaryLinkText text={currentQuestion.hint} />
            </p>
          </div>
        </div>
      )}

      {/* Question type rendering will be handled by extending components */}
      {renderQuestionContent()}
    </div>
  )

  // This will be overridden by extending components
  const renderQuestionContent = () => {
    // Default multiple choice rendering
    if (currentQuestion.question_type === 'multiple_choice') {
      const options = [
        currentQuestion.option_a,
        currentQuestion.option_b,
        currentQuestion.option_c,
        currentQuestion.option_d
      ].filter((option): option is string => Boolean(option))

      return (
        <div className="space-y-3 max-w-2xl mx-auto">
          {options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === option ? "default" : "outline"}
              className="w-full text-left justify-start p-6 h-auto"
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswerSubmitted}
            >
              <span className="font-medium mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              <GlossaryLinkText text={option} />
            </Button>
          ))}
        </div>
      )
    }

    return <div>Unsupported question type: {currentQuestion.question_type}</div>
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (gameState.showResults) {
    return (
      <QuizResults
        questions={questions}
        userAnswers={gameState.userAnswers.map(a => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent
        }))}
        topicId={topicId}
        onFinish={onComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {renderGameModeHeader()}
        
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8">
          <QuestionTimer
            initialTime={config.timePerQuestion}
            isActive={isTimerActive}
            onTimeUp={handleTimeUp}
          />
        </div>

        {renderQuestion()}

        {showFeedback && config.showExplanations && (
          <div className="mt-8">
            <QuestionFeedbackDisplay
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              timeLeft={timeLeft}
              isLastQuestion={isLastQuestion}
              onNextQuestion={handleNextQuestion}
            />
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          {config.allowHints && !showHint && !isAnswerSubmitted && (
            <Button
              variant="outline"
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2"
            >
              💡 Show Hint
            </Button>
          )}

          {selectedAnswer && !isAnswerSubmitted && (
            <Button
              onClick={handleSubmitAnswer}
              className="px-8"
            >
              Submit Answer
            </Button>
          )}

          {isAnswerSubmitted && showFeedback && (
            <Button
              onClick={handleNextQuestion}
              className="px-8"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// GAME MODE CONFIGS
// =============================================================================

export const GAME_MODE_CONFIGS: Record<string, GameModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Quiz',
    timePerQuestion: 60,
    showRealTimeScores: false,
    allowHints: true,
    showExplanations: true,
    eliminationEnabled: false,
    speedBonusEnabled: false,
    collaborativeFeatures: false
  },
  speed_round: {
    id: 'speed_round',
    name: 'Speed Round',
    timePerQuestion: 20,
    showRealTimeScores: true,
    allowHints: false,
    showExplanations: false,
    eliminationEnabled: false,
    speedBonusEnabled: true,
    collaborativeFeatures: false
  },
  elimination: {
    id: 'elimination',
    name: 'Elimination',
    timePerQuestion: 30,
    showRealTimeScores: true,
    allowHints: false,
    showExplanations: false,
    eliminationEnabled: true,
    speedBonusEnabled: false,
    collaborativeFeatures: false
  },
  learning_lab: {
    id: 'learning_lab',
    name: 'Learning Lab',
    timePerQuestion: 90,
    showRealTimeScores: false,
    allowHints: true,
    showExplanations: true,
    eliminationEnabled: false,
    speedBonusEnabled: false,
    collaborativeFeatures: true
  }
} 