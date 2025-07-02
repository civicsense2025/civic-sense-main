import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface NavigationTopic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string
  categories: string[]
  is_breaking: boolean
  is_featured: boolean
  questionCount: number
  hasQuestions: boolean
  readingTime: number
  categoryArray: string[]
}

interface NavigationData {
  current: {
    topic_id: string
    topic_title: string
    date: string
  }
  previous: NavigationTopic[]
  next: NavigationTopic[]
  hasMore: {
    previous: boolean
    next: boolean
  }
}

interface UseQuizNavigationOptions {
  topicId: string
  limit?: number
  enableKeyboardShortcuts?: boolean
}

export function useQuizNavigation({ 
  topicId, 
  limit = 3, 
  enableKeyboardShortcuts = true 
}: UseQuizNavigationOptions) {
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch navigation data
  const fetchNavigationData = useCallback(async () => {
    if (!topicId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/topics/navigation?topicId=${topicId}&limit=${limit}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setNavigationData(data)
    } catch (err) {
      console.error('Error fetching navigation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load navigation data')
    } finally {
      setIsLoading(false)
    }
  }, [topicId, limit])

  // Navigation functions
  const navigateToTopic = useCallback((targetTopicId: string) => {
    router.push(`/quiz/${targetTopicId}`)
  }, [router])

  const navigateToPrevious = useCallback(() => {
    if (navigationData?.previous?.[0]) {
      navigateToTopic(navigationData.previous[0].topic_id)
    }
  }, [navigationData, navigateToTopic])

  const navigateToNext = useCallback(() => {
    if (navigationData?.next?.[0]) {
      navigateToTopic(navigationData.next[0].topic_id)
    }
  }, [navigationData, navigateToTopic])

  const navigateToHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // Don't trigger if modifier keys are pressed (except for our specific combos)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'h': // Vim-style
          event.preventDefault()
          navigateToPrevious()
          break
        case 'ArrowRight':
        case 'l': // Vim-style
          event.preventDefault()
          navigateToNext()
          break
        case 'Home':
        case 'Escape':
          event.preventDefault()
          navigateToHome()
          break
        case '?':
          // Could show help dialog
          event.preventDefault()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, navigateToPrevious, navigateToNext, navigateToHome])

  // Load navigation data when topicId changes
  useEffect(() => {
    fetchNavigationData()
  }, [fetchNavigationData])

  return {
    navigationData,
    isLoading,
    error,
    navigateToTopic,
    navigateToPrevious,
    navigateToNext,
    navigateToHome,
    refresh: fetchNavigationData,
    // Convenience getters
    previousTopic: navigationData?.previous?.[0] || null,
    nextTopic: navigationData?.next?.[0] || null,
    hasPrevious: (navigationData?.previous?.length || 0) > 0,
    hasNext: (navigationData?.next?.length || 0) > 0,
    allPreviousTopics: navigationData?.previous || [],
    allNextTopics: navigationData?.next || []
  }
} 