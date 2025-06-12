"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { QuizQuestion } from "@/lib/quiz-data"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ShortAnswerQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | null
  isSubmitted: boolean
  onSelectAnswer: (answer: string) => void
}

export function ShortAnswerQuestion({
  question,
  selectedAnswer,
  isSubmitted,
  onSelectAnswer,
}: ShortAnswerQuestionProps) {
  const [inputValue, setInputValue] = useState(selectedAnswer || "")
  const isCorrect = isSubmitted && inputValue.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()

  useEffect(() => {
    if (selectedAnswer) {
      setInputValue(selectedAnswer)
    }
  }, [selectedAnswer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onSelectAnswer(value)
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        disabled={isSubmitted}
        placeholder="Type your answer here..."
        className={cn(
          "p-4 text-base",
          isSubmitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
          isSubmitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
        )}
      />

      {isSubmitted && (
        <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <p className="font-medium">
            {isCorrect ? (
              <span className="text-green-600">✓ Correct!</span>
            ) : (
              <>
                <span className="text-red-600">✗ Incorrect.</span>{" "}
                <span className="font-normal">
                  Your answer: <span className="font-medium">{inputValue}</span>
                </span>
                <br />
                <span className="font-normal">
                  The correct answer is: <span className="font-medium">{question.correct_answer}</span>
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
