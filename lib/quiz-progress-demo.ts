/**
 * Demo: How to use the Quiz Progress Storage Utility
 * 
 * This file demonstrates the consistent API across all quiz types
 */

import { 
  createRegularQuizProgress,
  createCivicsTestProgress,
  createOnboardingAssessmentProgress,
  createMultiplayerQuizProgress,
  QuizProgressStorage,
  type BaseQuizState
} from './progress-storage'

// =============================================================================
// EXAMPLE USAGE FOR DIFFERENT QUIZ TYPES
// =============================================================================

export function demoQuizProgressUsage() {
  console.log('🎮 Quiz Progress Storage Demo')

  const userId = 'user-123'
  const guestToken = 'guest-456'
  const topicId = 'civics-basics'
  const roomId = 'multiplayer-room-789'

  // =============================================================================
  // 1. REGULAR QUIZ PROGRESS
  // =============================================================================
  
  const regularQuizProgress = createRegularQuizProgress(userId, undefined, topicId)
  
  const sampleRegularQuizState: BaseQuizState = {
    sessionId: 'quiz-session-1',
    quizType: 'regular_quiz',
    topicId: topicId,
    questions: [
      { id: '1', question: 'What is democracy?', options: [], correctAnswer: 'A', explanation: '' },
      { id: '2', question: 'How many branches of government?', options: [], correctAnswer: 'B', explanation: '' }
    ],
    currentQuestionIndex: 1,
    answers: { '1': 'A' },
    streak: 1,
    maxStreak: 1,
    startTime: Date.now() - 60000, // Started 1 minute ago
    responseTimes: { '1': 15 },
    savedAt: Date.now()
  }

  // Save progress
  regularQuizProgress.save(sampleRegularQuizState)
  
  // Load progress
  const restoredRegularState = regularQuizProgress.load()
  console.log('Regular quiz restored:', restoredRegularState?.currentQuestionIndex)

  // =============================================================================
  // 2. CIVICS TEST PROGRESS
  // =============================================================================
  
  const civicsTestProgress = createCivicsTestProgress(userId, guestToken)
  
  const sampleCivicsTestState: BaseQuizState = {
    sessionId: 'civics-test-session-1',
    quizType: 'civics_test',
    questions: [
      { id: '1', question: 'What is the Constitution?', options: [], correctAnswer: 'A', explanation: '' }
    ],
    currentQuestionIndex: 0,
    answers: {},
    streak: 0,
    maxStreak: 0,
    startTime: Date.now(),
    responseTimes: {},
    savedAt: Date.now(),
    testType: 'full',
    categoryPerformance: {}
  }

  civicsTestProgress.save(sampleCivicsTestState)
  const restoredCivicsState = civicsTestProgress.load()
  console.log('Civics test restored:', restoredCivicsState?.testType)

  // =============================================================================
  // 3. ONBOARDING ASSESSMENT PROGRESS
  // =============================================================================
  
  const onboardingProgress = createOnboardingAssessmentProgress(userId)
  
  const sampleOnboardingState: BaseQuizState = {
    sessionId: 'onboarding-session-1',
    quizType: 'onboarding_assessment',
    questions: [
      { id: '1', question: 'Basic civics question', options: [], correctAnswer: 'A', explanation: '' }
    ],
    currentQuestionIndex: 0,
    answers: {},
    streak: 0,
    maxStreak: 0,
    startTime: Date.now(),
    responseTimes: {},
    savedAt: Date.now(),
    assessmentMode: 'quick'
  }

  onboardingProgress.save(sampleOnboardingState)
  const restoredOnboardingState = onboardingProgress.load()
  console.log('Onboarding assessment restored:', restoredOnboardingState?.assessmentMode)

  // =============================================================================
  // 4. MULTIPLAYER QUIZ PROGRESS
  // =============================================================================
  
  const multiplayerProgress = createMultiplayerQuizProgress(userId, undefined, roomId)
  
  const sampleMultiplayerState: BaseQuizState = {
    sessionId: 'multiplayer-session-1',
    quizType: 'multiplayer',
    topicId: roomId,
    questions: [
      { id: '1', question: 'Multiplayer question', options: [], correctAnswer: 'A', explanation: '' }
    ],
    currentQuestionIndex: 0,
    answers: {},
    streak: 0,
    maxStreak: 0,
    startTime: Date.now(),
    responseTimes: {},
    savedAt: Date.now(),
    roomId: roomId,
    playerId: userId,
    gameMode: 'speed_round',
    playerScores: {}
  }

  multiplayerProgress.save(sampleMultiplayerState)
  const restoredMultiplayerState = multiplayerProgress.load()
  console.log('Multiplayer quiz restored:', restoredMultiplayerState?.gameMode)

  // =============================================================================
  // 5. UTILITY FUNCTIONS
  // =============================================================================
  
  // Get all progress for debugging
  const allProgress = QuizProgressStorage.getAllProgress()
  console.log('All stored progress:', Object.keys(allProgress))

  // Clean up expired progress
  const cleanedCount = QuizProgressStorage.cleanupExpiredProgress(1) // 1 hour max age
  console.log('Cleaned up expired entries:', cleanedCount)

  // Clear specific progress
  regularQuizProgress.clear()
  civicsTestProgress.clear()
  onboardingProgress.clear()
  multiplayerProgress.clear()

  console.log('✅ Demo completed')
}

// =============================================================================
// INTEGRATION PATTERNS
// =============================================================================

/**
 * Pattern 1: Simple Save/Load/Clear
 */
export function simplePattern(userId: string, topicId: string) {
  const progress = createRegularQuizProgress(userId, undefined, topicId)
  
  // Save current state
  const currentState: BaseQuizState = {
    sessionId: 'session-1',
    quizType: 'regular_quiz',
    topicId,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    streak: 0,
    maxStreak: 0,
    startTime: Date.now(),
    responseTimes: {},
    savedAt: Date.now()
  }
  
  progress.save(currentState)
  
  // Load on next session
  const restored = progress.load()
  if (restored) {
    console.log('Resuming from question:', restored.currentQuestionIndex + 1)
    return restored
  }
  
  // Clear when done
  progress.clear()
  return null
}

/**
 * Pattern 2: With Validation
 */
export function validationPattern(userId: string, topicId: string) {
  const progress = createRegularQuizProgress(userId, undefined, topicId)
  
  const restored = progress.load()
  if (restored) {
    const validation = progress.validate(restored)
    if (validation.isValid) {
      console.log('Valid state restored')
      return restored
    } else {
      console.log('Invalid state:', validation.reason)
      progress.clear()
    }
  }
  
  return null
}

/**
 * Pattern 3: Guest User Fallback
 */
export function guestUserPattern(userId?: string, guestToken?: string, topicId?: string) {
  // Works for both authenticated and guest users
  const progress = createRegularQuizProgress(userId, guestToken, topicId)
  
  const restored = progress.load()
  if (restored) {
    console.log('Progress restored for:', userId ? 'user' : 'guest')
    return restored
  }
  
  return null
}

/**
 * Pattern 4: Cross-Quiz Type Cleanup
 */
export function cleanupPattern() {
  // Clean up all expired progress across all quiz types
  QuizProgressStorage.cleanupExpiredProgress(4) // 4 hours
  
  // Get overview of all stored progress
  const allProgress = QuizProgressStorage.getAllProgress()
  console.log('Storage overview:', {
    totalEntries: Object.keys(allProgress).length,
    quizTypes: Object.keys(allProgress).map(key => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}').quizType
      } catch {
        return 'unknown'
      }
    }).filter((type, index, arr) => arr.indexOf(type) === index)
  })
} 