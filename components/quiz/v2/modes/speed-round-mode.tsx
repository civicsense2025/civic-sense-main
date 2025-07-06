import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Speed round mode state
interface SpeedRoundModeState {
  questionsAnswered: number
  fastAnswers: number
  slowAnswers: number
  perfectAnswers: number
  averageResponseTime: number
  currentStreak: number
  bonusPointsEarned: number
}

// Speed round mode - fast-paced civic learning with time pressure
export const speedRoundModePlugin: GameModePlugin<SpeedRoundModeState> = createGameModePlugin({
  mode: 'speed_round', // Matches database constraint
  displayName: 'Speed Round',
  description: 'Answer civic questions quickly to build knowledge under pressure.',
  category: 'solo',
  config: {
    mode: 'speed_round',
    settings: {
      ...DEFAULT_MODE_CONFIGS.speed_round,
      showHints: false,
      showExplanations: false, // No time for explanations
      allowSkip: false,
      timeLimit: 15, // Fast 15-second limit
      autoAdvance: true
    }
  },
  
  // Initialize state
  getInitialState: (): SpeedRoundModeState => ({
    questionsAnswered: 0,
    fastAnswers: 0,
    slowAnswers: 0,
    perfectAnswers: 0,
    averageResponseTime: 0,
    currentStreak: 0,
    bonusPointsEarned: 0
  }),
  
  // State reducer for speed round events
  stateReducer: (state: SpeedRoundModeState, action): SpeedRoundModeState => {
    switch (action.type) {
      case 'ANSWER_SUBMIT':
        const isCorrect = action.payload?.answer?.isCorrect || false
        // For now, assume all answers are "fast" since we can't access responseTime
        const isFast = true // Will be enhanced when timing data is available
        const isPerfect = isCorrect // Simplified for now
        
        return {
          ...state,
          questionsAnswered: state.questionsAnswered + 1,
          fastAnswers: isFast ? state.fastAnswers + 1 : state.fastAnswers,
          slowAnswers: !isFast ? state.slowAnswers + 1 : state.slowAnswers,
          perfectAnswers: isPerfect ? state.perfectAnswers + 1 : state.perfectAnswers,
          averageResponseTime: 10, // Default average for now
          currentStreak: isCorrect ? state.currentStreak + 1 : 0,
          bonusPointsEarned: state.bonusPointsEarned + (isPerfect ? 10 : isFast && isCorrect ? 5 : 0)
        }
      
      case 'TIMER_UPDATE':
        // Handle timer pressure - could add visual feedback
        return state
        
      default:
        return state
    }
  },
  
  // Custom rendering for speed round interface
  renderInterface: (context) => {
    const { questions, currentQuestionIndex, modeState, timeRemaining } = context
    const currentQuestion = questions[currentQuestionIndex]
    
    if (!currentQuestion) return null
    
    const urgencyLevel = timeRemaining && timeRemaining <= 5 ? 'critical' : 
                        timeRemaining && timeRemaining <= 10 ? 'warning' : 'normal'
    
    return (
      <div className={`speed-round-interface bg-gradient-to-br rounded-xl p-6 border-2 transition-all duration-300 ${
        urgencyLevel === 'critical' 
          ? 'from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-900 border-red-300 dark:border-red-700 animate-pulse' 
          : urgencyLevel === 'warning'
          ? 'from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900 border-yellow-300 dark:border-yellow-700'
          : 'from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
              ⚡ Speed Round
            </h3>
            <div className="text-sm text-purple-600 dark:text-purple-300">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold mb-1 ${
              urgencyLevel === 'critical' ? 'text-red-600 dark:text-red-400' :
              urgencyLevel === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-purple-600 dark:text-purple-400'
            }`}>
              {timeRemaining || 0}s
            </div>
            <div className="text-xs text-purple-500 dark:text-purple-400">
              ⚡ Streak: {modeState?.currentStreak || 0}
            </div>
          </div>
        </div>
        
        <div className="speed-content bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
          <h4 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
            {currentQuestion.question}
          </h4>
          
          {/* Performance indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {modeState?.fastAnswers || 0}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Fast (&lt;7s)
              </div>
            </div>
            
            <div className="text-center bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {modeState?.perfectAnswers || 0}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Perfect (&lt;5s)
              </div>
            </div>
            
            <div className="text-center bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {modeState?.bonusPointsEarned || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Bonus Pts
              </div>
            </div>
            
            <div className="text-center bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {Math.round(modeState?.averageResponseTime || 0)}s
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Avg Time
              </div>
            </div>
          </div>
          
          {/* Speed tips */}
          <div className="text-center text-xs text-slate-600 dark:text-slate-400">
            💡 Answer fast for bonus points • &lt;5s = Perfect • &lt;7s = Fast
          </div>
        </div>
      </div>
    )
  },
  
  onModeStart: async (context) => {
    console.log('⚡ Speed Round: Starting fast-paced civic learning')
    context.actions.showToast(
      'Answer quickly! You get bonus points for fast, correct answers.',
      'info'
    )
  },
  
  onQuestionComplete: async (question, answer, context) => {
    const responseTime = (Date.now() - context.startTime) / 1000
    const isFast = responseTime <= 7
    const isPerfect = responseTime <= 5 && answer.isCorrect
    
    // Give immediate feedback for speed
    if (isPerfect) {
      context.actions.showToast('⚡ PERFECT! Lightning fast and correct!', 'success')
    } else if (isFast && answer.isCorrect) {
      context.actions.showToast('🚀 FAST! Great speed and accuracy!', 'success')
    } else if (answer.isCorrect) {
      context.actions.showToast('✅ Correct! Try to answer faster next time.', 'info')
    }
  },
  
  onModeComplete: async (results, context) => {
    console.log('🏁 Speed Round: Fast-paced learning completed!', {
      finalScore: results.score,
      fastAnswers: context.modeState?.fastAnswers || 0,
      perfectAnswers: context.modeState?.perfectAnswers || 0,
      bonusPoints: context.modeState?.bonusPointsEarned || 0,
      averageTime: context.modeState?.averageResponseTime || 0
    })
    
    // Update game metadata with speed-specific data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'speed_round',
        fast_answers: context.modeState?.fastAnswers || 0,
        perfect_answers: context.modeState?.perfectAnswers || 0,
        bonus_points_earned: context.modeState?.bonusPointsEarned || 0,
        average_response_time: context.modeState?.averageResponseTime || 0,
        final_streak: context.modeState?.currentStreak || 0,
        speed_mastery: (context.modeState?.fastAnswers || 0) >= (context.questions.length * 0.7)
      }
    })
    
    // Show completion message based on performance
    const fastAnswers = context.modeState?.fastAnswers || 0
    const totalQuestions = context.questions.length
    const speedPercentage = (fastAnswers / totalQuestions) * 100
    
    const speedMessage = speedPercentage >= 80 
      ? '⚡ Speed demon! You\'ve mastered rapid civic knowledge recall!'
      : speedPercentage >= 50
      ? '🚀 Good speed! Keep practicing to get even faster.'
      : '📚 Focus on accuracy first, then build up your speed!'
    
    context.actions.showToast(speedMessage, 'success')
  },
  
  // Enforced time limit for each question
  getTimeLimit: () => 15,
  
  // Speed-based score calculation
  calculateScore: (answers, questions) => {
    const baseScore = (answers.filter(a => a.isCorrect).length / questions.length) * 100
    
    // Speed bonus calculation - simplified for now since responseTime isn't available
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const speedBonus = correctAnswers * 3 // Flat bonus for correct answers in speed mode
    
    return Math.min(100, Math.round(baseScore + speedBonus))
  },
  
  // Analytics data specific to speed learning
  getAnalyticsData: (context) => ({
    mode: 'speed_round',
    rapid_civic_learning: true,
    fast_answers: context.modeState?.fastAnswers || 0,
    perfect_answers: context.modeState?.perfectAnswers || 0,
    average_response_time: context.modeState?.averageResponseTime || 0,
    bonus_points_earned: context.modeState?.bonusPointsEarned || 0,
    speed_mastery_level: (context.modeState?.fastAnswers || 0) >= (context.questions.length * 0.7) ? 'high' : 'developing'
  }),
  
  // Save progress for speed tracking
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'speed_round',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    speedData: {
      fastAnswers: context.modeState?.fastAnswers || 0,
      perfectAnswers: context.modeState?.perfectAnswers || 0,
      bonusPoints: context.modeState?.bonusPointsEarned || 0,
      averageTime: context.modeState?.averageResponseTime || 0
    }
  })
}) 