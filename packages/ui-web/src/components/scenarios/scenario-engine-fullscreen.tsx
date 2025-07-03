"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../utils"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from '@civicsense/shared/useGuestAccess'

// UI Components
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Alert, AlertDescription } from "../ui/alert"

// Icons
import { 
  Clock, 
  Brain, 
  Lightbulb, 
  AlertTriangle,
  ArrowRight,
  Home,
  Pause,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  X
} from "lucide-react"

// Types
import type { 
  Scenario, 
  ScenarioSituation, 
  ScenarioDecision, 
  ScenarioCharacter,
  ScenarioProgress 
} from "./types"

// Components
import { CharacterSelector } from "./character-selector"

// Global styles for fullscreen scenario experience
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.id = 'scenario-fullscreen-styles'
  style.innerHTML = `
    .fullscreen-scenario {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 999 !important;
      background: linear-gradient(135deg, rgb(248 250 252) 0%, rgb(255 255 255) 50%, rgb(248 250 252) 100%) !important;
      overflow: auto !important;
    }
    
    /* Hide header and footer when in fullscreen scenario */
    body:has(.fullscreen-scenario) > header,
    body:has(.fullscreen-scenario) > footer,
    body:has(.fullscreen-scenario) nav[aria-label="main"] {
      display: none !important;
    }
    
    /* Dark mode support */
    .dark .fullscreen-scenario {
      background: linear-gradient(135deg, rgb(15 23 42) 0%, rgb(30 41 59) 50%, rgb(15 23 42) 100%) !important;
    }
    
    /* Prevent body scroll when scenario is active */
    body:has(.fullscreen-scenario) {
      overflow: hidden !important;
    }
  `
  if (!document.getElementById('scenario-fullscreen-styles')) {
    document.head.appendChild(style)
  }
}

export interface ScenarioEngineFullscreenProps {
  scenarioId: string
  onComplete: (outcome: string, progress: ScenarioProgress) => void
  onExit?: () => void
  className?: string
}

export function ScenarioEngineFullscreen({ 
  scenarioId, 
  onComplete,
  onExit,
  className 
}: ScenarioEngineFullscreenProps) {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)

  useEffect(() => {
    const loadScenarioData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/scenarios/${scenarioId}`)
        if (!response.ok) throw new Error('Failed to load scenario')
        const data = await response.json()
        setScenario(data.scenario)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scenario')
      } finally {
        setLoading(false)
      }
    }

    loadScenarioData()
  }, [scenarioId])

  if (loading) {
    return (
      <div className="fullscreen-scenario">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">Loading Scenario</h2>
              <p className="text-slate-600 dark:text-slate-400">Preparing your civic simulation...</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fullscreen-scenario">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="space-y-4">
                <p>{error}</p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()} size="sm">
                    Try Again
                  </Button>
                  {onExit && (
                    <Button onClick={onExit} variant="outline" size="sm">
                      <Home className="h-4 w-4 mr-2" />
                      Exit
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="fullscreen-scenario">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {scenario?.scenario_title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Full-screen scenario experience coming soon!
          </p>
          {onExit && (
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit to Scenarios
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
