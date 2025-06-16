"use client"

import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Search, Moon, Sun, BarChart3, Settings, Crown } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { TopicSearch } from "@/components/topic-search"
import { usePremium } from "@/hooks/usePremium"
import { enhancedProgressOperations, type EnhancedUserProgress } from "@/lib/enhanced-gamification"
import Link from "next/link"

interface UserMenuProps {
  onSignInClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function UserMenu({ onSignInClick, searchQuery, onSearchChange }: UserMenuProps) {
  const { user, signOut, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [mounted, setMounted] = useState(false)
  const [userStats, setUserStats] = useState<EnhancedUserProgress | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user stats from enhanced gamification system
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) {
        setUserStats(null)
        return
      }

      setStatsLoading(true)
      try {
        const stats = await enhancedProgressOperations.getComprehensiveStats(user.id)
        setUserStats(stats)
      } catch (error) {
        console.error('Failed to load user stats:', error)
        // Fallback to default stats
        setUserStats({
          currentStreak: 0,
          longestStreak: 0,
          totalQuizzesCompleted: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          totalXp: 0,
          currentLevel: 1,
          xpToNextLevel: 100,
          weeklyGoal: 3,
          weeklyCompleted: 0,
          preferredCategories: [],
          adaptiveDifficulty: true,
          learningStyle: 'mixed',
          accuracyPercentage: 0,
          categoriesMastered: 0,
          categoriesAttempted: 0,
          activeGoals: 0,
          customDecksCount: 0,
          achievementsThisWeek: 0,
          availableXpForBoosts: 0,
          totalBoostsPurchased: 0,
          activeBoosts: []
        })
      } finally {
        setStatsLoading(false)
      }
    }

    loadUserStats()
  }, [user])

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" disabled className="h-9 w-9 rounded-full" />
        <Button variant="ghost" size="sm" disabled className="h-9 w-9 rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        {/* Support Our Work Button - Apple style strong ghost button with lighter font */}
        <Link href="/donate" passHref legacyBehavior>
          <Button 
            variant="ghost" 
            size="lg"
            className="rounded-full h-12 px-7 py-0 text-base font-normal tracking-tight bg-transparent text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 shadow-none hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <span className="text-amber-600 dark:text-amber-400 font-medium mr-2">★</span>
            <span>Support Our Work</span>
          </Button>
        </Link>
        {/* Unlock All Quizzes Button - Apple style strong ghost button with lighter font */}
        <Button 
          variant="ghost" 
          size="lg" 
          onClick={onSignInClick}
          className="rounded-full h-12 px-7 py-0 text-base font-normal tracking-tight bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 shadow-none hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <User className="h-5 w-5 mr-2" />
          <span>Unlock All Quizzes</span>
        </Button>
      </div>
    )
  }

  const getUserTitle = () => {
    if (!userStats) return "New Citizen"
    
    if (userStats.currentLevel >= 10) return "Civic Expert"
    if (userStats.currentLevel >= 7) return "Democracy Champion"
    if (userStats.currentLevel >= 5) return "Active Citizen"
    if (userStats.currentLevel >= 3) return "Civic Learner"
    return "New Citizen"
  }

  const getTierBadge = () => {
    if (isPro) return { text: "PRO", color: "text-purple-600 dark:text-purple-400" }
    if (isPremium) return { text: "PREMIUM", color: "text-blue-600 dark:text-blue-400" }
    return { text: "FREE", color: "text-slate-500 dark:text-slate-400" }
  }

  const tierBadge = getTierBadge()

  return (
    <div className="flex items-center space-x-2">
      {/* Search Button - Outside of dropdown */}
      <TopicSearch 
        searchQuery={searchQuery} 
        onSearchChange={onSearchChange}
      />
      
      {/* User Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-12 w-auto rounded-full px-6 font-normal text-base bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 shadow-none hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center"
        >
          <User className="h-5 w-5" />
          {(isPremium || isPro) && (
            <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 bg-white dark:bg-black border border-slate-100 dark:border-slate-800 shadow-lg rounded-xl p-3"
      >
        <DropdownMenuLabel className="flex flex-col space-y-2 text-slate-900 dark:text-slate-50 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">My Account</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${tierBadge.color}`}>
              {tierBadge.text}
            </span>
          </div>
          <span className="text-sm font-light text-slate-500 dark:text-slate-400">{user.email}</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-3" />
        
        {/* User Stats - Clean and minimal */}
        <div className="px-3 py-4 bg-slate-50 dark:bg-slate-900 mx-3 rounded-xl mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
              Level {userStats?.currentLevel || 1}
            </span>
            <span className="text-xs font-light text-slate-500 dark:text-slate-400">
              {getUserTitle()}
            </span>
          </div>
          
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">XP</div>
              </div>
              <div className="space-y-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">Streak</div>
              </div>
              <div className="space-y-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">Complete</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-light text-blue-600 dark:text-blue-400">
                  {userStats?.totalXp?.toLocaleString() || 0}
                </div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">XP</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-light text-green-600 dark:text-green-400">
                  {userStats?.currentStreak || 0}
                </div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">Streak</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-light text-slate-900 dark:text-slate-100">
                  {userStats?.totalQuizzesCompleted || 0}
                </div>
                <div className="text-xs font-light text-slate-500 dark:text-slate-400">Complete</div>
              </div>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-3" />
        
        {/* Quick Actions */}
        <DropdownMenuLabel className="text-slate-900 dark:text-slate-50 font-light px-3 py-2">
          Quick Actions
        </DropdownMenuLabel>
        
        {/* Dashboard */}
        <DropdownMenuItem asChild>
          <Link 
            href="/dashboard" 
            className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg mx-1 px-3 py-2 font-light transition-colors flex items-center"
          >
            <BarChart3 className="mr-3 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Donate */}
        <DropdownMenuItem asChild>
          <Link 
            href="/donate" 
            className="text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 focus:bg-amber-50 dark:focus:bg-amber-900/30 rounded-lg mx-1 px-3 py-2 font-light transition-colors flex items-center"
          >
            <span className="mr-3 text-lg">★</span>
            <span>Donate</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Theme Toggle */}
        <DropdownMenuItem 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg mx-1 px-3 py-2 font-light transition-colors"
        >
          {mounted && theme === 'dark' ? (
            <>
              <Sun className="mr-3 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-3 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-3" />
        
        {/* Account Actions */}
        <DropdownMenuItem asChild>
          <Link 
            href="/settings" 
            className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg mx-1 px-3 py-2 font-light transition-colors flex items-center"
          >
            <Settings className="mr-3 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => signOut()} 
          className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg mx-1 px-3 py-2 font-light transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}
