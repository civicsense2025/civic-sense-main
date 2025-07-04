'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Clock, CheckCircle, Lock, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { LessonStep, LessonStepsResponse, getStepTypeInfo, formatStepDuration } from '@civicsense/types/lesson-steps'
import { LessonStepContent } from './lesson-step-content'
import { LessonProgressSidebar } from './lesson-progress-sidebar'
import { QuizComponent } from './quiz-component'
import { ReflectionComponent } from './reflection-component'
import { ActionPlanner } from './action-planner'
import { toast } from 'sonner'

interface LessonStepViewerProps {
  collectionSlug: string
  initialData?: LessonStepsResponse
  className?: string
}

export function LessonStepViewer({ 
  collectionSlug, 
  initialData,
  className 
}: LessonStepViewerProps) {
  const router = useRouter()
  const [data, setData] = useState<LessonStepsResponse | null>(initialData || null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [loading, setLoading] = useState(!initialData)
  const [updating, setUpdating] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Load lesson steps data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/collections/${collectionSlug}/steps`)
      
      if (!response.ok) {
        throw new Error('Failed to load lesson steps')
      }
      
      const stepsData: LessonStepsResponse = await response.json()
      setData(stepsData)
      
      // Set current step to the next available step or first step
      if (stepsData.next_available_step) {
        const nextIndex = stepsData.steps.findIndex(
          step => step.id === stepsData.next_available_step?.id
        )
        if (nextIndex !== -1) {
          setCurrentStepIndex(nextIndex)
        }
      }
      
    } catch (error) {
      console.error('Error loading lesson steps:', error)
      toast.error('Failed to load lesson steps')
    } finally {
      setLoading(false)
    }
  }, [collectionSlug])

  // Load data on mount if not provided
  useEffect(() => {
    if (!initialData) {
      loadData()
    }
  }, [loadData, initialData])

  // Track time spent on current step
  useEffect(() => {
    setStartTime(new Date())
    setTimeSpent(0)
    
    const interval = setInterval(() => {
      if (startTime) {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [currentStepIndex, startTime])

  // Update step progress
  const updateProgress = async (
    stepId: string, 
    updates: {
      status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
      quiz_score?: number
      reflection_response?: string
      understanding_rating?: number
      difficulty_rating?: number
      actions_planned?: string[]
      actions_completed?: string[]
    }
  ) => {
    try {
      setUpdating(true)
      
      const response = await fetch(`/api/collections/${collectionSlug}/steps/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_step_id: stepId,
          time_spent_seconds: timeSpent,
          ...updates
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update progress')
      }
      
      // Reload data to get updated progress
      await loadData()
      
      if (updates.status === 'completed') {
        toast.success('Step completed! Great progress on your civic learning.')
      }
      
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Failed to update progress')
    } finally {
      setUpdating(false)
    }
  }

  // Handle step completion
  const handleStepComplete = async (stepId: string) => {
    await updateProgress(stepId, { status: 'completed' })
    
    // Auto-advance to next available step
    if (data) {
      const nextStep = data.steps.find((step, index) => 
        index > currentStepIndex && 
        step.prerequisites.every(prereqNumber => {
          const prereqStep = data.steps.find(s => s.step_number === prereqNumber)
          return prereqStep?.progress?.status === 'completed'
        })
      )
      
      if (nextStep) {
        const nextIndex = data.steps.findIndex(step => step.id === nextStep.id)
        setCurrentStepIndex(nextIndex)
      }
    }
  }

  // Handle navigation
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleNext = () => {
    if (data && currentStepIndex < data.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handleStepSelect = (stepId: string) => {
    if (data) {
      const stepIndex = data.steps.findIndex(step => step.id === stepId)
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading lesson steps...</p>
        </div>
      </div>
    )
  }

  if (!data || data.steps.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Lesson Steps Available</h3>
          <p className="text-gray-600 mb-4">
            This collection doesn't have structured lesson steps yet.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentStep = data.steps[currentStepIndex]
  const stepTypeInfo = getStepTypeInfo(currentStep.step_type)
  const isStepLocked = currentStep.prerequisites.some(prereqNumber => {
    const prereqStep = data.steps.find(s => s.step_number === prereqNumber)
    return prereqStep?.progress?.status !== 'completed'
  })

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Progress Sidebar */}
      <div className="w-80 flex-shrink-0">
        <LessonProgressSidebar
          steps={data.steps}
          currentStepId={currentStep.id}
          onStepSelect={handleStepSelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl">
        {/* Step Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={stepTypeInfo.color}>
                  <span className="mr-1">{stepTypeInfo.icon}</span>
                  {stepTypeInfo.label}
                </Badge>
                <Badge variant="secondary">
                  Step {currentStep.step_number} of {data.total_steps}
                </Badge>
                {isStepLocked && (
                  <Badge variant="destructive">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {formatStepDuration(currentStep.estimated_minutes)}
              </div>
            </div>
            
            <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            
            {currentStep.summary && (
              <p className="text-gray-600">{currentStep.summary}</p>
            )}
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Collection Progress</span>
                <span>{data.progress_percentage}% complete</span>
              </div>
              <Progress value={data.progress_percentage} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Step Content */}
        {isStepLocked ? (
          <Card>
            <CardContent className="text-center p-8">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Step Locked</h3>
              <p className="text-gray-600 mb-4">
                Complete the prerequisite steps to unlock this lesson.
              </p>
              <div className="space-y-2">
                {currentStep.prerequisites.map(prereqNumber => {
                  const prereqStep = data.steps.find(s => s.step_number === prereqNumber)
                  return prereqStep ? (
                    <div key={prereqNumber} className="flex items-center gap-2 text-sm">
                      {prereqStep.progress?.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span>Step {prereqStep.step_number}: {prereqStep.title}</span>
                    </div>
                  ) : null
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Content */}
            <LessonStepContent
              step={currentStep}
              onUpdateProgress={(updates) => updateProgress(currentStep.id, updates)}
            />

            {/* Interactive Components */}
            {currentStep.has_quiz && currentStep.quiz_questions && (
              <QuizComponent
                questions={currentStep.quiz_questions}
                onComplete={(score) => updateProgress(currentStep.id, { quiz_score: score })}
              />
            )}

            {currentStep.has_reflection && currentStep.reflection_prompts.length > 0 && (
              <ReflectionComponent
                prompts={currentStep.reflection_prompts}
                initialResponse={currentStep.progress?.reflection_response}
                onSubmit={(response) => updateProgress(currentStep.id, { reflection_response: response })}
              />
            )}

            {(currentStep.action_items.length > 0 || currentStep.civic_engagement_opportunities.length > 0) && (
              <ActionPlanner
                actionItems={currentStep.action_items}
                civicOpportunities={currentStep.civic_engagement_opportunities}
                initialPlanned={currentStep.progress?.actions_planned}
                initialCompleted={currentStep.progress?.actions_completed}
                onPlan={(planned) => updateProgress(currentStep.id, { actions_planned: planned })}
                onComplete={(completed) => updateProgress(currentStep.id, { actions_completed: completed })}
              />
            )}

            {/* Step Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-3">
                    {currentStep.progress?.status !== 'completed' && (
                      <Button
                        onClick={() => handleStepComplete(currentStep.id)}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {updating ? 'Completing...' : 'Complete Step'}
                      </Button>
                    )}

                    <Button
                      variant={currentStepIndex === data.steps.length - 1 ? 'default' : 'outline'}
                      onClick={handleNext}
                      disabled={currentStepIndex === data.steps.length - 1}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 