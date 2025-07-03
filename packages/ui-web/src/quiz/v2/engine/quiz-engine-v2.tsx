"use client"

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
// import useUIStrings from '@civicsense/shared/useUIStrings' // Temporarily removed
import type { QuizResults, QuizTopic, QuizQuestion, QuizGameMode, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '@civicsense/shared/types/quiz'
import { MultipleChoiceQuestion as MultipleChoiceQuestionComponent } from "../../question-types/multiple-choice"
import { TrueFalseQuestion as TrueFalseQuestionComponent } from "../../question-types/true-false"
import { ShortAnswerQuestion as ShortAnswerQuestionComponent, checkAnswerIntelligently, checkAnswerDetailed } from "../../question-types/short-answer"
import { FillInBlankQuestion } from "../../question-types/fill-in-blank"
import { MatchingQuestion } from "../../question-types/matching"
import { OrderingQuestion } from "../../question-types/ordering"
import { CrosswordQuestion } from "../../question-types/crossword"
import { QuestionFeedbackDisplay } from "../../question-feedback-display"
import { QuestionTimer, useQuestionTimer } from "../../question-timer"
import { QuizResults as QuizResultsComponent } from "../../quiz-results"
import { useKeyboardShortcuts, createQuizShortcuts, KeyboardShortcutsHelp } from '@civicsense/shared/keyboard-shortcuts'
import { AdminEditPanel } from "../../admin-edit-panel"
import { useAdmin } from '@civicsense/shared/admin-access'

import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import { Clock, Lightbulb, SkipForward, ArrowRight, Flame, Snowflake, RotateCcw, Eye, Minimize2, Maximize2, Edit2 } from "lucide-react"
import { cn } from "../../utils"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from '@civicsense/shared/useGamification'
import { usePremium } from '@civicsense/shared/usePremium'
import { useAnalytics, mapCategoryToAnalytics } from '@/lib/analytics/analytics'
import { supabase } from "../lib/supabase/client"
import { debug } from '@civicsense/shared/debug-config'
import { useGuestAccess } from '@civicsense/shared/useGuestAccess'

// Import game modes
import { getGameMode, type GameModeId, type StandardModeSettings, type AIBattleSettings, type PVPSettings } from '../modes'

// Helper function to safely get question options
const getQuestionOptions = (question: QuizQuestion): string[] => {
  if (!question) return []
  
  if ('options' in question && Array.isArray(question.options)) {
    return question.options
  }
  
  // Handle specific question types that might have options stored differently
  if (question.type === 'multiple_choice' && 'option_a' in question) {
    const options = []
    if (question.option_a) options.push(question.option_a)
    if (question.option_b) options.push(question.option_b)
    if (question.option_c) options.push(question.option_c)
    if (question.option_d) options.push(question.option_d)
    return options
  }
  
  // For true/false questions
  if (question.type === 'true_false') {
    return ['true', 'false']
  }
  
  // For other question types that don't have options
  return []
}

interface QuizEngineV2Props {
  // For single topic mode (backwards compatibility)
  topicId?: string
  questions?: QuizQuestion[]
  currentTopic?: QuizTopic | null
  
  // For multi-topic mode (future)
  topics?: string[]
  allQuestions?: Record<string, QuizQuestion[]>
  
  // Mode and settings
  mode?: GameModeId | QuizGameMode // Support both old and new mode types
  settings?: StandardModeSettings | AIBattleSettings | PVPSettings
  
  // Callbacks
  onComplete: (results: QuizResults) => void
  onExit?: () => void
  
  // Auth
  userId?: string
  guestToken?: string
  resumedAttemptId?: string
  
  // Learning context
  podId?: string
  classroomCourseId?: string
  classroomAssignmentId?: string
  cleverSectionId?: string
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
  console.log('🔍 validateAndDeduplicateQuestions: Starting with', questions.length, 'questions')
  
  const seen = new Set<string>()
  const uniqueQuestions: QuizQuestion[] = []
  
  for (const question of questions) {
    if (!question || !question.question || !question.type) {
      console.warn('⚠️ Skipping invalid question:', {
        hasQuestion: !!question,
        hasQuestionText: !!question?.question,
        hasType: !!question?.type,
        questionNumber: question?.question_number
      })
      continue
    }
    
    const questionContent = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    const options = getQuestionOptions(question)
    const questionKey = [
      question.topic_id || '',
      question.question_number || 0,
      question.type,
      questionContent.slice(0, 100),
      question.correct_answer || '',
      ...options.slice(0, 2)
    ].join('|')
    
    if (!seen.has(questionKey)) {
      seen.add(questionKey)
      uniqueQuestions.push(question)
    } else {
      console.warn('⚠️ Duplicate question detected and removed:', {
        topic_id: question.topic_id,
        question_number: question.question_number,
        question_preview: question.question.slice(0, 50) + '...'
      })
    }
  }
  
  console.log('✅ Question validation: ', questions.length, 'input →', uniqueQuestions.length, 'unique questions')
  
  const contentSeen = new Set<string>()
  const finalQuestions = uniqueQuestions.filter(question => {
    const contentKey = question.question.toLowerCase().replace(/\s+/g, ' ').trim()
    if (contentSeen.has(contentKey)) {
      console.warn('⚠️ Duplicate question content detected:', question.question.slice(0, 50))
      return false
    }
    contentSeen.add(contentKey)
    return true
  })
  
  console.log('✅ Final unique questions after content deduplication:', finalQuestions.length)
  
  if (finalQuestions.length === 0 && questions.length > 0) {
    console.error('❌ CRITICAL: All questions were filtered out!')
    console.error('❌ Original questions sample:', questions.slice(0, 3).map(q => ({
      question_number: q.question_number,
      type: q.type,
      hasQuestion: !!q.question,
      hasCorrectAnswer: !!q.correct_answer,
      question_preview: q.question?.slice(0, 50)
    })))
  }
  
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
      {question.question}
    </h1>
    
    {showHint && question.hint && (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="rounded-lg p-6 border border-slate-100 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
            💡 {question.hint}
          </p>
        </div>
      </div>
    )}
  </>
))

MemoizedQuestionDisplay.displayName = 'MemoizedQuestionDisplay'

export function QuizEngineV2({
  topicId,
  questions: singleTopicQuestions,
  topics,
  allQuestions,
  mode = 'standard',
  settings,
  onComplete,
  onExit,
  userId,
  guestToken,
  resumedAttemptId,
  podId,
  classroomCourseId,
  classroomAssignmentId,
  cleverSectionId
}: QuizEngineV2Props) {
  console.log('🚀 V2 Engine: Component mounting...', {
    topicId,
    questionsReceived: singleTopicQuestions?.length,
    mode,
    userId: userId ? 'provided' : 'none',
    guestToken: guestToken ? 'provided' : 'none'
  })
  
  // Temporary static strings for build fix
  const uiStrings = {
    quiz: {
      questionsComplete: "Quiz Complete",
      noQuestionsAvailable: "No questions available",
      backToTopics: "Back to Topics"
    }
  }
  const router = useRouter()
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const { isAdmin } = useAdmin()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  
  // Analytics integration
  const { trackQuiz, trackGameification, trackEngagement } = useAnalytics()
  
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Enhanced gamification integration
  const { updateProgress, currentStreak, currentLevel } = useGamification()
  
  // Map old mode names to new ones if needed
  const mappedMode = (mode === 'standard' || mode === 'ai-battle' || mode === 'pvp') 
    ? mode as GameModeId 
    : 'standard' // Default to standard for all other modes
  
  console.log('🎮 V2 Engine: Mode mapping:', { originalMode: mode, mappedMode })
  
  // Get game mode (with fallback to standard)
  const gameMode = getGameMode(mappedMode) || getGameMode('standard')
  const modeSettings = settings || gameMode?.defaultSettings
  
  console.log('⚙️ V2 Engine: Game mode settings:', { gameMode: mappedMode, settings: modeSettings })
  
  // Process questions
  const processedQuestions = useMemo(() => {
    console.log('🔍 V2 Engine: Processing questions...', { 
      singleTopicQuestions: singleTopicQuestions?.length,
      topics: topics?.length,
      allQuestions: allQuestions ? Object.keys(allQuestions).length : 0
    })
    
    if (singleTopicQuestions) {
      console.log('📝 V2 Engine: Processing single topic questions:', singleTopicQuestions.length)
      console.log('📝 V2 Engine: Sample questions:', singleTopicQuestions.slice(0, 3).map(q => ({
        question_number: q.question_number,
        type: q.type,
        question_preview: q.question?.slice(0, 50) + '...',
        hasCorrectAnswer: !!q.correct_answer,
        valid: !!q.question && !!q.type
      })))
      
      const validatedQuestions = validateAndDeduplicateQuestions(singleTopicQuestions)
      console.log('✅ V2 Engine: Processed questions:', {
        input: singleTopicQuestions.length,
        output: validatedQuestions.length,
        sample: validatedQuestions.slice(0, 3).map(q => ({
          question_number: q.question_number,
          type: q.type,
          valid: !!q.question && !!q.type
        }))
      })
      
      if (validatedQuestions.length === 0) {
        console.error('❌ V2 Engine: CRITICAL - All questions filtered out during validation!')
        console.error('❌ V2 Engine: Original questions details:', singleTopicQuestions.map(q => ({
          question_number: q.question_number,
          type: q.type,
          hasQuestion: !!q.question,
          hasCorrectAnswer: !!q.correct_answer,
          questionLength: q.question?.length,
          topicId: q.topic_id
        })))
      }
      
      return validatedQuestions
    }
    
    // Future: multi-topic support
    if (topics && allQuestions) {
      console.log('📝 V2 Engine: Processing multi-topic questions...')
      let combined: QuizQuestion[] = []
      for (const topic of topics) {
        const topicQs = allQuestions[topic] || []
        combined = [...combined, ...topicQs]
      }
      const validated = validateAndDeduplicateQuestions(combined)
      console.log('✅ V2 Engine: Multi-topic processed:', validated.length, 'questions')
      return validated
    }
    
    console.warn('⚠️ V2 Engine: No questions to process')
    return []
  }, [singleTopicQuestions, topics, allQuestions])
  
  console.log('📊 V2 Engine: Final processed questions count:', processedQuestions.length)
  
  // Handle case where no valid questions are available
  if (processedQuestions.length === 0) {
    console.error('❌ V2 Engine: No questions available after processing')
    console.error('❌ V2 Engine: Debug info:', {
      rawQuestionsReceived: singleTopicQuestions?.length || 0,
      topicId,
      mode,
      hasTopics: !!topics,
      hasAllQuestions: !!allQuestions
    })
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">{uiStrings.quiz.questionsComplete}</h1>
          <p className="text-muted-foreground mb-6">
            {uiStrings.quiz.noQuestionsAvailable}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Debug: Received {singleTopicQuestions?.length || 0} raw questions, but none passed validation.
          </p>
          <Button 
            onClick={() => {
              console.log('🔙 User clicked back to topics - NOT calling onComplete')
              if (onExit) {
                onExit()
              } else {
                router.back()
              }
            }} 
            className="rounded-xl"
          >
            {uiStrings.quiz.backToTopics}
          </Button>
        </div>
      </div>
    )
  }
  
  console.log('✅ V2 Engine: Questions validated, proceeding with quiz setup...')
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<EnhancedUserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<QuizResults | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())
  const [isMobile, setIsMobile] = useState(false)
  
  const currentQuestion = processedQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === processedQuestions.length - 1
  const progress = ((currentQuestionIndex + 1) / processedQuestions.length) * 100

  console.log('📊 V2 Engine: Current state:', {
    currentQuestionIndex,
    totalQuestions: processedQuestions.length,
    currentQuestionNumber: currentQuestion?.question_number,
    currentQuestionType: currentQuestion?.type,
    isAnswerSubmitted,
    selectedAnswer,
    showResults,
    isFinishing
  })

  // Enhanced difficulty detection
  const getQuestionDifficulty = useCallback((question: QuizQuestion): 'easy' | 'medium' | 'hard' => {
    if (question.tags?.includes('advanced') || question.tags?.includes('expert')) return 'hard'
    if (question.tags?.includes('intermediate')) return 'medium'
    if (question.tags?.includes('basic') || question.tags?.includes('beginner')) return 'easy'
    
    const questionLength = question.question.length
    const hasMultipleChoices = question.type === 'multiple_choice' && 
                              getQuestionOptions(question).length >= 4
    
    if (questionLength > 200 || !hasMultipleChoices) return 'hard'
    if (questionLength > 100) return 'medium'
    return 'easy'
  }, [])
  
  // Mobile detection
  useEffect(() => {
    console.log('📱 V2 Engine: Setting up mobile detection...')
    let timeoutId: number
    
    const checkMobile = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        const isMobileNow = window.innerWidth < 768
        console.log('📱 V2 Engine: Mobile detection:', isMobileNow)
        setIsMobile(isMobileNow)
      }, 150)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Timer integration based on mode settings
  const shouldUseTimer = (modeSettings as StandardModeSettings)?.timeLimit !== null && 
                        (modeSettings as StandardModeSettings)?.timeLimit !== undefined
  const initialTime = (modeSettings as StandardModeSettings)?.timeLimit || 60

  console.log('⏰ V2 Engine: Timer setup:', { shouldUseTimer, initialTime, modeSettings })

  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer({
    initialTime: shouldUseTimer ? initialTime : 0,
    onTimeUp: shouldUseTimer ? handleTimeUp : undefined,
    frozen: false
  })
  
  // Handle time up
  function handleTimeUp() {
    console.log('⏰ V2 Engine: Time up triggered')
    if (!shouldUseTimer) return
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
      difficulty,
      category: currentQuestion.category,
      attemptNumber: 1
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setSelectedAnswer("timeout")
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  function handleSkipQuestion() {
    console.log('⏭️ V2 Engine: Skip question triggered')
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
      difficulty,
      category: currentQuestion.category,
      attemptNumber: 1
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setSelectedAnswer("skipped")
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  // Handle answer selection
  function handleAnswerSelect(answer: string) {
    console.log('🎯 V2 Engine: Answer selected:', answer)
    if (isAnswerSubmitted || !currentQuestion) return
    setSelectedAnswer(answer)
  }

  // Submit answer with enhanced feedback
  function handleSubmitAnswer() {
    console.log('📤 V2 Engine: Submit answer triggered:', { selectedAnswer, currentQuestion: currentQuestion?.question_number })
    if (!selectedAnswer || !currentQuestion || isAnswerSubmitted) return

    console.log('📤 Submitting answer:', selectedAnswer)
    setIsAnswerSubmitted(true)
    stopTimer()
    
    // Determine if answer is correct
    let isCorrect = false
    if (currentQuestion.type === 'short_answer') {
      isCorrect = checkAnswerIntelligently(selectedAnswer, currentQuestion.correct_answer)
    } else if (currentQuestion.type === 'true_false') {
      isCorrect = selectedAnswer.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
    } else {
      isCorrect = selectedAnswer === currentQuestion.correct_answer
    }
    
    console.log('✅ V2 Engine: Answer evaluation:', { 
      selectedAnswer, 
      correctAnswer: currentQuestion.correct_answer, 
      isCorrect,
      questionType: currentQuestion.type
    })
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const difficulty = getQuestionDifficulty(currentQuestion)
    
    const newAnswer: EnhancedUserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
      hintUsed: showHint,
      difficulty,
      category: currentQuestion.category,
      attemptNumber: 1
    }
    
    setUserAnswers(prev => {
      const updated = [...prev, newAnswer]
      console.log('📊 V2 Engine: Updated user answers:', updated.length, 'total answers')
      return updated
    })
    setShowFeedback(true)
    
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    // Enhanced tracking
    trackQuiz.questionAnswered({
      question_id: `${topicId}-${currentQuestion.question_number}`,
      question_category: currentQuestion?.category || 'general',
      answer_correct: isCorrect,
      response_time_seconds: timeSpent,
      attempt_number: 1,
      hint_used: showHint,
      boost_active: null,
      confidence_level: isCorrect ? (timeSpent < 10 ? 5 : timeSpent < 30 ? 4 : 3) : 2
    })
    
    console.log('🎮 Question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      difficulty,
      isCorrect,
      timeSpent,
      hintUsed: showHint
    })
    
    // Auto-play explanation
    if (autoPlayEnabled && currentQuestion?.explanation) {
    setTimeout(() => {
        try {
          playText(currentQuestion.explanation || '', { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play explanation failed:', error)
        }
      }, 800)
    }
  }

  const handleNextQuestion = () => {
      if (currentQuestionIndex < processedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswerSubmitted(false)
      resetTimer()
      setShowHint(false)
      setQuestionStartTime(Date.now())
      setShowFeedback(false)
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleFinishQuiz()
      }
  }

  // Calculate quiz results
  const calculateResults = useCallback((userAnswers: EnhancedUserAnswer[], questions: QuizQuestion[]): QuizResults => {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length
    const incorrectAnswers = userAnswers.length - correctAnswers
    const totalQuestions = questions.length
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const totalTimeSpent = userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)
    
    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      score,
      timeTaken: totalTimeSpent,
      timeSpentSeconds: totalTimeSpent,
      questions: questions.map((question, index) => {
        const userAnswer = userAnswers.find(answer => answer.questionId === question.question_number)
        return {
          question,
          userAnswer: userAnswer?.answer || '',
          isCorrect: userAnswer?.isCorrect || false
        }
      })
    }
  }, [])

  async function handleFinishQuiz() {
    console.log('🎯 handleFinishQuiz called')

    if (isFinishing) {
      console.log('⏸️ Quiz finish already in progress, skipping')
      return
    }

    if (results) {
      console.log('✅ Quiz results already exist, showing results screen')
      setShowResults(true)
      return
    }

    setIsFinishing(true)
    console.log('🚀 Starting quiz completion process...')

    try {
      const calculatedResults = calculateResults(userAnswers, processedQuestions)
      console.log('✅ Results calculated successfully:', calculatedResults)
      
      setResults(calculatedResults)
      onComplete(calculatedResults)
      setShowResults(true)

    } catch (error) {
      console.error("❌ Error finishing quiz:", error)
      setError("Failed to complete quiz. Please try again.")
    } finally {
      setIsFinishing(false)
    }
  }

  // Reset question state when moving to next question
  useEffect(() => {
    console.log('🔄 Resetting question state for question index:', currentQuestionIndex)
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowHint(false)
    setShowFeedback(false)
    setQuestionStartTime(Date.now())
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

  // Enhanced keyboard shortcuts using the new utility
  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (isAnswerSubmitted || !currentQuestion) return
    
    const options = getQuestionOptions(currentQuestion)
    
    if (optionIndex < options.length) {
      if (currentQuestion.type === 'multiple_choice') {
        handleAnswerSelect(options[optionIndex])
      } else if (currentQuestion.type === 'true_false') {
        handleAnswerSelect(optionIndex === 0 ? 'True' : 'False')
      } else {
        handleAnswerSelect(options[optionIndex])
      }
    }
  }, [isAnswerSubmitted, currentQuestion])

  const handleToggleHint = useCallback(() => {
    setShowHint(prev => !prev)
  }, [])

  const quizShortcuts = useMemo(() => createQuizShortcuts({
    onSelectOption: handleOptionSelect,
    onSelectTrue: () => handleAnswerSelect('true'),
    onSelectFalse: () => handleAnswerSelect('false'),
    onSubmitAnswer: handleSubmitAnswer,
    onSkipQuestion: handleSkipQuestion,
    onNextQuestion: handleNextQuestion,
    onToggleHint: handleToggleHint,
    currentQuestion,
    isAnswerSubmitted,
    selectedAnswer
  }), [
    handleOptionSelect,
    handleSubmitAnswer,
    handleSkipQuestion,
    handleToggleHint,
    currentQuestion,
    isAnswerSubmitted,
    selectedAnswer
  ])

  const { state: keyboardState } = useKeyboardShortcuts(quizShortcuts, {
    enableLogging: process.env.NODE_ENV === 'development',
    autoDisableOnInput: true,
    captureEvents: true
  })

  if (showResults) {
    return (
      <QuizResultsComponent
        userAnswers={userAnswers}
        questions={processedQuestions}
        onFinish={onComplete}
        topicId={topicId || ''}
        resumedAttemptId={resumedAttemptId}
      />
    )
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceQuestionComponent
            question={currentQuestion as any}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "true_false":
        return (
          <TrueFalseQuestionComponent
            question={currentQuestion as any}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "short_answer":
        return (
          <ShortAnswerQuestionComponent
            question={currentQuestion as any}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "fill_in_blank":
        return (
          <FillInBlankQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "matching":
        return (
          <MatchingQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "ordering":
        return (
          <OrderingQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
    )
      case "crossword":
        return (
          <CrosswordQuestion
            question={currentQuestion}
            onAnswer={handleAnswerSelect}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      default:
        return <div>Unsupported question type: {currentQuestion.type}</div>
    }
  }

  // Add XP calculation function
  const calculateXpGained = () => {
    if (!isAnswerSubmitted || !selectedAnswer || !currentQuestion) return 0
    
    let xp = 10
    const isAnswerCorrect = selectedAnswer === currentQuestion.correct_answer

    if (isAnswerCorrect) {
      xp += 20
      if (timeLeft > 45) {
        xp += 10
      }
    }

    return xp
  }

  const [showAdminEdit, setShowAdminEdit] = useState(false)
  
  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-900">
          <div className={cn(
        "max-w-4xl mx-auto space-y-6",
        isMobile ? "px-3 py-4 pb-20" : "px-6 py-8 space-y-12"
      )}>
        {/* Question number and timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Question {currentQuestionIndex + 1}/{processedQuestions.length}
            </span>
            {/* Streak indicator */}
            {user && currentStreak > 0 && (
              <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                <Flame className="h-3 w-3 text-orange-500" />
                <span>{currentStreak}</span>
          </div>
        )}
      </div>
      
          {shouldUseTimer && (
            <QuestionTimer
              key={`timer-${currentQuestionIndex}`}
              initialTime={initialTime}
              isActive={isTimerActive && !isAnswerSubmitted}
              onTimeUp={handleTimeUp}
            />
          )}
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
                onClick={handleToggleHint} 
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
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderQuestion()}
                  </div>
          )}

          {isAnswerSubmitted && (
            <div className="space-y-6">
              <QuestionFeedbackDisplay
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                timeLeft={timeLeft}
                isLastQuestion={isLastQuestion}
                onNextQuestion={handleNextQuestion}
                xpGained={calculateXpGained()}
              />
                </div>
          )}
        </div>
        
        {/* Enhanced action buttons */}
        {!isAnswerSubmitted && !isMobile && (
          <div className="space-y-6">
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

        {/* Enhanced keyboard shortcuts help */}
        {!isMobile && (
          <KeyboardShortcutsHelp
            groups={quizShortcuts}
            currentState={keyboardState}
          />
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
      
      {/* Admin Edit Panel */}
      {isAdmin && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="fixed bottom-4 right-4 z-50"
            onClick={() => setShowAdminEdit(!showAdminEdit)}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {showAdminEdit ? "Hide Edit" : "Edit Question"}
          </Button>
          
          {showAdminEdit && (
            <AdminEditPanel
              question={processedQuestions[currentQuestionIndex]}
              topicId={topicId || ''}
              onQuestionUpdate={() => {}}
            />
          )}
        </>
      )}
    </div>
  )
} 