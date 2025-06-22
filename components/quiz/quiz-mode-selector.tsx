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
import { ChevronLeft, ChevronRight, Lock, Zap, Play } from "lucide-react"

interface ModeInfo {
  emoji: string
  name: string
  description: string
  longDescription: string
  isRecommended?: boolean
  isPremium?: boolean
  isNew?: boolean
  estimatedTime?: string
  difficulty?: string
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

  // Enhanced mode information with rich descriptions
  const modeInfo: Partial<Record<QuizGameMode, ModeInfo>> = {
    standard: {
      emoji: '⚡',
      name: 'Standard Quiz',
      description: 'Classic civic showdown',
      longDescription: 'Test your knowledge with our signature quiz format. Perfect for learning and tracking your progress.',
      isRecommended: true,
      estimatedTime: '5-10 min',
      difficulty: 'Medium'
    },
    classic_quiz: {
      emoji: '🤝',
      name: 'PvP Battle',
      description: 'Challenge a friend',
      longDescription: 'Compete head-to-head with friends or other players. See who knows their civics better!',
      isRecommended: true,
      estimatedTime: '8-12 min',
      difficulty: 'Medium'
    },
    practice: {
      emoji: '🧘',
      name: 'Practice Mode',
      description: 'Learn at your own pace',
      longDescription: 'Take your time to learn without pressure. Perfect for studying and understanding concepts deeply.',
      estimatedTime: '10-20 min',
      difficulty: 'Easy'
    },
    npc_battle: {
      emoji: '🤖',
      name: 'AI Battle',
      description: 'Face off against AI',
      longDescription: 'Challenge our advanced AI opponent. Choose your difficulty level and test your skills.',
      isPremium: true,
      isNew: true,
      estimatedTime: '6-10 min',
      difficulty: 'Variable'
    },
    assessment: {
      emoji: '📝',
      name: 'Assessment',
      description: 'Formal test mode',
      longDescription: 'Comprehensive evaluation of your civic knowledge. Detailed analytics and progress tracking included.',
      isPremium: true,
      estimatedTime: '15-25 min',
      difficulty: 'Hard'
    },
    civics_test_quick: {
      emoji: '🎯',
      name: 'Quick Test',
      description: 'Rapid civics review',
      longDescription: 'Fast-paced quiz covering essential civic concepts. Great for quick review sessions.',
      estimatedTime: '3-5 min',
      difficulty: 'Easy'
    },
    civics_test_full: {
      emoji: '📚',
      name: 'Full Civics Exam',
      description: 'Complete civics examination',
      longDescription: 'Comprehensive civics test covering all major topics. Perfect preparation for citizenship tests.',
      isPremium: true,
      estimatedTime: '30-45 min',
      difficulty: 'Expert'
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
    
    if (mode === 'practice') {
      window.location.href = `/quiz/${params.topicId}/play?mode=practice`
      return
    }

    if (mode === 'assessment') {
      window.location.href = `/quiz/${params.topicId}?mode=assessment`
      return
    }

    if (mode === 'civics_test_quick') {
      window.location.href = `/quiz/${params.topicId}?mode=civics_test_quick`
      return
    }

    if (mode === 'civics_test_full') {
      window.location.href = `/quiz/${params.topicId}?mode=civics_test_full`
      return
    }
    
    // For standard and PvP modes, use the callback
    onModeSelect(mode)
  }, [params.topicId, selectedDifficulty, onModeSelect, isPremium, hasFeatureAccess, modeInfo])

  // All available modes for the carousel
  const allModes: QuizGameMode[] = ['standard', 'classic_quiz', 'practice', 'npc_battle', 'assessment', 'civics_test_quick', 'civics_test_full']

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Hard': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      case 'Expert': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'Variable': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Choose Your Learning Style
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-light">
          Select the quiz mode that fits your goals and preferences
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {allModes.map((mode) => {
            const info = modeInfo[mode]
            if (!info) return null
            
            const isSelected = selectedMode === mode
            const isPremiumMode = info.isPremium
            const hasAccess = !isPremiumMode || isPremium || hasFeatureAccess('advanced_analytics')
            
            return (
              <Card
                key={mode}
                className={cn(
                  "relative flex-shrink-0 w-72 h-80 cursor-pointer transition-all duration-300 snap-start",
                  "border-2 hover:shadow-xl hover:-translate-y-1",
                  isSelected 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg scale-105" 
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                  !hasAccess && "opacity-60 cursor-not-allowed hover:translate-y-0 hover:scale-100"
                )}
                onClick={() => hasAccess && handleModeSelect(mode)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header with emoji and badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{info.emoji}</div>
                    <div className="flex flex-col gap-2 items-end">
                      {!hasAccess && (
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full">
                          <Lock className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      {isSelected && hasAccess && (
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title and badges */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {info.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {info.isRecommended && (
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 font-medium">
                          Recommended
                        </Badge>
                      )}
                      {info.isNew && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1 font-medium">
                          New
                        </Badge>
                      )}
                      {isPremiumMode && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1 font-medium">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-4 flex-grow">
                    {info.longDescription}
                  </p>

                  {/* Stats */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          ⏱️ {info.estimatedTime}
                        </span>
                        {info.difficulty && (
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs font-medium", getDifficultyColor(info.difficulty))}
                          >
                            {info.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {hasAccess ? (
                      <Button 
                        className={cn(
                          "w-full transition-all duration-200",
                          isSelected 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                        )}
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isSelected ? 'Selected' : 'Select Mode'}
                      </Button>
                    ) : (
                      <Button 
                        disabled
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Premium Required
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Scroll Indicators */}
        <div className="flex justify-center mt-4 gap-2">
          {allModes.map((mode, index) => (
            <div
              key={mode}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                selectedMode === mode 
                  ? "bg-blue-600 w-6" 
                  : "bg-slate-300 dark:bg-slate-600"
              )}
            />
          ))}
        </div>
      </div>

      {/* Difficulty Selector for AI Battle */}
      {selectedMode === 'npc_battle' && (
        <Card className="border-slate-200 dark:border-slate-700 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  🤖 AI Difficulty Level
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  Choose how challenging you want your AI opponent to be
                </p>
              </div>
              <Select 
                value={selectedDifficulty} 
                onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy" className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🟢</span>
                      <div>
                        <div className="font-medium">Easy</div>
                        <div className="text-xs text-slate-500">Beginner-friendly AI</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🟡</span>
                      <div>
                        <div className="font-medium">Medium</div>
                        <div className="text-xs text-slate-500">Balanced challenge</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard" className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🔴</span>
                      <div>
                        <div className="font-medium">Hard</div>
                        <div className="text-xs text-slate-500">Expert-level AI</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 