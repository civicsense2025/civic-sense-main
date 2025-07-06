"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QuizQuestion } from '@/lib/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, RotateCcw, Lightbulb, ArrowRight, Keyboard } from 'lucide-react'
import Image from 'next/image'

interface MatchingInteractiveQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface LeftItem {
  id: string
  content: string
  subtitle?: string
  image?: string
}

interface RightItem {
  id: string
  content: string
  category?: string
  explanation?: string
}

interface Match {
  leftId: string
  rightId: string
}

interface InteractiveMatchingData {
  type: 'matching'
  title: string
  instructions: string
  left_items: LeftItem[]
  right_items: RightItem[]
  correct_matches: [string, string][]
  scoring: {
    full_credit: number
    partial_credit: number
    partial_threshold: number
  }
  reveal_explanations: boolean
}

// Draggable left item component
function DraggableLeftItem({ 
  item, 
  isMatched, 
  matchedWith,
  feedback 
}: { 
  item: LeftItem
  isMatched: boolean
  matchedWith?: RightItem
  feedback?: 'correct' | 'incorrect' | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-50 scale-105",
        isMatched && feedback === 'correct' && "border-green-500 bg-green-50 dark:bg-green-900/20",
        isMatched && feedback === 'incorrect' && "border-red-500 bg-red-50 dark:bg-red-900/20",
        isMatched && !feedback && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {item.image && (
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={item.image}
                alt={item.content}
                fill
                className="object-cover rounded"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-sm">{item.content}</div>
            {item.subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{item.subtitle}</div>
            )}
          </div>
          {isMatched && feedback && (
            <div className="flex-shrink-0">
              {feedback === 'correct' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {isMatched && matchedWith && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{matchedWith.content}</span>
            </div>
            {matchedWith.category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {matchedWith.category}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Droppable right item component
function DroppableRightItem({ 
  item, 
  isMatched, 
  feedback,
  showExplanation 
}: { 
  item: RightItem
  isMatched: boolean
  feedback?: 'correct' | 'incorrect' | null
  showExplanation: boolean
}) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 min-h-[80px]",
        isMatched && feedback === 'correct' && "border-green-500 bg-green-50 dark:bg-green-900/20",
        isMatched && feedback === 'incorrect' && "border-red-500 bg-red-50 dark:bg-red-900/20",
        isMatched && !feedback && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
        !isMatched && "border-dashed border-gray-300 bg-gray-50/50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-sm">{item.content}</div>
            {item.category && (
              <Badge variant="outline" className="mt-2 text-xs">
                {item.category}
              </Badge>
            )}
          </div>
          {isMatched && feedback && (
            <div className="flex-shrink-0 ml-2">
              {feedback === 'correct' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {showExplanation && item.explanation && feedback === 'correct' && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="text-xs text-green-700 dark:text-green-300">
              <Lightbulb className="w-3 h-3 inline mr-1" />
              {item.explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MatchingInteractiveQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: MatchingInteractiveQuestionProps) {
  // Parse interactive data or fall back to legacy format
  const interactiveData = useMemo((): InteractiveMatchingData | null => {
    if (question.interactive_data?.type === 'matching') {
      return question.interactive_data as InteractiveMatchingData
    }
    return null
  }, [question.interactive_data])

  // Create legacy format if no interactive data
  const legacyData = useMemo((): InteractiveMatchingData | null => {
    if (!interactiveData && question.type === 'matching' && 'matching_pairs' in question) {
      const pairs = question.matching_pairs || []
      return {
        type: 'matching',
        title: 'Match Related Items',
        instructions: 'Drag items from the left to match them with items on the right',
        left_items: pairs.map((pair, index) => ({
          id: `left_${index}`,
          content: pair.left
        })),
        right_items: pairs.map((pair, index) => ({
          id: `right_${index}`,
          content: pair.right,
          category: 'general'
        })),
        correct_matches: pairs.map((pair, index) => [`left_${index}`, `right_${index}`] as [string, string]),
        scoring: {
          full_credit: 100,
          partial_credit: 60,
          partial_threshold: Math.ceil(pairs.length / 2)
        },
        reveal_explanations: false
      }
    }
    return null
  }, [interactiveData, question])

  const data = interactiveData || legacyData

  // State management
  const [matches, setMatches] = useState<Match[]>([])
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Reset state when question changes
  useEffect(() => {
    setMatches([])
    setFeedback({})
    setIsSubmitted(false)
    setActiveId(null)
  }, [question.question])

  // Early return if data is null
  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This matching question doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  // Accessibility: Sensors for pointer and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Accessibility: ARIA live region for announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");
  const ariaLiveRef = useRef<HTMLDivElement>(null);

  // Announce drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const item = data?.left_items.find(i => i.id === event.active.id)
    if (item) setAriaAnnouncement(`Picked up ${item.content}`)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const leftId = active.id as string
    const rightId = over.id as string
    const leftItem = data?.left_items.find(i => i.id === leftId)
    const rightItem = data?.right_items.find(i => i.id === rightId)
    if (leftItem && rightItem) setAriaAnnouncement(`Matched ${leftItem.content} to ${rightItem.content}`)
    // Remove any existing match for this left item
    const newMatches = matches.filter(match => match.leftId !== leftId)
    // Add new match
    newMatches.push({ leftId, rightId })
    setMatches(newMatches)
  }

  const handleSubmit = useCallback(() => {
    if (isSubmitted || disabled) return

    const newFeedback: Record<string, 'correct' | 'incorrect'> = {}
    let correctCount = 0

    // Check each match
    matches.forEach(match => {
      const isCorrect = data.correct_matches.some(
        ([correctLeft, correctRight]) => 
          correctLeft === match.leftId && correctRight === match.rightId
      )
      
      if (isCorrect) {
        correctCount++
        newFeedback[match.leftId] = 'correct'
      } else {
        newFeedback[match.leftId] = 'incorrect'
      }
    })

    setFeedback(newFeedback)
    setIsSubmitted(true)

    // Calculate score
    const totalMatches = data.correct_matches.length
    const scorePercentage = Math.round((correctCount / totalMatches) * 100)
    
    let finalScore: number
    if (correctCount === totalMatches) {
      finalScore = data.scoring.full_credit
    } else if (correctCount >= data.scoring.partial_threshold) {
      finalScore = data.scoring.partial_credit
    } else {
      finalScore = Math.round((correctCount / totalMatches) * data.scoring.partial_credit)
    }

    const answerSummary = `${correctCount}/${totalMatches} correct matches (${scorePercentage}%)`
    const isFullyCorrect = correctCount === totalMatches

    onAnswer(answerSummary)
  }, [matches, data, isSubmitted, disabled, onAnswer])

  const handleReset = useCallback(() => {
    if (isSubmitted) return
    setMatches([])
    setFeedback({})
  }, [isSubmitted])

  const isComplete = matches.length === data.correct_matches.length
  const activeItem = activeId ? data.left_items.find(item => item.id === activeId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="matching-title">{data.title}</h3>
        <p className="text-sm text-muted-foreground" id="matching-instructions">{data.instructions}</p>
      </div>

      {/* Civic Education Context */}
      {question.explanation && showHint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Democratic Context:</strong> {question.explanation}
            </div>
          </div>
        </div>
      )}

      {/* ARIA live region for DnD announcements */}
      <div ref={ariaLiveRef} aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list" aria-labelledby="matching-title" aria-describedby="matching-instructions">
          {/* Left Column - Draggable Items */}
          <div className="space-y-3" role="list" aria-label="Draggable items to match">
            <h4 className="font-medium text-sm text-muted-foreground text-center">
              Drag to Match
            </h4>
            <SortableContext 
              items={data.left_items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {data.left_items.map(item => {
                const match = matches.find(m => m.leftId === item.id)
                const matchedRight = match ? data.right_items.find(r => r.id === match.rightId) : undefined
                const itemFeedback = feedback[item.id] || null
                return (
                  <div role="option" aria-selected={!!match} tabIndex={0} key={item.id} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    <DraggableLeftItem
                      item={item}
                      isMatched={!!match}
                      matchedWith={matchedRight}
                      feedback={itemFeedback}
                    />
                  </div>
                )
              })}
            </SortableContext>
          </div>

          {/* Right Column - Drop Targets */}
          <div className="space-y-3" role="list" aria-label="Drop targets for matching">
            <h4 className="font-medium text-sm text-muted-foreground text-center">
              Match Categories
            </h4>
            {data.right_items.map(item => {
              const match = matches.find(m => m.rightId === item.id)
              const matchedLeft = match ? data.left_items.find(l => l.id === match.leftId) : undefined
              const itemFeedback = match ? feedback[match.leftId] || null : null
              return (
                <div
                  key={item.id}
                  data-droppable-id={item.id}
                  className="droppable-area focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  role="option"
                  aria-selected={!!match}
                  tabIndex={0}
                >
                  <DroppableRightItem
                    item={item}
                    isMatched={!!match}
                    feedback={itemFeedback}
                    showExplanation={isSubmitted && data.reveal_explanations}
                  />
                </div>
              )
            })}
          </div>
        </div>
        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <Card className="opacity-90 rotate-2 shadow-lg">
              <CardContent className="p-4">
                <div className="font-medium text-sm">{activeItem.content}</div>
                {activeItem.subtitle && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {activeItem.subtitle}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="px-6"
        >
          Submit Matches ({matches.length}/{data.correct_matches.length})
        </Button>
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={matches.length === 0 || disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>
      {/* Results Summary */}
      {isSubmitted && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">Your Results:</h4>
          <div className="space-y-2">
            {data.correct_matches.map(([leftId, rightId], index) => {
              const leftItem = data.left_items.find(item => item.id === leftId)
              const rightItem = data.right_items.find(item => item.id === rightId)
              const userMatch = matches.find(m => m.leftId === leftId)
              const isCorrect = userMatch?.rightId === rightId
              return (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )} aria-label={isCorrect ? 'Correct match' : 'Incorrect match'}>
                    {isCorrect ? "✓" : "✗"}
                  </div>
                  <span>{leftItem?.content}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{rightItem?.content}</span>
                  {!isCorrect && userMatch && (
                    <span className="text-muted-foreground text-xs">
                      (You chose: {data.right_items.find(r => r.id === userMatch.rightId)?.content})
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 