import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@civicsense/shared/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Flashcard mode state
interface FlashcardModeState {
  cardsReviewed: number
  cardsCorrect: number
  confidenceLevels: Record<string, 'low' | 'medium' | 'high'>
  reviewCycle: number
  spacedRepetitionData: Record<string, number>
}

// Flashcard mode - spaced repetition civic learning
export const flashcardModePlugin: GameModePlugin<FlashcardModeState> = createGameModePlugin({
  mode: 'standard', // Use standard for database compatibility, customize with mode_settings
  displayName: 'Flashcard Mode',
  description: 'Learn civic concepts through spaced repetition flashcards.',
  category: 'solo',
  config: {
    mode: 'standard',
    settings: {
      ...DEFAULT_MODE_CONFIGS.standard,
      showHints: true,
      showExplanations: true,
      allowSkip: true,
      timeLimit: 0, // No time pressure
      autoAdvance: false
    }
  },
  
  // Initialize state
  getInitialState: () => ({
    cardsReviewed: 0,
    cardsCorrect: 0,
    confidenceLevels: {},
    reviewCycle: 1,
    spacedRepetitionData: {}
  }),
  
  // State reducer for flashcard events
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'ANSWER_SUBMIT':
        return {
          ...state,
          cardsReviewed: state.cardsReviewed + 1,
          cardsCorrect: action.payload?.answer?.isCorrect 
            ? state.cardsCorrect + 1 
            : state.cardsCorrect
        }
      
      case 'CUSTOM':
        if (action.payload?.type === 'set_confidence') {
          return {
            ...state,
            confidenceLevels: {
              ...state.confidenceLevels,
              [action.payload.questionId]: action.payload.confidence
            }
          }
        }
        if (action.payload?.type === 'next_cycle') {
          return { ...state, reviewCycle: state.reviewCycle + 1 }
        }
        return state
        
      default:
        return state
    }
  },
  
  // Custom rendering for flashcard interface
  renderInterface: (context) => {
    const { questions, currentQuestionIndex, modeState } = context
    const currentQuestion = questions[currentQuestionIndex]
    
    if (!currentQuestion) return null
    
    const setConfidence = (level: 'low' | 'medium' | 'high') => {
      const newModeState = {
        ...modeState,
        confidenceLevels: {
          ...modeState?.confidenceLevels,
          [currentQuestion.question_number.toString()]: level
        }
      }
      context.actions.updateModeState(newModeState)
    }
    
    return (
      <div className="flashcard-interface bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Civic Flashcard {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <div className="text-sm text-blue-600 dark:text-blue-300">
            Cycle {modeState?.reviewCycle || 1} • Reviewed: {modeState?.cardsReviewed || 0}
          </div>
        </div>
        
        <div className="flashcard-content bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg min-h-48 flex items-center justify-center">
          <div className="text-center">
            <h4 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
              {currentQuestion.question}
            </h4>
            
            {/* Confidence rating */}
            <div className="mt-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                How confident do you feel about this topic?
              </p>
              <div className="flex justify-center gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level as 'low' | 'medium' | 'high')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      modeState?.confidenceLevels?.[currentQuestion.question_number.toString()] === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-xs text-blue-600 dark:text-blue-400">
            💡 Tip: Rate your confidence to optimize your learning schedule
          </div>
        </div>
      </div>
    )
  },
  
  onModeStart: async (context) => {
    console.log('🃏 Flashcard Mode: Starting spaced repetition learning')
    context.actions.showToast(
      'Learn civic concepts at your own pace with flashcards!',
      'info'
    )
  },
  
  onModeComplete: async (results, context) => {
    console.log('🎓 Flashcard Mode: Learning session completed!', {
      cardsReviewed: context.modeState?.cardsReviewed || 0,
      accuracy: results.score,
      confidenceBuilt: true
    })
    
    // Update game metadata with flashcard-specific data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'flashcard',
        cards_reviewed: context.modeState?.cardsReviewed || 0,
        confidence_levels: context.modeState?.confidenceLevels || {},
        spaced_repetition_cycle: context.modeState?.reviewCycle || 1,
        learning_method: 'spaced_repetition'
      }
    })
    
    // Show encouraging completion message
    context.actions.showToast(
      'Great flashcard session! Your civic knowledge is building steadily.',
      'success'
    )
  },
  
  // No time limit for thoughtful learning
  getTimeLimit: () => null,
  
  // Analytics data specific to flashcard learning
  getAnalyticsData: (context) => ({
    mode: 'flashcard',
    spaced_repetition_learning: true,
    cards_reviewed: context.modeState?.cardsReviewed || 0,
    confidence_tracking: true,
    review_cycle: context.modeState?.reviewCycle || 1,
    learning_effectiveness: context.score >= 60 ? 'high' : 'developing'
  }),
  
  // Save progress frequently for spaced repetition
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'flashcard',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    spacedRepetitionData: {
      cardsReviewed: context.modeState?.cardsReviewed || 0,
      confidenceLevels: context.modeState?.confidenceLevels || {},
      reviewCycle: context.modeState?.reviewCycle || 1
    }
  })
}) 