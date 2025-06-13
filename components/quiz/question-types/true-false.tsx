"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface TrueFalseQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | null
  isSubmitted: boolean
  onSelectAnswer: (answer: string) => void
}

export function TrueFalseQuestion({ question, selectedAnswer, isSubmitted, onSelectAnswer }: TrueFalseQuestionProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const options = [
    { id: "true", label: "True", emoji: "✅" },
    { id: "false", label: "False", emoji: "❌" },
  ]

  return (
    <RadioGroup value={selectedAnswer || ""} onValueChange={onSelectAnswer} className="space-y-4">
      {options.map((option, index) => {
        const isCorrect = isSubmitted && option.id === question.correct_answer
        const isIncorrect = isSubmitted && selectedAnswer === option.id && option.id !== question.correct_answer
        const isSelected = selectedAnswer === option.id
        const isHovered = hoveredOption === option.id

        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-3 rounded-xl border-2 p-6 transition-all duration-300 cursor-pointer group",
              "animate-in slide-in-from-left duration-300",
              isSubmitted && "cursor-default",
              isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105 shadow-lg",
              isIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20 scale-95",
              !isSubmitted && isSelected && "border-primary bg-primary/5 scale-102 shadow-md",
              !isSubmitted && !isSelected && isHovered && "bg-slate-50 dark:bg-slate-800/50 scale-101 shadow-sm",
              !isSubmitted && !isSelected && !isHovered && "hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-101",
            )}
            style={{ animationDelay: `${index * 150}ms` }}
            onMouseEnter={() => !isSubmitted && setHoveredOption(option.id)}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={() => !isSubmitted && onSelectAnswer(option.id)}
          >
            {/* Large emoji indicator */}
            <div className={cn(
              "text-4xl transition-all duration-300",
              isSelected && !isSubmitted && "scale-125",
              isHovered && !isSubmitted && "scale-110",
              isCorrect && "animate-bounce",
            )}>
              {option.emoji}
            </div>

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
                "flex-grow cursor-pointer text-lg font-medium transition-all duration-200",
                isCorrect && "text-green-700 dark:text-green-300",
                isIncorrect && "text-red-700 dark:text-red-300",
                isSubmitted && "cursor-default",
                isSelected && !isSubmitted && "text-primary font-bold",
                isHovered && !isSubmitted && "text-primary",
              )}
            >
              {option.label}
            </Label>
            
            {/* Animated feedback icons */}
            {isCorrect && (
              <span className="text-green-600 text-2xl animate-in zoom-in duration-500 delay-200">
                🎉
              </span>
            )}
            {isIncorrect && (
              <span className="text-red-600 text-2xl animate-in zoom-in duration-500 delay-200">
                💔
              </span>
            )}
            
            {/* Selection indicator */}
            {isSelected && !isSubmitted && (
              <div className="w-3 h-3 bg-primary rounded-full opacity-80" />
            )}
          </div>
        )
      })}
    </RadioGroup>
  )
}
