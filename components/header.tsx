"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, BarChart3, Settings, Crown, Users, Brain, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { UserMenu } from "./auth/user-menu"
import { LearningPodsQuickActions } from "./learning-pods-quick-actions"
import { useAuth } from "./auth/auth-provider"
import { usePathname } from "next/navigation"
import { arePodsEnabled, isMultiplayerEnabled } from "@/lib/feature-flags"
import { useTheme } from "next-themes"
import { usePremium } from "@/hooks/usePremium"
import { enhancedProgressOperations, type EnhancedUserProgress } from "@/lib/enhanced-gamification"
import { LearningPodsStats } from "./learning-pods-stats"
import { useAdminAccess } from "@/hooks/useAdminAccess"

interface HeaderProps {
  onSignInClick?: () => void
  className?: string
  showTopBar?: boolean
  showMainHeader?: boolean
}

interface MobileUserMenuProps {
  user: any
  onSignInClick?: () => void
  onClose: () => void
  pathname: string
  signOut: () => Promise<void>
  isAdmin?: boolean
}

function MobileUserMenu({ user, onSignInClick, onClose, pathname, signOut, isAdmin = false }: MobileUserMenuProps) {
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getUserTitle = () => {
    if (isPremium) {
      return subscription?.subscription_tier === 'pro' ? 'Pro Member' : 'Premium Member'
    }
    return userProgress?.currentLevel ? `Level ${userProgress.currentLevel}` : 'Member'
  }

  const getTierBadge = () => {
    if (subscription?.subscription_tier === 'pro') return { icon: Crown, color: 'text-yellow-500', label: 'Pro' }
    if (isPremium) return { icon: Crown, color: 'text-blue-500', label: 'Premium' }
    return null
  }

  const userEmail = user?.email || 'user@example.com'
  const tierBadge = getTierBadge()

  return (
    <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
      {/* Main CTA at top of mobile menu */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <Link 
          href="/civics-test"
          onClick={onClose}
          className="block w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-center py-4 px-4 rounded-md text-base font-semibold transition-colors"
        >
          Take A Civics Test
        </Link>
      </div>

      {/* User Info Section - only show if authenticated */}
      {user && (
        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-medium shadow-sm">
              {userEmail.split('@')[0].substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {userEmail.split('@')[0]}
                </p>
                {tierBadge && (
                  <div className={`flex items-center space-x-1 ${tierBadge.color}`}>
                    <tierBadge.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {getUserTitle()}
              </p>
            </div>
          </div>

          {/* Stats Section */}
          {userProgress && !isLoading && (
            <div className="grid grid-cols-3 gap-6 text-center py-2">
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {userProgress.currentStreak || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Day Streak
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {userProgress.totalXp || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Total XP
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {userProgress.currentLevel || 1}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Level
                </div>
              </div>
            </div>
          )}

          {/* Learning Pods Section - feature flagged */}
          {arePodsEnabled() && (
            <div className="mt-4">
              <LearningPodsStats compact={true} />
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="space-y-3">
        {pathname !== '/' && (
          <Link 
            href="/"
            onClick={onClose}
            className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <span>🏠</span>
            <span>Home</span>
          </Link>
        )}
        
        <Link 
          href="/categories"
          onClick={onClose}
          className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <span>📚</span>
          <span>Categories</span>
        </Link>

        {/* Multiplayer link - feature flagged */}
        {isMultiplayerEnabled() && (
          <Link 
            href="/multiplayer"
            onClick={onClose}
            className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <span>🎮</span>
            <span>Multiplayer</span>
          </Link>
        )}

        {/* Learning Pods link - feature flagged */}
        {arePodsEnabled() && (
          <Link 
            href="/pods"
            onClick={onClose}
            className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Users className="w-5 h-5" />
            <span>Learning Pods</span>
          </Link>
        )}

        <Link 
          href="/donate"
          onClick={onClose}
          className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <span>❤️</span>
          <span>Support</span>
        </Link>
      </div>
      
      {/* User Menu Items */}
      {user ? (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          <Link 
            href="/dashboard"
            onClick={onClose}
            className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/settings"
            onClick={onClose}
            className="flex items-center space-x-3 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>

          {/* Admin Panel - Only show for authorized users */}
          {isAdmin && (
            <Link 
              href="/admin/ai-content"
              onClick={onClose}
              className="flex items-center space-x-3 text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors py-2 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <Brain className="w-5 h-5" />
              <span>AI Content Review</span>
            </Link>
          )}

          <button
            onClick={() => {
              toggleTheme()
            }}
            className="flex items-center space-x-3 w-full text-left text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={async () => {
              onClose()
              try {
                await signOut()
              } catch (error) {
                console.error('Error signing out:', error)
              }
            }}
            className="flex items-center space-x-3 w-full text-left text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors py-2 px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      ) : (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <button
            onClick={() => {
              onClose()
              onSignInClick && onSignInClick()
            }}
            className="block w-full text-left text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  )
}

export function Header({
  onSignInClick,
  className,
  showTopBar = true,
  showMainHeader = true
}: HeaderProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const { isAdmin } = useAdminAccess()

  return (
    <div className={className}>
      {/* Unified header with integrated utility bar */}
      {showTopBar && showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
            {/* Left side - Site branding with inline alpha badge */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="group hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    CivicSense
                  </div>
                  <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                    alpha
                  </span>
                </div>
              </Link>
            </div>

            {/* Center - Empty space for cleaner header */}
            <div className="hidden sm:flex flex-1 justify-center">
              {/* Clean header without page titles */}
            </div>

            {/* Right side - Essential controls */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-4">
                {/* Learning Pods Quick Actions - feature flagged */}
                {arePodsEnabled() && <LearningPodsQuickActions variant="header" />}
                
                {/* Login button for non-authenticated users */}
                {!user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSignInClick}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    Log In
                  </Button>
                )}
                
                {/* Main CTA - Take A Civics Test */}
                <Button
                  asChild
                  size="default"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-6 py-3 text-base font-semibold"
                >
                  <Link href="/civics-test">
                    Take A Civics Test
                  </Link>
                </Button>
                
                {/* User menu for authenticated users */}
                {user && <UserMenu isAdmin={isAdmin} />}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative z-[100]"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu overlay - highest z-index */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="sm:hidden fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu content */}
          <div className="sm:hidden fixed top-0 left-0 right-0 z-[95] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 shadow-xl max-h-screen overflow-y-auto">
            {/* Header in mobile menu */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  CivicSense
                </div>
                <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                  alpha
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <MobileUserMenu 
              user={user}
              onSignInClick={onSignInClick}
              onClose={() => setIsMobileMenuOpen(false)}
              pathname={pathname}
              signOut={signOut}
              isAdmin={isAdmin}
            />
          </div>
        </>
      )}

      {/* Fallback for individual components */}
      {showTopBar && !showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-end w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-3 sm:space-x-5">
              <UserMenu isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}

      {!showTopBar && showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <Link 
              href="/" 
              className="group hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  CivicSense
                </div>
                <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                  alpha
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// Legacy exports for backward compatibility
export function TopUtilityBar({ onSignInClick }: { onSignInClick: () => void }) {
  return <Header onSignInClick={onSignInClick} showMainHeader={false} />
}

export function MainHeader({ onSignInClick }: { onSignInClick: () => void }) {
  return <Header onSignInClick={onSignInClick} showTopBar={false} />
}
