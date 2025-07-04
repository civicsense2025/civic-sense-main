"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { AlertTriangle, TrendingUp, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useStatsig } from '@/components/providers/statsig-provider'

interface AnalyticsDebugPanelProps {
  className?: string
}

// Simulated analytics usage data (in real app, this would come from Statsig API)
interface AnalyticsUsage {
  totalEvents: number
  eventsUsed: number
  highPriorityEvents: number
  mediumPriorityEvents: number
  lowPriorityEvents: number
  estimatedDailyUsage: number
  daysRemaining: number
  samplingEnabled: boolean
  eventsSkipped: number
}

// Network status interface
interface NetworkStatus {
  isOnline: boolean
  statsigReachable: boolean
  lastSuccessfulConnection: Date | null
  connectionAttempts: number
  lastError: string | null
}

export function AnalyticsDebugPanel({ className }: AnalyticsDebugPanelProps) {
  const { isReady, hasError, logEvent } = useStatsig()
  const [usage, setUsage] = useState<AnalyticsUsage>({
    totalEvents: 100000,
    eventsUsed: 23456,
    highPriorityEvents: 8234,
    mediumPriorityEvents: 12456,
    lowPriorityEvents: 2766,
    estimatedDailyUsage: 3200,
    daysRemaining: 24,
    samplingEnabled: true,
    eventsSkipped: 5432
  })

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    statsigReachable: false,
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    lastError: null
  })

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, isOnline: false }))

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Test Statsig connectivity
  const testStatsigConnection = async () => {
    setNetworkStatus(prev => ({ 
      ...prev, 
      connectionAttempts: prev.connectionAttempts + 1,
      lastError: null 
    }))

    try {
      // Test basic connectivity to Statsig's CDN
      const response = await fetch('https://api.statsig.com/v1/initialize', {
        method: 'HEAD',
        mode: 'no-cors'
      })
      
      setNetworkStatus(prev => ({
        ...prev,
        statsigReachable: true,
        lastSuccessfulConnection: new Date(),
        lastError: null
      }))
    } catch (error) {
      console.error('Statsig connectivity test failed:', error)
      setNetworkStatus(prev => ({
        ...prev,
        statsigReachable: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  // Test connectivity on mount
  useEffect(() => {
    testStatsigConnection()
  }, [])

  const usagePercentage = (usage.eventsUsed / usage.totalEvents) * 100
  const projectedUsage = usage.eventsUsed + (usage.estimatedDailyUsage * usage.daysRemaining)

  const toggleSampling = () => {
    setUsage(prev => ({ ...prev, samplingEnabled: !prev.samplingEnabled }))
  }

  // Status indicators
  const statsigStatus = isReady ? 'connected' : hasError ? 'error' : 'connecting'
  const statsigStatusColor = {
    connected: 'bg-green-500',
    error: 'bg-red-500',
    connecting: 'bg-yellow-500'
  }[statsigStatus]

  const samplingStatus = usage.samplingEnabled 
    ? { text: 'Active', color: 'bg-blue-500' }
    : { text: 'Disabled', color: 'bg-gray-500' }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Analytics Debug Panel
          <div className="flex items-center gap-2 ml-auto">
            {networkStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={testStatsigConnection}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statsigStatusColor}`} />
              <span className="text-sm font-medium">Statsig: {statsigStatus}</span>
            </div>
            {hasError && (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">Network: {networkStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Network Diagnostics */}
        {(hasError || !networkStatus.statsigReachable) && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Connection Issues Detected
              </span>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
              <p><strong>Status:</strong> {hasError ? 'Statsig initialization failed' : 'Network connectivity issues'}</p>
              <p><strong>Attempts:</strong> {networkStatus.connectionAttempts}</p>
              {networkStatus.lastError && (
                <p><strong>Last Error:</strong> {networkStatus.lastError}</p>
              )}
              {networkStatus.lastSuccessfulConnection && (
                <p><strong>Last Success:</strong> {networkStatus.lastSuccessfulConnection.toLocaleTimeString()}</p>
              )}
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Check internet connection</li>
                <li>Verify NEXT_PUBLIC_STATSIG_CLIENT_KEY is set</li>
                <li>Check if corporate firewall blocks api.statsig.com</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          </div>
        )}

        {/* Usage Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Event Usage</span>
            <span className="text-xs text-gray-500">
              {usage.eventsUsed.toLocaleString()} / {usage.totalEvents.toLocaleString()}
            </span>
          </div>
          
          <Progress value={usagePercentage} className="h-2" />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-green-600">{usage.highPriorityEvents.toLocaleString()}</div>
              <div className="text-gray-500">High Priority</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600">{usage.mediumPriorityEvents.toLocaleString()}</div>
              <div className="text-gray-500">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">{usage.lowPriorityEvents.toLocaleString()}</div>
              <div className="text-gray-500">Low Priority</div>
            </div>
          </div>
        </div>

        {/* Sampling Status */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${samplingStatus.color}`} />
            <span className="text-sm font-medium">Sampling: {samplingStatus.text}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {usage.eventsSkipped.toLocaleString()} events skipped
          </Badge>
        </div>

        {/* Projection Warning */}
        {projectedUsage > usage.totalEvents && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-700 dark:text-red-300">
              Projected to exceed limit by {((projectedUsage - usage.totalEvents) / 1000).toFixed(0)}k events
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSampling}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            {usage.samplingEnabled ? 'Disable' : 'Enable'} Sampling
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => window.open('https://console.statsig.com', '_blank')}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Statsig Console
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={testStatsigConnection}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Test Connection
          </Button>
        </div>

        {/* Configuration Info */}
        <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Environment:</span>
            <span>{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span>Client Key:</span>
            <span>{process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ? 'Configured' : 'Missing'}</span>
          </div>
          <div className="flex justify-between">
            <span>SDK Version:</span>
            <span>3.18.0</span>
          </div>
          <div className="flex justify-between">
            <span>Daily Estimate:</span>
            <span>{usage.estimatedDailyUsage.toLocaleString()} events</span>
          </div>
          <div className="flex justify-between">
            <span>Days Remaining:</span>
            <span className={usage.daysRemaining < 7 ? 'text-red-500 font-medium' : ''}>
              {usage.daysRemaining} days
            </span>
          </div>
        </div>

        {/* Test Event Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => {
            logEvent('debug_panel_test', 1, { 
              timestamp: new Date().toISOString(),
              source: 'debug_panel'
            })
          }}
        >
          Send Test Event
        </Button>
      </CardContent>
    </Card>
  )
} 