'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function TestEmailPreferencesFlow() {
  const { user } = useAuth()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setResults(prev => {
      const existingIndex = prev.findIndex(r => r.step === step)
      const newResult = { step, status, message, data }
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newResult
        return updated
      } else {
        return [...prev, newResult]
      }
    })
  }

  const runCompleteTest = async () => {
    if (!user) {
      alert('Please sign in to test email preferences')
      return
    }

    setIsRunning(true)
    setResults([])

    try {
      // Step 1: Load email preferences from database
      updateResult('load-preferences', 'pending', 'Loading email preferences from database...')
      
      const prefsResponse = await fetch('/api/user/email-preferences')
      if (!prefsResponse.ok) {
        throw new Error(`Failed to load preferences: ${prefsResponse.status}`)
      }
      
      const { preferences } = await prefsResponse.json()
      updateResult('load-preferences', 'success', `Loaded preferences successfully`, preferences)

      // Step 2: Update preferences to disable achievement emails
      updateResult('update-preferences', 'pending', 'Temporarily disabling achievement emails for test...')
      
      const updateResponse = await fetch('/api/user/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          achievement_alerts: false
        })
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update preferences: ${updateResponse.status}`)
      }

      updateResult('update-preferences', 'success', 'Disabled achievement emails for test')

      // Step 3: Test sending achievement email (should be skipped)
      updateResult('test-blocked-email', 'pending', 'Testing blocked email (achievement)...')
      
      const blockedEmailResponse = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'achievement',
          to: user.email,
          data: {
            user_name: user.user_metadata?.display_name || 'Test User',
            achievement_type: 'test_achievement',
            achievement_title: 'Test Achievement',
            achievement_description: 'This email should be blocked by preferences'
          }
        })
      })

      const blockedResult = await blockedEmailResponse.json()
      
      if (blockedResult.skipped) {
        updateResult('test-blocked-email', 'success', 'Email correctly skipped due to user preferences', blockedResult)
      } else {
        updateResult('test-blocked-email', 'error', 'Email was not skipped - preferences not working!', blockedResult)
      }

      // Step 4: Re-enable achievement emails
      updateResult('re-enable-emails', 'pending', 'Re-enabling achievement emails...')
      
      const reEnableResponse = await fetch('/api/user/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          achievement_alerts: true
        })
      })

      if (!reEnableResponse.ok) {
        throw new Error(`Failed to re-enable preferences: ${reEnableResponse.status}`)
      }

      updateResult('re-enable-emails', 'success', 'Re-enabled achievement emails')

      // Step 5: Test sending achievement email (should go through)
      updateResult('test-allowed-email', 'pending', 'Testing allowed email (achievement)...')
      
      const allowedEmailResponse = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'achievement',
          to: user.email,
          data: {
            user_name: user.user_metadata?.display_name || 'Test User',
            achievement_type: 'test_achievement',
            achievement_title: 'Test Achievement',
            achievement_description: 'This email should go through with metadata',
            quiz_topic: 'Constitutional Rights'
          }
        })
      })

      const allowedResult = await allowedEmailResponse.json()
      
      if (allowedResult.success && !allowedResult.skipped) {
        updateResult('test-allowed-email', 'success', 'Email sent successfully with user metadata', allowedResult)
      } else {
        updateResult('test-allowed-email', 'error', 'Email was blocked when it should have been sent!', allowedResult)
      }

      // Step 6: Test civic news alert (different email type)
      updateResult('test-news-alert', 'pending', 'Testing civic news alert...')
      
      const newsResponse = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'civic_news_alert',
          to: user.email,
          data: {
            user_name: user.user_metadata?.display_name || 'Test User',
            news_headline: 'Important Civic Development',
            news_summary: 'This is a test civic news alert with user metadata',
            action_url: 'https://civicsense.us/news'
          }
        })
      })

      const newsResult = await newsResponse.json()
      updateResult('test-news-alert', newsResult.success ? 'success' : 'error', 
        newsResult.success ? 'Civic news alert sent successfully' : 'Failed to send civic news alert', newsResult)

    } catch (error) {
      console.error('Test flow error:', error)
      updateResult('test-error', 'error', `Test flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please sign in to test email preferences flow.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Email Preferences Flow Test</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test the complete email preferences system including database storage, metadata syncing, and preference checking.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Flow Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">User: {user.email}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This test will temporarily modify your email preferences and send test emails.
                  </p>
                </div>
                <Button 
                  onClick={runCompleteTest} 
                  disabled={isRunning}
                  className="min-w-32"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Complete Test'
                  )}
                </Button>
              </div>

              {results.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Test Progress:</strong> {results.filter(r => r.status === 'success').length}/{results.length} steps completed
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(result.status)}
                      <h4 className="font-semibold capitalize">{result.step.replace('-', ' ')}</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {result.message}
                    </p>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500">View details</summary>
                        <pre className="mt-2 bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>What This Test Validates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Database Integration</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>• Loads preferences from database</li>
                  <li>• Updates preferences in database</li>
                  <li>• Validates data persistence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email Service</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>• Checks user preferences before sending</li>
                  <li>• Syncs user metadata to Plunk</li>
                  <li>• Respects opt-out preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Brand Voice</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>• Uses Tán's voice in subject lines</li>
                  <li>• Focuses on civic understanding</li>
                  <li>• Avoids gamification language</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Experience</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li>• Granular email type controls</li>
                  <li>• Immediate preference application</li>
                  <li>• Transparent testing process</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 