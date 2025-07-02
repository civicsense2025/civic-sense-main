"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Target, Brain, CheckCircle2, ArrowRight } from 'lucide-react'

interface LearningObjective {
  skill_slug: string
  skill_name: string
  category_name: string
  objective_text: string
  mastery_level_required: string
  objective_type: string
  display_order: number
}

interface LearningObjectivesCardProps {
  limit?: number
  onViewSkill?: (skillSlug: string) => void
}

export function LearningObjectivesCard({ limit = 5, onViewSkill }: LearningObjectivesCardProps) {
  const { user } = useAuth()
  const [objectives, setObjectives] = useState<LearningObjective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLearningObjectives = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Fetch learning objectives from API
        const response = await fetch(`/api/skills/learning-objectives?limit=${limit}`)
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.data) {
          setObjectives(data.data)
        } else {
          setObjectives([])
        }
      } catch (error) {
        console.error('Error loading learning objectives:', error)
        setError('Failed to load learning objectives')
      } finally {
        setIsLoading(false)
      }
    }

    loadLearningObjectives()
  }, [user, limit])

  // Get icon for objective type
  const getObjectiveTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge': return <Brain className="h-4 w-4" />
      case 'application': return <Target className="h-4 w-4" />
      case 'comprehension': return <Brain className="h-4 w-4" />
      case 'analysis': return <Target className="h-4 w-4" />
      case 'synthesis': return <Brain className="h-4 w-4" />
      case 'evaluation': return <CheckCircle2 className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  // Get badge color for mastery level
  const getMasteryBadgeColor = (level: string) => {
    switch (level) {
      case 'novice': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      case 'beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'intermediate': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'expert': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Learning Objectives
        </CardTitle>
      </CardHeader>
      <CardContent>
        {objectives.length > 0 ? (
          <div className="space-y-4">
            {objectives.map((objective, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getMasteryBadgeColor(objective.mastery_level_required)}>
                      {objective.mastery_level_required}
                    </Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {objective.category_name}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="mt-1 text-slate-500 dark:text-slate-400">
                    {getObjectiveTypeIcon(objective.objective_type)}
                  </div>
                  <div>
                    <p className="text-sm">{objective.objective_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {objective.skill_name}
                      </span>
                      {onViewSkill && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => onViewSkill(objective.skill_slug)}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-600 dark:text-slate-400">No learning objectives available yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Complete more quizzes to get personalized learning objectives.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 