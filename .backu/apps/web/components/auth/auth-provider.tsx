"use client"

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useToast } from "@/components/ui"
import { supabase } from '@/lib/supabase/client'
import { pendingUserAttribution } from '@civicsense/business-logic'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      handleUserChange(newUser)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleUserChange = useCallback(async (user: User | null) => {
    if (!user) return

    try {
      if (!pendingUserAttribution.hasPendingData()) {
        return
      }

      const pendingSummary = pendingUserAttribution.getPendingSummary()
      console.log('🔄 Found pending data to transfer:', pendingSummary)

      const transferResult = await pendingUserAttribution.transferPendingDataToUser(user.id)
      
      if (transferResult.success && transferResult.totalXPAwarded > 0) {
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out successfully! 👋",
      description: "You've been signed out of CivicSense. Come back soon!",
      variant: "default",
    })
  }, [toast])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
