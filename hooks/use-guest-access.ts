// ============================================================================
// GUEST ACCESS HOOK
// ============================================================================
// Manages guest tokens for anonymous users to track their progress and rewards

'use client'

import { useState, useCallback } from 'react'

const GUEST_TOKEN_KEY = 'civicsense_guest_token'

// ============================================================================
// GUEST ACCESS HOOK
// ============================================================================

export function useGuestAccess() {
  const [guestToken, setGuestTokenState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GUEST_TOKEN_KEY)
    }
    return null
  })

  /**
   * Generates a new guest token
   */
  const generateGuestToken = useCallback((): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    return `guest_${timestamp}_${random}`
  }, [])

  /**
   * Gets existing guest token or creates a new one
   */
  const getOrCreateGuestToken = useCallback((): string => {
    if (guestToken) {
      return guestToken
    }

    const newToken = generateGuestToken()
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_TOKEN_KEY, newToken)
    }
    
    setGuestTokenState(newToken)
    return newToken
  }, [guestToken, generateGuestToken])

  /**
   * Clear guest token (when user signs up or logs in)
   */
  const clearGuestToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_TOKEN_KEY)
    }
    setGuestTokenState(null)
  }, [])

  /**
   * Set a specific guest token
   */
  const setGuestToken = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_TOKEN_KEY, token)
    }
    setGuestTokenState(token)
  }, [])

  return {
    guestToken,
    getOrCreateGuestToken,
    clearGuestToken,
    setGuestToken,
    generateGuestToken
  }
} 