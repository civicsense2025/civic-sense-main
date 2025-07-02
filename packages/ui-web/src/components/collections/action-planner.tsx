'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Target, CheckCircle, Calendar, Users, ExternalLink } from 'lucide-react'
// import useUIStrings from '@civicsense/shared/hooks/useUIStrings' // Temporarily use static strings

// Temporary static strings for build fix
const uiStrings = {
  collections: {
    takeAction: "Take Action",
    planned: "planned",
    completed: "completed",
    immediateActions: "Immediate Actions",
    immediateActionsDesc: "These actions can be taken right away to make a difference.",
    markAsCompleted: "Mark as completed",
    civicEngagementOpportunities: "Civic Engagement Opportunities",
    civicEngagementDesc: "Ways to get involved in your community and democracy.",
    yourActionPlan: "Your Action Plan",
    youvePlannedActions: "You've planned {count} action{plural}",
    andCompleted: " and completed {count}",
    greatJobTakingAction: "Great job taking action!",
    keepGoing: "Keep going with your planned actions.",
    readyToTakeAction: "Ready to Take Action?",
    checkOffActions: "Check off actions you want to plan or complete.",
    outstanding: "Outstanding!",
    completedAllActions: "You've completed all available actions. You're making a real difference!"
  }
}

interface ActionPlannerProps {
  actionItems: string[]
  civicOpportunities: string[]
  onPlan?: (planned: string[]) => void
  onComplete?: (completed: string[]) => void
  initialPlanned?: string[]
  initialCompleted?: string[]
  className?: string
}

export function ActionPlanner({
  actionItems,
  civicOpportunities,
  onPlan,
  onComplete,
  initialPlanned = [],
  initialCompleted = [],
  className
}: ActionPlannerProps) {
  const [plannedActions, setPlannedActions] = useState<string[]>(initialPlanned)
  const [completedActions, setCompletedActions] = useState<string[]>(initialCompleted)

  useEffect(() => {
    setPlannedActions(initialPlanned)
    setCompletedActions(initialCompleted)
  }, [initialPlanned, initialCompleted])

  const handlePlanToggle = (action: string) => {
    const newPlanned = plannedActions.includes(action)
      ? plannedActions.filter(a => a !== action)
      : [...plannedActions, action]
    
    setPlannedActions(newPlanned)
    onPlan?.(newPlanned)
  }

  const handleCompleteToggle = (action: string) => {
    const newCompleted = completedActions.includes(action)
      ? completedActions.filter(a => a !== action)
      : [...completedActions, action]
    
    setCompletedActions(newCompleted)
    onComplete?.(newCompleted)
  }

  const allActions = [...actionItems, ...civicOpportunities]
  const plannedCount = plannedActions.length
  const completedCount = completedActions.length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-red-600" />
          {uiStrings.collections.takeAction}
          <div className="flex items-center gap-2 ml-auto">
            {plannedCount > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {plannedCount} {uiStrings.collections.planned}
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedCount} {uiStrings.collections.completed}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">{uiStrings.collections.immediateActions}</h4>
            </div>
            <p className="text-sm text-gray-600">
              {uiStrings.collections.immediateActionsDesc}
            </p>
            
            <div className="space-y-3">
              {actionItems.map((action, index) => {
                const isPlanned = plannedActions.includes(action)
                const isCompleted = completedActions.includes(action)
                
                return (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-2 pt-1">
                      <Checkbox
                        id={`plan-${index}`}
                        checked={isPlanned}
                        onCheckedChange={() => handlePlanToggle(action)}
                      />
                      {isPlanned && (
                        <Checkbox
                          id={`complete-${index}`}
                          checked={isCompleted}
                          onCheckedChange={() => handleCompleteToggle(action)}
                          className="border-green-600 data-[state=checked]:bg-green-600"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label htmlFor={`plan-${index}`} className="block cursor-pointer">
                        <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {action}
                        </span>
                      </label>
                      
                      {isPlanned && !isCompleted && (
                        <div className="mt-2">
                          <label htmlFor={`complete-${index}`} className="flex items-center gap-2 text-xs text-green-700 cursor-pointer">
                            <span>{uiStrings.collections.markAsCompleted}</span>
                          </label>
                        </div>
                      )}
                      
                      {isCompleted && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {uiStrings.collections.completed}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Separator */}
        {actionItems.length > 0 && civicOpportunities.length > 0 && (
          <Separator />
        )}

        {/* Civic Engagement Opportunities */}
        {civicOpportunities.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">{uiStrings.collections.civicEngagementOpportunities}</h4>
            </div>
            <p className="text-sm text-gray-600">
              {uiStrings.collections.civicEngagementDesc}
            </p>
            
            <div className="space-y-3">
              {civicOpportunities.map((opportunity, index) => {
                const isPlanned = plannedActions.includes(opportunity)
                const isCompleted = completedActions.includes(opportunity)
                
                return (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-2 pt-1">
                      <Checkbox
                        id={`civic-plan-${index}`}
                        checked={isPlanned}
                        onCheckedChange={() => handlePlanToggle(opportunity)}
                      />
                      {isPlanned && (
                        <Checkbox
                          id={`civic-complete-${index}`}
                          checked={isCompleted}
                          onCheckedChange={() => handleCompleteToggle(opportunity)}
                          className="border-green-600 data-[state=checked]:bg-green-600"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label htmlFor={`civic-plan-${index}`} className="block cursor-pointer">
                        <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {opportunity}
                        </span>
                      </label>
                      
                      {isPlanned && !isCompleted && (
                        <div className="mt-2">
                          <label htmlFor={`civic-complete-${index}`} className="flex items-center gap-2 text-xs text-green-700 cursor-pointer">
                            <span>{uiStrings.collections.markAsCompleted}</span>
                          </label>
                        </div>
                      )}
                      
                      {isCompleted && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {uiStrings.collections.completed}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Progress Summary */}
        {plannedCount > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">{uiStrings.collections.yourActionPlan}</h5>
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                {uiStrings.collections.youvePlannedActions.replace('{count}', plannedCount.toString()).replace('{plural}', plannedCount !== 1 ? 's' : '')}
                {completedCount > 0 && uiStrings.collections.andCompleted.replace('{count}', completedCount.toString())}.
              </p>
              {completedCount > 0 && (
                <p className="font-medium">
                  {uiStrings.collections.greatJobTakingAction}
                </p>
              )}
              {plannedCount > completedCount && (
                <p>
                  {uiStrings.collections.keepGoing}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Encouragement */}
        {plannedCount === 0 && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h5 className="font-medium text-gray-700 mb-1">{uiStrings.collections.readyToTakeAction}</h5>
            <p className="text-sm text-gray-600">
              {uiStrings.collections.checkOffActions}
            </p>
          </div>
        )}

        {/* Call to Action */}
        {completedCount === allActions.length && allActions.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h5 className="font-medium text-green-800 mb-1">{uiStrings.collections.outstanding}</h5>
            <p className="text-sm text-green-700">
              {uiStrings.collections.completedAllActions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 