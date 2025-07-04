import { useState, useEffect } from 'react'

const DAILY_LIMIT = 3
const STORAGE_KEY = 'guest-quiz-attempts'

interface GuestAccess {
  attempts: number
  lastAttemptDate: string
}

export function useGuestAccess() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [guestAccess, setGuestAccess] = useState<GuestAccess>({
    attempts: 0,
    lastAttemptDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    // Load stored guest access data
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as GuestAccess
      const today = new Date().toISOString().split('T')[0]
      
      // Reset attempts if it's a new day
      if (data.lastAttemptDate !== today) {
        setGuestAccess({ attempts: 0, lastAttemptDate: today })
      } else {
        setGuestAccess(data)
      }
    }
    setIsInitialized(true)
  }, [])

  const incrementAttempts = () => {
    const newAccess = {
      attempts: guestAccess.attempts + 1,
      lastAttemptDate: new Date().toISOString().split('T')[0]
    }
    setGuestAccess(newAccess)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccess))
  }

  const getRemainingAttempts = () => {
    return Math.max(0, DAILY_LIMIT - guestAccess.attempts)
  }

  const hasReachedDailyLimit = () => {
    return guestAccess.attempts >= DAILY_LIMIT
  }

  return {
    isInitialized,
    incrementAttempts,
    getRemainingAttempts,
    hasReachedDailyLimit
  }
} 