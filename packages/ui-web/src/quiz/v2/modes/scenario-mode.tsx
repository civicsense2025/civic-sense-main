import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@civicsense/shared/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Scenario mode state
interface ScenarioModeState {
  scenarioPath: string[]
  decisionssMade: Record<string, string>
  currentScenario: string
  resourcePoints: number
  influenceLevel: number
  coalitionsFormed: string[]
}

// Scenario mode - interactive civic decision-making
export const scenarioModePlugin: GameModePlugin<ScenarioModeState> = createGameModePlugin({
  mode: 'standard', // Use standard for database compatibility
  displayName: 'Scenario Mode',
  description: 'Navigate real-world civic scenarios and see how power actually works.',
  category: 'solo',
  config: {
    mode: 'standard',
    settings: {
      ...DEFAULT_MODE_CONFIGS.standard,
      showHints: true,
      showExplanations: true,
      allowSkip: false,
      timeLimit: 0, // Take time to think
      autoAdvance: false
    }
  },
  
  // Initialize state
  getInitialState: (): ScenarioModeState => ({
    scenarioPath: [] as string[],
    decisionssMade: {} as Record<string, string>,
    currentScenario: 'intro',
    resourcePoints: 100,
    influenceLevel: 1,
    coalitionsFormed: [] as string[]
  }),
  
  // State reducer for scenario events
  stateReducer: (state: ScenarioModeState, action): ScenarioModeState => {
    switch (action.type) {
      case 'ANSWER_SUBMIT':
        const decision = action.payload?.answer?.answer || ''
        return {
          ...state,
          scenarioPath: [...state.scenarioPath, decision],
          decisionssMade: {
            ...state.decisionssMade,
            [state.currentScenario]: decision
          }
        }
      
      case 'CUSTOM':
        if (action.payload?.type === 'change_scenario') {
          return { ...state, currentScenario: action.payload.scenario }
        }
        if (action.payload?.type === 'update_resources') {
          return { 
            ...state, 
            resourcePoints: Math.max(0, state.resourcePoints + action.payload.change),
            influenceLevel: action.payload.influence ? state.influenceLevel + 1 : state.influenceLevel
          }
        }
        if (action.payload?.type === 'form_coalition') {
          return {
            ...state,
            coalitionsFormed: [...state.coalitionsFormed, action.payload.coalition]
          }
        }
        return state
        
      default:
        return state
    }
  },
  
  // Custom rendering for scenario interface
  renderInterface: (context) => {
    const { questions, currentQuestionIndex, modeState } = context
    const currentQuestion = questions[currentQuestionIndex]
    
    if (!currentQuestion) return null
    
    return (
      <div className="scenario-interface bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Civic Scenario: {modeState?.currentScenario || 'Getting Started'}
            </h3>
            <div className="text-sm text-green-600 dark:text-green-300">
              Step {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-green-700 dark:text-green-300">
              Resources: {modeState?.resourcePoints || 100} pts
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Influence: Level {modeState?.influenceLevel || 1}
            </div>
          </div>
        </div>
        
        <div className="scenario-content bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
          <div className="mb-4">
            <h4 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              {currentQuestion.question}
            </h4>
            
            {/* Show scenario context */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 mb-4">
              <div className="text-sm text-emerald-800 dark:text-emerald-200">
                💡 <strong>Real-world context:</strong> This scenario is based on actual civic challenges. 
                Your decisions will show you how power dynamics work in practice.
              </div>
            </div>
            
            {/* Decision path tracker */}
            {modeState?.scenarioPath && modeState.scenarioPath.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Your decisions so far:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {modeState.scenarioPath.map((decision: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                    >
                      {index + 1}. {decision.substring(0, 30)}...
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Coalitions formed */}
            {modeState?.coalitionsFormed && modeState.coalitionsFormed.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Coalitions formed:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {modeState.coalitionsFormed.map((coalition: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                    >
                      🤝 {coalition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-xs text-green-600 dark:text-green-400">
            🏛️ Navigate real civic challenges and build democratic power
          </div>
        </div>
      </div>
    )
  },
  
  onModeStart: async (context) => {
    console.log('🏛️ Scenario Mode: Starting interactive civic scenario')
    context.actions.showToast(
      'Navigate real-world civic challenges and see how power works!',
      'info'
    )
  },
  
  onAnswerSubmit: async (answer, context) => {
    // Process scenario decisions and update resources
    const isStrategicChoice = answer.answer.length > 50 // Detailed answers show strategic thinking
    
    if (isStrategicChoice) {
      const newModeState = {
        ...context.modeState,
        resourcePoints: (context.modeState?.resourcePoints || 100) + 10,
        influenceLevel: context.modeState?.influenceLevel || 1
      }
      context.actions.updateModeState(newModeState)
    }
    
    return true
  },
  
  onModeComplete: async (results, context) => {
    console.log('🎯 Scenario Mode: Civic scenario completed!', {
      finalScore: results.score,
      resourcesGained: context.modeState?.resourcePoints || 100,
      coalitionsFormed: context.modeState?.coalitionsFormed?.length || 0,
      influenceLevel: context.modeState?.influenceLevel || 1
    })
    
    // Update game metadata with scenario-specific data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'scenario',
        scenario_path: context.modeState?.scenarioPath || [],
        final_resources: context.modeState?.resourcePoints || 100,
        coalitions_formed: context.modeState?.coalitionsFormed || [],
        influence_level: context.modeState?.influenceLevel || 1,
        strategic_decisions: context.modeState?.scenarioPath?.length || 0
      }
    })
    
    // Show completion message with civic impact
    const resourcePoints = context.modeState?.resourcePoints || 100
    const impactMessage = resourcePoints >= 150 
      ? 'Excellent! You navigated the power dynamics like a seasoned civic leader.'
      : resourcePoints >= 100
      ? 'Good work! You understand how to build democratic power effectively.'
      : 'You\'re learning! Real civic change requires strategic thinking and coalition building.'
    
    context.actions.showToast(impactMessage, 'success')
  },
  
  // No time limit for strategic thinking
  getTimeLimit: () => null,
  
  // Analytics data specific to scenario learning
  getAnalyticsData: (context) => ({
    mode: 'scenario',
    interactive_civic_learning: true,
    decisions_made: context.modeState?.scenarioPath?.length || 0,
    resource_management: context.modeState?.resourcePoints || 100,
    coalition_building: context.modeState?.coalitionsFormed?.length || 0,
    influence_level: context.modeState?.influenceLevel || 1,
    civic_strategy_effectiveness: context.score >= 70 ? 'high' : 'developing'
  }),
  
  // Always save scenario progress
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'scenario',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    scenarioData: {
      path: context.modeState?.scenarioPath || [],
      resources: context.modeState?.resourcePoints || 100,
      coalitions: context.modeState?.coalitionsFormed || [],
      influence: context.modeState?.influenceLevel || 1
    }
  })
}) 