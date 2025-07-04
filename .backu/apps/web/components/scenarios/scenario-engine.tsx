"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Card, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Users, 
  Clock, 
  Target, 
  Brain,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'

// Import atomic components
import { SituationDisplay } from "./situation-display"
import { DecisionPanel } from "./decision-panel"
import { CharacterSelector } from "./character-selector"
import { ResourceTracker } from "./resource-tracker"
import { OutcomeDisplay } from "./outcome-display"

// Import types
import type { 
  Scenario, 
  ScenarioSituation, 
  ScenarioDecision, 
  ScenarioCharacter,
  ScenarioProgress,
  ScenarioGameState 
} from "./types"

// =============================================================================
// SCENARIO ENGINE INTERFACES
// =============================================================================

export interface ScenarioEngineProps {
  scenarioId: string
  userId?: string
  guestToken?: string
  onComplete: (outcome: string, progress: ScenarioProgress) => void
  className?: string
}

interface GameConfig {
  enableHints: boolean
  showProgressBar: boolean
  enableSave: boolean
  timeLimit?: number
  multiplayer: boolean
}

// =============================================================================
// MAIN SCENARIO ENGINE COMPONENT
// =============================================================================

export function ScenarioEngine({ 
  scenarioId, 
  userId, 
  guestToken, 
  onComplete,
  className 
}: ScenarioEngineProps) {
  const { user } = useAuth()
  
  // Core game state
  const [gameState, setGameState] = useState<ScenarioGameState>({
    phase: 'loading',
    currentSituationIndex: 0,
    selectedCharacter: null,
    resources: {},
    decisionsHistory: [],
    timeSpent: 0,
    startTime: null
  })
  
  // Scenario data
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [situations, setSituations] = useState<ScenarioSituation[]>([])
  const [characters, setCharacters] = useState<ScenarioCharacter[]>([])
  const [currentSituation, setCurrentSituation] = useState<ScenarioSituation | null>(null)
  const [availableDecisions, setAvailableDecisions] = useState<ScenarioDecision[]>([])
  const [decisionsBySituation, setDecisionsBySituation] = useState<Record<string, ScenarioDecision[]>>({})
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [config] = useState<GameConfig>({
    enableHints: true,
    showProgressBar: true,
    enableSave: true,
    multiplayer: false
  })
  
  // Progress tracking
  const progressManager = useRef<any>(null)
  const gameTimer = useRef<NodeJS.Timeout | null>(null)

  // Initialize progress manager on client side only
  useEffect(() => {
    if (!progressManager.current) {
      progressManager.current = createScenarioProgress(userId, guestToken, scenarioId)
    }
  }, [userId, guestToken, scenarioId])

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadScenarioData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load scenario with all related data
      const response = await fetch(`/api/scenarios/${scenarioId}`)
      if (!response.ok) {
        throw new Error('Failed to load scenario')
      }

      const data = await response.json()
      
      setScenario(data.scenario)
      setSituations(data.situations || [])
      setCharacters(data.characters || [])
      setDecisionsBySituation(data.decisions || {})
      
      // Load saved progress if exists (only if progress manager is initialized)
      if (progressManager.current) {
        const savedProgress = progressManager.current.load()
        if (savedProgress) {
          setGameState(prev => ({
            ...prev,
            phase: 'character_selection',
            selectedCharacter: savedProgress.selectedCharacter || null,
            resources: savedProgress.currentResources || {},
            decisionsHistory: savedProgress.decisionsHistory || [],
            currentSituationIndex: savedProgress.currentSituationIndex || 0
          }))
        } else {
          setGameState(prev => ({ ...prev, phase: 'character_selection' }))
        }
      } else {
        setGameState(prev => ({ ...prev, phase: 'character_selection' }))
      }

    } catch (err) {
      console.error('Failed to load scenario:', err)
      setError(err instanceof Error ? err.message : 'Failed to load scenario')
    } finally {
      setLoading(false)
    }
  }, [scenarioId])

  useEffect(() => {
    loadScenarioData()
  }, [loadScenarioData])

  // =============================================================================
  // GAME FLOW MANAGEMENT
  // =============================================================================

  const handleCharacterSelect = useCallback((character: ScenarioCharacter) => {
    setGameState(prev => ({
      ...prev,
      selectedCharacter: character,
      resources: character.starting_resources || {},
      phase: 'playing',
      startTime: Date.now()
    }))

    // Start the first situation
    if (situations.length > 0) {
      setCurrentSituation(situations[0])
      setAvailableDecisions(decisionsBySituation[situations[0].id] || [])
    }

    // Start timer
    gameTimer.current = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeSpent: prev.startTime ? Date.now() - prev.startTime : 0
      }))
    }, 1000)

    // Save progress (only if progress manager is initialized)
    if (progressManager.current) {
      progressManager.current.save({
        scenarioId,
        selectedCharacter: character,
        currentSituationIndex: 0,
        currentResources: character.starting_resources || {},
        decisionsHistory: [],
        startedAt: new Date().toISOString()
      })
    }
  }, [scenarioId, situations])

  const loadDecisionsForSituation = useCallback((situationId: string) => {
    setAvailableDecisions(decisionsBySituation[situationId] || [])
  }, [decisionsBySituation])

  const handleDecisionSelect = useCallback(async (decision: ScenarioDecision) => {
    if (!currentSituation || !gameState.selectedCharacter) return

    try {
      // Process decision effects
      const newResources = { ...gameState.resources }
      
      // Apply resource costs
      if (decision.resource_costs) {
        Object.entries(decision.resource_costs).forEach(([resource, cost]) => {
          newResources[resource] = (newResources[resource] || 0) - (cost as number)
        })
      }

      // Apply immediate effects
      if (decision.immediate_effects) {
        Object.entries(decision.immediate_effects).forEach(([resource, effect]) => {
          newResources[resource] = (newResources[resource] || 0) + (effect as number)
        })
      }

      // Record decision
      const decisionRecord = {
        situationId: currentSituation.id,
        decisionId: decision.id,
        timestamp: Date.now(),
        resourceStateBefore: gameState.resources,
        resourceStateAfter: newResources
      }

      // Update game state
      const newDecisionsHistory = [...gameState.decisionsHistory, decisionRecord]
      
      setGameState(prev => ({
        ...prev,
        resources: newResources,
        decisionsHistory: newDecisionsHistory
      }))

      // Submit to backend
      await fetch('/api/scenarios/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          situationId: currentSituation.id,
          decisionId: decision.id,
          userId,
          guestToken,
          resourceStateBefore: gameState.resources,
          resourceStateAfter: newResources
        })
      })

      // Move to next situation or complete
      if (decision.leads_to_situation_id) {
        const nextSituation = situations.find(s => s.id === decision.leads_to_situation_id)
        if (nextSituation) {
          setCurrentSituation(nextSituation)
          loadDecisionsForSituation(nextSituation.id)
          
          const nextIndex = situations.findIndex(s => s.id === nextSituation.id)
          setGameState(prev => ({
            ...prev,
            currentSituationIndex: nextIndex
          }))
        }
      } else {
        // Scenario completed
        handleScenarioComplete('decision_path_complete', newDecisionsHistory, newResources)
      }

      // Save progress (only if progress manager is initialized)
      if (progressManager.current) {
        progressManager.current.save({
          scenarioId,
          selectedCharacter: gameState.selectedCharacter,
          currentSituationIndex: gameState.currentSituationIndex,
          currentResources: newResources,
          decisionsHistory: newDecisionsHistory,
          startedAt: gameState.startTime ? new Date(gameState.startTime).toISOString() : new Date().toISOString()
        })
      }

    } catch (err) {
      console.error('Failed to process decision:', err)
      setError('Failed to process decision')
    }
  }, [currentSituation, gameState, scenarioId, userId, guestToken, situations])

  const handleScenarioComplete = useCallback((outcome: string, decisions: any[], resources: any) => {
    // Stop timer
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
    }

    // Calculate final progress
    const finalProgress: ScenarioProgress = {
      scenarioId,
      selectedCharacter: gameState.selectedCharacter!,
      currentSituationIndex: gameState.currentSituationIndex,
      currentResources: resources,
      decisionsHistory: decisions,
      completedAt: new Date().toISOString(),
      finalOutcome: outcome,
      totalTimeSpent: gameState.timeSpent,
      learningObjectivesMet: scenario?.learning_objectives || [],
      conceptsDemonstrated: extractDemonstratedConcepts(decisions)
    }

    // Clear saved progress (only if progress manager is initialized)
    if (progressManager.current) {
      progressManager.current.clear()
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      phase: 'completed'
    }))

    // Call completion handler
    onComplete(outcome, finalProgress)
  }, [scenarioId, gameState, scenario, onComplete])

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const extractDemonstratedConcepts = (decisions: any[]): string[] => {
    const concepts = new Set<string>()
    
    decisions.forEach(decision => {
      const decisionData = availableDecisions.find(d => d.id === decision.decisionId)
      if (decisionData?.teaches_concepts) {
        decisionData.teaches_concepts.forEach(concept => concepts.add(concept))
      }
    })
    
    return Array.from(concepts)
  }

  const calculateProgress = useMemo(() => {
    if (!situations.length) return 0
    return Math.round((gameState.currentSituationIndex / situations.length) * 100)
  }, [gameState.currentSituationIndex, situations.length])

  const formatTimeSpent = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // =============================================================================
  // RENDER PHASES
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading scenario...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (gameState.phase === 'character_selection') {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden", className)}>
        {/* Immersive background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-1 h-1 bg-primary/30 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/3 right-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-10 w-1.5 h-1.5 bg-primary/25 rounded-full animate-pulse delay-1500"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary/20 rounded-full animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="relative inline-block mb-6">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-4">
                  {scenario?.scenario_title}
                </h1>
                <div className="absolute -top-2 -right-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                {scenario?.description}
              </p>
              
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-8">
                <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">{scenario?.estimated_duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">Level {scenario?.difficulty_level}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">{scenario?.scenario_type?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <CharacterSelector
              characters={characters}
              onCharacterSelect={handleCharacterSelect}
              scenario={scenario}
            />
          </div>
        </div>
      </div>
    )
  }

  if (gameState.phase === 'playing' && currentSituation) {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", className)}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {scenario?.scenario_title}
              </h1>
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {gameState.selectedCharacter?.character_name}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTimeSpent(gameState.timeSpent)}
              </div>
              {config.showProgressBar && (
                <div className="flex items-center gap-2">
                  <span>Progress:</span>
                  <div className="w-24">
                    <Progress value={calculateProgress} className="h-2" />
                  </div>
                  <span>{calculateProgress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Resource Tracker */}
          <ResourceTracker 
            resources={gameState.resources}
            character={gameState.selectedCharacter}
            className="mb-6"
          />

          {/* Main Game Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SituationDisplay 
                situation={currentSituation}
                scenario={scenario}
                gameState={gameState}
              />
            </div>
            
            <div className="space-y-6">
              <DecisionPanel
                decisions={availableDecisions}
                onDecisionSelect={handleDecisionSelect}
                character={gameState.selectedCharacter}
                resources={gameState.resources}
                showHint={showHint}
                onShowHint={() => setShowHint(!showHint)}
                enableHints={config.enableHints}
              />
              
              {config.enableHints && showHint && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm mb-1">Hint</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Consider how each decision might affect your resources and relationships. 
                          Think about the long-term consequences, not just immediate effects.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState.phase === 'completed') {
    return (
      <OutcomeDisplay
        scenario={scenario}
        gameState={gameState}
        onRestart={() => window.location.reload()}
        onContinue={() => onComplete('completed', {
          scenarioId,
          selectedCharacter: gameState.selectedCharacter!,
          currentSituationIndex: gameState.currentSituationIndex,
          currentResources: gameState.resources,
          decisionsHistory: gameState.decisionsHistory,
          completedAt: new Date().toISOString(),
          totalTimeSpent: gameState.timeSpent
        })}
      />
    )
  }

  return null
}

// =============================================================================
// PROGRESS STORAGE UTILITY
// =============================================================================

function createScenarioProgress(userId?: string, guestToken?: string, scenarioId?: string) {
  const storageKey = `scenario_progress_${scenarioId}_${userId || guestToken}`
  
  return {
    save: (progress: Partial<ScenarioProgress>) => {
      if (typeof window === 'undefined') return // Skip on server-side
      
      if (userId) {
        // TODO: Save to database
        console.log('Saving progress to database:', progress)
      } else {
        // Save to localStorage for guests
        try {
          localStorage.setItem(storageKey, JSON.stringify(progress))
        } catch (error) {
          console.warn('Failed to save progress to localStorage:', error)
        }
      }
    },
    
    load: (): Partial<ScenarioProgress> | null => {
      if (typeof window === 'undefined') return null // Skip on server-side
      
      if (userId) {
        // TODO: Load from database
        return null
      } else {
        // Load from localStorage
        try {
          const saved = localStorage.getItem(storageKey)
          return saved ? JSON.parse(saved) : null
        } catch (error) {
          console.warn('Failed to load progress from localStorage:', error)
          return null
        }
      }
    },
    
    clear: () => {
      if (typeof window === 'undefined') return // Skip on server-side
      
      if (userId) {
        // TODO: Clear from database
        console.log('Clearing progress from database')
      } else {
        try {
          localStorage.removeItem(storageKey)
        } catch (error) {
          console.warn('Failed to clear progress from localStorage:', error)
        }
      }
    }
  }
} 