import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

// Singleton client instance
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Factory function that implements true singleton pattern
export const createClient = () => {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance
  }

  // Create new instance only if none exists
  clientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}

// Create and export the single client instance for the app
export const supabase = createClient()

// OAuth helper functions
export const authHelpers = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // ⚠️ SECURITY WARNING: Only use this for session-specific data (like tokens).
  // For user authentication, use getUser() instead which validates with the server.
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Helper to handle OAuth callback on client side
  async handleOAuthCallback() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user after OAuth:', error)
      return { error }
    }
    return { data: { user }, error: null }
  },

  // Password reset functionality
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }
}

// Verification functions to help with migration and debugging
export const supabaseUtils = {
  /**
   * Check if the singleton pattern is working correctly
   * Call this in development to verify no multiple clients exist
   */
  verifySingleton() {
    if (typeof window === 'undefined') return true
    
    const clientCount = (window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT || 0
    const isGood = clientCount <= 1
    
    if (!isGood) {
      console.error(`❌ Multiple Supabase clients detected! Count: ${clientCount}`)
      console.log('Migration needed: Replace createClient() calls with singleton import:')
      console.log('❌ import { createClient } from "@/lib/supabase/client"; const supabase = createClient()')
      console.log('✅ import { supabase } from "@/lib/supabase/client"')
    } else {
      console.log('✅ Supabase singleton working correctly')
    }
    
    return isGood
  },

  /**
   * Get statistics about Supabase client usage
   */
  getClientStats() {
    if (typeof window === 'undefined') return { clientCount: 0, message: 'Server-side' }
    
    const clientCount = (window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT || 0
    return {
      clientCount,
      message: clientCount <= 1 ? 'Singleton working correctly' : 'Multiple clients detected',
      recommendation: clientCount > 1 ? 'Replace createClient() calls with singleton import' : 'Good to go!'
    }
  }
}

// Debug helper to check if singleton is working
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT = (window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT || 0
  ;(window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT++
  
  if ((window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT > 1) {
    console.warn(`⚠️ Multiple Supabase clients detected! Count: ${(window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT}`)
    console.log('🔧 To fix: Replace createClient() calls with singleton import')
    console.log('❌ const supabase = createClient()')
    console.log('✅ import { supabase } from "@/lib/supabase/client"')
  } else {
    console.log('✅ Supabase singleton client initialized')
  }
  
  // Make utils available globally for debugging
  ;(window as any).__CIVICSENSE_SUPABASE_UTILS = supabaseUtils
} 