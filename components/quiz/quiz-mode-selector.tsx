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
import { Lock, Play, ChevronLeft, ChevronRight } from "lucide-react"

interface ModeInfo {
  emoji: string
  name: string
  description: string
  isRecommended?: boolean
  isPremium?: boolean
  isNew?: boolean
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const params = useParams()

  const modeInfo: Partial<Record<QuizGameMode, ModeInfo>> = {
    standard: {
      emoji: '⚡',
      name: 'Standard',
      description: 'Classic quiz format',
      isRecommended: true
    },
    classic_quiz: {
      emoji: '🤝',
      name: 'PvP Battle',
      description: 'Challenge a friend'
    },
    npc_battle: {
      emoji: '🤖',
      name: 'AI Battle',
      description: 'Face off against AI',
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
    
    // For standard and PvP modes, use the callback
    onModeSelect(mode)
  }, [params.topicId, selectedDifficulty, onModeSelect, isPremium, hasFeatureAccess, modeInfo])

  const allModes: QuizGameMode[] = ['standard', 'classic_quiz', 'npc_battle']

  const nextMode = () => {
    setCurrentIndex((prev) => (prev + 1) % allModes.length)
  }

  const prevMode = () => {
    setCurrentIndex((prev) => (prev - 1 + allModes.length) % allModes.length)
  }

  const currentMode = allModes[currentIndex]
  const info = modeInfo[currentMode]

  if (!info) return null

  const isSelected = selectedMode === currentMode
  const isPremiumMode = info.isPremium
  const hasAccess = !isPremiumMode || isPremium || hasFeatureAccess('advanced_analytics')

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Choose Quiz Mode
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {currentIndex + 1} of {allModes.length}
        </p>
      </div>

      {/* Carousel Container - Fixed positioning to prevent shift */}
      <div className="relative px-16"> {/* Add horizontal padding for arrow space */}
        {/* Navigation Arrows - Fixed position, no hover effects that cause movement */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full shadow-md border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
          onClick={prevMode}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full shadow-md border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
          onClick={nextMode}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Card Container - Constrained width, centered */}
        <div className="flex justify-center">
          <div className="w-80 max-w-full"> {/* Fixed width with max-width constraint */}
            <Card
              className={cn(
                "transition-all duration-200 rounded-xl border-2",
                isSelected 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-slate-200 dark:border-slate-700",
                !hasAccess && "opacity-60"
              )}
            >
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  {/* Emoji and Lock */}
                  <div className="relative">
                    <div className="text-4xl mb-2">{info.emoji}</div>
                    {!hasAccess && (
                      <Lock className="h-4 w-4 text-slate-400 absolute top-0 right-0" />
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {info.name}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {info.description}
                  </p>

                  {/* Badges - Now outlined */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {info.isRecommended && (
                      <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-400">
                        Recommended
                      </Badge>
                    )}
                    {info.isNew && (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-400">
                        New
                      </Badge>
                    )}
                    {isPremiumMode && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-400">
                        Premium
                      </Badge>
                    )}
                  </div>

                  {/* Action Button - Only clickable element */}
                  {hasAccess ? (
                    <Button 
                      className={cn(
                        "w-full",
                        isSelected 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
                      )}
                      onClick={() => handleModeSelect(currentMode)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  ) : (
                    <Button 
                      disabled
                      variant="outline"
                      className="w-full"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Premium Required
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2">
        {allModes.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex 
                ? "bg-blue-600 w-6" 
                : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* AI Difficulty Selector */}
      {currentMode === 'npc_battle' && hasAccess && (
        <Card className="rounded-xl border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  AI Difficulty
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose your challenge level
                </p>
              </div>
              <Select 
                value={selectedDifficulty} 
                onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
              >
                <SelectTrigger className="w-full rounded-lg">
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
    </div>
  )
} 