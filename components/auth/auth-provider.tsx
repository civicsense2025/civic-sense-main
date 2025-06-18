"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, authHelpers } from "@/lib/supabase"
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
  const [educationalAccessChecked, setEducationalAccessChecked] = useState<Set<string>>(new Set())
  const [donationAccessChecked, setDonationAccessChecked] = useState<Set<string>>(new Set())
  const [showDonationThankYou, setShowDonationThankYou] = useState(false)
  const [donationDetails, setDonationDetails] = useState<{amount: number, accessTier: string} | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Helper function to check and grant educational access
  const checkEducationalAccess = async (user: User, reason: string = 'auth') => {
    if (!user?.email || !user.email_confirmed_at) {
      console.log('Skipping educational access check: email not confirmed or missing')
      return
    }

    // Create a unique key for this user's educational access check
    const checkKey = `${user.id}-${user.email_confirmed_at}`
    
    // Skip if we've already checked for this user's confirmed email
    if (educationalAccessChecked.has(checkKey)) {
      console.log(`Educational access already checked for user ${user.email} (key: ${checkKey})`)
      return
    }

    // Only check for .edu emails to reduce unnecessary calls
    if (!user.email.toLowerCase().includes('.edu')) {
      console.log(`Skipping educational access check for non-.edu email: ${user.email}`)
      // Still mark as checked to prevent future attempts
      setEducationalAccessChecked(prev => new Set([...prev, checkKey]))
      return
    }

    try {
      console.log(`🎓 Checking educational access for ${user.email} (reason: ${reason}, key: ${checkKey})`)
      
      const response = await fetch('/api/auth/grant-educational-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          emailConfirmed: true
        })
      })

      // Always mark as checked to prevent retries, regardless of response
      setEducationalAccessChecked(prev => new Set([...prev, checkKey]))

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Educational access check completed:', result.message)
      } else {
        console.log(`⚠️ Educational access check failed with status ${response.status}`)
        // Don't log this as an error since it might be expected (e.g., route not found in development)
      }
    } catch (error) {
      console.error('❌ Error checking educational access:', error)
      // Still mark as checked to prevent endless retries
      setEducationalAccessChecked(prev => new Set([...prev, checkKey]))
    }
  }

  // Helper function to check and grant donation-based premium access
  const checkDonationAccess = async (user: User, reason: string = 'auth') => {
    if (!user?.email || !user.email_confirmed_at) {
      console.log('Skipping donation access check: email not confirmed or missing')
      return
    }

    // Create a unique key for this user's donation access check
    const checkKey = `${user.id}-${user.email_confirmed_at}`
    
    // Skip if we've already checked for this user's confirmed email
    if (donationAccessChecked.has(checkKey)) {
      console.log(`Donation access already checked for user ${user.email} (key: ${checkKey})`)
      return
    }

    try {
      console.log(`💳 Checking donation access for ${user.email} (reason: ${reason}, key: ${checkKey})`)
      
      const response = await fetch('/api/auth/grant-donation-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          emailConfirmed: true
        })
      })

      // Always mark as checked to prevent retries, regardless of response
      setDonationAccessChecked(prev => new Set([...prev, checkKey]))

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Donation access check completed:', result.message)
        
        // Store flag to show donation thank you popover if premium access was granted
        if (result.accessTier && result.donationAmount) {
          localStorage.setItem('showDonationThankYou', 'true')
          localStorage.setItem('donationDetails', JSON.stringify({
            amount: result.donationAmount,
            accessTier: result.accessTier
          }))
          
          // If this is initial load or sign in, show the popover immediately
          if (reason === 'initial_load' || reason === 'sign_in') {
            setDonationDetails({
              amount: result.donationAmount,
              accessTier: result.accessTier
            })
            setShowDonationThankYou(true)
          }
        }
      } else {
        console.log(`⚠️ Donation access check failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error checking donation access:', error)
      // Still mark as checked to prevent endless retries
      setDonationAccessChecked(prev => new Set([...prev, checkKey]))
    }
  }

  // Helper function to transfer pending data when user authenticates
  const transferPendingData = async (user: User) => {
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
  }

  useEffect(() => {
    // Check if we have a session on mount
    const getSession = async () => {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        // Check for educational access on initial load (only if email confirmed)
        await checkEducationalAccess(session.user, 'initial_load')
        // Check for donation access on initial load
        await checkDonationAccess(session.user, 'initial_load')
        // Transfer any pending data on initial load
        await transferPendingData(session.user)
        
        // Check if we should show donation thank you popover
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
      
      setIsLoading(false)
    }

    getSession()

    // Handle URL hash parameters (like those from OAuth or email confirmation)
    const handleHashParams = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (accessToken && type) {
        console.log('Auth callback detected, refreshing session...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            // Check for educational access after email confirmation or OAuth (this is important!)
            await checkEducationalAccess(session.user, 'email_confirmation')
            // Check for donation access after email confirmation
            await checkDonationAccess(session.user, 'email_confirmation')
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
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // Check for educational access when user signs in (important for new users)
          await checkEducationalAccess(session.user, 'sign_in')
          // Check for donation access when user signs in
          await checkDonationAccess(session.user, 'sign_in')
          // Transfer any pending data when user signs in
          await transferPendingData(session.user)
          
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
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          // Clear educational access check cache when user signs out
          setEducationalAccessChecked(new Set())
          // Clear donation access check cache when user signs out
          setDonationAccessChecked(new Set())
          // Clear donation thank you state when user signs out
          setShowDonationThankYou(false)
          setDonationDetails(null)
          localStorage.removeItem('showDonationThankYou')
          localStorage.removeItem('donationDetails')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          // Only check educational access on token refresh if email was recently confirmed
          // (This helps catch cases where email was confirmed during the session)
          await checkEducationalAccess(session.user, 'token_refresh')
          // Also check donation access on token refresh
          await checkDonationAccess(session.user, 'token_refresh')
          // Transfer pending data on token refresh (e.g., after email confirmation)
          await transferPendingData(session.user)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
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
  }

  const handleCloseDonationThankYou = () => {
    setShowDonationThankYou(false)
    setDonationDetails(null)
    // Clear localStorage flags
    localStorage.removeItem('showDonationThankYou')
    localStorage.removeItem('donationDetails')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
      
      {/* Donation Thank You Popover */}
      <DonationThankYouPopover
        isVisible={showDonationThankYou}
        onClose={handleCloseDonationThankYou}
        donationAmount={donationDetails?.amount}
        accessTier={donationDetails?.accessTier as 'annual' | 'lifetime'}
      />
    </AuthContext.Provider>
  )
}
