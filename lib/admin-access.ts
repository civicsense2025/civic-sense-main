/**
 * Unified Admin Access System for CivicSense
 * 
 * This replaces the complex multi-layer system with a single, clean interface
 * that works both server-side and client-side.
 */

import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createClient as createClientSingleton } from '@/lib/supabase/client'

// Simple role definitions
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin', 
  SUPER_ADMIN: 'super_admin'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface AdminCheck {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: UserRole
  userId?: string
  email?: string
}

/**
 * Single source of truth for admin checking
 * Works both server-side and client-side
 */
export async function checkAdminAccess(): Promise<AdminCheck> {
  const defaultResult: AdminCheck = {
    isAdmin: false,
    isSuperAdmin: false,
    role: ROLES.USER
  }

  try {
    // Try server-side first, fallback to client-side
    const supabase = typeof window === 'undefined' 
      ? await createClient() 
      : createClientSingleton()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return defaultResult
    }

    // Check user role in user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = (roleData?.role as UserRole) || ROLES.USER
    
    return {
      isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
      isSuperAdmin: role === ROLES.SUPER_ADMIN,
      role,
      userId: user.id,
      email: user.email
    }

  } catch (error) {
    console.error('Admin access check failed:', error)
    return defaultResult
  }
}

/**
 * Server-side middleware for route protection
 */
export async function requireAdmin(request?: any): Promise<{
  success: boolean
  user?: { id: string; email: string }
  role?: UserRole
  response?: Response
}> {
  try {
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isAdmin) {
      return {
        success: false,
        response: new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    return {
      success: true,
      user: {
        id: adminCheck.userId!,
        email: adminCheck.email!
      },
      role: adminCheck.role
    }
  } catch (error) {
    return {
      success: false,
      response: new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Server-side middleware for super admin protection  
 */
export async function requireSuperAdmin(request?: any): Promise<{
  success: boolean
  user?: { id: string; email: string }
  role?: UserRole
  response?: Response
}> {
  try {
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isSuperAdmin) {
      return {
        success: false,
        response: new Response(JSON.stringify({ error: 'Super admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    return {
      success: true,
      user: {
        id: adminCheck.userId!,
        email: adminCheck.email!
      },
      role: adminCheck.role
    }
  } catch (error) {
    return {
      success: false,
      response: new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * React hook for client-side admin checking
 */
export function useAdmin() {
  const [adminStatus, setAdminStatus] = React.useState<AdminCheck>({
    isAdmin: false,
    isSuperAdmin: false, 
    role: ROLES.USER
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    checkAdminAccess()
      .then(setAdminStatus)
      .finally(() => setLoading(false))
  }, [])

  return { ...adminStatus, loading }
} 