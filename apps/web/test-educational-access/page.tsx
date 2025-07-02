"use client"

import { useState } from "react"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@civicsense/ui-web/components/ui/card"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Input } from "@civicsense/ui-web/components/ui/input"
import { Label } from "@civicsense/ui-web/components/ui/label"
import { Badge } from "@civicsense/ui-web/components/ui/badge"
import { Alert, AlertDescription } from "@civicsense/ui-web/components/ui/alert"
import { GraduationCap, Check, X, User, Mail } from "lucide-react"
import { premiumUtils } from "@civicsense/shared/lib/premium"
import { EducationalAccessChecker } from "@civicsense/ui-web/components/educational-access-checker"

export default function TestEducationalAccessPage() {
  const { user } = useAuth()
  const [testEmail, setTestEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTestEducationalAccess = async () => {
    if (!user) {
      setError("You must be logged in to test educational access")
      return
    }

    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/auth/grant-educational-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: testEmail || user.email,
          emailConfirmed: true // Force confirmed for testing
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`Success: ${data.message}`)
      } else {
        setError(`Error: ${data.error}`)
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmailValidation = () => {
    const emailToTest = testEmail || user?.email || ""
    const isEdu = premiumUtils.isEducationalEmail(emailToTest)
    const domain = premiumUtils.getEmailDomain(emailToTest)
    
    setResult(`Email: ${emailToTest}\nIs .edu: ${isEdu}\nDomain: ${domain}`)
    setError(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You must be logged in to test educational access functionality.
            </p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-light text-slate-900 dark:text-white">
              Educational Access Testing
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Test the automatic premium access system for .edu email addresses
          </p>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Current User</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  User ID
                </Label>
                <p className="text-sm font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                  {user.id}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <div className="flex items-center space-x-2">
                  <p className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded border flex-1">
                    {user.email || 'No email'}
                  </p>
                  {user.email && (
                    <Badge variant={premiumUtils.isEducationalEmail(user.email) ? "default" : "secondary"}>
                      {premiumUtils.isEducationalEmail(user.email) ? (
                        <><Check className="h-3 w-3 mr-1" /> .edu</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Not .edu</>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Confirmed
                </Label>
                <p className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                  {user.email_confirmed_at ? (
                    <span className="text-green-600 font-medium">
                      ✓ Confirmed at {new Date(user.email_confirmed_at).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      ⚠ Not confirmed
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Created At
                </Label>
                <p className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Validation Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Validation Testing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Test Email (leave empty to use your current email)
              </Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="flex-1"
                />
                <Button
                  onClick={handleTestEmailValidation}
                  variant="outline"
                >
                  Test Validation
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Common .edu Examples
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'student@harvard.edu',
                  'faculty@stanford.edu',
                  'researcher@mit.edu',
                  'user@university.edu'
                ].map((email) => (
                  <Button
                    key={email}
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestEmail(email)}
                    className="text-xs"
                  >
                    {email}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Educational Access Checker Component */}
        <EducationalAccessChecker />

        {/* Results */}
        {(result || error) && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {result && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">
                    {result}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Email Validation Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Enter an email address in the test field (or use your current email)</li>
                <li>Click "Test Validation" to see if it's detected as a .edu email</li>
                <li>Try the example .edu emails to see how the validation works</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Educational Access Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Set a test email (or use your current email)</li>
                <li>Click "Test Educational Access Grant" to simulate the automatic grant process</li>
                <li>Check your subscription status in the dashboard to see if premium access was granted</li>
                <li>Look at the browser console for detailed logs about the process</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Manual Testing:</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You can also test by visiting: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/api/auth/grant-educational-access?userId={user.id}&userEmail=test@university.edu</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 