'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Check, X, ArrowRight, Loader2, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@civicsense/shared/lib/supabase'
import { useStatsig } from '@/components/providers/statsig-provider'
import { pendingUserAttribution } from '@civicsense/shared/lib/pending-user-attribution'
import { updateEnhancedProgress } from '@civicsense/shared/lib/enhanced-gamification'
import { SocialProofBubble } from '@/components/social-proof-bubble'
import { createOnboardingAssessmentProgress, type BaseQuizState } from '@civicsense/shared/lib/progress-storage'
import { useKeyboardShortcuts, type KeyboardShortcutGroup } from '@civicsense/shared/lib/keyboard-shortcuts'

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

interface AssessmentStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onSkip: (reason: string) => void
  onboardingState: any
  userId?: string
}

// Enhanced WordReveal with natural typing animation
function WordReveal({ text, speed = 80, className, onComplete }: { text: string, speed?: number, className?: string, onComplete?: () => void }) {
  const words = text.split(' ')
  const [visibleWords, setVisibleWords] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    setVisibleWords([])
    setIsComplete(false)
    indexRef.current = 0
    
    if (!text) return

    function revealNextWord() {
      if (indexRef.current < words.length) {
        setVisibleWords(prev => [...prev, words[indexRef.current]])
        indexRef.current += 1
        
        // Schedule next word with consistent timing
        timeoutRef.current = setTimeout(revealNextWord, speed)
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Start revealing words after a short delay
    timeoutRef.current = setTimeout(revealNextWord, 200)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, speed, onComplete])

  return (
    <span className={className}>
      {visibleWords.join(' ')}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ 
            duration: 0.6,
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

export function AssessmentStep({ onComplete, onSkip, onboardingState, userId }: AssessmentStepProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
  const [showResult, setShowResult] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [categoryPerformance, setCategoryPerformance] = useState<Record<string, { correct: number; total: number }>>({})
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [adaptiveMode, setAdaptiveMode] = useState(false)
  const [answeredIds, setAnsweredIds] = useState<string[]>([])
  const [weakCategories, setWeakCategories] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const responseTimes = useRef<{ [questionId: string]: number }>({})
  const { logEvent } = useStatsig();
  const autoAdvanceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [canAdvance, setCanAdvance] = useState(false)
  const [assessmentMode, setAssessmentMode] = useState<'quick' | 'full'>('quick')
  const [xpAwarded, setXpAwarded] = useState(0)
  const [xpAlreadyAwarded, setXpAlreadyAwarded] = useState(false)
  const [hasCompletedQuick, setHasCompletedQuick] = useState(false)
  const [hasCompletedFull, setHasCompletedFull] = useState(false)
  const [hasRestoredState, setHasRestoredState] = useState(false)

  // Initialize progress manager
  const progressManager = createOnboardingAssessmentProgress(
    userId || onboardingState?.userId || onboardingState?.user_id || onboardingState?.user?.id,
    undefined // No guest token for onboarding
  )

  // Generate session ID for state persistence
  const sessionId = useRef<string>(`onboarding-assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Convert assessment state to BaseQuizState
  const convertToBaseQuizState = (): BaseQuizState => ({
    sessionId: sessionId.current,
    quizType: 'onboarding_assessment',
    questions,
    currentQuestionIndex,
    answers,
    streak,
    maxStreak,
    startTime,
    responseTimes: responseTimes.current,
    savedAt: Date.now(),
    assessmentMode,
    categoryPerformance
  })

  // Save assessment state
  const saveAssessmentState = () => {
    if (questions.length > 0) {
      const baseState = convertToBaseQuizState()
      progressManager.save(baseState)
    }
  }

  // Load assessment state
  const loadAssessmentState = (): boolean => {
    const baseState = progressManager.load()
    if (baseState) {
      setQuestions(baseState.questions)
      setCurrentQuestionIndex(baseState.currentQuestionIndex)
      setAnswers(baseState.answers)
      setStreak(baseState.streak)
      setMaxStreak(baseState.maxStreak)
      setStartTime(baseState.startTime)
      responseTimes.current = baseState.responseTimes
      setAssessmentMode((baseState.assessmentMode || 'quick') as 'quick' | 'full')
      setCategoryPerformance(baseState.categoryPerformance || {})
      sessionId.current = baseState.sessionId
      return true
    }
    return false
  }

  // Clear assessment state
  const clearAssessmentState = () => {
    progressManager.clear()
  }

  // Get dynamic headings based on assessment mode and question count
  const getAssessmentTitle = () => {
    if (questions.length >= 20) {
      return "Comprehensive Civic Knowledge Review"
    } else if (assessmentMode === 'full') {
      return "Full Civic Assessment"
    } else {
      return "Quick Knowledge Check"
    }
  }

  const getAssessmentDescription = () => {
    if (questions.length >= 20) {
      return "This comprehensive review covers all areas of civic knowledge. Take your time and think through each question carefully."
    } else if (assessmentMode === 'full') {
      return "A thorough assessment of your civic knowledge across multiple categories. This helps us understand your strengths and areas for growth."
    } else {
      return "Let's see what you already know. No pressure — this helps us personalize your experience."
    }
  }

  // Normalize API question
  function normalizeQuestion(q: any): AssessmentQuestion {
    // Options may be array of strings or array of objects
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

  // Initialize or restore assessment state
  useEffect(() => {
    const initializeAssessment = async () => {
      console.log('🔄 Initializing onboarding assessment...', { 
        hasRestoredState, 
        assessmentMode,
        userId: userId || onboardingState?.userId || 'none'
      })
      
      // First, try to restore saved state (only once)
      if (!hasRestoredState) {
        const restored = loadAssessmentState()
        if (restored) {
          console.log('✅ Restored onboarding assessment state')
          setHasRestoredState(true)
          setLoading(false)
          
          // Reset UI state for restored session
          setShowResult(false)
          setCanAdvance(false)
          setAssessmentComplete(false)
          
          return
        } else {
          console.log('❌ No valid saved assessment state found')
          setHasRestoredState(true) // Mark as checked to prevent re-checking
        }
      }

      // If no saved state, fetch new questions
      if (questions.length === 0) {
        console.log('🔍 Fetching new questions for:', assessmentMode)
        setLoading(true)
        setError(null)
        try {
          const selectedCategories = onboardingState?.categories?.categories || []
          const categoryIds = selectedCategories.map((cat: any) => cat.id).filter(Boolean)
          const params = new URLSearchParams()
          params.set('balanced', 'true')
          const count = assessmentMode === 'quick' ? 8 : 200 // 8 for quick, 200 for full (get all available)
          params.set('count', String(count))
          if (categoryIds.length > 0) {
            params.set('categories', JSON.stringify(categoryIds))
          }
          const res = await fetch(`/api/onboarding/assessment-questions?${params.toString()}`)
          const result = await res.json()
          if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
            setQuestions(result.questions.map(normalizeQuestion))
          } else {
            throw new Error('No questions returned')
          }
        } catch (err) {
          setError('Failed to load assessment questions')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    initializeAssessment()
  }, [onboardingState, assessmentMode, hasRestoredState, questions.length])

  // Track response time
  useEffect(() => {
    setStartTime(Date.now())
  }, [currentQuestionIndex])

  const currentQuestion = questions[currentQuestionIndex]
  // Progress should be based on answered questions, not current position
  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  // Handle answer selection
  const handleAnswer = async (optionId: string) => {
    if (!currentQuestion) return
    
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
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
    setAnsweredIds(prev => [...prev, currentQuestion.id])
    setStreak(prev => (isCorrect ? prev + 1 : 0))
    setMaxStreak(prev => (isCorrect && prev + 1 > maxStreak ? prev + 1 : maxStreak))
    responseTimes.current[currentQuestion.id] = Math.floor((Date.now() - startTime) / 1000)
    setCategoryPerformance(prev => {
      const cat = currentQuestion.category
      const prevStats = prev[cat] || { correct: 0, total: 0 }
      return {
        ...prev,
        [cat]: {
          correct: prevStats.correct + (isCorrect ? 1 : 0),
          total: prevStats.total + 1
        }
      }
    })
    
    // Save state after answering
    setTimeout(() => saveAssessmentState(), 100)
    setShowResult(true)
    setCanAdvance(false)
    // Start 15s timer for auto-advance
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
    autoAdvanceTimeout.current = setTimeout(() => {
      handleAdvance()
    }, 15000)
    // Allow manual advance after 3s (give time to read explanation)
    setTimeout(() => setCanAdvance(true), 3000)
  }

  // Manual advance handler
  function handleAdvance() {
    setShowResult(false)
    setCanAdvance(false)
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current)
      autoAdvanceTimeout.current = null
    }
    if (currentQuestionIndex === questions.length - 1 && !assessmentComplete) {
      // Identify weak categories
      const weak = Object.entries(categoryPerformance)
        .filter(([_, stats]) => stats.correct / stats.total < 0.6)
        .map(([cat]) => cat)
      setWeakCategories(weak)
      if (questions.length < 12 && weak.length > 0) {
        setAdaptiveLoading(true)
        setAdaptiveMode(true)
        const correctCount = Object.values(categoryPerformance).reduce((sum, stats) => sum + stats.correct, 0)
        const totalCount = Object.values(categoryPerformance).reduce((sum, stats) => sum + stats.total, 0)
        const performance = totalCount > 0 ? correctCount / totalCount : 0.5
        let targetDifficulty = 2
        if (performance >= 0.8) targetDifficulty = 3
        else if (performance <= 0.4) targetDifficulty = 1
        fetch('/api/onboarding/assessment-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            performance,
            answeredQuestions: answeredIds,
            targetDifficulty,
            categories: weak
          })
        })
          .then(resp => resp.json())
          .then(data => {
            if (data.question) {
              setQuestions(prev => [...prev, normalizeQuestion(data.question)])
              setCurrentQuestionIndex(prev => prev + 1)
            }
            setAdaptiveLoading(false)
          })
        setAssessmentComplete(true)
      } else {
        setAssessmentComplete(true)
      }
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setAssessmentComplete(true)
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
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
      name: 'onboarding-assessment',
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
    let correct = 0
    let perCategory: Record<string, { correct: number; total: number }> = {}
    questions.forEach(q => {
      const userAnswer = answers[q.id]
      
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
    const score = Math.round((correct / questions.length) * 100)
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (score >= 80) level = 'advanced'
    else if (score >= 60) level = 'intermediate'
    return { score, correct, total: questions.length, level, perCategory }
  }

  // Personalized message
  const getPersonalizedMessage = (level: string) => {
    if (level === 'advanced') return "You really know your stuff! Ready for complex analysis."
    if (level === 'intermediate') return "You have a solid foundation and are ready to build on it."
    return "Perfect starting point! Everyone begins somewhere."
  }

  // On mount, check if user has already completed quick/full assessment
  useEffect(() => {
    async function checkAssessmentCompletion() {
      const resolvedUserId = userId || onboardingState?.userId || onboardingState?.user_id || onboardingState?.user?.id;
      if (!resolvedUserId) return;
      const { data: quick } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', resolvedUserId)
        .eq('assessment_type', 'onboarding')
        .eq('mode', 'quick')
        .maybeSingle()
      const { data: full } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', resolvedUserId)
        .eq('assessment_type', 'onboarding')
        .eq('mode', 'full')
        .maybeSingle()
      setHasCompletedQuick(!!quick)
      setHasCompletedFull(!!full)
    }
    checkAssessmentCompletion()
  }, [userId, onboardingState])

  // Helper to persist assessment analytics and personalize user
  async function handleAssessmentAnalytics(results: any) {
    try {
      const resolvedUserId = userId || onboardingState?.userId || onboardingState?.user_id || onboardingState?.user?.id;
      if (!resolvedUserId) return;
      const sessionId = `${resolvedUserId}-onboarding-${Date.now()}`;
      // 1. Record assessment_analytics
      await supabase.from('assessment_analytics').insert({
        user_id: resolvedUserId,
        session_id: sessionId,
        event_type: 'completed',
        final_score: results.score,
        timestamp: new Date().toISOString()
      });
      // 2. Look up scoring
      const { data: scoring } = await supabase
        .from('assessment_scoring')
        .select('*')
        .lte('score_range_min', results.score)
        .gte('score_range_max', results.score)
        .single()
      const mappedLevel = scoring?.skill_level || results.level
      const mappedDescription = scoring?.description || getPersonalizedMessage(results.level)
      const recommendations = scoring?.recommended_content || []
      // 3. Check if already completed for this mode
      const mode = assessmentMode
      const { data: existing } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', resolvedUserId)
        .eq('assessment_type', 'onboarding')
        .eq('mode', mode)
        .maybeSingle()
      let xp = 0
      if (!existing) {
        xp = mode === 'full' ? 500 : 100
        setXpAwarded(xp)
        setXpAlreadyAwarded(false)
      } else {
        setXpAwarded(0)
        setXpAlreadyAwarded(true)
      }
      // 4. Store user_assessments (always allow retake, but only award XP on first try)
      await supabase.from('user_assessments').insert({
        user_id: resolvedUserId,
        assessment_type: 'onboarding',
        score: results.score,
        level: mappedLevel,
        category_breakdown: results.perCategory,
        answers: answers,
        recommendations,
        mode,
        completed_at: new Date().toISOString()
      });
      // 5. Fire Statsig events
      logEvent('onboarding_assessment_completed', results.score, {
        level: mappedLevel,
        perCategory: results.perCategory,
        streak: maxStreak,
        total: results.total,
        mode
      });
      logEvent('onboarding_step_completed', 'assessment', {
        score: results.score,
        level: mappedLevel,
        mode
      });
    } catch (err) {
      console.error('Assessment analytics/personalization error:', err);
    }
  }

  // Loading state
  if (loading || adaptiveLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400 font-light">
          {adaptiveLoading ? 'Finding your next question...' : 'Preparing your knowledge assessment...'}
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
            onClick={() => onSkip('assessment_error')}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light"
          >
            Skip Assessment
          </Button>
        </div>
      </div>
    )
  }

  if (assessmentComplete) {
    const results = calculateResults()
    return (
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="text-6xl">
            {results.score >= 80 ? '🎯' : results.score >= 60 ? '👍' : '🌱'}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-slate-900 dark:text-white">
              Assessment Complete!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              You got {results.correct} out of {results.total} questions right.
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              {getPersonalizedMessage(results.level)}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center">
          <div className="space-y-8">
            <div className="text-5xl font-light text-slate-900 dark:text-white">
              {results.score}%
            </div>
            <div>
              <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm px-4 py-1 font-light">
                {results.level.charAt(0).toUpperCase() + results.level.slice(1)}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Category Breakdown</h4>
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
            onClick={async () => {
              await handleAssessmentAnalytics(results);
              
              // Handle XP awarding and data attribution
              const resolvedUserId = userId || onboardingState?.userId || onboardingState?.user_id || onboardingState?.user?.id;
              
              // Prepare question responses for enhanced gamification
              const questionResponses = questions.map(q => {
                const userAnswer = answers[q.id]
                
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
                  timeSpent: responseTimes.current[q.id] || 30
                }
              })

              // Calculate total time spent
              const totalTimeSeconds = Object.values(responseTimes.current).reduce((sum, time) => sum + time, 0)

              if (resolvedUserId) {
                // User is logged in - award XP directly through enhanced gamification
                try {
                  const quizData = {
                    topicId: `onboarding_assessment_${assessmentMode}`,
                    totalQuestions: results.total,
                    correctAnswers: results.correct,
                    timeSpentSeconds: totalTimeSeconds,
                    questionResponses
                  }

                  console.log('🎮 Updating enhanced gamification for onboarding assessment:', quizData)
                  const gamificationResult = await updateEnhancedProgress(resolvedUserId, quizData)
                  
                  console.log('✅ Enhanced gamification updated:', {
                    achievements: gamificationResult.newAchievements?.length || 0,
                    levelUp: gamificationResult.levelUp || false,
                    skillUpdates: gamificationResult.skillUpdates?.length || 0
                  })

                } catch (error) {
                  console.error('Error updating gamification for authenticated user:', error)
                }
              } else {
                // User is not logged in - store for pending attribution
                try {
                  const sessionId = `onboarding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  
                  pendingUserAttribution.storePendingAssessment({
                    type: 'onboarding_assessment',
                    sessionId,
                    completedAt: Date.now(),
                    results: {
                      score: results.score,
                      correct: results.correct,
                      total: results.total,
                      level: results.level,
                      perCategory: results.perCategory
                    },
                    answers,
                    responseTimes: responseTimes.current,
                    streak: maxStreak,
                    testType: assessmentMode,
                    metadata: {
                      timeSpentSeconds: totalTimeSeconds,
                      questionResponses
                    }
                  })

                  console.log('📝 Stored onboarding assessment for pending attribution')
                } catch (error) {
                  console.error('Error storing pending assessment:', error)
                }
              }
              
              // Clear saved state on completion
              clearAssessmentState()
              
              onComplete({
                assessmentResults: results,
                answers,
                responseTimes: responseTimes.current,
                completedAt: Date.now(),
                streak: maxStreak
              })
            }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light group"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        {xpAlreadyAwarded && (
          <div className="text-center text-sm text-yellow-600 mt-2">
            XP is only awarded for your first completion of this assessment mode.
          </div>
        )}
      </div>
    )
  }

  // Friendly feedback - deterministic based on question index
  const getFeedback = (isCorrect: boolean) => {
    const questionIndex = currentQuestionIndex
    
    if (isCorrect) {
      const messages = [
        "Nice! That's correct.",
        "Great job!",
        "You got it!",
        "Well done!",
        "That's right!"
      ]
      return messages[questionIndex % messages.length]
    } else {
      const messages = [
        "Not quite, but that's okay!",
        "Almost! Keep going.",
        "Good try!",
        "Don't worry, you'll get the next one.",
        "Let's see the explanation."
      ]
      return messages[questionIndex % messages.length]
    }
  }

  // Main question UI
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white text-center">
          {getAssessmentTitle()}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light text-center">
          {getAssessmentDescription()}
        </p>
        {questions.length >= 20 && (
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {questions.length} Questions • Comprehensive Review
            </Badge>
          </div>
        )}
      </div>
      {/* Progress & Streak */}
      <div className="flex items-center justify-between mb-2">
        <Progress value={progress} className="h-1 w-3/4" />
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-orange-500">Streak: {streak}</span>
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

          {/* Social Proof Bubble for Onboarding Assessment */}
          {!showResult && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <SocialProofBubble
                questionId={currentQuestion.id}
                assessmentType="onboarding"
                showDelay={3500}
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
                  const isSelected = answers[currentQuestion.id] === option.id
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
                    const userAnswer = answers[currentQuestion.id]
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
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleAdvance}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light"
                  >
                    Next
                  </Button>
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
      {/* Skip option */}
      <div className="flex justify-center pt-8">
        <Button
          variant="ghost"
          onClick={() => onSkip('assessment_skipped')}
          className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-light"
        >
          Skip assessment
        </Button>
      </div>
      {/* Assessment mode toggle */}
      <div className="flex justify-center mb-6">
        <Button
          variant={assessmentMode === 'quick' ? 'default' : 'outline'}
          onClick={() => setAssessmentMode('quick')}
          className="mr-2"
        >
          Quick (8-10 questions)
          <span className="ml-2 text-xs text-green-600">+100 XP{hasCompletedQuick && ' (first time only)'}</span>
        </Button>
        <Button
          variant={assessmentMode === 'full' ? 'default' : 'outline'}
          onClick={() => setAssessmentMode('full')}
        >
          Full Review (20+ questions)
          <span className="ml-2 text-xs text-green-600">+500 XP{hasCompletedFull && ' (first time only)'}</span>
        </Button>
      </div>
    </div>
  )
}