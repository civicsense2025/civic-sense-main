'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Filter, Target, Brain, Users, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  skill_name: string
  skill_slug: string
  description: string
  category: string
  difficulty_level: number
  icon: string
  color: string
  usage_stats?: {
    total_questions: number
    total_content_items: number
    total_collections: number
    total_usage: number
  }
}

interface SkillsFilterProps {
  selectedSkills: string[]
  selectedCategories: string[]
  onSkillsChange: (skills: string[]) => void
  onCategoriesChange: (categories: string[]) => void
  className?: string
}

const SKILL_CATEGORIES = [
  { value: 'civic_knowledge', label: 'Civic Knowledge', icon: '🏛️', description: 'Understanding government structures and processes' },
  { value: 'critical_thinking', label: 'Critical Thinking', icon: '🧠', description: 'Analyzing information and evaluating sources' },
  { value: 'action_skills', label: 'Action Skills', icon: '⚡', description: 'Taking effective civic action' },
  { value: 'media_literacy', label: 'Media Literacy', icon: '📺', description: 'Navigating news and information sources' },
  { value: 'community_organizing', label: 'Community Organizing', icon: '🤝', description: 'Building coalitions and movements' }
]

const DIFFICULTY_ICONS = {
  1: '🟢',
  2: '🔵', 
  3: '🟡',
  4: '🟠',
  5: '🔴'
}

export function SkillsFilter({ 
  selectedSkills, 
  selectedCategories, 
  onSkillsChange, 
  onCategoriesChange,
  className 
}: SkillsFilterProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load skills from API
  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          include_stats: 'true',
          limit: '100'
        })
        
        const response = await fetch(`/api/skills?${params}`)
        const data = await response.json()
        
        if (data.skills) {
          setSkills(data.skills)
        }
      } catch (error) {
        console.error('Failed to load skills:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSkills()
  }, [])

  // Filter skills based on search and difficulty
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchTerm || 
      skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDifficulty = !difficultyFilter || skill.difficulty_level === difficultyFilter
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(skill.category)
    
    return matchesSearch && matchesDifficulty && matchesCategory
  })

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  const handleSkillToggle = (skillId: string) => {
    const newSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId]
    onSkillsChange(newSkills)
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    onCategoriesChange(newCategories)
  }

  const clearAllFilters = () => {
    onSkillsChange([])
    onCategoriesChange([])
    setSearchTerm('')
    setDifficultyFilter(null)
  }

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skills Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skills Filter
            </CardTitle>
            <CardDescription>
              Find collections that develop specific civic skills
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active filters summary */}
        {(selectedSkills.length > 0 || selectedCategories.length > 0) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategories.map(category => {
              const categoryInfo = SKILL_CATEGORIES.find(c => c.value === category)
              return (
                <Badge key={category} variant="secondary" className="gap-1">
                  {categoryInfo?.icon} {categoryInfo?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleCategoryToggle(category)}
                  />
                </Badge>
              )
            })}
            {selectedSkills.map(skillId => {
              const skill = skills.find(s => s.id === skillId)
              return (
                <Badge key={skillId} variant="outline" className="gap-1">
                  {skill?.skill_name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleSkillToggle(skillId)}
                  />
                </Badge>
              )
            })}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Quick category selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Skill Categories</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SKILL_CATEGORIES.map(category => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={category.value}
                  checked={selectedCategories.includes(category.value)}
                  onCheckedChange={() => handleCategoryToggle(category.value)}
                />
                <Label 
                  htmlFor={category.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Search and difficulty filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select 
                value={difficultyFilter?.toString() || ''} 
                onValueChange={(value) => setDifficultyFilter(value ? Number(value) : null)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="1">🟢 Level 1</SelectItem>
                  <SelectItem value="2">🔵 Level 2</SelectItem>
                  <SelectItem value="3">🟡 Level 3</SelectItem>
                  <SelectItem value="4">🟠 Level 4</SelectItem>
                  <SelectItem value="5">🔴 Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skills by category */}
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => {
                const categoryInfo = SKILL_CATEGORIES.find(c => c.value === category)
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {categoryInfo?.icon} {categoryInfo?.label}
                      <Badge variant="secondary" className="text-xs">
                        {categorySkills.length}
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {categorySkills.map(skill => (
                        <div key={skill.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill.id}
                            checked={selectedSkills.includes(skill.id)}
                            onCheckedChange={() => handleSkillToggle(skill.id)}
                          />
                          <Label 
                            htmlFor={skill.id}
                            className="flex items-center justify-between flex-1 text-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span>{DIFFICULTY_ICONS[skill.difficulty_level as keyof typeof DIFFICULTY_ICONS]}</span>
                              <span>{skill.skill_name}</span>
                            </div>
                            {skill.usage_stats && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {skill.usage_stats.total_collections}
                              </div>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Results summary */}
        {(selectedSkills.length > 0 || selectedCategories.length > 0) && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>
                Showing collections that develop {selectedSkills.length} specific skill{selectedSkills.length !== 1 ? 's' : ''}
                {selectedCategories.length > 0 && ` in ${selectedCategories.length} categor${selectedCategories.length !== 1 ? 'ies' : 'y'}`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 