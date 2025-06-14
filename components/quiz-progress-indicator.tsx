"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Trophy, Zap, Target, Clock, Star, CheckCircle, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizProgressIndicatorProps {
  current: number
  limit: number
  variant?: 'compact' | 'detailed' | 'circular' | 'streak' | 'minimal'
  showStreak?: boolean
  streak?: number
  completedToday?: number
  className?: string
  isPremium?: boolean
}

export function QuizProgressIndicator({ 
  current, 
  limit, 
  variant = 'compact',
  showStreak = false,
  streak = 0,
  completedToday = 0,
  className,
  isPremium = false
}: QuizProgressIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const percentage = Math.round((current / limit) * 100)
  const remaining = Math.max(0, limit - current)
  const isAtLimit = current >= limit
  
  // Only show streak if it's meaningful (> 1 and user has completed at least one quiz)
  const shouldShowStreak = showStreak && streak > 1 && current > 0

  // Compact progress bar version
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center space-x-3", className)}>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Quizzes: {current}/{limit}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: limit }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-200",
                      i < current 
                        ? "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-200 dark:ring-blue-600" 
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                ))}
              </div>
              {shouldShowStreak && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1">
                  <Flame className="h-3 w-3 mr-1" />
                  {streak}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium text-slate-900 dark:text-slate-100">Daily Progress</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {current} of {limit} quizzes completed
              </p>
              {shouldShowStreak && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  🔥 {streak} day streak!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Detailed version with stats
  if (variant === 'detailed') {
    return (
      <div className={cn("bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daily Progress</h3>
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{current}</div>
            <div className="text-sm text-slate-700 dark:text-slate-200">Started</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday}</div>
            <div className="text-sm text-slate-700 dark:text-slate-200">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{remaining}</div>
            <div className="text-sm text-slate-700 dark:text-slate-200">Remaining</div>
          </div>
        </div>
        
        <Progress value={percentage} className="mb-2" />
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>{percentage}% complete</span>
          <span>{remaining} left</span>
        </div>
        
        {shouldShowStreak && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center space-x-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {streak} day streak!
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Circular progress indicator
  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("relative w-24 h-24", className)}>
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="text-blue-600 dark:text-blue-400 transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{current}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">of {limit}</div>
                </div>
              </div>
              {shouldShowStreak && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-1.5 py-0.5">
                    <Flame className="h-3 w-3" />
                  </Badge>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium text-slate-900 dark:text-slate-100">Quiz Progress</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {percentage}% complete ({current}/{limit})
              </p>
              {shouldShowStreak && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  🔥 {streak} day streak!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Streak-focused version - much clearer
  if (variant === 'streak') {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {current}/{limit}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {Array.from({ length: limit }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-200",
                i < current 
                  ? "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-200 dark:ring-blue-600" 
                  : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          ))}
        </div>
        
        {shouldShowStreak && (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <Flame className="h-3 w-3 mr-1" />
            {streak}
          </Badge>
        )}
      </div>
    )
  }

  // Minimal version - just text
  if (variant === 'minimal') {
    return (
      <div className={cn("text-sm text-slate-700 dark:text-slate-200", className)}>
        {current}/{limit} today
        {shouldShowStreak && (
          <span className="ml-2 text-orange-600 dark:text-orange-400">
            🔥 {streak}
          </span>
        )}
      </div>
    )
  }

  // Default fallback
  return (
    <div className={cn("text-xs text-slate-600 dark:text-slate-400", className)}>
      {current}/{limit}
    </div>
  )
}

// Additional components for comprehensive progress tracking
export function QuizXPIndicator({ 
  currentXP, 
  nextLevelXP, 
  className 
}: { 
  currentXP: number
  nextLevelXP: number
  className?: string 
}) {
  const progress = (currentXP / nextLevelXP) * 100

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <Star className="h-4 w-4 text-yellow-500" />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-700 dark:text-slate-200">XP Progress</span>
          <span className="text-slate-600 dark:text-slate-300">{currentXP}/{nextLevelXP}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  )
}

export function QuizAchievementIndicator({ 
  achievements, 
  className 
}: { 
  achievements: number
  className?: string 
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {achievements} achievements
      </span>
    </div>
  )
}

// Streak-focused variant with better visual hierarchy
export function QuizStreakIndicator({ 
  streak, 
  current, 
  limit, 
  className 
}: { 
  streak: number
  current: number
  limit: number
  className?: string 
}) {
  const shouldShowStreak = streak > 1 && current > 0

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {/* Progress dots */}
      <div className="flex space-x-1">
        {Array.from({ length: limit }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-200",
              i < current 
                ? "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-200 dark:ring-blue-600" 
                : "bg-slate-200 dark:bg-slate-700"
            )}
          />
        ))}
      </div>
      
      {/* Streak badge */}
      {shouldShowStreak && (
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1">
          <Flame className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      )}
    </div>
  )
} 