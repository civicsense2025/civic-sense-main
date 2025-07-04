"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from "@/lib/auth"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  CircleDashed,
  GraduationCap,
  LucideArrowRight,
  Target,
  ArrowUpRight,
  Brain
} from "lucide-react"
import { skillOperations } from '@civicsense/business-logic/services/skills'
import Link from "next/link"

// Extended skill interface for detailed view
interface SkillWithDetails {
  id: string
  skill_name: string
  skill_slug: string
  category_name: string
  description: string
  difficulty_level: number
  is_core_skill: boolean
  learning_objectives: Array<{
    id: string
    skill_id: string
    objective_text: string
    objective_type: string
    mastery_level_required: string
    display_order: number
  }>
  prerequisites: Array<{
    id: string
    skill_id: string
    prerequisite_skill_id: string
    prerequisite_skill_name?: string
    prerequisite_skill_slug?: string
    required_mastery_level: string
    is_strict_requirement: boolean
  }>
  dependent_skills: Array<{
    skill_id: string
    skill_name: string
  }>
}

interface SkillDetailModalProps {
  isOpen: boolean
  onClose: () => void
  skillSlug?: string
  skillId?: string
}

export function SkillDetailModal({ 
  isOpen, 
  onClose, 
  skillSlug, 
  skillId 
}: SkillDetailModalProps) {
  const { user } = useAuth()
  const [skill, setSkill] = useState<SkillWithDetails | null>(null)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load skill details when modal opens
  useEffect(() => {
    const loadSkillDetails = async () => {
      if (!isOpen || (!skillSlug && !skillId)) return
      
      try {
        setIsLoading(true)
        
        const identifier = skillSlug || skillId!
        
        // Get detailed skill information from API
        const response = await fetch(`/api/skills/skill-details?${skillSlug ? `slug=${skillSlug}` : `id=${skillId}`}`)
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        
        const skillData = await response.json()
        
        if (skillData.skill) {
          // Transform the data into our expected format
          const skillWithDetails: SkillWithDetails = {
            ...skillData.skill,
            learning_objectives: skillData.objectives,
            prerequisites: skillData.prerequisites,
            dependent_skills: skillData.dependentSkills.map((dep: { skill_id: string; prerequisite_skill_name?: string }) => ({
              skill_id: dep.skill_id,
              skill_name: dep.prerequisite_skill_name || 'Unknown Skill'
            }))
          }
          setSkill(skillWithDetails)
          
          // Load user progress if user is logged in
          if (user) {
            const progress = await skillOperations.getUserSkillProgress(user.id, skillData.skill.id)
            setUserProgress(progress)
          }
        }
      } catch (error) {
        console.error('Error loading skill details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSkillDetails()
  }, [isOpen, skillSlug, skillId, user])

  // Group learning objectives by mastery level
  const objectivesByLevel = skill?.learning_objectives?.reduce<Record<string, SkillWithDetails['learning_objectives']>>((acc, obj) => {
    if (!acc[obj.mastery_level_required]) {
      acc[obj.mastery_level_required] = []
    }
    acc[obj.mastery_level_required].push(obj)
    return acc
  }, {}) || {}

  // Helper functions for rendering
  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'novice': return 'text-slate-500 dark:text-slate-400'
      case 'beginner': return 'text-blue-500 dark:text-blue-400'
      case 'intermediate': return 'text-green-500 dark:text-green-400'
      case 'advanced': return 'text-purple-500 dark:text-purple-400'
      case 'expert': return 'text-amber-500 dark:text-amber-400'
      default: return 'text-slate-500 dark:text-slate-400'
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

  const getObjectiveTypeIcon = (type: string) => {
    switch (type) {
      case 'knowledge': return <BookOpen className="h-4 w-4" />
      case 'comprehension': return <Brain className="h-4 w-4" />
      case 'application': return <Target className="h-4 w-4" />
      case 'analysis': return <GraduationCap className="h-4 w-4" />
      case 'synthesis': return <ArrowUpRight className="h-4 w-4" />
      case 'evaluation': return <CheckCircle2 className="h-4 w-4" />
      default: return <CircleDashed className="h-4 w-4" />
    }
  }

  if (isLoading || !skill) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Skill Details...</DialogTitle>
          </DialogHeader>
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-50"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{skill.skill_name}</DialogTitle>
            <Badge variant="outline">{skill.category_name}</Badge>
          </div>
          <DialogDescription className="text-base mt-2">
            {skill.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* User Progress */}
        {userProgress && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Your Progress</h3>
              <Badge className={getMasteryBadgeColor(userProgress.mastery_level)}>
                {userProgress.mastery_level}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Skill Level</span>
                <span>{Math.round(userProgress.skill_level)}%</span>
              </div>
              <Progress value={userProgress.skill_level} className="h-2" />
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500 dark:text-slate-500">
                  {userProgress.questions_correct || 0}/{userProgress.questions_attempted || 0} questions correct
                </span>
                <span className="text-slate-500 dark:text-slate-500">
                  Last practiced: {userProgress.last_practiced_at ? 
                    new Date(userProgress.last_practiced_at).toLocaleDateString() : 
                    'Never'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Learning Objectives */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
          </h3>
          
          {Object.entries(objectivesByLevel).map(([level, objectives]) => (
            <div key={level} className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Badge className={getMasteryBadgeColor(level)}>
                  {level} level
                </Badge>
              </h4>
              <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                {objectives.map((objective) => (
                  <div key={objective.id} className="flex gap-3 items-start py-1">
                    <div className="mt-1 text-slate-500 dark:text-slate-400">
                      {getObjectiveTypeIcon(objective.objective_type)}
                    </div>
                    <div>
                      <p className="text-sm">{objective.objective_text}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {objective.objective_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Prerequisites */}
        {skill.prerequisites.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Prerequisites
            </h3>
            <div className="space-y-2">
              {skill.prerequisites.map((prereq) => (
                <div key={prereq.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {prereq.is_strict_requirement ? 
                        <CheckCircle2 className="h-4 w-4" /> : 
                        <CircleDashed className="h-4 w-4" />}
                    </span>
                    <span>{prereq.prerequisite_skill_name}</span>
                  </div>
                  <Badge className={getMasteryBadgeColor(prereq.required_mastery_level)}>
                    {prereq.required_mastery_level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Dependent Skills */}
        {skill.dependent_skills.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <LucideArrowRight className="h-5 w-5" />
              Leads To
            </h3>
            <div className="flex flex-wrap gap-2">
              {skill.dependent_skills.map((depSkill) => (
                <Badge key={depSkill.skill_id} variant="outline" className="py-1">
                  {depSkill.skill_name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 