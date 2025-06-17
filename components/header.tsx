"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./auth/user-menu"
import { useAuth } from "./auth/auth-provider"
import { usePathname } from "next/navigation"

interface HeaderProps {
  onSignInClick: () => void
  className?: string
  showTopBar?: boolean
  showMainHeader?: boolean
}

export function Header({ onSignInClick, className, showTopBar = true, showMainHeader = true }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className={className}>
      {/* Unified header with integrated utility bar */}
      {showTopBar && showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
            {/* Left side - Site branding */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="group hover:opacity-80 transition-opacity"
              >
                <div className="relative inline-block">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    CivicSense
                  </div>
                  <span className="absolute top-full left-[60%] translate-y-1/2 text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                    alpha
                  </span>
                </div>
              </Link>
            </div>

            {/* Center - Navigation (hidden on small screens) */}
            <div className="hidden sm:flex flex-1 justify-center">
              <nav className="flex items-center space-x-6 lg:space-x-8">
                {pathname === '/civics-test' ? (
                  <div className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-medium">
                    Civics Test
                  </div>
                ) : (
                  <Link 
                    href="/civics-test"
                    className="text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
                  >
                    Take Civics Test
                  </Link>
                )}
                
                {pathname !== '/' && !pathname.includes('/civics-test') && (
                  <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-light">
                    {pathname.includes('/quiz/') ? 'Quiz' : 'Home'}
                  </div>
                )}
              </nav>
            </div>

            {/* Right side - Essential controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-4">
                <ThemeToggle />
                <UserMenu onSignInClick={onSignInClick} />
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          
          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="sm:hidden fixed inset-0 z-30 bg-black/20" 
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="sm:hidden absolute top-full left-0 right-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 shadow-lg w-full max-w-full">
                <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
                {/* Navigation Links */}
                <div className="space-y-3">
                  {pathname !== '/civics-test' && (
                    <Link 
                      href="/civics-test"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2"
                    >
                      Take Civics Test
                    </Link>
                  )}
                  
                  {pathname !== '/' && (
                    <Link 
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2"
                    >
                      Home
                    </Link>
                  )}
                  
                  <Link 
                    href="/donate"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors py-2"
                  >
                    Support
                  </Link>
                </div>
                
                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  {/* Mobile controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
                    <ThemeToggle />
                  </div>
                  
                  <div className="mt-4">
                    <UserMenu onSignInClick={() => {
                      setIsMobileMenuOpen(false)
                      onSignInClick()
                    }} />
                  </div>
                </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fallback for individual components */}
      {showTopBar && !showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-end w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-2 sm:space-x-3">
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
              <div className="relative inline-block">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  CivicSense
                </div>
                <span className="absolute top-full left-[60%] translate-y-1/2 text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm z-10">
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
