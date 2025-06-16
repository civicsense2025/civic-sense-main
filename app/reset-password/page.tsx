"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if user is already authenticated
  useEffect(() => {
    if (user && !searchParams.has("code")) {
      router.push("/dashboard")
    }
  }, [user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        toast({
          title: "Password updated",
          description: "Your password has been successfully reset",
          variant: "default",
        })
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-950 rounded-xl shadow-lg p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight mb-2">
              Reset Your Password
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              Enter your new password below
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Password Updated
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your password has been reset successfully. You'll be redirected to the dashboard shortly.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 