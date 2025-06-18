"use client"

import { useState, useEffect, useCallback } from 'react'

// Constants that can be easily modified
const GUEST_DAILY_QUIZ_LIMIT = 5
const STORAGE_KEY_PREFIX = 'civicSense_guest_'
// Disable IP tracking if Redis is not available
const IP_TRACKING_ENABLED = false // Toggle IP tracking on/off

interface GuestAccessState {
  quizAttemptsToday: number
  lastResetDate: string | null
  guestToken: string | null
  userIP: string | null
  serverLimitReached: boolean
  completedTopics: string[] // Track completed topics
}

interface IPTrackingResponse {
  ip: string
  attemptsToday: number
  limitReached: boolean
  completedTopics?: string[]
  success: boolean
}

interface GuestAccessActions {
  recordQuizAttempt: (topicId?: string) => Promise<number>
  hasReachedDailyLimit: () => boolean
  getRemainingAttempts: () => number
  resetGuestState: () => void
  canAccessQuiz: (isToday: boolean) => boolean
  hasCompletedTopic: (topicId: string) => boolean
  getCompletedTopics: () => string[]
}

// Safe localStorage access helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error accessing localStorage.getItem for key "${key}":`, error)
      return null
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error accessing localStorage.setItem for key "${key}":`, error)
      return false
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error accessing localStorage.removeItem for key "${key}":`, error)
      return false
    }
  }
}

// Helper to get today's date at midnight in Eastern Time (ET)
// Using a simpler approach to avoid hydration mismatches
const getTodayAtMidnightET = () => {
  // If we're in a browser environment, we can use the local date
  // This avoids hydration mismatches between server and client
  if (typeof window !== 'undefined') {
    const now = new Date()
    // Simple approach: just use local date for client-side
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else {
    // For server-side, just use UTC date
    // This is a simplification to avoid hydration mismatches
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
}

export function useGuestAccess() {
  const [guestState, setGuestState] = useState<GuestAccessState>({
    quizAttemptsToday: 0,
    lastResetDate: null,
    guestToken: null,
    userIP: null,
    serverLimitReached: false,
    completedTopics: [] // Initialize empty array
  })
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [serverAvailable, setServerAvailable] = useState(true)
  
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [resetTime, setResetTime] = useState<Date | null>(null)
  
  // Set mounted state to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Get user's IP address from server
  const fetchUserIP = useCallback(async (): Promise<string | null> => {
    if (!IP_TRACKING_ENABLED || !isMounted) return null
    
    try {
      const response = await fetch('/api/guest/get-ip', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.warn('Failed to fetch IP address')
        setServerAvailable(false)
        return null
      }
      
      const data = await response.json()
      return data.ip || null
    } catch (error) {
      console.warn('Error fetching IP address:', error)
      setServerAvailable(false)
      return null
    }
  }, [isMounted])
  
  // Check server-side usage for this IP
  const checkServerUsage = useCallback(async (ip: string): Promise<IPTrackingResponse | null> => {
    if (!IP_TRACKING_ENABLED || !ip || !serverAvailable) return null
    
    try {
      const response = await fetch('/api/guest/check-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      })
      
      if (!response.ok) {
        console.warn('Failed to check server usage')
        setServerAvailable(false)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.warn('Error checking server usage:', error)
      setServerAvailable(false)
      return null
    }
  }, [serverAvailable])
  
  // Record usage on server
  const recordServerUsage = useCallback(async (ip: string, topicId?: string): Promise<IPTrackingResponse | null> => {
    if (!IP_TRACKING_ENABLED || !ip || !serverAvailable) return null
    
    try {
      const response = await fetch('/api/guest/record-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ip,
          guestToken: guestState.guestToken,
          timestamp: new Date().toISOString(),
          topicId
        }),
      })
      
      if (!response.ok) {
        console.warn('Failed to record server usage')
        setServerAvailable(false)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.warn('Error recording server usage:', error)
      setServerAvailable(false)
      return null
    }
  }, [guestState.guestToken, serverAvailable])
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
    }
  }, [])

  // Initialize state from localStorage and server on mount
  useEffect(() => {
    const loadGuestState = async () => {
      try {
        // Skip if we're not in a browser environment
        if (typeof window === 'undefined') {
          return
        }
        
        // Check if we need to reset based on ET date
        const todayET = getTodayAtMidnightET().toISOString().split('T')[0]
        const savedLastReset = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}lastResetDate`)
        
        // Generate or retrieve guest token
        let guestToken = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}token`)
        if (!guestToken) {
          guestToken = generateGuestToken()
          safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}token`, guestToken)
        }
        
        // Get user's IP address
        const userIP = await fetchUserIP()
        
        // Check server-side usage if IP tracking is enabled
        let serverUsage: IPTrackingResponse | null = null
        if (userIP) {
          serverUsage = await checkServerUsage(userIP)
        }
        
        // Load completed topics from localStorage
        let completedTopics: string[] = []
        const savedTopics = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}completedTopics`)
        if (savedTopics) {
          try {
            completedTopics = JSON.parse(savedTopics)
          } catch (error) {
            console.warn('Error parsing completed topics from localStorage:', error)
            completedTopics = []
          }
        }
        
        // Use server-side completed topics if available (overrides local)
        if (serverUsage?.completedTopics && serverUsage.completedTopics.length > 0) {
          completedTopics = serverUsage.completedTopics
          // Update localStorage with server data
          safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}completedTopics`, JSON.stringify(completedTopics))
        }
        
        // Reset counter if it's a new day in ET
        if (!savedLastReset || savedLastReset !== todayET) {
          safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`, '0')
          safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}lastResetDate`, todayET)
          // Don't reset completed topics - we want to remember those
          
          if (isMounted) {
            setGuestState({
              quizAttemptsToday: 0,
              lastResetDate: todayET,
              guestToken,
              userIP,
              serverLimitReached: serverUsage?.limitReached || false,
              completedTopics
            })
          }
          
          return
        }
        
        // Otherwise load existing state
        const savedAttempts = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`)
        const localAttempts = savedAttempts ? parseInt(savedAttempts, 10) : 0
        
        // Use the higher of local or server attempts for more accurate tracking
        const effectiveAttempts = serverUsage ? Math.max(localAttempts, serverUsage.attemptsToday) : localAttempts
        
        // Update localStorage if server has higher count
        if (serverUsage && serverUsage.attemptsToday > localAttempts) {
          safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`, serverUsage.attemptsToday.toString())
        }
        
        if (isMounted) {
          setGuestState({
            quizAttemptsToday: effectiveAttempts,
            lastResetDate: savedLastReset,
            guestToken,
            userIP,
            serverLimitReached: serverUsage?.limitReached || false,
            completedTopics
          })
        }
      } catch (error) {
        console.error('Error loading guest access state:', error)
        // Fallback to default state - don't update state if component unmounted
        if (isMounted) {
          setGuestState({
            quizAttemptsToday: 0,
            lastResetDate: null,
            guestToken: null,
            userIP: null,
            serverLimitReached: false,
            completedTopics: []
          })
        }
      } finally {
        setIsInitialized(true)
      }
    }
    
    // Only run client-side code after component has mounted
    if (isMounted) {
      loadGuestState()
    }
  }, [isMounted, fetchUserIP, checkServerUsage])
  
  // Check if a topic has been completed
  const hasCompletedTopic = useCallback((topicId: string): boolean => {
    return guestState.completedTopics.includes(topicId)
  }, [guestState.completedTopics])
  
  // Get all completed topics
  const getCompletedTopics = useCallback((): string[] => {
    return guestState.completedTopics
  }, [guestState.completedTopics])
  
  // Record a quiz attempt (both locally and on server)
  const recordQuizAttempt = useCallback(async (topicId?: string): Promise<number> => {
    try {
      // Skip if we're not in a browser environment
      if (typeof window === 'undefined') {
        return guestState.quizAttemptsToday + 1
      }
      
      const newAttempts = guestState.quizAttemptsToday + 1
      
      // Update localStorage immediately for responsive UI
      safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`, newAttempts.toString())
      
      // Update completed topics if topicId is provided
      let updatedCompletedTopics = [...guestState.completedTopics]
      if (topicId && !updatedCompletedTopics.includes(topicId)) {
        updatedCompletedTopics.push(topicId)
        safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}completedTopics`, JSON.stringify(updatedCompletedTopics))
      }
      
      // Record on server if IP tracking is enabled and server is available
      let serverResponse: IPTrackingResponse | null = null
      if (guestState.userIP && serverAvailable) {
        try {
          serverResponse = await recordServerUsage(guestState.userIP, topicId)
          if (serverResponse?.completedTopics) {
            updatedCompletedTopics = serverResponse.completedTopics
            safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}completedTopics`, JSON.stringify(updatedCompletedTopics))
          }
        } catch (error) {
          console.warn('Failed to record server usage, using local tracking only:', error)
        }
      }
      
      // Update state with server response or local increment
      if (isMounted) {
        setGuestState(prev => ({
          ...prev,
          quizAttemptsToday: serverResponse?.attemptsToday || newAttempts,
          serverLimitReached: serverResponse?.limitReached || newAttempts >= GUEST_DAILY_QUIZ_LIMIT,
          completedTopics: updatedCompletedTopics
        }))
      }
      
      return serverResponse?.attemptsToday || newAttempts
    } catch (error) {
      console.error('Error recording quiz attempt:', error)
      // Fallback to local tracking only
      const newAttempts = guestState.quizAttemptsToday + 1
      safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`, newAttempts.toString())
      
      if (isMounted) {
        setGuestState(prev => ({
          ...prev,
          quizAttemptsToday: newAttempts,
          serverLimitReached: newAttempts >= GUEST_DAILY_QUIZ_LIMIT
        }))
      }
      
      return newAttempts
    }
  }, [guestState.quizAttemptsToday, guestState.userIP, guestState.completedTopics, recordServerUsage, serverAvailable])
  
  // Check if guest has reached their limit (considers both local and server limits)
  const hasReachedDailyLimit = useCallback(() => {
    // If server tracking is enabled and reports limit reached, enforce it
    if (IP_TRACKING_ENABLED && guestState.serverLimitReached) {
      return true
    }
    
    // Otherwise check local limit
    return guestState.quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT
  }, [guestState.quizAttemptsToday, guestState.serverLimitReached])
  
  // Get remaining attempts (considers server limits)
  const getRemainingAttempts = useCallback(() => {
    if (hasReachedDailyLimit()) {
      return 0
    }
    return Math.max(0, GUEST_DAILY_QUIZ_LIMIT - guestState.quizAttemptsToday)
  }, [guestState.quizAttemptsToday, hasReachedDailyLimit])
  
  // Check if guest can access a specific quiz
  const canAccessQuiz = useCallback((isToday: boolean) => {
    if (!isToday) return false
    return !hasReachedDailyLimit()
  }, [hasReachedDailyLimit])
  
  // Reset guest state (for testing or when becoming a paid user)
  const resetGuestState = useCallback(async () => {
    try {
      // Skip if we're not in a browser environment
      if (typeof window === 'undefined') {
        return
      }
      
      const today = new Date().toISOString().split('T')[0]
      safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}quizAttemptsToday`, '0')
      safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}lastResetDate`, today)
      
      // Don't reset completed topics - we want to preserve this data
      
      // Reset server-side tracking if available
      if (guestState.userIP && IP_TRACKING_ENABLED) {
        try {
          await fetch('/api/guest/reset-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              ip: guestState.userIP,
              guestToken: guestState.guestToken 
            }),
          })
        } catch (error) {
          console.warn('Failed to reset server usage:', error)
        }
      }
      
      if (isMounted) {
        setGuestState(prev => ({
          ...prev,
          quizAttemptsToday: 0,
          lastResetDate: today,
          serverLimitReached: false
          // Keep completedTopics unchanged
        }))
      }
    } catch (error) {
      console.error('Error resetting guest state:', error)
    }
  }, [guestState.userIP, guestState.guestToken])
  
  // Generate a unique guest token
  const generateGuestToken = (): string => {
    return 'guest_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           '_' + Date.now().toString(36)
  }
  
  // Get guest access summary for UI display
  const getGuestAccessSummary = useCallback(() => {
    const remaining = getRemainingAttempts()
    const hasReached = hasReachedDailyLimit()
    
    // Determine if limit is from server or local tracking
    const limitSource = IP_TRACKING_ENABLED && guestState.serverLimitReached ? 'server' : 'local'
    
    return {
      remaining,
      total: GUEST_DAILY_QUIZ_LIMIT,
      hasReachedLimit: hasReached,
      limitSource,
      ipTrackingEnabled: IP_TRACKING_ENABLED,
      userIP: guestState.userIP,
      completedTopics: guestState.completedTopics,
      message: hasReached 
        ? 'Daily limit reached! Sign in for unlimited quizzes'
        : `${remaining} of ${GUEST_DAILY_QUIZ_LIMIT} free daily quizzes remaining`,
      canAccessTodayQuiz: !hasReached,
      serverLimitReached: guestState.serverLimitReached
    }
  }, [getRemainingAttempts, hasReachedDailyLimit, guestState.serverLimitReached, guestState.userIP, guestState.completedTopics])
  
  // Check if we should warn about potential circumvention
  const getSuspiciousActivity = useCallback(async () => {
    // Only relevant if IP tracking is enabled
    if (!IP_TRACKING_ENABLED || !guestState.userIP) {
      return Promise.resolve({ suspicious: false, reason: null })
    }
    
    // Check if local storage shows fewer attempts than server
    // This could indicate cache clearing
    try {
      const serverUsage = await checkServerUsage(guestState.userIP!)
      if (serverUsage && serverUsage.attemptsToday > guestState.quizAttemptsToday) {
        return {
          suspicious: true,
          reason: 'cache_cleared',
          message: 'We notice you may have cleared your browser data. Daily limits are tracked across sessions.'
        }
      }
    } catch (error) {
      console.warn('Error checking for suspicious activity:', error)
    }
    
    return { suspicious: false, reason: null }
  }, [guestState.userIP, guestState.quizAttemptsToday, checkServerUsage])
  
  // Get or create guest token for multiplayer
  const getOrCreateGuestToken = useCallback((): string | undefined => {
    if (guestToken) {
      return guestToken
    }

    // Skip if we're not in a browser environment
    if (typeof window === 'undefined') {
      return undefined
    }

    // Check if we have a stored guest token
    let storedToken = safeLocalStorage.getItem('civicsense_guest_token')
    
    if (!storedToken) {
      // Create a new guest token
      storedToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      safeLocalStorage.setItem('civicsense_guest_token', storedToken)
    }

    setGuestToken(storedToken)
    return storedToken
  }, [guestToken])

  // Clear guest token (for logout)
  const clearGuestToken = useCallback(() => {
    safeLocalStorage.removeItem('civicsense_guest_token')
    setGuestToken(null)
  }, [])
  
  return {
    // State
    quizAttemptsToday: guestState.quizAttemptsToday,
    guestToken: getOrCreateGuestToken(),
    lastResetDate: guestState.lastResetDate,
    userIP: guestState.userIP,
    serverLimitReached: guestState.serverLimitReached,
    completedTopics: guestState.completedTopics,
    isInitialized,
    serverAvailable,
    
    // Actions
    recordQuizAttempt,
    hasReachedDailyLimit,
    getRemainingAttempts,
    canAccessQuiz,
    resetGuestState,
    hasCompletedTopic,
    getCompletedTopics,
    getGuestAccessSummary,
    getSuspiciousActivity,
    
    // Server interaction helpers
    fetchUserIP,
    checkServerUsage,
    recordServerUsage,
    
    // Constants
    GUEST_DAILY_QUIZ_LIMIT,
    IP_TRACKING_ENABLED,
    
    // Multiplayer guest token functionality
    getOrCreateGuestToken,
    clearGuestToken
  }
}