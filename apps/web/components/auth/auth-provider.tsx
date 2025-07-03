"use client"

import React, { useCallback } from 'react'
import { AuthProvider as SharedAuthProvider } from '@civicsense/ui-web'
import { useToast } from '@civicsense/ui-web'
import { supabase, authHelpers } from '../../lib/supabase/client'
import { pendingUserAttribution } from '@civicsense/shared/pending-user-attribution'

// Re-export the auth hook from shared
export { useAuth } from '@civicsense/ui-web'
export type { AuthContextType } from '@civicsense/ui-web'

// Temporary stub component
const DonationThankYouPopover = ({ children, ...props }: any) => null

interface WebAuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: WebAuthProviderProps) {
  const { toast } = useToast()

  // Helper function to transfer pending data when user authenticates
  const handleUserChange = useCallback(async (user: any) => {
    if (!user) return

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

  const handleSignOut = useCallback(() => {
    toast({
      title: "Signed out successfully! 👋",
      description: "You've been signed out of CivicSense. Come back soon!",
      variant: "default",
    })
  }, [toast])

  return (
    <SharedAuthProvider
      supabaseClient={supabase}
      onUserChange={handleUserChange}
      onSignOut={handleSignOut}
    >
      {children}
    </SharedAuthProvider>
  )
}
