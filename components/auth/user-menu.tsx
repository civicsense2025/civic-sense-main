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
import { User, LogOut, BarChart3, Settings, Crown, ChevronDown, FileText, Users, Brain } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { usePremium } from "@/hooks/usePremium"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { enhancedProgressOperations, type EnhancedUserProgress } from "@/lib/enhanced-gamification"
import { LearningPodsStats } from "@/components/learning-pods-stats"
import Link from "next/link"

interface UserMenuProps {
  onSignInClick?: () => void
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
    // Use CivicSense brand colors instead of slate
    return 'bg-primary hover:bg-primary/90'
  }

  const userEmail = user.email || 'user@example.com'

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:ring-2 hover:ring-ring hover:ring-offset-2 hover:ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      {/* Avatar Circle */}
      <div className={`w-10 h-10 rounded-full ${getAvatarColor(userEmail)} flex items-center justify-center text-primary-foreground font-medium text-sm shadow-lg transition-all duration-200`}>
        {getInitials(userEmail)}
      </div>
    </button>
  )
}

export function UserMenu({ onSignInClick = () => {}, ...otherProps }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userProgress, setUserProgress] = useState<EnhancedUserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isPremium, subscription } = usePremium()
  const { isAdmin } = useAdminAccess()

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

  // Only show user menu if user is authenticated
  if (!user) {
    return null
  }

  const getUserTitle = () => {
    if (isPremium) {
      // Check if it's a lifetime subscription by looking at external_subscription_id or other indicators
      return subscription?.subscription_tier === 'pro' ? 'Pro Member' : 'Premium Member'
    }
    return userProgress?.currentLevel ? `Level ${userProgress.currentLevel}` : 'Member'
  }

  const getTierBadge = () => {
    if (subscription?.subscription_tier === 'pro') return { icon: Crown, color: 'text-accent', label: 'Pro' }
    if (isPremium) return { icon: Crown, color: 'text-primary', label: 'Premium' }
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
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl border-border/50">
        {/* User Info Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl ${userProgress ? 'bg-primary' : 'bg-muted-foreground'} flex items-center justify-center text-primary-foreground font-medium shadow-sm`}>
              {userEmail.split('@')[0].substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {userEmail.split('@')[0]}
                </p>
                {tierBadge && (
                  <div className={`flex items-center space-x-1 ${tierBadge.color}`}>
                    <tierBadge.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getUserTitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {userProgress && !isLoading && (
          <div className="p-6 border-b border-border/50">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="py-2">
                <div className="text-lg font-bold text-foreground">
                  {userProgress.currentStreak || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Day Streak
                </div>
              </div>
              <div className="py-2">
                <div className="text-lg font-bold text-foreground">
                  {userProgress.totalXp || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total XP
                </div>
              </div>
              <div className="py-2">
                <div className="text-lg font-bold text-foreground">
                  {userProgress.currentLevel || 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  Level
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Pods Section - temporarily hidden until ready for public use */}
        {/*
        <div className="p-5 border-b border-border">
          <LearningPodsStats compact={true} />
        </div>
        */}

        {/* Menu Items */}
        <div className="py-2 px-2">
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-muted/20 hover:text-foreground focus:bg-muted/20 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all duration-200 rounded-lg group"
            >
              <BarChart3 className="w-4 h-4 group-hover:scale-105 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          {/* Learning Pods menu item - temporarily hidden until ready for public use */}
          {/*
          <DropdownMenuItem asChild>
            <Link 
                                    href="/pods" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all duration-200 rounded-lg group"
            >
              <Users className="w-4 h-4 group-hover:scale-105 transition-transform" />
              <span className="font-medium">Learning Pods</span>
            </Link>
          </DropdownMenuItem>
          */}

          <DropdownMenuItem asChild>
            <Link 
              href="/settings" 
              className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-muted/20 hover:text-foreground focus:bg-muted/20 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all duration-200 rounded-lg group"
            >
              <Settings className="w-4 h-4 group-hover:scale-105 transition-transform" />
              <span className="font-medium">Settings</span>
            </Link>
          </DropdownMenuItem>

          {/* Admin Panel - Only show for authorized users */}
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link 
                href="/admin/ai-content" 
                className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-200 rounded-lg text-primary group"
              >
                <Brain className="w-4 h-4 group-hover:scale-105 transition-transform" />
                <span className="font-medium">AI Content Review</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            onClick={toggleTheme} 
            className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-muted/20 hover:text-foreground focus:bg-muted/20 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-base group-hover:scale-105 transition-transform">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </DropdownMenuItem>



          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-destructive/5 hover:text-destructive focus:bg-destructive/5 focus:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:ring-offset-0 text-destructive transition-all duration-200 rounded-lg group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
