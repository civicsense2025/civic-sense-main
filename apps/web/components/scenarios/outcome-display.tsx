"use client"

import React from "react"
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  BookOpen,
  Star,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  Award,
  Brain
} from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'
import type { OutcomeDisplayProps } from "./types"

// =============================================================================
// PERFORMANCE METRICS COMPONENT
// =============================================================================

interface PerformanceMetricsProps {
  timeSpent: number
  estimatedDuration?: number
  decisionsCount: number
  optimalDecisions?: number
}

function PerformanceMetrics({ 
  timeSpent, 
  estimatedDuration, 
  decisionsCount, 
  optimalDecisions 
}: PerformanceMetricsProps) {
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeEfficiency = () => {
    if (!estimatedDuration) return null
    const actualMinutes = timeSpent / 60000
    const estimatedMinutes = estimatedDuration
    
    if (actualMinutes <= estimatedMinutes) return 'excellent'
    if (actualMinutes <= estimatedMinutes * 1.5) return 'good'
    return 'needs_improvement'
  }

  const getDecisionEfficiency = () => {
    if (!optimalDecisions || decisionsCount === 0) return null
    const percentage = (optimalDecisions / decisionsCount) * 100
    
    if (percentage >= 80) return 'excellent'
    if (percentage >= 60) return 'good'
    if (percentage >= 40) return 'fair'
    return 'needs_improvement'
  }

  const timeEfficiency = getTimeEfficiency()
  const decisionEfficiency = getDecisionEfficiency()

  const getEfficiencyColor = (efficiency: string | null) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600 dark:text-green-400'
      case 'good': return 'text-blue-600 dark:text-blue-400'
      case 'fair': return 'text-yellow-600 dark:text-yellow-400'
      case 'needs_improvement': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white">
                Time Spent
              </h4>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {formatTime(timeSpent)}
              </p>
              {estimatedDuration && (
                <p className={cn("text-sm", getEfficiencyColor(timeEfficiency))}>
                  {timeEfficiency === 'excellent' && 'Excellent timing!'}
                  {timeEfficiency === 'good' && 'Good pace'}
                  {timeEfficiency === 'needs_improvement' && 'Consider being more decisive'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white">
                Decision Quality
              </h4>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {optimalDecisions || 0}/{decisionsCount}
              </p>
              {decisionEfficiency && (
                <p className={cn("text-sm", getEfficiencyColor(decisionEfficiency))}>
                  {decisionEfficiency === 'excellent' && 'Outstanding choices!'}
                  {decisionEfficiency === 'good' && 'Well reasoned'}
                  {decisionEfficiency === 'fair' && 'Room for improvement'}
                  {decisionEfficiency === 'needs_improvement' && 'Consider the long-term effects'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// LEARNING OBJECTIVES COMPONENT
// =============================================================================

interface LearningObjectivesProps {
  objectives: string[]
  metObjectives?: string[]
}

function LearningObjectives({ objectives, metObjectives = [] }: LearningObjectivesProps) {
  const completionRate = objectives.length > 0 
    ? (metObjectives.length / objectives.length) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Objectives
          </h3>
          <Badge 
            variant={completionRate >= 80 ? "default" : completionRate >= 60 ? "secondary" : "outline"}
            className="text-sm"
          >
            {Math.round(completionRate)}% Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Progress value={completionRate} className="h-2" />
        
        <div className="space-y-3">
          {objectives.map((objective, index) => {
            const isMet = metObjectives.includes(objective)
            
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={cn(
                  "rounded-full p-1 mt-0.5",
                  isMet 
                    ? "bg-green-100 dark:bg-green-900" 
                    : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <CheckCircle className={cn(
                    "h-4 w-4",
                    isMet 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-slate-400"
                  )} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm",
                    isMet 
                      ? "text-slate-900 dark:text-white font-medium" 
                      : "text-slate-600 dark:text-slate-400"
                  )}>
                    {objective}
                  </p>
                  {isMet && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Demonstrated through your decisions
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {objectives.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No learning objectives defined for this scenario
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// CONCEPTS MASTERED COMPONENT
// =============================================================================

interface ConceptsMasteredProps {
  concepts: string[]
}

function ConceptsMastered({ concepts }: ConceptsMasteredProps) {
  const formatConcept = (concept: string) => {
    return concept
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Concepts Demonstrated
        </h3>
      </CardHeader>
      
      <CardContent>
        {concepts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                <Star className="h-3 w-3 mr-1" />
                {formatConcept(concept)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            Complete more scenarios to demonstrate civic concepts
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// FINAL RESOURCES DISPLAY
// =============================================================================

interface FinalResourcesProps {
  resources: Record<string, number>
  startingResources?: Record<string, number>
}

function FinalResources({ resources, startingResources = {} }: FinalResourcesProps) {
  const resourceEntries = Object.entries(resources).map(([type, value]) => {
    const startingValue = startingResources[type] || 0
    const change = value - startingValue
    
    return {
      type,
      value,
      change,
      percentage: startingValue > 0 ? ((change / startingValue) * 100) : 0
    }
  })

  const formatResourceName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Final Resources
        </h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {resourceEntries.map(({ type, value, change }) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatResourceName(type)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {value}
                </span>
                {change !== 0 && (
                  <span className={cn(
                    "text-xs flex items-center gap-1",
                    change > 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN OUTCOME DISPLAY COMPONENT
// =============================================================================

export function OutcomeDisplay({ 
  scenario, 
  gameState, 
  onRestart, 
  onContinue,
  className 
}: OutcomeDisplayProps) {
  const decisionsCount = gameState.decisionsHistory.length
  const timeSpent = gameState.timeSpent

  // Calculate performance metrics
  const optimalDecisions = 0 // Would be calculated based on decision data
  const conceptsDemonstrated = [] as string[] // Would be extracted from decisions
  const learningObjectivesMet = [] as string[] // Would be calculated based on performance

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", className)}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Scenario Complete!
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              You've successfully navigated through "{scenario?.scenario_title}"
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {decisionsCount} decisions made
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.round(timeSpent / 60000)} minutes
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                {scenario?.difficulty_level} level
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <PerformanceMetrics
            timeSpent={timeSpent}
            estimatedDuration={scenario?.estimated_duration_minutes}
            decisionsCount={decisionsCount}
            optimalDecisions={optimalDecisions}
          />

          {/* Learning Objectives */}
          <LearningObjectives
            objectives={scenario?.learning_objectives || []}
            metObjectives={learningObjectivesMet}
          />

          {/* Concepts Demonstrated */}
          <ConceptsMastered concepts={conceptsDemonstrated} />

          {/* Final Resources */}
          <FinalResources
            resources={gameState.resources}
            startingResources={gameState.selectedCharacter?.starting_resources}
          />

          {/* Character Performance */}
          {gameState.selectedCharacter && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Character Performance
                </h3>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                    <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {gameState.selectedCharacter.character_name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {gameState.selectedCharacter.character_title}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                      You successfully leveraged your character's unique abilities and resources 
                      to navigate this {scenario?.scenario_type.replace('_', ' ')} scenario.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={onRestart}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              onClick={onContinue}
              className="flex items-center gap-2"
            >
              Continue Learning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Continue Your Civic Education
              </h3>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    Recommended Next Steps
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Try a different character perspective</li>
                    <li>• Explore related quiz topics</li>
                    <li>• Join a multiplayer scenario</li>
                    <li>• Practice with higher difficulty levels</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    Real-World Application
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apply what you've learned by engaging with your local government, 
                    following relevant policy debates, or participating in community organizations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 