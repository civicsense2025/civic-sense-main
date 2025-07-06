import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Multiplayer mode state
interface MultiplayerModeState {
  roomCode: string
  players: MultiplayerPlayer[]
  currentRound: number
  isHost: boolean
  gamePhase: 'waiting' | 'playing' | 'results'
}

interface MultiplayerPlayer {
  id: string
  name: string
  score: number
  isReady: boolean
  currentAnswer: string | null
}

// Multiplayer mode - competitive civic learning with other players
export const multiplayerModePlugin: GameModePlugin<MultiplayerModeState> = createGameModePlugin({
  mode: 'classic_quiz',
  displayName: 'Multiplayer Quiz',
  description: 'Compete with other players in real-time civic knowledge challenges.',
  category: 'multiplayer',
  requiresAuth: true, // Multiplayer requires authentication
  config: {
    mode: 'classic_quiz',
    settings: {
      ...DEFAULT_MODE_CONFIGS.classic_quiz,
      showHints: false, // No hints in competitive mode
      showExplanations: true, // Show explanations after each question
      allowSkip: false,
      timeLimit: 45, // Moderate time pressure
      autoAdvance: true
    }
  },
  
  // Initialize state
  getInitialState: () => ({
    roomCode: '',
    players: [] as MultiplayerPlayer[],
    currentRound: 1,
    isHost: false as boolean,
    gamePhase: 'waiting' as MultiplayerModeState['gamePhase']
  }),
  
  // State reducer for multiplayer events
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'MULTIPLAYER_EVENT':
        const { type, payload } = action.payload
        
        switch (type) {
          case 'PLAYER_JOINED':
            return {
              ...state,
              players: [...state.players, payload.player]
            }
            
          case 'PLAYER_LEFT':
            return {
              ...state,
              players: state.players.filter(p => p.id !== payload.playerId)
            }
            
          case 'PLAYER_READY':
            return {
              ...state,
              players: state.players.map(p => 
                p.id === payload.playerId ? { ...p, isReady: true } : p
              )
            }
            
          case 'GAME_PHASE_CHANGE':
            return {
              ...state,
              gamePhase: payload.phase
            }
            
          case 'PLAYER_ANSWER':
            return {
              ...state,
              players: state.players.map(p => 
                p.id === payload.playerId 
                  ? { ...p, currentAnswer: payload.answer }
                  : p
              )
            }
            
          case 'ROUND_COMPLETE':
            return {
              ...state,
              currentRound: state.currentRound + 1,
              players: state.players.map(p => ({
                ...p,
                currentAnswer: null,
                score: payload.scores[p.id] || p.score
              }))
            }
            
          default:
            return state
        }
        
      default:
        return state
    }
  },
  
  // Lifecycle hooks
  onModeStart: async (context) => {
    console.log('🏆 Starting Multiplayer Mode for topic:', context.topicId)
    
    // Show multiplayer lobby/waiting screen
    context.actions.showToast(
      'Connecting to multiplayer room...',
      'info'
    )
    
    // Update game metadata for multiplayer tracking
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        quiz_type: 'multiplayer',
        competitive_mode: true,
        social_learning: true,
        multiplayer_session: true
      }
    })
    
    // Initialize multiplayer state
    context.actions.updateModeState({
      ...context.modeState,
      gamePhase: 'waiting'
    })
  },
  
  onQuestionStart: async (question, index, context) => {
    console.log(`🎯 Multiplayer: Question ${index + 1} started for all players`)
    
    // Announce question start to all players
    context.actions.showToast(
      `Question ${index + 1}: All players answer now!`,
      'info'
    )
    
    // Reset player answers for new question
    context.actions.updateModeState({
      type: 'MULTIPLAYER_EVENT',
      payload: {
        type: 'QUESTION_START',
        questionIndex: index
      }
    })
  },
  
  onAnswerSubmit: async (answer, context) => {
    console.log('📝 Multiplayer: Answer submitted to competition pool:', answer.answer)
    
    // Broadcast answer to other players (without revealing correctness)
    context.actions.updateModeState({
      type: 'MULTIPLAYER_EVENT',
      payload: {
        type: 'PLAYER_ANSWER',
        playerId: context.userId,
        answer: answer.answer
      }
    })
    
    context.actions.showToast('Answer submitted to competition!', 'success')
    return true
  },
  
  onQuestionComplete: async (question, answer, context) => {
    console.log('🏁 Multiplayer: Question completed, waiting for all players')
    
    // Show competitive feedback
    const competitiveMessage = answer.isCorrect
      ? 'Correct! You\'re ahead in the civic knowledge race!'
      : 'Missed that one! Time to catch up on civic facts.'
    
    context.actions.showToast(competitiveMessage, answer.isCorrect ? 'success' : 'error')
    
    // Wait for all players to complete before showing results
    context.actions.showToast('Waiting for other players to finish...', 'info')
  },
  
  onModeComplete: async (results, context) => {
    console.log('🎊 Multiplayer: Competition completed!', {
      score: results.score,
      competitiveRanking: true,
      socialLearning: true
    })
    
    // Update game metadata with multiplayer completion data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'multiplayer',
        competitive_score: results.score,
        multiplayer_ranking: context.modeState?.players?.length || 0,
        social_interaction_count: context.modeState?.players?.length || 0,
        civic_competition_completed: true
      }
    })
    
    // Show competitive completion message
    context.actions.showToast(
      'Competition complete! Check your ranking against other civic learners.',
      'success'
    )
  },
  
  // Multiplayer time limit - same for all players
  getTimeLimit: (question, context) => {
    return context.modeSettings.timeLimit || 45
  },
  
  // Multiplayer score calculation - competitive ranking
  calculateScore: (answers, questions) => {
    const totalQuestions = questions.length
    const correctAnswers = answers.filter(a => a.isCorrect).length
    
    // Base score
    let score = (correctAnswers / totalQuestions) * 100
    
    // Speed bonus for competitive edge
    const averageTime = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length
    const speedBonus = averageTime < 30 ? 5 : averageTime < 45 ? 2 : 0
    
    return Math.min(100, Math.round(score + speedBonus))
  },
  
  // Accessibility support
  getAriaLabel: (context) => {
    const currentQ = context.currentQuestionIndex + 1
    const totalQ = context.questions.length
    const playerCount = context.modeState?.players?.length || 0
    return `Multiplayer civic quiz with ${playerCount} players, question ${currentQ} of ${totalQ}.`
  },
  
  getKeyboardShortcuts: () => [
    {
      key: 'Enter',
      description: 'Submit answer to competition',
      action: () => console.log('Competitive answer submitted')
    },
    {
      key: 'Tab',
      description: 'View player list',
      action: () => console.log('Show player rankings')
    }
  ],
  
  // Analytics data specific to multiplayer learning
  getAnalyticsData: (context) => ({
    mode: 'multiplayer',
    competitive_learning: true,
    social_interaction: true,
    multiplayer_session: true,
    playerCount: context.modeState?.players?.length || 0,
    gamePhase: context.modeState?.gamePhase || 'waiting',
    competitiveEngagement: 'high'
  }),
  
  // Save progress in multiplayer mode for reconnection
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'multiplayer',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    multiplayerProgress: {
      roomCode: context.modeState?.roomCode,
      playerCount: context.modeState?.players?.length || 0,
      currentRound: context.modeState?.currentRound || 1,
      competitiveScore: context.score
    }
  }),
  
  // Custom rendering for multiplayer mode
  renderHeader: (context) => (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
            Multiplayer Competition
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-200">
            {context.modeState?.players?.length || 0} players • Round {context.modeState?.currentRound || 1}
          </p>
        </div>
        {context.timeRemaining && (
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-purple-700 dark:text-purple-300">
              {context.timeRemaining}s
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">All Players</div>
          </div>
        )}
      </div>
    </div>
  ),
  
  renderInterface: (context) => (
    <div className="mt-4 space-y-3">
      {/* Player list */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
          Players ({context.modeState?.players?.length || 0})
        </h4>
        <div className="space-y-1">
          {(context.modeState?.players || []).map((player: MultiplayerPlayer, index: number) => (
            <div key={player.id} className="flex justify-between items-center text-sm">
              <span className="text-purple-800 dark:text-purple-200">
                {index + 1}. {player.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 dark:text-purple-400">
                  {player.score} pts
                </span>
                {player.currentAnswer && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    ✓
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Game status */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div>🎮 Game Phase: {context.modeState?.gamePhase || 'waiting'}</div>
          <div>🏁 Round: {context.modeState?.currentRound || 1}</div>
          <div>🔥 Your Score: {context.score} points</div>
        </div>
      </div>
    </div>
  )
}) 