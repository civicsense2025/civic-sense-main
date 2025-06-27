"use client"

import React, { useReducer, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'

// Import plugin system
import { gameModeRegistry, ensureGameModesInitialized } from '../modes'
import type { 
  GameModePlugin, 
  QuizEngineContext, 
  QuizEngineActions, 
  GameModeAction
} from '../modes/types'

// Import database types from local v2 folder
import type { 
  QuizAttemptData, 
  QuizModeSettings, 
  GameMetadata, 
  UserAnswer,
} from '../types/database'

// Import existing quiz types
import type { QuizGameMode, QuizQuestion, QuizResults, QuizTopic } from '@/lib/types/quiz'

// Import shared components (keeping existing visuals)
import { QuizQuestion as QuestionRenderer } from '../components/question-renderer'
import { QuizResults as ResultsDisplay } from '@/components/quiz/quiz-results'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Enhanced progress storage integration
import { EnhancedProgressAdapter } from '../storage/enhanced-progress-adapter'
import type { QuizState as BaseQuizState, QuizConfig, QuizPluginContext } from '../types'

interface QuizEngineV2Props {
  questions: QuizQuestion[]
  topicId: string
  currentTopic: QuizTopic
  mode: QuizGameMode
  onComplete: (results: QuizResults) => void
  onExit?: () => void
  userId?: string
  guestToken?: string
  resumedAttemptId?: string
  
  // LMS integration
  podId?: string
  classroomCourseId?: string
  classroomAssignmentId?: string
  cleverSectionId?: string
}

// Quiz engine state
interface QuizEngineState {
  // Core quiz state
  currentQuestionIndex: number
  userAnswers: UserAnswer[]
  score: number
  streak: number
  maxStreak: number
  timeRemaining: number | null
  isCompleted: boolean
  showResults: boolean
  
  // Session management
  sessionId: string
  startTime: number
  attemptData?: QuizAttemptData
  
  // Mode-specific state
  modeState: any
  modeSettings: QuizModeSettings
  gameMetadata: GameMetadata
  
  // UI state
  isLoading: boolean
  error: string | null
  showModal: boolean
  modalContent: React.ReactNode | null
}

// Quiz engine actions
type QuizEngineActionType =
  | { type: 'INITIALIZE'; payload: { plugin: GameModePlugin; settings: QuizModeSettings } }
  | { type: 'START_QUIZ' }
  | { type: 'ANSWER_QUESTION'; payload: { answer: string; timeSpent: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'GO_TO_QUESTION'; payload: { index: number } }
  | { type: 'USE_HINT' }
  | { type: 'USE_POWERUP'; payload: { powerup: string } }
  | { type: 'TIMER_TICK'; payload: { timeRemaining: number } }
  | { type: 'UPDATE_MODE_STATE'; payload: any }
  | { type: 'UPDATE_GAME_METADATA'; payload: GameMetadata }
  | { type: 'COMPLETE_QUIZ'; payload?: Partial<QuizResults> }
  | { type: 'SHOW_MODAL'; payload: { content: React.ReactNode } }
  | { type: 'HIDE_MODAL' }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'RESTORE_PROGRESS'; payload: Partial<QuizEngineState> }

// Quiz engine reducer
function quizEngineReducer(state: QuizEngineState, action: QuizEngineActionType): QuizEngineState {
  switch (action.type) {
    case 'INITIALIZE':
      const { plugin, settings } = action.payload
      const initialModeState = plugin.getInitialState?.() || null
      
      return {
        ...state,
        modeState: initialModeState,
        modeSettings: settings,
        isLoading: false
      }
      
    case 'START_QUIZ':
      return {
        ...state,
        startTime: Date.now(),
        currentQuestionIndex: 0,
        userAnswers: [],
        score: 0,
        streak: 0,
        maxStreak: 0,
        isCompleted: false,
        showResults: false
      }
      
    case 'ANSWER_QUESTION':
      const { answer, timeSpent } = action.payload
      const currentQuestion = state.currentQuestionIndex
      const correctAnswer = state.userAnswers[currentQuestion]?.isCorrect || false
      
      const newAnswer: UserAnswer = {
        questionId: currentQuestion,
        answer,
        isCorrect: correctAnswer, // Will be determined by mode plugin
        timeSpent
      }
      
      const newAnswers = [...state.userAnswers]
      newAnswers[currentQuestion] = newAnswer
      
      // Update streak
      const newStreak = correctAnswer ? state.streak + 1 : 0
      const newMaxStreak = Math.max(state.maxStreak, newStreak)
      
      return {
        ...state,
        userAnswers: newAnswers,
        streak: newStreak,
        maxStreak: newMaxStreak
      }
      
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.userAnswers.length - 1)
      }
      
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1)
      }
      
    case 'GO_TO_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(0, Math.min(action.payload.index, state.userAnswers.length - 1))
      }
      
    case 'UPDATE_MODE_STATE':
      return {
        ...state,
        modeState: action.payload
      }
      
    case 'UPDATE_GAME_METADATA':
      return {
        ...state,
        gameMetadata: action.payload
      }
      
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isCompleted: true,
        showResults: true
      }
      
    case 'SHOW_MODAL':
      return {
        ...state,
        showModal: true,
        modalContent: action.payload.content
      }
      
    case 'HIDE_MODAL':
      return {
        ...state,
        showModal: false,
        modalContent: null
      }
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false
      }
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading
      }
      
    case 'TIMER_TICK':
      return {
        ...state,
        timeRemaining: action.payload.timeRemaining
      }
      
    case 'RESTORE_PROGRESS':
      return {
        ...state,
        ...action.payload
      }
      
    default:
      return state
  }
}

export function QuizEngineV2({
  questions,
  topicId,
  currentTopic,
  mode,
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
  // Ensure game modes are initialized before using registry
  ensureGameModesInitialized()
  
  // Get the mode plugin
  const modePlugin = gameModeRegistry.get(mode)
  
  if (!modePlugin) {
    throw new Error(`Game mode "${mode}" is not registered`)
  }
  
  // Generate session ID
  const sessionId = useRef(resumedAttemptId || `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  // Initialize state
  const initialState: QuizEngineState = {
    currentQuestionIndex: 0,
    userAnswers: [],
    score: 0,
    streak: 0,
    maxStreak: 0,
    timeRemaining: null,
    isCompleted: false,
    showResults: false,
    sessionId: sessionId.current,
    startTime: Date.now(),
    modeState: null,
    modeSettings: modePlugin.config.settings,
    gameMetadata: {
      power_ups_used: [],
      achievements_earned: [],
      social_interactions: []
    },
    isLoading: true,
    error: null,
    showModal: false,
    modalContent: null
  }
  
  const [state, dispatch] = useReducer(quizEngineReducer, initialState)
  
  // Progress adapter
  const progressAdapter = useRef<EnhancedProgressAdapter | null>(null)
  
  // Initialize progress adapter
  useEffect(() => {
    progressAdapter.current = new EnhancedProgressAdapter({
      userId,
      guestToken,
      sessionId: sessionId.current,
      topicId,
      mode: mode as string,
    })
    
    // Try to restore progress
    const restoreProgress = async () => {
      const savedProgress = await progressAdapter.current!.loadProgress()
      if (savedProgress) {
        dispatch({ type: 'RESTORE_PROGRESS', payload: savedProgress as any })
        toast({
          title: "Welcome back! 👋",
          description: "Your progress has been restored.",
        })
      }
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } })
    }
    
    restoreProgress()
  }, [userId, guestToken, topicId, mode])
  
  // Timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const startTimer = useCallback((timeLimit: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    let remaining = timeLimit
    dispatch({ type: 'TIMER_TICK', payload: { timeRemaining: remaining } })
    
    timerRef.current = setInterval(() => {
      remaining -= 1
      dispatch({ type: 'TIMER_TICK', payload: { timeRemaining: remaining } })
      
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        // Auto-submit on timeout
        actions.submitAnswer('')
      }
    }, 1000)
  }, [])
  
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])
  
  // Convert state to BaseQuizState for progress storage
  const convertToBaseQuizState = useCallback((): BaseQuizState => {
    const answers: { [questionId: string]: string } = {}
    const questionTimes: { [questionId: string]: number } = {}
    let correctAnswers = 0
    
    state.userAnswers.forEach((answer, index) => {
      const questionNumber = questions[index]?.question_number || index
      const questionId = questionNumber.toString()
      answers[questionId] = answer.answer
      questionTimes[questionId] = answer.timeSpent
      if (answer.isCorrect) correctAnswers++
    })
    
    return {
      currentQuestionIndex: state.currentQuestionIndex,
      answers,
      score: state.score,
      correctAnswers,
      streak: state.streak,
      maxStreak: state.maxStreak,
      timeRemaining: state.timeRemaining,
      startTime: state.startTime,
      questionTimes,
      categoryScores: state.gameMetadata.custom?.categoryScores,
      isCompleted: state.isCompleted,
      showResults: state.showResults
    }
  }, [state, questions])
  
  // Create context first, before using it in actions
  const context: QuizEngineContext = useMemo(() => ({
    questions,
    currentQuestionIndex: state.currentQuestionIndex,
    userAnswers: state.userAnswers,
    timeRemaining: state.timeRemaining,
    score: state.score,
    streak: state.streak,
    maxStreak: state.maxStreak,
    sessionId: state.sessionId,
    startTime: state.startTime,
    attemptData: state.attemptData,
    userId,
    guestToken,
    isAuthenticated: !!userId,
    topicId,
    topicData: currentTopic,
    modeState: state.modeState,
    modeSettings: state.modeSettings,
    gameMetadata: state.gameMetadata,
    actions: {} as QuizEngineActions // Placeholder, will be replaced
  }), [state, questions, userId, guestToken, topicId, currentTopic])
  
  // Quiz engine actions that plugins can use
  const actions: QuizEngineActions = useMemo(() => ({
    goToNextQuestion: () => dispatch({ type: 'NEXT_QUESTION' }),
    goToPreviousQuestion: () => dispatch({ type: 'PREVIOUS_QUESTION' }),
    goToQuestion: (index: number) => dispatch({ type: 'GO_TO_QUESTION', payload: { index } }),
    
    submitAnswer: async (answer: string) => {
      const startTime = Date.now()
      const timeSpent = (startTime - state.startTime) / 1000
      
      // Let plugin validate the answer
      const isValid = await modePlugin.onAnswerSubmit?.({
        questionId: state.currentQuestionIndex,
        answer,
        isCorrect: false, // Will be determined
        timeSpent
      }, context)
      
      if (isValid !== false) {
        dispatch({ type: 'ANSWER_QUESTION', payload: { answer, timeSpent } })
        
        // Save question response
        if (progressAdapter.current) {
          const currentQuestion = questions[state.currentQuestionIndex]
          const isCorrect = currentQuestion?.correct_answer === answer
          const questionNumber = currentQuestion?.question_number || state.currentQuestionIndex
          await progressAdapter.current.saveQuestionResponse(
            questionNumber.toString(),
            state.currentQuestionIndex,
            answer,
            isCorrect,
            timeSpent
          )
        }
      }
    },
    
    setAnswerConfidence: (confidence: number) => {
      // Store confidence for analytics
    },
    
    useHint: () => {
      dispatch({ type: 'USE_POWERUP', payload: { powerup: 'hint' } })
    },
    
    skipQuestion: () => {
      actions.submitAnswer('') // Submit empty answer
    },
    
    pauseTimer: () => stopTimer(),
    resumeTimer: () => {
      if (state.timeRemaining) {
        startTimer(state.timeRemaining)
      }
    },
    extendTime: (seconds: number) => {
      if (state.timeRemaining) {
        dispatch({ type: 'TIMER_TICK', payload: { timeRemaining: state.timeRemaining + seconds } })
      }
    },
    
    updateModeState: (update: any) => {
      dispatch({ type: 'UPDATE_MODE_STATE', payload: update })
    },
    
    updateGameMetadata: (update: GameMetadata) => {
      dispatch({ type: 'UPDATE_GAME_METADATA', payload: update })
    },
    
    showModal: (content: React.ReactNode) => {
      dispatch({ type: 'SHOW_MODAL', payload: { content } })
    },
    
    hideModal: () => {
      dispatch({ type: 'HIDE_MODAL' })
    },
    
    showToast: (message: string, type?: 'success' | 'error' | 'info') => {
      toast({
        title: message,
        variant: type === 'error' ? 'destructive' : 'default'
      })
    },
    
    saveProgress: () => {
      if (progressAdapter.current) {
        const config: QuizConfig = {
          questions,
          topicId,
          topicData: currentTopic,
          mode,
          practiceMode: false,
          settings: state.modeSettings
        }
        
        const pluginContext: QuizPluginContext = {
          userId,
          guestToken,
          sessionId: sessionId.current,
          metadata: { podId, classroomCourseId, classroomAssignmentId, cleverSectionId }
        }
        
        const baseState = convertToBaseQuizState()
        progressAdapter.current.saveProgress(baseState, config, pluginContext)
      }
    },
    
    clearProgress: () => {
      if (progressAdapter.current) {
        progressAdapter.current.clearProgress()
      }
    },
    
    completeQuiz: (results?: Partial<QuizResults>) => {
      dispatch({ type: 'COMPLETE_QUIZ', payload: results })
    },
    
    exitQuiz: () => {
      actions.clearProgress()
      onExit?.()
    }
  }), [state, modePlugin, userId, guestToken, topicId, currentTopic, mode, questions, onExit, stopTimer, startTimer, convertToBaseQuizState, podId, classroomCourseId, classroomAssignmentId, cleverSectionId, context])
  
  // Update context with actions
  const contextWithActions = useMemo(() => ({
    ...context,
    actions
  }), [context, actions])
  
  // Save progress on state changes
  useEffect(() => {
    if (!progressAdapter.current || state.isLoading || state.isCompleted) return
    
    const config: QuizConfig = {
      questions,
      topicId,
      topicData: currentTopic,
      mode,
      practiceMode: false,
      settings: state.modeSettings
    }
    
    const pluginContext: QuizPluginContext = {
      userId,
      guestToken,
      sessionId: sessionId.current,
      attemptId: resumedAttemptId,
      metadata: {
        podId,
        classroomCourseId,
        classroomAssignmentId,
        cleverSectionId
      }
    }
    
    const baseState = convertToBaseQuizState()
    progressAdapter.current.saveProgress(baseState, config, pluginContext)
  }, [state.currentQuestionIndex, state.userAnswers, state.score, convertToBaseQuizState, questions, topicId, currentTopic, mode, userId, guestToken, resumedAttemptId, podId, classroomCourseId, classroomAssignmentId, cleverSectionId])
  
  // Initialize the mode plugin
  useEffect(() => {
    if (modePlugin && !state.isLoading) {
      dispatch({ 
        type: 'INITIALIZE', 
        payload: { 
          plugin: modePlugin, 
          settings: modePlugin.config.settings 
        } 
      })
      
      // Call plugin initialization
      modePlugin.onModeStart?.(contextWithActions)
      dispatch({ type: 'START_QUIZ' })
    }
  }, [modePlugin, state.isLoading, contextWithActions])
  
  // Handle quiz completion
  useEffect(() => {
    if (state.isCompleted && state.showResults) {
      const results: QuizResults = {
        totalQuestions: questions.length,
        correctAnswers: state.userAnswers.filter(a => a.isCorrect).length,
        incorrectAnswers: state.userAnswers.filter(a => !a.isCorrect).length,
        score: state.score,
        timeTaken: (Date.now() - state.startTime) / 1000,
        timeSpentSeconds: (Date.now() - state.startTime) / 1000,
        questions: questions.map((q, i) => ({
          question: q,
          userAnswer: state.userAnswers[i]?.answer || '',
          isCorrect: state.userAnswers[i]?.isCorrect || false
        }))
      }
      
      // Let plugin handle completion
      modePlugin.onModeComplete?.(results, contextWithActions)
      
      // Clear progress and call completion handler
      actions.clearProgress()
      onComplete(results)
    }
  }, [state.isCompleted, state.showResults, modePlugin, contextWithActions, actions, onComplete, questions, state.userAnswers, state.score, state.startTime])
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading {modePlugin.displayName}...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{state.error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  // Main quiz UI
  const currentQuestion = questions[state.currentQuestionIndex]
  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100
  
  return (
    <div className="quiz-engine-v2">
      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
          <span>Question {state.currentQuestionIndex + 1} of {questions.length}</span>
          {state.timeRemaining !== null && (
            <span>{Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
      </div>
      
      {/* Custom Header from Plugin */}
      {modePlugin.renderHeader?.(contextWithActions)}
      
      {/* Question Display */}
      {modePlugin.renderQuestion ? (
        modePlugin.renderQuestion(currentQuestion, contextWithActions)
      ) : (
        <QuestionRenderer
          question={currentQuestion}
          onAnswer={(answer: string) => actions.submitAnswer(answer)}
          selectedAnswer={state.userAnswers[state.currentQuestionIndex]?.answer}
          showExplanation={false}
          practiceMode={false}
        />
      )}
      
      {/* Custom Interface from Plugin */}
      {modePlugin.renderInterface?.(contextWithActions)}
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button 
          variant="outline" 
          onClick={actions.goToPreviousQuestion}
          disabled={state.currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {state.streak > 0 && `🔥 Streak: ${state.streak}`}
        </span>
        
        <Button 
          onClick={actions.goToNextQuestion}
          disabled={state.currentQuestionIndex === questions.length - 1}
        >
          Next
        </Button>
      </div>
      
      {/* Custom Footer from Plugin */}
      {modePlugin.renderFooter?.(contextWithActions)}
      
      {/* Modal */}
      {state.showModal && (
        <Dialog open={state.showModal} onOpenChange={() => dispatch({ type: 'HIDE_MODAL' })}>
          <DialogContent>
            {state.modalContent}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Results Display */}
      {state.showResults && (
        modePlugin.renderResults ? (
          modePlugin.renderResults({
            totalQuestions: questions.length,
            correctAnswers: state.userAnswers.filter(a => a.isCorrect).length,
            incorrectAnswers: state.userAnswers.filter(a => !a.isCorrect).length,
            score: state.score,
            timeTaken: (Date.now() - state.startTime) / 1000,
            timeSpentSeconds: (Date.now() - state.startTime) / 1000,
            questions: []
          }, contextWithActions)
        ) : (
          <ResultsDisplay
            userAnswers={state.userAnswers}
            questions={questions}
            onFinish={() => onComplete({
              totalQuestions: questions.length,
              correctAnswers: state.userAnswers.filter(a => a.isCorrect).length,
              incorrectAnswers: state.userAnswers.filter(a => !a.isCorrect).length,
              score: state.score,
              timeTaken: (Date.now() - state.startTime) / 1000,
              timeSpentSeconds: (Date.now() - state.startTime) / 1000,
              questions: []
            })}
            topicId={topicId}
            mode={mode}
          />
        )
      )}
    </div>
  )
} 