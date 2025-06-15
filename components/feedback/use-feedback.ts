'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UseFeedbackOptions {
  contextType?: "general" | "quiz" | "content" | "account"
  contextId?: string
  onFeedbackComplete?: () => void
}

export default function useFeedback(options: UseFeedbackOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const openFeedback = useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const closeFeedback = useCallback(() => {
    setIsOpen(false)
    if (options.onFeedbackComplete) {
      options.onFeedbackComplete()
    }
  }, [options])
  
  // Generate context ID if not provided
  const contextId = options.contextId || pathname
  
  return {
    isOpen,
    openFeedback,
    closeFeedback,
    contextType: options.contextType || "general",
    contextId
  }
} 