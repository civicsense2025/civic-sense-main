"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase, authHelpers } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { pendingUserAttribution } from "@/lib/pending-user-attribution"
import { DonationThankYouPopover } from "@/components/donation-thank-you-popover"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {}
})

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [donationAccessChecked, setDonationAccessChecked] = useState<Set<string>>(new Set())
  const [showDonationThankYou, setShowDonationThankYou] = useState(false)
  const [donationDetails, setDonationDetails] = useState<{amount: number, accessTier: string} | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Note: Educational access checking has been moved to useEducationalAccess hook
  // and is now only called from settings/upgrade areas to reduce unnecessary API calls.

  // Note: Donation access checking is now handled only in the Gift Credits Dashboard component
  // to reduce unnecessary API calls and improve performance. Users can manually check their
  // donation status when they want to create gift links.

  // Helper function to transfer pending data when user authenticates
  const transferPendingData = useCallback(async (user: User) => {
    try {
      // Check if there's any pending data to transfer
      if (!pendingUserAttribution.hasPendingData()) {
        return
      }

      const pendingSummary = pendingUserAttribution.getPendingSummary()
      console.log('🔄 Found pending data to transfer:', pendingSummary)

      // Transfer the data
      const transferResult = await pendingUserAttribution.transferPendingDataToUser(user.id)
      
      if (transferResult.success && transferResult.totalXPAwarded > 0) {
        // Show success toast
        toast({
          title: "Progress Saved! 🎉",
          description: `Your recent activity has been saved to your account. You earned ${transferResult.totalXPAwarded} XP!`,
          variant: "default",
        })
        
        console.log('✅ Successfully transferred pending data:', transferResult)
      } else if (!transferResult.success) {
        console.error('❌ Failed to transfer pending data:', transferResult.error)
      }
    } catch (error) {
      console.error('Error transferring pending data:', error)
    }
  }, [toast])

  // Memoized sign out function
  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      const { error } = await authHelpers.signOut()
      if (error) {
        console.error('Error signing out:', error)
        toast({
          title: "Sign out failed",
          description: "There was an error signing you out. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signed out successfully! 👋",
          description: "You've been signed out of CivicSense. Come back soon!",
          variant: "default",
        })
      }
      setUser(null)
    } catch (error) {
      console.error('Error in signOut:', error)
      toast({
        title: "Sign out failed",
        description: "There was an unexpected error signing you out.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const handleCloseDonationThankYou = useCallback(() => {
    setShowDonationThankYou(false)
    setDonationDetails(null)
    // Clear localStorage flags
    localStorage.removeItem('showDonationThankYou')
    localStorage.removeItem('donationDetails')
  }, [])

  useEffect(() => {
    let mounted = true

    // Check if we have a user on mount
    const getUser = async () => {
      try {
        // First check if we have a session to avoid unnecessary errors
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          if (mounted) {
            setIsLoading(false)
          }
          return
        }
        
        // Only try to get user if we have a session
        if (session?.user) {
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('Error getting user:', error)
            if (mounted) {
              setIsLoading(false)
            }
            return
          }
          
          if (user) {
            setUser(user)
            // Transfer any pending data on initial load
            await transferPendingData(user)
            
            // Check if we should show donation thank you popover
            const shouldShowThankYou = localStorage.getItem('showDonationThankYou')
            const savedDonationDetails = localStorage.getItem('donationDetails')
            if (shouldShowThankYou === 'true' && savedDonationDetails) {
              try {
                const details = JSON.parse(savedDonationDetails)
                if (mounted) {
                  setDonationDetails(details)
                  setShowDonationThankYou(true)
                }
              } catch (error) {
                console.error('Error parsing donation details:', error)
              }
            }
          }
        }
        
        if (mounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getUser()

    // Handle URL hash parameters (like those from OAuth or email confirmation)
    const handleHashParams = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (accessToken && type) {
        console.log('Auth callback detected, refreshing user...')
        try {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (!error && mounted && user) {
            setUser(user)
          }
        } catch (error) {
          console.error('Error handling auth callback:', error)
        }
      }
    }

    handleHashParams()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Validate the user from the server instead of trusting the session
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (!error && user) {
              setUser(user)
              // Transfer any pending data when user signs in
              await transferPendingData(user)
              
              // Check if we should show donation thank you popover (for returning users)
              const shouldShowThankYou = localStorage.getItem('showDonationThankYou')
              const savedDonationDetails = localStorage.getItem('donationDetails')
              if (shouldShowThankYou === 'true' && savedDonationDetails) {
                try {
                  const details = JSON.parse(savedDonationDetails)
                  setDonationDetails(details)
                  setShowDonationThankYou(true)
                } catch (error) {
                  console.error('Error parsing donation details:', error)
                }
              }
            }
          } catch (error) {
            console.warn('Error validating user on sign in:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          // Clear donation access check cache when user signs out
          setDonationAccessChecked(new Set())
          // Clear donation thank you state when user signs out
          setShowDonationThankYou(false)
          setDonationDetails(null)
          localStorage.removeItem('showDonationThankYou')
          localStorage.removeItem('donationDetails')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Validate the user from the server instead of trusting the session
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (!error && user) {
              setUser(user)
              // Transfer pending data on token refresh (e.g., after email confirmation)
              await transferPendingData(user)
            }
          } catch (error) {
            console.warn('Error validating user on token refresh:', error)
          }
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [transferPendingData])

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
      
      {/* Donation Thank You Popover */}
      {donationDetails && (
        <DonationThankYouPopover
          isOpen={showDonationThankYou}
          onClose={handleCloseDonationThankYou}
          amount={donationDetails.amount}
          accessTier={donationDetails.accessTier as 'annual' | 'lifetime'}
          userId={user?.id}
        />
      )}
    </AuthContext.Provider>
  )
}
