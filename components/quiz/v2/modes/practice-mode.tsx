import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Practice mode state
interface PracticeModeState {
  hintsUsed: number
  explanationsViewed: number
  retryCount: number
}

// Practice mode - stress-free learning with unlimited time and hints
export const practiceModePlugin: GameModePlugin<PracticeModeState> = createGameModePlugin({
  mode: 'practice',
  displayName: 'Practice Mode',
  description: 'Learn at your own pace with hints, explanations, and no time pressure.',
  category: 'solo',
  config: {
    mode: 'practice',
    settings: {
      ...DEFAULT_MODE_CONFIGS.practice,
      showHints: true,
      showExplanations: true,
      allowSkip: true,
      timeLimit: 0, // No time limit
      autoAdvance: false
    }
  },
  
  // Initialize state
  getInitialState: () => ({
    hintsUsed: 0,
    explanationsViewed: 0,
    retryCount: 0
  }),
  
  // State reducer for practice mode events
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'USE_POWERUP':
        if (action.payload.powerup === 'hint') {
          return { ...state, hintsUsed: state.hintsUsed + 1 }
        }
        return state
        
      case 'QUESTION_COMPLETE':
        return {
          ...state,
          explanationsViewed: state.explanationsViewed + 1
        }
        
      case 'CUSTOM':
        if (action.payload.type === 'retry_question') {
          return { ...state, retryCount: state.retryCount + 1 }
        }
        return state
        
      default:
        return state
    }
  },
  
  // Lifecycle hooks
  onModeStart: async (context) => {
    console.log('🎓 Starting Practice Mode for topic:', context.topicId)
    
    // Show helpful practice mode message
    context.actions.showToast(
      'Practice Mode: Take your time! Hints and explanations are available.',
      'info'
    )
    
    // Update game metadata for practice tracking
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        quiz_type: 'practice',
        learning_mode: 'exploratory',
        stress_free_learning: true
      }
    })
  },
  
  onQuestionStart: async (question, index, context) => {
    console.log(`🔍 Practice Mode: Exploring question ${index + 1} - ${question.question}`)
    
    // Update mode state
    context.actions.updateModeState({
      ...context.modeState,
      currentQuestionStartTime: Date.now()
    })
  },
  
  onAnswerSubmit: async (answer, context) => {
    console.log('💡 Practice Mode: Answer submitted for learning:', answer.answer)
    
    // In practice mode, always allow answers - even multiple attempts
    return true
  },
  
  onQuestionComplete: async (question, answer, context) => {
    console.log('📚 Practice Mode: Question completed with focus on learning')
    
    // Provide encouraging feedback regardless of correctness
    const encouragingMessage = answer.isCorrect
      ? 'Perfect! You\'re mastering these civic concepts.'
      : 'Good attempt! Every wrong answer teaches us something important about how power works.'
    
    context.actions.showToast(encouragingMessage, 'info')
    
    // Auto-show explanation in practice mode if available
    if (question.explanation) {
      // Could trigger explanation display here
      console.log('📖 Explanation available:', question.explanation)
    }
  },
  
  onModeComplete: async (results, context) => {
    console.log('🎯 Practice Mode: Learning session completed!', {
      score: results.score,
      learningFocused: true,
      hintsUsed: context.modeState?.hintsUsed || 0
    })
    
    // Update game metadata with practice completion data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'practice',
        learning_progress: results.score,
        hintsUsed: context.modeState?.hintsUsed || 0,
        explanationsViewed: context.modeState?.explanationsViewed || 0,
        stress_free_completion: true
      }
    })
    
    // Show encouraging completion message
    context.actions.showToast(
      'Great practice session! Ready to try the full quiz?',
      'success'
    )
  },
  
  // No time limit in practice mode
  getTimeLimit: () => null,
  
  // Practice mode score calculation - more forgiving
  calculateScore: (answers, questions) => {
    const totalQuestions = questions.length
    const correctAnswers = answers.filter(a => a.isCorrect).length
    
    // Base score
    let score = (correctAnswers / totalQuestions) * 100
    
    // Bonus for engagement (using hints shows active learning)
    const hintsUsed = answers.filter(a => a.hintUsed).length
    const engagementBonus = Math.min(10, hintsUsed * 2) // Up to 10% bonus
    
    return Math.min(100, Math.round(score + engagementBonus))
  },
  
  // Accessibility support
  getAriaLabel: (context) => {
    const currentQ = context.currentQuestionIndex + 1
    const totalQ = context.questions.length
    return `Practice mode civic quiz, question ${currentQ} of ${totalQ}. Learning at your own pace.`
  },
  
  getKeyboardShortcuts: () => [
    {
      key: 'h',
      description: 'Show hint (encouraged in practice mode)',
      action: () => console.log('Hint requested - great for learning!')
    },
    {
      key: 'e',
      description: 'Show explanation',
      action: () => console.log('Explanation requested')
    },
    {
      key: 'r',
      description: 'Retry question',
      action: () => console.log('Question retry requested')
    },
    {
      key: 'Enter',
      description: 'Submit current answer',
      action: () => console.log('Answer submitted')
    }
  ],
  
  // Analytics data specific to practice learning
  getAnalyticsData: (context) => ({
    mode: 'practice',
    learning_session: true,
    stress_free_education: true,
    exploratory_learning: true,
    hintsUsed: context.modeState?.hintsUsed || 0,
    explanationsViewed: context.modeState?.explanationsViewed || 0,
    retryCount: context.modeState?.retryCount || 0,
    learningEngagement: 'high' // Practice mode users are highly engaged
  }),
  
  // Always save progress in practice mode
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'practice',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    practiceProgress: {
      questionsExplored: context.userAnswers.length,
      hintsUsed: context.modeState?.hintsUsed || 0,
      learningScore: context.score,
      exploratoryLearning: true
    }
  }),
  
  // Custom rendering for practice mode
  renderHeader: (context) => (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Practice Mode
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-200">
            Take your time • Use hints • Learn from explanations
          </p>
        </div>
      </div>
    </div>
  ),
  
  renderInterface: (context) => (
    <div className="mt-4 space-y-3">
      {/* Hint button - always visible in practice mode */}
      <button
        onClick={() => context.actions.useHint()}
        className="w-full bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-left hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">💡</span>
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">
            Need a hint? Click here!
          </span>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
          Hints are encouraged in practice mode
        </p>
      </button>
      
      {/* Practice mode stats */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div>💡 Hints used: {context.modeState?.hintsUsed || 0}</div>
          <div>📖 Explanations viewed: {context.modeState?.explanationsViewed || 0}</div>
          <div>🔁 Questions retried: {context.modeState?.retryCount || 0}</div>
        </div>
      </div>
    </div>
  )
}) 