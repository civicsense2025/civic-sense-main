'use client'

import React, { useState, useCallback } from 'react'
import { QuizQuestion } from '@/lib/quiz-data'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, shuffleArray } from '@/lib/utils'
import { CheckCircle, XCircle, GripVertical, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react'

interface OrderingQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string, isCorrect: boolean) => void
  showHint?: boolean
  disabled?: boolean
}

interface OrderingItem {
  id: string
  content: string
  correct_order: number
  currentPosition: number
}

export function OrderingQuestion({ 
  question, 
  onAnswer, 
  showHint = false, 
  disabled = false 
}: OrderingQuestionProps) {
  const originalItems = question.ordering_items || []
  
  // Initialize items with shuffled positions using Fisher-Yates algorithm
  const [items, setItems] = useState<OrderingItem[]>(() => {
    const shuffled = shuffleArray([...originalItems])
      .map((item, index) => ({
        ...item,
        currentPosition: index + 1
      }))
    return shuffled
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (disabled || isSubmitted) return
    
    setItems(prev => {
      const newItems = [...prev]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)
      
      // Update current positions
      return newItems.map((item, index) => ({
        ...item,
        currentPosition: index + 1
      }))
    })
  }, [disabled, isSubmitted])

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      moveItem(index, index - 1)
    }
  }, [moveItem])

  const moveDown = useCallback((index: number) => {
    if (index < items.length - 1) {
      moveItem(index, index + 1)
    }
  }, [moveItem, items.length])

  const handleSubmit = useCallback(() => {
    const newFeedback: Record<string, boolean> = {}
    let correctCount = 0
    
    items.forEach((item, index) => {
      const isCorrect = item.correct_order === index + 1
      newFeedback[item.id] = isCorrect
      if (isCorrect) correctCount++
    })
    
    setFeedback(newFeedback)
    setIsSubmitted(true)
    
    const score = Math.round((correctCount / items.length) * 100)
    const isAllCorrect = correctCount === items.length
    const userOrder = items.map(item => item.correct_order).join(',')
    const correctOrder = originalItems
      .sort((a, b) => a.correct_order - b.correct_order)
      .map(item => item.correct_order)
      .join(',')
    
    onAnswer(`Order: ${userOrder} (${correctCount}/${items.length} correct - ${score}%)`, isAllCorrect)
  }, [items, originalItems, onAnswer])

  const handleReset = useCallback(() => {
    const shuffled = shuffleArray([...originalItems])
      .map((item, index) => ({
        ...item,
        currentPosition: index + 1
      }))
    setItems(shuffled)
    setFeedback({})
    setIsSubmitted(false)
  }, [originalItems])

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium">{question.question}</div>
      
      {/* Ordering Interface */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Arrange these items in the correct order (drag or use arrow buttons):
        </h3>
        
        <div className="space-y-2">
          {items.map((item, index) => {
            const isCorrect = feedback[item.id]
            
            return (
              <Card
                key={item.id}
                className={cn(
                  "p-4 transition-all",
                  isSubmitted && isCorrect === true && "bg-green-50 border-green-500",
                  isSubmitted && isCorrect === false && "bg-red-50 border-red-500",
                  !isSubmitted && "hover:shadow-md",
                  disabled && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Position Number */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    isSubmitted && isCorrect === true && "bg-green-600 text-white",
                    isSubmitted && isCorrect === false && "bg-red-600 text-white",
                    !isSubmitted && "bg-blue-100 text-blue-800"
                  )}>
                    {index + 1}
                  </div>
                  
                  {/* Drag Handle */}
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  
                  {/* Content */}
                  <div className="flex-1 text-sm">
                    {item.content}
                  </div>
                  
                  {/* Status Icon */}
                  {isSubmitted && (
                    <div className="flex-shrink-0">
                      {isCorrect === true && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isCorrect === false && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  )}
                  
                  {/* Movement Controls */}
                  {!isSubmitted && !disabled && (
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="w-6 h-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveDown(index)}
                        disabled={index === items.length - 1}
                        className="w-6 h-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Correct Order (shown after submission) */}
      {isSubmitted && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">Correct Order:</h3>
          <div className="space-y-2">
            {originalItems
              .sort((a, b) => a.correct_order - b.correct_order)
              .map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-sm">{item.content}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
        💡 Use the up/down arrow buttons to move items, or drag them to reorder. The numbers show the current position.
      </div>

      {/* Hint */}
      {showHint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800">💡 Hint:</div>
          <div className="text-sm text-yellow-700 mt-1">{question.hint}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitted || disabled}
          className="flex-1"
        >
          Submit Order
        </Button>
        
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
        )}
      </div>
    </div>
  )
} 