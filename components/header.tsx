"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./auth/user-menu"
import { useAuth } from "./auth/auth-provider"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"

interface HeaderProps {
  onSignInClick: () => void
}

export function Header({ onSignInClick }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <span className="font-bold text-xl hidden sm:inline-block">Civic Spark</span>
          </Link>
        </div>

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
    </header>
  )
}
