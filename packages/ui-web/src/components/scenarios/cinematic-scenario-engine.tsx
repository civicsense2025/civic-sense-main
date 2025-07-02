"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "../../utils"

// UI Components
import { Button } from "../ui/button"

// Icons
import { 
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react"

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ScenarioProgress {
  currentSituationIndex: number
  totalSituations: number
  resources: Record<string, number>
  decisions: Array<{
    situationIndex: number
    decisionText: string
    consequences: Record<string, number>
  }>
  startTime: number
  timeSpent: number
  characterId?: string
}

interface CinematicScenarioEngineProps {
  scenarioId: string
  userId?: string
  guestToken?: string
  onComplete: (outcome: string, progress: ScenarioProgress) => void
  onExit: () => void
}

interface Character {
  id: string
  name: string
  title: string
  emoji: string
  background: string
}

interface Resource {
  id: string
  name: string
  value: number
  maxValue: number
  icon: string
  color: string
}

interface Situation {
  id: string
  title: string
  description: string
  context?: string
  decisions: Decision[]
}

interface Decision {
  id: string
  text: string
  description: string
  consequences: Record<string, number>
  requiresResource?: { id: string; amount: number }
}

interface ApiCharacter {
  id: string
  character_name: string
  character_title: string
  character_emoji: string
  character_description: string
}

interface ApiDecision {
  id: string
  decision_text: string
  decision_description: string
  immediate_effects: Record<string, number>
  resource_costs?: Record<string, number>
}

interface ApiSituation {
  id: string
  situation_title: string
  situation_description: string
  context_information?: string
}

interface ApiResponse {
  scenario: {
    id: string
    initial_resources: Record<string, number>
  }
  characters: ApiCharacter[]
  situations: ApiSituation[]
  decisions: Record<string, ApiDecision[]>
}

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

// Mini Stats Bar Component - Clean and minimal
function MiniStatsBar({ resources, previousResources }: { 
  resources: Resource[], 
  previousResources: Record<string, number> 
}) {
  return (
    <motion.div 
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-black/30 backdrop-blur-md rounded-full px-8 py-4 border border-white/20">
        <div className="flex items-center gap-8">
          {resources.map((resource) => {
            const hasChanged = previousResources[resource.id] !== resource.value
            const isIncrease = resource.value > (previousResources[resource.id] || 0)
            const change = resource.value - (previousResources[resource.id] || 0)
            
            return (
              <motion.div 
                key={resource.id}
                className="flex items-center gap-3 min-w-[100px] relative"
                animate={hasChanged ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <span className="text-2xl">{resource.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80 font-medium">{resource.name}</span>
                    <motion.span 
                      className="text-lg font-bold text-white"
                      animate={hasChanged ? { 
                        color: isIncrease ? "#10b981" : "#ef4444",
                        scale: [1, 1.3, 1]
                      } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {resource.value}
                    </motion.span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div 
                      className={`h-full rounded-full ${resource.color}`}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(resource.value / resource.maxValue) * 100}%` 
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Pop animation for changes */}
                <AnimatePresence>
                  {hasChanged && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "absolute -top-3 -right-2 text-sm font-bold px-2 py-1 rounded-full shadow-lg",
                        isIncrease ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {change > 0 ? '+' : ''}{change}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// Character Profile Card - Compact at center bottom
function CharacterProfileCard({ character }: { character: Character }) {
  return (
    <motion.div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 max-w-sm">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{character.emoji}</div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg leading-tight">{character.name}</h3>
            <p className="text-white/70 text-sm">{character.title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Clean Decision Options - Horizontal layout, not boxy
function DecisionOptions({ 
  decisions, 
  resources,
  onDecisionSelect 
}: { 
  decisions: Decision[]
  resources: Resource[]
  onDecisionSelect: (decision: Decision) => void 
}) {
  const resourceMap = resources.reduce((acc, r) => ({ ...acc, [r.id]: r.value }), {})

  return (
    <motion.div 
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-5xl px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decisions.map((decision, index) => {
          const canAfford = !decision.requiresResource || 
                           resourceMap[decision.requiresResource.id] >= decision.requiresResource.amount
          
          return (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <button
                onClick={() => canAfford && onDecisionSelect(decision)}
                disabled={!canAfford}
                className={cn(
                  "w-full text-left p-6 rounded-xl backdrop-blur-md transition-all duration-300",
                  "border border-white/20 hover:border-white/40",
                  canAfford ? "bg-white/5 hover:bg-white/10" : "bg-white/5 opacity-50 cursor-not-allowed"
                )}
              >
                <div className="space-y-3">
                  <h4 className="text-white font-semibold text-lg leading-tight">
                    {decision.text}
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                    {decision.description}
                  </p>
                </div>
                
                {!canAfford && decision.requiresResource && (
                  <div className="mt-3 text-xs text-red-300 font-medium">
                    Requires {decision.requiresResource.amount} {
                      resources.find(r => r.id === decision.requiresResource!.id)?.name
                    }
                  </div>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CinematicScenarioEngine({
  scenarioId,
  userId,
  guestToken,
  onComplete,
  onExit
}: CinematicScenarioEngineProps) {
  const [phase, setPhase] = useState<'loading' | 'character_select' | 'playing' | 'completed'>('loading')
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [previousResources, setPreviousResources] = useState<Record<string, number>>({})
  const [situations, setSituations] = useState<Situation[]>([])
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [progress, setProgress] = useState<ScenarioProgress>({
    currentSituationIndex: 0,
    totalSituations: 0,
    resources: {},
    decisions: [],
    startTime: Date.now(),
    timeSpent: 0
  })

  // Load real scenario data
  useEffect(() => {
    const loadScenarioData = async () => {
      try {
        const response = await fetch(`/api/scenarios/${scenarioId}`)
        if (!response.ok) throw new Error('Failed to load scenario')
        
        const data = await response.json() as ApiResponse
        
        // Transform API data into component state
        const transformedCharacters = data.characters.map((char) => ({
          id: char.id,
          name: char.character_name,
          title: char.character_title,
          emoji: char.character_emoji,
          background: char.character_description
        }))
        
        const initialResources = data.scenario.initial_resources || {
          public_support: 70,
          budget: 80,
          time: 100,
          political_capital: 85
        }
        
        const transformedResources = Object.entries(initialResources).map(([id, value]) => ({
          id,
          name: id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: value,
          maxValue: 100,
          icon: getResourceIcon(id),
          color: getResourceColor(id)
        }))
        
        const transformedSituations = data.situations.map((sit) => ({
          id: sit.id,
          title: sit.situation_title,
          description: sit.situation_description,
          context: sit.context_information || undefined,
          decisions: (data.decisions[sit.id] || []).map((dec) => ({
            id: dec.id,
            text: dec.decision_text,
            description: dec.decision_description,
            consequences: dec.immediate_effects || {},
            requiresResource: dec.resource_costs ? {
              id: Object.keys(dec.resource_costs)[0],
              amount: Object.values(dec.resource_costs)[0]
            } : undefined
          }))
        })) as Situation[]
        
        setCharacters(transformedCharacters)
        setResources(transformedResources)
        setPreviousResources(transformedResources.reduce((acc, r) => ({ ...acc, [r.id]: r.value }), {} as Record<string, number>))
        setSituations(transformedSituations)
        setProgress(prev => ({ ...prev, totalSituations: transformedSituations.length }))
        setPhase('character_select')
        
      } catch (error) {
        console.error('Failed to load scenario:', error)
      }
    }
    
    loadScenarioData()
  }, [scenarioId])

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
    setProgress(prev => ({ ...prev, characterId: character.id }))
    setPhase('playing')
    
    // Load first situation and its decisions
    if (situations.length > 0) {
      const firstSituation = situations[0]
      setCurrentSituationIndex(0)
      setDecisions(firstSituation.decisions || [])
    }
  }

  const handleDecisionSelect = (decision: Decision) => {
    // Store previous values for animation
    setPreviousResources(resources.reduce((acc, r) => ({ ...acc, [r.id]: r.value }), {} as Record<string, number>))
    
    // Update resources with animation delay for visual effect
    setTimeout(() => {
      setResources(prev => prev.map(resource => {
        const change = (decision.consequences as Record<string, number>)[resource.id] || 0
        return {
          ...resource,
          value: Math.max(0, Math.min(resource.maxValue, resource.value + change))
        }
      }))
    }, 200)

    // Record decision
    setProgress(prev => ({
      ...prev,
      decisions: [...prev.decisions, {
        situationIndex: currentSituationIndex,
        decisionText: decision.text,
        consequences: decision.consequences
      }]
    }))

    // Move to next situation or complete scenario
    setTimeout(() => {
      if (currentSituationIndex + 1 >= situations.length) {
        setPhase('completed')
        onComplete('scenario_completed', progress)
      } else {
        setCurrentSituationIndex(prev => prev + 1)
        setDecisions(situations[currentSituationIndex + 1].decisions)
      }
    }, 1500) // Give time for animations
  }

  // Helper functions for resource icons and colors
  function getResourceIcon(resourceId: string): string {
    const icons = new Map([
      ["public_support", "👥"],
      ["budget", "💰"],
      ["time", "⏰"],
      ["political_capital", "🏛️"]
    ]);
    
    return icons.get(resourceId) || "📊"
  }

  function getResourceColor(resourceId: string): string {
    const colors = new Map([
      ["public_support", "bg-blue-500"],
      ["budget", "bg-green-500"],
      ["time", "bg-yellow-500"],
      ["political_capital", "bg-purple-500"]
    ]);
    
    return colors.get(resourceId) || "bg-gray-500"
  }

  // Character Selection Phase
  if (phase === 'character_select') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-3xl mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold text-white mb-6">Choose Your Character</h1>
          <p className="text-xl text-white/70 mb-12">Select who you want to play as in this scenario</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {characters.map((character, index) => (
              <motion.div
                key={character.id}
                className="p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleCharacterSelect(character)}
                  className="w-full"
                >
                  <div className="text-center space-y-4">
                    <div className="text-7xl">{character.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{character.name}</h3>
                      <p className="text-white/70 font-medium mb-4">{character.title}</p>
                      <p className="text-white/60 text-sm leading-relaxed">{character.background}</p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Main Playing Phase
  if (phase === 'playing' && selectedCharacter) {
    const currentSituation = situations[currentSituationIndex]
    
    // Show loading state if situation isn't ready
    if (!currentSituation) {
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white/70 text-xl">Loading situation...</p>
          </motion.div>
        </div>
      )
    }
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 pointer-events-none" />
        
        {/* Exit Button */}
        <motion.div
          className="fixed top-6 left-6 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={onExit}
            className="p-4 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/40 transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </motion.div>

        {/* Mini Stats Bar */}
        <MiniStatsBar resources={resources} previousResources={previousResources} />

        {/* Main Content - Clean and centered */}
        <div className="container mx-auto px-4 py-24 relative z-20">
          <motion.div
            className="max-w-4xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">{currentSituation.title}</h2>
            <p className="text-xl text-white/70 leading-relaxed">{currentSituation.description}</p>
            {currentSituation.context && (
              <div className="mt-6 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-sm">{currentSituation.context}</p>
              </div>
            )}
          </motion.div>

          {/* Character Profile */}
          <motion.div
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-black/30 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCharacter.emoji}</span>
                <div className="text-left">
                  <h3 className="text-white font-medium">{selectedCharacter.name}</h3>
                  <p className="text-white/60 text-sm">{selectedCharacter.title}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Decision Options */}
          <DecisionOptions
            decisions={decisions}
            resources={resources}
            onDecisionSelect={handleDecisionSelect}
          />
        </div>
      </div>
    )
  }

  // Loading Phase
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-white/70 text-xl">Loading scenario...</p>
      </motion.div>
    </div>
  )
} 