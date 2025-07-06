"use client"

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Lightbulb, RotateCcw, ArrowRight } from 'lucide-react'

interface NetworkDiagramQuestionProps {
  question: any
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface Node {
  id: string
  label: string
  description?: string
}

interface Connection {
  from: string
  to: string
  label?: string
}

interface InteractiveNetworkDiagramData {
  type: 'network_diagram'
  title: string
  instructions: string
  nodes: Node[]
  connections: Connection[]
  correct_answer: string
  feedback?: {
    correct: string
    incorrect: string
    partially_correct: string
  }
  show_progress?: boolean
}

export function NetworkDiagramQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: NetworkDiagramQuestionProps) {
  // Parse interactive data or create legacy format
  const interactiveData = useMemo((): InteractiveNetworkDiagramData | null => {
    if (question.interactive_data?.type === 'network_diagram') {
      return question.interactive_data as InteractiveNetworkDiagramData
    }
    // Legacy support: not implemented, fallback to null
    return null
  }, [question])

  // State: user connections (array of {from, to})
  const [userConnections, setUserConnections] = useState<Connection[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("")
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null)

  // Reset state when question changes
  useEffect(() => {
    setUserConnections([])
    setIsSubmitted(false)
    setFeedback({})
    setAriaAnnouncement("")
    setSelectedFrom(null)
  }, [question.question])

  if (!interactiveData) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This network diagram question doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  // Helper: get node by id
  const getNode = (id: string) => interactiveData.nodes.find(n => n.id === id)

  // Helper: check if connection exists
  const hasConnection = (from: string, to: string) => userConnections.some(conn => conn.from === from && conn.to === to)

  // Handle node selection for connection
  const handleNodeSelect = (nodeId: string) => {
    if (isSubmitted || disabled) return
    if (!selectedFrom) {
      setSelectedFrom(nodeId)
      setAriaAnnouncement(`Selected source: ${getNode(nodeId)?.label}`)
    } else if (selectedFrom === nodeId) {
      setSelectedFrom(null)
      setAriaAnnouncement('Selection cleared.')
    } else {
      // Add connection
      if (!hasConnection(selectedFrom, nodeId)) {
        setUserConnections(prev => [...prev, { from: selectedFrom, to: nodeId }])
        setAriaAnnouncement(`Connected ${getNode(selectedFrom)?.label} to ${getNode(nodeId)?.label}`)
      }
      setSelectedFrom(null)
    }
  }

  // Handle removing a connection
  const handleRemoveConnection = (from: string, to: string) => {
    if (isSubmitted || disabled) return
    setUserConnections(prev => prev.filter(conn => !(conn.from === from && conn.to === to)))
    setAriaAnnouncement(`Removed connection from ${getNode(from)?.label} to ${getNode(to)?.label}`)
  }

  // Handle submit
  const handleSubmit = () => {
    if (isSubmitted || disabled) return
    // Build answer string: 'from1-to1,from2-to2,...'
    const answerString = userConnections.map(conn => `${conn.from}-${conn.to}`).join(',')
    // Compare to correct answer
    const correctPairs = (interactiveData.correct_answer || '').split(',').map(pair => pair.trim())
    const userPairs = userConnections.map(conn => `${conn.from}-${conn.to}`)
    // Feedback per connection
    const newFeedback: Record<string, 'correct' | 'incorrect'> = {}
    userPairs.forEach(pair => {
      newFeedback[pair] = correctPairs.includes(pair) ? 'correct' : 'incorrect'
    })
    setFeedback(newFeedback)
    setIsSubmitted(true)
    setAriaAnnouncement(userPairs.length === correctPairs.length && userPairs.every(pair => correctPairs.includes(pair)) ? 'All connections correct!' : 'Some connections are incorrect.')
    onAnswer(answerString)
  }

  // Handle reset
  const handleReset = () => {
    if (isSubmitted) return
    setUserConnections([])
    setSelectedFrom(null)
    setAriaAnnouncement('All connections cleared.')
  }

  // Progress
  const isComplete = userConnections.length === interactiveData.connections.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="network-title">{interactiveData.title}</h3>
        <p className="text-sm text-muted-foreground" id="network-instructions">{interactiveData.instructions}</p>
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
      {/* Diagram nodes and connections */}
      <div className="flex flex-wrap gap-6 justify-center">
        {interactiveData.nodes.map(node => (
          <Card key={node.id} className={cn(
            'min-w-[140px] min-h-[80px] flex flex-col items-center justify-center cursor-pointer',
            selectedFrom === node.id && 'ring-2 ring-blue-500',
            disabled && 'opacity-60 pointer-events-none'
          )}>
            <CardContent className="p-4 flex flex-col items-center">
              <div
                className="font-semibold text-base mb-1"
                tabIndex={0}
                aria-label={node.label}
                onClick={() => handleNodeSelect(node.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleNodeSelect(node.id)
                }}
                role="button"
                aria-pressed={selectedFrom === node.id}
              >
                {node.label}
              </div>
              {node.description && (
                <div className="text-xs text-muted-foreground mb-1 text-center">{node.description}</div>
              )}
              {/* Show outgoing connections from this node */}
              <div className="flex flex-col gap-1 mt-2">
                {userConnections.filter(conn => conn.from === node.id).map(conn => (
                  <div key={conn.to} className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" aria-hidden="true" />
                    <span className="text-xs">{getNode(conn.to)?.label}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs px-1"
                      onClick={() => handleRemoveConnection(conn.from, conn.to)}
                      disabled={isSubmitted || disabled}
                      aria-label={`Remove connection to ${getNode(conn.to)?.label}`}
                    >
                      <XCircle className="w-3 h-3 text-red-500" />
                    </Button>
                    {isSubmitted && (
                      <span className={cn(
                        'ml-2',
                        feedback[`${conn.from}-${conn.to}`] === 'correct' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {feedback[`${conn.from}-${conn.to}`] === 'correct' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 justify-center mt-6">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitted || disabled}
          className="px-6"
        >
          Submit Diagram ({userConnections.length}/{interactiveData.connections.length})
        </Button>
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={userConnections.length === 0 || disabled}
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
                ? 'All connections correct!'
                : 'Some connections were incorrect. Review below.'}
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Review:</h4>
              <div className="space-y-3">
                {userConnections.map((conn, index) => {
                  const isCorrect = feedback[`${conn.from}-${conn.to}`] === 'correct'
                  return (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )} aria-label={isCorrect ? 'Correct' : 'Incorrect'}>
                        {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <span>{getNode(conn.from)?.label} <ArrowRight className="inline w-4 h-4 mx-1" /> {getNode(conn.to)?.label}</span>
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