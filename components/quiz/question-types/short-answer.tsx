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
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const isCorrect = isSubmitted && inputValue.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()

  // Clear input when moving to a new question (selectedAnswer becomes null)
  useEffect(() => {
    if (selectedAnswer === null) {
      setInputValue("")
    } else if (selectedAnswer) {
      setInputValue(selectedAnswer)
    }
  }, [selectedAnswer])

  // Clear input when question changes (additional safety)
  useEffect(() => {
    setInputValue("")
    setIsTyping(false)
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  }, [question.question_number])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onSelectAnswer(value)
    
    // Handle typing indicator
    setIsTyping(true)
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    const newTimeout = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
    setTypingTimeout(newTimeout)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isSubmitted}
          placeholder="Type your answer here..."
          className={cn(
            "p-6 text-lg transition-all duration-300 border-2",
            // Make input more visible by default
            !isSubmitted && !isFocused && "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900",
            // Enhanced focus state
            !isSubmitted && isFocused && "border-primary bg-blue-50 dark:bg-blue-950/30 scale-105 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800",
            // With input value but not focused
            !isSubmitted && !isFocused && inputValue && "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20",
            // Hover state when empty
            !isSubmitted && !isFocused && !inputValue && "hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-101",
            // Submitted states
            isSubmitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
            isSubmitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
          )}
        />
        
        {/* Typing indicator */}
        {isTyping && !isSubmitted && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full opacity-60 animate-pulse" />
              <div className="w-2 h-2 bg-primary rounded-full opacity-80 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-primary rounded-full opacity-100 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        
        {/* Character count */}
        {!isSubmitted && inputValue && (
          <div className="absolute right-3 bottom-2 text-xs text-muted-foreground">
            {inputValue.length} characters
          </div>
        )}
      </div>

      {/* Real-time feedback while typing */}
      {!isSubmitted && inputValue && (
        <div className={cn(
          "p-3 rounded-lg border-l-4 transition-all duration-300 animate-in slide-in-from-top duration-200",
          inputValue.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
        )}>
          <p className="text-sm">
            {inputValue.toLowerCase().trim() === question.correct_answer.toLowerCase().trim() ? (
              <span className="text-green-600 font-medium flex items-center">
                <span className="mr-2">🎯</span>
                Looking good! This matches the expected answer.
              </span>
            ) : (
              <span className="text-blue-600 font-medium flex items-center">
                <span className="mr-2">💭</span>
                Keep thinking... You're on the right track!
              </span>
            )}
          </p>
        </div>
      )}

      {/* Final feedback after submission */}
      {isSubmitted && (
        <div className={cn(
          "mt-4 p-4 rounded-lg border-l-4 animate-in slide-in-from-bottom duration-500",
          isCorrect 
            ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
            : "border-red-500 bg-red-50 dark:bg-red-900/20"
        )}>
          <p className="font-medium flex items-center mb-2">
            {isCorrect ? (
              <>
                <span className="text-2xl mr-2 animate-bounce">🎉</span>
                <span className="text-green-600">Perfect! You got it right!</span>
              </>
            ) : (
              <>
                <span className="text-2xl mr-2">🤔</span>
                <span className="text-red-600">Not quite right, but good effort!</span>
              </>
            )}
          </p>
          
          {!isCorrect && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-red-700 dark:text-red-300">Your answer:</span>{" "}
                <span className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                  {inputValue || "(no answer provided)"}
                </span>
              </p>
              <p>
                <span className="font-medium text-green-700 dark:text-green-300">Correct answer:</span>{" "}
                <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded font-medium">
                  {question.correct_answer}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
