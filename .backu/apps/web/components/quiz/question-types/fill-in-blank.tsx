'use client'

import React, { useState, useCallback } from 'react'
import { QuizQuestion } from '@civicsense/types/quiz'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '@civicsense/business-logic/utils'
import { CheckCircle, XCircle } from 'lucide-react'

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

export function FillInBlankQuestion({ 
  question, 
  onAnswer, 
  showHint = false, 
  disabled = false 
}: FillInBlankQuestionProps) {
  const blanks = question.fill_in_blanks || []
  const [answers, setAnswers] = useState<BlankAnswer[]>(
    blanks.map((_, index) => ({ id: index, value: '' }))
  )
  const [isSubmitted, setIsSubmitted] = useState(false)

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
            onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
            disabled={disabled || isSubmitted}
            className={cn(
              "inline-block w-auto min-w-[120px] h-8 text-center border-b-2 border-l-0 border-r-0 border-t-0 rounded-none bg-transparent focus:border-blue-500",
              isSubmitted && isCorrect === true && "border-green-500 bg-green-50",
              isSubmitted && isCorrect === false && "border-red-500 bg-red-50"
            )}
            placeholder={`Blank ${blankIndex + 1}`}
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
    onAnswer(answerSummary, isAllCorrect)
  }, [answers, blanks, onAnswer])

  const isComplete = answers.every(answer => answer.value.trim() !== '')

  return (
    <div className="space-y-6">
      {/* Question with integrated blanks */}
      <div className="text-lg font-medium leading-relaxed">
        {parseQuestionText()}
      </div>
      
      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
        💡 Fill in the blanks with the correct words or phrases. Click in each blank field to type your answer.
      </div>

      {/* Answer Summary (shown after submission) */}
      {isSubmitted && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">Correct Answers:</h3>
          <div className="space-y-2">
            {blanks.map((blank, index) => {
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

      {/* Hint */}
      {showHint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800">💡 Hint:</div>
          <div className="text-sm text-yellow-700 mt-1">{question.hint}</div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="flex-1"
        >
          Submit Answers ({answers.filter(a => a.value.trim()).length}/{blanks.length} filled)
        </Button>
      </div>
    </div>
  )
} 