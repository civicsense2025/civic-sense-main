"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const POLITICAL_QUIPS = [
  "Democracy doesn't pause for coffee breaks...",
  "Your civic education called—it missed you.",
  "While you were away, politicians were still being politicians.",
  "Ready to pick up where democracy left off?",
  "Time to resume your journey through political reality.",
  "Your quiz was patiently waiting, unlike Congress.",
  "Back to learning how power actually works...",
  "Democracy class is back in session.",
  "Hope you're ready for some uncomfortable truths.",
  "Time to continue separating fact from political fiction.",
  "Your civic knowledge was gathering dust...",
  "Ready to dive back into the political deep end?"
]

interface QuizLoadingScreenProps {
  onComplete: () => void
  duration?: number
  className?: string
}

export function QuizLoadingScreen({ 
  onComplete, 
  duration = 3000,
  className 
}: QuizLoadingScreenProps) {
  const [currentQuip, setCurrentQuip] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Rotate through quips every 1 second
    const quipInterval = setInterval(() => {
      setCurrentQuip(prev => (prev + 1) % POLITICAL_QUIPS.length)
    }, 1000)

    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 50)) // 50ms intervals
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          clearInterval(quipInterval)
          
          // Fade out then complete
          setTimeout(() => {
            setIsVisible(false)
            setTimeout(onComplete, 300) // Wait for fade out
          }, 200)
          
          return 100
        }
        return newProgress
      })
    }, 50)

    return () => {
      clearInterval(quipInterval)
      clearInterval(progressInterval)
    }
  }, [duration, onComplete])

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-white dark:bg-slate-950 z-50 flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div className="text-center space-y-8 max-w-md px-6">
        {/* Animated icon */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-6 animate-pulse">
            <div className="text-5xl animate-bounce">🏛️</div>
          </div>
          
          {/* Spinning ring around icon */}
          <div className="absolute inset-0 w-20 h-20 mx-auto">
            <div className="w-full h-full border-4 border-slate-200 dark:border-slate-800 rounded-full animate-spin border-t-blue-600"></div>
          </div>
        </div>

        {/* Witty quip with fade animation */}
        <div className="h-16 flex items-center justify-center">
          <p 
            key={currentQuip}
            className="text-lg font-light text-slate-900 dark:text-white leading-relaxed animate-in fade-in duration-500"
          >
            {POLITICAL_QUIPS[currentQuip]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            Jumping back in... {Math.round(progress)}%
          </div>
        </div>

        {/* Subtle motivational text */}
        <div className="text-xs text-slate-400 dark:text-slate-500 font-light">
          Time to see how much you actually remember 💪
        </div>
      </div>
    </div>
  )
} 