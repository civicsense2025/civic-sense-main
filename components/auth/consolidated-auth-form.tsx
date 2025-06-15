"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAnalytics } from "@/utils/analytics"

interface ConsolidatedAuthFormProps {
  onSuccess: () => void
  initialMode?: 'sign-in' | 'sign-up'
}

export function ConsolidatedAuthForm({ onSuccess, initialMode = 'sign-in' }: ConsolidatedAuthFormProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode)
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
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
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
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
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
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      } else {
        // Google OAuth redirect will happen here, 
        // the success tracking will happen when the user returns
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Google Sign In/Up */}
      <Button 
        onClick={handleGoogleAuth}
        variant="outline" 
        className="w-full h-12 flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        <span className="text-slate-900 dark:text-slate-100">
          {mode === 'sign-in' ? 'Sign in with Google' : 'Sign up with Google'}
        </span>
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-slate-950 px-4 text-slate-600 dark:text-slate-400 font-light">
            or {mode === 'sign-in' ? 'sign in with email' : 'sign up with email'}
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
          <Label htmlFor="auth-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="••••••••"
            minLength={mode === 'sign-up' ? 6 : undefined}
          />
          {mode === 'sign-up' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              Minimum 6 characters
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
        >
          {isLoading 
            ? (mode === 'sign-in' ? "Signing in..." : "Creating account...") 
            : (mode === 'sign-in' ? "Sign In" : "Create Account")}
        </Button>
      </form>

      {/* Mode switcher */}
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {mode === 'sign-in' ? "Don't have an account?" : "Already have an account?"}
          {' '}
          <button
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setError(null)
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {mode === 'sign-in' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      {/* Terms notice for sign up */}
      {mode === 'sign-up' && (
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-xs mx-auto">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      )}

      {/* Forgot password link for sign in */}
      {mode === 'sign-in' && (
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Forgot your password? We'll add password reset soon.
          </p>
        </div>
      )}
    </div>
  )
} 