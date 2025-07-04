"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button, Input, Label, Alert, AlertDescription, useToast } from "../../components/ui"
import { AlertCircle, CheckCircle, Lock } from "lucide-react"

// Replace stub with proper toast implementation
const { toast } = useToast()

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a hash in the URL, which indicates a valid reset link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    if (!hashParams.get('access_token')) {
      setError("Invalid or expired password reset link. Please request a new one.")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
          variant: "default",
        })
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-light text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Enter your new password below
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-slate-900 dark:text-white">
                Password reset successful
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                You will be redirected to the dashboard in a few seconds...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm new password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? "Updating password..." : "Reset password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
} 