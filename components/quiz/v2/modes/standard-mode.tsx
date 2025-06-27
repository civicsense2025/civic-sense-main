import React from 'react'
import { DEFAULT_MODE_CONFIGS } from '@/lib/types/quiz'
import { createGameModePlugin } from './types'
import type { GameModePlugin, QuizEngineContext } from './types'

// Standard mode state
interface StandardModeState {
  hintsUsed: number
  questionsSkipped: number
  averageResponseTime: number
}

// Standard quiz mode - the foundation of CivicSense quizzes
export const standardModePlugin: GameModePlugin<StandardModeState> = createGameModePlugin({
  mode: 'standard',
  displayName: 'Standard Quiz',
  description: 'Learn about civic power structures through interactive questions and explanations.',
  category: 'solo',
  config: {
    mode: 'standard',
    settings: DEFAULT_MODE_CONFIGS.standard
  },
  
  // Initialize state
  getInitialState: () => ({
    hintsUsed: 0,
    questionsSkipped: 0,
    averageResponseTime: 0
  }),
  
  // State reducer for standard mode events
  stateReducer: (state, action) => {
    switch (action.type) {
      case 'USE_POWERUP':
        if (action.payload.powerup === 'hint') {
          return { ...state, hintsUsed: state.hintsUsed + 1 }
        }
        return state
        
      case 'QUESTION_COMPLETE':
        const responseTime = action.payload.answer.timeSpent
        const totalQuestions = state.averageResponseTime ? 
          Math.floor(state.averageResponseTime / responseTime) + 1 : 1
        const newAverage = (state.averageResponseTime * (totalQuestions - 1) + responseTime) / totalQuestions
        
        return {
          ...state,
          averageResponseTime: newAverage
        }
        
      default:
        return state
    }
  },
  
  // Lifecycle hooks
  onModeStart: async (context) => {
    // Initialize standard mode analytics
    console.log('🎯 Starting Standard Quiz Mode for topic:', context.topicId)
    
    // Update game metadata for civic education tracking
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        quiz_type: 'standard',
        civic_learning_objectives: [
          'Understanding power structures',
          'Recognizing political mechanisms',
          'Building civic knowledge'
        ]
      }
    })
  },
  
  onQuestionStart: async (question, index, context) => {
    // Track question engagement for civic education analytics
    console.log(`📝 Standard Mode: Question ${index + 1} - ${question.question}`)
    
    // Update mode state with question timing
    const currentTime = Date.now()
    context.actions.updateModeState({
      ...context.modeState,
      currentQuestionStartTime: currentTime
    })
  },
  
  onAnswerSubmit: async (answer, context) => {
    // Standard mode validation - allow all answers
    console.log('✅ Standard Mode: Answer submitted:', answer.answer)
    return true
  },
  
  onQuestionComplete: async (question, answer, context) => {
    // Provide civic education feedback
    console.log('🎓 Standard Mode: Question completed with civic learning focus')
    
    // Show toast with civic learning encouragement
    const isCorrect = answer.isCorrect
    const civicMessage = isCorrect
      ? 'Great! You\'re building democratic knowledge that politicians don\'t want you to have.'
      : 'That\'s how power works - let\'s learn the uncomfortable truth together.'
    
    context.actions.showToast(civicMessage, isCorrect ? 'success' : 'info')
  },
  
  onModeComplete: async (results, context) => {
    console.log('🏆 Standard Mode: Quiz completed!', {
      score: results.score,
      civicKnowledgeGained: true,
      topicMastered: context.topicId
    })
    
    // Update game metadata with completion data
    context.actions.updateGameMetadata({
      ...context.gameMetadata,
      custom: {
        ...context.gameMetadata.custom,
        completion_type: 'standard',
        civic_engagement_score: results.score,
        power_dynamics_learned: true,
        democratic_confidence_boost: results.score >= 70
      }
    })
  },
  
  // Custom time limit based on question complexity
  getTimeLimit: (question, context) => {
    const baseTiimeLimit = context.modeSettings.timeLimit || 60
    
    // Adjust time based on question type and civic complexity
    switch (question.type) {
      case 'short_answer':
        return baseTiimeLimit * 1.5 // More time for thoughtful responses
      case 'crossword':
        return baseTiimeLimit * 2 // Complex civic terminology needs time
      default:
        return baseTiimeLimit
    }
  },
  
  // Standard mode score calculation emphasizes civic understanding
  calculateScore: (answers, questions) => {
    const totalQuestions = questions.length
    const correctAnswers = answers.filter(a => a.isCorrect).length
    
    // Base score
    let score = (correctAnswers / totalQuestions) * 100
    
    // Bonus for civic engagement (based on time spent thoughtfully)
    const thoughtfulAnswers = answers.filter(a => a.timeSpent > 10 && a.timeSpent < 60).length
    const thoughtfulnessBonus = (thoughtfulAnswers / totalQuestions) * 5
    
    return Math.min(100, Math.round(score + thoughtfulnessBonus))
  },
  
  // Accessibility support
  getAriaLabel: (context) => {
    const currentQ = context.currentQuestionIndex + 1
    const totalQ = context.questions.length
    return `Standard civic quiz, question ${currentQ} of ${totalQ}. Score: ${context.score}%`
  },
  
  getKeyboardShortcuts: () => [
    {
      key: 'h',
      description: 'Show hint for current question',
      action: () => console.log('Hint requested')
    },
    {
      key: 'Enter',
      description: 'Submit current answer',
      action: () => console.log('Answer submitted via keyboard')
    },
    {
      key: 'n',
      description: 'Next question (if available)',
      action: () => console.log('Next question requested')
    }
  ],
  
  // Analytics data specific to civic education
  getAnalyticsData: (context) => ({
    mode: 'standard',
    civic_learning_session: true,
    democratic_knowledge_building: true,
    power_structure_education: true,
    hintsUsed: context.modeState?.hintsUsed || 0,
    averageResponseTime: context.modeState?.averageResponseTime || 0,
    civicEngagementLevel: context.score >= 70 ? 'high' : context.score >= 40 ? 'medium' : 'developing'
  }),
  
  // Progress storage - always save in standard mode
  shouldSaveProgress: () => true,
  
  getProgressData: (context) => ({
    mode: 'standard',
    currentQuestionIndex: context.currentQuestionIndex,
    answers: context.userAnswers,
    modeState: context.modeState,
    civicLearningProgress: {
      questionsCompleted: context.userAnswers.length,
      democraticKnowledgeScore: context.score,
      powerStructuresUnderstood: context.userAnswers.filter(a => a.isCorrect).length
    }
  })
}) 