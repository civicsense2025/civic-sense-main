import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

// Singleton client instance
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session after OAuth:', error)
      return { error }
    }
    return { data, error: null }
  },

  // Password reset functionality
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }
} 