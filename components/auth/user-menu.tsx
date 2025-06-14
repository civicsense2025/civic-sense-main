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
  const [showSearch, setShowSearch] = useState(false)
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
    return <Button variant="ghost" size="sm" disabled className="h-9 w-9 rounded-full" />
  }

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full flex items-center space-x-2 px-3 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <User className="h-4 w-4" />
            <span>Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
          <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
          
          {/* Search */}
          <DropdownMenuItem onClick={() => setShowSearch(true)} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
            <Search className="mr-2 h-4 w-4" />
            <span>Search Topics</span>
          </DropdownMenuItem>
          
          {/* Theme Toggle */}
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
            {mounted && theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
          
          {/* Sign In */}
          <DropdownMenuItem onClick={onSignInClick} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
            <User className="mr-2 h-4 w-4" />
            <span>Sign In</span>
          </DropdownMenuItem>
          
          {/* Search Modal */}
          {showSearch && (
            <TopicSearch 
              searchQuery={searchQuery} 
              onSearchChange={(query) => {
                onSearchChange(query)
                setShowSearch(false)
              }} 
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
    if (isPro) return { text: "PRO", color: "text-indigo-700 dark:text-indigo-400" }
    if (isPremium) return { text: "PREMIUM", color: "text-blue-600 dark:text-blue-400" }
    return { text: "FREE", color: "text-slate-500 dark:text-slate-400" }
  }

  const tierBadge = getTierBadge()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent text-slate-900 dark:text-slate-100"
        >
          <User className="h-5 w-5" />
          {(isPremium || isPro) && (
            <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
        <DropdownMenuLabel className="flex flex-col space-y-1 text-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between">
            <span>My Account</span>
            <span className={`text-xs font-bold ${tierBadge.color}`}>
              {tierBadge.text}
            </span>
          </div>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        
        {/* User Stats */}
        <div className="px-2 py-3 bg-slate-50 dark:bg-slate-800/50 mx-2 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Level {userStats.level}</span>
            <span className="text-xs text-muted-foreground">{getUserTitle()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{userStats.xp}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-600 dark:text-green-400">{userStats.streak}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div>
                                          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{userStats.completedQuizzes}</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        
        {/* Quick Actions */}
        <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">Quick Actions</DropdownMenuLabel>
        
        {/* Search */}
        <DropdownMenuItem onClick={() => setShowSearch(true)} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
          <Search className="mr-2 h-4 w-4" />
          <span>Search Topics</span>
        </DropdownMenuItem>
        
        {/* Dashboard */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100 flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Theme Toggle */}
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
          {mounted && theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        
        {/* Account Actions */}
        <DropdownMenuItem className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => signOut()} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        
        {/* Search Modal */}
        {showSearch && (
          <TopicSearch 
            searchQuery={searchQuery} 
            onSearchChange={(query) => {
              onSearchChange(query)
              setShowSearch(false)
            }} 
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
