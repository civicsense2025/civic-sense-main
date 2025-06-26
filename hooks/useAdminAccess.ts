import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { AdminRole, ADMIN_ROLES } from '@/lib/admin-middleware'

interface AdminAccessResult {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: AdminRole
  isLoading: boolean
  error: string | null
}

export function useAdminAccess(): AdminAccessResult {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [role, setRole] = useState<AdminRole>(ADMIN_ROLES.USER)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setRole(ADMIN_ROLES.USER)
        setIsLoading(false)
        setError(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Call the API endpoint for admin access check
        const response = await fetch('/api/admin/check-access')
        const result = await response.json()
        
        if (result.success) {
          setIsAdmin(result.isAdmin)
          setIsSuperAdmin(result.isSuperAdmin)
          setRole(result.role)
          
          console.log(`✅ Admin check for ${user.email}:`, {
            isAdmin: result.isAdmin,
            isSuperAdmin: result.isSuperAdmin,
            role: result.role
          })
        } else {
          setError(result.error || 'Failed to verify admin access')
          setIsAdmin(false)
          setIsSuperAdmin(false)
          setRole(ADMIN_ROLES.USER)
          
          console.warn('Admin access check failed:', result.error)
        }
      } catch (err) {
        console.error('Error verifying admin access:', err)
        setError('Failed to verify admin access')
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setRole(ADMIN_ROLES.USER)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return { 
    isAdmin, 
    isSuperAdmin, 
    role, 
    isLoading, 
    error 
  }
} 