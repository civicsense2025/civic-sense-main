/**
 * Authentication utilities for API routes
 */

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * Creates a Supabase client with service role key for admin operations
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Checks if a user has admin privileges
 * @param email - User email to check
 * @returns boolean indicating admin status
 */
export function isAdminUser(email: string | undefined): boolean {
  if (!email) return false
  
  // Check for admin email patterns
  return (
    email === 'admin@civicsense.one' ||
    email.endsWith('@civicsense.org') ||
    email === 'tanmho92@gmail.com' // Add specific admin emails as needed
  )
}

/**
 * Authenticates admin user for API routes
 * Uses getUser() for secure authentication verification
 * @returns Promise with user data or null
 */
export async function authenticateAdmin(): Promise<{ user: any | null; error: any }> {
  try {
    const supabase = await createServerClient()
    
    // Use getUser() for secure authentication - it verifies with Supabase Auth server
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error in admin authentication:', error)
      return { user: null, error }
    }
    
    if (!user) {
      return { user: null, error: { message: 'No authenticated user' } }
    }
    
    // Check if user has admin privileges
    if (!isAdminUser(user.email)) {
      return { user: null, error: { message: 'User does not have admin privileges' } }
    }
    
    console.log(`✅ Admin user ${user.email} authenticated successfully`)
    return { user, error: null }
    
  } catch (error) {
    console.error('Error in admin authentication:', error)
    return { user: null, error }
  }
}

/**
 * Middleware that requires admin authentication
 * Returns response object if authentication fails, null if successful
 */
export async function requireAdmin(): Promise<{ user: any | null; response: Response | null }> {
  const { user, error } = await authenticateAdmin()
  
  if (!user || error) {
    const errorMessage = error?.message || 'Authentication required'
    console.warn(`❌ Admin authentication failed: ${errorMessage}`)
    
    return {
      user: null,
      response: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin authentication required',
          details: errorMessage
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
  
  return { user, response: null }
} 