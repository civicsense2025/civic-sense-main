"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function LoginPageContent({ onAuthSuccess, onClose }: { onAuthSuccess: () => void; onClose: () => void }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  // Get the return_to parameter from URL if it exists
  const returnTo = searchParams?.get('return_to') || '/dashboard'

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // Check if onboarding is needed for this user
      checkOnboardingStatus()
    }
  }, [user, isLoading, router, returnTo])

  const checkOnboardingStatus = async () => {
    if (!user) return

    try {
      // Check if user has completed onboarding
      const { data, error } = await supabase
        .from('user_onboarding_state')
        .select('is_completed')
        .eq('user_id', user.id)
        .maybeSingle()

      // Just redirect to dashboard regardless of onboarding status
      // The dashboard will show an onboarding banner if needed
      router.push(returnTo)
      
      /* Remove automatic onboarding redirect
      // If no onboarding record or not completed, send to onboarding
      if (error || !data || !data.is_completed) {
        // Check if this is a new user (created in the last 5 minutes)
        const userCreationTime = user.created_at ? new Date(user.created_at) : null
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        
        if (userCreationTime && userCreationTime > fiveMinutesAgo) {
          setIsNewUser(true)
          router.push('/onboarding')
        } else {
          // Existing user - redirect to specified page or dashboard
          router.push(returnTo)
        }
      } else {
        // Onboarding complete, redirect to specified page or dashboard
        router.push(returnTo)
      }
      */
    } catch (err) {
      console.error('Error checking onboarding status:', err)
      // On error, just redirect to the dashboard
      router.push(returnTo)
    }
  }

  return (
    <AuthDialog
      isOpen={isAuthDialogOpen}
      onClose={onClose}
      onAuthSuccess={onAuthSuccess}
      initialMode="sign-in"
    />
  )
}

export default function LoginPage() {
  const handleAuthSuccess = () => {
    // Dialog will close automatically and user will be redirected by the above effect
  }

  const handleClose = () => {
    // If user closes the dialog, redirect to home page
    const router = useRouter()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <Suspense>
        <LoginPageContent onAuthSuccess={handleAuthSuccess} onClose={handleClose} />
      </Suspense>
    </div>
  )
} 