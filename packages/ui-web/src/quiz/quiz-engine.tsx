"use client"

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import type { QuizResults, QuizTopic, QuizQuestion, QuizGameMode, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '@civicsense/shared/types/quiz'
import type { Question } from '@civicsense/shared/types/key-takeaways'
import { DEFAULT_MODE_CONFIGS, type QuizModeConfig } from '@civicsense/shared/quiz-mode-config'
import { MultipleChoiceQuestion as MultipleChoiceQuestionComponent } from "./question-types/multiple-choice"
import { TrueFalseQuestion as TrueFalseQuestionComponent } from "./question-types/true-false"
import { ShortAnswerQuestion as ShortAnswerQuestionComponent, checkAnswerIntelligently, checkAnswerDetailed } from "./question-types/short-answer"
import { FillInBlankQuestion } from "./question-types/fill-in-blank"
import { MatchingQuestion } from "./question-types/matching"
import { OrderingQuestion } from "./question-types/ordering"
import { CrosswordQuestion } from "./question-types/crossword"
import { QuestionFeedbackDisplay } from "./question-feedback-display"
import { QuestionTimer, useQuestionTimer } from "./question-timer"
import { BoostCommandBar } from "./boost-command-bar"
import { QuizResults as QuizResultsComponent } from "./quiz-results"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useKeyboardShortcuts, createQuizShortcuts, KeyboardShortcutsHelp } from '@civicsense/shared/keyboard-shortcuts'
import { AdminEditPanel } from "./admin-edit-panel"
import { useAdmin } from '@civicsense/shared/admin-access'

import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import { Clock, Lightbulb, SkipForward, ArrowRight, Flame, Snowflake, RotateCcw, Eye, Minimize2, Maximize2, Edit2 } from "lucide-react"
import { cn } from "../../utils"
import { enhancedQuizDatabase } from '@civicsense/shared/quiz-database'
import { quizAttemptOperations } from '@civicsense/shared/database'
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from '@civicsense/shared/useGamification'
import { usePremium } from '@civicsense/shared/usePremium'
import type { BoostEffects } from '@civicsense/shared/game-boosts'
import { useFeatureFlag } from '@civicsense/shared/useFeatureFlags'
import { BoostManager } from '@civicsense/shared/game-boosts'
import { enhancedProgressOperations, updateEnhancedProgress } from '@civicsense/shared/lib/enhanced-gamification'
import { useAnalytics, mapCategoryToAnalytics } from '@/lib/analytics/analytics'
import { supabase } from "../lib/supabase/client"
import { SocialProofBubble } from "@/components/social-proof-bubble"
import { createRegularQuizProgress, type BaseQuizState } from '@civicsense/shared/progress-storage'
import { debug } from '@civicsense/shared/debug-config'
import { QuizLoadingScreen } from "./quiz-loading-screen"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from '@civicsense/shared/data-service'
import { PodQuizIntegration, createQuizCompletionData, extractPodIdFromQuizContext } from '@civicsense/shared/pod-quiz-integration'
import { useGuestAccess } from '@civicsense/shared/useGuestAccess'

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

interface QuizEngineProps {
  questions: QuizQuestion[]
  topicId: string
  currentTopic: QuizTopic
  availableTopics?: QuizTopic[]
  onComplete: (results: QuizResults) => void
  onTopicChange?: (topicId: string) => void
  practiceMode?: boolean
  mode?: QuizGameMode
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
    if (!question || !question.question || !question.type) {
      debug.warn('quiz', 'Skipping invalid question:', question)
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
  isPremium
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
          <div>Type: {currentQuestion?.type}</div>
          <div>Difficulty: {getQuestionDifficulty(currentQuestion)}</div>
          <div>Category: {currentQuestion?.category}</div>
          <div>Attempt: {currentAttemptNumber}</div>
          <div>Hints Used: {sessionAnalytics.hintsUsed}</div>
          <div>Boosts Used: {sessionAnalytics.boostsUsed.length}</div>
          <div>Premium: {isPremium ? 'Yes' : 'No'}</div>
          <div>Shortcuts: Active</div>
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
  onTopicChange,
  practiceMode = false,
  mode = 'standard'
}: QuizEngineProps) {
  const searchParams = useSearchParams()
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
    debug.log('quiz', `Question types:`, shuffled.map(q => q.type))
    
    // Validate final questions
    const validQuestions = shuffled.filter(q => {
      const isValid = q.question && q.type && q.correct_answer
      if (!isValid) {
        debug.warn('quiz', `Invalid question filtered out:`, {
          topic_id: q.topic_id,
          question_number: q.question_number,
          has_question: !!q.question,
          has_type: !!q.type,
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
          <Button onClick={() => onComplete({ score: 0, correctAnswers: 0, incorrectAnswers: 0, totalQuestions: 0, timeSpentSeconds: 0, timeTaken: 0, questions: [] })} className="rounded-xl">
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
  const [results, setResults] = useState<QuizResults | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())

  // Initialize progress manager for regular quizzes
  const guestToken = user ? undefined : getOrCreateGuestToken()
  const progressManager = createRegularQuizProgress(user?.id, guestToken, topicId)

  // Generate session ID for state persistence
  const sessionId = useRef<string>(`quiz-${topicId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

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

  // Save quiz state with dual storage (localStorage + database)
  const saveQuizState = useCallback(async () => {
    const baseState = convertToBaseQuizState()
    
    // Always save to localStorage for immediate access
    progressManager.save(baseState)
    
    // Also save to progress_sessions table if user is authenticated
    if (user) {
      try {
        await supabase
          .from('progress_sessions')
          .upsert({
            session_id: sessionId.current,
            session_type: 'regular_quiz',
            user_id: user.id,
            topic_id: topicId,
            questions: questions,
            current_question_index: currentQuestionIndex,
            answers: Object.fromEntries(
              userAnswers.map(answer => [answer.questionId.toString(), answer.answer])
            ),
            streak: 0, // Regular quiz doesn't track streak
            max_streak: 0,
            response_times: Object.fromEntries(
              userAnswers.map(answer => [answer.questionId.toString(), answer.timeSpent])
            ),
            category_performance: {},
            metadata: {
              practiceMode,
              mode,
              questionType: 'multiple-choice'
            },
            expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
          }, {
            onConflict: 'session_id'
          })
      } catch (error) {
        debug.warn('quiz', 'Failed to save to progress_sessions:', error)
        // Continue without blocking - localStorage is still saved
      }
    }
  }, [convertToBaseQuizState, progressManager, user, sessionId, topicId, questions, currentQuestionIndex, userAnswers, practiceMode, mode])

  // Clear quiz state from both storage locations
  const clearQuizState = useCallback(async () => {
    progressManager.clear()
    
    // Also clear from progress_sessions if user is authenticated
    if (user) {
      try {
        await supabase
          .from('progress_sessions')
          .delete()
          .eq('session_id', sessionId.current)
          .eq('user_id', user.id)
      } catch (error) {
        debug.warn('quiz', 'Failed to clear from progress_sessions:', error)
      }
    }
  }, [progressManager, user, sessionId])

  // Auto-save progress on state changes
  useEffect(() => {
    if (userAnswers.length > 0 || currentQuestionIndex > 0) {
      saveQuizState()
    }
  }, [userAnswers, currentQuestionIndex, saveQuizState])

  // Load quiz state
  const loadQuizState = async (): Promise<boolean> => {
    // Check if we should restore from database attempt
    const shouldRestore = searchParams?.get('restore') === 'progress'
    const attemptId = searchParams?.get('attemptId')
    const urlSessionId = searchParams?.get('sessionId')
    const source = searchParams?.get('source') || 'auto' // auto, progress_sessions, user_quiz_attempts
    
    if (shouldRestore && user) {
      try {
        // Try progress_sessions first (if sessionId provided or source is progress_sessions)
        if ((urlSessionId && source !== 'user_quiz_attempts') || source === 'progress_sessions') {
          debug.log('quiz', 'Attempting to restore from progress_sessions:', { urlSessionId, topicId })
          
          const { data: session, error: sessionError } = await supabase
            .from('progress_sessions')
            .select('*')
            .eq('session_id', urlSessionId || `quiz-${topicId}-${user.id}`)
            .eq('user_id', user.id)
            .eq('topic_id', topicId)
            .gt('expires_at', new Date().toISOString())
            .single()
          
          if (session && !sessionError) {
            // Convert progress session to quiz state
            const dbRestoredAnswers: EnhancedUserAnswer[] = Object.entries(session.answers || {}).map(([questionId, answer]) => ({
              questionId: parseInt(questionId),
              answer: answer as string,
              isCorrect: false, // Will be recalculated
              timeSpent: (session.response_times as any)?.[questionId] || 30,
              hintUsed: false,
              boostUsed: null
            }))
            
            setUserAnswers(dbRestoredAnswers)
            setCurrentQuestionIndex(session.current_question_index || 0)
            
            // Update sessionId to match the restored session
            sessionId.current = session.session_id
            
            debug.log('quiz', 'Successfully restored from progress_sessions:', {
              sessionId: session.session_id,
              questionIndex: session.current_question_index,
              answersCount: dbRestoredAnswers.length
            })
            return true
          }
        }
        
        // Fallback: Try user_quiz_attempts (if attemptId provided or no session found)
        if ((attemptId && source !== 'progress_sessions') || source === 'user_quiz_attempts' || !urlSessionId) {
          debug.log('quiz', 'Attempting to restore from user_quiz_attempts:', { attemptId, topicId })
          
          let query = supabase
            .from('user_quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('topic_id', topicId)
            .eq('is_completed', false)
            .order('created_at', { ascending: false })
          
          // If attemptId is specified, use it; otherwise get the most recent attempt
          if (attemptId) {
            query = query.eq('id', attemptId)
          }
          
          const { data: attempts, error: attemptError } = await query.limit(1)
          const attempt = attempts?.[0]
          
          if (attempt && !attemptError) {
            debug.log('quiz', 'Restoring from user_quiz_attempts:', attempt.id)
            
            // Try to restore from response_data if available (newer format)
            if (attempt.response_data && typeof attempt.response_data === 'object') {
              const responseData = attempt.response_data as any
              
              if (responseData.answers && responseData.currentQuestionIndex !== undefined) {
                const dbRestoredAnswers: EnhancedUserAnswer[] = Object.entries(responseData.answers).map(([questionId, answer]) => ({
                  questionId: parseInt(questionId),
                  answer: answer as string,
                  isCorrect: false, // Will be recalculated
                  timeSpent: responseData.responseTimes?.[questionId] || 30,
                  hintUsed: false,
                  boostUsed: null
                }))
                
                setUserAnswers(dbRestoredAnswers)
                setCurrentQuestionIndex(responseData.currentQuestionIndex)
                
                if (responseData.sessionId) {
                  sessionId.current = responseData.sessionId
                }
                
                debug.log('quiz', 'Successfully restored from response_data:', {
                  attemptId: attempt.id,
                  questionIndex: responseData.currentQuestionIndex,
                  answersCount: dbRestoredAnswers.length
                })
                return true
              }
            }
            
            // Fallback: Use legacy format (less detailed restoration)
            if (attempt.answers && typeof attempt.answers === 'object') {
              const storedAnswers = attempt.answers as Record<string, string>
              const dbRestoredAnswers: EnhancedUserAnswer[] = Object.entries(storedAnswers).map(([questionId, answer]) => ({
                questionId: parseInt(questionId),
                answer: answer as string,
                isCorrect: false, // Will be recalculated
                timeSpent: 30, // Default time
                hintUsed: false,
                boostUsed: null
              }))
              
              setUserAnswers(dbRestoredAnswers)
              // Try to infer current question from answer count
              setCurrentQuestionIndex(Math.min(dbRestoredAnswers.length, questions.length - 1))
              
              debug.log('quiz', 'Successfully restored from legacy format:', {
                attemptId: attempt.id,
                answersCount: dbRestoredAnswers.length
              })
              return true
            }
          }
        }
        
        debug.log('quiz', 'No suitable progress data found for restoration')
      } catch (error) {
        debug.warn('quiz', 'Failed to restore from database:', error)
      }
    }
    
    // Try localStorage restoration (existing logic)
    try {
      const baseState = progressManager.load()
      if (!baseState || !baseState.questions || baseState.questions.length !== questions.length) {
        debug.log('quiz', 'No valid localStorage state found')
        return false
      }
      
      debug.log('quiz', 'Restoring from localStorage:', {
        sessionId: baseState.sessionId,
        questionIndex: baseState.currentQuestionIndex,
        answersCount: Object.keys(baseState.answers).length
      })
      
             setCurrentQuestionIndex(baseState.currentQuestionIndex)
      
      // Convert answers back to EnhancedUserAnswer format
      const localRestoredAnswers: EnhancedUserAnswer[] = Object.entries(baseState.answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
        isCorrect: false, // Will be recalculated
        timeSpent: baseState.responseTimes[questionId] || 30,
        hintUsed: false,
        boostUsed: null
      }))
      
      setUserAnswers(localRestoredAnswers)
      sessionId.current = baseState.sessionId
      return true
    } catch (error) {
      debug.warn('quiz', 'Failed to restore from localStorage:', error)
    }
    
    return false
  }


  
  // Enhanced analytics tracking
  const [sessionAnalytics, setSessionAnalytics] = useState({
    hintsUsed: 0,
    boostsUsed: [] as string[],
    categoryPerformance: {} as Record<string, { correct: number; total: number; avgTime: number }>,
    difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
    questionAttempts: [] as Array<{ questionId: number; attempts: number; finalCorrect: boolean }>,
    timeoutsCount: 0,
    skipsCount: 0,
    correctAnswers: 0
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

  // Timer integration
  const initialTime = useMemo(() => {
    if (mode === 'practice' || practiceMode) return 0
    return DEFAULT_MODE_CONFIGS[mode]?.timeLimit || 60
  }, [mode, practiceMode])

  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer({
    initialTime,
    onTimeUp: mode === 'practice' || practiceMode ? undefined : handleTimeUp,
    frozen: timeFrozen
  })

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
    const hasMultipleChoices = question.type === 'multiple_choice' && 
                              getQuestionOptions(question).length >= 4
    
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
    let timeoutId: number
    
    const checkMobile = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
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
        const restored = await loadQuizState()
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

  // Determine if we should use timers based on mode
  const shouldUseTimer = !practiceMode && mode !== 'practice' && (mode === 'standard' || mode === 'classic_quiz' || mode === 'npc_battle')

  // Enhanced event handlers
  function handleTimeUp() {
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

  // Handle answer selection
  function handleAnswerSelect(answer: string) {
    if (isAnswerSubmitted || !currentQuestion) return
    
    setSelectedAnswer(answer)
    
    // Never auto-submit - always wait for manual submission
    // This gives users full control over when to submit their answer
  }

  // Submit answer with enhanced feedback
  function handleSubmitAnswer() {
    if (!selectedAnswer || !currentQuestion || isAnswerSubmitted) return

    console.log('📤 Submitting enhanced answer:', selectedAnswer)
    setIsAnswerSubmitted(true)
    stopTimer()
    
    // Determine if answer is correct
    let isCorrect = false
    if (currentQuestion.type === 'short_answer') {
      // Use checkAnswerIntelligently for consistency with the component's real-time feedback
      isCorrect = checkAnswerIntelligently(selectedAnswer, currentQuestion.correct_answer)
    } else if (currentQuestion.type === 'true_false') {
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
    setShowFeedback(true)
    
    // Save state after answering
    setTimeout(() => saveQuizState(), 100)
    
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
          playText(currentQuestion.explanation || '', { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play explanation failed:', error)
        }
      }, 800)
    }

    // Always show feedback and never auto-advance
    // Users control when to move to the next question
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < randomizedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswerSubmitted(false)
      resetTimer() // Use resetTimer from the hook instead of setTimeLeft
      setShowHint(false)
      setQuestionStartTime(Date.now())
      setCurrentAttemptNumber(1)
      setHasUsedSecondChance(false)
      setAnswerRevealUsed(false)
      setTimeFrozen(false)
      
      // Save state after moving to next question
      saveQuizState()
    } else {
      handleFinishQuiz()
    }
  }

  // Add emergency completion handler for debugging
  const handleEmergencyFinish = useCallback(() => {
    console.log('🚨 Emergency finish triggered!')
    
    // Create basic results even if calculation fails
    const basicResults: QuizResults = {
      totalQuestions: randomizedQuestions.length,
      correctAnswers: userAnswers.filter(a => a.isCorrect).length,
      incorrectAnswers: userAnswers.filter(a => !a.isCorrect).length,
      score: randomizedQuestions.length > 0 ? Math.round((userAnswers.filter(a => a.isCorrect).length / randomizedQuestions.length) * 100) : 0,
      timeTaken: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
      timeSpentSeconds: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
      questions: randomizedQuestions.map((question, index) => {
        const userAnswer = userAnswers.find(answer => answer.questionId === question.question_number)
        return {
          question,
          userAnswer: userAnswer?.answer || 'skipped',
          isCorrect: userAnswer?.isCorrect || false
        }
      })
    }
    
    console.log('✅ Emergency completion with basic results:', basicResults)
    
    if (onComplete) {
      onComplete(basicResults)
    } else {
      console.error('❌ No onComplete handler available!')
    }
  }, [userAnswers, randomizedQuestions, onComplete])

  async function handleFinishQuiz() {
    console.log('🎯 handleFinishQuiz called with full context:', {
      hasResults: !!results,
      userAnswersLength: userAnswers.length,
      isFinishing,
      totalQuestions: randomizedQuestions.length,
      topicIdProp: topicId,
      currentTopicProp: currentTopic,
      hasOnComplete: !!onComplete,
      randomizedQuestionsLength: randomizedQuestions.length
    })

    // Only prevent if already finishing
    if (isFinishing) {
      console.log('⏸️ Quiz finish already in progress, skipping')
      return
    }

    // If results already exist, show them
    if (results) {
      console.log('✅ Quiz results already exist, showing results screen')
      setShowResults(true)
      return
    }

    setIsFinishing(true)
    console.log('🚀 Starting quiz completion process...')

    try {
      // Calculate results first
      let calculatedResults: QuizResults
      
      try {
        calculatedResults = calculateResults(userAnswers, randomizedQuestions)
        console.log('✅ Results calculated successfully:', {
          score: calculatedResults.score,
          totalQuestions: calculatedResults.totalQuestions,
          correctAnswers: calculatedResults.correctAnswers,
          timeTaken: calculatedResults.timeTaken,
          questionsLength: calculatedResults.questions.length
        })
      } catch (calculateError) {
        console.error('❌ Error calculating results, using basic calculation:', calculateError)
        
        // Fallback calculation
        calculatedResults = {
          totalQuestions: randomizedQuestions.length,
          correctAnswers: userAnswers.filter(a => a.isCorrect).length,
          incorrectAnswers: userAnswers.filter(a => !a.isCorrect).length,
          score: randomizedQuestions.length > 0 ? Math.round((userAnswers.filter(a => a.isCorrect).length / randomizedQuestions.length) * 100) : 0,
          timeTaken: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
          timeSpentSeconds: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
          questions: randomizedQuestions.map((question, index) => {
            const userAnswer = userAnswers.find(answer => answer.questionId === question.question_number)
            return {
              question,
              userAnswer: userAnswer?.answer || 'skipped',
              isCorrect: userAnswer?.isCorrect || false
            }
          })
        }
        console.log('✅ Fallback results calculated:', calculatedResults)
      }
      
      // Set results FIRST before calling completion API
      setResults(calculatedResults)

      // Clear progress storage since quiz is completed
      try {
        progressManager.clear()
        console.log('✅ Progress storage cleared')
      } catch (progressError) {
        console.warn('⚠️ Failed to clear progress storage:', progressError)
      }

      // Clear localStorage progress storage too
      const storageKey = `civicSenseQuizProgress_${topicId}`
      localStorage.removeItem(storageKey)
      
      // Store completion data in localStorage for refresh detection
      try {
        const completionData = {
          topicId,
          results: calculatedResults,
          completedAt: new Date().toISOString(),
          score: calculatedResults.score,
          totalQuestions: calculatedResults.totalQuestions,
          correctAnswers: calculatedResults.correctAnswers,
          mode: mode || 'standard'
        }
        
        const completionKey = `quiz_completion_${topicId}_${Date.now()}`
        localStorage.setItem(completionKey, JSON.stringify(completionData))
        localStorage.setItem(`latest_quiz_completion_${topicId}`, completionKey)
        
        console.log('✅ Stored completion data for refresh detection')
      } catch (completionError) {
        console.warn('⚠️ Failed to store completion data:', completionError)
      }

      // Call the completion API to save results
      try {
        console.log('📡 Calling completion API...')
        await onComplete(calculatedResults)
        console.log('✅ Completion API call successful')
      } catch (apiError) {
        console.error('❌ Completion API call failed, but continuing to show results:', apiError)
        // Don't block showing results if API fails
      }

      console.log('🎉 Quiz completed! Showing results screen...')
      
      // Show results screen - this will NOT call onComplete again
      setShowResults(true)

    } catch (error) {
      console.error("❌ Error finishing quiz:", error)
      setError("Failed to complete quiz. Please try again.")
      
      // Use emergency completion as fallback
      console.log('🚨 Using emergency completion as fallback...')
      handleEmergencyFinish()
    } finally {
      setIsFinishing(false)
    }
  }

  const [showAdminEdit, setShowAdminEdit] = useState(false)

  const handleQuestionUpdate = (updatedQuestion: QuizQuestion) => {
    // Update the questions array with the updated question
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = updatedQuestion;
    // Note: You might want to add a prop to handle this at a higher level
  }

  const isAdvancedAnalytics = useFeatureFlag('advancedAnalytics')
  const isSpacedRepetition = useFeatureFlag('spacedRepetition')
  const isLearningInsights = useFeatureFlag('learningInsights')
  const areDebugPanels = useFeatureFlag('debugPanels')

  // Enhanced keyboard shortcuts using the new utility
  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (isAnswerSubmitted || !currentQuestion) return
    
    const options = getQuestionOptions(currentQuestion)
    
    if (optionIndex < options.length) {
      // For multiple choice questions, use the actual option text
      if (currentQuestion.type === 'multiple_choice') {
        handleAnswerSelect(options[optionIndex])
      } else if (currentQuestion.type === 'true_false') {
        // For true/false, map 0->True, 1->False
        handleAnswerSelect(optionIndex === 0 ? 'True' : 'False')
      } else {
        // For other question types, use the option directly
        handleAnswerSelect(options[optionIndex])
      }
    }
  }, [isAnswerSubmitted, currentQuestion])

  const handleToggleHint = useCallback(() => {
    setShowHint(prev => {
      const newShowHint = !prev
      if (newShowHint && currentQuestion) {
        updateSessionAnalytics({ hintsUsed: sessionAnalytics.hintsUsed + 1 })
      }
      return newShowHint
    })
  }, [currentQuestion, updateSessionAnalytics, sessionAnalytics.hintsUsed])

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
              // This error occurs because we're trying to insert into pod_analytics table
              // but the user doesn't have the proper permissions. This is expected for:
              // 1. Users not in a pod (solo quiz)
              // 2. Users without proper pod role
              // 3. Missing RLS policy for analytics
              // This is non-blocking - quiz can continue without analytics
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
                questionCount: randomizedQuestions.length
              })
            }
          }
        }
      }
    }
    
    initializeAttempt()
  }, [user, topicId, randomizedQuestions.length])

  // Disable auto-advance - let users control when to move on
  // useEffect(() => {
  //   if (isAnswerSubmitted && autoAdvance && !practiceMode) {
  //     const timer = setTimeout(() => {
  //       handleNextQuestion()
  //     }, 4000) // Increased from default to give more time to read feedback and see animations

  //     return () => clearTimeout(timer)
  //   }
  // }, [isAnswerSubmitted, autoAdvance, practiceMode])

  if (showResults) {
    return (
      <QuizResultsComponent
        userAnswers={userAnswers}
        questions={randomizedQuestions}
        onFinish={onComplete}
        topicId={topicId}
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
    
    // Base XP for answering
    let xp = 10

    // Use the same answer checking logic as the rest of the component
    const isAnswerCorrect = selectedAnswer === currentQuestion.correct_answer

    // Correct answer bonus
    if (isAnswerCorrect) {
      xp += 20

      // Time bonus (if more than 45 seconds left)
      if (timeLeft > 45) {
        xp += 10
      }
    }

    return xp
  }

  const handleAnswerSubmit = (answer: string) => {
    if (isAnswerSubmitted) return

    setSelectedAnswer(answer)
    setIsAnswerSubmitted(true)

    // Update analytics
    if (answer === "timeout") {
      setSessionAnalytics(prev => ({
        ...prev,
        timeoutsCount: prev.timeoutsCount + 1
      }))
    } else if (answer === "skipped") {
      setSessionAnalytics(prev => ({
        ...prev,
        skipsCount: prev.skipsCount + 1
      }))
    } else if (answer === currentQuestion.correct_answer) {
      setSessionAnalytics(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + 1
      }))
    }

    // Add delay before allowing next question
    const minViewTime = 4000 // 4 seconds minimum to read feedback
    const nextButton = document.querySelector('[data-next-question]')
    if (nextButton) {
      nextButton.setAttribute('disabled', 'true')
      setTimeout(() => {
        nextButton.removeAttribute('disabled')
      }, minViewTime)
    }
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-900">
      {/* Topic Navigation is now handled by the new QuizNavigation component in the page layout */}
      
      <div className={cn(
        "max-w-4xl mx-auto space-y-6",
        isMobile ? "px-3 py-4 pb-20" : "px-6 py-8 space-y-12"
      )}>
        {/* Quiz title display */}
        <div className="text-xs text-center mb-3 text-slate-500 dark:text-slate-400">
          <span className="mr-1">{currentTopic.emoji}</span>
          <span>{currentTopic.topic_title}</span>
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
          
          {shouldUseTimer && (
            <QuestionTimer
              key={`timer-${currentQuestionIndex}-${currentAttemptNumber}`}
              initialTime={initialTime}
              isActive={isTimerActive && !isAnswerSubmitted && !timeFrozen}
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
                xpGained={calculateXpGained()} // Calculate XP based on time and correctness
              />
              
              {/* QuestionFeedback (for rating/reporting) is only shown on quiz results screen */}
            </div>
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
                 currentQuestion.type === 'multiple_choice' && (
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
        {process.env.NODE_ENV === 'development' && !isMobile && debug.isEnabled('quiz') && areDebugPanels && (
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
          />
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

      {/* Enhanced Boost Command Bar - TEMPORARILY DISABLED */}
      {false && user && (
        <BoostCommandBar
          userXP={userXP}
          onXPChanged={setUserXP}
          onBoostActivated={handleBoostActivated}
        />
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
              question={questions[currentQuestionIndex]}
              topicId={topicId}
              onQuestionUpdate={handleQuestionUpdate}
            />
          )}
        </>
      )}

      {/* Emergency completion button for debugging - shows on last question */}
      {isLastQuestion && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            🚨 Emergency Quiz Completion (Development Only)
          </p>
          <Button 
            onClick={handleEmergencyFinish}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            Force Complete Quiz Now
          </Button>
        </div>
      )}

      {/* Emergency completion button - ALWAYS visible on last question in development */}
      {isLastQuestion && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              🎯 Quiz Completion Available
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              You're on the last question! Click below to complete the quiz.
            </p>
            <Button 
              onClick={handleEmergencyFinish}
              variant="default"
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              🏁 Complete Quiz Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}