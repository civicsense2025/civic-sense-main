"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordResetFormProps {
  onBack: () => void
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        toast({
          title: "Password reset email sent",
          description: "Check your inbox for a password reset link",
          variant: "default",
        })
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to sign in
      </button>
      
      {isSuccess ? (
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Check your email
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <div className="pt-4">
            <Button
              onClick={onBack}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
            >
              Return to sign in
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

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                placeholder="your@email.com"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </>
      )}
    </div>
  )
} 