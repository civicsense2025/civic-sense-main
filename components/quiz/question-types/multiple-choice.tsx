"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface MultipleChoiceQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | null
  isSubmitted: boolean
  onSelectAnswer: (answer: string) => void
}

export function MultipleChoiceQuestion({
  question,
  selectedAnswer,
  isSubmitted,
  onSelectAnswer,
}: MultipleChoiceQuestionProps) {
  const options = [
    { id: "option_a", label: question.option_a },
    { id: "option_b", label: question.option_b },
    { id: "option_c", label: question.option_c },
    { id: "option_d", label: question.option_d },
  ].filter((option) => option.label) // Filter out undefined options

  return (
    <RadioGroup value={selectedAnswer || ""} onValueChange={onSelectAnswer} className="space-y-3">
      {options.map((option) => {
        const isCorrect = isSubmitted && option.id === question.correct_answer
        const isIncorrect = isSubmitted && selectedAnswer === option.id && option.id !== question.correct_answer
        const isSelected = selectedAnswer === option.id

        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
              isSubmitted && "cursor-default",
              isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
              isIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
              !isSubmitted && isSelected && "border-primary",
              !isSubmitted && !isSelected && "hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <RadioGroupItem
              value={option.id}
              id={option.id}
              disabled={isSubmitted}
              className={cn(
                isCorrect && "text-green-500 border-green-500",
                isIncorrect && "text-red-500 border-red-500",
              )}
            />
            <Label
              htmlFor={option.id}
              className={cn(
                "flex-grow cursor-pointer",
                isCorrect && "text-green-700 dark:text-green-300 font-medium",
                isIncorrect && "text-red-700 dark:text-red-300 font-medium",
                isSubmitted && "cursor-default",
              )}
            >
              {option.label}
            </Label>
            {isCorrect && <span className="text-green-600">✓</span>}
            {isIncorrect && <span className="text-red-600">✗</span>}
          </div>
        )
      })}
    </RadioGroup>
  )
}
