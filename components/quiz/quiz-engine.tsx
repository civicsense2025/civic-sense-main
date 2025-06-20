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
// Removed QuizDateNavigation - now using the new QuizNavigation component in the page layout
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb, SkipForward, ArrowRight, Flame, Snowflake, RotateCcw, Eye, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { quizAttemptOperations } from "@/lib/database"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from "@/hooks/useGamification"
import { usePremium } from "@/hooks/usePremium"
import type { BoostEffects } from "@/lib/game-boosts"
import { BoostManager } from "@/lib/game-boosts"
import { enhancedProgressOperations, updateEnhancedProgress } from "@/lib/enhanced-gamification"
import { useAnalytics, mapCategoryToAnalytics } from "@/utils/analytics"
import { supabase } from "@/lib/supabase"
import { SocialProofBubble } from "@/components/social-proof-bubble"
import { createRegularQuizProgress, type BaseQuizState } from "@/lib/progress-storage"
import { debug } from "@/lib/debug-config"

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
      debug.warn('quiz', `Duplicate question detected and removed:`, {
        topic_id: question.topic_id,
        question_number: question.question_number,
        question_preview: question.question.slice(0, 50) + '...'
      })
    }
  }
  
  debug.log('quiz', `Question validation: ${questions.length} input → ${uniqueQuestions.length} unique questions`)
  
  const contentSeen = new Set<string>()
  const finalQuestions = uniqueQuestions.filter(question => {
    const contentKey = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    if (contentSeen.has(contentKey)) {
      debug.warn('quiz', `Duplicate question content detected:`, question.question.slice(0, 50))
      return false
    }
    contentSeen.add(contentKey)
    return true
  })
  
  debug.log('quiz', `Final unique questions after content deduplication: ${finalQuestions.length}`)
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

// Debug Panel Component
const DebugPanel = memo(({
  selectedAnswer,
  isAnswerSubmitted,
  timeLeft,
  timeFrozen,
  currentQuestionIndex,
  totalQuestions,
  currentQuestion,
  getQuestionDifficulty,
  currentAttemptNumber,
  sessionAnalytics,
  isPremium,
  keyboardEnabled
}: {
  selectedAnswer: string | null
  isAnswerSubmitted: boolean
  timeLeft: number
  timeFrozen: boolean
  currentQuestionIndex: number
  totalQuestions: number
  currentQuestion: QuizQuestion
  getQuestionDifficulty: (question: QuizQuestion) => string
  currentAttemptNumber: number
  sessionAnalytics: any
  isPremium: boolean
  keyboardEnabled: boolean
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const dragRef = useRef<HTMLDivElement>(null)

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized)
    debug.toggleMinimized()
  }

  if (isMinimized) {
    return (
      <div 
        className="fixed top-4 right-4 z-50 cursor-pointer"
        onClick={handleMinimizeToggle}
      >
        <div className="bg-black/80 text-white p-2 rounded-lg text-xs font-mono backdrop-blur-sm hover:bg-black/90 transition-all">
          <div className="flex items-center gap-2">
            <span>🎯 Debug</span>
            <Maximize2 className="h-3 w-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={dragRef}
      className="fixed top-4 right-4 z-50 max-w-sm select-none"
      style={{ transform: `translate(${position.x - 16}px, ${position.y - 16}px)` }}
    >
      <div className="bg-black/80 text-white p-4 rounded-lg text-xs font-mono backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold">🎯 Quiz Debug</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => debug.showStatus()}
              className="text-white/60 hover:text-white text-xs"
              title="Show debug status in console"
            >
              ⚙️
            </button>
            <button
              onClick={handleMinimizeToggle}
              className="text-white/60 hover:text-white"
              title="Minimize debug panel"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <div>Selected: {selectedAnswer || 'None'}</div>
          <div>Submitted: {isAnswerSubmitted ? 'Yes' : 'No'}</div>
          <div>Timer: {timeLeft}s {timeFrozen && '(Frozen)'}</div>
          <div>Question: {currentQuestionIndex + 1}/{totalQuestions}</div>
          <div>Type: {currentQuestion?.question_type}</div>
          <div>Difficulty: {getQuestionDifficulty(currentQuestion)}</div>
          <div>Category: {currentQuestion?.category}</div>
          <div>Attempt: {currentAttemptNumber}</div>
          <div>Hints Used: {sessionAnalytics.hintsUsed}</div>
          <div>Boosts Used: {sessionAnalytics.boostsUsed.length}</div>
          <div>Premium: {isPremium ? 'Yes' : 'No'}</div>
          <div>Keyboard: {keyboardEnabled ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="text-xs text-white/60">
            Use window.debug in console for controls
          </div>
        </div>
      </div>
    </div>
  )
})

DebugPanel.displayName = 'DebugPanel'

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
  
  // Topic navigation is now handled by the new QuizNavigation component in the page layout
  
  // Enhanced question randomization with session uniqueness
  const randomizedQuestions = useMemo(() => {
    debug.log('quiz', '=== ENHANCED QUIZ ENGINE PROCESSING ===')
    debug.log('quiz', `Input questions for topic ${topicId}:`, questions.length)
    
    if (!questions || questions.length === 0) {
      debug.error('quiz', `No questions provided for topic ${topicId}`)
      return []
    }
    
    const validatedQuestions = validateAndDeduplicateQuestions(questions)
    
    if (validatedQuestions.length === 0) {
      debug.error('quiz', `All questions were duplicates or invalid for topic ${topicId}`)
      return []
    }
    
    const sessionSeed = `${Date.now()}-${user?.id || 'anonymous'}-${topicId}`
    debug.log('quiz', `Session seed for randomization: ${sessionSeed}`)
    
    // Multiple shuffle passes for better randomization
    let shuffled = validatedQuestions
    for (let i = 0; i < 3; i++) {
      shuffled = shuffleArray(shuffled)
    }
    
    debug.log('quiz', `Final randomized questions:`, shuffled.length)
    debug.log('quiz', `Question numbers:`, shuffled.map(q => q.question_number))
    debug.log('quiz', `Question types:`, shuffled.map(q => q.question_type))
    
    // Validate final questions
    const validQuestions = shuffled.filter(q => {
      const isValid = q.question && q.question_type && q.correct_answer
      if (!isValid) {
        debug.warn('quiz', `Invalid question filtered out:`, {
          topic_id: q.topic_id,
          question_number: q.question_number,
          has_question: !!q.question,
          has_type: !!q.question_type,
          has_answer: !!q.correct_answer
        })
      }
      return isValid
    })
    
    debug.log('quiz', `Valid questions after filtering: ${validQuestions.length}`)
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
  const [hasRestoredState, setHasRestoredState] = useState(false)

  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())

  // Initialize progress manager for regular quizzes
  const progressManager = createRegularQuizProgress(user?.id, undefined, topicId)

  // Generate session ID for state persistence
  const sessionId = useRef<string>(`quiz-${topicId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Convert quiz state to BaseQuizState
  const convertToBaseQuizState = (): BaseQuizState => ({
    sessionId: sessionId.current,
    quizType: 'regular_quiz',
    topicId,
    questions: randomizedQuestions,
    currentQuestionIndex,
    answers: userAnswers.reduce((acc, answer) => {
      acc[answer.questionId.toString()] = answer.answer
      return acc
    }, {} as { [questionId: string]: string }),
    streak: 0, // Regular quiz doesn't track streak in same way
    maxStreak: 0,
    startTime: quizStartTime,
    responseTimes: userAnswers.reduce((acc, answer) => {
      acc[answer.questionId.toString()] = answer.timeSpent
      return acc
    }, {} as { [questionId: string]: number }),
    savedAt: Date.now()
  })

  // Save quiz state
  const saveQuizState = () => {
    if (randomizedQuestions.length > 0 && userAnswers.length > 0) {
      const baseState = convertToBaseQuizState()
      progressManager.save(baseState)
    }
  }

  // Load quiz state
  const loadQuizState = (): boolean => {
    const baseState = progressManager.load()
    if (baseState && baseState.questions.length > 0) {
      setCurrentQuestionIndex(baseState.currentQuestionIndex)
      
      // Convert answers back to EnhancedUserAnswer format
      const restoredAnswers: EnhancedUserAnswer[] = Object.entries(baseState.answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
        isCorrect: false, // Will be recalculated
        timeSpent: baseState.responseTimes[questionId] || 30,
        hintUsed: false,
        boostUsed: null
      }))
      
      setUserAnswers(restoredAnswers)
      sessionId.current = baseState.sessionId
      return true
    }
    return false
  }

  // Clear quiz state
  const clearQuizState = () => {
    progressManager.clear()
  }
  
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
  
  // Topic navigation is now handled by the new QuizNavigation component
  // No need for handleTopicNavigate since navigation is external

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

  // Initialize quiz state and restore progress
  useEffect(() => {
    const initializeQuiz = async () => {
      debug.log('quiz', 'Initializing quiz...', { 
        hasRestoredState, 
        topicId,
        userId: user?.id || 'guest',
        questionsLength: randomizedQuestions.length
      })
      
      // First, try to restore saved state (only once)
      if (!hasRestoredState && randomizedQuestions.length > 0) {
        const restored = loadQuizState()
        if (restored) {
          debug.log('quiz', 'Restored quiz state')
          setHasRestoredState(true)
          
          // Reset UI state for restored session
          setShowFeedback(false)
          setIsAnswerSubmitted(false)
          setSelectedAnswer(null)
          setShowHint(false)
          
          return
        } else {
          debug.log('quiz', 'No valid saved quiz state found')
          setHasRestoredState(true) // Mark as checked to prevent re-checking
        }
      }

      // Initialize boost system and load user XP for authenticated users
      if (user) {
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
      }
    }

    initializeQuiz()
  }, [user, topicId, boostManager, hasRestoredState, randomizedQuestions.length])

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
    setSelectedAnswer("timeout") // Set selected answer to indicate timeout
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
    
    // Save state after answering
    setTimeout(() => saveQuizState(), 100)
    
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
    // Clear saved state on completion
    clearQuizState()
    
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

    // Prepare question responses for skill tracking and pending attribution
    const questionResponses = userAnswers.map(answer => {
      const question = randomizedQuestions.find(q => q.question_number === answer.questionId)
      return {
        questionId: answer.questionId.toString(),
        category: question?.category || 'General',
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      }
    })

    // Update enhanced gamification progress
    if (user) {
      try {
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
    } else {
      // User is not logged in - store quiz result for pending attribution
      try {
        // Import the pending attribution module dynamically to avoid SSR issues
        const { pendingUserAttribution } = await import('@/lib/pending-user-attribution')
        
        const sessionId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        pendingUserAttribution.storePendingQuiz({
          topicId,
          sessionId,
          completedAt: Date.now(),
          score: scorePercentage,
          correctAnswers,
          totalQuestions,
          timeSpentSeconds: totalTimeSeconds,
          questionResponses
        })

        console.log('📝 Stored quiz result for pending attribution')
      } catch (error) {
        console.error('Error storing pending quiz result:', error)
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

  // Enhanced keyboard shortcuts - using refs to avoid stale closures
  const keyboardStateRef = useRef({
    keyboardEnabled: true,
    isAnswerSubmitted: false,
    selectedAnswer: null as string | null,
    currentQuestion: null as any,
    showHint: false
  })

  // Update refs when state changes
  useEffect(() => {
    keyboardStateRef.current = {
      keyboardEnabled,
      isAnswerSubmitted,
      selectedAnswer,
      currentQuestion,
      showHint
    }
  }, [keyboardEnabled, isAnswerSubmitted, selectedAnswer, currentQuestion, showHint])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const state = keyboardStateRef.current
    
    if (!state.keyboardEnabled) return
    
    const target = event.target as HTMLElement
    if (target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('[contenteditable]')
    )) {
      return
    }

    if (state.isAnswerSubmitted && event.key !== ' ') return

    console.log('🎹 Enhanced key pressed:', event.key, 'Answer submitted:', state.isAnswerSubmitted, 'Selected answer:', state.selectedAnswer)

    switch (event.key.toLowerCase()) {
      case 'enter':
        if (!state.isAnswerSubmitted && state.selectedAnswer) {
          event.preventDefault()
          event.stopPropagation()
          console.log('⏎ Submitting answer via Enter key:', state.selectedAnswer)
          handleSubmitAnswer()
        }
        break
        
      case ' ':
        event.preventDefault()
        event.stopPropagation()
        setShowHint(prev => {
          const newShowHint = !prev
          if (newShowHint && state.currentQuestion) {
            updateSessionAnalytics({ hintsUsed: sessionAnalytics.hintsUsed + 1 })
          }
          console.log('💡 Enhanced hint toggled via Space:', newShowHint ? 'shown' : 'hidden')
          return newShowHint
        })
        break
        
      case '1':
      case '2':
      case '3':
      case '4':
        if (state.currentQuestion?.question_type === 'multiple_choice' && !state.isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          const optionIndex = parseInt(event.key) - 1
          const options = [
            state.currentQuestion.option_a,
            state.currentQuestion.option_b,
            state.currentQuestion.option_c,
            state.currentQuestion.option_d
          ].filter(Boolean)
          
          if (optionIndex < options.length) {
            const optionId = `option_${String.fromCharCode(97 + optionIndex)}`
            console.log('🔢 Selecting option via keyboard:', optionId)
            handleAnswerSelect(optionId)
          }
        }
        break
        
      case 't':
        if (state.currentQuestion?.question_type === 'true_false' && !state.isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('✅ Selecting True via keyboard')
          handleAnswerSelect('true')
        }
        break
        
      case 'f':
        if (state.currentQuestion?.question_type === 'true_false' && !state.isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('❌ Selecting False via keyboard')
          handleAnswerSelect('false')
        }
        break
        
      case 's':
        if (!event.ctrlKey && !event.metaKey && !state.isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('⏭️ Skipping question via keyboard')
          handleSkipQuestion()
        }
        break
        
      case 'n':
        if (state.isAnswerSubmitted) {
          event.preventDefault()
          event.stopPropagation()
          console.log('➡️ Next question via keyboard')
          handleNextQuestion()
        }
        break
    }
  }, [handleAnswerSelect, handleSubmitAnswer, handleSkipQuestion, handleNextQuestion, updateSessionAnalytics, sessionAnalytics.hintsUsed])

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
  }, [handleKeyDown])

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
    
    const initializeAttempt = async () => {
      if (user && randomizedQuestions.length > 0) {
        attemptCreatedRef.current = true
        try {
          // First, check for existing incomplete attempt for this topic
          const { data: existingAttempt } = await supabase
            .from('user_quiz_attempts')
            .select('id, started_at, created_at')
            .eq('user_id', user.id)
            .eq('topic_id', topicId)
            .eq('is_completed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (existingAttempt) {
            // Resume existing attempt
            console.log(`🔄 Resuming existing quiz attempt: ${existingAttempt.id}`)
            setResumedAttemptId(existingAttempt.id)
            
            // Update the attempt with current question count in case it changed
            await supabase
              .from('user_quiz_attempts')
              .update({
                total_questions: randomizedQuestions.length,
                started_at: new Date().toISOString() // Update start time for session continuity
              })
              .eq('id', existingAttempt.id)
              
          } else {
            // Create new attempt using proper database operations
            console.log(`📝 Creating new quiz attempt for user ${user.id}, topic ${topicId}`)
            const newAttempt = await quizAttemptOperations.start(
              user.id,
              topicId,
              randomizedQuestions.length
            )
            
            console.log(`✅ Created new enhanced quiz attempt: ${newAttempt.id}`)
            setResumedAttemptId(newAttempt.id)
          }
        } catch (err) {
          // Enhanced error handling for RLS policy violations and other database issues
          if (err && typeof err === 'object') {
            const dbError = err as any
            
            // Handle RLS policy violations gracefully
            if (dbError.code === '42501' || dbError.message?.includes('row-level security policy')) {
              console.warn('🔒 RLS policy violation when creating quiz attempt - continuing with quiz anyway:', {
                code: dbError.code,
                message: dbError.message,
                userId: user.id,
                topicId,
                table: dbError.message?.includes('pod_analytics') ? 'pod_analytics' : 'unknown'
              })
              
              // Quiz can continue without analytics - this is not a blocking error
              // Don't set attemptCreatedRef.current = false to prevent retries
              return
            }
            
            // Handle other database errors
            if (dbError.code) {
              console.error('🔥 Database error creating quiz attempt:', {
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
                hint: dbError.hint,
                userId: user.id,
                topicId,
                questionCount: randomizedQuestions.length
              })
            } else {
              console.error('❌ Unexpected error creating quiz attempt:', {
                error: err,
                userId: user.id,
                topicId,
                questionCount: randomizedQuestions.length,
                errorType: typeof err,
                errorMessage: err.toString()
              })
            }
          } else {
            console.error('💥 Non-object error creating quiz attempt:', {
              error: err,
              userId: user.id,
              topicId,
              questionCount: randomizedQuestions.length
            })
          }
          
          // Only allow retry for non-RLS errors
          // The core quiz functionality should not be blocked by analytics issues
          attemptCreatedRef.current = false
        }
      }
    }
    
    initializeAttempt()
  }, [user, topicId, randomizedQuestions.length])

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
      {/* Topic Navigation is now handled by the new QuizNavigation component in the page layout */}
      
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

          {/* Social Proof Bubble - Only shows when real data is available */}
          {currentQuestion && !isAnswerSubmitted && (
            <div className={cn(
              "animate-in fade-in slide-in-from-bottom-2 duration-700",
              isMobile ? "mt-3" : "mt-4"
            )}>
              <SocialProofBubble
                questionId={`${currentQuestion.topic_id}-${currentQuestion.question_number}`}
                showDelay={3000}
                position="inline"
                variant="minimal"
                className=""
              />
            </div>
          )}

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
            {/* Boost buttons - TEMPORARILY DISABLED */}
            {false && (currentBoostEffects.timeFreezeAvailable || 
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



        {/* Enhanced debug panel with minimize toggle */}
        {process.env.NODE_ENV === 'development' && !isMobile && debug.isEnabled('quiz') && (
          <DebugPanel
            selectedAnswer={selectedAnswer}
            isAnswerSubmitted={isAnswerSubmitted}
            timeLeft={timeLeft}
            timeFrozen={timeFrozen}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={randomizedQuestions.length}
            currentQuestion={currentQuestion}
            getQuestionDifficulty={getQuestionDifficulty}
            currentAttemptNumber={currentAttemptNumber}
            sessionAnalytics={sessionAnalytics}
            isPremium={isPremium}
            keyboardEnabled={keyboardEnabled}
          />
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

      {/* Enhanced Boost Command Bar - TEMPORARILY DISABLED */}
      {false && user && (
        <BoostCommandBar
          userXP={userXP}
          onXPChanged={setUserXP}
          onBoostActivated={handleBoostActivated}
        />
      )}
    </div>
  )
}