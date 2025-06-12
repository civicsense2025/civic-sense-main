"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./auth/user-menu"
import { useAuth } from "./auth/auth-provider"
import { Button } from "./ui/button"
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
      <div className="flex items-center gap-4 justify-center">
        <nav className="flex items-center gap-2">
          <Link href="/" className={pathname === "/" ? "font-medium" : ""}>
            <Button variant={pathname === "/" ? "default" : "ghost"} size="sm">
              Home
            </Button>
          </Link>
          {user && (
            <Link href="/dashboard" className={pathname === "/dashboard" ? "font-medium" : ""}>
              <Button variant={pathname === "/dashboard" ? "default" : "ghost"} size="sm">
                Dashboard
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu onSignInClick={onSignInClick} />
        </div>
      </div>
    </div>
  )
}
