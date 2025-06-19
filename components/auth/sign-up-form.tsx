"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, UserPlus, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleOAuthButton } from "./google-oauth-button"
import { cn } from "@/lib/utils"

interface SignUpFormProps {
  onSuccess: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showEmailTooltip, setShowEmailTooltip] = useState(false)
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false)
  const [showConfirmTooltip, setShowConfirmTooltip] = useState(false)
  const { toast } = useToast()

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email is required"
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return null
  }

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) return "Password must contain at least one special character"
    return null
  }

  // Password strength calculator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" }
    
    let score = 0
    if (password.length >= 8) score++
    if (/(?=.*[a-z])/.test(password)) score++
    if (/(?=.*[A-Z])/.test(password)) score++
    if (/(?=.*\d)/.test(password)) score++
    if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score++
    if (password.length >= 12) score++

    if (score <= 2) return { score, label: "Weak", color: "text-red-500" }
    if (score <= 4) return { score, label: "Fair", color: "text-yellow-500" }
    if (score <= 5) return { score, label: "Good", color: "text-blue-500" }
    return { score, label: "Strong", color: "text-green-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailError(validateEmail(value))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordError(validatePassword(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate email
    const emailValidationError = validateEmail(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      setError("Please fix the errors above")
      setIsLoading(false)
      return
    }

    // Validate password
    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setError("Please fix the errors above")
      setIsLoading(false)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Check terms agreement
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      } else if (data?.user) {
        if (data.session) {
          // User is signed in immediately (email confirmation not required)
          toast({
            title: "Account created!",
            description: "Welcome to CivicSense.",
            variant: "default",
          })
          onSuccess()
        } else {
          // Email confirmation required
          toast({
            title: "Verification email sent",
            description: "Please check your inbox to confirm your email address.",
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

  const handleGoogleSuccess = () => {
    // The actual auth happens in GoogleOAuthButton
    // This is just for handling the callback
    onSuccess()
  }

  // Show confirm password field only after password is typed
  const showConfirmPassword = password.length >= 8 && !passwordError

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
        variant="sign-up"
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
          <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <div className="relative">
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onFocus={() => setShowEmailTooltip(true)}
              onBlur={() => setShowEmailTooltip(false)}
              required
              className={`h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 ${
                emailError ? 'border-red-300 dark:border-red-700' : ''
              }`}
              placeholder="you@example.com"
            />
            {showEmailTooltip && !emailError && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-lg z-50 max-w-xs animate-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                <p className="text-xs font-space-mono font-light">
                  ✨ Pick the email you actually check. We'll need it for verification (and the occasional "hey, democracy is happening" reminder).
                </p>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
              <X className="w-3 h-3 mr-1" />
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => setShowPasswordTooltip(true)}
              onBlur={() => setShowPasswordTooltip(false)}
              required
              className={`h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 ${
                passwordError ? 'border-red-300 dark:border-red-700' : ''
              }`}
              placeholder="Strong password required"
            />
            {showPasswordTooltip && !password && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-lg z-50 max-w-sm animate-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                <p className="text-xs font-space-mono font-light">
                  🛡️ Time for a password that's harder to crack than your civic knowledge will be. Mix it up: letters, numbers, symbols—make hackers weep.
                </p>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
              </div>
            )}
          </div>
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
                <div className="flex space-x-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-1 rounded ${
                        i < passwordStrength.score 
                          ? passwordStrength.score <= 2 
                            ? 'bg-red-500' 
                            : passwordStrength.score <= 4 
                            ? 'bg-yellow-500' 
                            : passwordStrength.score <= 5 
                            ? 'bg-blue-500' 
                            : 'bg-green-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {[
                  { test: password.length >= 8, text: "At least 8 characters" },
                  { test: /(?=.*[a-z])/.test(password), text: "One lowercase letter" },
                  { test: /(?=.*[A-Z])/.test(password), text: "One uppercase letter" },
                  { test: /(?=.*\d)/.test(password), text: "One number" },
                  { test: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password), text: "One special character" }
                ].map((requirement, i) => (
                  <div key={i} className="flex items-center text-xs">
                    {requirement.test ? (
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <span className={requirement.test ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {passwordError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
              <X className="w-3 h-3 mr-1" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Progressive Disclosure: Confirm Password Field */}
        <div className={cn(
          "transition-all duration-300 ease-out overflow-hidden",
          showConfirmPassword 
            ? "max-h-96 opacity-100 translate-y-0" 
            : "max-h-0 opacity-0 -translate-y-4"
        )}>
          <div className="space-y-2 pt-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setShowConfirmTooltip(true)}
                onBlur={() => setShowConfirmTooltip(false)}
                required={showConfirmPassword}
                className={`h-12 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900 ${
                  confirmPassword && password !== confirmPassword ? 'border-red-300 dark:border-red-700' : ''
                }`}
                placeholder="Confirm your password"
              />
              {showConfirmTooltip && !confirmPassword && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-lg z-50 max-w-xs animate-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                  <p className="text-xs font-space-mono font-light">
                    🔄 Type it again, exactly. Yes, we're being extra cautious—democracy is worth the double-check.
                  </p>
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"></div>
                </div>
              )}
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1 animate-in slide-in-from-bottom-2">
                <X className="w-3 h-3 mr-1" />
                Passwords do not match
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1 animate-in slide-in-from-bottom-2">
                <Check className="w-3 h-3 mr-1" />
                Passwords match
              </p>
            )}
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="agree-terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            className="mt-1 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
            required
          />
          <Label 
            htmlFor="agree-terms" 
            className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer"
          >
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              tabIndex={-1}
            >
              Terms of Service
            </a>
            {" "}and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              tabIndex={-1}
            >
              Privacy Policy
            </a>
          </Label>
        </div>

        <Button
          type="submit"
          disabled={
            isLoading || 
            !email || 
            !password || 
            !confirmPassword ||
            !agreeToTerms ||
            emailError !== null ||
            passwordError !== null ||
            password !== confirmPassword
          }
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full transition-all duration-200 mt-2"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  )
}
