"use client"

import { useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { QuizGameMode } from "@/lib/types/quiz"
import { PremiumFeature } from "@/lib/premium"
import { Lock, Play, Target, Users, Clock, Zap, Bot } from "lucide-react"

interface ModeInfo {
  emoji: string
  name: string
  description: string
  isRecommended?: boolean
  isPremium?: boolean
  isNew?: boolean
  icon?: any
}

interface QuizModeSelectorProps {
  selectedMode: QuizGameMode
  onModeSelect: (mode: QuizGameMode) => void
  isPremium: boolean
  hasFeatureAccess: (feature: PremiumFeature) => boolean
  className?: string
}

export function QuizModeSelector({
  selectedMode,
  onModeSelect,
  isPremium,
  hasFeatureAccess,
  className
}: QuizModeSelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const params = useParams()

  const modeInfo: Partial<Record<QuizGameMode, ModeInfo>> = {
    standard: {
      emoji: '🎯',
      name: 'Standard Quiz',
      description: 'Classic quiz format',
      icon: Target,
      isRecommended: true
    },
    practice: {
      emoji: '📚',
      name: 'Solo Practice',
      description: 'Learn at your pace',
      icon: Zap
    },
    speed_round: {
      emoji: '⏱️',
      name: 'Timed Challenge', 
      description: 'Test your speed',
      icon: Clock
    },
    classic_quiz: {
      emoji: '🤝',
      name: 'PvP Battle',
      description: 'Challenge a friend',
      icon: Users
    },
    npc_battle: {
      emoji: '🤖',
      name: 'AI Battle',
      description: 'Face off against AI',
      icon: Bot,
      isPremium: true,
      isNew: true
    }
  }

  const handleModeSelect = useCallback((mode: QuizGameMode) => {
    const info = modeInfo[mode]
    if (!info) return
    
    // Check access for premium modes
    if (mode !== 'classic_quiz') {
      const isPremiumMode = info.isPremium
      const hasAccess = !isPremiumMode || isPremium || hasFeatureAccess('advanced_analytics')
      if (!hasAccess) return
    }
    
    // Handle different modes with appropriate navigation
    if (mode === 'npc_battle') {
      window.location.href = `/quiz/${params.topicId}/battle?difficulty=${selectedDifficulty}`
      return
    }
    
    // For other modes, use the callback
    onModeSelect(mode)
  }, [params.topicId, selectedDifficulty, onModeSelect, isPremium, hasFeatureAccess, modeInfo])

  const allModes: QuizGameMode[] = ['standard', 'practice', 'speed_round', 'classic_quiz', 'npc_battle']

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Quiz Mode Buttons - Vertically Stacked */}
      {allModes.map((mode) => {
        const info = modeInfo[mode]
        if (!info) return null

                 const isSelected = selectedMode === mode
         const isPremiumMode = info.isPremium
         // Feature flag: Only allow standard mode for now
         const hasAccess = mode === 'standard'
        const IconComponent = info.icon

        return (
          <Card
            key={mode}
            className={cn(
              "transition-all duration-200 cursor-pointer hover:shadow-md",
              isSelected 
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              !hasAccess && "opacity-60 cursor-not-allowed"
            )}
            onClick={() => hasAccess && handleModeSelect(mode)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {/* Icon/Emoji */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                    {info.emoji}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2">
                     <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                       {info.name}
                     </h3>
                     {mode !== 'standard' && (
                       <Lock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                     )}
                   </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {info.description}
                  </p>
                  
                                     {/* Badges */}
                   <div className="flex gap-1 mt-2">
                     {mode === 'standard' && (
                       <Badge variant="outline" className="text-xs py-0 px-1.5 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                         Recommended
                       </Badge>
                     )}
                     {mode !== 'standard' && (
                       <Badge variant="outline" className="text-xs py-0 px-1.5 border-slate-400 text-slate-600 bg-slate-50 dark:bg-slate-800">
                         Coming Soon
                       </Badge>
                     )}
                   </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* AI Difficulty Selector - only show when AI Battle is selected */}
      {selectedMode === 'npc_battle' && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                  AI Difficulty
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Choose your challenge level
                </p>
              </div>
              <Select 
                value={selectedDifficulty} 
                onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Quiz Button */}
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        onClick={() => handleModeSelect(selectedMode)}
        disabled={!selectedMode}
      >
        <Play className="w-4 h-4 mr-2" />
        Start Quiz
      </Button>
    </div>
  )
} 