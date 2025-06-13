"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./auth/user-menu"
import { useAuth } from "./auth/auth-provider"
import { usePathname } from "next/navigation"

interface HeaderProps {
  onSignInClick: () => void
  className?: string
}

export function Header({ onSignInClick, className }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <div className={className}>
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4">
        {/* Left side - Home link */}
        <nav className="flex items-center">
          <Link 
            href="/" 
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Home
          </Link>
        </nav>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CivicSense
            </span>
          </Link>
        </div>

        {/* Right side - Theme toggle and User menu */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <UserMenu onSignInClick={onSignInClick} />
        </div>
      </div>
    </div>
  )
}
