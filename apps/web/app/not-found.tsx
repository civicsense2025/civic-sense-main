"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@civicsense/ui-web"
import { Header } from '@civicsense/ui-web'
import { AuthDialog } from '@civicsense/ui-web'
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <Header onSignInClick={() => setShowAuthDialog(true)} />

      {/* 404 Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 md:py-24">
        <div className="text-center mb-16 apple-animate-in">
          {/* Animated 404 */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-3xl animate-pulse" />
            <h1 className="relative text-8xl md:text-9xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              404
            </h1>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-slate-100 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            This page doesn't exist. Unlike voter suppression, that's not by design. 
            Here's how to get back to learning how power actually works.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              size="lg"
              className="min-w-[200px] group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
            
            <Button 
              asChild
              size="lg"
              className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Link href="/">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Learning
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="apple-slide-up">
          <h3 className="text-center text-2xl font-light text-slate-900 dark:text-slate-100 mb-2">
            Where to Next?
          </h3>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Skip the political theater. Start understanding how power actually works.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickLink
              href="/"
              emoji="🏛️"
              title="Home"
              description="Your civic education command center"
              color="from-blue-500 to-cyan-500"
              delay={0}
            />

            <QuickLink
              href="/dashboard"
              emoji="📊"
              title="Dashboard"
              description="Track your political literacy progress"
              color="from-purple-500 to-pink-500"
              delay={100}
            />

            <QuickLink
              href="/skills"
              emoji="🎯"
              title="Skills"
              description="Build knowledge that politicians fear"
              color="from-orange-500 to-red-500"
              delay={200}
            />

            <QuickLink
              href="/categories"
              emoji="📚"
              title="Quizzes"
              description="Test what you know vs. what they tell you"
              color="from-green-500 to-emerald-500"
              delay={300}
            />

            <QuickLink
              href="/civics-test"
              emoji="🎓"
              title="Civics Test"
              description="Pass the test most politicians would fail"
              color="from-indigo-500 to-purple-500"
              delay={400}
            />

            <QuickLink
              href="/multiplayer"
              emoji="⚔️"
              title="Multiplayer"
              description="Compete to see who knows democracy best"
              color="from-teal-500 to-cyan-500"
              delay={500}
            />
          </div>

          {/* Featured Quizzes */}
          <div className="mt-16 text-center">
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-6">
              Or dive into today's uncomfortable truth:
            </h4>
            
            <div className="max-w-lg mx-auto">
              <Link 
                href="/quiz/2025-trump-approval-rating-decline"
                className={cn(
                  "group block p-6 rounded-2xl",
                  "bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20",
                  "border border-amber-200 dark:border-amber-800",
                  "hover:shadow-xl hover:scale-105 transition-all duration-300"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🔥</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Today's Reality Check
                  </span>
                </div>
                
                <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 text-left">
                  Trump's 2025 Approval Rating Decline
                </h5>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 text-left">
                  Understand the political dynamics they're not discussing on cable news
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Fun Footer Message */}
        <div className="mt-20 text-center text-sm text-slate-500 dark:text-slate-500">
          <p>
            404 errors are temporary. Civic ignorance doesn't have to be. 
          </p>
        </div>
      </div>
      
      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={() => setShowAuthDialog(false)}
        initialMode="sign-in"
      />
    </main>
  )
} 