'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Check, X, ArrowRight, Loader2, Flame, RotateCcw, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from "../lib/supabase/client"
import { Card, CardContent } from './ui/card'
import { pendingUserAttribution } from '@civicsense/business-logic/services/user'
import { updateEnhancedProgress } from '@civicsense/business-logic/services/gamification'
import { SocialProofBubble } from '@/components/social-proof-bubble'
import { createCivicsTestProgress, type BaseQuizState } from '@civicsense/business-logic/services/progress'
import { 
  createEnhancedCivicsTestProgress, 
  type EnhancedQuizState, 
  type QuestionResponse 
} from '@civicsense/shared/enhanced-progress-storage'
import { useKeyboardShortcuts, type KeyboardShortcutGroup } from '@civicsense/business-logic/utils/keyboard-shortcuts'

interface AssessmentQuestion {
  id: string
  question: string
  options: Array<{ id: string; text: string }>
  correctAnswer: string
  explanation: string
  friendlyExplanation: string
  difficulty: number
  category: string
  skill_id?: string
}

interface CivicsTestAssessmentProps {
  onComplete: (data: any) => void
  onBack: () => void
  testType?: 'quick' | 'full'
  userId?: string
  guestToken?: string
}

interface TestState {
  sessionId: string
  testType: 'quick' | 'full'
  questions: AssessmentQuestion[]
  currentQuestionIndex: number
  answers: { [questionId: string]: string }
  streak: number
  maxStreak: number
  startTime: number
  responseTimes: { [questionId: string]: number }
  categoryPerformance: Record<string, { correct: number; total: number }>
}

// Enhanced WordReveal with natural typing animation
function WordReveal({ text, speed = 60, className, onComplete }: { text: string, speed?: number, className?: string, onComplete?: () => void }) {
  const words = text.split(' ')
  const [visibleWords, setVisibleWords] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setVisibleWords([])
    setIsComplete(false)
    
    if (!text) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    let currentIndex = 0

    function revealNextWord() {
      if (currentIndex < words.length) {
        setVisibleWords(words.slice(0, currentIndex + 1))
        currentIndex += 1
        
        // Schedule next word
        timeoutRef.current = setTimeout(revealNextWord, speed)
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Start revealing immediately with first word
    timeoutRef.current = setTimeout(revealNextWord, 100)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, speed, onComplete])

  return (
    <span className={className}>
      {visibleWords.join(' ')}
      {!isComplete && visibleWords.length > 0 && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ 
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{ display: 'inline-block', color: '#3b82f6', marginLeft: '0.25rem' }}
        >
          |
        </motion.span>
      )}
    </span>
  )
}

// Animated Streak Display
function StreakDisplay({ streak, isVisible }: { streak: number, isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && streak > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 50 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 0.6,
              repeat: streak > 2 ? Infinity : 0,
              repeatType: "reverse"
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '2px solid',
              background: streak >= 5 
                ? 'linear-gradient(to right, #f97316, #ef4444)' 
                : streak >= 3 
                ? 'linear-gradient(to right, #facc15, #f97316)'
                : 'linear-gradient(to right, #4ade80, #3b82f6)',
              borderColor: streak >= 5 
                ? '#fed7aa' 
                : streak >= 3 
                ? '#fde047'
                : '#86efac',
              color: 'white'
            }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <Flame className="w-5 h-5" />
            </motion.div>
            <span className="font-bold text-lg">{streak}</span>
            <span className="text-sm font-medium">streak!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Test Type Selection Screen
function TestTypeSelection({ onSelect, onBack }: { onSelect: (type: 'quick' | 'full') => void, onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          Choose Your Assessment
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
          How much time do you have to test your civic knowledge?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-blue-200 dark:hover:border-blue-800">
          <CardContent className="p-8 text-center space-y-6" onClick={() => onSelect('quick')}>
            <div className="text-4xl">⚡</div>
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Quick Assessment</h3>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">5-8 minutes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">8-10 focused questions</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Core civic knowledge</p>
              </div>
            </div>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-full">
              Start Quick Test
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-purple-200 dark:hover:border-purple-800">
          <CardContent className="p-8 text-center space-y-6" onClick={() => onSelect('full')}>
            <div className="text-4xl">🎯</div>
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Full Assessment</h3>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">12-15 minutes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">20-25 comprehensive questions</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Deep knowledge analysis</p>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full">
              Start Full Assessment
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onBack} className="text-slate-500 dark:text-slate-500">
          ← Back to overview
        </Button>
      </div>
    </div>
  )
}

export function CivicsTestAssessment({ onComplete, onBack, testType: initialTestType, userId, guestToken }: CivicsTestAssessmentProps) {
  const [testState, setTestState] = useState<TestState | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStreakAnimation, setShowStreakAnimation] = useState(false)
  const [hasRestoredState, setHasRestoredState] = useState(false)
  const [showTestTypeSelection, setShowTestTypeSelection] = useState(!initialTestType)
  const [selectedTestType, setSelectedTestType] = useState<'quick' | 'full'>(initialTestType || 'full')
  
  const autoAdvanceTimeout = useRef<NodeJS.Timeout | null>(null)
  const streakTimeout = useRef<NodeJS.Timeout | null>(null)
  const questionStartTime = useRef<number>(Date.now())
  const [canAdvance, setCanAdvance] = useState(false)
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(0)

  // Generate session ID for state persistence
  const sessionId = useRef<string>(`civics-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Initialize both enhanced and legacy progress managers
  const enhancedProgressManager = createEnhancedCivicsTestProgress(userId, guestToken)
  const legacyProgressManager = createCivicsTestProgress(userId, guestToken)

  // Convert TestState to BaseQuizState
  const convertToBaseQuizState = (state: TestState): BaseQuizState => ({
    sessionId: state.sessionId,
    quizType: 'civics_test',
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    streak: state.streak,
    maxStreak: state.maxStreak,
    startTime: state.startTime,
    responseTimes: state.responseTimes,
    savedAt: Date.now(),
    testType: state.testType,
    categoryPerformance: state.categoryPerformance
  })

  // Convert BaseQuizState to TestState
  const convertFromBaseQuizState = (baseState: BaseQuizState): TestState => ({
    sessionId: baseState.sessionId,
    testType: (baseState.testType || 'full') as 'quick' | 'full',
    questions: baseState.questions,
    currentQuestionIndex: baseState.currentQuestionIndex,
    answers: baseState.answers,
    streak: baseState.streak,
    maxStreak: baseState.maxStreak,
    startTime: baseState.startTime,
    responseTimes: baseState.responseTimes,
    categoryPerformance: baseState.categoryPerformance || {}
  })

  // Convert TestState to EnhancedQuizState
  const convertToEnhancedQuizState = (state: TestState): EnhancedQuizState => ({
    sessionId: state.sessionId,
    sessionType: 'civics_test',
    testType: state.testType,
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    streak: state.streak,
    maxStreak: state.maxStreak,
    responseTimes: state.responseTimes,
    categoryPerformance: state.categoryPerformance,
    startedAt: state.startTime,
    lastUpdatedAt: Date.now()
  })

  // Convert EnhancedQuizState to TestState
  const convertFromEnhancedQuizState = (enhancedState: EnhancedQuizState): TestState => ({
    sessionId: enhancedState.sessionId,
    testType: (enhancedState.testType || 'full') as 'quick' | 'full',
    questions: enhancedState.questions,
    currentQuestionIndex: enhancedState.currentQuestionIndex,
    answers: enhancedState.answers,
    streak: enhancedState.streak,
    maxStreak: enhancedState.maxStreak,
    startTime: enhancedState.startedAt,
    responseTimes: enhancedState.responseTimes,
    categoryPerformance: enhancedState.categoryPerformance || {}
  })

  // Save test state using enhanced storage with legacy fallback
  const saveTestState = async (state: TestState) => {
    try {
      // Save to enhanced database-backed storage
      const enhancedState = convertToEnhancedQuizState(state)
      const result = await enhancedProgressManager.save(enhancedState)
      
      if (result.success) {
        console.log('✅ Saved to enhanced progress storage')
      } else {
        console.warn('⚠️ Enhanced storage failed, using legacy fallback:', result.error)
      }
    } catch (error) {
      console.warn('⚠️ Enhanced storage exception, using legacy fallback:', error)
    }
    
    // Always save to legacy storage as backup
    const baseState = convertToBaseQuizState(state)
    legacyProgressManager.save(baseState)
  }

  // Load test state from enhanced storage with legacy fallback
  const loadTestState = async (): Promise<TestState | null> => {
    try {
      // Try enhanced database storage first
      const enhancedState = await enhancedProgressManager.load(sessionId.current)
      if (enhancedState) {
        console.log('✅ Restored from enhanced progress storage')
        return convertFromEnhancedQuizState(enhancedState)
      }
    } catch (error) {
      console.warn('⚠️ Enhanced storage load failed, trying legacy:', error)
    }
    
    // Fallback to legacy localStorage storage
    const baseState = legacyProgressManager.load()
    if (baseState) {
      console.log('✅ Restored from legacy progress storage')
      return convertFromBaseQuizState(baseState)
    }
    
    console.log('❌ No saved progress found in any storage')
    return null
  }

  // Save individual question response to database
  const saveQuestionResponse = async (questionId: string, answer: string, isCorrect: boolean, timeSpent: number) => {
    if (!testState || !userId) return // Skip saving if no user ID
    
    try {
      // Save to unified quiz_attempts table
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .upsert({
          user_id: userId,
          topic_id: `civics_test_${testState.testType}`,
          total_questions: testState.questions.length,
          correct_answers: Object.values(testState.answers).filter((_, idx) => 
            testState.questions[idx].correctAnswer === _
          ).length,
          score: Math.round((Object.values(testState.answers).filter((_, idx) => 
            testState.questions[idx].correctAnswer === _
          ).length / testState.questions.length) * 100),
          time_spent_seconds: Math.round((Date.now() - testState.startTime) / 1000),
          started_at: new Date(testState.startTime).toISOString(),
          is_completed: false,
          // Optional LMS fields
          clever_assignment_id: null,
          clever_section_id: null,
          grade_posted_to_lms: false
        }, {
          onConflict: 'user_id,topic_id',
          ignoreDuplicates: false
        })

      if (error) throw error
      
      console.log('✅ Saved attempt to unified quiz_attempts table:', testState.sessionId)
    } catch (error) {
      console.warn('⚠️ Failed to save to quiz_attempts:', error)
    }
  }

  // Clear saved state from both enhanced and legacy storage
  const clearSavedState = async () => {
    try {
      // Clear from enhanced storage
      if (testState) {
        await enhancedProgressManager.clear(testState.sessionId)
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear enhanced storage:', error)
    }
    
    // Clear from legacy storage
    legacyProgressManager.clear()
  }

  // Normalize API question
  function normalizeQuestion(q: any): AssessmentQuestion {
    let options: Array<{ id: string; text: string }> = []
    if (Array.isArray(q.options)) {
      if (typeof q.options[0] === 'string') {
        options = q.options.map((text: string, idx: number) => ({ id: String.fromCharCode(97 + idx), text }))
      } else if (typeof q.options[0] === 'object') {
        options = q.options.map((opt: any, idx: number) => ({ id: opt.id || String.fromCharCode(97 + idx), text: opt.text || opt.label || '' }))
      }
    }
    return {
      id: q.id,
      question: q.question,
      options,
      correctAnswer: q.correctAnswer || q.correct_answer,
      explanation: q.explanation,
      friendlyExplanation: q.friendlyExplanation || q.friendly_explanation || q.explanation,
      difficulty: q.difficulty,
      category: q.category,
      skill_id: q.skill_id
    }
  }

  // Fetch questions based on test type
  const fetchQuestions = async (testType: 'quick' | 'full') => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('balanced', 'true')
      const count = testType === 'quick' ? 10 : 100 // Use all available questions for full test
      params.set('count', String(count))
      
      const res = await fetch(`/api/onboarding/assessment-questions?${params.toString()}`)
      const result = await res.json()
      
      if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
        return result.questions.map(normalizeQuestion)
      } else {
        throw new Error('No questions returned')
      }
    } catch (err) {
      setError('Failed to load assessment questions')
      console.error('Error fetching questions:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Initialize or restore test state
  useEffect(() => {
    const initializeTest = async () => {
      console.log('🔄 Initializing test...', { 
        hasRestoredState, 
        showTestTypeSelection, 
        selectedTestType,
        userId: userId || 'guest',
        guestToken: guestToken || 'none'
      })
      
      // First, try to restore saved state (only once)
      if (!hasRestoredState) {
        try {
          const savedState = await loadTestState()
          if (savedState) {
            console.log('✅ Restoring saved state')
            setTestState(savedState)
            setSelectedTestType(savedState.testType)
            setShowTestTypeSelection(false)
            setHasRestoredState(true)
            setLoading(false)
            
            // Reset UI state for restored session
            setShowResult(false)
            setCanAdvance(false)
            setAutoAdvanceCountdown(0)
            setAssessmentComplete(false)
            
            // Track test resumption
            fetch('/api/civics-test/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: 'resumed',
                session_id: savedState.sessionId,
                user_id: userId || null,
                guest_token: !userId ? guestToken : null,
                metadata: { 
                  test_type: savedState.testType,
                  question_index: savedState.currentQuestionIndex
                }
              })
            }).catch(console.error)
            
            return
          } else {
            console.log('❌ No valid saved state found')
            setHasRestoredState(true) // Mark as checked to prevent re-checking
          }
        } catch (error) {
          console.warn('⚠️ Error loading saved state:', error)
          setHasRestoredState(true) // Mark as checked to prevent re-checking
        }
      }

      // If no saved state and test type is selected, fetch questions
      if (!showTestTypeSelection && !testState) {
        console.log('🔍 Fetching new questions for:', selectedTestType)
        const questions = await fetchQuestions(selectedTestType)
        if (questions.length > 0) {
          const newState: TestState = {
            sessionId: sessionId.current,
            testType: selectedTestType,
            questions,
            currentQuestionIndex: 0,
            answers: {},
            streak: 0,
            maxStreak: 0,
            startTime: Date.now(),
            responseTimes: {},
            categoryPerformance: {}
          }
          setTestState(newState)
          saveTestState(newState).catch(console.error)
          
          // Track test start
          fetch('/api/civics-test/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'started',
              session_id: sessionId.current,
              user_id: userId || null,
              guest_token: !userId ? guestToken : null,
              metadata: { test_type: selectedTestType }
            })
          }).catch(console.error)
        }
      } else if (showTestTypeSelection) {
        setLoading(false)
      }
    }

    initializeTest()
  }, [selectedTestType, showTestTypeSelection, hasRestoredState, userId, guestToken])

  // Handle test type selection
  const handleTestTypeSelection = (type: 'quick' | 'full') => {
    setSelectedTestType(type)
    setShowTestTypeSelection(false)
  }

  // Track response time
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [testState?.currentQuestionIndex])

  const currentQuestion = testState?.questions[testState.currentQuestionIndex]
  // Progress should be based on answered questions, not current position
  const answeredCount = testState ? Object.keys(testState.answers).length : 0
  const progress = testState?.questions.length ? (answeredCount / testState.questions.length) * 100 : 0

  // Show streak animation and hide after delay
  const triggerStreakAnimation = (newStreak: number) => {
    if (newStreak > 0) {
      setShowStreakAnimation(true)
      
      // Clear existing timeout
      if (streakTimeout.current) {
        clearTimeout(streakTimeout.current)
      }
      
      // Hide streak after 3 seconds, or 5 seconds if it's a big streak
      const delay = newStreak >= 5 ? 5000 : 3000
      streakTimeout.current = setTimeout(() => {
        setShowStreakAnimation(false)
      }, delay)
    }
  }

  // Handle answer selection
  const handleAnswer = async (optionId: string) => {
    if (!currentQuestion || !testState) return
    
    // Robust correct answer checking
    let isCorrect = false
    
    // Method 1: Find option by matching text exactly
    const correctOptionByText = currentQuestion.options.find(
      (opt) => opt.text.trim() === currentQuestion.correctAnswer.trim()
    )
    
    if (correctOptionByText) {
      isCorrect = optionId === correctOptionByText.id
    } else {
      // Method 2: Find option by matching text (case-insensitive, normalized)
      const correctOptionByNormalizedText = currentQuestion.options.find(
        (opt) => opt.text.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
      )
      
      if (correctOptionByNormalizedText) {
        isCorrect = optionId === correctOptionByNormalizedText.id
      } else {
        // Method 3: Check if correctAnswer is already an option ID
        isCorrect = optionId === currentQuestion.correctAnswer
      }
    }
    
    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log('Answer check:', {
        questionId: currentQuestion.id,
        userSelectedId: optionId,
        correctAnswer: currentQuestion.correctAnswer,
        options: currentQuestion.options,
        correctOptionByText: correctOptionByText?.id,
        isCorrect
      })
    }
    
    const newStreak = isCorrect ? testState.streak + 1 : 0
    const responseTime = Math.floor((Date.now() - questionStartTime.current) / 1000)
    
    const newState = {
      ...testState,
      answers: { ...testState.answers, [currentQuestion.id]: optionId },
      streak: newStreak,
      maxStreak: Math.max(testState.maxStreak, newStreak),
      responseTimes: { ...testState.responseTimes, [currentQuestion.id]: responseTime },
      categoryPerformance: {
        ...testState.categoryPerformance,
        [currentQuestion.category]: {
          correct: (testState.categoryPerformance[currentQuestion.category]?.correct || 0) + (isCorrect ? 1 : 0),
          total: (testState.categoryPerformance[currentQuestion.category]?.total || 0) + 1
        }
      }
    }
    
    setTestState(newState)
    saveTestState(newState).catch(console.error)
    
    // Save individual question response to database
    saveQuestionResponse(
      currentQuestion.id,
      optionId,
      isCorrect,
      responseTime * 1000 // Convert to milliseconds
    ).catch(console.error)
    
    // Trigger streak animation if correct
    if (isCorrect) {
      triggerStreakAnimation(newStreak)
    }
    
    setShowResult(true)
    setCanAdvance(false)
    
    // Start 15s timer for auto-advance with countdown
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
    
    // Start countdown after manual advance is allowed
    setTimeout(() => {
      setCanAdvance(true)
      setAutoAdvanceCountdown(12) // 12 seconds countdown after 3s delay
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setAutoAdvanceCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Auto advance after full 15s
      autoAdvanceTimeout.current = setTimeout(() => {
        clearInterval(countdownInterval)
        setAutoAdvanceCountdown(0)
        handleAdvance()
      }, 12000) // 12 more seconds after the 3s delay
    }, 3000)
  }

  // Manual advance handler
  function handleAdvance() {
    if (!testState) return
    
    setShowResult(false)
    setCanAdvance(false)
    setAutoAdvanceCountdown(0)
    
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current)
      autoAdvanceTimeout.current = null
    }
    
    if (testState.currentQuestionIndex === testState.questions.length - 1) {
      setAssessmentComplete(true)
      clearSavedState().catch(console.error) // Clear saved state when completing
    } else {
      const newState = {
        ...testState,
        currentQuestionIndex: testState.currentQuestionIndex + 1
      }
      setTestState(newState)
      saveTestState(newState).catch(console.error)
    }
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
      if (streakTimeout.current) clearTimeout(streakTimeout.current)
    }
  }, [])

  // Create keyboard shortcuts for the assessment
  const keyboardShortcuts = useMemo((): KeyboardShortcutGroup[] => {
    if (!currentQuestion || showResult || assessmentComplete) return []

    const shortcuts = []
    
    // Number key shortcuts (1-4 for multiple choice)
    for (let i = 0; i < Math.min(currentQuestion.options.length, 9); i++) {
      shortcuts.push({
        key: String(i + 1),
        description: `Select option ${i + 1}: ${currentQuestion.options[i].text}`,
        action: () => handleAnswer(currentQuestion.options[i].id),
        condition: () => !showResult && !assessmentComplete
      })
    }

    // Letter shortcuts (A, B, C, D)
    for (let i = 0; i < Math.min(currentQuestion.options.length, 4); i++) {
      const letter = String.fromCharCode(65 + i) // A, B, C, D
      shortcuts.push({
        key: letter.toLowerCase(),
        description: `Select option ${letter}: ${currentQuestion.options[i].text}`,
        action: () => handleAnswer(currentQuestion.options[i].id),
        condition: () => !showResult && !assessmentComplete
      })
    }

    // Navigation shortcuts
    if (showResult && canAdvance) {
      shortcuts.push({
        key: 'enter',
        description: 'Continue to next question',
        action: () => handleAdvance(),
        condition: () => showResult && canAdvance
      })
      shortcuts.push({
        key: ' ',
        description: 'Continue to next question',
        action: () => handleAdvance(),
        condition: () => showResult && canAdvance
      })
    }

    return [{
      name: 'civics-test-assessment',
      shortcuts,
      enabled: true
    }]
  }, [currentQuestion, showResult, assessmentComplete, canAdvance])

  // Use the keyboard shortcuts utility
  useKeyboardShortcuts(keyboardShortcuts, {
    enableLogging: false,
    autoDisableOnInput: true
  })

  // Calculate results
  const calculateResults = () => {
    if (!testState) return { score: 0, correct: 0, total: 0, level: 'beginner' as const, perCategory: {} }
    
    let correct = 0
    let perCategory: Record<string, { correct: number; total: number }> = {}
    
    testState.questions.forEach(q => {
      const userAnswer = testState.answers[q.id]
      
      if (!perCategory[q.category]) perCategory[q.category] = { correct: 0, total: 0 }
      perCategory[q.category].total++
      
      // Robust correct answer checking (same logic as handleAnswer)
      let isCorrectAnswer = false
      
      // Method 1: Find option by matching text exactly
      const correctOptionByText = q.options.find(
        (opt) => opt.text.trim() === q.correctAnswer.trim()
      )
      
      if (correctOptionByText) {
        isCorrectAnswer = userAnswer === correctOptionByText.id
      } else {
        // Method 2: Find option by matching text (case-insensitive, normalized)
        const correctOptionByNormalizedText = q.options.find(
          (opt) => opt.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        )
        
        if (correctOptionByNormalizedText) {
          isCorrectAnswer = userAnswer === correctOptionByNormalizedText.id
        } else {
          // Method 3: Check if correctAnswer is already an option ID
          isCorrectAnswer = userAnswer === q.correctAnswer
        }
      }
      
      if (isCorrectAnswer) {
        correct++
        perCategory[q.category].correct++
      }
    })
    
    const score = Math.round((correct / testState.questions.length) * 100)
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (score >= 80) level = 'advanced'
    else if (score >= 60) level = 'intermediate'
    
    return { score, correct, total: testState.questions.length, level, perCategory }
  }

  // Personalized message
  const getPersonalizedMessage = (level: string, score: number) => {
    if (level === 'advanced') {
      return "You understand how power actually works. You're in the minority of Americans who grasp the real mechanics of democracy."
    }
    if (level === 'intermediate') {
      return "You have a solid foundation, but there are gaps in your understanding of how the system really operates."
    }
    return `You scored ${score}%, which puts you ahead of many Americans, but there's more to learn about how democracy actually functions.`
  }

  // Show test type selection
  if (showTestTypeSelection) {
    return (
      <TestTypeSelection 
        onSelect={handleTestTypeSelection}
        onBack={onBack}
      />
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400 font-light">
          {hasRestoredState ? 'Restoring your test...' : 'Preparing your civic knowledge assessment...'}
        </p>
      </div>
    )
  }

  // Error state
  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-4xl">😕</div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white">
          {error || "Couldn't load assessment questions"}
        </h3>
        <div className="space-y-4 pt-4">
          <Button
            onClick={() => {
              clearSavedState()
              setShowTestTypeSelection(true)
              setHasRestoredState(false)
            }}
            variant="outline"
            className="mr-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button
            onClick={onBack}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (assessmentComplete && testState) {
    const results = calculateResults()
    
    // Handle XP awarding and data attribution
    const handleContinue = async () => {
      clearSavedState()
      
      // Prepare question responses for enhanced gamification
      const questionResponses = testState.questions.map(q => {
        const userAnswer = testState.answers[q.id]
        
        // Robust correct answer checking (same logic as handleAnswer)
        let isCorrect = false
        const correctOptionByText = q.options.find(
          (opt) => opt.text.trim() === q.correctAnswer.trim()
        )
        
        if (correctOptionByText) {
          isCorrect = userAnswer === correctOptionByText.id
        } else {
          const correctOptionByNormalizedText = q.options.find(
            (opt) => opt.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
          )
          if (correctOptionByNormalizedText) {
            isCorrect = userAnswer === correctOptionByNormalizedText.id
          } else {
            isCorrect = userAnswer === q.correctAnswer
          }
        }
        
        return {
          questionId: q.id,
          category: q.category,
          isCorrect,
          timeSpent: testState.responseTimes[q.id] || 30
        }
      })

      // Calculate total time spent
      const totalTimeSeconds = Object.values(testState.responseTimes).reduce((sum, time) => sum + time, 0)

      if (userId) {
        // User is logged in - award XP directly through enhanced gamification
        try {
          const quizData = {
            topicId: `civics_test_${testState.testType}`,
            totalQuestions: results.total,
            correctAnswers: results.correct,
            timeSpentSeconds: totalTimeSeconds,
            questionResponses
          }

          console.log('🎮 Updating enhanced gamification for civics test:', quizData)
          const gamificationResult = await updateEnhancedProgress(userId, quizData)
          
          console.log('✅ Enhanced gamification updated:', {
            achievements: gamificationResult.newAchievements?.length || 0,
            levelUp: gamificationResult.levelUp || false,
            skillUpdates: gamificationResult.skillUpdates?.length || 0
          })

          // Also track in civics test analytics
          await fetch('/api/civics-test/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'completed',
              session_id: testState.sessionId,
              user_id: userId,
              metadata: { 
                test_type: testState.testType,
                final_score: results.score,
                level: results.level,
                streak: testState.maxStreak
              }
            })
          })

        } catch (error) {
          console.error('Error updating gamification for authenticated user:', error)
        }
      } else {
        // User is not logged in - store for pending attribution
        try {
          pendingUserAttribution.storePendingAssessment({
            type: 'civics_test',
            sessionId: testState.sessionId,
            completedAt: Date.now(),
            results: {
              score: results.score,
              correct: results.correct,
              total: results.total,
              level: results.level,
              perCategory: results.perCategory
            },
            answers: testState.answers,
            responseTimes: testState.responseTimes,
            streak: testState.maxStreak,
            testType: testState.testType,
            metadata: {
              timeSpentSeconds: totalTimeSeconds,
              questionResponses
            }
          })

          console.log('📝 Stored civics test assessment for pending attribution')
        } catch (error) {
          console.error('Error storing pending assessment:', error)
        }
      }

      // Call the original onComplete handler
      onComplete({
        assessmentResults: results,
        answers: testState.answers,
        responseTimes: testState.responseTimes,
        completedAt: Date.now(),
        streak: testState.maxStreak,
        testType: testState.testType,
        sessionId: testState.sessionId
      })
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="text-6xl">
            {results.score >= 80 ? '🎯' : results.score >= 60 ? '👍' : '🌱'}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-slate-900 dark:text-white">
              Assessment Complete
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              You got {results.correct} out of {results.total} questions right.
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              {getPersonalizedMessage(results.level, results.score)}
            </p>
            {!userId && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-4">
                💡 Sign up to save your progress and earn XP!
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center">
          <div className="space-y-8">
            <div className="text-5xl font-light text-slate-900 dark:text-white">
              {results.score}%
            </div>
            <div className="space-y-4">
              <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm px-4 py-1 font-light">
                {results.level.charAt(0).toUpperCase() + results.level.slice(1)} Level
              </Badge>
              {testState.maxStreak > 0 && (
                <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">Best Streak: {testState.maxStreak}</span>
                </div>
              )}
              {!userId && (
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <span className="text-sm font-medium">
                    +{results.correct * 10 + (testState.testType === 'full' ? 500 : 100)} XP waiting!
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Knowledge Areas</h4>
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(results.perCategory).map(([cat, stats]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat.replace(/_/g, ' ')}: {stats.correct}/{stats.total}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-4">
          <Button 
            onClick={handleContinue}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light group"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    )
  }

  // Friendly feedback - deterministic based on question index
  const getFeedback = (isCorrect: boolean) => {
    const questionIndex = testState?.currentQuestionIndex || 0
    
    if (isCorrect) {
      const messages = [
        "That's right!",
        "Correct!",
        "You got it!",
        "Exactly!",
        "Well done!"
      ]
      return messages[questionIndex % messages.length]
    } else {
      const messages = [
        "Not quite—here's why:",
        "Close, but here's the reality:",
        "Actually, here's how it works:",
        "That's a common misconception. Here's the truth:",
        "Here's what's really happening:"
      ]
      return messages[questionIndex % messages.length]
    }
  }

  // Get dynamic headings based on test type and question count
  const getAssessmentTitle = () => {
    if (testState?.testType === 'full') {
      return "The Civic Knowledge Test That Actually Matters"
    } else {
      return "Quick Civic Knowledge Check"
    }
  }

  const getAssessmentDescription = () => {
    if (testState?.testType === 'full') {
      return "We're about to test whether you understand how power actually works in America today. No memorized facts—just real-world knowledge."
    } else {
      return "A quick assessment of your civic knowledge. We'll focus on the most important questions about how democracy functions."
    }
  }

  // Main question UI
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      {/* Animated Streak Display */}
      <StreakDisplay streak={testState?.streak || 0} isVisible={showStreakAnimation} />

      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white text-center">
          {getAssessmentTitle()}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light text-center">
          {getAssessmentDescription()}
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline" className="text-sm text-center">
            Question {(testState?.currentQuestionIndex || 0) + 1} of {testState?.questions.length || 0}
          </Badge>
          {hasRestoredState && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              Resumed
            </Badge>
          )}
        </div>
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
                      <Progress value={progress} className="h-1" />
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>{Math.round(progress)}% complete</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{Math.floor((Date.now() - (testState?.startTime || Date.now())) / 60000)}m</span>
          </div>
        </div>
      </div>
      
      {/* Question */}
      <div className="space-y-8">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="py-6">
            <h3 className="text-xl font-light text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Social Proof Bubble for Assessment */}
          {!showResult && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <SocialProofBubble
                questionId={currentQuestion.id}
                assessmentType="civics_test"
                showDelay={4000}
                position="inline"
                variant="minimal"
                className=""
              />
            </div>
          )}
          
          {!showResult ? (
            <div className="space-y-4">
              {/* Keyboard shortcuts hint */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">1-{Math.min(currentQuestion.options.length, 9)}</kbd>
                  <span className="text-xs text-blue-700 dark:text-blue-300">or</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">A-{String.fromCharCode(64 + Math.min(currentQuestion.options.length, 4))}</kbd>
                  <span className="text-xs text-blue-700 dark:text-blue-300">to select</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className="w-full px-6 py-4 text-left rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-light flex items-center space-x-4 group"
                  >
                    {/* Keyboard shortcut indicators */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-sm font-bold group-hover:border-blue-500 group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors">
                        {index + 1}
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-sm font-bold group-hover:border-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        {String.fromCharCode(65 + index)}
                      </div>
                    </div>
                    <span className="flex-1">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  // Robust correct option finding (same logic as handleAnswer)
                  let correctOptionId: string | null = null
                  
                  // Method 1: Find option by matching text exactly
                  const correctOptionByText = currentQuestion.options.find(
                    (opt) => opt.text.trim() === currentQuestion.correctAnswer.trim()
                  )
                  
                  if (correctOptionByText) {
                    correctOptionId = correctOptionByText.id
                  } else {
                    // Method 2: Find option by matching text (case-insensitive, normalized)
                    const correctOptionByNormalizedText = currentQuestion.options.find(
                      (opt) => opt.text.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                    )
                    
                    if (correctOptionByNormalizedText) {
                      correctOptionId = correctOptionByNormalizedText.id
                    } else {
                      // Method 3: Check if correctAnswer is already an option ID
                      correctOptionId = currentQuestion.correctAnswer
                    }
                  }
                  
                  const isCorrect = option.id === correctOptionId
                  const isSelected = testState?.answers[currentQuestion.id] === option.id
                  
                  return (
                    <div 
                      key={option.id} 
                      className={`px-6 py-4 rounded-2xl border flex items-center space-x-3 ${
                        isCorrect 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                          : isSelected && !isCorrect
                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : isSelected ? (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="font-light">{option.text}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="text-center text-lg font-medium mt-2">
                {getFeedback(
                  (() => {
                    const userAnswer = testState?.answers[currentQuestion.id]
                    // Robust correct answer checking (same logic as handleAnswer)
                    const correctOptionByText = currentQuestion.options.find(
                      (opt) => opt.text.trim() === currentQuestion.correctAnswer.trim()
                    )
                    if (correctOptionByText) {
                      return userAnswer === correctOptionByText.id
                    }
                    const correctOptionByNormalizedText = currentQuestion.options.find(
                      (opt) => opt.text.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                    )
                    if (correctOptionByNormalizedText) {
                      return userAnswer === correctOptionByNormalizedText.id
                    }
                    return userAnswer === currentQuestion.correctAnswer
                  })()
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <WordReveal
                  text={currentQuestion.friendlyExplanation || currentQuestion.explanation}
                  speed={120}
                  className="text-slate-600 dark:text-slate-400 font-light leading-relaxed"
                />
              </div>
              
              {canAdvance && (
                <div className="flex flex-col items-center pt-4 space-y-3">
                  <Button
                    onClick={handleAdvance}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light"
                  >
                    {(testState?.currentQuestionIndex || 0) === (testState?.questions.length || 1) - 1 ? 'See Results' : 'Next Question'}
                  </Button>
                  {autoAdvanceCountdown > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-3 h-3 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                        <div 
                          className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse"
                          style={{
                            animationDuration: '1s'
                          }}
                        />
                      </div>
                      <span>Auto-advancing in {autoAdvanceCountdown}s</span>
                    </div>
                  )}
                </div>
              )}
              
              {!canAdvance && (
                <div className="flex justify-center pt-4">
                  <span className="text-xs text-slate-400">Reading explanation...</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Back option */}
      <div className="flex justify-center pt-8 space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-light"
        >
          ← Back to overview
        </Button>
        {hasRestoredState && (
          <Button
            variant="outline"
            onClick={() => {
              clearSavedState()
              setShowTestTypeSelection(true)
              setHasRestoredState(false)
            }}
            className="text-slate-600 dark:text-slate-400"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>
    </div>
  )
} 