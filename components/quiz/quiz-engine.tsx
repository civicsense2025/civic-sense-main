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
import { quizDatabase } from "@/lib/quiz-database"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from "@/hooks/useGamification"
import type { BoostEffects } from "@/lib/game-boosts"
import { BoostManager } from "@/lib/game-boosts"
import { enhancedProgressOperations } from "@/lib/enhanced-gamification"
import { useAnalytics, mapCategoryToAnalytics } from "@/utils/analytics"

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

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
}

// Enhanced Fisher-Yates shuffle with crypto randomness for better uniqueness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  
  // Use crypto.getRandomValues for better randomness if available
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

// Enhanced validation and deduplication with better unique key generation
function validateAndDeduplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>()
  const uniqueQuestions: QuizQuestion[] = []
  
  for (const question of questions) {
    // Create a more robust unique key using multiple question properties
    const questionContent = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    const questionKey = [
      question.topic_id,
      question.question_number,
      question.question_type,
      questionContent.slice(0, 100), // Use more characters for uniqueness
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
        question_preview: question.question.slice(0, 50) + '...',
        question_type: question.question_type
      })
    }
  }
  
  console.log(`Question validation: ${questions.length} input → ${uniqueQuestions.length} unique questions`)
  
  // Additional validation to ensure we have truly unique content
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

// Memoized components to prevent unnecessary re-renders
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
    
    {/* Hint - clean and minimal with animation */}
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

// Memoized boost buttons
const MemoizedBoostButtons = memo(({
  boostEffects,
  timeFrozen,
  answerRevealUsed,
  hasUsedSecondChance,
  isAnswerSubmitted,
  questionType,
  onUseTimeFreeze,
  onUseAnswerReveal,
  onUseSecondChance
}: {
  boostEffects: BoostEffects
  timeFrozen: boolean
  answerRevealUsed: boolean
  hasUsedSecondChance: boolean
  isAnswerSubmitted: boolean
  questionType: string
  onUseTimeFreeze: () => void
  onUseAnswerReveal: () => void
  onUseSecondChance: () => void
}) => {
  if (!boostEffects.timeFreezeAvailable && 
      !boostEffects.answerRevealAvailable && 
      !boostEffects.secondChanceAvailable) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-3 animate-in fade-in duration-300">
      {boostEffects.timeFreezeAvailable && !timeFrozen && (
        <Button 
          onClick={onUseTimeFreeze}
          variant="outline"
          size="sm"
          className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-105"
        >
          <Snowflake className="h-4 w-4 mr-1" />
          Freeze Time
        </Button>
      )}
      
      {boostEffects.answerRevealAvailable && 
       !answerRevealUsed && 
       questionType === 'multiple_choice' && (
        <Button 
          onClick={onUseAnswerReveal}
          variant="outline"
          size="sm"
          className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-105"
        >
          <Eye className="h-4 w-4 mr-1" />
          Reveal Answer
        </Button>
      )}
      
      {boostEffects.secondChanceAvailable && 
       !hasUsedSecondChance && 
       isAnswerSubmitted && (
        <Button 
          onClick={onUseSecondChance}
          variant="outline"
          size="sm"
          className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:scale-105"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Second Chance
        </Button>
      )}
    </div>
  )
})

MemoizedBoostButtons.displayName = 'MemoizedBoostButtons'

export function QuizEngine({ 
  questions, 
  topicId, 
  currentTopic,
  availableTopics = [],
  onComplete,
  onTopicChange 
}: QuizEngineProps) {
  const { user } = useAuth()
  
  // Analytics integration
  const { trackQuiz, trackGameification, trackEngagement } = useAnalytics()
  
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Enhanced gamification integration
  const { updateProgress, currentStreak, currentLevel } = useGamification()
  
  // Topic navigation integration
  const topicNavigation = useQuizNavigation(availableTopics, topicId)
  
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
  
  // Enhanced question randomization with session uniqueness
  const randomizedQuestions = useMemo(() => {
    console.log(`=== QUIZ ENGINE QUESTION PROCESSING ===`)
    console.log(`Input questions for topic ${topicId}:`, questions.length)
    
    // Handle edge case of no questions
    if (!questions || questions.length === 0) {
      console.error(`No questions provided for topic ${topicId}`)
      return []
    }
    
    // First, validate and deduplicate questions with enhanced logic
    const validatedQuestions = validateAndDeduplicateQuestions(questions)
    
    // Handle edge case where all questions were duplicates
    if (validatedQuestions.length === 0) {
      console.error(`All questions were duplicates or invalid for topic ${topicId}`)
      return []
    }
    
    // Add session uniqueness by incorporating timestamp and user ID
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
    console.log(`Question previews:`, shuffled.map(q => q.question.slice(0, 30) + '...'))
    
    // Validate that each question has required fields
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
  }, [questions, topicId, user?.id]) // Added user.id to dependencies for session uniqueness

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
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)
  const [streak, setStreak] = useState(0)
  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())
  
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
  const [isMobile, setIsMobile] = useState(false)
  const [showSources, setShowSources] = useState(false)

  // Keyboard interaction state
  const [keyboardEnabled, setKeyboardEnabled] = useState(true)

  // Use the timer hook with boost extra time
  const initialTime = 60 + currentBoostEffects.extraTimeSeconds
  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer(initialTime)

  // Memoized values
  const currentQuestion = useMemo(() => randomizedQuestions[currentQuestionIndex], [randomizedQuestions, currentQuestionIndex])
  const isLastQuestion = useMemo(() => currentQuestionIndex === randomizedQuestions.length - 1, [currentQuestionIndex, randomizedQuestions.length])
  const progress = useMemo(() => ((currentQuestionIndex + 1) / randomizedQuestions.length) * 100, [currentQuestionIndex, randomizedQuestions.length])

  // Mobile detection with debounce
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
      
      console.log('🎯 Quiz started event tracked for:', topicId)
    }
  }, [randomizedQuestions.length, topicId, trackQuiz, currentBoostEffects, currentLevel, currentStreak])

  // Log current question for debugging
  useEffect(() => {
    if (currentQuestion) {
      console.log(`=== RENDERING QUESTION ${currentQuestionIndex + 1}/${randomizedQuestions.length} ===`)
      console.log(`Question ID: ${currentQuestion.topic_id}-${currentQuestion.question_number}`)
      console.log(`Question Type: ${currentQuestion.question_type}`)
      console.log(`Question Preview: ${currentQuestion.question.slice(0, 100)}...`)
      console.log(`Correct Answer: ${currentQuestion.correct_answer}`)
    }
  }, [currentQuestion, currentQuestionIndex, randomizedQuestions.length])

  // Load partial quiz state on mount
  useEffect(() => {
    if (!user) return

    const partialState = quizDatabase.loadPartialQuizState(user.id, topicId)
    if (partialState) {
      setCurrentQuestionIndex(partialState.currentQuestionIndex)
      setUserAnswers(partialState.userAnswers)
    }
    
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

  // Boost handlers with useCallback for optimization
  const handleBoostActivated = useCallback((effects: BoostEffects) => {
    setCurrentBoostEffects(effects)
    
    // Apply automatic effects
    if (effects.autoHintEnabled && !showHint) {
      setShowHint(true)
    }
    
    console.log('🚀 Boost effects activated:', effects)
  }, [showHint])

  const handleUseTimeFreeze = useCallback(() => {
    if (!user || !currentBoostEffects.timeFreezeAvailable) return
    
    setTimeFrozen(true)
    stopTimer()
    
    // Track boost activation
    trackGameification.boostActivated({
      boost_type: 'time_freeze',
      activation_context: 'mid_quiz',
      user_level: currentLevel,
      remaining_uses: 0
    })
    
    // Unfreeze after 10 seconds
    setTimeout(() => {
      setTimeFrozen(false)
      // Resume timer if question not submitted
      if (!isAnswerSubmitted) {
        resetTimer()
      }
    }, 10000)
    
    // Consume the boost use
    boostManager.useBoost(user.id, 'time_freeze')
    
    console.log('❄️ Time frozen for 10 seconds')
  }, [user, currentBoostEffects.timeFreezeAvailable, stopTimer, trackGameification, currentLevel, isAnswerSubmitted, resetTimer, boostManager])

  const handleUseAnswerReveal = useCallback(() => {
    if (!user || !currentBoostEffects.answerRevealAvailable || answerRevealUsed) return
    
    setAnswerRevealUsed(true)
    
    // Track boost activation
    trackGameification.boostActivated({
      boost_type: 'answer_reveal',
      activation_context: 'specific_question',
      user_level: currentLevel,
      remaining_uses: 0
    })
    
    boostManager.useBoost(user.id, 'answer_reveal')
    
    console.log('🔍 Answer reveal used')
  }, [user, currentBoostEffects.answerRevealAvailable, answerRevealUsed, trackGameification, currentLevel, boostManager])

  const handleUseSecondChance = useCallback(() => {
    if (!user || !currentBoostEffects.secondChanceAvailable || hasUsedSecondChance) return
    
    // Track boost activation
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
    
    // Reset timer
    resetTimer()
    
    // Consume the boost
    boostManager.useBoost(user.id, 'second_chance')
    
    console.log('🔄 Second chance activated')
  }, [user, currentBoostEffects.secondChanceAvailable, hasUsedSecondChance, trackGameification, currentLevel, resetTimer, boostManager])

  // Save partial state whenever answers change
  useEffect(() => {
    if (!user || userAnswers.length === 0) return

    const partialState = {
      currentQuestionIndex,
      userAnswers,
      startTime: quizStartTime
    }

    quizDatabase.savePartialQuizState(user.id, topicId, partialState)
  }, [user, topicId, currentQuestionIndex, userAnswers, quizStartTime])

  // Reset question state when moving to next question
  useEffect(() => {
    console.log('🔄 Resetting question state for question index:', currentQuestionIndex)
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowHint(false)
    setShowFeedback(false)
    setQuestionStartTime(Date.now())
    setShowSources(false)
    setHasUsedSecondChance(false)
    setAnswerRevealUsed(false)
    resetTimer()
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentQuestionIndex, resetTimer])

  // Optimized audio auto-play effect
  useEffect(() => {
    if (!autoPlayEnabled || !currentQuestion?.question || currentQuestionIndex < 0) return
    
    const timer = setTimeout(() => {
      try {
        playText(currentQuestion.question, { autoPlay: true })
      } catch (error) {
        console.warn('Auto-play failed:', error)
      }
    }, 300) // Reduced delay for better responsiveness
    
    return () => clearTimeout(timer)
  }, [currentQuestionIndex, autoPlayEnabled, currentQuestion?.question, playText])

  // Define all handler functions as regular functions instead of useCallback
  // to avoid circular dependencies
  function handleTimeUp() {
    if (isAnswerSubmitted) return
    
    console.log('⏰ Time up for question:', currentQuestion?.question_number)
    stopTimer()
    
    // Auto-submit with no answer
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "timeout",
      isCorrect: false,
      timeSpent
    }
    
    // Track question answered event
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: false,
      response_time_seconds: timeSpent,
      attempt_number: 1,
      hint_used: showHint,
      boost_active: Object.keys(currentBoostEffects).find(key => 
        currentBoostEffects[key as keyof typeof currentBoostEffects] && 
        currentBoostEffects[key as keyof typeof currentBoostEffects] !== 0
      ) || null,
      confidence_level: 1
    })
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  function handleSkipQuestion() {
    if (isAnswerSubmitted) {
      console.log('⏭️ Skip blocked: answer already submitted')
      return
    }
    
    console.log('⏭️ Skipping question:', currentQuestion?.question_number)
    stopTimer()
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "skipped",
      isCorrect: false,
      timeSpent
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setSelectedAnswer("skipped")
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  function handleAnswerSelect(answer: string) {
    if (isAnswerSubmitted) {
      console.log('🚫 Answer selection blocked: already submitted')
      return
    }
    console.log('✅ Selecting answer:', answer)
    setSelectedAnswer(answer)
    
    // Micro-animation: gentle scale effect on the submit button
    if (isMobile) {
      const answerButton = document.querySelector('[data-answer-button]')
      if (answerButton) {
        answerButton.classList.add('animate-gentle-scale')
        setTimeout(() => {
          answerButton.classList.remove('animate-gentle-scale')
        }, 500)
      }
    }
  }

  function handleInteractiveAnswer(answer: string, isCorrect: boolean) {
    if (isAnswerSubmitted) {
      console.log('🚫 Interactive answer blocked: already submitted')
      return
    }
    
    console.log('🎯 Interactive answer:', answer, 'Correct:', isCorrect)
    setSelectedAnswer(answer)
    stopTimer()
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer,
      isCorrect,
      timeSpent
    }
    
    // Track question answered event
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: isCorrect,
      response_time_seconds: timeSpent,
      attempt_number: 1,
      hint_used: showHint,
      boost_active: Object.keys(currentBoostEffects).find(key => 
        currentBoostEffects[key as keyof typeof currentBoostEffects] && 
        currentBoostEffects[key as keyof typeof currentBoostEffects] !== 0
      ) || null,
      confidence_level: isCorrect ? (timeSpent < 10 ? 5 : timeSpent < 30 ? 4 : 3) : 2
    })
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
    
    // Animate progress bar
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    console.log('🎮 Question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      isCorrect,
      timeSpent,
      difficulty: currentQuestion.tags?.includes('advanced') ? 3 : 
                  currentQuestion.tags?.includes('intermediate') ? 2 : 1
    })
    
    // Auto-play explanation if global autoplay is enabled
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

  function handleSubmitAnswer() {
    if (!selectedAnswer || isAnswerSubmitted) {
      console.log('🚫 Submit blocked:', { selectedAnswer, isAnswerSubmitted })
      return
    }
    
    console.log('📤 Submitting answer:', selectedAnswer)
    stopTimer()
    
    // Determine if answer is correct based on question type
    let isCorrect = false
    if (currentQuestion.question_type === 'short_answer') {
      // Check if the user's answer was shown as correct in real-time feedback
      const answerStatus = checkAnswerDetailed(selectedAnswer, currentQuestion.correct_answer)
      isCorrect = answerStatus === 'correct'
    } else if (currentQuestion.question_type === 'true_false') {
      isCorrect = selectedAnswer.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
    } else {
      isCorrect = selectedAnswer === currentQuestion.correct_answer
    }
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
      timeSpent
    }
    
    // Track question answered event
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: isCorrect,
      response_time_seconds: timeSpent,
      attempt_number: hasUsedSecondChance ? 2 : 1,
      hint_used: showHint,
      boost_active: Object.keys(currentBoostEffects).find(key => 
        currentBoostEffects[key as keyof typeof currentBoostEffects] && 
        currentBoostEffects[key as keyof typeof currentBoostEffects] !== 0
      ) || null,
      confidence_level: isCorrect ? (timeSpent < 10 ? 5 : timeSpent < 30 ? 4 : 3) : 2
    })
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
    
    // Animate progress bar
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    console.log('🎮 Question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      isCorrect,
      timeSpent,
      difficulty: currentQuestion.tags?.includes('advanced') ? 3 : 
                  currentQuestion.tags?.includes('intermediate') ? 2 : 1
    })
    
    // Auto-play explanation if global autoplay is enabled
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
    // Calculate quiz metrics
    const totalQuestions = randomizedQuestions.length
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length
    const totalTimeSeconds = userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100)
    const activeBoosts = Object.entries(currentBoostEffects)
      .filter(([key, value]) => value && value !== 0 && value !== false)
      .map(([key]) => key)

    // Track quiz completion
    trackQuiz.quizCompleted({
      quiz_id: topicId,
      quiz_category: mapCategoryToAnalytics(currentQuestion?.category || 'General'),
      score_percentage: scorePercentage,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      total_time_seconds: totalTimeSeconds,
      user_level: currentLevel,
      active_boosts: activeBoosts,
      streak_count: currentStreak,
      xp_earned: correctAnswers * 10 * currentBoostEffects.xpMultiplier,
      streak_maintained: correctAnswers > 0,
      new_level_reached: false,
      boosts_used: activeBoosts
    })

    // Update enhanced gamification progress before showing results
    if (user) {
      try {
        const questionResponses = userAnswers.map(answer => {
          const question = randomizedQuestions.find(q => q.question_number === answer.questionId)
          return {
            questionId: answer.questionId.toString(),
            category: question?.category || 'General',
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }
        })

        const quizData = {
          topicId,
          totalQuestions: randomizedQuestions.length,
          correctAnswers: userAnswers.filter(a => a.isCorrect).length,
          timeSpentSeconds: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
          questionResponses
        }

        console.log('🎮 Updating gamification progress:', quizData)
        const results = await updateProgress(quizData)
        console.log('✅ Gamification progress updated successfully:', {
          achievements: results.newAchievements?.length || 0,
          levelUp: results.levelUp || false,
          skillUpdates: results.skillUpdates?.length || 0
        })

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
        console.error('❌ Failed to update gamification progress:', error)
      }
    }
    
    setShowResults(true)
  }

  function handleNextQuestion() {
    if (isLastQuestion) {
      handleFinishQuiz()
    } else {
      // Scroll to top when moving to next question
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Skip if keyboard is disabled
    if (!keyboardEnabled) return
    
    // Don't handle shortcuts if user is typing in an input or textarea
    const target = event.target as HTMLElement
    if (target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('[contenteditable]')
    )) {
      return
    }

    // Don't handle shortcuts after answer is submitted (except for spacebar for hints)
    if (isAnswerSubmitted && event.key !== ' ') return

    console.log('🎹 Key pressed:', event.key, 'Answer submitted:', isAnswerSubmitted, 'Selected answer:', selectedAnswer)

    // Handle different key combinations
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
            // Track hint usage
            trackQuiz.hintUsed(
              `${topicId}-${currentQuestion.question_number}`,
              'manual',
              true
            )
          }
          console.log('💡 Hint toggled via Space:', newShowHint ? 'shown' : 'hidden')
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
            const optionId = `option_${String.fromCharCode(97 + optionIndex)}` // option_a, option_b, etc.
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

  // Enhanced keyboard event registration
  useEffect(() => {
    // Enable keyboard shortcuts when component mounts
    setKeyboardEnabled(true)
    
    // Add event listener with better options
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      try {
        handleKeyDown(event)
      } catch (error) {
        console.error('Keyboard handler error:', error)
      }
    }
    
    document.addEventListener('keydown', handleKeyDownWrapper, {
      passive: false,
      capture: true // Use capture phase for better event handling
    })
    
    console.log('🎹 Keyboard shortcuts enabled')
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper, { capture: true })
      console.log('🎹 Keyboard shortcuts disabled')
    }
  }, [])

  // Disable keyboard shortcuts when inputs are focused
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      )) {
        setKeyboardEnabled(false)
        console.log('🎹 Keyboard shortcuts disabled (input focused)')
      }
    }
    
    const handleFocusOut = (event: FocusEvent) => {
      // Re-enable after a short delay to prevent race conditions
      setTimeout(() => {
        setKeyboardEnabled(true)
        console.log('🎹 Keyboard shortcuts re-enabled (input unfocused)')
      }, 100)
    }
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  if (showResults) {
    return (
      <QuizResults
        questions={randomizedQuestions}
        userAnswers={userAnswers}
        onFinish={onComplete}
        topicId={topicId}
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
      {/* Topic Navigation - always visible */}
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
        {/* Progress bar - enhanced with animation - hidden on mobile */}
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

        {/* Question section - Apple style */}
        <div className="text-center space-y-8">
          {/* Question text and hint */}
          <div className="space-y-4">
            <MemoizedQuestionDisplay 
              question={currentQuestion} 
              showHint={showHint} 
            />
            
            {/* Timer and hint button */}
            <div className="flex items-center justify-center space-x-6 animate-in fade-in duration-300">
              {/* Timer - use key to force reset when question changes */}
              <QuestionTimer
                key={`timer-${currentQuestionIndex}`}
                initialTime={60}
                isActive={isTimerActive && !isAnswerSubmitted && !timeFrozen}
                onTimeUp={handleTimeUp}
              />
              
              <Button 
                variant="ghost" 
                onClick={() => setShowHint(!showHint)} 
                className={cn(
                  "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-light text-sm h-auto p-2 transition-all hover:scale-105",
                  showHint && "text-blue-600 dark:text-blue-400"
                )}
              >
                {showHint ? "Hide hint" : "Show hint"}
              </Button>
            </div>
          </div>

          {/* Question content - only show if answer not submitted */}
          {!isAnswerSubmitted && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderQuestion()}
            </div>
          )}

          {/* Feedback section using new component */}
          {isAnswerSubmitted && (
            <QuestionFeedbackDisplay
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              timeLeft={timeLeft}
              isLastQuestion={isLastQuestion}
              onNextQuestion={handleNextQuestion}
            />
          )}
        </div>

        {/* Action buttons - only show when answer not submitted (desktop only) */}
        {!isAnswerSubmitted && !isMobile && (
          <div className="space-y-6">
            {/* Boost Action Buttons */}
            <MemoizedBoostButtons
              boostEffects={currentBoostEffects}
              timeFrozen={timeFrozen}
              answerRevealUsed={answerRevealUsed}
              hasUsedSecondChance={hasUsedSecondChance}
              isAnswerSubmitted={isAnswerSubmitted}
              questionType={currentQuestion.question_type}
              onUseTimeFreeze={handleUseTimeFreeze}
              onUseAnswerReveal={handleUseAnswerReveal}
              onUseSecondChance={handleUseSecondChance}
            />
            
            {/* Main Action Buttons */}
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

        {/* Gamification display - enhanced animation */}
        {user && !isMobile && (
          <div className="fixed top-4 left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg z-50 animate-in slide-in-from-top duration-500">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Flame className={cn(
                  "h-4 w-4 text-orange-500 transition-all",
                  streak > 0 && "animate-pulse"
                )} />
                <span className="font-medium text-slate-900 dark:text-slate-100">{currentStreak}</span>
                <span className="text-slate-500 dark:text-slate-400">streak</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs transition-all hover:scale-105">
                  Level {currentLevel}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Debug panel - quiz info only (desktop only) */}
        {process.env.NODE_ENV === 'development' && !isMobile && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <div className="bg-black/80 text-white p-4 rounded-lg text-xs font-mono backdrop-blur-sm">
              <div className="text-xs font-bold mb-2">Quiz Debug:</div>
              <div>Selected: {selectedAnswer || 'None'}</div>
              <div>Submitted: {isAnswerSubmitted ? 'Yes' : 'No'}</div>
              <div>Timer: {timeLeft}s {timeFrozen && '(Frozen)'}</div>
              <div>Question: {currentQuestionIndex + 1}/{randomizedQuestions.length}</div>
              <div>Type: {currentQuestion?.question_type}</div>
              <div>Auto-play: {autoPlayEnabled ? 'On' : 'Off'}</div>
              <div>Streak: {currentStreak}</div>
              <div>Level: {currentLevel}</div>
              <div>Keyboard: {keyboardEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        )}

        {/* Enhanced keyboard shortcuts - only show when answer not submitted */}
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

        {/* Show next question shortcut when answer is submitted */}
        {isAnswerSubmitted && !isMobile && (
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in duration-300">
            <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
              Press <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">N</span> for next question
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar for Mobile - enhanced and larger */}
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
                data-answer-button
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
                data-next-button
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

      {/* Boost Command Bar - Floating */}
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