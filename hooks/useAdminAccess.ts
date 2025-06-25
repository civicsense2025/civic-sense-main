import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase/client'

export function useAdminAccess() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Create the Supabase client
        // Use the singleton supabase client (already imported above)
        
        // Check if user has admin privileges in the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking admin status:', error)
          setError('Failed to check admin status')
          setIsAdmin(false)
        } else {
          setIsAdmin(profile?.is_admin === true)
          console.log(`✅ Admin check for ${user.email}:`, profile?.is_admin === true)
        }
      } catch (err) {
        console.error('Error verifying admin access:', err)
        setError('Failed to verify admin access')
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return { isAdmin, isLoading, error }
} 