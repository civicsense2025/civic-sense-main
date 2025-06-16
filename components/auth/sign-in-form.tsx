"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { GoogleOAuthButton } from "./google-oauth-button"
import { useToast } from "@/hooks/use-toast"
import { useAnalytics } from "@/utils/analytics"

interface SignInFormProps {
  onSuccess: () => void
  onResetPassword: () => void
}

export function SignInForm({ onSuccess, onResetPassword }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { trackAuth } = useAnalytics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Track successful login
        trackAuth.userLogin({
          login_method: 'email',
          source: 'direct'
        })
        
        toast({
          title: "Welcome back! 👋",
          description: "You've successfully signed in to CivicSense.",
          variant: "default",
        })
        onSuccess()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = () => {
    // Track successful Google login
    trackAuth.userLogin({
      login_method: 'google',
      source: 'direct'
    })
    
    toast({
      title: "Welcome! 🎉",
      description: "You've successfully signed in with Google.",
      variant: "default",
    })
    onSuccess()
  }

  return (
    <div className="space-y-8">
      {/* Google Sign In */}
      <GoogleOAuthButton 
        onSuccess={handleGoogleSuccess}
        onError={setError}
        variant="sign-in"
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-slate-950 px-4 text-slate-600 dark:text-slate-400 font-light">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <Input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <Input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {/* Forgot password link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onResetPassword}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
        >
          Forgot your password?
        </button>
      </div>
    </div>
  )
}
