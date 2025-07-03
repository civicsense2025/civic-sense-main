"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

// Environment variable validation
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return { url, anonKey }
}

// Create a single supabase client for interacting with your database
const config = getSupabaseConfig()
const client = createBrowserClient<Database>(config.url, config.anonKey, {
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

// Auth helpers
const auth = {
  async signInWithEmail(email: string, password: string) {
    return await client.auth.signInWithPassword({ email, password })
  },

  async signUpWithEmail(email: string, password: string) {
    return await client.auth.signUp({ email, password })
  },

  async signOut() {
    return await client.auth.signOut()
  },

  async resetPassword(email: string) {
    return await client.auth.resetPasswordForEmail(email)
  },

  async signInWithGoogle() {
    return await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  },
}

// Export everything
export { client as supabase, auth as authHelpers } 