"use client"

import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Loader2, User, School } from 'lucide-react'

export default function TestAuthFixPage() {
  const { user, isLoading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const testPodCreation = async () => {
    setIsTesting(true)
    try {
      console.log('Testing pod creation...')
      
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: 'Auth Fix Test Pod',
          podType: 'classroom',
          description: 'Testing authentication fixes',
          contentFilterLevel: 'moderate'
        })
      })
      
      const data = await response.json()
      
      setTestResults({
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      })
      
      if (response.ok) {
        console.log('✅ Pod creation successful!', data)
      } else {
        console.error('❌ Pod creation failed:', data)
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      console.error('❌ Test failed:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const testGoogleClassroomPodCreation = () => {
    window.location.href = '/create-pod-from-classroom'
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Authentication Fix Test
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Test that the authentication fixes work for pod creation
        </p>
      </div>

      <div className="space-y-6">
        {/* Auth Status */}
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
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-600 dark:text-slate-400">Loading authentication...</p>
            ) : user ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✅ Authenticated</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  User: {user.email}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ID: {user.id}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600 font-medium">❌ Not authenticated</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Please sign in to test pod creation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testPodCreation}
                disabled={!user || isTesting}
                className="flex-1"
              >
                {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <User className="h-4 w-4 mr-2" />
                Test Regular Pod Creation
              </Button>
              
              <Button 
                onClick={testGoogleClassroomPodCreation}
                disabled={!user}
                variant="outline"
                className="flex-1"
              >
                <School className="h-4 w-4 mr-2" />
                Test Google Classroom
              </Button>
            </div>

            {!user && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Sign in required to test pod creation
              </p>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={testResults.success ? "default" : "destructive"}>
                    {testResults.status || 'ERROR'}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(testResults.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {testResults.success ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                      ✅ Authentication Fix Successful!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Pod creation worked properly. The authentication session is now being transmitted correctly.
                    </p>
                    {testResults.data?.podId && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Created pod ID: {testResults.data.podId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                      ❌ Test Failed
                    </p>
                    <pre className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(testResults.data || testResults.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <strong>1. Test Regular Pod Creation:</strong> This will test the basic authentication flow for creating a regular learning pod.
              </p>
              <p>
                <strong>2. Test Google Classroom:</strong> This will navigate to the Google Classroom integration and test the full flow.
              </p>
              <p>
                <strong>Expected Result:</strong> Both tests should work without "Unauthorized" errors if the authentication fixes are successful.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 