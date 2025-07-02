"use client"

import { useState, useEffect } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Input } from '@civicsense/ui-web/components/ui/input'
import { Label } from '@civicsense/ui-web/components/ui/label'
import { Separator } from '@civicsense/ui-web/components/ui/separator'
import { 
  Activity, 
  Users, 
  Wifi, 
  WifiOff, 
  Crown, 
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Loader2
} from 'lucide-react'
import { useAuth } from '@civicsense/ui-web/components/auth/auth-provider'
import { useGuestAccess } from '@civicsense/shared/hooks/useGuestAccess'
import { useConnection } from '@civicsense/ui-web/components/providers/connection-provider'
import { useEnhancedMultiplayerRoom } from '@civicsense/shared/hooks/useEnhancedMultiplayerRoom'
import { multiplayerOperations } from '@civicsense/shared/lib/multiplayer'
import { useToast } from '@civicsense/shared/hooks/use-toast'

// Force dynamic rendering since this page uses client-side providers
export const dynamic = 'force-dynamic'

export default function HeartbeatTestPage() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  
  // Handle connection provider not being available during SSR
  let connection
  try {
    connection = useConnection().connection
  } catch (error) {
    // Fallback connection object for SSR/build time
    connection = {
      status: 'offline' as const,
      quality: 'poor' as const,
      latency: 0,
      reconnectAttempts: 0,
      lastConnected: null
    }
  }
  
  const { toast } = useToast()
  
  const [testRoomId, setTestRoomId] = useState('')
  const [testingHeartbeat, setTestingHeartbeat] = useState(false)
  const [heartbeatResult, setHeartbeatResult] = useState<any>(null)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  
  // Enhanced multiplayer room hook for testing
  const enhancedRoom = testRoomId ? useEnhancedMultiplayerRoom({ 
    roomId: testRoomId,
    autoReconnect: true,
    heartbeatInterval: 3000 // 3 seconds for testing
  }) : null

  const currentUserId = user?.id || getOrCreateGuestToken()

  // Test heartbeat API
  const testHeartbeatAPI = async () => {
    if (!testRoomId || !currentUserId) {
      toast({
        title: "Missing data",
        description: "Please enter a room ID and ensure you're logged in.",
        variant: "destructive"
      })
      return
    }

    setTestingHeartbeat(true)
    try {
      const response = await fetch('/api/multiplayer/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          roomId: testRoomId,
          userId: currentUserId,
          connectionLatency: connection.latency,
          connectionQuality: connection.quality
        })
      })

      const result = await response.json()
      setHeartbeatResult(result)
      
      if (result.success) {
        toast({
          title: "Heartbeat successful",
          description: "Player heartbeat updated successfully."
        })
      } else {
        toast({
          title: "Heartbeat failed",
          description: result.error || "Unknown error",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "API Error",
        description: "Failed to call heartbeat API",
        variant: "destructive"
      })
    } finally {
      setTestingHeartbeat(false)
    }
  }

  // Test host migration
  const testHostMigration = async () => {
    if (!testRoomId) return

    try {
      const response = await fetch('/api/multiplayer/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_host_migration',
          roomId: testRoomId
        })
      })

      const result = await response.json()
      setMigrationResult(result)
      
      toast({
        title: "Host migration check complete",
        description: result.message
      })
    } catch (error) {
      toast({
        title: "Migration test failed",
        description: "Failed to test host migration",
        variant: "destructive"
      })
    }
  }

  // Test cleanup
  const testCleanup = async (dryRun: boolean = true) => {
    try {
      const response = await fetch('/api/multiplayer/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cleanup_inactive',
          inactiveThresholdMinutes: 1, // 1 minute for testing
          dryRun
        })
      })

      const result = await response.json()
      setCleanupResult(result)
      
      toast({
        title: dryRun ? "Cleanup preview complete" : "Cleanup complete",
        description: result.message
      })
    } catch (error) {
      toast({
        title: "Cleanup test failed",
        description: "Failed to test cleanup",
        variant: "destructive"
      })
    }
  }

  // Test health endpoint
  const testHealth = async () => {
    try {
      const response = await fetch('/api/multiplayer/heartbeat?action=health')
      const result = await response.json()
      setHealthStatus(result)
      
      toast({
        title: "Health check complete",
        description: `Status: ${result.status}`
      })
    } catch (error) {
      toast({
        title: "Health check failed",
        description: "Failed to check system health",
        variant: "destructive"
      })
    }
  }

  // Auto-run health check on load
  useEffect(() => {
    testHealth()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Heartbeat System Test</h1>
        <p className="text-muted-foreground">
          Test the comprehensive heartbeat system for multiplayer stability and connection management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={connection.status === 'online' ? 'default' : 'destructive'}>
                {connection.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Quality:</span>
              <Badge variant={
                connection.quality === 'excellent' ? 'default' :
                connection.quality === 'good' ? 'secondary' : 'destructive'
              }>
                {connection.quality}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Latency:</span>
              <span className="font-mono">{connection.latency}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reconnect attempts:</span>
              <span className="font-mono">{connection.reconnectAttempts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last connected:</span>
              <span className="text-sm">
                {connection.lastConnected?.toLocaleTimeString() || 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                    {healthStatus.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active rooms:</span>
                  <span className="font-mono">{healthStatus.activeRooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last check:</span>
                  <span className="text-sm">
                    {new Date(healthStatus.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Checking health...</p>
              </div>
            )}
            <Button onClick={testHealth} className="w-full" size="sm">
              Refresh Health Check
            </Button>
          </CardContent>
        </Card>

        {/* Test Room Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Test Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="room-id">Room ID (UUID)</Label>
              <Input
                id="room-id"
                placeholder="Enter room ID to test..."
                value={testRoomId}
                onChange={(e) => setTestRoomId(e.target.value)}
              />
            </div>
            
            {enhancedRoom && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium">Enhanced Room Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Connected:</span>
                    <Badge variant={enhancedRoom.isConnected ? 'default' : 'destructive'}>
                      {enhancedRoom.isConnected ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection Status:</span>
                    <Badge>{enhancedRoom.connectionStatus}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Is Host:</span>
                    <Badge variant={enhancedRoom.isHost ? 'default' : 'secondary'}>
                      {enhancedRoom.isHost ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span>{enhancedRoom.players.length}</span>
                  </div>
                  {enhancedRoom.error && (
                    <div className="text-red-600 text-xs">
                      Error: {enhancedRoom.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heartbeat Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Heartbeat Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testHeartbeatAPI} 
              disabled={testingHeartbeat || !testRoomId}
              className="w-full"
            >
              {testingHeartbeat ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Heartbeat API'
              )}
            </Button>
            
            {heartbeatResult && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h5 className="font-medium mb-2">Heartbeat Result:</h5>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(heartbeatResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Host Migration Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Host Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testHostMigration} 
              disabled={!testRoomId}
              className="w-full"
            >
              Test Host Migration
            </Button>
            
            {migrationResult && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h5 className="font-medium mb-2">Migration Result:</h5>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(migrationResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cleanup Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => testCleanup(true)} 
                variant="outline"
                size="sm"
              >
                Preview Cleanup
              </Button>
              <Button 
                onClick={() => testCleanup(false)} 
                variant="destructive"
                size="sm"
              >
                Run Cleanup
              </Button>
            </div>
            
            {cleanupResult && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h5 className="font-medium mb-2">Cleanup Result:</h5>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(cleanupResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">How to test the heartbeat system:</h4>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
              <li>Enter a valid room ID (UUID format) in the Test Room section</li>
              <li>Click "Test Heartbeat API" to manually send a heartbeat update</li>
              <li>Monitor the Enhanced Room Status to see real-time connection state</li>
              <li>Test host migration by clicking "Test Host Migration"</li>
              <li>Use "Preview Cleanup" to see what inactive players would be removed</li>
              <li>Monitor the Connection Status for quality and latency updates</li>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium">Features being tested:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
              <li>5-second heartbeat intervals for player presence tracking</li>
              <li>Automatic host migration when current host becomes inactive</li>
              <li>Connection quality monitoring with latency tracking</li>
              <li>Inactive player cleanup with configurable thresholds</li>
              <li>Real-time connection status updates</li>
              <li>Automatic reconnection on connection loss</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 