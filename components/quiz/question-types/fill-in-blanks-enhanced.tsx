"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { QuizQuestion } from '@/lib/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Lightbulb, TrendingUp } from 'lucide-react'

interface FillInBlanksEnhancedQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface BlankDefinition {
  id: string
  type: 'dropdown' | 'text'
  label: string
  options?: string[]
  correct_answer: string
  feedback?: string
}

interface InteractiveFillInBlanksData {
  type: 'fill_in_blanks'
  title: string
  instructions: string
  text: string
  blanks: BlankDefinition[]
  completion_message: string
  show_progress: boolean
}

// Individual blank component
function BlankInput({ 
  blank, 
  value, 
  onChange, 
  isSubmitted, 
  feedback 
}: { 
  blank: BlankDefinition
  value: string
  onChange: (value: string) => void
  isSubmitted: boolean
  feedback?: 'correct' | 'incorrect' | null
}) {
  if (blank.type === 'dropdown' && blank.options) {
    return (
      <div className="inline-block mx-1 relative">
        <Select 
          value={value} 
          onValueChange={onChange}
          disabled={isSubmitted}
        >
          <SelectTrigger 
            className={cn(
              "w-auto min-w-[140px] h-8 text-sm border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
              !isSubmitted && "border-blue-300 bg-blue-50/50",
              isSubmitted && feedback === 'correct' && "border-green-500 bg-green-50",
              isSubmitted && feedback === 'incorrect' && "border-red-500 bg-red-50"
            )}
            aria-label={blank.label}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {blank.options.map((option, index) => (
              <SelectItem key={index} value={option} aria-label={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Feedback indicator */}
        {isSubmitted && feedback && (
          <div className="absolute -top-1 -right-1">
            {feedback === 'correct' ? (
              <CheckCircle className="w-4 h-4 text-green-600 bg-white rounded-full" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 bg-white rounded-full" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    )
  }

  // Text input fallback
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isSubmitted}
      placeholder="Type here..."
      aria-label={blank.label}
      className={cn(
        "inline-block mx-1 w-32 h-8 px-2 text-sm border-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        !isSubmitted && "border-blue-300 bg-blue-50/50",
        isSubmitted && feedback === 'correct' && "border-green-500 bg-green-50",
        isSubmitted && feedback === 'incorrect' && "border-red-500 bg-red-50"
      )}
    />
  )
}

export function FillInBlanksEnhancedQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: FillInBlanksEnhancedQuestionProps) {
  // Parse interactive data or create legacy format
  const interactiveData = useMemo((): InteractiveFillInBlanksData | null => {
    if (question.interactive_data?.type === 'fill_in_blanks') {
      return question.interactive_data as InteractiveFillInBlanksData
    }

    // Legacy support - convert fill_in_blanks to interactive format
    if (question.type === 'fill_in_blank' && 'fill_in_blanks' in question && question.fill_in_blanks) {
      return {
        type: 'fill_in_blanks',
        title: 'Complete the Analysis',
        instructions: 'Fill in the blanks with the correct terms',
        text: question.question,
        blanks: question.fill_in_blanks.map((blank, index) => ({
          id: `blank_${index}`,
          type: 'text',
          label: `Blank ${index + 1}`,
          correct_answer: blank.answer,
          feedback: `The correct answer is "${blank.answer}"`
        })),
        completion_message: "Well done! You've completed the analysis.",
        show_progress: true
      }
    }

    return null
  }, [question])

  // State management
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  // Accessibility: ARIA live region for feedback/announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Reset state when question changes
  useEffect(() => {
    setAnswers({})
    setFeedback({})
    setIsSubmitted(false)
  }, [question.question])

  if (!interactiveData) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This fill-in-blanks question doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  // Parse text and replace {{blank_n}} with input components
  const parseQuestionText = () => {
    let text = interactiveData.text
    const parts: (string | React.ReactNode)[] = []
    
    // Find all blank placeholders
    const blankPattern = /\{\{(blank_\d+)\}\}/g
    let lastIndex = 0
    let match

    while ((match = blankPattern.exec(text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      const blankId = match[1]
      const blank = interactiveData.blanks.find(b => b.id === blankId)
      
      if (blank) {
        parts.push(
          <BlankInput
            key={blankId}
            blank={blank}
            value={answers[blankId] || ''}
            onChange={(value) => setAnswers(prev => ({ ...prev, [blankId]: value }))}
            isSubmitted={isSubmitted}
            feedback={feedback[blankId] || null}
          />
        )
      } else {
        // Fallback if blank not found
        parts.push(`[${blankId}]`)
      }

      lastIndex = blankPattern.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  const handleAnswerChange = useCallback((blankId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [blankId]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (isSubmitted || disabled) return

    const newFeedback: Record<string, 'correct' | 'incorrect'> = {}
    let correctCount = 0

    // Check each answer
    interactiveData.blanks.forEach(blank => {
      const userAnswer = answers[blank.id] || ''
      const isCorrect = userAnswer.trim().toLowerCase() === blank.correct_answer.toLowerCase()
      
      if (isCorrect) {
        correctCount++
        newFeedback[blank.id] = 'correct'
      } else {
        newFeedback[blank.id] = 'incorrect'
      }
    })

    setFeedback(newFeedback)
    setIsSubmitted(true)

    // Calculate score
    const totalBlanks = interactiveData.blanks.length
    const scorePercentage = Math.round((correctCount / totalBlanks) * 100)
    const isFullyCorrect = correctCount === totalBlanks

    const answerSummary = `${correctCount}/${totalBlanks} blanks correct (${scorePercentage}%)`
    setAriaAnnouncement(isFullyCorrect ? 'All answers correct!' : `${correctCount} of ${totalBlanks} correct.`)
    onAnswer(answerSummary)
  }, [answers, interactiveData.blanks, isSubmitted, disabled, onAnswer])

  const handleReset = useCallback(() => {
    if (isSubmitted) return
    setAnswers({})
  }, [isSubmitted])

  // Calculate progress
  const completedBlanks = Object.values(answers).filter(answer => answer.trim() !== '').length
  const totalBlanks = interactiveData.blanks.length
  const progressPercentage = Math.round((completedBlanks / totalBlanks) * 100)
  const isComplete = completedBlanks === totalBlanks

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="fillblanks-title">{interactiveData.title}</h3>
        <p className="text-sm text-muted-foreground" id="fillblanks-instructions">{interactiveData.instructions}</p>
      </div>

      {/* Progress indicator */}
      {interactiveData.show_progress && (
        <div className="flex items-center justify-center gap-3" aria-live="polite" aria-atomic="true">
          <TrendingUp className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <div className="text-sm">
            <span className="font-medium">{completedBlanks}</span>
            <span className="text-muted-foreground"> of {totalBlanks} completed</span>
            <span className="ml-2 text-blue-600">({progressPercentage}%)</span>
          </div>
        </div>
      )}

      {/* Civic Education Context */}
      {question.explanation && showHint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Policy Context:</strong> {question.explanation}
            </div>
          </div>
        </div>
      )}

      {/* ARIA live region for feedback/announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>

      {/* Main content with blanks */}
      <Card>
        <CardContent className="p-6">
          <div className="text-base leading-relaxed" role="region" aria-labelledby="fillblanks-title" aria-describedby="fillblanks-instructions">
            {parseQuestionText()}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="px-6"
        >
          Submit Answers ({completedBlanks}/{totalBlanks})
        </Button>
        
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={completedBlanks === 0 || disabled}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Results and feedback */}
      {isSubmitted && (
        <div className="space-y-4">
          {/* Completion message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <div className="text-blue-800 dark:text-blue-200 font-medium">
              {interactiveData.completion_message}
            </div>
          </div>

          {/* Detailed feedback */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Answer Review:</h4>
              <div className="space-y-3">
                {interactiveData.blanks.map((blank, index) => {
                  const userAnswer = answers[blank.id] || ''
                  const isCorrect = feedback[blank.id] === 'correct'
                  
                  return (
                    <div key={blank.id} className="flex items-start gap-3 text-sm">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )} aria-label={isCorrect ? 'Correct answer' : 'Incorrect answer'}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{blank.label}:</span>
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span>Your answer:</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              isCorrect ? "border-green-500 text-green-700" : "border-red-500 text-red-700"
                            )}
                          >
                            {userAnswer || '(no answer)'}
                          </Badge>
                          
                          {!isCorrect && (
                            <>
                              <span>Correct:</span>
                              <Badge variant="outline" className="border-gray-500 text-gray-700">
                                {blank.correct_answer}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {blank.feedback && !isCorrect && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {blank.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}