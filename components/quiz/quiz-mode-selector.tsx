"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Lock, Play, Target, Users, Clock, Zap, Bot, LogIn } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from "@/hooks/useGuestAccess"

interface ModeInfo {
  emoji: string
  name: string
  description: string
  isRecommended?: boolean
  isPremium?: boolean
  isNew?: boolean
  icon?: any
  urlMode?: string // URL parameter for this mode
}

interface QuizModeSelectorProps {
  selectedMode: QuizGameMode
  onModeSelect: (mode: QuizGameMode) => void
  isPremium: boolean
  hasFeatureAccess: (feature: PremiumFeature) => boolean
  className?: string
  onLoginClick?: () => void // Callback to open login dialog
}

export function QuizModeSelector({
  selectedMode,
  onModeSelect,
  isPremium,
  hasFeatureAccess,
  className,
  onLoginClick
}: QuizModeSelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { 
    hasReachedDailyLimit, 
    getRemainingAttempts,
    isInitialized
  } = useGuestAccess()

  const modeInfo: Partial<Record<QuizGameMode, ModeInfo>> = {
    standard: {
      emoji: '🎯',
      name: 'Standard Quiz',
      description: 'Classic quiz format',
      icon: Target,
      isRecommended: true,
      urlMode: 'standard'
    },
    practice: {
      emoji: '📚',
      name: 'Solo Practice',
      description: 'Learn at your pace',
      icon: Zap,
      urlMode: 'practice'
    },
    speed_round: {
      emoji: '⏱️',
      name: 'Timed Challenge', 
      description: 'Test your speed',
      icon: Clock,
      urlMode: 'speed_round'
    },
    classic_quiz: {
      emoji: '🤝',
      name: 'PvP Battle',
      description: 'Challenge a friend',
      icon: Users,
      urlMode: 'classic_quiz'
    },
    npc_battle: {
      emoji: '🤖',
      name: 'AI Battle',
      description: 'Face off against AI',
      icon: Bot,
      isPremium: true,
      isNew: true,
      urlMode: 'npc_battle'
    }
  }

  // Check if user has access to a specific mode
  const checkModeAccess = useCallback((mode: QuizGameMode) => {
    const info = modeInfo[mode]
    if (!info) return { hasAccess: false, reason: 'unknown' }

    // Enable standard, practice, and speed_round modes
    if (!['standard', 'practice', 'speed_round'].includes(mode)) {
      return { hasAccess: false, reason: 'coming_soon' }
    }

    // Check guest limits for unauthenticated users
    if (!user && isInitialized) {
      const remaining = getRemainingAttempts()
      if (remaining <= 0) {
        return { hasAccess: false, reason: 'guest_limit_reached' }
      }
    }

    // Check premium requirements
    if (info.isPremium && !isPremium && !hasFeatureAccess('advanced_analytics')) {
      return { hasAccess: false, reason: 'premium_required' }
    }

    return { hasAccess: true, reason: 'allowed' }
  }, [user, isInitialized, getRemainingAttempts, isPremium, hasFeatureAccess])

  const handleModeSelect = useCallback((mode: QuizGameMode) => {
    const info = modeInfo[mode]
    if (!info) return
    
    const accessCheck = checkModeAccess(mode)
    
    if (!accessCheck.hasAccess) {
      if (accessCheck.reason === 'guest_limit_reached' && onLoginClick) {
        onLoginClick()
        return
      }
      // For other reasons (coming_soon, premium_required), do nothing
      return
    }
    
    // Handle different modes with appropriate navigation
    if (mode === 'npc_battle') {
      router.push(`/quiz/${params.topicId}/battle?difficulty=${selectedDifficulty}`)
      return
    }
    
    // For other modes, navigate with the correct mode parameter
    const urlMode = info.urlMode || 'standard'
    router.push(`/quiz/${params.topicId}/play?mode=${urlMode}`)
    
    // Also call the callback for internal state management
    onModeSelect(mode)
  }, [params.topicId, selectedDifficulty, router, onModeSelect, checkModeAccess, onLoginClick])

  const allModes: QuizGameMode[] = ['standard', 'practice', 'speed_round', 'classic_quiz', 'npc_battle']

  // Show guest limit warning if applicable
  const showGuestLimitWarning = !user && isInitialized && getRemainingAttempts() <= 0

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Guest Limit Warning */}
      {showGuestLimitWarning && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <LogIn className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Daily Quiz Limit Reached
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Sign in to continue taking quizzes and track your progress
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onLoginClick}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Mode Buttons - Vertically Stacked */}
      {allModes.map((mode) => {
        const info = modeInfo[mode]
        if (!info) return null

        const isSelected = selectedMode === mode
        const accessCheck = checkModeAccess(mode)
        const IconComponent = info.icon

        // Determine badge text and styling
        let badgeText = ''
        let badgeVariant: 'outline' | 'default' | 'destructive' = 'outline'
        let badgeClassName = ''

        if (mode === 'standard' && accessCheck.hasAccess) {
          badgeText = 'Recommended'
          badgeClassName = 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20'
        } else if (accessCheck.reason === 'coming_soon') {
          badgeText = 'Coming Soon'
          badgeClassName = 'border-slate-400 text-slate-600 bg-slate-50 dark:bg-slate-800'
        } else if (accessCheck.reason === 'premium_required') {
          badgeText = 'Premium'
          badgeClassName = 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20'
        } else if (accessCheck.reason === 'guest_limit_reached') {
          badgeText = 'Sign In Required'
          badgeClassName = 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
        }

        return (
          <Card
            key={mode}
            className={cn(
              "transition-all duration-200 cursor-pointer hover:shadow-md",
              isSelected 
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              !accessCheck.hasAccess && "opacity-60 cursor-not-allowed"
            )}
            onClick={() => accessCheck.hasAccess && handleModeSelect(mode)}
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
                    {!accessCheck.hasAccess && (
                      <Lock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {info.description}
                  </p>
                  
                  {/* Badges */}
                  {badgeText && (
                    <div className="flex gap-1 mt-2">
                      <Badge variant="outline" className={cn("text-xs py-0 px-1.5", badgeClassName)}>
                        {badgeText}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && accessCheck.hasAccess && (
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
      {selectedMode === 'npc_battle' && checkModeAccess('npc_battle').hasAccess && (
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
        disabled={!selectedMode || !checkModeAccess(selectedMode).hasAccess}
      >
        <Play className="w-4 h-4 mr-2" />
        {!user && isInitialized && getRemainingAttempts() <= 0 
          ? 'Sign In to Continue' 
          : 'Start Quiz'
        }
      </Button>
      
      {/* Show remaining attempts for guests */}
      {!user && isInitialized && getRemainingAttempts() > 0 && (
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          {getRemainingAttempts()} quiz{getRemainingAttempts() === 1 ? '' : 'es'} remaining today
        </p>
      )}
    </div>
  )
} 