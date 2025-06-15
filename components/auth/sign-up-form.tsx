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

interface SignUpFormProps {
  onSuccess: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Track successful registration
        trackAuth.userRegistered({
          registration_method: 'email',
          source: 'direct'
        })
        
        toast({
          title: "Welcome to CivicSense! 🎉",
          description: "Your account has been created successfully. Check your email to verify your account.",
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
    // Track successful Google registration
    trackAuth.userRegistered({
      registration_method: 'google',
      source: 'direct'
    })
    
    toast({
      title: "Welcome to CivicSense! 🎉",
      description: "Your account has been created successfully with Google.",
      variant: "default",
    })
    onSuccess()
  }

  return (
    <div className="space-y-8">
      {/* Google Sign Up */}
      <GoogleOAuthButton 
        onSuccess={handleGoogleSuccess}
        onError={setError}
        variant="sign-up"
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-slate-950 px-4 text-slate-600 dark:text-slate-400 font-light">
            or sign up with email
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
          <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="••••••••"
            minLength={6}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Minimum 6 characters
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      {/* Terms notice */}
      <div className="text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-xs mx-auto">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
