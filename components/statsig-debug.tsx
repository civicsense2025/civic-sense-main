'use client'

import React, { useEffect, useState } from 'react'
import { useStatsig } from '@/components/providers/statsig-provider'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, RefreshCw } from 'lucide-react'

export function StatsigDebug() {
  const { user } = useAuth()
  const { client, isReady, hasError, logEvent } = useStatsig()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Collect debug information
    const info = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      clientKeySet: !!process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,
      clientKeyPrefix: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY?.substring(0, 10) + '...',
      userAuthenticated: !!user,
      userId: user?.id,
      statsigReady: isReady,
      statsigError: hasError,
      clientExists: !!client,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    }
    setDebugInfo(info)
  }, [user, isReady, hasError, client])

  const copyDebugInfo = async () => {
    if (debugInfo) {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const testStatsigConnection = () => {
    logEvent('debug_test', 1, { 
      timestamp: Date.now(),
      source: 'debug_component'
    })
  }

  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Statsig Debug Information
          <Badge variant={isReady ? 'default' : hasError ? 'destructive' : 'secondary'}>
            {isReady ? 'Connected' : hasError ? 'Error' : 'Initializing'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Comprehensive debugging information for Statsig integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Environment:</strong> {debugInfo?.environment}
          </div>
          <div>
            <strong>Client Key:</strong> {debugInfo?.clientKeySet ? '✅ Set' : '❌ Missing'}
          </div>
          <div>
            <strong>User Auth:</strong> {debugInfo?.userAuthenticated ? '✅ Authenticated' : '❌ Anonymous'}
          </div>
          <div>
            <strong>Statsig Client:</strong> {debugInfo?.clientExists ? '✅ Available' : '❌ Not Available'}
          </div>
        </div>

        {/* Error States */}
        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>
              Statsig client has encountered an error. Check the browser console for details.
            </AlertDescription>
          </Alert>
        )}

        {!debugInfo?.clientKeySet && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Missing Client Key:</strong> Add NEXT_PUBLIC_STATSIG_CLIENT_KEY to your environment variables.
            </AlertDescription>
          </Alert>
        )}

        {/* Network Test */}
        <div className="space-y-2">
          <h4 className="font-medium">Network Test</h4>
          <div className="flex gap-2">
            <Button 
              onClick={testStatsigConnection} 
              disabled={!isReady}
              size="sm"
            >
              Test Event Logging
            </Button>
            <Button 
              onClick={refreshPage} 
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Debug Information</h4>
            <Button 
              onClick={copyDebugInfo} 
              variant="outline" 
              size="sm"
              disabled={!debugInfo}
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Troubleshooting Steps */}
        <div className="space-y-2">
          <h4 className="font-medium">Troubleshooting Steps</h4>
          <div className="text-sm space-y-1">
            <div>1. Verify NEXT_PUBLIC_STATSIG_CLIENT_KEY is set in .env.local</div>
            <div>2. Check browser console for Statsig debug logs</div>
            <div>3. Verify network connectivity to Statsig servers</div>
            <div>4. Check if ad blockers are interfering</div>
            <div>5. Try refreshing the page</div>
          </div>
        </div>

        {/* Console Access */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <strong>Developer Console:</strong> Access the Statsig client via <code>window.__STATSIG__</code> in browser console
          </div>
        )}
      </CardContent>
    </Card>
  )
} 