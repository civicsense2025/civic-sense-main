"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, BookOpen, Target, Brain, ArrowUpRight } from "lucide-react"

interface LearningObjective {
  id: string
  skill_id: string
  skill_name: string
  skill_slug: string
  objective_text: string
  objective_type: string
  mastery_level_required: string
  display_order: number
  completed?: boolean
}

interface LearningObjectivesCardProps {
  limit?: number
  onViewSkill?: (skillSlug: string) => void
}

export function LearningObjectivesCard({ limit = 5, onViewSkill }: LearningObjectivesCardProps) {
  const { user } = useAuth()
  const [objectives, setObjectives] = useState<LearningObjective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadObjectives = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Import skill operations
        const { skillOperations } = await import('@/lib/skill-operations')
        
        // Get user skills
        const userSkills = await skillOperations.getUserSkills(user.id)
        
        // Get learning objectives for skills in progress
        const inProgressSkills = userSkills.filter(s => 
          s.mastery_level === 'beginner' || s.mastery_level === 'intermediate'
        ).slice(0, 3) // Focus on top 3 in-progress skills
        
        // Collect learning objectives
        const allObjectives: LearningObjective[] = []
        
        for (const skill of inProgressSkills) {
          const skillDetails = await skillOperations.getSkillDetails(skill.id)
          
          if (skillDetails?.learning_objectives) {
            // Filter objectives based on user's current mastery level
            const relevantObjectives = skillDetails.learning_objectives
              .filter(obj => {
                // For beginners, show beginner objectives
                if (skill.mastery_level === 'novice' || skill.mastery_level === 'beginner') {
                  return obj.mastery_level_required === 'beginner'
                }
                
                // For intermediate, show intermediate objectives
                if (skill.mastery_level === 'intermediate') {
                  return obj.mastery_level_required === 'intermediate'
                }
                
                // For advanced, show advanced objectives
                return obj.mastery_level_required === 'advanced'
              })
              .map(obj => ({
                ...obj,
                skill_name: skill.skill_name,
                skill_slug: skill.skill_slug,
                // Simulate completion status based on progress
                completed: Math.random() < (skill.progress_percentage || 0) / 100
              }))
            
            allObjectives.push(...relevantObjectives)
          }
        }
        
        // If we don't have enough objectives, add some from core skills
        if (allObjectives.length < limit) {
          const coreSkills = userSkills.filter(s => s.is_core_skill).slice(0, 2)
          
          for (const skill of coreSkills) {
            if (allObjectives.length >= limit) break
            
            const skillDetails = await skillOperations.getSkillDetails(skill.id)
            
            if (skillDetails?.learning_objectives) {
              const coreObjectives = skillDetails.learning_objectives
                .filter(obj => obj.mastery_level_required === 'beginner')
                .map(obj => ({
                  ...obj,
                  skill_name: skill.skill_name,
                  skill_slug: skill.skill_slug,
                  completed: Math.random() < (skill.progress_percentage || 0) / 100
                }))
              
              allObjectives.push(...coreObjectives.slice(0, limit - allObjectives.length))
            }
          }
        }
        
        // Sort by completion status and then by display_order
        allObjectives.sort((a, b) => {
          if (a.completed === b.completed) {
            return a.display_order - b.display_order
          }
          return a.completed ? 1 : -1
        })
        
        setObjectives(allObjectives.slice(0, limit))
      } catch (error) {
        console.error('Error loading learning objectives:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadObjectives()
  }, [user, limit])
  
  const getObjectiveTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge': return <BookOpen className="h-4 w-4" />
      case 'comprehension': return <Brain className="h-4 w-4" />
      case 'application': return <Target className="h-4 w-4" />
      case 'analysis': return <ArrowUpRight className="h-4 w-4" />
      case 'synthesis': return <ArrowUpRight className="h-4 w-4" />
      case 'evaluation': return <CheckCircle2 className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }
  
  const getMasteryBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'intermediate': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Objectives</CardTitle>
          <CardDescription>Your current learning goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 dark:border-slate-50"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (objectives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Objectives</CardTitle>
          <CardDescription>Your current learning goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-slate-600 dark:text-slate-400">No learning objectives found</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Start learning a skill to see objectives here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Objectives</CardTitle>
        <CardDescription>Your current learning goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {objectives.map((objective) => (
          <div 
            key={objective.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              objective.completed 
                ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400' 
                : 'bg-white dark:bg-slate-900'
            }`}
          >
            <div className="mt-0.5">
              {objective.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 dark:text-slate-700" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    {getObjectiveTypeIcon(objective.objective_type)}
                  </span>
                  <Badge className={getMasteryBadgeColor(objective.mastery_level_required)}>
                    {objective.mastery_level_required}
                  </Badge>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => onViewSkill?.(objective.skill_slug)}
                >
                  {objective.skill_name}
                </Button>
              </div>
              
              <p className={`text-sm mt-1 ${objective.completed ? 'line-through' : ''}`}>
                {objective.objective_text}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 