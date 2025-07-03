"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Header, AuthDialog } from "@civicsense/ui-web"
import { 
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { cn } from "@civicsense/ui-web"

interface QuickLinkProps {
  href: string
  emoji: string
  title: string
  description: string
  color: string
  delay?: number
}

function QuickLink({ href, emoji, title, description, color, delay = 0 }: QuickLinkProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6",
        "bg-white dark:bg-slate-900/50 backdrop-blur-sm",
        "border border-slate-200 dark:border-slate-800",
        "hover:shadow-xl hover:scale-105 transition-all duration-300",
        "apple-animate-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
        "bg-gradient-to-br",
        color
      )} />
      
      <div className="relative z-10">
        <div className="text-4xl mb-4">
          {emoji}
        </div>
        
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
          {description}
        </p>
      </div>
    </Link>
  )
}

export default function NotFound() {
  const router = useRouter()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Track 404 errors for analytics
  useEffect(() => {
    // Optional: Add analytics tracking for 404 pages
    console.log("404 page not found")
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
      >
        Go home
      </Link>
    </div>
  )
} 