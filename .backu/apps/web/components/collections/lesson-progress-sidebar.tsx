'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { CheckCircle, Circle, Lock, Clock, PlayCircle } from 'lucide-react'
import { LessonStep, getStepTypeInfo, formatStepDuration, calculateStepProgress } from '@civicsense/types/lesson-steps'

interface LessonProgressSidebarProps {
  steps: LessonStep[]
  currentStepId?: string
  onStepSelect?: (stepId: string) => void
  className?: string
}

export function LessonProgressSidebar({
  steps,
  currentStepId,
  onStepSelect,
  className
}: LessonProgressSidebarProps) {
  const progress = calculateStepProgress(steps)
  const totalTime = steps.reduce((total, step) => total + step.estimated_minutes, 0)

  const isStepLocked = (step: LessonStep): boolean => {
    return step.prerequisites.some(prereqNumber => {
      const prereqStep = steps.find(s => s.step_number === prereqNumber)
      return prereqStep?.progress?.status !== 'completed'
    })
  }

  const getStepIcon = (step: LessonStep) => {
    const isLocked = isStepLocked(step)
    const isCompleted = step.progress?.status === 'completed'
    const isCurrent = step.id === currentStepId
    
    if (isLocked) {
      return <Lock className="h-4 w-4 text-gray-400" />
    }
    
    if (isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    if (isCurrent) {
      return <PlayCircle className="h-4 w-4 text-blue-600" />
    }
    
    return <Circle className="h-4 w-4 text-gray-400" />
  }

  const getStepButtonVariant = (step: LessonStep) => {
    const isLocked = isStepLocked(step)
    const isCompleted = step.progress?.status === 'completed'
    const isCurrent = step.id === currentStepId
    
    if (isCurrent) return 'default'
    if (isCompleted) return 'outline'
    if (isLocked) return 'ghost'
    return 'ghost'
  }

  return (
    <Card className={`h-fit sticky top-6 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Lesson Progress</CardTitle>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress.completed} of {progress.total} steps</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
        
        {/* Time Estimate */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatStepDuration(totalTime)} total</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {steps.map((step, index) => {
          const stepTypeInfo = getStepTypeInfo(step.step_type)
          const isLocked = isStepLocked(step)
          const isCompleted = step.progress?.status === 'completed'
          const isCurrent = step.id === currentStepId
          
          return (
            <Button
              key={step.id}
              variant={getStepButtonVariant(step)}
              size="sm"
              onClick={() => !isLocked && onStepSelect?.(step.id)}
              disabled={isLocked}
              className={`w-full justify-start p-3 h-auto ${
                isCurrent ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      Step {step.step_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${stepTypeInfo.color}`}
                    >
                      {stepTypeInfo.icon}
                    </Badge>
                    {step.is_optional && (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {step.title}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatStepDuration(step.estimated_minutes)}
                    </span>
                    
                    {step.progress?.quiz_score && (
                      <Badge variant="secondary" className="text-xs">
                        {step.progress.quiz_score}%
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress indicator for current step */}
                  {isCurrent && step.progress?.status === 'in_progress' && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (step.progress?.time_spent_seconds || 0) / (step.estimated_minutes * 60) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
        
        {/* Completion Message */}
        {progress.percentage === 100 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Lesson Complete!</h3>
            <p className="text-sm text-green-700">
              You've completed all steps in this lesson. Great work on your civic learning journey!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 