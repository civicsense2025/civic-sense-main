"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Home, RefreshCw } from "lucide-react"

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const message = searchParams.get('message')
    setErrorMessage(message || 'An authentication error occurred')
  }, [searchParams])

  const handleRetry = () => {
    router.push('/')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  // Clean up error message for better display
  const getCleanErrorMessage = (message: string) => {
    if (message.includes('both auth code and code verifier should be non-empty')) {
      return 'Google Sign-In temporarily unavailable. Please try again or use email sign-in.'
    }
    if (message.includes('invalid request')) {
      return 'Authentication request failed. Please try signing in again.'
    }
    return message
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal error display with lots of whitespace */}
        <div className="text-center space-y-8 py-16">
          
          {/* Large error icon */}
          <div className="text-6xl">⚠️</div>

          {/* Clean typography */}
          <div className="space-y-4">
            <h1 className="text-2xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
              Authentication Error
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-light">
              There was a problem signing you in
            </p>
          </div>

          {/* Error message */}
          <div className="space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-light">
                {getCleanErrorMessage(errorMessage)}
              </AlertDescription>
            </Alert>

            {/* Helpful suggestions */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 font-light">
              <p className="mb-4">This could be due to:</p>
              <div className="space-y-2 text-xs">
                <p>• Network connectivity issues</p>
                <p>• Authentication service temporarily unavailable</p>
                <p>• Browser security settings</p>
                <p>• Account access restrictions</p>
              </div>
            </div>
          </div>

          {/* Minimal action buttons */}
          <div className="space-y-3 pt-8">
            <Button 
              onClick={handleRetry}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleGoHome}
              className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium rounded-full transition-all duration-200"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 