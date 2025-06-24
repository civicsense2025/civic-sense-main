/**
 * Admin Middleware for CivicSense
 * 
 * This middleware provides admin authentication that bypasses RLS policy recursion issues
 * by using direct database queries with service role permissions.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Admin role hierarchy
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
} as const

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES]

// Admin role permissions
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  [ADMIN_ROLES.SUPER_ADMIN]: ['*'], // All permissions
  [ADMIN_ROLES.ADMIN]: [
    'events.manage',
    'questions.manage', 
    'content.manage',
    'users.view',
    'analytics.view',
    'news-agent.manage'
  ],
  [ADMIN_ROLES.MODERATOR]: [
    'content.moderate',
    'events.moderate',
    'users.view'
  ],
  [ADMIN_ROLES.USER]: []
}

/**
 * Get user role using service role (bypasses RLS)
 */
export async function getUserRoleSafe(userId: string): Promise<AdminRole> {
  try {
    // Create service role client that bypasses RLS
    const supabase = await createClient()
    
    // Use a direct query with explicit table access
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.warn(`Failed to get user role for ${userId}:`, error.message)
      return ADMIN_ROLES.USER
    }

    // Validate role against known roles
    const role = data?.role as AdminRole
    if (Object.values(ADMIN_ROLES).includes(role as any)) {
      return role
    }

    return ADMIN_ROLES.USER
  } catch (error) {
    console.error('Error in getUserRoleSafe:', error)
    return ADMIN_ROLES.USER
  }
}

/**
 * Check if user has admin privileges (admin or super_admin)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRoleSafe(userId)
  return role === ADMIN_ROLES.ADMIN || role === ADMIN_ROLES.SUPER_ADMIN
}

/**
 * Check if user has super admin privileges
 */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRoleSafe(userId)
  return role === ADMIN_ROLES.SUPER_ADMIN
}

/**
 * Check if user has specific permission
 */
export async function userHasPermission(userId: string, permission: string): Promise<boolean> {
  const role = await getUserRoleSafe(userId)
  const permissions = ROLE_PERMISSIONS[role] || []
  
  // Super admin has all permissions
  if (permissions.includes('*')) {
    return true
  }
  
  // Check specific permission
  return permissions.includes(permission)
}

/**
 * Middleware function for admin route protection
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean
  user?: any
  role?: AdminRole
  response?: NextResponse
}> {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if user is admin
    const role = await getUserRoleSafe(user.id)
    const isAdmin = role === ADMIN_ROLES.ADMIN || role === ADMIN_ROLES.SUPER_ADMIN
    
    if (!isAdmin) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return {
      success: true,
      user,
      role
    }
  } catch (error) {
    console.error('Error in requireAdmin:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authorization check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware function for super admin route protection
 */
export async function requireSuperAdmin(request: NextRequest): Promise<{
  success: boolean
  user?: any
  response?: NextResponse
}> {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if user is super admin
    const isSuperAdmin = await isUserSuperAdmin(user.id)
    
    if (!isSuperAdmin) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Super admin access required' },
          { status: 403 }
        )
      }
    }

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error('Error in requireSuperAdmin:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authorization check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Simplified admin check for React hooks
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean
  isSuperAdmin: boolean
  role: AdminRole
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: ADMIN_ROLES.USER,
        error: 'Not authenticated'
      }
    }

    const role = await getUserRoleSafe(user.id)
    
    return {
      isAdmin: role === ADMIN_ROLES.ADMIN || role === ADMIN_ROLES.SUPER_ADMIN,
      isSuperAdmin: role === ADMIN_ROLES.SUPER_ADMIN,
      role,
    }
  } catch (error) {
    console.error('Error in checkAdminAccess:', error)
    return {
      isAdmin: false,
      isSuperAdmin: false,
      role: ADMIN_ROLES.USER,
      error: 'Access check failed'
    }
  }
}

/**
 * Cache user roles to avoid repeated database queries
 */
const roleCache = new Map<string, { role: AdminRole; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getUserRoleCached(userId: string): Promise<AdminRole> {
  const now = Date.now()
  const cached = roleCache.get(userId)
  
  // Return cached role if still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.role
  }
  
  // Fetch fresh role
  const role = await getUserRoleSafe(userId)
  
  // Cache the result
  roleCache.set(userId, { role, timestamp: now })
  
  return role
}

/**
 * Clear role cache for a user (call after role changes)
 */
export function clearUserRoleCache(userId: string): void {
  roleCache.delete(userId)
}

/**
 * Clear all role cache (call periodically or on major changes)
 */
export function clearAllRoleCache(): void {
  roleCache.clear()
} 