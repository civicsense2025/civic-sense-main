"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authHelpers } from "@/lib/supabase"

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
    setIsSuccess(false)

    try {
      const { error } = await authHelpers.resetPassword(email)
      
      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        toast({
          title: "Reset link sent!",
          description: "Check your email for instructions to reset your password.",
          variant: "default",
        })
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="text-4xl">✉️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Check your inbox
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={onBack} 
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-light"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
          
          <div className="text-center">
            <Button 
              type="button" 
              onClick={onBack}
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-light"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        </form>
      )}
    </div>
  )
} 