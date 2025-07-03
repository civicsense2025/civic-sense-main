declare module '@supabase/ssr' {
  import type { SupabaseClient } from '@supabase/supabase-js'
  
  /**
   * Creates a browser Supabase client
   */
  export function createBrowserClient<Database>(
    url: string,
    anonKey: string,
    options?: any
  ): SupabaseClient<Database, any, any>
  
  /**
   * Creates a server Supabase client for Next.js SSR
   */
  export function createServerClient<Database>(
    url: string,
    anonKey: string,
    options: { cookies: Record<string, any> }
  ): SupabaseClient<Database, any, any>
} 