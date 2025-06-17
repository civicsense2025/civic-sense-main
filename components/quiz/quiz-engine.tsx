"use client"

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { QuizResults } from "./quiz-results"
import { MultipleChoiceQuestion } from "./question-types/multiple-choice"
import { TrueFalseQuestion } from "./question-types/true-false"
import { ShortAnswerQuestion, checkAnswerIntelligently, checkAnswerDetailed } from "./question-types/short-answer"
import { FillInBlankQuestion } from "./question-types/fill-in-blank"
import { MatchingQuestion } from "./question-types/matching"
import { OrderingQuestion } from "./question-types/ordering"
import { CrosswordQuestion } from "./question-types/crossword"
import { QuestionFeedbackDisplay } from "./question-feedback-display"
import { QuestionTimer, useQuestionTimer } from "./question-timer"
import { BoostCommandBar } from "./boost-command-bar"
import { QuizDateNavigation, useQuizNavigation } from "./quiz_date_navigation"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb, SkipForward, ArrowRight, Flame, Snowflake, RotateCcw, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from "@/hooks/useGamification"
import { usePremium } from "@/hooks/usePremium"
import type { BoostEffects } from "@/lib/game-boosts"
import { BoostManager } from "@/lib/game-boosts"
import { enhancedProgressOperations, updateEnhancedProgress } from "@/lib/enhanced-gamification"
import { useAnalytics, mapCategoryToAnalytics } from "@/utils/analytics"
import { supabase } from "@/lib/supabase"

interface QuizTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

interface QuizEngineProps {
  questions: QuizQuestion[]
  topicId: string
  currentTopic: QuizTopic
  availableTopics?: QuizTopic[]
  onComplete: () => void
  onTopicChange?: (topicId: string) => void
}

interface EnhancedUserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
  hintUsed?: boolean
  boostUsed?: string | null
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  attemptNumber?: number
}

// Enhanced Fisher-Yates shuffle with crypto randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  
  const getRandomValue = () => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomArray = new Uint32Array(1)
      crypto.getRandomValues(randomArray)
      return randomArray[0] / (0xFFFFFFFF + 1)
    }
    return Math.random()
  }
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getRandomValue() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

// Enhanced validation and deduplication
function validateAndDeduplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>()
  const uniqueQuestions: QuizQuestion[] = []
  
  for (const question of questions) {
    const questionContent = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    const questionKey = [
      question.topic_id,
      question.question_number,
      question.question_type,
      questionContent.slice(0, 100),
      question.correct_answer,
      question.option_a || '',
      question.option_b || ''
    ].join('|')
    
    if (!seen.has(questionKey)) {
      seen.add(questionKey)
      uniqueQuestions.push(question)
    } else {
      console.warn(`Duplicate question detected and removed:`, {
        topic_id: question.topic_id,
        question_number: question.question_number,
        question_preview: question.question.slice(0, 50) + '...'
      })
    }
  }
  
  console.log(`Question validation: ${questions.length} input → ${uniqueQuestions.length} unique questions`)
  
  const contentSeen = new Set<string>()
  const finalQuestions = uniqueQuestions.filter(question => {
    const contentKey = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    if (contentSeen.has(contentKey)) {
      console.warn(`Duplicate question content detected:`, question.question.slice(0, 50))
      return false
    }
    contentSeen.add(contentKey)
    return true
  })
  
  console.log(`Final unique questions after content deduplication: ${finalQuestions.length}`)
  return finalQuestions
}

// Memoized components
const MemoizedQuestionDisplay = memo(({ 
  question, 
  showHint 
}: { 
  question: QuizQuestion
  showHint: boolean 
}) => (
  <>
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlossaryLinkText text={question.question} />
    </h1>
    
    {showHint && (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="rounded-lg p-6 border border-slate-100 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
            💡 <GlossaryLinkText text={question.hint} />
          </p>
        </div>
      </div>
    )}
  </>
))

MemoizedQuestionDisplay.displayName = 'MemoizedQuestionDisplay'

export function QuizEngine({ 
  questions, 
  topicId, 
  currentTopic,
  availableTopics = [],
  onComplete,
  onTopicChange 
}: QuizEngineProps) {
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  
  // Analytics integration
  const { trackQuiz, trackGameification, trackEngagement } = useAnalytics()
  
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Enhanced gamification integration
  const { updateProgress, currentStreak, currentLevel } = useGamification()
  
  // Topic navigation integration
  const topicNavigation = useQuizNavigation(availableTopics, topicId)
  
  // Enhanced question randomization with session uniqueness
  const randomizedQuestions = useMemo(() => {
    console.log(`=== ENHANCED QUIZ ENGINE PROCESSING ===`)
    console.log(`Input questions for topic ${topicId}:`, questions.length)
    
    if (!questions || questions.length === 0) {
      console.error(`No questions provided for topic ${topicId}`)
      return []
    }
    
    const validatedQuestions = validateAndDeduplicateQuestions(questions)
    
    if (validatedQuestions.length === 0) {
      console.error(`All questions were duplicates or invalid for topic ${topicId}`)
      return []
    }
    
    const sessionSeed = `${Date.now()}-${user?.id || 'anonymous'}-${topicId}`
    console.log(`Session seed for randomization: ${sessionSeed}`)
    
    // Multiple shuffle passes for better randomization
    let shuffled = validatedQuestions
    for (let i = 0; i < 3; i++) {
      shuffled = shuffleArray(shuffled)
    }
    
    console.log(`Final randomized questions:`, shuffled.length)
    console.log(`Question numbers:`, shuffled.map(q => q.question_number))
    console.log(`Question types:`, shuffled.map(q => q.question_type))
    
    // Validate final questions
    const validQuestions = shuffled.filter(q => {
      const isValid = q.question && q.question_type && q.correct_answer
      if (!isValid) {
        console.warn(`Invalid question filtered out:`, {
          topic_id: q.topic_id,
          question_number: q.question_number,
          has_question: !!q.question,
          has_type: !!q.question_type,
          has_answer: !!q.correct_answer
        })
      }
      return isValid
    })
    
    console.log(`Valid questions after filtering: ${validQuestions.length}`)
    return validQuestions
  }, [questions, topicId, user?.id])

  // Handle case where no valid questions are available
  if (randomizedQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-muted-foreground mb-6">
            This quiz doesn't have any valid questions yet. Please try another topic.
          </p>
          <Button onClick={onComplete} className="rounded-xl">
            Back to Topics
          </Button>
        </div>
      </div>
    )
  }
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<EnhancedUserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)

  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())
  
  // Enhanced analytics tracking
  const [sessionAnalytics, setSessionAnalytics] = useState({
    hintsUsed: 0,
    boostsUsed: [] as string[],
    categoryPerformance: {} as Record<string, { correct: number; total: number; avgTime: number }>,
    difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
    questionAttempts: [] as Array<{ questionId: number; attempts: number; finalCorrect: boolean }>
  })
  
  // Boost system state
  const [boostManager] = useState(() => BoostManager.getInstance())
  const [userXP, setUserXP] = useState(0)
  const [currentBoostEffects, setCurrentBoostEffects] = useState<BoostEffects>({
    extraTimeSeconds: 0,
    xpMultiplier: 1,
    autoHintEnabled: false,
    secondChanceAvailable: false,
    streakProtected: false,
    answerRevealAvailable: false,
    timeFreezeAvailable: false,
    luckyGuessChance: 0
  })
  const [hasUsedSecondChance, setHasUsedSecondChance] = useState(false)
  const [answerRevealUsed, setAnswerRevealUsed] = useState(false)
  const [timeFrozen, setTimeFrozen] = useState(false)
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  // Keyboard interaction state
  const [keyboardEnabled, setKeyboardEnabled] = useState(true)

  // Timer integration
  const initialTime = 60 + currentBoostEffects.extraTimeSeconds
  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer(initialTime)

  // Memoized values
  const currentQuestion = useMemo(() => randomizedQuestions[currentQuestionIndex], [randomizedQuestions, currentQuestionIndex])
  const isLastQuestion = useMemo(() => currentQuestionIndex === randomizedQuestions.length - 1, [currentQuestionIndex, randomizedQuestions.length])
  const progress = useMemo(() => ((currentQuestionIndex + 1) / randomizedQuestions.length) * 100, [currentQuestionIndex, randomizedQuestions.length])

  // Enhanced difficulty detection
  const getQuestionDifficulty = useCallback((question: QuizQuestion): 'easy' | 'medium' | 'hard' => {
    // Basic heuristic - could be enhanced with ML
    if (question.tags?.includes('advanced') || question.tags?.includes('expert')) return 'hard'
    if (question.tags?.includes('intermediate')) return 'medium'
    if (question.tags?.includes('basic') || question.tags?.includes('beginner')) return 'easy'
    
    // Default based on question complexity
    const questionLength = question.question.length
    const hasMultipleChoices = question.question_type === 'multiple_choice' && 
                              [question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean).length >= 4
    
    if (questionLength > 200 || !hasMultipleChoices) return 'hard'
    if (questionLength > 100) return 'medium'
    return 'easy'
  }, [])

  // Navigation handlers
  const handleTopicSelect = useCallback((selectedTopicId: string) => {
    if (onTopicChange && selectedTopicId !== topicId) {
      onTopicChange(selectedTopicId)
    }
  }, [onTopicChange, topicId])
  
  const handleTopicNavigate = useCallback((direction: 'prev' | 'next') => {
    const newTopicId = topicNavigation.navigateToTopic(direction)
    if (newTopicId && onTopicChange) {
      onTopicChange(newTopicId)
    }
  }, [topicNavigation, onTopicChange])

  // Mobile detection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const checkMobile = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768)
      }, 150)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Track quiz start ONCE per quiz session
  const hasTrackedQuizStart = useRef(false)
  useEffect(() => {
    if (randomizedQuestions.length > 0 && !hasTrackedQuizStart.current) {
      hasTrackedQuizStart.current = true
      
      const activeBoosts = Object.entries(currentBoostEffects)
        .filter(([key, value]) => value && value !== 0 && value !== false)
        .map(([key]) => key)

      trackQuiz.quizStarted({
        quiz_id: topicId,
        quiz_category: mapCategoryToAnalytics(randomizedQuestions[0]?.category || 'General'),
        quiz_difficulty: 'intermediate',
        user_level: currentLevel,
        active_boosts: activeBoosts,
        streak_count: currentStreak
      })
      
      console.log('🎯 Enhanced quiz started event tracked for:', topicId)
    }
  }, [randomizedQuestions.length, topicId, trackQuiz, currentBoostEffects, currentLevel, currentStreak])

  // Load partial quiz state and initialize boost system
  useEffect(() => {
    if (!user) return

    // Load partial state from enhanced database
    const loadPartialState = async () => {
      try {
        // Check for existing incomplete attempt
        const { data: incompleteAttempt } = await supabase
          .from('user_quiz_attempts')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('topic_id', topicId)
          .eq('is_completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (incompleteAttempt) {
          console.log('📋 Found incomplete quiz attempt:', incompleteAttempt.id)
          // Could load partial state here if implemented
        }
      } catch (error) {
        console.error('Error loading partial state:', error)
      }
    }

    loadPartialState()
    
    // Initialize boost system and load user XP
    boostManager.initialize(user.id)
    loadUserXP()
  }, [user, topicId, boostManager])

  // Load user XP from gamification system
  const loadUserXP = useCallback(async () => {
    if (!user) return
    
    try {
      const stats = await enhancedProgressOperations.getComprehensiveStats(user.id)
      setUserXP(stats.totalXp || 0)
    } catch (error) {
      console.error('Error loading user XP:', error)
      setUserXP(0)
    }
  }, [user])

  // Enhanced analytics tracking helper
  const updateSessionAnalytics = useCallback((update: Partial<typeof sessionAnalytics>) => {
    setSessionAnalytics(prev => ({
      ...prev,
      ...update
    }))
  }, [])

  // Track category performance
  const updateCategoryPerformance = useCallback((question: QuizQuestion, isCorrect: boolean, timeSpent: number) => {
    const category = question.category || 'General'
    
    setSessionAnalytics(prev => {
      const categoryData = prev.categoryPerformance[category] || { correct: 0, total: 0, avgTime: 0 }
      const newTotal = categoryData.total + 1
      const newCorrect = categoryData.correct + (isCorrect ? 1 : 0)
      const newAvgTime = ((categoryData.avgTime * categoryData.total) + timeSpent) / newTotal

      return {
        ...prev,
        categoryPerformance: {
          ...prev.categoryPerformance,
          [category]: {
            correct: newCorrect,
            total: newTotal,
            avgTime: newAvgTime
          }
        }
      }
    })
  }, [])

  // Boost handlers
  const handleBoostActivated = useCallback((effects: BoostEffects) => {
    setCurrentBoostEffects(effects)
    
    if (effects.autoHintEnabled && !showHint) {
      setShowHint(true)
      updateSessionAnalytics({ hintsUsed: sessionAnalytics.hintsUsed + 1 })
    }
    
    console.log('🚀 Enhanced boost effects activated:', effects)
  }, [showHint, sessionAnalytics.hintsUsed, updateSessionAnalytics])

  const handleUseTimeFreeze = useCallback(() => {
    if (!user || !currentBoostEffects.timeFreezeAvailable) return
    
    setTimeFrozen(true)
    stopTimer()
    
    // Track boost usage
    updateSessionAnalytics({ 
      boostsUsed: [...sessionAnalytics.boostsUsed, 'time_freeze'] 
    })
    
    trackGameification.boostActivated({
      boost_type: 'time_freeze',
      activation_context: 'mid_quiz',
      user_level: currentLevel,
      remaining_uses: 0
    })
    
    setTimeout(() => {
      setTimeFrozen(false)
      if (!isAnswerSubmitted) {
        resetTimer()
      }
    }, 10000)
    
    boostManager.useBoost(user.id, 'time_freeze')
    console.log('❄️ Time frozen for 10 seconds')
  }, [user, currentBoostEffects.timeFreezeAvailable, stopTimer, trackGameification, currentLevel, isAnswerSubmitted, resetTimer, boostManager, sessionAnalytics.boostsUsed, updateSessionAnalytics])

  const handleUseAnswerReveal = useCallback(() => {
    if (!user || !currentBoostEffects.answerRevealAvailable || answerRevealUsed) return
    
    setAnswerRevealUsed(true)
    updateSessionAnalytics({ 
      boostsUsed: [...sessionAnalytics.boostsUsed, 'answer_reveal'] 
    })
    
    trackGameification.boostActivated({
      boost_type: 'answer_reveal',
      activation_context: 'specific_question',
      user_level: currentLevel,
      remaining_uses: 0
    })
    
    boostManager.useBoost(user.id, 'answer_reveal')
    console.log('🔍 Answer reveal used')
  }, [user, currentBoostEffects.answerRevealAvailable, answerRevealUsed, trackGameification, currentLevel, boostManager, sessionAnalytics.boostsUsed, updateSessionAnalytics])

  const handleUseSecondChance = useCallback(() => {
    if (!user || !currentBoostEffects.secondChanceAvailable || hasUsedSecondChance) return
    
    trackGameification.boostActivated({
      boost_type: 'second_chance',
      activation_context: 'specific_question',
      user_level: currentLevel,
      remaining_uses: 0
    })
    
    // Reset the question state for a retry
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowFeedback(false)
    setAnswerRevealUsed(false)
    setHasUsedSecondChance(true)
    setCurrentAttemptNumber(prev => prev + 1)
    
    updateSessionAnalytics({ 
      boostsUsed: [...sessionAnalytics.boostsUsed, 'second_chance'] 
    })
    
    resetTimer()
    boostManager.useBoost(user.id, 'second_chance')
    console.log('🔄 Second chance activated')
  }, [user, currentBoostEffects.secondChanceAvailable, hasUsedSecondChance, trackGameification, currentLevel, resetTimer, boostManager, sessionAnalytics.boostsUsed, updateSessionAnalytics])

  // Reset question state when moving to next question
  useEffect(() => {
    console.log('🔄 Resetting enhanced question state for question index:', currentQuestionIndex)
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowHint(false)
    setShowFeedback(false)
    setQuestionStartTime(Date.now())
    setHasUsedSecondChance(false)
    setAnswerRevealUsed(false)
    setCurrentAttemptNumber(1)
    resetTimer()
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentQuestionIndex, resetTimer])

  // Auto-play effect
  useEffect(() => {
    if (!autoPlayEnabled || !currentQuestion?.question || currentQuestionIndex < 0) return
    
    const timer = setTimeout(() => {
      try {
        playText(currentQuestion.question, { autoPlay: true })
      } catch (error) {
        console.warn('Auto-play failed:', error)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [currentQuestionIndex, autoPlayEnabled, currentQuestion?.question, playText])

  // Enhanced event handlers
  function handleTimeUp() {
    if (isAnswerSubmitted) return
    
    console.log('⏰ Time up for question:', currentQuestion?.question_number)
    stopTimer()
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const difficulty = getQuestionDifficulty(currentQuestion)
    
    const newAnswer: EnhancedUserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "timeout",
      isCorrect: false,
      timeSpent,
      hintUsed: showHint,
      boostUsed: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null,
      difficulty,
      category: currentQuestion.category,
      attemptNumber: currentAttemptNumber
    }
    
    // Update analytics
    updateCategoryPerformance(currentQuestion, false, timeSpent)
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Track event
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: false,
      response_time_seconds: timeSpent,
      attempt_number: currentAttemptNumber,
      hint_used: showHint,
      boost_active: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null,
      confidence_level: 1
    })
  }

  function handleSkipQuestion() {
    if (isAnswerSubmitted) return
    
    console.log('⏭️ Skipping question:', currentQuestion?.question_number)
    stopTimer()
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const difficulty = getQuestionDifficulty(currentQuestion)
    
    const newAnswer: EnhancedUserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "skipped",
      isCorrect: false,
      timeSpent,
      hintUsed: showHint,
      boostUsed: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null,
      difficulty,
      category: currentQuestion.category,
      attemptNumber: currentAttemptNumber
    }
    
    updateCategoryPerformance(currentQuestion, false, timeSpent)
    
    setUserAnswers(prev => [...prev, newAnswer])
    setSelectedAnswer("skipped")
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  function handleAnswerSelect(answer: string) {
    if (isAnswerSubmitted || !currentQuestion) return

    setSelectedAnswer(answer)
    stopTimer()
  }

  function handleInteractiveAnswer(answer: string, isCorrect: boolean) {
    if (isAnswerSubmitted || !currentQuestion) return

    setSelectedAnswer(answer)
    stopTimer()
  }

  function handleSubmitAnswer() {
    if (!selectedAnswer || isAnswerSubmitted) return
    
    console.log('📤 Submitting enhanced answer:', selectedAnswer)
    stopTimer()
    
    // Determine if answer is correct
    let isCorrect = false
    if (currentQuestion.question_type === 'short_answer') {
      const answerStatus = checkAnswerDetailed(selectedAnswer, currentQuestion.correct_answer)
      isCorrect = answerStatus === 'correct'
    } else if (currentQuestion.question_type === 'true_false') {
      isCorrect = selectedAnswer.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
    } else {
      isCorrect = selectedAnswer === currentQuestion.correct_answer
    }
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const difficulty = getQuestionDifficulty(currentQuestion)
    
    const newAnswer: EnhancedUserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
      hintUsed: showHint,
      boostUsed: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null,
      difficulty,
      category: currentQuestion.category,
      attemptNumber: currentAttemptNumber
    }
    
    // Update enhanced analytics
    updateCategoryPerformance(currentQuestion, isCorrect, timeSpent)
    
    // Update difficulty distribution
    setSessionAnalytics(prev => ({
      ...prev,
      difficultyDistribution: {
        ...prev.difficultyDistribution,
        [difficulty]: prev.difficultyDistribution[difficulty] + 1
      }
    }))
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Note: Streak is now managed by the gamification system
    // The actual streak update will happen when the quiz is completed
    
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    // Enhanced tracking
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: isCorrect,
      response_time_seconds: timeSpent,
      attempt_number: currentAttemptNumber,
      hint_used: showHint,
      boost_active: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null,
      confidence_level: isCorrect ? (timeSpent < 10 ? 5 : timeSpent < 30 ? 4 : 3) : 2
    })
    
    console.log('🎮 Enhanced question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      difficulty,
      isCorrect,
      timeSpent,
      attemptNumber: currentAttemptNumber,
      hintUsed: showHint,
      boostUsed: sessionAnalytics.boostsUsed.length > 0 ? sessionAnalytics.boostsUsed[sessionAnalytics.boostsUsed.length - 1] : null
    })
    
    // Auto-play explanation
    if (autoPlayEnabled && currentQuestion?.explanation) {
      setTimeout(() => {
        try {
          playText(currentQuestion.explanation, { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play explanation failed:', error)
        }
      }, 800)
    }
  }

  async function handleFinishQuiz() {
    // Enhanced quiz completion with analytics
    const totalQuestions = randomizedQuestions.length
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length
    const totalTimeSeconds = userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100)
    
    // Track completion with enhanced data
    trackQuiz.quizCompleted({
      quiz_id: topicId,
      quiz_category: mapCategoryToAnalytics(currentQuestion?.category || 'General'),
      score_percentage: scorePercentage,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      total_time_seconds: totalTimeSeconds,
      user_level: currentLevel,
      active_boosts: sessionAnalytics.boostsUsed,
      streak_count: currentStreak,
      xp_earned: correctAnswers * 10 * currentBoostEffects.xpMultiplier,
      streak_maintained: correctAnswers > 0,
      new_level_reached: false,
      boosts_used: sessionAnalytics.boostsUsed
    })

    // Update enhanced gamification progress
    if (user) {
      try {
        // Prepare question responses for skill tracking
        const questionResponses = userAnswers.map(answer => {
          const question = randomizedQuestions.find(q => q.question_number === answer.questionId)
          return {
            questionId: answer.questionId.toString(),
            category: question?.category || 'General',
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }
        })

        // 1. Update gamification progress
        const quizData = {
          topicId,
          totalQuestions: randomizedQuestions.length,
          correctAnswers: userAnswers.filter(a => a.isCorrect).length,
          timeSpentSeconds: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
          questionResponses
        }

        console.log('🎮 Updating enhanced gamification progress:', quizData)
        const results = await updateProgress(quizData)
        console.log('✅ Enhanced gamification progress updated:', {
          achievements: results.newAchievements?.length || 0,
          levelUp: results.levelUp || false,
          skillUpdates: results.skillUpdates?.length || 0
        })

        // 2. Update skill progress with our new skill tracking system
        try {
          console.log('🔄 Updating skill progress...')
          const skillResults = await enhancedQuizDatabase.updateSkillProgress(
            user.id,
            questionResponses
          )
          
          console.log('✅ Skill progress updated:', {
            updatedSkills: skillResults.updatedSkills.length,
            masteryChanges: Object.keys(skillResults.masteryChanges).length > 0 
              ? skillResults.masteryChanges 
              : 'No mastery changes'
          })
          
          // If there were mastery changes, we could notify the user here
          
        } catch (skillError) {
          console.error('❌ Error updating skill progress:', skillError)
          // Continue despite error
        }

        // Track achievements and level ups
        if (results.newAchievements && results.newAchievements.length > 0) {
          results.newAchievements.forEach(achievement => {
            trackGameification.achievementUnlocked({
              achievement_type: achievement.type || 'quiz_completion',
              achievement_category: 'quiz',
              total_achievements: results.newAchievements?.length || 0
            })
          })
        }

        if (results.levelUp) {
          trackGameification.levelUp({
            new_level: currentLevel + 1,
            xp_total: 0,
            primary_activity: 'quiz'
          })
        }
      } catch (error) {
        console.error('❌ Failed to update enhanced gamification progress:', error)
      }
    }
    
    console.log('🎯 Enhanced quiz completion with analytics:', {
      totalQuestions,
      correctAnswers,
      scorePercentage,
      sessionAnalytics,
      categoryPerformance: sessionAnalytics.categoryPerformance,
      boostsUsed: sessionAnalytics.boostsUsed
    })
    
    setShowResults(true)
  }

  function handleNextQuestion() {
    if (isLastQuestion) {
      handleFinishQuiz()
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // Enhanced keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    if (!keyboardEnabled) return
    
    const target = event.target as HTMLElement
    if (target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('[contenteditable]')
    )) {
      return
    }

    if (isAnswerSubmitted && event.key !== ' ') return

    console.log('🎹 Enhanced key pressed:', event.key, 'Answer submitted:', isAnswerSubmitted, 'Selected answer:', selectedAnswer)

    switch (event.key.toLowerCase()) {
      case 'enter':
        if (!isAnswerSubmitted && selectedAnswer) {
          event.preventDefault()
          event.stopPropagation()
          console.log('⏎ Submitting answer via Enter key:', selectedAnswer)
          handleSubmitAnswer()
        }
        break
        
      case ' ':
        event.preventDefault()
        event.stopPropagation()
        setShowHint(prev => {
          const newShowHint = !prev
          if (newShowHint && currentQuestion) {
            updateSessionAnalytics({ hintsUsed: sessionAnalytics.hintsUsed + 1 })
            trackQuiz.hintUsed(
              `${topicId}-${currentQuestion.question_number}`,
              'manual',
              true
            )
          }
          console.log('💡 Enhanced hint toggled via Space:', newShowHint ? 'shown' : 'hidden')
          return newShowHint
        })
        break
        
      case '1':
      case '2':
      case '3':
      case '4':
        if (currentQuestion?.question_type === 'multiple_choice' && !isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          const optionIndex = parseInt(event.key) - 1
          const options = [
            currentQuestion.option_a,
            currentQuestion.option_b,
            currentQuestion.option_c,
            currentQuestion.option_d
          ].filter(Boolean)
          
          if (optionIndex < options.length) {
            const optionId = `option_${String.fromCharCode(97 + optionIndex)}`
            console.log('🔢 Selecting option via keyboard:', optionId)
            handleAnswerSelect(optionId)
          }
        }
        break
        
      case 't':
        if (currentQuestion?.question_type === 'true_false' && !isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('✅ Selecting True via keyboard')
          handleAnswerSelect('true')
        }
        break
        
      case 'f':
        if (currentQuestion?.question_type === 'true_false' && !isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('❌ Selecting False via keyboard')
          handleAnswerSelect('false')
        }
        break
        
      case 's':
        if (!event.ctrlKey && !event.metaKey && !isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('⏭️ Skipping question via keyboard')
          handleSkipQuestion()
        }
        break
        
      case 'n':
        if (isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('➡️ Next question via keyboard')
          handleNextQuestion()
        }
        break
    }
  }

  // Keyboard event registration
  useEffect(() => {
    setKeyboardEnabled(true)
    
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      try {
        handleKeyDown(event)
      } catch (error) {
        console.error('Enhanced keyboard handler error:', error)
      }
    }
    
    document.addEventListener('keydown', handleKeyDownWrapper, {
      passive: false,
      capture: true
    })
    
    console.log('🎹 Enhanced keyboard shortcuts enabled')
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper, { capture: true })
      console.log('🎹 Enhanced keyboard shortcuts disabled')
    }
  }, [isAnswerSubmitted, selectedAnswer, currentQuestionIndex])

  // Input focus handlers
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      )) {
        setKeyboardEnabled(false)
        console.log('🎹 Enhanced keyboard shortcuts disabled (input focused)')
      }
    }
    
    const handleFocusOut = () => {
      setTimeout(() => {
        setKeyboardEnabled(true)
        console.log('🎹 Enhanced keyboard shortcuts re-enabled (input unfocused)')
      }, 100)
    }
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Initialize quiz attempt in database
  const [resumedAttemptId, setResumedAttemptId] = useState<string | null>(null)
  const attemptCreatedRef = useRef(false)
  
  useEffect(() => {
    if (attemptCreatedRef.current) return // Prevent duplicate attempts
    
    const createAttempt = async () => {
      if (user && !resumedAttemptId && randomizedQuestions.length > 0) {
        attemptCreatedRef.current = true
        try {
          const { data: attempt, error } = await supabase
            .from('user_quiz_attempts')
            .insert({
              user_id: user.id,
              topic_id: topicId,
              total_questions: randomizedQuestions.length,
              started_at: new Date().toISOString(),
              is_completed: false
            })
            .select()
            .single()
            
          if (error) {
            console.error('Error creating enhanced quiz attempt:', error)
            attemptCreatedRef.current = false // Allow retry on error
          } else if (attempt) {
            console.log(`✅ Created enhanced quiz attempt: ${attempt.id}`)
            setResumedAttemptId(attempt.id)
          }
        } catch (err) {
          console.error('Failed to create enhanced quiz attempt:', err)
          attemptCreatedRef.current = false // Allow retry on error
        }
      }
    }
    
    createAttempt()
  }, [user, topicId, randomizedQuestions.length, resumedAttemptId])

  if (showResults) {
    return (
      <QuizResults
        userAnswers={userAnswers}
        questions={randomizedQuestions}
        onFinish={onComplete}
        topicId={topicId}
        resumedAttemptId={resumedAttemptId}
      />
    )
  }

  const renderQuestion = () => {
    const questionProps = {
      question: currentQuestion,
      selectedAnswer,
      isSubmitted: isAnswerSubmitted,
      onSelectAnswer: handleAnswerSelect
    }

    switch (currentQuestion.question_type) {
      case "multiple_choice":
        return <MultipleChoiceQuestion {...questionProps} />
      case "true_false":
        return <TrueFalseQuestion {...questionProps} />
      case "short_answer":
        return <ShortAnswerQuestion {...questionProps} />
      case "fill_in_blank":
        return (
          <FillInBlankQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "matching":
        return (
          <MatchingQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "ordering":
        return (
          <OrderingQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "crossword":
        return (
          <CrosswordQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      default:
        return <div>Unsupported question type: {currentQuestion.question_type}</div>
    }
  }

  return (
    <div className="min-h-screen">
      {/* Topic Navigation */}
      {availableTopics.length > 0 && (
        <QuizDateNavigation
          currentTopic={currentTopic}
          previousTopic={topicNavigation.previousTopic}
          nextTopic={topicNavigation.nextTopic}
          availableDates={availableTopics}
          onDateSelect={handleTopicSelect}
          onNavigate={handleTopicNavigate}
          className="sticky top-0 z-40 shadow-sm"
        />
      )}
      
      <div className={cn(
        "max-w-4xl mx-auto space-y-6",
        isMobile ? "px-3 py-4 pb-20" : "px-6 py-8 space-y-12"
      )}>
        {/* Quiz title display */}
        <div className="text-xs text-center mb-3 text-slate-500 dark:text-slate-400">
          <span className="mr-1">{currentTopic.emoji}</span>
          <span>{currentTopic.title}</span>
        </div>
        
        {/* Question number and timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Question {currentQuestionIndex + 1}/{randomizedQuestions.length}
            </span>
            {/* Show attempt number if using second chance */}
            {currentAttemptNumber > 1 && (
              <Badge variant="outline" className="text-xs">
                Attempt {currentAttemptNumber}
              </Badge>
            )}
            {/* Streak indicator - simple and close to question info */}
            {user && currentStreak > 0 && (
              <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                <Flame className="h-3 w-3 text-orange-500" />
                <span>{currentStreak}</span>
              </div>
            )}
          </div>
          
          <QuestionTimer
            key={`timer-${currentQuestionIndex}-${currentAttemptNumber}`}
            initialTime={60}
            isActive={isTimerActive && !isAnswerSubmitted && !timeFrozen}
            onTimeUp={handleTimeUp}
          />
        </div>

        {/* Enhanced progress bar */}
        <div className={cn("relative", "hidden md:block")}>
          <Progress 
            value={progress} 
            className={cn(
              "h-2 transition-all duration-500",
              animateProgress && "scale-y-150"
            )} 
          />
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent w-12 animate-shimmer" />
        </div>

        {/* Question section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <MemoizedQuestionDisplay 
              question={currentQuestion} 
              showHint={showHint} 
            />
            
            <div className="flex items-center justify-center space-x-6 animate-in fade-in duration-300">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowHint(!showHint)
                  if (!showHint) {
                    updateSessionAnalytics({ hintsUsed: sessionAnalytics.hintsUsed + 1 })
                  }
                }} 
                className={cn(
                  "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-light text-sm h-auto p-2 transition-all hover:scale-105",
                  showHint && "text-blue-600 dark:text-blue-400"
                )}
              >
                {showHint ? "Hide hint" : "Show hint"}
              </Button>
            </div>
          </div>

          {!isAnswerSubmitted && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderQuestion()}
            </div>
          )}

          {isAnswerSubmitted && (
            <QuestionFeedbackDisplay
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              timeLeft={timeLeft}
              isLastQuestion={isLastQuestion}
              onNextQuestion={handleNextQuestion}
              xpGained={0} // Will be calculated in results
            />
          )}
        </div>

        {/* Enhanced action buttons */}
        {!isAnswerSubmitted && !isMobile && (
          <div className="space-y-6">
            {/* Boost buttons */}
            {(currentBoostEffects.timeFreezeAvailable || 
              currentBoostEffects.answerRevealAvailable || 
              currentBoostEffects.secondChanceAvailable) && (
              <div className="flex items-center justify-center gap-3 animate-in fade-in duration-300">
                {currentBoostEffects.timeFreezeAvailable && !timeFrozen && (
                  <Button 
                    onClick={handleUseTimeFreeze}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-105"
                  >
                    <Snowflake className="h-4 w-4 mr-1" />
                    Freeze Time
                  </Button>
                )}
                
                {currentBoostEffects.answerRevealAvailable && 
                 !answerRevealUsed && 
                 currentQuestion.question_type === 'multiple_choice' && (
                  <Button 
                    onClick={handleUseAnswerReveal}
                    variant="outline"
                    size="sm"
                    className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-105"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Reveal Answer
                  </Button>
                )}
                
                {currentBoostEffects.secondChanceAvailable && 
                 !hasUsedSecondChance && 
                 isAnswerSubmitted && (
                  <Button 
                    onClick={handleUseSecondChance}
                    variant="outline"
                    size="sm"
                    className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:scale-105"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Second Chance
                  </Button>
                )}
              </div>
            )}
            
            {/* Main action buttons */}
            <div className="flex items-center justify-center gap-6 animate-in fade-in duration-300">
              <Button 
                onClick={handleSkipQuestion}
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-light transition-all hover:scale-105"
              >
                Skip
              </Button>
              
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || timeLeft === 0} 
                className={cn(
                  "rounded-full px-8 py-3 font-light transition-all duration-200",
                  selectedAnswer 
                    ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white scale-100 hover:scale-105" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed scale-95"
                )}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}



        {/* Enhanced debug panel */}
        {process.env.NODE_ENV === 'development' && !isMobile && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <div className="bg-black/80 text-white p-4 rounded-lg text-xs font-mono backdrop-blur-sm">
              <div className="text-xs font-bold mb-2">Enhanced Quiz Debug:</div>
              <div>Selected: {selectedAnswer || 'None'}</div>
              <div>Submitted: {isAnswerSubmitted ? 'Yes' : 'No'}</div>
              <div>Timer: {timeLeft}s {timeFrozen && '(Frozen)'}</div>
              <div>Question: {currentQuestionIndex + 1}/{randomizedQuestions.length}</div>
              <div>Type: {currentQuestion?.question_type}</div>
              <div>Difficulty: {getQuestionDifficulty(currentQuestion)}</div>
              <div>Category: {currentQuestion?.category}</div>
              <div>Attempt: {currentAttemptNumber}</div>
              <div>Hints Used: {sessionAnalytics.hintsUsed}</div>
              <div>Boosts Used: {sessionAnalytics.boostsUsed.length}</div>
              <div>Premium: {isPremium ? 'Yes' : 'No'}</div>
              <div>Keyboard: {keyboardEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        )}

        {/* Enhanced keyboard shortcuts */}
        {!isAnswerSubmitted && !isMobile && (
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in duration-300">
            <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
              {currentQuestion.question_type === 'multiple_choice' && (
                <>Use <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">1-4</span> to select • </>
              )}
              {currentQuestion.question_type === 'true_false' && (
                <>Use <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">T</span>/<span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">F</span> to select • </>
              )}
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">Enter</span> to submit • 
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">Space</span> for hint •
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">S</span> to skip
            </p>
          </div>
        )}

        {isAnswerSubmitted && !isMobile && (
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in duration-300">
            <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
              Press <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">N</span> for next question
            </p>
          </div>
        )}
      </div>

      {/* Enhanced mobile bottom bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-6 pb-8 z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl">
          {!isAnswerSubmitted ? (
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={handleSkipQuestion}
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium flex-1 h-12 text-base transition-all hover:scale-105"
              >
                Skip
              </Button>
              
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || timeLeft === 0}
                className={cn(
                  "rounded-full px-8 py-4 h-14 font-medium transition-all duration-300 flex-2 text-base shadow-lg",
                  selectedAnswer 
                    ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white hover:scale-105 active:scale-95" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed scale-95"
                )}
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Button 
                onClick={handleNextQuestion}
                className={cn(
                  "w-full h-14 rounded-xl font-semibold text-lg",
                  "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
                  "transform transition-all duration-300",
                  "animate-bounce-subtle",
                  "shadow-lg hover:shadow-xl"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                  <span className="animate-pulse">→</span>
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Boost Command Bar */}
      {user && (
        <BoostCommandBar
          userXP={userXP}
          onXPChanged={setUserXP}
          onBoostActivated={handleBoostActivated}
        />
      )}
    </div>
  )
}