"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn, shuffleArray } from "@/lib/utils"
import { useState, useMemo } from "react"

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
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  // Create and randomize options once per question
  const randomizedOptions = useMemo(() => {
    const options = [
      { id: "option_a", label: question.option_a },
      { id: "option_b", label: question.option_b },
      { id: "option_c", label: question.option_c },
      { id: "option_d", label: question.option_d },
    ].filter((option) => option.label) // Filter out undefined options

    // Shuffle the options to randomize their order
    return shuffleArray(options)
  }, [question.option_a, question.option_b, question.option_c, question.option_d])

  return (
    <RadioGroup value={selectedAnswer || ""} onValueChange={onSelectAnswer} className="space-y-3">
      {randomizedOptions.map((option, index) => {
        const isCorrect = isSubmitted && option.id === question.correct_answer
        const isIncorrect = isSubmitted && selectedAnswer === option.id && option.id !== question.correct_answer
        const isSelected = selectedAnswer === option.id
        const isHovered = hoveredOption === option.id

        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-2 rounded-lg border p-4 transition-all duration-300 cursor-pointer group",
              "animate-in slide-in-from-left duration-300",
              isSubmitted && "cursor-default",
              isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105 shadow-lg",
              isIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20 scale-95",
              !isSubmitted && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-md",
              !isSubmitted && !isSelected && isHovered && "bg-slate-50 dark:bg-slate-800/50 scale-101 shadow-sm",
              !isSubmitted && !isSelected && !isHovered && "hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-101",
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onMouseEnter={() => !isSubmitted && setHoveredOption(option.id)}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={() => !isSubmitted && onSelectAnswer(option.id)}
          >
            <RadioGroupItem
              value={option.id}
              id={option.id}
              disabled={isSubmitted}
              className={cn(
                "transition-all duration-200",
                isCorrect && "text-green-500 border-green-500 scale-110",
                isIncorrect && "text-red-500 border-red-500",
                isSelected && !isSubmitted && "scale-110",
                isHovered && !isSubmitted && "scale-105",
              )}
            />
            <Label
              htmlFor={option.id}
              className={cn(
                "flex-grow cursor-pointer transition-all duration-200",
                isCorrect && "text-green-700 dark:text-green-300 font-medium",
                isIncorrect && "text-red-700 dark:text-red-300 font-medium",
                isSubmitted && "cursor-default",
                isSelected && !isSubmitted && "font-medium text-blue-600 dark:text-blue-400",
                isHovered && !isSubmitted && "text-blue-600 dark:text-blue-400",
              )}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {!isSubmitted && (
                  <kbd className="ml-2 px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border opacity-60 group-hover:opacity-100 transition-opacity">
                    {index + 1}
                  </kbd>
                )}
              </div>
            </Label>
            
            {/* Clean feedback indicators - consistent with true-false */}
            {isCorrect && (
              <div className="flex items-center text-green-600">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
            )}
            {isIncorrect && (
              <div className="flex items-center text-red-600">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✗</span>
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && !isSubmitted && (
              <div className="w-2 h-2 bg-blue-500 rounded-full opacity-80" />
            )}
          </div>
        )
      })}
    </RadioGroup>
  )
}
