"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { QuizQuestion } from '@/lib/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, RotateCcw, Calendar, ArrowDown, Lightbulb } from 'lucide-react'

interface TimelineQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface TimelineEvent {
  id: string
  title: string
  content: string
  date: string
  icon?: string
  category?: string
}

interface InteractiveTimelineData {
  type: 'timeline'
  title: string
  instructions: string
  start_date: string
  end_date: string
  events: TimelineEvent[]
  feedback: {
    correct: string
    partially_correct: string
    incorrect: string
  }
  show_connections: boolean
}

// Draggable timeline event component
function DraggableTimelineEvent({ 
  event, 
  index,
  feedback,
  isCorrect,
  showConnections
}: { 
  event: TimelineEvent
  index: number
  feedback?: 'correct' | 'incorrect' | null
  isCorrect?: boolean
  showConnections: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="relative" role="option" aria-selected={!!feedback} tabIndex={0}>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
          isDragging && "opacity-50 scale-105 z-50",
          feedback === 'correct' && "border-green-500 bg-green-50 dark:bg-green-900/20",
          feedback === 'incorrect' && "border-red-500 bg-red-50 dark:bg-red-900/20",
          !feedback && "hover:border-blue-300"
        )}
        {...attributes}
        {...listeners}
        aria-label={`Timeline event: ${event.title}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Position indicator */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold flex-shrink-0",
              feedback === 'correct' && "bg-green-500 border-green-500 text-white",
              feedback === 'incorrect' && "bg-red-500 border-red-500 text-white",
              !feedback && "bg-blue-100 border-blue-300 text-blue-700"
            )} aria-label={`Position ${index + 1}`}
            >
              {index + 1}
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {event.icon && (
                  <span className="text-lg" role="img" aria-label={event.title + ' icon'}>
                    {event.icon}
                  </span>
                )}
                <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                {feedback && (
                  <div className="ml-auto flex-shrink-0">
                    {feedback === 'correct' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                {event.content}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span className="font-medium">{formatDate(event.date)}</span>
                {event.category && (
                  <Badge variant="outline" className="text-xs">
                    {event.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Connection line to next event */}
      {showConnections && (
        <div className="flex justify-center my-2">
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full",
            feedback === 'correct' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
          )} aria-hidden="true">
            <ArrowDown className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  )
}

export function TimelineQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: TimelineQuestionProps) {
  // Parse interactive data or create legacy format
  const interactiveData = useMemo((): InteractiveTimelineData | null => {
    if (question.interactive_data?.type === 'timeline') {
      return question.interactive_data as InteractiveTimelineData
    }
    
    // Legacy support - convert timeline_events to interactive format
    if (question.type === 'timeline' && 'timeline_events' in question && question.timeline_events) {
      return {
        type: 'timeline',
        title: 'Arrange in Chronological Order',
        instructions: 'Drag these events to arrange them in the correct chronological order',
        start_date: question.timeline_events[0]?.date || '2020-01-01',
        end_date: question.timeline_events[question.timeline_events.length - 1]?.date || '2025-12-31',
        events: question.timeline_events.map((event, index) => ({
          id: `event_${index}`,
          title: event.title || `Event ${index + 1}`,
          content: event.content,
          date: event.date,
          category: event.category || 'general'
        })),
        feedback: {
          correct: "Perfect! You understand the chronological sequence of events.",
          partially_correct: "Good start! Some events are in the right order.",
          incorrect: "Not quite right. Think about cause and effect relationships."
        },
        show_connections: true
      }
    }
    
    return null
  }, [question])

  // State management
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Accessibility: Sensors for pointer and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )
  // Accessibility: ARIA live region for announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Initialize events in random order
  useEffect(() => {
    if (interactiveData && !isSubmitted) {
      // Shuffle events for the quiz
      const shuffled = [...interactiveData.events].sort(() => Math.random() - 0.5)
      setEvents(shuffled)
      setFeedback({})
    }
  }, [interactiveData, isSubmitted])

  // Reset state when question changes
  useEffect(() => {
    setFeedback({})
    setIsSubmitted(false)
    setActiveId(null)
  }, [question.question])

  if (!interactiveData) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This timeline question doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  // Get correct order based on dates
  const correctOrder = useMemo(() => {
    return [...interactiveData.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [interactiveData.events])

  // Announce drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const eventObj = events.find(e => e.id === event.active.id)
    if (eventObj) setAriaAnnouncement(`Picked up ${eventObj.title}`)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const activeEventObj = events.find(e => e.id === active.id)
    const overEventObj = events.find(e => e.id === over.id)
    if (activeEventObj && overEventObj) setAriaAnnouncement(`Moved ${activeEventObj.title} to position of ${overEventObj.title}`)
    const activeIndex = events.findIndex(event => event.id === active.id)
    const overIndex = events.findIndex(event => event.id === over.id)
    if (activeIndex !== overIndex) {
      const newEvents = [...events]
      const [movedEvent] = newEvents.splice(activeIndex, 1)
      newEvents.splice(overIndex, 0, movedEvent)
      setEvents(newEvents)
    }
  }

  const handleSubmit = useCallback(() => {
    if (isSubmitted || disabled) return

    const newFeedback: Record<string, 'correct' | 'incorrect'> = {}
    let correctCount = 0

    // Check each event's position
    events.forEach((event, index) => {
      const correctIndex = correctOrder.findIndex(correctEvent => correctEvent.id === event.id)
      const isCorrect = correctIndex === index
      
      if (isCorrect) {
        correctCount++
        newFeedback[event.id] = 'correct'
      } else {
        newFeedback[event.id] = 'incorrect'
      }
    })

    setFeedback(newFeedback)
    setIsSubmitted(true)

    // Calculate score and feedback
    const totalEvents = events.length
    const scorePercentage = Math.round((correctCount / totalEvents) * 100)
    
    let resultMessage: string
    if (correctCount === totalEvents) {
      resultMessage = interactiveData.feedback.correct
    } else if (correctCount >= Math.ceil(totalEvents / 2)) {
      resultMessage = interactiveData.feedback.partially_correct
    } else {
      resultMessage = interactiveData.feedback.incorrect
    }

    const answerSummary = `${correctCount}/${totalEvents} events in correct order (${scorePercentage}%)`
    onAnswer(answerSummary)
  }, [events, correctOrder, isSubmitted, disabled, interactiveData.feedback, onAnswer])

  const handleReset = useCallback(() => {
    if (isSubmitted) return
    
    // Re-shuffle events
    const shuffled = [...interactiveData.events].sort(() => Math.random() - 0.5)
    setEvents(shuffled)
    setFeedback({})
  }, [isSubmitted, interactiveData.events])

  const activeEvent = activeId ? events.find(event => event.id === activeId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="timeline-title">{interactiveData.title}</h3>
        <p className="text-sm text-muted-foreground" id="timeline-instructions">{interactiveData.instructions}</p>
        <div className="text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 inline mr-1" aria-hidden="true" />
          Timeline: {interactiveData.start_date} to {interactiveData.end_date}
        </div>
      </div>
      {/* Civic Education Context */}
      {question.explanation && showHint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Timeline Context:</strong> {question.explanation}
            </div>
          </div>
        </div>
      )}
      {/* ARIA live region for DnD announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>
      {/* Timeline Events */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={events.map(event => event.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1" role="list" aria-labelledby="timeline-title" aria-describedby="timeline-instructions">
            {events.map((event, index) => (
              <DraggableTimelineEvent
                key={event.id}
                event={event}
                index={index}
                feedback={feedback[event.id] || null}
                showConnections={interactiveData.show_connections && index < events.length - 1}
              />
            ))}
          </div>
        </SortableContext>
        {/* Drag Overlay */}
        <DragOverlay>
          {activeEvent && (
            <Card className="opacity-90 rotate-1 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">
                    ?
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{activeEvent.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeEvent.content.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitted || disabled}
          className="px-6"
        >
          Submit Timeline
        </Button>
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Shuffle Again
          </Button>
        )}
      </div>
      {/* Results Summary */}
      {isSubmitted && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">Correct Timeline:</h4>
          <div className="space-y-3">
            {correctOrder.map((event, index) => {
              const userIndex = events.findIndex(e => e.id === event.id)
              const isCorrect = userIndex === index
              return (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )} aria-label={isCorrect ? 'Correct position' : 'Incorrect position'}>
                    {index + 1}
                  </div>
                  <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground min-w-[80px]">
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span className="font-medium">{event.title}</span>
                  {!isCorrect && (
                    <span className="text-muted-foreground text-xs">
                      (You placed this at position {userIndex + 1})
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