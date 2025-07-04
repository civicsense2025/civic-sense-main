"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { QuizGameMode } from '@/lib/quiz/quiz-data'
import { PremiumFeature } from '@/lib/premium/premium-service'
import { Play, Target, Users, Zap, LogIn } from "lucide-react"
import { useAuth } from "@/components/ui"
import { useGuestAccess } from '@/lib/hooks/use-guest-access'

interface ModeInfo {
  emoji: string
  name: string
  description: string
  isRecommended?: boolean
  isPremium?: boolean
  comingSoon?: boolean
  icon?: any
  urlMode?: string
}

interface QuizModeSelectorProps {
  selectedMode: QuizGameMode
  onModeSelect: (mode: QuizGameMode) => void
  isPremium: boolean
  hasFeatureAccess: (feature: PremiumFeature) => boolean
  className?: string
  onLoginClick?: () => void
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
      emoji: '📝',
      name: 'Standard',
      description: 'Classic format',
      icon: Target,
      isRecommended: true,
      urlMode: 'standard'
    },
    classic_quiz: {
      emoji: '🎮',
      name: 'Multiplayer',
      description: 'PvP battles',
      icon: Users,
      isPremium: true,
      comingSoon: true,
      urlMode: 'multiplayer'
    },
    npc_battle: {
      emoji: '🤖',
      name: 'AI Battle',
      description: 'AI opponents',
      icon: Zap,
      isPremium: true,
      comingSoon: true,
      urlMode: 'battle'
    }
  }

  // Show all modes including coming soon ones
  const availableModes: QuizGameMode[] = ['standard', 'classic_quiz', 'npc_battle']

  // Check if user has access to a specific mode
  const checkModeAccess = useCallback((mode: QuizGameMode) => {
    const info = modeInfo[mode]
    if (!info) return { hasAccess: false, reason: 'unknown' }

    // Coming soon modes are not accessible
    if (info.comingSoon) {
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
      if (accessCheck.reason === 'coming_soon') {
        // Don't navigate for coming soon modes
        return
      }
      return
    }
    
    // Navigate with the correct mode parameter
    const urlMode = info.urlMode || 'standard'
    router.push(`/quiz/${params.topicId}/play?mode=${urlMode}`)
    
    // Also call the callback for internal state management
    onModeSelect(mode)
  }, [params.topicId, router, onModeSelect, checkModeAccess, onLoginClick])

  // Show guest limit warning if applicable
  const showGuestLimitWarning = !user && isInitialized && getRemainingAttempts() <= 0

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Guest Limit Warning - Compact */}
      {showGuestLimitWarning && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <LogIn className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                Daily Quiz Limit Reached
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                Sign in to continue learning and track your progress.
              </p>
            </div>
            <Button 
              onClick={onLoginClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 text-xs px-3 py-1 h-7"
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-900 dark:text-white">
          Learn this topic
        </h2>
        {!user && isInitialized && getRemainingAttempts() > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
            {getRemainingAttempts()} quiz{getRemainingAttempts() === 1 ? '' : 'es'} left
          </div>
        )}
      </div>

      {/* Standard Mode - Featured */}
      <div className="space-y-3">
        {/* Main Mode: Standard */}
        {(() => {
          const mode = 'standard'
          const info = modeInfo[mode]
          if (!info) return null

          const isSelected = selectedMode === mode
          const accessCheck = checkModeAccess(mode)

          return (
            <button
              key={mode}
              onClick={() => accessCheck.hasAccess && onModeSelect(mode)}
              disabled={!accessCheck.hasAccess}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left relative",
                "hover:scale-[1.01] active:scale-[0.99]",
                isSelected 
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md" 
                  : "border-border hover:border-border/80 hover:shadow-sm",
                !accessCheck.hasAccess && "opacity-60 cursor-not-allowed hover:scale-100"
              )}
            >
              {/* Mode Icon and Info */}
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0",
                  isSelected 
                    ? "bg-primary dark:bg-primary/40" 
                    : "bg-slate-100 dark:bg-slate-800"
                )}>
                  {info.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-base text-slate-900 dark:text-white">
                      {info.name}
                    </h4>
                    {accessCheck.hasAccess && (
                      <Badge className="text-xs px-2 py-0.5 h-5 bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && accessCheck.hasAccess && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  </div>
                </div>
              )}
            </button>
          )
        })()}

        {/* Coming Soon Modes */}
        <div className="flex gap-2">
          {['classic_quiz', 'npc_battle'].map((mode) => {
            const info = modeInfo[mode as keyof typeof modeInfo]
            if (!info) return null

            return (
              <div
                key={mode}
                className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{info.emoji}</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {info.name}
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4 text-slate-500 border-slate-300">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Start Button - Prominent */}
      <div className="pt-2">
        <Button 
          className={cn(
            "w-full h-12 text-base font-semibold rounded-lg transition-all duration-200",
            selectedMode && checkModeAccess(selectedMode).hasAccess && !modeInfo[selectedMode]?.comingSoon
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={() => handleModeSelect(selectedMode)}
          disabled={!selectedMode || !checkModeAccess(selectedMode).hasAccess || modeInfo[selectedMode]?.comingSoon}
        >
          <div className="flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            <span>
              {!user && isInitialized && getRemainingAttempts() <= 0 
                ? 'Sign In to Continue' 
                : modeInfo[selectedMode]?.comingSoon
                ? 'Coming Soon'
                : 'Start Quiz'
              }
            </span>
          </div>
        </Button>
      </div>
    </div>
  )
} 