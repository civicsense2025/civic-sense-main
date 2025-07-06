"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react'

interface CategorizationQuestionProps {
  question: any
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface Category {
  id: string
  name: string
  description?: string
}

interface Item {
  id: string
  content: string
}

interface InteractiveCategorizationData {
  type: 'categorization'
  title: string
  instructions: string
  categories: Category[]
  items: Item[]
  correct_answer: string
  feedback?: {
    correct: string
    incorrect: string
    partially_correct: string
  }
  show_progress?: boolean
}

export function CategorizationQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: CategorizationQuestionProps) {
  // Parse interactive data or create legacy format
  const interactiveData = useMemo((): InteractiveCategorizationData | null => {
    if (question.interactive_data?.type === 'categorization') {
      return question.interactive_data as InteractiveCategorizationData
    }
    // Legacy support: not implemented, fallback to null
    return null
  }, [question])

  // State: category assignments (itemId -> categoryId)
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("")

  // Reset state when question changes
  useEffect(() => {
    setAssignments({})
    setIsSubmitted(false)
    setFeedback({})
    setAriaAnnouncement("")
  }, [question.question])

  if (!interactiveData) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This categorization question doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  // Helper: get items assigned to a category
  const getItemsForCategory = (categoryId: string) => {
    return interactiveData.items.filter(item => assignments[item.id] === categoryId)
  }

  // Helper: get unassigned items
  const getUnassignedItems = () => {
    return interactiveData.items.filter(item => !assignments[item.id])
  }

  // Handle assignment
  const handleAssign = (itemId: string, categoryId: string) => {
    if (isSubmitted || disabled) return
    setAssignments(prev => ({ ...prev, [itemId]: categoryId }))
    setAriaAnnouncement(`Assigned ${interactiveData.items.find(i => i.id === itemId)?.content} to ${interactiveData.categories.find(c => c.id === categoryId)?.name}`)
  }

  // Handle unassign
  const handleUnassign = (itemId: string) => {
    if (isSubmitted || disabled) return
    setAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[itemId]
      return newAssignments
    })
    setAriaAnnouncement(`Unassigned ${interactiveData.items.find(i => i.id === itemId)?.content}`)
  }

  // Handle submit
  const handleSubmit = () => {
    if (isSubmitted || disabled) return
    // Build answer string in format: 'category1|item1,item2;category2|item3,item4'
    const answerParts: string[] = []
    interactiveData.categories.forEach(cat => {
      const items = interactiveData.items.filter(item => assignments[item.id] === cat.id)
      if (items.length > 0) {
        answerParts.push(`${cat.id}|${items.map(i => i.id).join(',')}`)
      }
    })
    const answerString = answerParts.join(';')
    // Compare to correct answer
    const isCorrect = answerString === interactiveData.correct_answer
    // Feedback per item
    const correctMap: Record<string, string> = {}
    interactiveData.correct_answer.split(';').forEach(catPart => {
      const [catId, itemsStr] = catPart.split('|')
      if (catId && itemsStr) {
        itemsStr.split(',').forEach(itemId => {
          correctMap[itemId] = catId
        })
      }
    })
    const newFeedback: Record<string, 'correct' | 'incorrect'> = {}
    interactiveData.items.forEach(item => {
      if (assignments[item.id] && correctMap[item.id] === assignments[item.id]) {
        newFeedback[item.id] = 'correct'
      } else {
        newFeedback[item.id] = 'incorrect'
      }
    })
    setFeedback(newFeedback)
    setIsSubmitted(true)
    setAriaAnnouncement(isCorrect ? 'All items categorized correctly!' : 'Some items are in the wrong category.')
    onAnswer(answerString)
  }

  // Handle reset
  const handleReset = () => {
    if (isSubmitted) return
    setAssignments({})
    setAriaAnnouncement('All assignments cleared.')
  }

  // Progress
  const assignedCount = Object.keys(assignments).length
  const totalItems = interactiveData.items.length
  const isComplete = assignedCount === totalItems

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="categorization-title">{interactiveData.title}</h3>
        <p className="text-sm text-muted-foreground" id="categorization-instructions">{interactiveData.instructions}</p>
      </div>
      {/* Civic Education Context */}
      {question.explanation && showHint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Context:</strong> {question.explanation}
            </div>
          </div>
        </div>
      )}
      {/* ARIA live region for feedback/announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>
      {/* Progress indicator */}
      {interactiveData.show_progress && (
        <div className="flex items-center justify-center gap-3" aria-live="polite" aria-atomic="true">
          <span className="text-sm">{assignedCount} of {totalItems} categorized</span>
        </div>
      )}
      {/* Unassigned items */}
      <div className="mb-4">
        <h4 className="font-medium text-sm mb-2">Unassigned Items</h4>
        <div className="flex flex-wrap gap-2">
          {getUnassignedItems().map(item => (
            <Button
              key={item.id}
              variant="outline"
              className="text-sm"
              onClick={() => {}}
              tabIndex={0}
              aria-label={`Unassigned: ${item.content}`}
              disabled={isSubmitted || disabled}
            >
              {item.content}
            </Button>
          ))}
        </div>
      </div>
      {/* Categories and drop zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {interactiveData.categories.map(category => (
          <Card key={category.id} className="min-h-[120px]">
            <CardContent className="p-4">
              <div className="font-semibold text-base mb-2">{category.name}</div>
              {category.description && (
                <div className="text-xs text-muted-foreground mb-2">{category.description}</div>
              )}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {getItemsForCategory(category.id).length === 0 && (
                  <span className="text-xs text-muted-foreground">No items assigned</span>
                )}
                {getItemsForCategory(category.id).map(item => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className={cn(
                      'text-sm cursor-pointer',
                      isSubmitted && feedback[item.id] === 'correct' && 'border-green-500 text-green-700',
                      isSubmitted && feedback[item.id] === 'incorrect' && 'border-red-500 text-red-700'
                    )}
                    tabIndex={0}
                    aria-label={`Assigned: ${item.content}`}
                    onClick={() => !isSubmitted && !disabled && handleUnassign(item.id)}
                  >
                    {item.content}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Assignment controls */}
      <div className="flex flex-wrap gap-2 mt-4">
        {getUnassignedItems().map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-sm">{item.content}</span>
            <span className="text-xs text-muted-foreground">Assign to:</span>
            {interactiveData.categories.map(category => (
              <Button
                key={category.id}
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => handleAssign(item.id, category.id)}
                disabled={isSubmitted || disabled}
                aria-label={`Assign ${item.content} to ${category.name}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 justify-center mt-6">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="px-6"
        >
          Submit Categorization ({assignedCount}/{totalItems})
        </Button>
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={assignedCount === 0 || disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>
      {/* Results and feedback */}
      {isSubmitted && (
        <div className="space-y-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <div className="text-blue-800 dark:text-blue-200 font-medium">
              {Object.values(feedback).every(f => f === 'correct')
                ? 'All items categorized correctly!'
                : 'Some items were in the wrong category. Review below.'}
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Review:</h4>
              <div className="space-y-3">
                {interactiveData.items.map((item, index) => {
                  const assignedCat = assignments[item.id]
                  const correctCat = (() => {
                    const correctMap: Record<string, string> = {}
                    interactiveData.correct_answer.split(';').forEach(catPart => {
                      const [catId, itemsStr] = catPart.split('|')
                      if (catId && itemsStr) {
                        itemsStr.split(',').forEach(itemId => {
                          correctMap[itemId] = catId
                        })
                      }
                    })
                    return correctMap[item.id]
                  })()
                  const isCorrect = feedback[item.id] === 'correct'
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )} aria-label={isCorrect ? 'Correct' : 'Incorrect'}>
                        {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <span>{item.content}</span>
                      <span className="text-xs text-muted-foreground">Assigned: {interactiveData.categories.find(c => c.id === assignedCat)?.name || 'Unassigned'}</span>
                      {!isCorrect && (
                        <span className="text-xs text-muted-foreground">Correct: {interactiveData.categories.find(c => c.id === correctCat)?.name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 