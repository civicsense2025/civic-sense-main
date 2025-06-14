"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { UserMenu } from "@/components/auth/user-menu"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { Toaster } from "@/components/ui/toaster"

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isInActiveQuiz, setIsInActiveQuiz] = useState(false)
  
  // Monitor for active quiz state
  useEffect(() => {
    const checkQuizState = () => {
      const quizElement = document.querySelector('[data-quiz-active="true"]')
      setIsInActiveQuiz(!!quizElement)
    }
    
    // Check immediately
    checkQuizState()
    
    // Set up observer to watch for changes
    const observer = new MutationObserver(checkQuizState)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-quiz-active']
    })
    
    return () => observer.disconnect()
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="min-h-screen bg-white dark:bg-slate-950">
          {/* Minimal header */}
          <div className="border-b border-slate-100 dark:border-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Clean branding */}
                <Link 
                  href="/" 
                  className="group hover:opacity-70 transition-opacity"
                >
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                    CivicSense
                  </h1>
                </Link>
                
                {/* Minimal user menu */}
                <UserMenu 
                  onSignInClick={() => setIsAuthDialogOpen(true)} 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative">
            {children}
          </div>

          <AuthDialog
            isOpen={isAuthDialogOpen}
            onClose={() => setIsAuthDialogOpen(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

 