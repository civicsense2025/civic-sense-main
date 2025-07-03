import { useState, useEffect } from 'react'

// Stub for useAuth during monorepo migration
// This will be replaced with proper auth context when used in web/mobile apps
const useAuth = () => ({ user: null })

export function useGuestMode() {
  const { user } = useAuth()
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [guestToken, setGuestToken] = useState<string | null>(null)

  useEffect(() => {
    // If user is logged in, not in guest mode
    if (user) {
      setIsGuestMode(false)
      setGuestToken(null)
      return
    }

    // Check for existing guest token
    const token = localStorage.getItem('guestToken')
    if (token) {
      setGuestToken(token)
      setIsGuestMode(true)
      return
    }

    // Create new guest token
    const newToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('guestToken', newToken)
    setGuestToken(newToken)
    setIsGuestMode(true)
  }, [user])

  return {
    isGuestMode,
    guestToken,
    // Helper to clear guest mode when converting to full account
    clearGuestMode: () => {
      localStorage.removeItem('guestToken')
      setIsGuestMode(false)
      setGuestToken(null)
    }
  }
} 