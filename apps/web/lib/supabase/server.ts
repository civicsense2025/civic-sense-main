import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, {
              ...options,
              sameSite: options.sameSite as 'lax' | 'strict' | 'none' | undefined
            })
          } catch (error) {
            // Handle cookie errors in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle cookie errors in middleware
          }
        },
      },
    }
  )
} 