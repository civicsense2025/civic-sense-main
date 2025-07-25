"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { authHelpers } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface GoogleOAuthButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  variant?: "sign-in" | "sign-up"
}

export function GoogleOAuthButton({ 
  onSuccess, 
  onError, 
  className, 
  variant = "sign-in" 
}: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await authHelpers.signInWithGoogle()
      
      if (error) {
        const errorMessage = error.message || "Failed to sign in with Google"
        setError(errorMessage)
        onError?.(errorMessage)
      } else {
        onSuccess?.()
      }
    } catch (err) {
      const errorMessage = "An unexpected error occurred"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`
          w-full h-12 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 
          border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 
          font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md
          ${className}
        `}
      >
        <div className="flex items-center justify-center space-x-3">
          {/* Google Logo SVG */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          
          <span>
            {isLoading 
              ? "Connecting..." 
              : variant === "sign-up" 
                ? "Continue with Google" 
                : "Sign in with Google"
            }
          </span>
        </div>
      </Button>
    </div>
  )
} 