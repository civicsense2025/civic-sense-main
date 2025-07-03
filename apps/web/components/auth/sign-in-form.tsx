"use client"

import { useState } from "react"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { supabase } from "../lib/supabase/client"
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle, Lock, Mail } from "lucide-react"
import { Checkbox } from './ui/checkbox'
import { useToast } from '@civicsense/ui-web'
import { GoogleOAuthButton } from "./google-oauth-button"

interface SignInFormProps {
  onSuccess: () => void
  onResetPassword: () => void
}

export function SignInForm({ onSuccess, onResetPassword }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else if (data?.user) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
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
    // The actual auth happens in GoogleOAuthButton
    // This is just for handling the callback
    onSuccess()
  }

  const handleRememberMeChange = (checked: boolean | string) => {
    // Ensure we always get a boolean value
    setRememberMe(checked === true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <GoogleOAuthButton 
        onSuccess={handleGoogleSuccess}
        onError={setError}
        variant="sign-in"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            tabIndex={1}
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </Label>
            <Button 
              type="button" 
              variant="link" 
              onClick={onResetPassword}
              className="text-xs text-blue-600 dark:text-blue-400 p-0 h-auto font-normal"
            >
              Forgot password?
            </Button>
          </div>
          <Input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            tabIndex={2}
            className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center space-x-3 py-2">
          <Checkbox
            id="signin-remember-me"
            checked={rememberMe}
            onCheckedChange={handleRememberMeChange}
            className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
            tabIndex={3}
          />
          <Label 
            htmlFor="signin-remember-me" 
            className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
          >
            Keep me signed in
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full h-14 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl transition-all duration-200 mt-6 shadow-lg hover:shadow-xl"
          tabIndex={4}
        >
          <Lock className="h-4 w-4 mr-2" />
          {isLoading ? "Signing in..." : "Sign in with email"}
        </Button>
      </form>
    </div>
  )
}
