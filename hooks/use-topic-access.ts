import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { parseTopicDate, getTodayAtMidnight } from '@/lib/utils'
import type { TopicMetadata } from '@/lib/quiz-data'

export interface TopicAccessStatus {
  accessible: boolean
  reason: string
}

export const useTopicAccess = () => {
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { hasReachedDailyLimit } = useGuestAccess()
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  // Load completed topics from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const saved = localStorage.getItem("civicAppCompletedTopics_v1")
      if (saved) {
        try {
          setCompletedTopics(new Set(JSON.parse(saved)))
        } catch (error) {
          console.warn('Failed to parse completed topics:', error)
        }
      }
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Save completed topics to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && completedTopics.size > 0) {
      try {
        localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify([...completedTopics]))
      } catch (error) {
        console.warn('Failed to save completed topics:', error)
      }
    }
  }, [completedTopics, isInitialized])

  const getTopicAccessStatus = useCallback((topic: TopicMetadata): TopicAccessStatus => {
    const currentDate = getTodayAtMidnight()
    const localTopicDate = parseTopicDate(topic.date)
  
    if (!localTopicDate) {
      return { accessible: false, reason: 'invalid_date' }
    }

    // Breaking & Featured content: Always accessible to everyone
    if (topic.is_breaking || topic.is_featured) {
      return { accessible: true, reason: 'featured_content' }
    }

    // Future locked for everyone until the date
    if (localTopicDate > currentDate) {
      return { accessible: false, reason: 'future_locked' }
    }

    // Pre-compute commonly used flags
    const isToday = localTopicDate.getTime() === currentDate.getTime()
    const isCompleted = completedTopics.has(topic.topic_id)

    // Guest access logic
    if (!user) {
      const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (localTopicDate < oneWeekAgo) {
        return { accessible: false, reason: 'guest_old_content' }
      }
      if (hasReachedDailyLimit() && !completedTopics.has(topic.topic_id)) {
        return { accessible: false, reason: 'guest_limit_reached' }
      }
      return { accessible: true, reason: 'guest_access' }
    }

    // Authenticated user logic
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Premium/Pro users have full access
    if (isPremium || isPro) {
      return { accessible: true, reason: 'premium_access' }
    }

    // Free users: today + completed + 1 week back
    if (isToday || isCompleted || localTopicDate >= oneWeekAgo) {
      return { accessible: true, reason: 'free_access' }
    }

    // Older content requires premium
    return { accessible: false, reason: 'premium_required' }
  }, [user, isPremium, isPro, hasReachedDailyLimit, completedTopics])

  const markTopicCompleted = useCallback((topicId: string) => {
    setCompletedTopics(prev => new Set([...prev, topicId]))
  }, [])

  const isTopicCompleted = useCallback((topicId: string) => {
    return completedTopics.has(topicId)
  }, [completedTopics])

  return {
    getTopicAccessStatus,
    completedTopics,
    markTopicCompleted,
    isTopicCompleted,
    isInitialized
  }
} 