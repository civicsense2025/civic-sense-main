import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Assessment mode state
interface AssessmentModeState {
  warningsGiven: number
  tabSwitches: number
  startTime: number
  strictMode: boolean
}

// Assessment mode - formal testing with strict rules and monitoring
export const assessmentModePlugin: GameModePlugin<AssessmentModeState> = createGameModePlugin({
  mode: 'assessment',
  displayName: 'Assessment Mode',
  description: 'Formal assessment with timed questions and strict monitoring.',
  category: 'assessment',
  requiresAuth: true, // Assessments require authentication
  config: {
    mode: 'assessment',
    settings: {
      ...DEFAULT_MODE_CONFIGS.assessment,
      showHints: false,
      showExplanations: false, // No explanations during assessment
      allowSkip: false,
      timeLimit: 90, // Strict time limit
      autoAdvance: true
    }
  },
  
  // Initialize state
  getInitialState: () => ({
    warningsGiven: 0,
    tabSwitches: 0,
    startTime: Date.now(),
    strictMode: true as boolean
  }),
  
  // State reducer for assessment mode events
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'CUSTOM':
        if (action.payload.type === 'tab_switch') {
          return { 
            ...state, 
            tabSwitches: state.tabSwitches + 1,
            warningsGiven: state.warningsGiven + 1
          }
        }
        if (action.payload.type === 'warning_given') {
          return { ...state, warningsGiven: state.warningsGiven + 1 }
        }
        return state
        
      default:
        return state
    }
  },
  
  // Lifecycle hooks
  onModeStart: async (context) => {
    console.log('📋 Starting Assessment Mode for topic:', context.topicId)
    
    // Show assessment instructions
    context.actions.showModal(
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <span className="text-4xl">📋</span>
          <h3 className="text-xl font-semibold mt-2">Assessment Mode</h3>
        </div>
        <div className="space-y-3 text-sm">
          <p><strong>Assessment Rules:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
            <li>Timed questions (90 seconds each)</li>
            <li>No hints or explanations available</li>
            <li>Cannot skip questions</li>
            <li>Tab switching will be monitored</li>
            <li>Your final score will be recorded</li>
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            This assessment tests your civic knowledge. Good luck!
          </p>
        </div>
        <button
          onClick={() => context.actions.hideModal()}
          className="w-full mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Start Assessment
        </button>
      </div>
    )
    
    // Set up tab visibility monitoring
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          context.actions.updateModeState({
            type: 'CUSTOM',
            payload: { type: 'tab_switch' }
          })
          
          context.actions.showToast(
            'Warning: Tab switching detected during assessment',
            'error'
          )
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Store cleanup function in metadata
      context.actions.updateGameMetadata({
        ...context.gameMetadata,
        custom: {
          ...context.gameMetadata.custom,
          cleanup: handleVisibilityChange
        }
      })
    }
    
    // Update game metadata for assessment tracking
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        quiz_type: 'assessment',
        formal_testing: true,
        strict_monitoring: true,
        assessment_start_time: Date.now()
      }
    })
  },
  
  onQuestionStart: async (question, index, context) => {
    console.log(`⏱️ Assessment Mode: Question ${index + 1} started with ${context.modeSettings.timeLimit}s limit`)
    
    // Start question timer
    context.actions.updateModeState({
      ...context.modeState,
      currentQuestionStartTime: Date.now()
    })
    
    // Show question progress
    context.actions.showToast(
      `Question ${index + 1} of ${context.questions.length} - ${context.modeSettings.timeLimit}s`,
      'info'
    )
  },
  
  onAnswerSubmit: async (answer, context) => {
    console.log('📝 Assessment Mode: Answer submitted for evaluation:', answer.answer)
    
    // Validate answer timing
    const timeSpent = answer.timeSpent
    if (timeSpent < 5) {
      context.actions.showToast(
        'Warning: Very quick response detected',
        'error'
      )
      
      context.actions.updateModeState({
        type: 'CUSTOM',
        payload: { type: 'warning_given' }
      })
    }
    
    return true
  },
  
  onQuestionComplete: async (question, answer, context) => {
    console.log('✅ Assessment Mode: Question completed under timed conditions')
    
    // No feedback given during assessment to avoid helping with future questions
    // Just acknowledge the submission
    context.actions.showToast('Answer recorded', 'info')
  },
  
  onModeComplete: async (results, context) => {
    console.log('🏁 Assessment Mode: Formal assessment completed!', {
      score: results.score,
      warningsGiven: context.modeState?.warningsGiven || 0,
      tabSwitches: context.modeState?.tabSwitches || 0
    })
    
    // Clean up event listeners
    if (typeof document !== 'undefined' && context.gameMetadata.custom?.cleanup) {
      document.removeEventListener('visibilitychange', context.gameMetadata.custom.cleanup)
    }
    
    // Update game metadata with assessment completion data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'assessment',
        final_score: results.score,
        assessment_duration: Date.now() - context.modeState?.startTime,
        integrity_warnings: context.modeState?.warningsGiven || 0,
        tab_switches: context.modeState?.tabSwitches || 0,
        assessment_completed: true
      }
    })
    
    // Show completion message
    const warningCount = context.modeState?.warningsGiven || 0
    const completionMessage = warningCount === 0 
      ? 'Assessment completed successfully!'
      : `Assessment completed with ${warningCount} warning(s).`
    
    context.actions.showToast(completionMessage, warningCount === 0 ? 'success' : 'error')
  },
  
  onModeExit: async (context) => {
    // Clean up event listeners if user exits early
    if (typeof document !== 'undefined' && context.gameMetadata.custom?.cleanup) {
      document.removeEventListener('visibilitychange', context.gameMetadata.custom.cleanup)
    }
  },
  
  // Strict time limit
  getTimeLimit: (question, context) => {
    return context.modeSettings.timeLimit || 90
  },
  
  // Assessment mode score calculation - strict and fair
  calculateScore: (answers, questions) => {
    const totalQuestions = questions.length
    const correctAnswers = answers.filter(a => a.isCorrect).length
    
    // Pure percentage - no bonuses in assessment mode
    return Math.round((correctAnswers / totalQuestions) * 100)
  },
  
  // Accessibility support
  getAriaLabel: (context) => {
    const currentQ = context.currentQuestionIndex + 1
    const totalQ = context.questions.length
    const timeRemaining = context.timeRemaining || 0
    return `Assessment mode, question ${currentQ} of ${totalQ}. Time remaining: ${timeRemaining} seconds.`
  },
  
  getKeyboardShortcuts: () => [
    {
      key: 'Enter',
      description: 'Submit current answer',
      action: () => console.log('Answer submitted via keyboard')
    }
    // Limited shortcuts in assessment mode
  ],
  
  // Analytics data specific to formal assessment
  getAnalyticsData: (context) => ({
    mode: 'assessment',
    formal_assessment: true,
    timed_testing: true,
    monitored_session: true,
    warningsGiven: context.modeState?.warningsGiven || 0,
    tabSwitches: context.modeState?.tabSwitches || 0,
    assessmentIntegrity: (context.modeState?.warningsGiven || 0) === 0 ? 'high' : 'compromised'
  }),
  
  // Progress storage - minimal in assessment mode for security
  shouldSaveProgress: () => false, // Don't allow resuming assessments
  
  getProgressData: () => ({}), // No progress data saved
  
  // Custom rendering for assessment mode
  renderHeader: (context) => (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📋</span>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Assessment Mode
          </h3>
          <p className="text-sm text-red-700 dark:text-red-200">
            Formal assessment • Timed questions • Monitored session
          </p>
        </div>
        {context.timeRemaining && (
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-red-700 dark:text-red-300">
              {Math.floor(context.timeRemaining / 60)}:{(context.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">Time Left</div>
          </div>
        )}
      </div>
    </div>
  ),
  
  renderInterface: (context) => (
    <div className="mt-4 space-y-3">
      {/* Assessment monitoring display */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div className="flex justify-between">
            <span>Session Integrity:</span>
            <span className={
              (context.modeState?.warningsGiven || 0) === 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }>
              {(context.modeState?.warningsGiven || 0) === 0 ? 'Good' : 'Warnings Issued'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tab Switches:</span>
            <span>{context.modeState?.tabSwitches || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Warnings:</span>
            <span>{context.modeState?.warningsGiven || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Assessment help notice */}
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          ⚠️ Assessment rules: No hints, no explanations, strict timing. 
          Tab switching and quick answers are monitored.
        </p>
      </div>
    </div>
  )
}) 