"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { QuestionTimer, useQuestionTimer } from "@/components/quiz/question-timer"
import { PlayerPanel } from "@/components/multiplayer/player-panel"
import { HostSettingsMenu } from "@/components/multiplayer/host-settings-menu"
import { ChatSidebar } from "@/components/multiplayer/chat-sidebar"
import { Leaderboard } from "@/components/multiplayer/leaderboard"
import { Progress } from "../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Trophy, MessageCircle, Crown, Settings } from "lucide-react"
import { cn } from "../../utils"
// import useUIStrings from "@civicsense/shared/hooks/useUIStrings" // Temporarily use static strings

// Import our modular components
import { WaitingPhase } from "../game-phases/waiting-phase"
import { CountdownPhase } from "../game-phases/countdown-phase"
import { QuestionPhase } from "../game-phases/question-phase"
import { CompletedPhase } from "../game-phases/completed-phase"

// Import our custom hooks
import { useGameState } from "../hooks/useGameState"
import { useAnswerSubmission } from "../hooks/useAnswerSubmission"

// Import types and utilities
import type { QuizQuestion } from "@civicsense/shared/lib/quiz-data"
import { 
  useMultiplayerRoom, 
  useMultiplayerQuiz,
  multiplayerOperations
} from "@civicsense/shared/lib/multiplayer"
import { multiplayerNPCIntegration } from "@civicsense/shared/lib/multiplayer-npc-integration"

import { debug } from "@civicsense/shared/lib/debug-config"

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
  countdownDuration?: number
}

export const GAME_MODE_CONFIGS: Record<string, GameModeConfig> = {
  classic: {
    name: "Classic Quiz",
    timePerQuestion: 45000,
    showExplanations: true,
    allowHints: true,
    allowBoosts: true,
    showRealTimeScores: true,
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
    countdownDuration: 5
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
    countdownDuration: 5
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
// HOST SETTINGS INTERFACE
// =============================================================================

interface HostSettings {
  allowNewPlayers: boolean
  allowBoosts: boolean
  allowHints: boolean
  autoAdvanceQuestions: boolean
  showRealTimeScores: boolean
  chatEnabled: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const calculateProgress = (currentIndex: number, totalQuestions: number, gamePhase: string) => {
  if (gamePhase === 'waiting' || gamePhase === 'countdown') return 0
  return ((currentIndex + 1) / totalQuestions) * 100
}

const getTimerDuration = (gamePhase: string, countdown: number, config: GameModeConfig) => {
  if (gamePhase === 'countdown') return countdown
  if (gamePhase === 'question') return config.timePerQuestion / 1000
  return 0
}

const isPlayerHost = (players: any[], playerId: string) => {
  return players.find(p => p.id === playerId)?.is_host ?? false
}

const areAllPlayersReady = (players: any[]) => {
  return players.length > 0 && players.every(p => p.is_ready || p.player_name?.includes('🤖'))
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
  
  // Temporary static strings for build fix
  const uiStrings = {
    quiz: {
      questionNumber: "Question"
    },
    multiplayer: {
      settings: "Settings",
      leaderboard: "Leaderboard", 
      chat: "Chat"
    }
  }
  
  // Room state from multiplayer hook with memoization to prevent re-renders
  const { room, players } = useMultiplayerRoom(roomId)
  
  // Quiz responses from multiplayer quiz hook
  const { responses, submitResponse, completeQuizAttempt } = useMultiplayerQuiz(roomId, playerId, topicId, questions.length)

  // Custom game state hook
  const {
    gameState,
    setGameState,
    countdown,
    sessionId,
    advanceToNextQuestion,
    startCountdown,
    saveGameState,
    loadGameState,
    clearGameState
  } = useGameState({
    roomId,
    playerId,
    questions,
    config
  })

  // UI state
  const [showHint, setShowHint] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'leaderboard' | 'chat'>('leaderboard')
  const [showHostSettings, setShowHostSettings] = useState(false)

  // Host settings state
  const [hostSettings, setHostSettings] = useState<HostSettings>({
    allowNewPlayers: true,
    allowBoosts: config.allowBoosts ?? true,
    allowHints: config.allowHints,
    autoAdvanceQuestions: true,
    showRealTimeScores: config.showRealTimeScores ?? true,
    chatEnabled: true
  })

  // Performance optimization: memoize expensive calculations
  const currentQuestion = useMemo(() => {
    if (gameState.gamePhase === 'waiting' || gameState.gamePhase === 'countdown') {
      return questions[0] // Show first question during waiting/countdown
    }
    return questions[gameState.currentQuestionIndex]
  }, [questions, gameState.currentQuestionIndex, gameState.gamePhase])

  const progress = useMemo(() => {
    return calculateProgress(gameState.currentQuestionIndex, questions.length, gameState.gamePhase)
  }, [gameState.currentQuestionIndex, gameState.gamePhase, questions.length])

  const isHost = useMemo(() => {
    return isPlayerHost(players, playerId)
  }, [players, playerId])

  const allPlayersReady = useMemo(() => {
    return areAllPlayersReady(players)
  }, [players])

  // Timer hook with dynamic time based on game phase
  const timerDuration = useMemo(() => {
    return getTimerDuration(gameState.gamePhase, countdown, config)
  }, [gameState.gamePhase, countdown, config])

  const { timeLeft, isActive: isTimerActive, startTimer, stopTimer, resetTimer } = useQuestionTimer(timerDuration)

  // =============================================================================
  // ANSWER SUBMISSION HOOK
  // =============================================================================

  const {
    handleAnswerSelect,
    handleSubmitAnswer,
    handleTimeUp,
    triggerNPCAnswers,
    showFeedbackAndAdvance
  } = useAnswerSubmission({
    roomId: room?.id || roomId,
    playerId,
    gameState,
    setGameState,
    config,
    currentQuestion,
    players,
    submitResponse,
    stopTimer,
    onAdvanceQuestion: async () => {
      await advanceToNextQuestion()
      
      // Check if quiz is completed
      if (gameState.currentQuestionIndex >= questions.length - 1) {
        const timeSpentSeconds = gameState.startTime 
          ? Math.round((Date.now() - gameState.startTime) / 1000)
          : 0
        
        await completeQuizAttempt(gameState.score, gameState.correctAnswers, timeSpentSeconds)
        onComplete()
      }
    }
  })

  // =============================================================================
  // GAME CONTROL FUNCTIONS
  // =============================================================================

  const handleStartGame = useCallback(async () => {
    if (!isHost) return
    
    // Use the actual room ID (UUID) from the room object, not the roomId prop which might be a room code
    const actualRoomId = room?.id
    if (!actualRoomId) {
      console.error('Cannot start game: No room ID available')
      return
    }
    
    try {
      devLog('BaseMultiplayerEngine', 'Starting game with countdown', { actualRoomId })
      const success = await multiplayerOperations.startGameWithCountdown(actualRoomId, config.countdownDuration || 5)
      if (success) {
        startCountdown(config.countdownDuration || 5)
      }
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }, [isHost, room?.id, config.countdownDuration, startCountdown])

  const handleShowHint = useCallback(() => {
    if (!config.allowHints) return
    setShowHint(true)
    
    // Use the actual room ID (UUID) from the room object
    const actualRoomId = room?.id
    if (!actualRoomId) {
      console.warn('Cannot send hint message: No room ID available')
      return
    }
    
    // Notify other players that hint was shown
    multiplayerOperations.sendChatMessage(
      actualRoomId,
      playerId,
      `💡 ${players.find(p => p.id === playerId)?.player_name} revealed a hint for everyone!`,
      'system'
    ).catch(console.error)
  }, [config.allowHints, room?.id, playerId, players])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Handle question phase timer
  useEffect(() => {
    if (gameState.gamePhase === 'question' && currentQuestion && !gameState.isAnswerSubmitted) {
      devLog('BaseMultiplayerEngine', 'Starting question timer')
      setGameState(prev => ({ ...prev, questionStartTime: Date.now() }))
      resetTimer()
      startTimer()
    }
  }, [gameState.gamePhase, currentQuestion, gameState.isAnswerSubmitted, resetTimer, startTimer, setGameState])

  // Handle time up
  useEffect(() => {
    if (timeLeft <= 0 && isTimerActive && gameState.gamePhase === 'question' && !gameState.isAnswerSubmitted) {
      handleTimeUp()
    }
  }, [timeLeft, isTimerActive, gameState.gamePhase, gameState.isAnswerSubmitted, handleTimeUp])

  // NPC integration
  useEffect(() => {
    // Add NPCs when room is active and has space
    if (room && room.room_status === 'waiting' && players.length > 0) {
      const humanPlayers = players.filter(p => 
        !p.player_name.includes('🤖') && 
        !p.player_name.includes('AI') &&
        !p.guest_token?.includes('npc_')
      )
      
      if (humanPlayers.length > 0 && players.length < (room.max_players || 6)) {
        // Use the actual room ID (UUID) from the room object
        const actualRoomId = room.id
        
        multiplayerNPCIntegration.handleRoomEvent({
          roomId: actualRoomId,
          npcId: 'civic_scholar',
          playerId: 'npc_civic_scholar',
          roomState: {
            players,
            currentQuestionIndex: gameState.currentQuestionIndex,
            totalQuestions: questions.length,
            averageScore: 0
          },
          userPerformance: {}
        }, 'player_joined').catch((error: Error) => {
          console.warn('Failed to activate NPCs:', error.message)
        })
      }
    }
  }, [room, players.length, gameState.currentQuestionIndex, questions.length])

  // Auto-advance after answer submission
  useEffect(() => {
    if (gameState.isAnswerSubmitted && !gameState.showFeedback) {
      showFeedbackAndAdvance()
    }
  }, [gameState.isAnswerSubmitted, gameState.showFeedback, showFeedbackAndAdvance])

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderGamePhase = () => {
    switch (gameState.gamePhase) {
      case 'waiting':
        return (
          <WaitingPhase
            currentTopic={currentTopic}
            config={config}
            questions={questions}
            onStartGame={handleStartGame}
            isHost={isHost}
            allPlayersReady={allPlayersReady}
          />
        )
      
      case 'countdown':
        return (
          <CountdownPhase
            currentQuestion={currentQuestion}
            countdown={countdown}
          />
        )
      
      case 'question':
        return currentQuestion ? (
          <QuestionPhase
            currentQuestion={currentQuestion}
            gameState={gameState}
            config={config}
            onAnswerSelect={handleAnswerSelect}
            onSubmitAnswer={handleSubmitAnswer}
            onShowHint={handleShowHint}
            isAnswerSubmitted={gameState.isAnswerSubmitted}
            showHint={showHint}
          />
        ) : null
      
      case 'completed':
        return <CompletedPhase onComplete={onComplete} />
      
      default:
        return (
          <WaitingPhase
            currentTopic={currentTopic}
            config={config}
            questions={questions}
            onStartGame={handleStartGame}
            isHost={isHost}
            allPlayersReady={allPlayersReady}
          />
        )
    }
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Game Content */}
        <div className="flex-1 p-6 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentTopic.emoji}</span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentTopic.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.name}
                    {gameState.gamePhase === 'question' && (
                      <> • {uiStrings.quiz.questionNumber} {gameState.currentQuestionIndex + 1} of {questions.length}</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Host Settings */}
              {isHost && gameState.gamePhase === 'waiting' && (
                <button
                  onClick={() => setShowHostSettings(!showHostSettings)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Crown className="h-4 w-4" />
                  <Settings className="h-4 w-4" />
                  {uiStrings.multiplayer.settings}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {gameState.gamePhase !== 'waiting' && (
            <div className="mb-8">
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Timer */}
          {gameState.gamePhase === 'question' && (
            <div className="mb-8 flex justify-center">
              <QuestionTimer
                initialTime={config.timePerQuestion / 1000}
                isActive={isTimerActive}
                onTimeUp={handleTimeUp}
              />
            </div>
          )}

          {/* Main Game Content */}
          <div className="max-w-4xl mx-auto">
            {renderGamePhase()}
          </div>
        </div>

        {/* Right Sidebar - Tabbed */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as 'leaderboard' | 'chat')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {uiStrings.multiplayer.leaderboard}
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {uiStrings.multiplayer.chat}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="leaderboard" className="h-[calc(100vh-8rem)] overflow-hidden">
              <Leaderboard
                players={players}
                responses={responses}
                currentPlayerId={playerId}
                onClose={() => {}} // No-op since it's in a tab
              />
            </TabsContent>
            
            <TabsContent value="chat" className="h-[calc(100vh-8rem)] overflow-hidden">
              <ChatSidebar
                roomId={roomId}
                playerId={playerId}
                players={players}
                isHost={isHost}
                onClose={() => {}} // No-op since it's in a tab
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Player Panel at Bottom */}
      <div className="fixed bottom-0 left-0 right-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-3 z-40">
        <PlayerPanel
          players={players}
          currentPlayerId={playerId}
          questionResponses={responses.filter(r => r.question_number === currentQuestion?.question_number)}
          showAnswerStatus={gameState.gamePhase === 'question'}
          gamePhase={gameState.gamePhase === 'question' || gameState.gamePhase === 'countdown' ? 'active' : gameState.gamePhase}
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
          maxPlayers={room?.max_players || 6}
          gameMode={config.name}
        />
      )}
    </div>
  )
} 