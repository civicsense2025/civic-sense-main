"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { multiplayerOperations } from "@/lib/multiplayer"

export default function TestRoomManagementPage() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (result: any) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }])
  }

  const testRoomCleanup = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Testing room cleanup...' })

    try {
      const response = await fetch('/api/multiplayer/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (response.ok) {
        addResult({ 
          type: 'success', 
          message: `✅ Cleanup successful: ${data.cleanedRooms} rooms, ${data.cleanedPlayers} players`,
          details: data 
        })
      } else {
        addResult({ 
          type: 'error', 
          message: `❌ Cleanup failed: ${data.error}`,
          details: data 
        })
      }
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: 'Failed to call cleanup endpoint',
        details: error 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testUserRooms = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Testing user rooms loading...' })

    try {
      const guestToken = user ? undefined : getOrCreateGuestToken()
      const rooms = await multiplayerOperations.getUserRooms(user?.id, guestToken)
      
      addResult({ 
        type: 'success', 
        message: `✅ Found ${rooms.length} user rooms`,
        details: rooms.map(r => ({
          room_code: r.room.room_code,
          room_status: r.room.room_status,
          game_mode: r.room.game_mode,
          is_host: r.player.is_host,
          topic_title: r.topic?.topic_title
        }))
      })
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: 'Failed to load user rooms',
        details: error 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectCleanup = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Testing direct cleanup operation...' })

    try {
      const result = await multiplayerOperations.cleanupExpiredRooms()
      
      addResult({ 
        type: 'success', 
        message: `✅ Direct cleanup: ${result.cleanedRooms} rooms, ${result.cleanedPlayers} players`,
        details: result 
      })
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: 'Direct cleanup failed',
        details: error 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  const getColorClass = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Room Management Test</h1>
        <p className="text-lg text-muted-foreground">
          Test room cleanup and user room loading functionality
        </p>
        
        {user ? (
          <Badge variant="default">Logged in as {user.email}</Badge>
        ) : (
          <Badge variant="secondary">Guest user</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button 
          onClick={testRoomCleanup} 
          disabled={isLoading}
          className="h-12"
        >
          Test API Cleanup
        </Button>
        <Button 
          onClick={testDirectCleanup} 
          disabled={isLoading}
          className="h-12"
        >
          Test Direct Cleanup
        </Button>
        <Button 
          onClick={testUserRooms} 
          disabled={isLoading}
          className="h-12"
        >
          Test User Rooms
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Results</h2>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <Card key={index} className={getColorClass(result.type)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">{getIcon(result.type)}</span>
                <div className="flex-1">
                  <div className="font-medium">{result.message}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Details</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No test results yet. Run a test to see results.
          </CardContent>
        </Card>
      )}
    </div>
  )
} 