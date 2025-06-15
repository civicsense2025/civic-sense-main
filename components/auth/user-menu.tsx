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

  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    streak: 0,
    completedQuizzes: 0
  })

  useEffect(() => {
    setMounted(true)
    
    // Load user stats from localStorage
    if (user) {
      const level = localStorage.getItem("civicAppLevel")
      const xp = localStorage.getItem("civicAppXP")
      const streak = localStorage.getItem("civicAppStreak")
      const completedTopics = localStorage.getItem("civicAppCompletedTopics_v1")
      
      setUserStats({
        level: level ? parseInt(level, 10) : 1,
        xp: xp ? parseInt(xp, 10) : 0,
        streak: streak ? parseInt(streak, 10) : 0,
        completedQuizzes: completedTopics ? JSON.parse(completedTopics).length : 0
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" disabled className="h-9 w-9 rounded-full" />
        <Button variant="ghost" size="sm" disabled className="h-9 w-9 rounded-full" />
      </div>
    )
  }

  if (!user) {
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
            className="rounded-full flex items-center space-x-2 px-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 font-light"
          >
            <User className="h-4 w-4" />
            <span>Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-white dark:bg-black border border-slate-100 dark:border-slate-800 shadow-lg rounded-xl p-2"
        >
          <DropdownMenuLabel className="text-slate-900 dark:text-slate-50 font-light px-3 py-2">
            Quick Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-2" />
          
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
          
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-2" />
          
          {/* Sign In */}
          <DropdownMenuItem 
            onClick={onSignInClick} 
            className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg mx-1 px-3 py-2 font-light transition-colors"
          >
            <User className="mr-3 h-4 w-4" />
            <span>Sign In</span>
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    )
  }

  const getUserTitle = () => {
    if (userStats.level >= 10) return "Civic Expert"
    if (userStats.level >= 7) return "Democracy Champion"
    if (userStats.level >= 5) return "Active Citizen"
    if (userStats.level >= 3) return "Civic Learner"
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
          className="relative h-9 w-9 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <User className="h-5 w-5" />
          {(isPremium || isPro) && (
            <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
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
            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Level {userStats.level}</span>
            <span className="text-xs font-light text-slate-500 dark:text-slate-400">{getUserTitle()}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-light text-blue-600 dark:text-blue-400">{userStats.xp.toLocaleString()}</div>
              <div className="text-xs font-light text-slate-500 dark:text-slate-400">XP</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-light text-green-600 dark:text-green-400">{userStats.streak}</div>
              <div className="text-xs font-light text-slate-500 dark:text-slate-400">Streak</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-light text-slate-900 dark:text-slate-100">{userStats.completedQuizzes}</div>
              <div className="text-xs font-light text-slate-500 dark:text-slate-400">Complete</div>
            </div>
          </div>
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
