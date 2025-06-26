import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { checkAdminAccess, AdminRole } from '@/lib/admin-middleware'

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
  const [role, setRole] = useState<AdminRole>('user')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setRole('user')
        setIsLoading(false)
        setError(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Use the admin middleware function that bypasses RLS
        const result = await checkAdminAccess()
        
        setIsAdmin(result.isAdmin)
        setIsSuperAdmin(result.isSuperAdmin)
        setRole(result.role)
        
        if (result.error) {
          setError(result.error)
          console.warn('Admin access check warning:', result.error)
        } else {
          console.log(`✅ Admin check for ${user.email}:`, {
            isAdmin: result.isAdmin,
            isSuperAdmin: result.isSuperAdmin,
            role: result.role
          })
        }
      } catch (err) {
        console.error('Error verifying admin access:', err)
        setError('Failed to verify admin access')
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setRole('user')
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