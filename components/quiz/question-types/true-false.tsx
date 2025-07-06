"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn, shuffleArray } from "@/lib/utils"
import { useState, useMemo, useEffect } from "react"
import { AudioControls } from "../audio-controls"

interface TrueFalseQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | null
  isSubmitted: boolean
  onSelectAnswer: (answer: string) => void
}

export function TrueFalseQuestion({ question, selectedAnswer, isSubmitted, onSelectAnswer }: TrueFalseQuestionProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [keyboardHighlight, setKeyboardHighlight] = useState<string | null>(null)
  // ARIA live region for feedback
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Randomize True/False order once per question
  const randomizedOptions = useMemo(() => {
    const options = [
      { id: "True", label: "True", emoji: "✅", key: "T" },
      { id: "False", label: "False", emoji: "❌", key: "F" },
    ]
    return shuffleArray(options)
  }, [question.question])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSubmitted || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      const key = event.key.toUpperCase()
      const option = randomizedOptions.find(opt => opt.key === key)
      if (option) {
        event.preventDefault()
        setKeyboardHighlight(option.id)
        onSelectAnswer(option.id)
        setTimeout(() => setKeyboardHighlight(null), 200)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [randomizedOptions, isSubmitted, onSelectAnswer])

  const handleOptionClick = (optionId: string) => {
    if (isSubmitted) return
    onSelectAnswer(optionId)
  }

  // Helper: render sources if present
  const renderSources = () => {
    if (!question.sources) return null
    let sources: { url: string; name?: string; title?: string }[] = []
    try {
      if (typeof question.sources === 'string') {
        sources = JSON.parse(question.sources)
      } else {
        sources = question.sources
      }
    } catch {
      return null
    }
    if (!Array.isArray(sources) || sources.length === 0) return null
    return (
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-lg" aria-label="Sources">
        <h4 className="font-semibold text-xs mb-2">Sources</h4>
        <ul className="list-disc pl-5 space-y-1">
          {sources.map((src, i) => (
            <li key={i}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 dark:text-blue-300 text-xs">
                {src.name || src.title || src.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <RadioGroup value={selectedAnswer || ""} onValueChange={onSelectAnswer} className="space-y-4" role="radiogroup" aria-labelledby={`question-title`}>
      {randomizedOptions.map((option, index) => {
        const isCorrect = isSubmitted && option.id.toLowerCase() === question.correct_answer.toLowerCase()
        const isIncorrect = isSubmitted && selectedAnswer === option.id && option.id.toLowerCase() !== question.correct_answer.toLowerCase()
        const isSelected = selectedAnswer === option.id
        const isHovered = hoveredOption === option.id
        const isKeyboardHighlighted = keyboardHighlight === option.id
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center rounded-xl border-2 p-6 transition-all duration-300 cursor-pointer group relative",
              "animate-in slide-in-from-left duration-300",
              isSubmitted && "cursor-default",
              isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105 shadow-lg",
              isIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
              !isSubmitted && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-md",
              !isSubmitted && !isSelected && isHovered && "bg-slate-50 dark:bg-slate-800/50 scale-101 shadow-sm",
              !isSubmitted && !isSelected && !isHovered && "hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-101",
              isKeyboardHighlighted && "ring-2 ring-blue-400 ring-opacity-75"
            )}
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
            onMouseEnter={() => !isSubmitted && setHoveredOption(option.id)}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={() => handleOptionClick(option.id)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            aria-label={`Option ${option.key}: ${option.label}`}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 mr-4 transition-all duration-200 flex-shrink-0",
              isSelected && !isSubmitted && "bg-blue-500 border-blue-500 text-white scale-110",
              !isSelected && !isSubmitted && "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400",
              isSubmitted && "opacity-50",
              isCorrect && "bg-green-500 border-green-500 text-white scale-110",
              isIncorrect && "bg-red-500 border-red-500 text-white",
              isHovered && !isSubmitted && !isSelected && "border-blue-400 text-blue-600 dark:text-blue-400 scale-105",
              isKeyboardHighlighted && "ring-2 ring-blue-400 ring-opacity-75"
            )}>
              <span className="text-sm font-bold">{option.key}</span>
            </div>
            <div className={cn(
              "text-4xl transition-all duration-300 mr-4",
              isSelected && !isSubmitted && "scale-125",
              isHovered && !isSubmitted && "scale-110",
            )}>
              {option.emoji}
            </div>
            <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted} className="sr-only" />
            <Label
              htmlFor={option.id}
              className={cn(
                "cursor-pointer text-xl sm:text-2xl md:text-3xl font-medium transition-all duration-200 text-left flex-grow leading-relaxed",
                isCorrect && "text-green-700 dark:text-green-300",
                isIncorrect && "text-red-700 dark:text-red-300",
                isSubmitted && "cursor-default",
                isSelected && !isSubmitted && "text-blue-600 dark:text-blue-400 font-bold",
                isHovered && !isSubmitted && "text-blue-600 dark:text-blue-400",
              )}
            >
              {option.label}
            </Label>
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
            {isSelected && !isSubmitted && (
              <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80 ml-4" />
            )}
            {!isSubmitted && (
              <div className={cn(
                "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block",
                isSelected && "opacity-100"
              )}>
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded border">
                  {option.key}
                </kbd>
              </div>
            )}
          </div>
        )
      })}
      {/* Accessible explanation box */}
      {isSubmitted && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800" aria-live="polite" aria-atomic="true">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Explanation</h4>
          <p className="text-blue-800 dark:text-blue-200">{question.explanation}</p>
        </div>
      )}
      {/* Accessible sources display */}
      {isSubmitted && renderSources()}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>
    </RadioGroup>
  )
}
