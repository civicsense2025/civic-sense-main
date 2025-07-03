"use client"

import type { QuizQuestion, MultipleChoiceQuestion } from '@civicsense/types/quiz'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { cn, shuffleArray } from '@civicsense/shared'
import { useState, useMemo, useEffect } from "react"


interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion
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
  const [keyboardHighlight, setKeyboardHighlight] = useState<string | null>(null)

  // Create and randomize options once per question
  const randomizedOptions = useMemo(() => {
    return shuffleArray(question.options.map((label: string, index: number) => ({
      id: `option_${String.fromCharCode(97 + index)}`, // a, b, c, d...
      label
    })))
  }, [question.options])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSubmitted || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const keyNumber = parseInt(event.key)
      if (keyNumber >= 1 && keyNumber <= randomizedOptions.length) {
        event.preventDefault()
        const option = randomizedOptions[keyNumber - 1]
        if (option && option.label) {
          setKeyboardHighlight(option.id)
          onSelectAnswer(option.label)
          
          // Clear highlight after a short delay
          setTimeout(() => setKeyboardHighlight(null), 200)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [randomizedOptions, isSubmitted, onSelectAnswer])

  const handleOptionClick = (optionId: string) => {
    if (isSubmitted) {
      console.log('Multiple choice click blocked: already submitted')
      return
    }
    
    const selectedOption = randomizedOptions.find(opt => opt.id === optionId)
    if (!selectedOption || !selectedOption.label) {
      console.log('Invalid option clicked:', optionId)
      return
    }
    
    console.log('Multiple choice option clicked:', selectedOption.label)
    onSelectAnswer(selectedOption.label)
  }

  return (
    <RadioGroup value={selectedAnswer || ""} onValueChange={onSelectAnswer} className="space-y-3">
      {randomizedOptions.map((option, index) => {
        const isCorrect = isSubmitted && option.id === question.correct_answer
        const isIncorrect = isSubmitted && selectedAnswer === option.label && option.id !== question.correct_answer
        const isSelected = selectedAnswer === option.label
        const isHovered = hoveredOption === option.id
        const isKeyboardHighlighted = keyboardHighlight === option.id

        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center rounded-lg border p-4 transition-all duration-300 cursor-pointer group relative",
              "animate-in slide-in-from-left duration-300",
              isSubmitted && "cursor-default",
              isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105 shadow-lg",
              isIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
              !isSubmitted && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-md",
              !isSubmitted && !isSelected && isHovered && "bg-slate-50 dark:bg-slate-800/50 scale-101 shadow-sm",
              !isSubmitted && !isSelected && !isHovered && "hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-101",
              isKeyboardHighlighted && "ring-2 ring-blue-400 ring-opacity-75"
            )}
            style={{ 
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'both'
            }}
            onMouseEnter={() => !isSubmitted && setHoveredOption(option.id)}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={() => handleOptionClick(option.id)}
          >
            {/* Number indicator on the left */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 transition-all duration-200 flex-shrink-0",
              isSelected && !isSubmitted && "bg-blue-500 border-blue-500 text-white scale-110",
              !isSelected && !isSubmitted && "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400",
              isSubmitted && "opacity-50",
              isCorrect && "bg-green-500 border-green-500 text-white scale-110",
              isIncorrect && "bg-red-500 border-red-500 text-white",
              isHovered && !isSubmitted && !isSelected && "border-blue-400 text-blue-600 dark:text-blue-400 scale-105",
              isKeyboardHighlighted && "ring-2 ring-blue-400 ring-opacity-75"
            )}>
              <span className="text-sm font-bold">
                {index + 1}
              </span>
            </div>

            {/* Hidden radio input for accessibility */}
            <RadioGroupItem
              value={option.id}
              id={option.id}
              disabled={isSubmitted}
              className="sr-only"
            />
            
            {/* Option text with audio controls */}
            <div className="flex-grow flex items-center justify-between">
              <Label
                htmlFor={option.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 text-left flex-grow text-base sm:text-lg md:text-xl leading-relaxed",
                  isCorrect && "text-green-700 dark:text-green-300 font-medium",
                  isIncorrect && "text-red-700 dark:text-red-300 font-medium",
                  isSubmitted && "cursor-default",
                  isSelected && !isSubmitted && "font-medium text-blue-600 dark:text-blue-400",
                  isHovered && !isSubmitted && "text-blue-600 dark:text-blue-400",
                )}
              >
                {option.label}
              </Label>
              

            </div>
            
            {/* Clean feedback indicators */}
            {isCorrect && (
              <div className="flex items-center text-green-600 ml-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
            )}
            {isIncorrect && (
              <div className="flex items-center text-red-600 ml-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✗</span>
                </div>
              </div>
            )}
            
            {/* Selection indicator for non-submitted answers */}
            {isSelected && !isSubmitted && (
              <div className="w-2 h-2 bg-blue-500 rounded-full opacity-80 ml-4" />
            )}

            {/* Keyboard shortcut hint */}
            {!isSubmitted && (
              <div className={cn(
                "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block",
                isSelected && "opacity-100"
              )}>
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded border">
                  {index + 1}
                </kbd>
              </div>
            )}
          </div>
        )
      })}
    </RadioGroup>
  )
}
