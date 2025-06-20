"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GoogleClassroomSyncDialog } from '@/components/integrations/google-classroom-sync-dialog'
import { School, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export default function TestClassroomSetup() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated' | 'error'>('checking')
  const [authMessage, setAuthMessage] = useState('')
  const [urlParams, setUrlParams] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search)
    const paramObj: { [key: string]: string } = {}
    params.forEach((value, key) => {
      paramObj[key] = value
    })
    setUrlParams(paramObj)

    // Check authentication status
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setAuthStatus('checking')
      const response = await fetch('/api/integrations/classroom/test-auth')
      const data = await response.json()

      if (response.ok && data.authenticated) {
        setAuthStatus('authenticated')
        setAuthMessage(data.message)
      } else {
        setAuthStatus('not_authenticated')
        setAuthMessage(data.message || 'Not authenticated')
      }
    } catch (error) {
      setAuthStatus('error')
      setAuthMessage('Failed to check authentication status')
      console.error('Auth check error:', error)
    }
  }

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'authenticated':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'not_authenticated':
        return <School className="h-5 w-5 text-blue-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-600 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (authStatus) {
      case 'authenticated':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'not_authenticated':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Google Classroom Integration Test
          </h1>
          <p className="text-gray-600">
            Test the Google Classroom authentication and sync functionality
          </p>
        </div>

        {/* URL Parameters Display */}
        {Object.keys(urlParams).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">URL Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(urlParams).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {key}
                  </code>
                  <Badge variant={key === 'error' ? 'destructive' : 'secondary'}>
                    {value}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
              {authStatus === 'checking' && 'Checking...'}
              {authStatus === 'authenticated' && 'Authenticated'}
              {authStatus === 'not_authenticated' && 'Not Authenticated'}
              {authStatus === 'error' && 'Error'}
            </div>
            
            {authMessage && (
              <p className="mt-2 text-sm text-gray-600">
                {authMessage}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={checkAuthStatus}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Refresh Status
              </button>

              <GoogleClassroomSyncDialog
                onPodCreated={(podId) => {
                  console.log('Pod created:', podId)
                  alert(`Pod created successfully! ID: ${podId}`)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <School className="h-4 w-4 inline mr-2" />
                Sync with Google Classroom
              </GoogleClassroomSyncDialog>
            </div>
          </CardContent>
        </Card>

        {/* Success/Error Messages from OAuth */}
        {urlParams.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully authenticated with Google Classroom! You can now sync your courses.
            </AlertDescription>
          </Alert>
        )}

        {urlParams.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Authentication failed: {urlParams.error}
            </AlertDescription>
          </Alert>
        )}

        {urlParams.google_classroom_auth === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Returned from Google authentication successfully! The sync dialog should open automatically.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to Test</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Sync with Google Classroom" button</li>
              <li>If not authenticated, you'll be redirected to Google OAuth</li>
              <li>After authentication, you'll return to this page</li>
              <li>The sync dialog should open automatically</li>
              <li>You should see your Google Classroom courses</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 