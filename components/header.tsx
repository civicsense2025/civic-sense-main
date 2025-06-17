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
          <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-5">
            {/* Left side - Site branding */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="group hover:opacity-80 transition-opacity"
              >
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  CivicSense
                </div>
              </Link>
            </div>

            {/* Center - Navigation */}
            <div className="flex-1 flex justify-center">
              <nav className="flex items-center space-x-8">
                {pathname === '/civics-test' ? (
                  <div className="text-base text-slate-900 dark:text-slate-100 font-medium">
                    Civics Test
                  </div>
                ) : (
                  <Link 
                    href="/civics-test"
                    className="text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
                  >
                    Take Civics Test
                  </Link>
                )}
                
                {pathname !== '/' && !pathname.includes('/civics-test') && (
                  <div className="text-base text-slate-700 dark:text-slate-200 font-light">
                    {pathname.includes('/quiz/') ? 'Quiz' : 'Home'}
                  </div>
                )}
              </nav>
            </div>

            {/* Right side - Essential controls only */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} />
            </div>
          </div>
        </div>
      )}

      {/* Fallback for individual components */}
      {showTopBar && !showMainHeader && (
        <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center justify-end w-full px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} />
            </div>
          </div>
        </div>
      )}

      {!showTopBar && showMainHeader && (
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-4">
            <Link 
              href="/" 
              className="group hover:opacity-80 transition-opacity"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                CivicSense
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
