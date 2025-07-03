"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@civicsense/ui-web'
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { CinematicScenarioEngine } from "@/components/scenarios/cinematic-scenario-engine"
import { Card, CardContent, CardHeader } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { 
  Play, 
  Clock, 
  Target, 
  Users,
  Trophy,
  ArrowLeft,
  History,
  Sparkles,
  Zap
} from "lucide-react"
import { cn } from '@civicsense/ui-web'
import type { ScenarioProgress } from "@/components/scenarios/types"

// =============================================================================
// INTERFACES
// =============================================================================

interface ScenarioAttempt {
  id: string
  attempt_number: number
  started_at: string
  completed_at?: string
  final_outcome?: string
  total_time_spent_seconds?: number
  difficulty_rating?: number
}

interface ScenarioClientProps {
  scenarioId: string
  user: any
  previousAttempts: ScenarioAttempt[]
}

// =============================================================================
// PREVIOUS ATTEMPTS COMPONENT
// =============================================================================

interface PreviousAttemptsProps {
  attempts: ScenarioAttempt[]
}

function PreviousAttempts({ attempts }: PreviousAttemptsProps) {
  if (attempts.length === 0) return null

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-5 w-5" />
          Previous Attempts
        </h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <div 
              key={attempt.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                  <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Attempt #{attempt.attempt_number}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(attempt.started_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {attempt.completed_at ? (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(attempt.total_time_spent_seconds)}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      Completed
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// SCENARIO LANDING COMPONENT
// =============================================================================

interface ScenarioLandingProps {
  scenario: any
  onStartScenario: () => void
  previousAttempts: ScenarioAttempt[]
}

function ScenarioLanding({ scenario, onStartScenario, previousAttempts }: ScenarioLandingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showStartButton, setShowStartButton] = useState(false)

  useEffect(() => {
    // Trigger entrance animations
    const timer1 = setTimeout(() => setIsVisible(true), 100)
    const timer2 = setTimeout(() => setShowStartButton(true), 800)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/30 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/20 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className={cn(
            "text-center transform transition-all duration-1000 ease-out",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}>
            <div className="relative inline-block mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-4">
                {scenario.scenario_title}
              </h1>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            
            <p className={cn(
              "text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out delay-200",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              {scenario.description}
            </p>
            
            <div className={cn(
              "flex items-center justify-center gap-6 text-sm text-slate-500 mb-10 transform transition-all duration-1000 ease-out delay-400",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{scenario.estimated_duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Level {scenario.difficulty_level}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200/50 dark:border-slate-700/50">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{scenario.scenario_type?.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div className={cn(
              "transform transition-all duration-700 ease-out delay-600",
              showStartButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
            )}>
              <Button 
                onClick={onStartScenario}
                size="lg"
                className="group relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                <Zap className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                Enter Scenario
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/80 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
              </Button>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 animate-pulse">
                Prepare for an immersive civic experience
              </p>
            </div>
          </div>

          {/* Learning Objectives */}
          {scenario.learning_objectives && scenario.learning_objectives.length > 0 && (
            <div className={cn(
              "transform transition-all duration-1000 ease-out delay-800",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            )}>
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    Learning Objectives
                  </h3>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {scenario.learning_objectives.map((objective: string, index: number) => (
                      <li 
                        key={index} 
                        className={cn(
                          "flex items-start gap-3 transform transition-all duration-500 ease-out",
                          isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                        )}
                        style={{ transitionDelay: `${1000 + index * 100}ms` }}
                      >
                        <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-2 mt-0.5 border border-primary/20">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {objective}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Previous Attempts */}
          <div className={cn(
            "transform transition-all duration-1000 ease-out delay-1000",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}>
            <PreviousAttempts attempts={previousAttempts} />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN SCENARIO CLIENT COMPONENT
// =============================================================================

export function ScenarioClient({ 
  scenarioId, 
  user, 
  previousAttempts 
}: ScenarioClientProps) {
  const router = useRouter()
  const { getOrCreateGuestToken } = useGuestAccess()
  const [gameState, setGameState] = useState<'landing' | 'playing' | 'completed'>('landing')
  const [scenario, setScenario] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Load scenario data on mount
  useEffect(() => {
    const loadScenarioData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/scenarios/${scenarioId}`)
        if (!response.ok) {
          throw new Error('Failed to load scenario')
        }
        
        const data = await response.json()
        setScenario(data.scenario)
      } catch (error) {
        console.error('Failed to load scenario data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadScenarioData()
  }, [scenarioId])

  const handleStartScenario = () => {
    if (scenario) {
      setGameState('playing')
    }
  }

  const handleScenarioComplete = (outcome: string, progress: ScenarioProgress) => {
    console.log('Scenario completed:', { outcome, progress })
    setGameState('completed')
    
    // Could redirect to results page or show completion modal
    // For now, redirect back to scenarios list
    setTimeout(() => {
      router.push('/scenarios')
    }, 3000)
  }

  const handleBackToLanding = () => {
    setGameState('landing')
  }

  // Show landing page initially
  if (gameState === 'landing') {
    return (
      <div>
        {/* Back Navigation */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/scenarios')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Scenarios
            </Button>
          </div>
        </div>
        
        {loading || !scenario ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading scenario...</p>
            </div>
          </div>
        ) : (
          <ScenarioLanding
            scenario={scenario}
            onStartScenario={handleStartScenario}
            previousAttempts={previousAttempts}
          />
        )}
      </div>
    )
  }

  // Show scenario engine during gameplay
  if (gameState === 'playing') {
    return (
      <CinematicScenarioEngine
        scenarioId={scenarioId}
        userId={user?.id}
        guestToken={user ? undefined : getOrCreateGuestToken()}
        onComplete={handleScenarioComplete}
        onExit={handleBackToLanding}
      />
    )
  }

  // Show completion state
  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Scenario Complete!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Redirecting you back to scenarios...
          </p>
        </div>
      </div>
    )
  }

  return null
} 