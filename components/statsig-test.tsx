'use client'

import React from 'react'
import { useStatsig, useFeatureFlag } from '@/components/providers/statsig-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function StatsigTest() {
  const { isReady, hasError, logEvent, client } = useStatsig()
  const testFlag = useFeatureFlag('test_feature')

  const handleTestEvent = () => {
    logEvent('test_event', 1, { source: 'test_component' })
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Statsig Integration Test
          <Badge variant={isReady ? 'default' : hasError ? 'destructive' : 'secondary'}>
            {isReady ? 'Ready' : hasError ? 'Error' : 'Loading'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test the Statsig integration status and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <strong>Client Status:</strong> {isReady ? '✅ Connected' : hasError ? '❌ Error' : '⏳ Initializing'}
          </div>
          <div className="text-sm">
            <strong>Test Feature Flag:</strong> {testFlag.isEnabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
          <div className="text-sm">
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </div>
          <div className="text-sm">
            <strong>Client Key:</strong> {process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ? '✅ Set' : '❌ Missing'}
          </div>
        </div>
        
        <Button 
          onClick={handleTestEvent} 
          disabled={!isReady}
          className="w-full"
        >
          Test Event Logging
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground">
            Check browser console for debug logs
          </div>
        )}
      </CardContent>
    </Card>
  )
} 