"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { ConsolidatedAuthForm } from "@/components/auth/consolidated-auth-form"
import { PasswordResetForm } from "@/components/auth/password-reset-form"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"

function LoginPageContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  // Get the return_to parameter from URL if it exists
  const returnTo = searchParams?.get('return_to') || '/dashboard'

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
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
    } catch (err) {
      console.error('Error checking onboarding status:', err)
      // On error, just redirect to the dashboard
      router.push(returnTo)
    }
  }

  const handleAuthSuccess = () => {
    // User will be redirected by the above effect when auth context updates
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
          <Card className="border-0 shadow-xl rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-8 pt-12 px-8 text-center">
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
              <CardTitle className="text-2xl font-light text-slate-900 dark:text-white">
                Reset your password
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-400 font-light mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-12">
              <PasswordResetForm onBack={() => setShowPasswordReset(false)} />
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Keep power in check
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              Track your civic knowledge. Hold democracy accountable.
            </p>
          </div>

          {/* Main Auth Card */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white dark:bg-slate-900">
            <CardContent className="px-8 py-12">
              <ConsolidatedAuthForm
                onSuccess={handleAuthSuccess}
                initialMode="sign-in"
                onResetPassword={() => setShowPasswordReset(true)}
              />
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-light"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
} 