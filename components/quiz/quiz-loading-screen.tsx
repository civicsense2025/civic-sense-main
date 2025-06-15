"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface QuizLoadingScreenProps {
  onComplete: () => void
  duration?: number
}

// Simple, focused loading messages
const LOADING_MESSAGES = [
  "📚 Preparing your questions...",
  "🎯 Setting up your quiz...",
  "✨ Almost ready..."
]

export function QuizLoadingScreen({ onComplete, duration = 5000 }: QuizLoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 600)

    // Update progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (duration / 50))
        return Math.min(newProgress, 100)
      })
    }, 50)

    // Complete loading
    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
      clearTimeout(timer)
    }
  }, [onComplete, duration])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Simple spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
        </div>

        {/* Loading message */}
        <div className="space-y-4">
          <p 
            key={currentMessageIndex}
            className="text-lg text-slate-700 dark:text-slate-300 animate-in fade-in duration-300"
          >
            {LOADING_MESSAGES[currentMessageIndex]}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-slate-900 dark:bg-slate-100 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 