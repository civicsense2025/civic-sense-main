"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, BarChart3, Settings, Crown, Users, Brain, LogOut, Target, BookOpen, Zap, Home, Heart, GraduationCap } from "lucide-react"
import { Button } from "./ui/button"
import { UserMenu } from "./auth/user-menu"
import { LearningPodsQuickActions } from "./learning-pods-quick-actions"
import { useAuth } from "./auth/auth-provider"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { usePremium } from '@civicsense/shared/usePremium'
import { enhancedProgressOperations, type EnhancedUserProgress } from '@civicsense/shared/lib/enhanced-gamification'
import { LearningPodsStats } from "./learning-pods-stats"
import { useAdmin } from '@civicsense/shared/admin-access'
import { useComprehensiveFeatureFlags } from '@civicsense/shared/useComprehensiveFeatureFlags'
import { envFeatureFlags } from '@civicsense/shared/env-feature-flags'
import { useFeatureFlag } from '@civicsense/shared/useFeatureFlags-statsig'
import { UnclaimedRewardsNotification } from "@/components/survey/unclaimed-rewards-notification"

interface HeaderProps {
  onSignInClick?: () => void
  onSignUpClick?: () => void
  className?: string
  showTopBar?: boolean
  showMainHeader?: boolean
}

interface MobileUserMenuProps {
  user: any
  onSignInClick?: () => void
  onSignUpClick?: () => void
  onClose: () => void
  pathname: string
  signOut: () => Promise<void>
  isAdmin?: boolean
}

export function MobileUserMenu({ user, onSignInClick, onSignUpClick, onClose, pathname, signOut, isAdmin = false }: MobileUserMenuProps) {
  const { theme, setTheme } = useTheme()
  const [userProgress, setUserProgress] = useState<EnhancedUserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isPremium, subscription } = usePremium()

  // Feature flags - always call hooks at the top level
  const showMultiplayer = useFeatureFlag('multiplayer')
  const showLearningPods = useFeatureFlag('learningPods')
  const showMobileMenu = useFeatureFlag('mobileMenu')

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
    <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Enhanced CTA section for non-authenticated users */}
      {!user && (
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Start Your Civic Journey
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Test your knowledge and become a more informed citizen
            </p>
          </div>
          
          <Link 
            href="/civics-test"
            onClick={onClose}
            className="block w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-50 dark:hover:to-slate-200 text-center py-4 px-6 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎯 Take Civics Test
          </Link>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose()
                onSignInClick && onSignInClick()
              }}
              className="flex-1 bg-transparent border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-center py-3 px-4 rounded-xl text-base font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                onClose()
                onSignUpClick && onSignUpClick()
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-center py-3 px-4 rounded-xl text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Enhanced user info section */}
      {user && (
        <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-slate-900 font-bold text-xl shadow-lg">
              {userEmail.split('@')[0].substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {userEmail.split('@')[0]}
                </p>
                {tierBadge && (
                  <div className={`flex items-center space-x-1 ${tierBadge.color}`}>
                    <tierBadge.icon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {getUserTitle()}
              </p>
            </div>
          </div>

          {/* Enhanced stats section */}
          {userProgress && !isLoading && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {userProgress.currentStreak || 0}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Day Streak
                </div>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {userProgress.totalXp || 0}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total XP
                </div>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {userProgress.currentLevel || 1}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Level
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced navigation section */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Explore
        </h3>
        
        {showMobileMenu && pathname !== '/' && (
          <Link 
            href="/"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Home</span>
          </Link>
        )}
        
        <Link 
          href="/categories"
          onClick={onClose}
          className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <span>Learn Topics</span>
        </Link>

        <Link 
          href="/donate"
          onClick={onClose}
          className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <span>Support Mission</span>
        </Link>
      </div>
      
      {/* Enhanced user menu items */}
      {user ? (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-2">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Your Journey
          </h3>
          
          <Link 
            href="/civics-test"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Take Civics Test</span>
          </Link>

          <Link 
            href="/quiz"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>Quick Quiz</span>
          </Link>

          <Link 
            href="/progress"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span>Progress</span>
          </Link>

          <Link 
            href="/dashboard"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/settings"
            onClick={onClose}
            className="flex items-center space-x-4 text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span>Settings</span>
          </Link>

          {/* Admin Panel - Enhanced design */}
          {isAdmin && (
            <Link 
              href="/admin/ai-content"
              onClick={onClose}
              className="flex items-center space-x-4 text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>AI Content Review</span>
            </Link>
          )}

          {/* Enhanced action buttons */}
          <div className="pt-4 space-y-2">
            <button
              onClick={() => {
                toggleTheme()
              }}
              className="flex items-center space-x-4 w-full text-left text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </div>
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
              className="flex items-center space-x-4 w-full text-left text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <button
            onClick={() => {
              onClose()
              onSignInClick && onSignInClick()
            }}
            className="block w-full text-left text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-200 py-3 px-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm"
          >
            Sign In to Get Started
          </button>
        </div>
      )}
    </div>
  )
}

export function Header({
  onSignInClick,
  onSignUpClick,
  className,
  showTopBar = true,
  showMainHeader = true
}: HeaderProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const { isAdmin } = useAdmin()
  const [mounted, setMounted] = useState(false)

  // Feature flags - always call hooks at the top level
  const showMultiplayer = useFeatureFlag('multiplayer')
  const showLearningPods = useFeatureFlag('learningPods')
  const showMobileMenu = useFeatureFlag('mobileMenu')

  // Handle mounting state for hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className={className}>
      {/* Enhanced unified header with better visual hierarchy */}
      {showTopBar && showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between w-full max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 h-20">
            {/* Enhanced left side - Site branding with better typography */}
            <div className="flex items-center gap-8 min-w-0 flex-1">
              <Link 
                href="/" 
                className="group hover:opacity-80 transition-all duration-300 flex items-center link-none flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    CivicSense
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                    ALPHA
                  </span>
                </div>
              </Link>

              {/* Enhanced desktop navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <Link 
                  href="/categories" 
                  className="text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors relative group"
                >
                  Learn
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link 
                  href="/donate" 
                  className="text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors relative group"
                >
                  Support
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </nav>
            </div>

            {/* Enhanced right side - Actions and User Menu */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Unclaimed Rewards Notification */}
              {user && pathname === '/dashboard' && <UnclaimedRewardsNotification />}
              
              {/* Enhanced authentication controls */}
              {!user ? (
                <div className="flex items-center gap-3">
                  {/* Sign In button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSignInClick}
                    className="hidden sm:flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Sign In
                  </Button>
                  
                  {/* Sign Up button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSignUpClick}
                    className="hidden sm:flex border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all duration-200 hover:scale-105"
                  >
                    Sign Up
                  </Button>
                  
                  {/* Enhanced main CTA */}
                  <Button
                    asChild
                    size="sm"
                    className="hidden md:flex bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-50 dark:hover:to-slate-200 px-8 py-3 text-base font-bold h-12 whitespace-nowrap rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Link href="/civics-test" className="flex items-center justify-center gap-2">
                      🎯 Take Civics Test
                    </Link>
                  </Button>
                </div>
              ) : null}
              
              {/* Always render UserMenu to avoid hook order violations */}
              <UserMenu isAdmin={isAdmin} />
              
              {/* Enhanced mobile menu button */}
              {showMobileMenu && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 relative z-[100] transform hover:scale-110"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced mobile menu overlay */}
      {showMobileMenu && isMobileMenuOpen && mounted && (
        <>
          {/* Enhanced backdrop */}
          <div 
            className="sm:hidden fixed inset-0 z-[90] bg-black/40 backdrop-blur-md" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Enhanced menu content */}
          <div className="sm:hidden fixed top-0 left-0 right-0 z-[95] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-2xl max-h-screen overflow-y-auto">
            {/* Enhanced header in mobile menu */}
            <div className="flex items-center justify-between px-4 h-20 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 link-none">
                <div className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  CivicSense
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                  ALPHA
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 transform hover:scale-110"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <MobileUserMenu 
              user={user}
              onSignInClick={onSignInClick}
              onSignUpClick={onSignUpClick}
              onClose={() => setIsMobileMenuOpen(false)}
              pathname={pathname}
              signOut={signOut}
              isAdmin={isAdmin}
            />
          </div>
        </>
      )}

      {/* Enhanced fallback components with better styling */}
      {showTopBar && !showMainHeader && mounted && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-end w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20">
            <div className="flex items-center space-x-3 sm:space-x-5">
              <UserMenu isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}

      {!showTopBar && showMainHeader && mounted && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20">
            <Link 
              href="/" 
              className="group hover:opacity-80 transition-all duration-300 flex items-center link-none"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  CivicSense
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                  ALPHA
                </span>
              </div>
            </Link>
            <UserMenu isAdmin={isAdmin} />
          </div>
        </div>
      )}
    </div>
  )
}

// Legacy exports for backward compatibility
export function TopUtilityBar({ onSignInClick, onSignUpClick }: { onSignInClick: () => void, onSignUpClick?: () => void }) {
  return <Header onSignInClick={onSignInClick} onSignUpClick={onSignUpClick} showMainHeader={false} />
}

export function MainHeader({ onSignInClick, onSignUpClick }: { onSignInClick: () => void, onSignUpClick?: () => void }) {
  return <Header onSignInClick={onSignInClick} onSignUpClick={onSignUpClick} showTopBar={false} />
}
