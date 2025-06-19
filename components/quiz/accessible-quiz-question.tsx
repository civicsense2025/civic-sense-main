"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Volume2, 
  VolumeX,
  Keyboard,
  Accessibility,
  Timer,
  Play,
  Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccessibility, useAccessibilityKeyboardShortcuts } from '@/components/accessibility/accessibility-provider'

interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  timeLimit?: number
}

interface AccessibleQuizQuestionProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: number
  onAnswerSelect: (answerIndex: number) => void
  onNext?: () => void
  onPrevious?: () => void
  showCorrectAnswer?: boolean
  showExplanation?: boolean
  timeRemaining?: number
  className?: string
}

export function AccessibleQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  showCorrectAnswer = false,
  showExplanation = false,
  timeRemaining,
  className
}: AccessibleQuizQuestionProps) {
  const { speak, stopSpeaking, announceToScreenReader, preferences, isSpeaking } = useAccessibility()
  const [hasBeenRead, setHasBeenRead] = useState(false)
  const [isReading, setIsReading] = useState(false)

  // Enable keyboard shortcuts
  useAccessibilityKeyboardShortcuts()

  // Auto-read question when it appears (if enabled)
  useEffect(() => {
    if (preferences.audioEnabled && preferences.autoPlayQuestions && !hasBeenRead) {
      const delay = preferences.extendedTimeouts ? 1000 : 500
      const timer = setTimeout(() => {
        readQuestion()
        setHasBeenRead(true)
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [question.id, preferences.audioEnabled, preferences.autoPlayQuestions, hasBeenRead])

  // Auto-read answers after question (if enabled)
  useEffect(() => {
    if (preferences.audioEnabled && preferences.autoPlayAnswers && hasBeenRead) {
      const delay = 2000 // Wait 2 seconds after question
      const timer = setTimeout(() => {
        readAnswerOptions()
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [hasBeenRead, preferences.audioEnabled, preferences.autoPlayAnswers])

  // Listen for global accessibility events
  useEffect(() => {
    const handleAccessibilityEvent = (event: CustomEvent) => {
      switch (event.type) {
        case 'accessibility-answer-select':
          const answerIndex = event.detail.answerIndex
          if (answerIndex < question.options.length) {
            handleAnswerSelect(answerIndex)
          }
          break
        case 'accessibility-next-question':
          if (onNext) onNext()
          break
        case 'accessibility-previous-question':
          if (onPrevious) onPrevious()
          break
        case 'accessibility-read-current':
          readQuestion()
          break
        case 'accessibility-show-help':
          showKeyboardHelp()
          break
      }
    }

    const events = [
      'accessibility-answer-select',
      'accessibility-next-question', 
      'accessibility-previous-question',
      'accessibility-read-current',
      'accessibility-show-help'
    ]

    events.forEach(eventType => {
      window.addEventListener(eventType, handleAccessibilityEvent as EventListener)
    })

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleAccessibilityEvent as EventListener)
      })
    }
  }, [question, onNext, onPrevious])

  const readQuestion = useCallback(() => {
    const questionText = `Question ${questionNumber} of ${totalQuestions}: ${question.text}`
    speak(questionText)
    announceToScreenReader("Reading question")
    setIsReading(true)
    setTimeout(() => setIsReading(false), 3000)
  }, [question, questionNumber, totalQuestions, speak, announceToScreenReader])

  const readAnswerOptions = useCallback(() => {
    const optionsText = question.options
      .map((option, index) => `Option ${index + 1}: ${option}`)
      .join('. ')
    speak(`Answer choices: ${optionsText}`)
    announceToScreenReader("Reading answer options")
  }, [question.options, speak, announceToScreenReader])

  const handleAnswerSelect = (answerIndex: number) => {
    onAnswerSelect(answerIndex)
    
    const optionLetter = String.fromCharCode(65 + answerIndex) // A, B, C, D
    const announcement = `Selected answer ${optionLetter}: ${question.options[answerIndex]}`
    announceToScreenReader(announcement)
    
    if (preferences.audioEnabled) {
      speak(`Selected ${optionLetter}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle number key shortcuts for answer selection
    if (e.key >= '1' && e.key <= '9') {
      const answerIndex = parseInt(e.key) - 1
      if (answerIndex < question.options.length) {
        e.preventDefault()
        handleAnswerSelect(answerIndex)
      }
    }
    
    // Handle other shortcuts
    switch (e.key) {
      case 'r':
      case 'R':
        e.preventDefault()
        readQuestion()
        break
      case 'o':
      case 'O':
        e.preventDefault()
        readAnswerOptions()
        break
      case 'n':
      case 'N':
        if (onNext) {
          e.preventDefault()
          onNext()
        }
        break
      case 'p':
      case 'P':
        if (onPrevious) {
          e.preventDefault()
          onPrevious()
        }
        break
      case 'Escape':
        e.preventDefault()
        stopSpeaking()
        break
    }
  }

  const showKeyboardHelp = () => {
    const helpText = `
      Keyboard shortcuts: 
      Numbers 1 through ${question.options.length} to select answers. 
      R to read question. 
      O to read options. 
      N for next question. 
      P for previous question. 
      Escape to stop reading.
    `
    announceToScreenReader(helpText)
  }

  const getAnswerOptionClassName = (index: number) => {
    return cn(
      "quiz-option w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
      "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      preferences.reducedMotion && "transition-none",
      selectedAnswer === index && "border-blue-500 bg-blue-100 dark:bg-blue-900/30",
      showCorrectAnswer && index === question.correctAnswer && "border-green-500 bg-green-100 dark:bg-green-900/30",
      showCorrectAnswer && selectedAnswer === index && index !== question.correctAnswer && "border-red-500 bg-red-100 dark:bg-red-900/30"
    )
  }

  return (
    <Card className={cn("quiz-container", className)} onKeyDown={handleKeyDown} tabIndex={-1}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle 
            id={`question-${question.id}-title`}
            className="text-lg font-semibold"
          >
            Question {questionNumber} of {totalQuestions}
            {question.category && (
              <Badge variant="outline" className="ml-3">
                {question.category}
              </Badge>
            )}
          </CardTitle>
          
          {/* Audio controls */}
          <div className="flex items-center gap-2">
            {preferences.audioEnabled && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={readQuestion}
                  disabled={isSpeaking && isReading}
                  aria-label="Read question aloud"
                >
                  {isSpeaking && isReading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  aria-label="Stop reading"
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {timeRemaining !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>{Math.ceil(timeRemaining / 1000)}s</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4">
          <Progress 
            value={(questionNumber / totalQuestions) * 100} 
            className="h-2"
            aria-label={`Question ${questionNumber} of ${totalQuestions}`}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Question {questionNumber} of {totalQuestions}: {question.text}
        </div>
        
        {/* Question text */}
        <div 
          className="text-lg leading-relaxed"
          id={`question-${question.id}-text`}
          aria-describedby={`question-${question.id}-instructions`}
        >
          {question.text}
        </div>
        
        {/* Instructions for screen readers */}
        <div id={`question-${question.id}-instructions`} className="sr-only">
          Choose one answer from the {question.options.length} options below. 
          {preferences.keyboardShortcuts && 
            `You can use number keys 1 through ${question.options.length} to select answers quickly.`
          }
        </div>
        
        {/* Answer options */}
        <fieldset 
          className="space-y-3"
          aria-labelledby={`question-${question.id}-title`}
          role="radiogroup"
        >
          <legend className="sr-only">Answer options</legend>
          
          {question.options.map((option, index) => (
            <label key={index} className="block">
              <button
                type="button"
                className={getAnswerOptionClassName(index)}
                onClick={() => handleAnswerSelect(index)}
                aria-checked={selectedAnswer === index}
                aria-describedby={`option-${index}-description`}
                role="radio"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      selectedAnswer === index 
                        ? "border-blue-500 bg-blue-500" 
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      {selectedAnswer === index && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      <span className="font-medium">{index + 1}</span>
                    </div>
                    <p className="text-left mt-1">{option}</p>
                  </div>
                  
                  {/* Result indicators */}
                  {showCorrectAnswer && (
                    <div className="flex-shrink-0">
                      {index === question.correctAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : selectedAnswer === index ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
              
              <div id={`option-${index}-description`} className="sr-only">
                Option {String.fromCharCode(65 + index)}: {option}
                {selectedAnswer === index && " - Selected"}
                {showCorrectAnswer && index === question.correctAnswer && " - Correct answer"}
              </div>
            </label>
          ))}
        </fieldset>
        
        {/* Explanation */}
        {showExplanation && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Explanation</h4>
            <p className="text-blue-800 dark:text-blue-200">{question.explanation}</p>
          </div>
        )}
        
        {/* Keyboard shortcuts help */}
        {preferences.keyboardShortcuts && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Keyboard Shortcuts
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">1-{question.options.length}</kbd> Select answer</p>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">R</kbd> Read question</p>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">O</kbd> Read options</p>
              </div>
              <div>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">N</kbd> Next question</p>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">P</kbd> Previous question</p>
                <p><kbd className="bg-white dark:bg-gray-800 px-1 rounded">Esc</kbd> Stop reading</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!onPrevious}
            className="flex items-center gap-2"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-4">
            {preferences.audioEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={readAnswerOptions}
                className="flex items-center gap-2"
                aria-label="Read all answer options aloud"
              >
                <Volume2 className="h-4 w-4" />
                Read Options
              </Button>
            )}
            
            <Button
              onClick={onNext}
              disabled={!onNext || selectedAnswer === undefined}
              className="flex items-center gap-2"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 