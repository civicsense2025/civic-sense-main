import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '../database.types'

// Server-side client cache (per request basis is fine for server)
// We cache it during a single request lifecycle to avoid recreating within the same request
let currentRequestClient: ReturnType<typeof createServerClient<Database>> | null = null
let currentRequestId: string | null = null

export const createClient = async () => {
  const { cookies } = await import('next/headers')

  // Generate a simple request ID based on cookies (this changes per request naturally)
  const cookieStore = await cookies() as any
  const requestId = JSON.stringify(cookieStore.toString?.() || Math.random())
  
  // Return cached client if it's for the same request
  if (currentRequestClient && currentRequestId === requestId) {
    return currentRequestClient
  }

  // Create new client for this request
  currentRequestClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  currentRequestId = requestId
  return currentRequestClient
}

export const getCurrentUser = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  return user
} 