"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

export default function DebugAuthPage() {
  const { user, isLoading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  const testAPIAuth = async () => {
    setIsTestingAPI(true)
    try {
      // First, let's check the client-side user authentication (secure method)
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Also get session for debugging purposes (tokens, etc.)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Client auth state before API call:', {
        hasUser: !!user,
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userError: userError?.message,
        sessionError: sessionError?.message
      })
      
      // Test the learning pods API endpoint with proper headers
      const response = await fetch('/api/learning-pods', {
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      let data
      const responseText = await response.text()
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText }
      }
      
      setTestResults({
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        clientAuth: {
          hasUser: !!user,
          hasSession: !!session,
          userEmail: user?.email,
          userError: userError?.message,
          sessionError: sessionError?.message,
          note: 'Using getUser() for auth validation, getSession() for debug info only'
        }
      })
    } catch (error) {
      setTestResults({
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  const testPodCreation = async () => {
    setIsTestingAPI(true)
    try {
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: 'Debug Test Pod',
          podType: 'classroom',
          description: 'Test pod for debugging',
          contentFilterLevel: 'moderate'
        })
      })
      
      const data = await response.json()
      
      setTestResults({
        type: 'POST_TEST',
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setTestResults({
        type: 'POST_TEST',
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Authentication Debug
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Test authentication state and API access
        </p>
      </div>

      <div className="grid gap-6">
        {/* Client-side Auth State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : user ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Client-side Authentication State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-slate-500">Loading:</span>
                <Badge variant={isLoading ? "default" : "secondary"}>
                  {isLoading ? "True" : "False"}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-slate-500">Has User:</span>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? "True" : "False"}
                </Badge>
              </div>
              {user && (
                <>
                  <div>
                    <span className="text-sm text-slate-500">User ID:</span>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Email:</span>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Email Verified:</span>
                    <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                      {user.email_confirmed_at ? "True" : "False"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Created:</span>
                    <p className="text-sm">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              API Authentication Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Test whether the server-side API can authenticate your session.
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={testAPIAuth} 
                disabled={isTestingAPI}
                variant="outline"
              >
                {isTestingAPI && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Test GET /api/learning-pods
              </Button>
              
              <Button 
                onClick={testPodCreation} 
                disabled={isTestingAPI}
                variant="outline"
              >
                {isTestingAPI && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Test POST /api/learning-pods
              </Button>
            </div>

            {testResults && (
              <Alert className={testResults.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={testResults.ok ? "default" : "destructive"}>
                        {testResults.status}
                      </Badge>
                      <span className="text-sm">
                        {testResults.type === 'POST_TEST' ? 'POST Request' : 'GET Request'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(testResults.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(testResults.data || testResults.error, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">If you see "Unauthorized" errors:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>Make sure you're signed in (check client-side auth state above)</li>
                <li>Try refreshing the page to reset authentication state</li>
                <li>Check if you have multiple browser tabs open (can cause auth conflicts)</li>
                <li>Clear browser cookies and sign in again</li>
                <li>Check browser developer tools console for additional error messages</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">If client shows user but API fails:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>Authentication cookies may not be sent properly</li>
                <li>Check for "Multiple GoTrueClient instances" warning in console</li>
                <li>Server-side Supabase client configuration issue</li>
                <li>Environment variables may be missing on server</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 