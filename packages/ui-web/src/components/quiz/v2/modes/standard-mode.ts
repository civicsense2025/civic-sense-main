import type { GameMode, StandardModeSettings } from './types'
import { toast } from '../../../../components/ui/toast-utils'

export const standardMode: GameMode<StandardModeSettings> = {
  id: 'standard',
  displayName: 'Standard Mode',
  description: 'Customizable solo quiz experience',
  icon: '📝',
  
  // Default settings that create a classic quiz experience
  defaultSettings: {
    // No time pressure by default
    timeLimit: null,
    totalTimeLimit: null,
    
    // Learning-friendly defaults
    allowHints: false,
    allowSkip: false,
    allowReview: true,
    showExplanations: true,
    instantFeedback: false,
    
    // Standard scoring
    scoringMode: 'standard',
    streakBonus: true,
    
    // All questions by default
    questionCount: undefined,
    shuffleQuestions: false,
    difficulty: 'mixed',
    
    // Single topic by default (will be set by topic selection)
    topics: [],
    mixTopics: false
  },
  
  // Validate settings
  validateSettings: (settings) => {
    const errors: string[] = []
    
    if (settings.topics.length === 0) {
      errors.push('At least one topic must be selected')
    }
    
    if (settings.questionCount && settings.questionCount < 1) {
      errors.push('Question count must be at least 1')
    }
    
    if (settings.timeLimit && settings.timeLimit < 10) {
      errors.push('Time limit must be at least 10 seconds per question')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  onModeStart: (settings) => {
    // Log mode configuration for analytics
    console.log('🎯 Starting Standard Mode with settings:', {
      mode: settings.scoringMode,
      timed: settings.timeLimit !== null,
      practiceFeatures: settings.allowHints || settings.allowSkip,
      multiTopic: settings.topics.length > 1
    })
    
    // Show mode-specific welcome message
    if (settings.scoringMode === 'survival') {
      toast({
        title: "Survival Mode Active! 💀",
        description: "One wrong answer ends the quiz. Good luck!",
        className: "bg-red-500/10 border-red-500"
      })
    } else if (settings.timeLimit) {
      toast({
        title: "Timed Mode Active! ⏱️",
        description: `You have ${settings.timeLimit} seconds per question`,
        className: "bg-yellow-500/10 border-yellow-500"
      })
    } else if (settings.allowHints && settings.allowSkip) {
      toast({
        title: "Practice Mode Active! 📚",
        description: "Take your time to learn with hints and skips available",
        className: "bg-green-500/10 border-green-500"
      })
    }
  },
  
  onQuestionStart: (question, questionIndex, settings) => {
    // Could play different sounds based on settings
    if (settings.scoringMode === 'speed-bonus' && settings.timeLimit) {
      console.log(`⚡ Speed bonus available! Answer quickly for extra points`)
    }
  },
  
  onAnswerSubmit: (answer, isCorrect, timeSpent, settings) => {
    // Handle different scoring modes
    if (settings.scoringMode === 'survival' && !isCorrect) {
      toast({
        title: "Game Over! 💀",
        description: "Survival mode ended - one wrong answer is all it takes!",
        variant: "destructive"
      })
      // The quiz engine should handle ending the quiz
      return
    }
    
    // Speed bonus feedback
    if (settings.scoringMode === 'speed-bonus' && isCorrect && timeSpent < 10) {
      toast({
        title: "Speed Bonus! ⚡",
        description: "+10 points for quick correct answer!",
        className: "bg-yellow-500/10 border-yellow-500"
      })
    }
    
    // Instant feedback if enabled
    if (settings.instantFeedback) {
      if (isCorrect) {
        toast({
          title: "Correct! ✅",
          description: "Well done!",
          className: "bg-green-500/10 border-green-500"
        })
      } else {
        toast({
          title: "Not quite right",
          description: settings.showExplanations ? "Check the explanation below" : "Keep trying!",
          variant: "destructive"
        })
      }
    }
  },
  
  onQuizComplete: (results, settings) => {
    // Custom completion messages based on settings
    if (settings.scoringMode === 'survival') {
      if (results.correctAnswers === results.totalQuestions) {
        toast({
          title: "Perfect Survival Run! 🏆",
          description: "You completed survival mode without a single mistake!",
          className: "bg-primary/10 border-primary"
        })
      }
    } else if (settings.scoringMode === 'speed-bonus') {
      const avgTime = results.timeSpentSeconds / results.totalQuestions
      if (avgTime < 15) {
        toast({
          title: "Speed Demon! ⚡",
          description: "Amazing average answer time!",
          className: "bg-yellow-500/10 border-yellow-500"
        })
      }
    }
    
    // Multi-topic completion
    if (settings.topics.length > 1) {
      toast({
        title: "Multi-Topic Master! 🎯",
        description: `You've completed questions from ${settings.topics.length} different topics!`,
        className: "bg-primary/10 border-primary"
      })
    }
  }
}

// Preset configurations for common use cases
export const standardModePresets = {
  classic: {
    ...standardMode.defaultSettings,
    name: 'Classic'
  },
  
  timed: {
    ...standardMode.defaultSettings,
    timeLimit: 30,
    scoringMode: 'speed-bonus' as const,
    name: 'Timed Challenge'
  },
  
  practice: {
    ...standardMode.defaultSettings,
    allowHints: true,
    allowSkip: true,
    instantFeedback: true,
    showExplanations: true,
    name: 'Practice'
  },
  
  survival: {
    ...standardMode.defaultSettings,
    scoringMode: 'survival' as const,
    timeLimit: 45,
    allowSkip: false,
    allowReview: false,
    name: 'Survival'
  },
  
  speedRun: {
    ...standardMode.defaultSettings,
    timeLimit: 15,
    totalTimeLimit: 300, // 5 minutes total
    scoringMode: 'speed-bonus' as const,
    instantFeedback: true,
    showExplanations: false,
    name: 'Speed Run'
  }
} 