import React from 'react'
import type { GameMode } from './types'

export const practiceMode: GameMode = {
  id: 'practice',
  displayName: 'Practice Mode',
  description: 'Learn at your own pace with unlimited attempts',
  icon: '📚',
  
  config: {
    timeLimit: undefined, // No time limit
    allowSkip: true,
    allowReview: true,
    showExplanations: true,
    instantFeedback: true
  },
  
  features: {
    powerups: ['hint', 'eliminate-wrong', 'ask-civicsense'],
    specialRules: [
      'No time pressure',
      'Multiple attempts per question',
      'Detailed explanations after each answer',
      'Skip questions and come back later',
      'No scoring - focus on learning'
    ]
  },
  
  onAnswerSubmit: (answer, isCorrect, timeSpent) => {
    // In practice mode, we focus on learning, not scoring
    console.log('📚 Practice mode: Learning opportunity!', { isCorrect })
  },
  
  // Custom UI for practice mode could show hints, explanations inline
  getQuestionUI: (question, defaultUI) => {
    // For now, return default UI
    // Could enhance with hint buttons, etc.
    return defaultUI
  },
  
  getResultsUI: (results, defaultUI) => {
    // Practice mode shows learning progress instead of score
    return (
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold">Practice Complete!</h2>
        <p className="text-muted-foreground">
          You've reviewed {results.totalQuestions} questions about civic knowledge.
        </p>
        <div className="bg-primary/10 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-lg">
            {results.correctAnswers} understood first try
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Remember: In democracy, understanding matters more than memorization
          </div>
        </div>
      </div>
    )
  }
} 