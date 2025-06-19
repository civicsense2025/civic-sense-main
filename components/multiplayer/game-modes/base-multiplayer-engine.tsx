"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { QuestionTimer, useQuestionTimer } from "@/components/quiz/question-timer"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { PlayerPanel } from "@/components/multiplayer/player-panel"
import { HostSettingsMenu } from "@/components/multiplayer/host-settings-menu"
import { ChatSidebar } from "@/components/multiplayer/chat-sidebar"
import { Leaderboard } from "@/components/multiplayer/leaderboard"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Zap, MessageCircle, Crown, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { 
  useMultiplayerRoom, 
  useMultiplayerQuiz
} from "@/lib/multiplayer"
import { createMultiplayerQuizProgress, type BaseQuizState } from "@/lib/progress-storage"

import { debug } from "@/lib/debug-config"

// Development-only logging utility
const devLog = (component: string, action: string, data?: any) => {
  debug.log('multiplayer', `[${component}] ${action}`, data)
}

// =============================================================================
// GAME MODE CONFIGURATION
// =============================================================================

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
}

export const GAME_MODE_CONFIGS: Record<string, GameModeConfig> = {
  classic: {
    name: "Classic Quiz",
    timePerQuestion: 45000,
    showExplanations: true,
    allowHints: true,
    allowBoosts: true,
    showRealTimeScores: true
  },
  speed_round: {
    name: "Speed Round",
    timePerQuestion: 15000,
    showExplanations: false,
    allowHints: false,
    allowBoosts: false,
    speedBonusEnabled: true,
    showRealTimeScores: true
  },
  elimination: {
    name: "Elimination",
    timePerQuestion: 30000,
    showExplanations: true,
    allowHints: false,
    allowBoosts: false,
    eliminationMode: true,
    showRealTimeScores: true
  },
  learning_lab: {
    name: "Learning Lab",
    timePerQuestion: 60000,
    showExplanations: true,
    allowHints: true,
    allowBoosts: true,
    collaborativeMode: true,
    showRealTimeScores: false
  },
  matching: {
    name: "Matching Challenge",
    timePerQuestion: 120000, // 2 minutes for matching puzzles
    showExplanations: true,
    allowHints: true,
    allowBoosts: false,
    collaborativeMode: true,
    showRealTimeScores: true,
    speedBonusEnabled: true
  }
}

// =============================================================================
// COMPONENT PROPS INTERFACE
// =============================================================================

export interface BaseMultiplayerEngineProps {
  questions: QuizQuestion[]
  topicId: string
  roomId: string
  playerId: string
  gameMode: string
  onComplete: () => void
  config: GameModeConfig
  currentTopic: {
    id: string
    title: string
    emoji: string
    date: string
    dayOfWeek: string
  }
}

// =============================================================================
// GAME STATE INTERFACE
// =============================================================================

interface GameState {
  currentQuestionIndex: number
  gamePhase: 'waiting' | 'active' | 'between_questions' | 'completed'
  showFeedback: boolean
  selectedAnswer: string | null
  isAnswerSubmitted: boolean
  score: number
  correctAnswers: number
  timeSpentSeconds: number
  startTime: number | null
  questionStartTime: number | null
}

interface HostSettings {
  allowNewPlayers: boolean
  allowBoosts: boolean
  allowHints: boolean
  autoAdvanceQuestions: boolean
  showRealTimeScores: boolean
  chatEnabled: boolean
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BaseMultiplayerEngine({
  questions,
  topicId,
  roomId,
  playerId,
  gameMode,
  onComplete,
  config,
  currentTopic
}: BaseMultiplayerEngineProps) {
  devLog('BaseMultiplayerEngine', 'Component mounted', { 
    questionsCount: questions.length, 
    topicId, 
    roomId, 
    playerId, 
    gameMode 
  })

  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================

  const { user } = useAuth()
  
  // Room state from multiplayer hook
  const { room, players } = useMultiplayerRoom(roomId)
  
  // Quiz responses from multiplayer quiz hook
  const { responses, submitResponse } = useMultiplayerQuiz(roomId, playerId)

  // Progress storage for multiplayer sessions
  const progressManager = createMultiplayerQuizProgress(user?.id, undefined, roomId)

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    gamePhase: 'active',
    showFeedback: false,
    selectedAnswer: null,
    isAnswerSubmitted: false,
    score: 0,
    correctAnswers: 0,
    timeSpentSeconds: 0,
    startTime: null,
    questionStartTime: null
  })

  // Host settings state
  const [hostSettings, setHostSettings] = useState<HostSettings>({
    allowNewPlayers: true,
    allowBoosts: config.allowBoosts ?? true,
    allowHints: config.allowHints,
    autoAdvanceQuestions: true,
    showRealTimeScores: config.showRealTimeScores ?? true,
    chatEnabled: true
  })

  // UI state
  const [chatOpen, setChatOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [showHostSettings, setShowHostSettings] = useState(false)

  // Timer hook
  const { timeLeft, isActive: isTimerActive, startTimer, stopTimer } = useQuestionTimer(config.timePerQuestion / 1000)

  // Generate session ID for multiplayer state persistence
  const sessionId = useRef<string>(`multiplayer-${roomId}-${playerId}-${Date.now()}`)

  // Convert game state to BaseQuizState for progress storage
  const convertToBaseQuizState = (state: GameState): BaseQuizState => ({
    sessionId: sessionId.current,
    quizType: 'multiplayer',
    topicId: roomId,
    questions,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: {}, // Multiplayer answers are managed server-side
    streak: 0,
    maxStreak: 0,
    startTime: state.startTime || Date.now(),
    responseTimes: {},
    savedAt: Date.now(),
    roomId,
    playerId,
    gameMode
  })

  // Save multiplayer state
  const saveMultiplayerState = (state: GameState) => {
    if (questions.length > 0) {
      const baseState = convertToBaseQuizState(state)
      progressManager.save(baseState)
      devLog('MultiplayerEngine', 'Saved progress', { roomId, playerId, questionIndex: state.currentQuestionIndex })
    }
  }

  // Load multiplayer state
  const loadMultiplayerState = (): GameState | null => {
    const baseState = progressManager.load()
    if (baseState) {
      devLog('MultiplayerEngine', 'Restored progress', { roomId, playerId, questionIndex: baseState.currentQuestionIndex })
      return {
        currentQuestionIndex: baseState.currentQuestionIndex,
        gamePhase: 'active',
        showFeedback: false,
        selectedAnswer: null,
        isAnswerSubmitted: false,
        score: 0,
        correctAnswers: 0,
        timeSpentSeconds: 0,
        startTime: baseState.startTime,
        questionStartTime: null
      }
    }
    return null
  }

  // Clear multiplayer state
  const clearMultiplayerState = () => {
    progressManager.clear()
    devLog('MultiplayerEngine', 'Cleared progress', { roomId, playerId })
  }

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const currentQuestion = useMemo(() => {
    const question = questions[gameState.currentQuestionIndex]
    devLog('BaseMultiplayerEngine', 'Current question computed', { 
      index: gameState.currentQuestionIndex, 
      question: question?.question 
    })
    return question
  }, [questions, gameState.currentQuestionIndex])

  const progress = useMemo(() => {
    const prog = ((gameState.currentQuestionIndex + 1) / questions.length) * 100
    devLog('BaseMultiplayerEngine', 'Progress calculated', { progress: prog })
    return prog
  }, [gameState.currentQuestionIndex, questions.length])

  const isHost = useMemo(() => {
    const host = players.find(p => p.id === playerId)?.is_host ?? false
    devLog('BaseMultiplayerEngine', 'Host status checked', { isHost: host, playerId })
    return host
  }, [players, playerId])

  const isAnswerSubmitted = gameState.isAnswerSubmitted

  // =============================================================================
  // QUESTION ADVANCEMENT
  // =============================================================================

  const advanceToNextQuestion = useCallback(async () => {
    if (gameState.currentQuestionIndex >= questions.length - 1) {
      // Quiz completed - clear saved progress
      clearMultiplayerState()
      setGameState(prev => ({ 
        ...prev, 
        gamePhase: 'completed',
        showFeedback: false
      }))
      onComplete()
      return
    }

    // Move to next question
    setGameState(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      selectedAnswer: null,
      isAnswerSubmitted: false,
      showFeedback: false,
      questionStartTime: null
    }))

    devLog('BaseMultiplayerEngine', 'Advanced to next question', { 
      newIndex: gameState.currentQuestionIndex + 1 
    })
  }, [gameState.currentQuestionIndex, questions.length, onComplete])

  const showFeedbackAndAdvance = useCallback(async () => {
    if (!currentQuestion) return

    // Show feedback first
    setGameState(prev => ({ ...prev, showFeedback: true }))

    // Wait for feedback display, then advance
    setTimeout(async () => {
      if (config.showExplanations) {
        // Show explanation for a bit longer
        setTimeout(advanceToNextQuestion, 2000)
      } else {
        // Advance quickly for speed modes
        await advanceToNextQuestion()
      }
    }, config.showExplanations ? 3000 : 1500)
  }, [currentQuestion, config.showExplanations, advanceToNextQuestion])

  // =============================================================================
  // GAME STATE SYNCHRONIZATION
  // =============================================================================

  const syncGameState = useCallback(async () => {
    if (!room || !isHost) return

    try {
      // Only host can advance the game state for all players
      // This would be implemented with a game_state table or game events
      devLog('BaseMultiplayerEngine', 'Syncing game state as host', {
        currentQuestionIndex: gameState.currentQuestionIndex,
        gamePhase: gameState.gamePhase
      })
      
      // For now, we'll let each player manage their own state
      // In a full implementation, we'd have a multiplayer_game_state table
    } catch (error) {
      devLog('BaseMultiplayerEngine', 'Failed to sync game state', { error })
    }
  }, [room, isHost, gameState])

  // =============================================================================
  // ANSWER SUBMISSION
  // =============================================================================

  const submitMultiplayerAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion || isAnswerSubmitted) {
      devLog('BaseMultiplayerEngine', 'Answer submission blocked', { 
        hasQuestion: !!currentQuestion, 
        isAnswerSubmitted 
      })
      return
    }

    try {
      devLog('BaseMultiplayerEngine', 'Submitting multiplayer answer', { 
        answer, 
        correctAnswer: currentQuestion.correct_answer,
        questionNumber: currentQuestion.question_number
      })

      const isCorrect = answer === currentQuestion.correct_answer
      const responseTime = gameState.questionStartTime 
        ? Math.round((Date.now() - gameState.questionStartTime) / 1000)
        : 30

      // Create attempt ID
      const attemptId = `attempt_${playerId}_${Date.now()}`

      devLog('BaseMultiplayerEngine', 'Calling submitResponse', { 
        questionNumber: currentQuestion.question_number,
        questionId: currentQuestion.question_number.toString(),
        selectedAnswer: answer,
        isCorrect,
        responseTime,
        attemptId
      })

      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        responseTime,
        attemptId
      )

      devLog('BaseMultiplayerEngine', 'Answer submitted successfully', { 
        isCorrect, 
        responseTime, 
        attemptId 
      })

      // Update local state
      setGameState(prev => ({
        ...prev,
        selectedAnswer: answer,
        isAnswerSubmitted: true,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        score: prev.score + (isCorrect ? 100 : 0)
      }))

      // Stop timer
      stopTimer()

      // Show feedback and advance after delay
      await showFeedbackAndAdvance()

    } catch (error) {
      devLog('BaseMultiplayerEngine', 'Failed to submit answer', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error
      })
      console.error('Failed to submit multiplayer answer:', error)
    }
  }, [currentQuestion, isAnswerSubmitted, gameState.questionStartTime, playerId, submitResponse, stopTimer, showFeedbackAndAdvance])

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    devLog('BaseMultiplayerEngine', 'Handle submit answer called', { answer })
    
    if (gameState.isAnswerSubmitted) {
      devLog('BaseMultiplayerEngine', 'Answer already submitted, ignoring')
      return
    }

    try {
      await submitMultiplayerAnswer(answer)
    } catch (error) {
      devLog('BaseMultiplayerEngine', 'Error in handleSubmitAnswer', { error })
      console.error('Error submitting answer:', error)
    }
  }, [gameState.isAnswerSubmitted, submitMultiplayerAnswer])

  const handleTimeUp = useCallback(() => {
    devLog('BaseMultiplayerEngine', 'Time up triggered')
    
    if (!gameState.isAnswerSubmitted && currentQuestion) {
      devLog('BaseMultiplayerEngine', 'Auto-submitting empty answer due to timeout')
      handleSubmitAnswer('')
    }
  }, [gameState.isAnswerSubmitted, currentQuestion, handleSubmitAnswer])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Restore multiplayer state on mount
  useEffect(() => {
    const savedState = loadMultiplayerState()
    if (savedState) {
      setGameState(savedState)
      devLog('MultiplayerEngine', 'Restored multiplayer session state')
    }
  }, []) // Only run once on mount

  // Save state whenever it changes (debounced)
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveMultiplayerState(gameState)
    }, 1000) // Debounce saves by 1 second

    return () => clearTimeout(saveTimeout)
  }, [gameState])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && isTimerActive) {
      handleTimeUp()
    }
  }, [timeLeft, isTimerActive, handleTimeUp])

  // Start question timer when question becomes active
  useEffect(() => {
    if (gameState.gamePhase === 'active' && currentQuestion && !isAnswerSubmitted) {
      devLog('BaseMultiplayerEngine', 'Starting question timer')
      setGameState(prev => ({ ...prev, questionStartTime: Date.now() }))
      startTimer()
    }
  }, [gameState.gamePhase, currentQuestion, isAnswerSubmitted, startTimer])

  // Sync game state when it changes (if host)
  useEffect(() => {
    syncGameState()
  }, [syncGameState])

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderGameModeHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentTopic.emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentTopic.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {config.name} • Question {gameState.currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLeaderboardOpen(!leaderboardOpen)}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </Button>

        {/* Host Settings */}
        {isHost && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHostSettings(!showHostSettings)}
            className="flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            <Settings className="h-4 w-4" />
            Host Settings
          </Button>
        )}
      </div>
    </div>
  )

  const renderQuestionContent = () => {
    if (!currentQuestion) {
      devLog('BaseMultiplayerEngine', 'No current question to render')
      return null
    }

    devLog('BaseMultiplayerEngine', 'Rendering question content', { 
      questionType: currentQuestion.question_type,
      question: currentQuestion.question
    })

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
              <GlossaryLinkText text={currentQuestion.question} />
            </h2>

            {hostSettings.allowHints && currentQuestion.hint && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                    <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Hint:</strong> {currentQuestion.hint}
                  </p>
                </div>
              </div>
            )}
          </div>

          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="grid gap-3">
              {[
                { key: 'A', text: currentQuestion.option_a },
                { key: 'B', text: currentQuestion.option_b },
                { key: 'C', text: currentQuestion.option_c },
                { key: 'D', text: currentQuestion.option_d }
              ].filter(option => option.text).map((option) => {
                const isSelected = gameState.selectedAnswer === option.text
                const isCorrect = option.text === currentQuestion.correct_answer
                const showResult = gameState.showFeedback

                return (
                  <button
                    key={option.key}
                    onClick={() => !isAnswerSubmitted && handleSubmitAnswer(option.text!)}
                    disabled={isAnswerSubmitted}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                      "hover:border-blue-300 dark:hover:border-blue-600",
                      "disabled:cursor-not-allowed",
                      {
                        "border-blue-500 bg-blue-50 dark:bg-blue-950/30": isSelected && !showResult,
                        "border-green-500 bg-green-50 dark:bg-green-950/30": showResult && isCorrect,
                        "border-red-500 bg-red-50 dark:bg-red-950/30": showResult && isSelected && !isCorrect,
                        "border-slate-200 dark:border-slate-700": !isSelected && (!showResult || !isCorrect)
                      }
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold",
                        {
                          "border-blue-500 bg-blue-500 text-white": isSelected && !showResult,
                          "border-green-500 bg-green-500 text-white": showResult && isCorrect,
                          "border-red-500 bg-red-500 text-white": showResult && isSelected && !isCorrect,
                          "border-slate-300 dark:border-slate-600": !isSelected && (!showResult || !isCorrect)
                        }
                      )}>
                        {option.key}
                      </div>
                      <span className="text-slate-900 dark:text-white">
                        <GlossaryLinkText text={option.text!} />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Show explanation when feedback is visible */}
          {gameState.showFeedback && config.showExplanations && currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Explanation:</h3>
              <p className="text-slate-700 dark:text-slate-300">
                <GlossaryLinkText text={currentQuestion.explanation} />
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Game Content */}
        <div className={cn("flex-1 p-6 pb-32", chatOpen ? "mr-80" : "")}>
          {renderGameModeHeader()}
          
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
          </div>

          <div className="mb-8">
            <QuestionTimer
              initialTime={config.timePerQuestion / 1000}
              isActive={isTimerActive}
              onTimeUp={handleTimeUp}
            />
          </div>

          {renderQuestionContent()}
        </div>

        {/* Chat Sidebar */}
        {chatOpen && hostSettings.chatEnabled && (
          <ChatSidebar
            roomId={roomId}
            playerId={playerId}
            players={players}
            isHost={isHost}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {/* Fixed Player Panel at Bottom - Compact Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-3 z-40">
        <PlayerPanel
          players={players}
          currentPlayerId={playerId}
          questionResponses={responses.filter(r => r.question_number === currentQuestion?.question_number)}
          showAnswerStatus={true}
          gamePhase={gameState.gamePhase}
          className="max-w-5xl mx-auto"
        />
      </div>

      {/* Host Settings Modal */}
      {showHostSettings && isHost && (
        <HostSettingsMenu
          settings={hostSettings}
          onSettingsChange={setHostSettings}
          onClose={() => setShowHostSettings(false)}
          playerCount={players.length}
          maxPlayers={6}
          gameMode={config.name}
        />
      )}

      {/* Leaderboard Modal */}
      {leaderboardOpen && (
        <Leaderboard
          players={players}
          responses={responses}
          currentPlayerId={playerId}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
    </div>
  )
} 