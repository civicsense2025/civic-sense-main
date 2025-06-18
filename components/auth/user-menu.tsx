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
import { User, LogOut, BarChart3, Settings, Crown, ChevronDown, FileText, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePremium } from "@/hooks/usePremium"
import { enhancedProgressOperations, type EnhancedUserProgress } from "@/lib/enhanced-gamification"
import { LearningPodsStats } from "@/components/learning-pods-stats"
import Link from "next/link"

interface UserMenuProps {
  onSignInClick: () => void
}

// Custom Avatar Button Component
function AvatarButton({ 
  user, 
  userProgress, 
  onClick 
}: { 
  user: any, 
  userProgress: EnhancedUserProgress | null, 
  onClick: () => void 
}) {
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (email: string) => {
    // Generate a consistent color based on email
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  const userEmail = user.email || 'user@example.com'

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
    >
      {/* Avatar Circle */}
      <div className={`w-10 h-10 rounded-full ${getAvatarColor(userEmail)} flex items-center justify-center text-white font-medium text-sm shadow-lg`}>
        {getInitials(userEmail)}
      </div>
      
      {/* Level Badge */}
      {userProgress && userProgress.currentLevel > 1 && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
          {userProgress.currentLevel}
        </div>
      )}
      
      {/* Online Indicator */}
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
    </button>
  )
}

export function UserMenu({ onSignInClick }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userProgress, setUserProgress] = useState<EnhancedUserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isPremium, subscription } = usePremium()

  // Load user stats when component mounts
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      try {
        const progress = await enhancedProgressOperations.getComprehensiveStats(user.id)
        setUserProgress(progress)
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadUserStats()
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/donate" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          Support
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              <span onClick={onSignInClick}>Log In</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DropdownMenuItem 
            onClick={onSignInClick} 
            className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors text-slate-900 dark:text-slate-100"
          >
            <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Sign In</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Access your dashboard and progress</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link 
              href="/civics-test" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors rounded-sm text-slate-900 dark:text-slate-100"
            >
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Take Full Civics Exam</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Test your civic knowledge</div>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const getUserTitle = () => {
    if (isPremium) {
      // Check if it's a lifetime subscription by looking at external_subscription_id or other indicators
      return subscription?.subscription_tier === 'pro' ? 'Pro Member' : 'Premium Member'
    }
    return userProgress?.currentLevel ? `Level ${userProgress.currentLevel}` : 'Member'
  }

  const getTierBadge = () => {
    if (subscription?.subscription_tier === 'pro') return { icon: Crown, color: 'text-purple-500', label: 'Pro' }
    if (isPremium) return { icon: Crown, color: 'text-blue-500', label: 'Premium' }
    return null
  }

  const userEmail = user.email || 'user@example.com'
  const tierBadge = getTierBadge()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <AvatarButton 
            user={user} 
            userProgress={userProgress} 
            onClick={() => {}} 
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* User Info Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full ${userProgress ? 'bg-blue-500' : 'bg-slate-400'} flex items-center justify-center text-white font-medium shadow-lg`}>
              {userEmail.split('@')[0].substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {userEmail.split('@')[0]}
                </p>
                {tierBadge && (
                  <div className={`flex items-center space-x-1 ${tierBadge.color}`}>
                    <tierBadge.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getUserTitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {userProgress && !isLoading && (
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {userProgress.currentStreak || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Day Streak
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {userProgress.totalXp || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total XP
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {userProgress.currentLevel || 1}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Level
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Pods Section - temporarily hidden until ready for public use */}
        {/*
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <LearningPodsStats compact={true} />
        </div>
        */}

        {/* Menu Items */}
        <div className="py-3">
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors rounded-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          {/* Learning Pods menu item - temporarily hidden until ready for public use */}
          {/*
          <DropdownMenuItem asChild>
            <Link 
              href="/learning-pods" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors rounded-sm"
            >
              <Users className="w-4 h-4" />
              <span>Learning Pods</span>
            </Link>
          </DropdownMenuItem>
          */}

          <DropdownMenuItem asChild>
            <Link 
              href="/settings" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors rounded-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={toggleTheme} 
            className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 transition-colors"
          >
            <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
