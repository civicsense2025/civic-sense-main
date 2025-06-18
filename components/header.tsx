"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./auth/user-menu"
import { JoinRequestNotifications } from "./learning-pods/join-request-notifications"
import { LearningPodsQuickActions } from "./learning-pods-quick-actions"
import { useAuth } from "./auth/auth-provider"
import { usePathname } from "next/navigation"

interface HeaderProps {
  onSignInClick: () => void
  className?: string
  showTopBar?: boolean
  showMainHeader?: boolean
}

export function Header({ onSignInClick, className, showTopBar = true, showMainHeader = true }: HeaderProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

            {/* Center - Navigation (hidden on small screens) */}
            <div className="hidden sm:flex flex-1 justify-center">
              <nav className="flex items-center space-x-6 lg:space-x-8">
                {pathname !== '/' && (
                  <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-light">
                    {pathname.includes('/quiz/') ? 'Quiz' : 
                     pathname === '/civics-test' ? 'Civics Test' : 
                     pathname.startsWith('/categories') ? 'Categories' :
                     pathname === '/public-figures' || pathname.startsWith('/public-figures/') ? 'Public Figures' :
                     'Home'}
                  </div>
                )}
              </nav>
            </div>

            {/* Right side - Essential controls */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-5">
                <LearningPodsQuickActions variant="header" />
                <ThemeToggle />
                {user && <JoinRequestNotifications />}
                <UserMenu onSignInClick={onSignInClick} />
              </div>
              
              {/* Mobile-only theme toggle */}
              <div className="sm:hidden">
                <ThemeToggle />
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
          <div className="sm:hidden fixed top-0 left-0 right-0 z-[95] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 shadow-xl">
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
            
            {/* Menu content */}
            <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
              {/* Navigation Links */}
              <div className="space-y-3">
                {pathname !== '/' && (
                  <Link 
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Home
                  </Link>
                )}
                
                <Link 
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Categories
                </Link>

                <Link 
                  href="/multiplayer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  🎮 Multiplayer
                </Link>

                <Link 
                  href="/learning-pods-demo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  👥 Learning Pods
                </Link>

                <Link 
                  href="/public-figures"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Public Figures
                </Link>
                
                <Link 
                  href="/donate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Support
                </Link>
              </div>
              
              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                {/* Authentication Links - Mobile Only */}
                <div className="space-y-3">
                  {!user ? (
                    <>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          onSignInClick()
                        }}
                        className="block w-full text-left text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        Dashboard
                      </Link>
                      
                      <Link 
                        href="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        Settings
                      </Link>
                      
                      <button
                        onClick={async () => {
                          setIsMobileMenuOpen(false)
                          try {
                            await signOut()
                          } catch (error) {
                            console.error('Error signing out:', error)
                          }
                        }}
                        className="block w-full text-left text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors py-2 px-3 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fallback for individual components */}
      {showTopBar && !showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-end w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-3 sm:space-x-5">
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} />
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
