'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { QuizQuestion } from '@civicsense/shared/quiz-data'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { cn, shuffleArray } from '../../utils'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface MatchingQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string, isCorrect: boolean) => void
  showHint?: boolean
  disabled?: boolean
}

interface MatchingPair {
  left: string
  right: string
}

interface MatchState {
  selectedLeft: string | null
  selectedRight: string | null
  matches: Record<string, string>
  feedback: Record<string, 'correct' | 'incorrect' | null>
}

export function MatchingQuestion({ 
  question, 
  onAnswer, 
  showHint = false, 
  disabled = false 
}: MatchingQuestionProps) {
  const pairs = question.matching_pairs || []
  
  // Randomize both left and right items once per question
  const { leftItems, rightItems } = useMemo(() => {
    const left = shuffleArray(pairs.map(p => p.left))
    const right = shuffleArray(pairs.map(p => p.right))
    return { leftItems: left, rightItems: right }
  }, [pairs])
  
  const [matchState, setMatchState] = useState<MatchState>({
    selectedLeft: null,
    selectedRight: null,
    matches: {},
    feedback: {}
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleLeftClick = useCallback((item: string) => {
    if (disabled || isSubmitted) return
    
    setMatchState(prev => ({
      ...prev,
      selectedLeft: prev.selectedLeft === item ? null : item,
      selectedRight: null
    }))
  }, [disabled, isSubmitted])

  const handleRightClick = useCallback((item: string) => {
    if (disabled || isSubmitted) return
    
    setMatchState(prev => {
      if (!prev.selectedLeft) {
        return {
          ...prev,
          selectedRight: prev.selectedRight === item ? null : item
        }
      }
      
      // Make a match
      const newMatches = { ...prev.matches }
      newMatches[prev.selectedLeft] = item
      
      return {
        ...prev,
        matches: newMatches,
        selectedLeft: null,
        selectedRight: null
      }
    })
  }, [disabled, isSubmitted])

  const handleRemoveMatch = useCallback((leftItem: string) => {
    if (disabled || isSubmitted) return
    
    setMatchState(prev => {
      const newMatches = { ...prev.matches }
      delete newMatches[leftItem]
      return {
        ...prev,
        matches: newMatches
      }
    })
  }, [disabled, isSubmitted])

  const handleSubmit = useCallback(() => {
    if (Object.keys(matchState.matches).length !== pairs.length) return
    
    const feedback: Record<string, 'correct' | 'incorrect'> = {}
    let correctCount = 0
    
    pairs.forEach(pair => {
      const userMatch = matchState.matches[pair.left]
      const isCorrect = userMatch === pair.right
      feedback[pair.left] = isCorrect ? 'correct' : 'incorrect'
      if (isCorrect) correctCount++
    })
    
    const isAllCorrect = correctCount === pairs.length
    const score = Math.round((correctCount / pairs.length) * 100)
    
    setMatchState(prev => ({ ...prev, feedback }))
    setIsSubmitted(true)
    
    onAnswer(`${correctCount}/${pairs.length} correct matches (${score}%)`, isAllCorrect)
  }, [matchState.matches, pairs, onAnswer])

  const handleReset = useCallback(() => {
    setMatchState({
      selectedLeft: null,
      selectedRight: null,
      matches: {},
      feedback: {}
    })
    setIsSubmitted(false)
  }, [])

  const isComplete = Object.keys(matchState.matches).length === pairs.length
  const getMatchedRight = (leftItem: string) => matchState.matches[leftItem]
  const isRightItemMatched = (rightItem: string) => Object.values(matchState.matches).includes(rightItem)

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium">{question.question}</div>
      
      {/* Matching Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Match from here:</h3>
          <div className="space-y-2">
            {leftItems.map((item, index) => {
              const isSelected = matchState.selectedLeft === item
              const isMatched = matchState.matches[item]
              const feedback = matchState.feedback[item]
              
              return (
                <Card
                  key={index}
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isSelected && "ring-2 ring-blue-500",
                    isMatched && !isSubmitted && "bg-blue-50 border-blue-200",
                    feedback === 'correct' && "bg-green-50 border-green-500",
                    feedback === 'incorrect' && "bg-red-50 border-red-500",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => handleLeftClick(item)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{item}</span>
                    {isMatched && (
                      <div className="flex items-center gap-2">
                        {feedback === 'correct' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {feedback === 'incorrect' && <XCircle className="w-4 h-4 text-red-600" />}
                        {!isSubmitted && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveMatch(item)
                            }}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {isMatched && (
                    <div className="text-xs text-muted-foreground mt-1">
                      → {getMatchedRight(item)}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">To here:</h3>
          <div className="space-y-2">
            {rightItems.map((item, index) => {
              const isSelected = matchState.selectedRight === item
              const isMatched = isRightItemMatched(item)
              
              return (
                <Card
                  key={index}
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isSelected && "ring-2 ring-blue-500",
                    isMatched && "bg-gray-100 opacity-50 cursor-not-allowed",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => !isMatched && handleRightClick(item)}
                >
                  <span className="text-sm">{item}</span>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
        💡 Click an item on the left, then click its match on the right. Click the ✕ to remove a match.
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
          disabled={!isComplete || isSubmitted || disabled}
          className="flex-1"
        >
          Submit Matches ({Object.keys(matchState.matches).length}/{pairs.length})
        </Button>
        
        {!isSubmitted && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={Object.keys(matchState.matches).length === 0 || disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
} 