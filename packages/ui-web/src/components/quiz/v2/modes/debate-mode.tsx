import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@civicsense/shared/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Debate mode state
interface DebateModeState {
  currentPosition: 'pro' | 'con' | 'neutral'
  argumentsPresented: string[]
  evidenceProvided: number
  counterargumentsMade: number
  sourcesUsed: string[]
  persuasivenessScore: number
  logicalFallaciesAvoided: number
}

// Debate mode - structured civic discourse and argumentation
export const debateModePlugin: GameModePlugin<DebateModeState> = createGameModePlugin({
  mode: 'debate_mode', // Matches database constraint
  displayName: 'Debate Mode',
  description: 'Engage in structured civic discourse and build argumentation skills.',
  category: 'solo',
  requiresAuth: true, // Debates should be tracked to user accounts
  config: {
    mode: 'debate_mode',
    settings: {
      ...DEFAULT_MODE_CONFIGS.debate_mode,
      showHints: true,
      showExplanations: true,
      allowSkip: false,
      timeLimit: 120, // 2 minutes for thoughtful responses
      autoAdvance: false
    }
  },
  
  // Initialize state
  getInitialState: (): DebateModeState => ({
    currentPosition: 'neutral',
    argumentsPresented: [] as string[],
    evidenceProvided: 0,
    counterargumentsMade: 0,
    sourcesUsed: [] as string[],
    persuasivenessScore: 0,
    logicalFallaciesAvoided: 0
  }),
  
  // State reducer for debate events
  stateReducer: (state: DebateModeState, action): DebateModeState => {
    switch (action.type) {
      case 'ANSWER_SUBMIT':
        const answer = action.payload?.answer?.answer || ''
        const isLongForm = answer.length > 100 // Substantial arguments
        const hasEvidence = answer.includes('according to') || answer.includes('research shows') || answer.includes('data indicates')
        
        return {
          ...state,
          argumentsPresented: [...state.argumentsPresented, answer],
          evidenceProvided: hasEvidence ? state.evidenceProvided + 1 : state.evidenceProvided,
          persuasivenessScore: isLongForm ? state.persuasivenessScore + 10 : state.persuasivenessScore + 5
        }
      
      case 'CUSTOM':
        if (action.payload?.type === 'change_position') {
          return { ...state, currentPosition: action.payload.position }
        }
        if (action.payload?.type === 'add_counterargument') {
          return { 
            ...state, 
            counterargumentsMade: state.counterargumentsMade + 1,
            persuasivenessScore: state.persuasivenessScore + 15
          }
        }
        if (action.payload?.type === 'avoid_fallacy') {
          return { 
            ...state, 
            logicalFallaciesAvoided: state.logicalFallaciesAvoided + 1,
            persuasivenessScore: state.persuasivenessScore + 20
          }
        }
        return state
        
      default:
        return state
    }
  },
  
  // Custom rendering for debate interface
  renderInterface: (context) => {
    const { questions, currentQuestionIndex, modeState, timeRemaining } = context
    const currentQuestion = questions[currentQuestionIndex]
    
    if (!currentQuestion) return null
    
    const timeCategory = timeRemaining && timeRemaining > 60 ? 'plenty' : 
                        timeRemaining && timeRemaining > 30 ? 'moderate' : 'urgent'
    
    return (
      <div className="debate-interface bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-900 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
              🎯 Civic Debate
            </h3>
            <div className="text-sm text-indigo-600 dark:text-indigo-300">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-xl font-bold mb-1 ${
              timeCategory === 'urgent' ? 'text-red-600 dark:text-red-400' :
              timeCategory === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-indigo-600 dark:text-indigo-400'
            }`}>
              {Math.floor((timeRemaining || 0) / 60)}:{String((timeRemaining || 0) % 60).padStart(2, '0')}
            </div>
            <div className="text-xs text-indigo-500 dark:text-indigo-400">
              Position: {modeState?.currentPosition || 'neutral'}
            </div>
          </div>
        </div>
        
        <div className="debate-content bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
          <h4 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
            {currentQuestion.question}
          </h4>
          
          {/* Debate topic context */}
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-4">
            <div className="text-sm text-indigo-800 dark:text-indigo-200">
              🗣️ <strong>Debate Challenge:</strong> Present a well-reasoned argument with evidence. 
              Consider multiple perspectives and potential counterarguments.
            </div>
          </div>
          
          {/* Debate scoring dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {modeState?.argumentsPresented?.length || 0}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Arguments
              </div>
            </div>
            
            <div className="text-center bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {modeState?.evidenceProvided || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Evidence
              </div>
            </div>
            
            <div className="text-center bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {modeState?.counterargumentsMade || 0}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Counter-args
              </div>
            </div>
            
            <div className="text-center bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {modeState?.persuasivenessScore || 0}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Persuasion
              </div>
            </div>
          </div>
          
          {/* Position selector */}
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Your stance:
            </h5>
            <div className="flex gap-2">
              {['pro', 'con', 'neutral'].map((position) => {
                const setPosition = () => {
                  const newModeState = {
                    ...modeState,
                    currentPosition: position as 'pro' | 'con' | 'neutral'
                  }
                  context.actions.updateModeState(newModeState)
                }
                
                return (
                  <button
                    key={position}
                    onClick={setPosition}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      modeState?.currentPosition === position
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {position.charAt(0).toUpperCase() + position.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Previous arguments */}
          {modeState?.argumentsPresented && modeState.argumentsPresented.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Your previous arguments:
              </h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {modeState.argumentsPresented.slice(-3).map((argument: string, index: number) => (
                  <div
                    key={index}
                    className="text-xs bg-indigo-50 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 p-2 rounded"
                  >
                    {argument.substring(0, 100)}...
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debate tips */}
          <div className="text-center text-xs text-slate-600 dark:text-slate-400">
            💡 Strong arguments include evidence, address counterpoints, and avoid logical fallacies
          </div>
        </div>
      </div>
    )
  },
  
  onModeStart: async (context) => {
    console.log('🎯 Debate Mode: Starting structured civic discourse')
    context.actions.showToast(
      'Present well-reasoned arguments and engage with different perspectives!',
      'info'
    )
  },
  
  onAnswerSubmit: async (answer, context) => {
    // Analyze argument quality
    const argumentText = answer.answer.toLowerCase()
    const hasEvidence = argumentText.includes('according to') || argumentText.includes('research') || argumentText.includes('data')
    const isSubstantial = answer.answer.length > 100
    
    if (hasEvidence) {
      context.actions.showToast('💡 Great use of evidence in your argument!', 'success')
    } else if (isSubstantial) {
      context.actions.showToast('📝 Good detailed argument! Try adding evidence next time.', 'info')
    }
    
    return true
  },
  
  onModeComplete: async (results, context) => {
    console.log('🏆 Debate Mode: Civic discourse completed!', {
      finalScore: results.score,
      argumentsPresented: context.modeState?.argumentsPresented?.length || 0,
      evidenceProvided: context.modeState?.evidenceProvided || 0,
      persuasivenessScore: context.modeState?.persuasivenessScore || 0,
      counterarguments: context.modeState?.counterargumentsMade || 0
    })
    
    // Update game metadata with debate-specific data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'debate',
        arguments_presented: context.modeState?.argumentsPresented?.length || 0,
        evidence_provided: context.modeState?.evidenceProvided || 0,
        counterarguments_made: context.modeState?.counterargumentsMade || 0,
        persuasiveness_score: context.modeState?.persuasivenessScore || 0,
        fallacies_avoided: context.modeState?.logicalFallaciesAvoided || 0,
        debate_quality: (context.modeState?.persuasivenessScore || 0) >= 100 ? 'high' : 'developing'
      }
    })
    
    // Show completion message based on debate quality
    const persuasivenessScore = context.modeState?.persuasivenessScore || 0
    const evidenceCount = context.modeState?.evidenceProvided || 0
    
    const debateMessage = persuasivenessScore >= 150 && evidenceCount >= 3
      ? '🎯 Excellent debate skills! You presented compelling, evidence-based arguments.'
      : persuasivenessScore >= 100
      ? '💪 Good argumentative reasoning! Keep building evidence-based arguments.'
      : '📚 You\'re developing debate skills! Focus on evidence and counterarguments.'
    
    context.actions.showToast(debateMessage, 'success')
  },
  
  // Extended time for thoughtful arguments
  getTimeLimit: () => 120,
  
  // Debate-specific score calculation
  calculateScore: (answers, questions) => {
    const baseScore = (answers.filter(a => a.isCorrect).length / questions.length) * 100
    
    // Quality bonus for substantial arguments
    const substantialAnswers = answers.filter(a => a.answer.length > 100).length
    const argumentQualityBonus = substantialAnswers * 5
    
    return Math.min(100, Math.round(baseScore + argumentQualityBonus))
  },
  
  // Analytics data specific to debate learning
  getAnalyticsData: (context) => ({
    mode: 'debate',
    civic_discourse_training: true,
    arguments_presented: context.modeState?.argumentsPresented?.length || 0,
    evidence_usage: context.modeState?.evidenceProvided || 0,
    counterargument_skills: context.modeState?.counterargumentsMade || 0,
    persuasiveness_development: context.modeState?.persuasivenessScore || 0,
    logical_reasoning_strength: context.modeState?.logicalFallaciesAvoided || 0,
    debate_effectiveness: (context.modeState?.persuasivenessScore || 0) >= 100 ? 'high' : 'developing'
  }),
  
  // Save debate progress
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'debate',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    debateData: {
      position: context.modeState?.currentPosition || 'neutral',
      arguments: context.modeState?.argumentsPresented || [],
      evidence: context.modeState?.evidenceProvided || 0,
      persuasiveness: context.modeState?.persuasivenessScore || 0
    }
  })
}) 