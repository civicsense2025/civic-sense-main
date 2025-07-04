"use client"

import { useState, useEffect } from "react"
import { AuthDialog } from "../../components/ui"

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main content area - let the client components handle their own headers */}
      <div className="relative">
        {children}
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode='sign-in'
      />
    </div>
  )
}

 