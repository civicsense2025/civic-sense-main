"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, authHelpers } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        
        // Check if we're handling an OAuth callback
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (code) {
          // Handle OAuth callback
          const { error } = await authHelpers.handleOAuthCallback()
          if (error) {
            console.error('OAuth callback error:', error)
            // Redirect to error page if OAuth fails
            router.push(`/auth/auth-error?message=${encodeURIComponent(error.message)}`)
            return
          }
          
          // Clean up URL after successful OAuth
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }

        // Get current session
        const { session, error } = await authHelpers.getSession()
        
        if (error) {
          console.error('Error fetching session:', error)
          setUser(null)
        } else if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in fetchUser:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
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
      }
      setUser(null)
    } catch (error) {
      console.error('Error in signOut:', error)
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
