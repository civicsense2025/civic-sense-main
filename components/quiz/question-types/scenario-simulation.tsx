"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { QuizQuestion } from '@/lib/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, User, ArrowRight, Trophy, Lightbulb } from 'lucide-react'

interface ScenarioSimulationQuestionProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  showHint?: boolean
  disabled?: boolean
}

interface Choice {
  id: string
  text: string
  consequence: string
  points: number
  explanation: string
}

interface Stage {
  id: string
  prompt: string
  choices: Choice[]
}

interface Character {
  name: string
  role: string
  context: string
}

interface InteractiveScenarioData {
  type: 'scenario_simulation'
  title: string
  instructions: string
  scenario: {
    setting: string
    character: Character
    initial_situation: string
  }
  stages: Stage[]
  scoring: {
    perfect: number
    good: number
    needs_improvement: number
  }
  results: {
    perfect: string
    good: string
    needs_improvement: string
  }
}

// Choice button component
function ChoiceButton({ 
  choice, 
  isSelected, 
  isRevealed, 
  onClick, 
  disabled 
}: { 
  choice: Choice
  isSelected: boolean
  isRevealed: boolean
  onClick: () => void
  disabled: boolean
}) {
  const getChoiceScore = (points: number) => {
    if (points >= 15) return 'excellent'
    if (points >= 10) return 'good'
    if (points >= 5) return 'fair'
    return 'poor'
  }

  const score = getChoiceScore(choice.points)

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className={cn(
        "w-full text-left p-4 h-auto justify-start transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
        !isRevealed && "hover:shadow-md hover:scale-[1.02]",
        isSelected && !isRevealed && "bg-blue-600 text-white",
        isRevealed && score === 'excellent' && "border-green-500 bg-green-50 text-green-800",
        isRevealed && score === 'good' && "border-blue-500 bg-blue-50 text-blue-800",
        isRevealed && score === 'fair' && "border-yellow-500 bg-yellow-50 text-yellow-800",
        isRevealed && score === 'poor' && "border-red-500 bg-red-50 text-red-800"
      )}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={choice.text}
      tabIndex={0}
    >
      <div className="flex items-start gap-3 w-full">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5",
          isSelected && "bg-current border-current"
        )} aria-hidden="true">
          {isSelected && <div className="w-full h-full rounded-full bg-white scale-50" />}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="font-medium text-sm leading-relaxed">
            {choice.text}
          </div>
          
          {isRevealed && (
            <div className="space-y-2">
              <div className="text-xs">
                <strong>Consequence:</strong> {choice.consequence}
              </div>
              <div className="text-xs">
                <strong>Why:</strong> {choice.explanation}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    score === 'excellent' && "border-green-500 text-green-700",
                    score === 'good' && "border-blue-500 text-blue-700",
                    score === 'fair' && "border-yellow-500 text-yellow-700",
                    score === 'poor' && "border-red-500 text-red-700"
                  )}
                >
                  +{choice.points} points
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </Button>
  )
}

export function ScenarioSimulationQuestion({
  question,
  onAnswer,
  showHint = false,
  disabled = false
}: ScenarioSimulationQuestionProps) {
  // Parse interactive data or create legacy format
  const interactiveData = useMemo((): InteractiveScenarioData | null => {
    if (question.interactive_data?.type === 'scenario_simulation') {
      return question.interactive_data as InteractiveScenarioData
    }

    // Legacy support - convert scenario_stages to interactive format
    if (question.type === 'scenario_simulation' && 'scenario_stages' in question && question.scenario_stages) {
      return {
        type: 'scenario_simulation',
        title: 'Civic Decision Scenario',
        instructions: 'Navigate this civic scenario by making informed decisions at each stage',
        scenario: {
          setting: 'You are a concerned citizen facing a civic challenge',
          character: {
            name: 'You',
            role: 'Concerned Citizen',
            context: 'Making important civic decisions'
          },
          initial_situation: 'You must make decisions that affect your community'
        },
        stages: question.scenario_stages.map((stage, index) => ({
          id: `stage_${index}`,
          prompt: stage.prompt,
          choices: stage.choices.map((choice, choiceIndex) => ({
            id: `choice_${choiceIndex}`,
            text: choice.text,
            consequence: choice.consequence,
            points: 10, // Default points
            explanation: `This choice leads to: ${choice.consequence}`
          }))
        })),
        scoring: {
          perfect: 40,
          good: 25,
          needs_improvement: 15
        },
        results: {
          perfect: "Outstanding civic engagement! You understand the complexities of democratic participation.",
          good: "Good civic thinking. You made informed decisions with positive outcomes.",
          needs_improvement: "Keep learning! Civic engagement requires practice and understanding."
        }
      }
    }

    return null
  }, [question])

  // State management
  const [currentStage, setCurrentStage] = useState(0)
  const [stageChoices, setStageChoices] = useState<Record<string, string>>({})
  const [stageRevealed, setStageRevealed] = useState<Record<string, boolean>>({})
  const [totalScore, setTotalScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  // Accessibility: ARIA live region for feedback/announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Reset state when question changes
  useEffect(() => {
    setCurrentStage(0)
    setStageChoices({})
    setStageRevealed({})
    setTotalScore(0)
    setIsCompleted(false)
  }, [question.question])

  if (!interactiveData) {
    return (
      <div className="text-center text-muted-foreground">
        <p>This scenario simulation doesn't have proper configuration.</p>
        <p className="text-sm">Please contact support if this error persists.</p>
      </div>
    )
  }

  const currentStageData = interactiveData.stages[currentStage]
  const selectedChoice = stageChoices[currentStageData?.id]
  const isStageRevealed = stageRevealed[currentStageData?.id]
  const isLastStage = currentStage === interactiveData.stages.length - 1

  const handleChoiceSelect = useCallback((choiceId: string) => {
    if (disabled || isStageRevealed) return
    
    setStageChoices(prev => ({
      ...prev,
      [currentStageData.id]: choiceId
    }))
    const choice = currentStageData.choices.find(c => c.id === choiceId)
    if (choice) setAriaAnnouncement(`Selected: ${choice.text}`)
  }, [disabled, isStageRevealed, currentStageData?.id, currentStageData?.choices])

  const handleConfirmChoice = useCallback(() => {
    if (!selectedChoice || isStageRevealed) return

    const choice = currentStageData.choices.find(c => c.id === selectedChoice)
    if (!choice) return

    // Add points to total score
    setTotalScore(prev => prev + choice.points)
    
    // Reveal stage results
    setStageRevealed(prev => ({
      ...prev,
      [currentStageData.id]: true
    }))
    setAriaAnnouncement(`Confirmed: ${choice.text}. ${choice.consequence}`)
  }, [selectedChoice, isStageRevealed, currentStageData])

  const handleNextStage = useCallback(() => {
    if (isLastStage) {
      // Complete the scenario
      setIsCompleted(true)
      
      // Calculate final result
      let resultLevel: keyof typeof interactiveData.results
      if (totalScore >= interactiveData.scoring.perfect) {
        resultLevel = 'perfect'
      } else if (totalScore >= interactiveData.scoring.good) {
        resultLevel = 'good'
      } else {
        resultLevel = 'needs_improvement'
      }

      const answerSummary = `Scenario completed: ${totalScore} points (${resultLevel})`
      onAnswer(answerSummary)
    } else {
      setCurrentStage(prev => prev + 1)
    }
  }, [isLastStage, totalScore, interactiveData.scoring, interactiveData.results, onAnswer])

  const handleRestart = useCallback(() => {
    setCurrentStage(0)
    setStageChoices({})
    setStageRevealed({})
    setTotalScore(0)
    setIsCompleted(false)
  }, [])

  const progressPercentage = ((currentStage + (isStageRevealed ? 1 : 0)) / interactiveData.stages.length) * 100

  if (isCompleted) {
    let resultLevel: keyof typeof interactiveData.results
    if (totalScore >= interactiveData.scoring.perfect) {
      resultLevel = 'perfect'
    } else if (totalScore >= interactiveData.scoring.good) {
      resultLevel = 'good'
    } else {
      resultLevel = 'needs_improvement'
    }

    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h3 className="text-2xl font-bold">Scenario Complete!</h3>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-600">{totalScore} Points</div>
            <div className="text-lg text-muted-foreground">
              {interactiveData.results[resultLevel]}
            </div>
          </div>
        </div>

        {/* Scenario summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Civic Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {interactiveData.stages.map((stage, index) => {
              const stageChoice = stageChoices[stage.id]
              const choice = stage.choices.find(c => c.id === stageChoice)
              
              return (
                <div key={stage.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="font-medium text-sm mb-2">Stage {index + 1}: {stage.prompt}</div>
                  {choice && (
                    <div className="space-y-1 text-sm">
                      <div><strong>Your choice:</strong> {choice.text}</div>
                      <div className="text-muted-foreground">{choice.consequence}</div>
                      <Badge variant="outline" className="text-xs">+{choice.points} points</Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleRestart} variant="outline">
            Try Again with Different Choices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold" id="scenario-title">{interactiveData.title}</h3>
        <p className="text-sm text-muted-foreground" id="scenario-instructions">{interactiveData.instructions}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Stage {currentStage + 1} of {interactiveData.stages.length}</span>
          <span>Score: {totalScore} points</span>
        </div>
        <Progress value={progressPercentage} className="w-full" aria-label="Progress through scenario" />
      </div>

      {/* Scenario context */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <div className="font-medium text-sm">
                {interactiveData.scenario.character.name} - {interactiveData.scenario.character.role}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentStage === 0 ? interactiveData.scenario.initial_situation : currentStageData.prompt}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Civic Education Context */}
      {question.explanation && showHint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Civic Context:</strong> {question.explanation}
            </div>
          </div>
        </div>
      )}

      {/* ARIA live region for feedback/announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{ariaAnnouncement}</div>

      {/* Current stage */}
      {currentStageData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              What's your next move?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm font-medium mb-4" id="stage-prompt">
              {currentStageData.prompt}
            </div>
            
            <div className="space-y-3" role="list" aria-labelledby="stage-prompt">
              {currentStageData.choices.map(choice => (
                <ChoiceButton
                  key={choice.id}
                  choice={choice}
                  isSelected={selectedChoice === choice.id}
                  isRevealed={isStageRevealed}
                  onClick={() => handleChoiceSelect(choice.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        {!isStageRevealed && (
          <Button
            onClick={handleConfirmChoice}
            disabled={!selectedChoice || disabled}
            className="px-6"
          >
            Confirm Choice
          </Button>
        )}
        
        {isStageRevealed && (
          <Button
            onClick={handleNextStage}
            className="px-6"
          >
            {isLastStage ? 'Complete Scenario' : 'Next Stage'}
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Choice feedback */}
      {isStageRevealed && selectedChoice && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                <span className="font-medium text-sm">Choice Registered</span>
              </div>
              
              {(() => {
                const choice = currentStageData.choices.find(c => c.id === selectedChoice)
                if (!choice) return null
                
                return (
                  <div className="text-sm">
                    <div><strong>Consequence:</strong> {choice.consequence}</div>
                    <div><strong>Why:</strong> {choice.explanation}</div>
                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 mt-2">
                      +{choice.points} points
                    </Badge>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 