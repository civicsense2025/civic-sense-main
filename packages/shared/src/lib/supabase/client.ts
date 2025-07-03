import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

// Environment variable validation
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    console.warn('⚠️ Supabase environment variables not found. Using fallback values for development.')
    console.warn('Please create .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    // Return safe fallback values that won't crash the app
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'placeholder-anon-key'
    }
  }
  
  return { url, anonKey }
}

// Global singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null
let initializationPromise: Promise<ReturnType<typeof createBrowserClient<Database>>> | null = null

/**
 * Creates a new Supabase client instance
 * 
 * @returns Supabase client instance
 * @throws Error if environment variables are missing in production
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const config = getSupabaseConfig()
  
  return createBrowserClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'civicsense-web'
      }
    }
  })
}

/**
 * Gets the singleton Supabase client instance
 * Ensures only one client exists across the entire application
 * 
 * @returns Promise that resolves to the Supabase client instance
 */
export async function getSupabaseClient(): Promise<ReturnType<typeof createBrowserClient<Database>>> {
  // If already initialized, return the instance
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }
  
  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('🔧 Initializing Supabase client...')
      supabaseInstance = createClient()
      
      // Test the connection
      const { data, error } = await supabaseInstance.auth.getSession()
      if (error) {
        console.warn('⚠️ Supabase client initialized but session check failed:', error.message)
      } else {
        console.log('✅ Supabase client initialized successfully')
      }
      
      return supabaseInstance
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error)
      // Reset the promise so we can retry
      initializationPromise = null
      throw error
    }
  })()
  
  return initializationPromise
}

/**
 * Synchronous getter for the Supabase client instance
 * WARNING: This may return null if the client hasn't been initialized yet
 * Use getSupabaseClient() for guaranteed initialization
 * 
 * @returns The Supabase client instance or null if not initialized
 */
export function getCurrentClient(): ReturnType<typeof createBrowserClient<Database>> | null {
  return supabaseInstance
}

/**
 * Checks if the Supabase client has been initialized
 * 
 * @returns true if the client is initialized, false otherwise
 */
export function isClientInitialized(): boolean {
  return supabaseInstance !== null
}

/**
 * Resets the singleton instance (useful for testing)
 * 
 * @returns void
 */
export function resetClient(): void {
  supabaseInstance = null
  initializationPromise = null
}

// Backward compatibility: Export a getter that ensures initialization
// This maintains compatibility with existing code while ensuring proper initialization
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(target, prop) {
    if (!supabaseInstance) {
      console.warn('⚠️ Supabase client accessed before initialization. Consider using getSupabaseClient() instead.')
      // Initialize synchronously for backward compatibility
      supabaseInstance = createClient()
    }
    return (supabaseInstance as any)[prop]
  }
})

// Auth helpers for backward compatibility
export const authHelpers = {
  // OAuth helper functions
  async signInWithGoogle() {
    const client = await getSupabaseClient()
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Google OAuth error:', error)
      throw error
    }
    
    return data
  },
  
  async signInWithApple() {
    const client = await getSupabaseClient()
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Apple OAuth error:', error)
      throw error
    }
    
    return data
  },
  
  async signOut() {
    const client = await getSupabaseClient()
    
    const { error } = await client.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },
  
  // For user authentication, use getUser() instead which validates with the server.
  async getSession() {
    const client = await getSupabaseClient()
    
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      console.error('Get session error:', error)
      throw error
    }
    
    return session
  },
  
  async getUser() {
    const client = await getSupabaseClient()
    
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      console.error('Get user error:', error)
      throw error
    }
    
    return user
  },
  
  // Helper to handle OAuth callback on client side
  async handleOAuthCallback() {
    const client = await getSupabaseClient()
    
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      console.error('OAuth callback error:', error)
      throw error
    }
    
    return user
  },
  
  // Password reset functionality
  async resetPassword(email: string) {
    const client = await getSupabaseClient()
    
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase client module loaded')
  console.log('❌ import { createClient } from "./supabase/client"; const supabase = createClient()')
  console.log('✅ import { getSupabaseClient } from "./supabase/client"; const supabase = getSupabaseClient()')
  console.log('✅ import { supabase } from "./supabase/client"; // Backward compatible but may be null initially')
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
      console.log('Migration needed: Replace createClient() calls with getSupabaseClient():')
      console.log('❌ import { createClient } from "./supabase/client"; const supabase = createClient()')
      console.log('✅ import { getSupabaseClient } from "./supabase/client"; const supabase = getSupabaseClient()')
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
      recommendation: clientCount > 1 ? 'Replace createClient() calls with getSupabaseClient()' : 'Good to go!'
    }
  },

  /**
   * Check if Supabase is properly initialized
   */
  isInitialized() {
    return supabaseInstance !== null
  },

  /**
   * Force re-initialization (useful for testing)
   */
  reset() {
    supabaseInstance = null
    initializationPromise = null
    if (typeof window !== 'undefined') {
      (window as any).__CIVICSENSE_SUPABASE_CLIENT_COUNT = 0
    }
  }
}

// Make utils available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__CIVICSENSE_SUPABASE_UTILS = supabaseUtils
} 