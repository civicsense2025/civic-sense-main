'use client';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAdmin(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin access:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAdminAccess()
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return { isAdmin, isLoading }
} 