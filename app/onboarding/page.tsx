"use client"

import { useEffect, useState } from 'react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check if user has already completed onboarding
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('user_onboarding_state')
        .select('is_completed')
        .eq('user_id', user.id)
        .single()

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', onboardingError)
      }

      // If onboarding is already completed, redirect to dashboard
      if (onboardingData?.is_completed) {
        setOnboardingComplete(true)
        router.push('/dashboard')
      } else {
        setOnboardingComplete(false)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-600 dark:text-slate-400">
          Preparing your personalized experience...
        </div>
      </div>
    )
  }

  if (onboardingComplete === true) {
    // This will show briefly before the redirect happens
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">You've already completed onboarding!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {userId && <OnboardingFlow userId={userId} />}
    </div>
  )
} 