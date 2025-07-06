'use client'

import React, { useState, useCallback } from 'react'
import { QuizQuestion } from '@/lib/quiz-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
import { CivicCard } from '@/components/civic-card'
import { Badge } from '@/components/ui/badge'

interface FillInBlankQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string, isCorrect: boolean) => void
  showHint?: boolean
  disabled?: boolean
}

interface BlankAnswer {
  id: number
  value: string
  isCorrect?: boolean
}

// CivicSense UncomfortableTruth component (local)
function UncomfortableTruth({ truth }: { truth: string }) {
  return (
    <div className="bg-warning/10 border-l-4 border-warning p-4 my-4 rounded-lg">
      <h4 className="font-semibold text-warning">What They Don't Want You to Know:</h4>
      <p className="text-sm mt-2">{truth}</p>
    </div>
  )
}

export function FillInBlankQuestion({ 
  question, 
  onAnswer, 
  showHint = false, 
  disabled = false 
}: FillInBlankQuestionProps) {
  const blanks: { answer: string }[] = (question as any).fill_in_blanks || []
  const [answers, setAnswers] = useState<BlankAnswer[]>(
    blanks.map((_: { answer: string }, index: number) => ({ id: index, value: '' }))
  )
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("")

  // Parse question text to replace [BLANK] with input fields
  const parseQuestionText = () => {
    let text = question.question
    let blankIndex = 0
    const parts: (string | React.ReactNode)[] = []
    
    while (text.includes('[BLANK]') && blankIndex < blanks.length) {
      const beforeBlank = text.substring(0, text.indexOf('[BLANK]'))
      if (beforeBlank) {
        parts.push(beforeBlank)
      }
      
      const answer = answers[blankIndex]
      const correctAnswer = blanks[blankIndex]?.answer || ''
      const isCorrect = answer?.isCorrect
      
      parts.push(
        <span key={`blank-${blankIndex}`} className="inline-block mx-1">
          <Input
            value={answer?.value || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(blankIndex, e.target.value)}
            disabled={disabled || isSubmitted}
            className={cn(
              "inline-block w-auto min-w-[120px] h-8 text-center border-b-2 border-l-0 border-r-0 border-t-0 rounded-none bg-transparent focus:border-blue-500",
              isSubmitted && isCorrect === true && "border-green-500 bg-green-50",
              isSubmitted && isCorrect === false && "border-red-500 bg-red-50"
            )}
            placeholder={`Blank ${blankIndex + 1}`}
            aria-label={`Blank ${blankIndex + 1}`}
          />
          {isSubmitted && (
            <span className="inline-block ml-1">
              {isCorrect === true && <CheckCircle className="inline w-4 h-4 text-green-600" />}
              {isCorrect === false && <XCircle className="inline w-4 h-4 text-red-600" />}
            </span>
          )}
        </span>
      )
      
      text = text.substring(text.indexOf('[BLANK]') + '[BLANK]'.length)
      blankIndex++
    }
    
    if (text) {
      parts.push(text)
    }
    
    return parts
  }

  const handleAnswerChange = useCallback((index: number, value: string) => {
    setAnswers(prev => prev.map((answer, i) => 
      i === index ? { ...answer, value } : answer
    ))
  }, [])

  const handleSubmit = useCallback(() => {
    const gradedAnswers = answers.map((answer, index) => {
      const correctAnswer = blanks[index]?.answer || ''
      const isCorrect = answer.value.trim().toLowerCase() === correctAnswer.toLowerCase()
      return { ...answer, isCorrect }
    })
    
    setAnswers(gradedAnswers)
    setIsSubmitted(true)
    
    const correctCount = gradedAnswers.filter(a => a.isCorrect).length
    const score = Math.round((correctCount / blanks.length) * 100)
    const isAllCorrect = correctCount === blanks.length
    
    const answerSummary = `${correctCount}/${blanks.length} correct (${score}%)`
    setAriaAnnouncement(isAllCorrect ? 'All answers correct!' : `${correctCount} of ${blanks.length} correct.`)
    onAnswer(answerSummary, isAllCorrect)
  }, [answers, blanks, onAnswer])

  const isComplete = answers.every(answer => answer.value.trim() !== '')

  return (
    <div className="space-y-6">
      {/* ARIA live region for feedback and instructions */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>
      {/* Question with integrated blanks */}
      <div className="text-lg font-medium leading-relaxed" id="fill-in-blank-question-text">
        {parseQuestionText()}
      </div>
      {/* Direct, active instructional text with keyboard navigation info */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg" id="fill-in-blank-instructions">
        <Badge variant="outline" className="mr-2">Instruction</Badge>
        Type your answer in each blank. Press <kbd>Tab</kbd> to move between blanks. Press <kbd>Enter</kbd> to submit. All answers are required.
      </div>
      {/* Foreground hint/explanation as uncomfortable truth if present */}
      {showHint && question.explanation && (
        <UncomfortableTruth truth={question.explanation} />
      )}
      {/* Answer Summary (shown after submission) */}
      {isSubmitted && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">Correct Answers:</h3>
          <div className="space-y-2">
            {blanks.map((blank: { answer: string }, index: number) => {
              const userAnswer = answers[index]
              const isCorrect = userAnswer?.isCorrect
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium min-w-[60px]">
                    Blank {index + 1}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-sm",
                      isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      Your answer: "{userAnswer?.value || ''}"
                    </span>
                    {!isCorrect && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          Correct: "{blank.answer}"
                        </span>
                      </>
                    )}
                    {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="flex-1"
          aria-label="Submit answers for fill in the blank question"
        >
          Submit Answers ({answers.filter(a => a.value.trim()).length}/{blanks.length} filled)
        </Button>
      </div>
    </div>
  )
} 