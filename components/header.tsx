"use client"

import Link from "next/link"
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

  return (
    <div className={className}>
      {/* Unified header with integrated utility bar */}
      {showTopBar && showMainHeader && (
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-3">
            {/* Left side - Site branding */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="group flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  CivicSense
                </div>
                                    <div className="hidden sm:block text-sm text-slate-700 dark:text-slate-200 font-medium">
                      Your daily dose of civic engagement
                    </div>
              </Link>
            </div>

            {/* Center - Navigation (if needed) */}
            <div className="flex-1 flex justify-center">
              {pathname !== '/' && (
                              <div className="text-sm text-slate-700 dark:text-slate-200">
                {pathname.includes('/quiz/') ? 'Quiz' : 'Home'}
              </div>
              )}
            </div>

            {/* Right side - Utility controls */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} searchQuery="" onSearchChange={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Fallback for individual components */}
      {showTopBar && !showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center justify-end w-full max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} searchQuery="" onSearchChange={() => {}} />
            </div>
          </div>
        </div>
      )}

      {!showTopBar && showMainHeader && (
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-4">
            <Link 
              href="/" 
              className="group flex flex-col space-y-1 hover:opacity-80 transition-opacity"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                CivicSense
              </div>
                              <div className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Your daily dose of news vs. noise
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
