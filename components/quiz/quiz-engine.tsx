"use client"

import { useState, useEffect, useMemo } from "react"
import type { QuizQuestion } from "@/lib/quiz-data"
import { MultipleChoiceQuestion } from "./question-types/multiple-choice"
import { TrueFalseQuestion } from "./question-types/true-false"
import { ShortAnswerQuestion } from "./question-types/short-answer"
import { MatchingQuestion } from "./question-types/matching"
import { FillInBlankQuestion } from "./question-types/fill-in-blank"
import { OrderingQuestion } from "./question-types/ordering"
import { QuizResults } from "./quiz-results"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, HelpCircle, ExternalLink, Clock, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, shuffleArray } from "@/lib/utils"

interface QuizEngineProps {
  questions: QuizQuestion[]
  topicId: string
  onComplete: () => void
}

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
}

export function QuizEngine({ questions, topicId, onComplete }: QuizEngineProps) {
  // Randomize questions once when component mounts
  const randomizedQuestions = useMemo(() => shuffleArray(questions), [questions])
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds per question
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [streak, setStreak] = useState(0)
  const [animateProgress, setAnimateProgress] = useState(false)

  const currentQuestion = randomizedQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === randomizedQuestions.length - 1
  const progress = ((currentQuestionIndex + 1) / randomizedQuestions.length) * 100

  // Timer effect
  useEffect(() => {
    if (!isTimerActive || isAnswerSubmitted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerActive, isAnswerSubmitted])

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(60)
    setIsTimerActive(true)
    setQuestionStartTime(Date.now())
    setShowFeedback(false)
    setAnimateProgress(true)
    
    // Reset animation after a short delay
    setTimeout(() => setAnimateProgress(false), 300)
  }, [currentQuestionIndex])

  // Keyboard shortcuts for quiz interaction
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs or if modifiers are pressed
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      // If answer is already submitted, only allow next question navigation
      if (isAnswerSubmitted) {
        switch (event.key) {
          case 'Enter':
          case ' ': // Spacebar
          case 'ArrowRight':
          case 'n': // Next
            event.preventDefault()
            handleNextQuestion()
            break
          case '?':
            event.preventDefault()
            alert(`Quiz Keyboard Shortcuts:
Enter / Space / → / n: Next question (after answering)
?: Show this help`)
            break
        }
        return
      }

      // Before submitting answer
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
          if (currentQuestion.question_type === 'multiple_choice') {
            event.preventDefault()
            const options = ['A', 'B', 'C', 'D']
            const selectedOption = options[parseInt(event.key) - 1]
            if (selectedOption && currentQuestion[`option_${selectedOption.toLowerCase()}` as keyof QuizQuestion]) {
              handleAnswerSelect(selectedOption)
            }
          }
          break
        case 't':
        case 'T':
          if (currentQuestion.question_type === 'true_false') {
            event.preventDefault()
            handleAnswerSelect('True')
          }
          break
        case 'f':
        case 'F':
          if (currentQuestion.question_type === 'true_false') {
            event.preventDefault()
            handleAnswerSelect('False')
          }
          break
        case 'Enter':
          if (selectedAnswer) {
            event.preventDefault()
            handleSubmitAnswer()
          }
          break
        case ' ': // Spacebar for hint
          event.preventDefault()
          setShowHint(!showHint)
          break
        case 'h':
          event.preventDefault()
          setShowHint(!showHint)
          break
        case '?':
          event.preventDefault()
          const helpText = currentQuestion.question_type === 'multiple_choice' 
            ? `Quiz Keyboard Shortcuts:
1-4: Select answer options A-D
Enter: Submit answer
Space / h: Toggle hint
?: Show this help`
            : currentQuestion.question_type === 'true_false'
            ? `Quiz Keyboard Shortcuts:
t: Select True
f: Select False
Enter: Submit answer
Space / h: Toggle hint
?: Show this help`
            : `Quiz Keyboard Shortcuts:
Enter: Submit answer
Space / h: Toggle hint
?: Show this help`
          alert(helpText)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, selectedAnswer, isAnswerSubmitted, showHint])

  const handleTimeUp = () => {
    if (isAnswerSubmitted) return
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer || "",
      isCorrect: false, // Time's up = incorrect
      timeSpent,
    }

    setUserAnswers([...userAnswers, newAnswer])
    setIsAnswerSubmitted(true)
    setIsTimerActive(false)
    setShowFeedback(true)
    setStreak(0) // Reset streak on timeout
  }

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer)
    }
  }

  const handleInteractiveAnswer = (answer: string, isCorrect: boolean) => {
    if (isAnswerSubmitted) return

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer,
      isCorrect,
      timeSpent,
    }

    setUserAnswers([...userAnswers, newAnswer])
    setIsAnswerSubmitted(true)
    setIsTimerActive(false)
    setShowFeedback(true)
    setSelectedAnswer(answer)

    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
    }

    setUserAnswers([...userAnswers, newAnswer])
    setIsAnswerSubmitted(true)
    setIsTimerActive(false)
    setShowFeedback(true)

    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswerSubmitted(false)
      setShowHint(false)
    }
  }

  const handleFinishQuiz = () => {
    onComplete()
  }

  const getTimerColor = () => {
    if (timeLeft > 30) return "text-green-600"
    if (timeLeft > 10) return "text-yellow-600"
    return "text-red-600"
  }

  const getTimerBgColor = () => {
    if (timeLeft > 30) return "bg-green-100 dark:bg-green-900/20"
    if (timeLeft > 10) return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-red-100 dark:bg-red-900/20"
  }

  if (showResults) {
    return <QuizResults userAnswers={userAnswers} questions={randomizedQuestions} onFinish={handleFinishQuiz} topicId={topicId} />
  }

  const renderQuestion = () => {
    switch (currentQuestion.question_type) {
      case "multiple_choice":
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "true_false":
        return (
          <TrueFalseQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "short_answer":
        return (
          <ShortAnswerQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
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
      case "fill_in_blank":
        return (
          <FillInBlankQuestion
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
      default:
        return <div>Unsupported question type: {currentQuestion.question_type}</div>
    }
  }

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 py-4 sm:py-6">
      {/* Compact header with progress and timer */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {randomizedQuestions.length}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Streak indicator */}
            {streak > 0 && (
              <div className="flex items-center space-x-1 text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{streak}</span>
              </div>
            )}
            
            {/* Timer */}
            <div className={cn(
              "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-full transition-all duration-300",
              getTimerBgColor(),
              timeLeft <= 10 && "animate-pulse-glow"
            )}>
              <Clock className={cn("h-3 w-3 sm:h-4 sm:w-4", getTimerColor())} />
              <span className={cn("text-xs sm:text-sm font-mono font-bold", getTimerColor())}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Animated progress bar */}
        <div className="relative">
          <Progress 
            value={progress} 
            className={cn(
              "h-2 sm:h-3 transition-all duration-500 ease-out",
              animateProgress && "scale-105"
            )} 
          />
          {/* Progress glow effect */}
          <div 
            className="absolute top-0 left-0 h-2 sm:h-3 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-grow">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-start justify-between">
            <h3 className={cn(
              "text-xl sm:text-3xl font-bold mb-4 transition-all duration-300 leading-tight pr-2",
              showFeedback && "scale-105"
            )}>
              {currentQuestion.question}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowHint(!showHint)} 
                    className={cn(
                      "ml-2 transition-all duration-200 hover:scale-110 flex-shrink-0",
                      showHint && "bg-blue-100 dark:bg-blue-900/20"
                    )}
                  >
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">Show hint</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentQuestion.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Animated hint */}
          {showHint && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-2 text-sm border-l-4 border-blue-400 animate-in slide-in-from-top-2 duration-300">
              <strong>💡 Hint:</strong> {currentQuestion.hint}
            </div>
          )}
        </div>

        {/* Question content with animation */}
        <div className={cn(
          "transition-all duration-300",
          showFeedback && "transform scale-[0.98]"
        )}>
          {renderQuestion()}
        </div>

        {/* Consolidated feedback - no redundant messaging */}
        {isAnswerSubmitted && (
          <div className="mt-4 sm:mt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className={cn(
              "p-4 rounded-xl border-l-4 transition-all duration-300",
              selectedAnswer === currentQuestion.correct_answer 
                ? "bg-green-50 dark:bg-green-900/20 border-green-500" 
                : "bg-red-50 dark:bg-red-900/20 border-red-500"
            )}>
              <p className="font-semibold mb-2 flex items-center text-sm sm:text-base">
                {selectedAnswer === currentQuestion.correct_answer ? (
                  <>
                    <span className="text-xl sm:text-2xl mr-2">🎉</span>
                    <span className="text-green-700 dark:text-green-300">Correct!</span>
                    {timeLeft > 45 && <span className="ml-2 text-xs sm:text-sm text-green-600">⚡ Fast!</span>}
                  </>
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl mr-2">😔</span>
                    <span className="text-red-700 dark:text-red-300">
                      {timeLeft === 0 ? "Time's up!" : "Not quite right"}
                    </span>
                  </>
                )}
              </p>
              <p className="text-sm mb-3 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons with animations */}
      <div className="mt-4 sm:mt-6 flex justify-end">
        {!isAnswerSubmitted ? (
          <Button 
            onClick={handleSubmitAnswer} 
            disabled={!selectedAnswer || timeLeft === 0} 
            className={cn(
              "rounded-full px-6 sm:px-8 py-2 sm:py-3 transition-all duration-200 hover:scale-105",
              selectedAnswer && "bg-blue-600 hover:bg-blue-700 shadow-lg"
            )}
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={handleNextQuestion} 
            className="rounded-full px-6 sm:px-8 py-2 sm:py-3 transition-all duration-200 hover:scale-105 animate-in slide-in-from-right duration-300"
          >
            {isLastQuestion ? "See Results" : "Next Question"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-300 dark:text-slate-600">
          {currentQuestion.question_type === 'multiple_choice' && !isAnswerSubmitted && (
            <>Use <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">1-4</kbd> to select, </>
          )}
          {currentQuestion.question_type === 'true_false' && !isAnswerSubmitted && (
            <>Use <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">T</kbd>/<kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">F</kbd> to select, </>
          )}
          {!isAnswerSubmitted ? (
            <>
              <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd> to submit, <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">Space</kbd> for hint
            </>
          ) : (
            <>
              <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd> for next question
            </>
          )}
          , <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">?</kbd> for help
        </p>
      </div>
    </div>
  )
}
