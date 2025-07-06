"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { areScenariosEnabled } from '@/lib/comprehensive-feature-flags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Clock, 
  Target, 
  Search, 
  Filter,
  Play,
  Lock,
  Crown,
  Lightbulb,
  Gavel,
  Building,
  AlertTriangle,
  BookOpen,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Scenario {
  id: string
  scenario_title: string
  scenario_slug: string
  description: string
  scenario_type: string
  difficulty_level: number
  estimated_duration_minutes: number
  learning_objectives: string[]
  key_concepts: string[]
  is_active: boolean
  is_premium: boolean
  character_count?: number
  situation_count?: number
  outcome_count?: number
}

interface ScenarioFilters {
  search: string
  type: string
  difficulty: string
  duration: string
  premium: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getScenarioTypeIcon = (type: string) => {
  switch (type) {
    case 'local_government': return Building
    case 'crisis_response': return AlertTriangle
    case 'negotiation': return Gavel
    case 'judicial_process': return Gavel
    case 'legislative_process': return BookOpen
    default: return Users
  }
}

const getScenarioTypeColor = (type: string) => {
  switch (type) {
    case 'local_government': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
    case 'crisis_response': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
    case 'negotiation': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
    case 'judicial_process': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
    case 'legislative_process': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
  }
}

const getDifficultyColor = (level: number) => {
  if (level <= 2) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
  if (level <= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
  if (level <= 4) return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
}

const getDifficultyLabel = (level: number) => {
  if (level <= 2) return 'Beginner'
  if (level <= 3) return 'Intermediate'
  if (level <= 4) return 'Advanced'
  return 'Expert'
}

const formatScenarioType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// =============================================================================
// LOADING SKELETONS
// =============================================================================

function ScenarioCardSkeleton() {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function ScenariosLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <ScenarioCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SCENARIO CARD COMPONENT
// =============================================================================

interface ScenarioCardProps {
  scenario: Scenario
  isPremium: boolean
  onPlay: (scenarioId: string) => void
}

function ScenarioCard({ scenario, isPremium, onPlay }: ScenarioCardProps) {
  const canPlay = !scenario.is_premium || isPremium
  const TypeIcon = getScenarioTypeIcon(scenario.scenario_type)
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {scenario.scenario_title}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className={cn('text-xs', getScenarioTypeColor(scenario.scenario_type))}>
                {formatScenarioType(scenario.scenario_type)}
              </Badge>
              <Badge className={cn('text-xs', getDifficultyColor(scenario.difficulty_level))}>
                {getDifficultyLabel(scenario.difficulty_level)}
              </Badge>
              {scenario.is_premium && (
                <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          <TypeIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {scenario.description}
        </p>
        
        {scenario.learning_objectives && scenario.learning_objectives.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Target className="h-4 w-4" />
              Learning Objectives
            </div>
            <div className="flex flex-wrap gap-1">
              {scenario.learning_objectives.slice(0, 2).map((objective, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {objective.length > 30 ? `${objective.slice(0, 30)}...` : objective}
                </Badge>
              ))}
              {scenario.learning_objectives.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{scenario.learning_objectives.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {scenario.estimated_duration_minutes}m
            </div>
            {scenario.character_count && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {scenario.character_count}
              </div>
            )}
          </div>
          
          {canPlay ? (
            <Button 
              size="sm" 
              onClick={() => onPlay(scenario.id)}
              className="group-hover:shadow-md transition-all"
            >
              <Play className="h-4 w-4 mr-1" />
              Play
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <Lock className="h-4 w-4 mr-1" />
              Premium
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ScenariosClient() {
  const { user } = useAuth()
  const { isPremium } = usePremium()
  
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ScenarioFilters>({
    search: '',
    type: 'all',
    difficulty: 'all',
    duration: 'all',
    premium: 'all'
  })

  // Feature flag check
  const scenariosEnabled = areScenariosEnabled()

  useEffect(() => {
    if (scenariosEnabled) {
      loadScenarios()
    }
  }, [scenariosEnabled])

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scenarios')
      
      if (!response.ok) {
        throw new Error('Failed to load scenarios')
      }
      
      const data = await response.json()
      setScenarios(data.scenarios || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (scenario) {
      window.location.href = `/scenarios/${scenario.scenario_slug || scenario.id}`
    }
  }

  const filteredScenarios = scenarios.filter(scenario => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = scenario.scenario_title.toLowerCase().includes(searchLower)
      const matchesDescription = scenario.description.toLowerCase().includes(searchLower)
      const matchesConcepts = scenario.key_concepts?.some(concept => 
        concept.toLowerCase().includes(searchLower)
      )
      const matchesObjectives = scenario.learning_objectives?.some(objective => 
        objective.toLowerCase().includes(searchLower)
      )
      
      if (!matchesTitle && !matchesDescription && !matchesConcepts && !matchesObjectives) {
        return false
      }
    }
    
    if (filters.type !== 'all' && scenario.scenario_type !== filters.type) {
      return false
    }
    
    if (filters.difficulty !== 'all') {
      const difficultyRange = filters.difficulty === 'beginner' ? [1, 2] :
                             filters.difficulty === 'intermediate' ? [3, 3] :
                             filters.difficulty === 'advanced' ? [4, 4] : [5, 5]
      if (scenario.difficulty_level < difficultyRange[0] || scenario.difficulty_level > difficultyRange[1]) {
        return false
      }
    }
    
    if (filters.duration !== 'all') {
      const durationRange = filters.duration === 'short' ? [0, 20] :
                            filters.duration === 'medium' ? [21, 40] : [41, 999]
      if (scenario.estimated_duration_minutes < durationRange[0] || 
          scenario.estimated_duration_minutes > durationRange[1]) {
        return false
      }
    }
    
    if (filters.premium !== 'all') {
      if (filters.premium === 'free' && scenario.is_premium) return false
      if (filters.premium === 'premium' && !scenario.is_premium) return false
    }
    
    return true
  })

  // Feature flag disabled state
  if (!scenariosEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Scenarios Coming Soon</h1>
          <p className="text-muted-foreground">
            Interactive civic scenarios are currently in development. Check back soon for immersive political simulations!
          </p>
          <Button asChild>
            <Link href="/">
              Back to Quizzes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <ScenariosLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Error Loading Scenarios</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadScenarios}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Civic Scenarios
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience democracy in action through interactive scenarios. Make decisions as mayors, senators, activists, and other civic leaders to understand how government really works.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>{scenarios.length} scenarios available</span>
            {isPremium && (
              <>
                <span>•</span>
                <Crown className="h-4 w-4" />
                <span>Premium Access</span>
              </>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9"
            />
          </div>
          
          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="local_government">Local Government</SelectItem>
              <SelectItem value="crisis_response">Crisis Response</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="judicial_process">Judicial Process</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.difficulty} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.duration} onValueChange={(value) => setFilters(prev => ({ ...prev, duration: value }))}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Length</SelectItem>
              <SelectItem value="short">Under 20m</SelectItem>
              <SelectItem value="medium">20-40m</SelectItem>
              <SelectItem value="long">40m+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Results */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to see more scenarios.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: '', type: 'all', difficulty: 'all', duration: 'all', premium: 'all' })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isPremium={isPremium}
                onPlay={handlePlayScenario}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 