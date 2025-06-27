"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Import existing quiz types
import type { QuizQuestion, QuizResults, QuizTopic, QuizGameMode } from '@/lib/types/quiz'
import { quizSaveManager } from '@/lib/quiz-save-manager'

// Import game modes
import { getGameMode, type GameModeId, type StandardModeSettings, type AIBattleSettings, type PVPSettings } from '../modes'

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

// Helper to get question ID
const getQuestionId = (question: QuizQuestion): string => {
  // Use topic_id and question_number for unique ID
  return `${question.topic_id}_${question.question_number}`
}

// Helper to get question options
const getQuestionOptions = (question: QuizQuestion): string[] => {
  // Handle different question types
  if (question.type === 'multiple_choice' && question.options) {
    return question.options
  }
  
  if (question.type === 'true_false') {
    return ['True', 'False']
  }
  
  // For questions without type or with legacy format
  if ('option_a' in question) {
    const options = [
      question.correct_answer,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d
    ].filter((opt): opt is string => Boolean(opt) && opt !== question.correct_answer)
    
    // Add correct answer and shuffle
    return [question.correct_answer, ...options].sort(() => Math.random() - 0.5)
  }
  
  // Default: just return correct answer as single option
  return [question.correct_answer]
}

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
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  // Map old mode names to new ones if needed
  const mappedMode = (mode === 'standard' || mode === 'ai-battle' || mode === 'pvp') 
    ? mode as GameModeId 
    : 'standard' // Default to standard for all other modes
  
  // Get game mode (with fallback to standard)
  const gameMode = getGameMode(mappedMode) || getGameMode('standard')
  const modeSettings = settings || gameMode?.defaultSettings
  
  // Process questions
  const processedQuestions = React.useMemo(() => {
    if (singleTopicQuestions) {
      return singleTopicQuestions
    }
    
    // Future: multi-topic support
    if (topics && allQuestions) {
      let combined: QuizQuestion[] = []
      for (const topic of topics) {
        const topicQs = allQuestions[topic] || []
        combined = [...combined, ...topicQs]
      }
      return combined
    }
    
    return []
  }, [singleTopicQuestions, topics, allQuestions])
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const startTimeRef = useRef(Date.now())
  const questionStartTimeRef = useRef(Date.now())
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({})
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const currentQuestion = processedQuestions[currentQuestionIndex]
  const hasTimeLimit = (modeSettings as StandardModeSettings)?.timeLimit !== null && 
                       (modeSettings as StandardModeSettings)?.timeLimit !== undefined
  const timeLimit = (modeSettings as StandardModeSettings)?.timeLimit || 0
  
  // Initialize
  useEffect(() => {
    setIsClient(true)
    
    // Call mode start hook
    if (gameMode?.onModeStart) {
      gameMode.onModeStart(modeSettings)
    }
  }, [])
  
  // Timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (hasTimeLimit && !showResults && currentQuestion) {
      setTimeRemaining(timeLimit)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            handleAnswer('') // Auto-submit empty answer
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestionIndex, hasTimeLimit, timeLimit, showResults])
  
  // Handle answer
  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion) return
    
    const questionId = getQuestionId(currentQuestion)
    const responseTime = Date.now() - questionStartTimeRef.current
    const isCorrect = answer === currentQuestion.correct_answer
    
    // Update state
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    setResponseTimes(prev => ({ ...prev, [questionId]: responseTime }))
    
    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak(Math.max(maxStreak, newStreak))
    } else {
      setStreak(0)
      
      // Survival mode check
      if ((modeSettings as StandardModeSettings)?.scoringMode === 'survival') {
        setTimeout(() => {
          handleQuizComplete()
        }, 1500)
        return
      }
    }
    
    // Call mode hook
    if (gameMode?.onAnswerSubmit) {
      gameMode.onAnswerSubmit(answer, isCorrect, responseTime / 1000, modeSettings)
    }
    
    // Auto-advance or complete
    const delay = (modeSettings as StandardModeSettings)?.instantFeedback ? 1500 : 500
    
    setTimeout(() => {
      if (currentQuestionIndex < processedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        questionStartTimeRef.current = Date.now()
        
        // Call question start hook
        if (gameMode?.onQuestionStart) {
          gameMode.onQuestionStart(
            processedQuestions[currentQuestionIndex + 1],
            currentQuestionIndex + 1,
            modeSettings
          )
        }
      } else {
        handleQuizComplete()
      }
    }, delay)
  }, [currentQuestion, currentQuestionIndex, processedQuestions, streak, maxStreak, gameMode, modeSettings])
  
  // Handle completion
  const handleQuizComplete = useCallback(async () => {
    const endTime = Date.now()
    const totalTime = Math.floor((endTime - startTimeRef.current) / 1000)
    
    // Calculate results
    const correctAnswers = processedQuestions.reduce((count, question) => {
      const qId = getQuestionId(question)
      return answers[qId] === question.correct_answer ? count + 1 : count
    }, 0)
    
    const results: QuizResults = {
      totalQuestions: processedQuestions.length,
      correctAnswers,
      incorrectAnswers: processedQuestions.length - correctAnswers,
      score: Math.round((correctAnswers / processedQuestions.length) * 100),
      timeTaken: totalTime,
      timeSpentSeconds: totalTime,
      questions: processedQuestions.map(q => {
        const qId = getQuestionId(q)
        return {
          question: q,
          userAnswer: answers[qId] || '',
          isCorrect: answers[qId] === q.correct_answer
        }
      })
    }
    
    // Call mode completion hook
    if (gameMode?.onQuizComplete) {
      gameMode.onQuizComplete(results, modeSettings)
    }
    
    // Save results
    if (topicId) {
      try {
        await quizSaveManager.saveQuizResults({
          topicId,
          results,
          userId,
          guestToken,
          attemptId: resumedAttemptId,
          searchParams: {
            mode: mode as QuizGameMode,
            podId,
            classroomCourseId,
            classroomAssignmentId,
            cleverSectionId
          }
        })
      } catch (error) {
        console.error('Failed to save quiz results:', error)
      }
    }
    
    setShowResults(true)
    onComplete(results)
  }, [processedQuestions, answers, responseTimes, gameMode, modeSettings, topicId, userId, guestToken, mode, resumedAttemptId, podId, classroomCourseId, classroomAssignmentId, cleverSectionId, onComplete])
  
  if (!isClient) {
    return null
  }
  
  if (processedQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    )
  }
  
  if (showResults) {
    const correctCount = processedQuestions.reduce((count, question) => {
      const qId = getQuestionId(question)
      return answers[qId] === question.correct_answer ? count + 1 : count
    }, 0)
    
    const score = Math.round((correctCount / processedQuestions.length) * 100)
    
    return (
      <div className="w-full max-w-4xl mx-auto text-center space-y-6 py-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-xl text-muted-foreground">
            You scored {score}%
          </p>
        </div>
        
        <div className="bg-muted/20 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-lg font-medium">{correctCount} out of {processedQuestions.length} correct</p>
            {maxStreak > 1 && (
              <p className="text-sm text-muted-foreground">
                Best streak: {maxStreak} in a row 🔥
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              // Reset for retry
              setCurrentQuestionIndex(0)
              setAnswers({})
              setShowResults(false)
              setStreak(0)
              setMaxStreak(0)
              setResponseTimes({})
              startTimeRef.current = Date.now()
              questionStartTimeRef.current = Date.now()
            }}
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => {
              if (topicId) {
                router.push(`/quiz/${topicId}`)
              } else {
                router.push('/quiz')
              }
            }}
          >
            Continue Learning
          </Button>
        </div>
      </div>
    )
  }
  
  const progress = ((currentQuestionIndex + 1) / processedQuestions.length) * 100
  const options = currentQuestion ? getQuestionOptions(currentQuestion) : []
  const questionId = currentQuestion ? getQuestionId(currentQuestion) : ''
  const hasAnswered = !!answers[questionId]
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{gameMode?.icon}</span>
          <span className="font-medium">{gameMode?.displayName}</span>
        </div>
        
        {/* Timer if applicable */}
        {hasTimeLimit && timeRemaining !== null && (
          <div className={cn(
            "font-mono text-lg",
            timeRemaining <= 10 && "text-red-500 animate-pulse"
          )}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {processedQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Question card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-lg space-y-6">
        {/* Question text */}
        <h2 className="text-xl font-semibold">
          {currentQuestion?.question}
        </h2>
        
        {/* Answer options */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = answers[questionId] === option
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={hasAnswered}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  "hover:border-primary hover:bg-primary/5",
                  isSelected && "border-primary bg-primary/10",
                  hasAnswered && "cursor-not-allowed opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Skip button if allowed */}
        {(modeSettings as StandardModeSettings)?.allowSkip && !hasAnswered && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => handleAnswer('')}
              className="text-sm"
            >
              Skip Question →
            </Button>
          </div>
        )}
      </div>
      
      {/* Streak indicator */}
      {streak > 1 && (
        <div className="text-center animate-in zoom-in duration-300">
          <span className="text-sm font-medium text-primary">
            🔥 {streak} answer streak!
          </span>
        </div>
      )}
      
      {/* Exit button */}
      {onExit && (
        <div className="text-center">
          <Button variant="ghost" onClick={onExit}>
            Exit Quiz
          </Button>
        </div>
      )}
    </div>
  )
} 