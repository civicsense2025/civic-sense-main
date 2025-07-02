"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { Header } from "@civicsense/ui-web/components/header"
import { AuthDialog } from "@civicsense/ui-web/components/auth/auth-dialog"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@civicsense/ui-web/components/ui/card"
import { Shield, ArrowRight } from "lucide-react"

export default function SignInPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user && !isLoading) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Auto-open auth dialog when page loads
  useEffect(() => {
    if (!user && !isLoading) {
      setShowAuthDialog(true)
    }
  }, [user, isLoading])

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    router.push(redirectTo)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      
      <main className="w-full py-8">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                <Shield className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                Sign In Required
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              You need to sign in to access this area of CivicSense
            </p>
          </div>

          {/* Sign In Card */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                {redirectTo.startsWith('/admin') 
                  ? "This area requires admin permissions. Please sign in with an admin account."
                  : "Please sign in to continue to your requested page."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setShowAuthDialog(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium rounded-full px-8 py-3 h-auto"
              >
                Sign In to Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {redirectTo !== '/dashboard' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  After signing in, you'll be redirected to: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{redirectTo}</code>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account? You can sign up using the dialog above.
            </p>
          </div>

        </div>
      </main>
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="sign-in"
      />
    </div>
  )
} 