"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, authHelpers } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { pendingUserAttribution } from "@/lib/pending-user-attribution"

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
  const router = useRouter()
  const { toast } = useToast()

  // Helper function to check and grant educational access
  const checkEducationalAccess = async (user: User) => {
    if (!user?.email) return

    try {
      // Only check if email is confirmed
      if (user.email_confirmed_at) {
        await fetch('/api/auth/grant-educational-access', {
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
      }
    } catch (error) {
      console.error('Error checking educational access:', error)
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
        // Check for educational access on initial load
        await checkEducationalAccess(session.user)
        // Transfer any pending data on initial load
        await transferPendingData(session.user)
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
            // Check for educational access after email confirmation or OAuth
            await checkEducationalAccess(session.user)
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
          // Check for educational access when user signs in
          await checkEducationalAccess(session.user)
          // Transfer any pending data when user signs in
          await transferPendingData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          // Also check on token refresh in case email was just confirmed
          await checkEducationalAccess(session.user)
          // Also transfer pending data on token refresh (e.g., after email confirmation)
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

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
