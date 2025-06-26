import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLES, type AdminRole } from '@/lib/admin-middleware'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        isSuperAdmin: false,
        role: ADMIN_ROLES.USER,
        error: 'Not authenticated'
      })
    }

    // Check user role using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    let role: AdminRole = ADMIN_ROLES.USER

    if (!error && data?.role) {
      // Validate role against known roles
      const userRole = data.role as AdminRole
      if (Object.values(ADMIN_ROLES).includes(userRole as any)) {
        role = userRole
      }
    } else if (error) {
      console.warn(`Failed to get user role for ${user.id}:`, error.message)
    }

    const isAdmin = role === ADMIN_ROLES.ADMIN || role === ADMIN_ROLES.SUPER_ADMIN
    const isSuperAdmin = role === ADMIN_ROLES.SUPER_ADMIN

    return NextResponse.json({
      success: true,
      isAdmin,
      isSuperAdmin,
      role,
      userEmail: user.email
    })

  } catch (error) {
    console.error('Error in admin access check:', error)
    return NextResponse.json({
      success: false,
      isAdmin: false,
      isSuperAdmin: false,
      role: ADMIN_ROLES.USER,
      error: 'Access check failed'
    })
  }
} 