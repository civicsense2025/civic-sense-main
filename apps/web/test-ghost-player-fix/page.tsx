"use client"

import { useState, useEffect } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { useAuth } from '@civicsense/ui-web/components/auth/auth-provider'
import { useGuestAccess } from '@civicsense/shared/hooks/useGuestAccess'
import { useMultiplayerRoom, multiplayerOperations } from '@civicsense/shared/lib/multiplayer'
import { Loader2, Users, Ghost, Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function GhostPlayerFixTest() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [playerName] = useState('TestPlayer')
  const [testResults, setTestResults] = useState<string[]>([])
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isSimulatingDisconnect, setIsSimulatingDisconnect] = useState(false)

  const { 
    room, 
    players, 
    isLoading, 
    error, 
    ensurePlayerInRoom 
  } = useMultiplayerRoom(roomCode)

  const currentPlayer = players.find(p => p.id === playerId)
  const isGhost = Boolean(roomCode && playerId && !currentPlayer)
  
  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const createTestRoom = async () => {
    setIsCreatingRoom(true)
    addTestResult('Creating test room...')
    
    try {
      const userId = user?.id
      const guestToken = user ? undefined : getOrCreateGuestToken()
      
      const result = await multiplayerOperations.createRoom({
        topicId: '2025-reproductive-rights-legal-framework',
        roomName: 'Ghost Player Test Room',
        maxPlayers: 8,
        gameMode: 'classic'
      }, userId, guestToken)
      
      setRoomCode(result.room.room_code)
      setPlayerId(result.player.id)
      addTestResult(`Room created: ${result.room.room_code}`)
      addTestResult(`Player ID: ${result.player.id}`)
      addTestResult(`Player name: ${result.player.player_name}`)
    } catch (err) {
      addTestResult(`❌ Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const simulateDisconnect = async () => {
    if (!roomCode || !playerId) return
    
    setIsSimulatingDisconnect(true)
    addTestResult('🔌 Simulating disconnect by manually removing player from database...')
    
    try {
      // Manually remove the player from the database to simulate a disconnect
      const { supabase } = await import('@civicsense/shared/lib/supabase/client')
      const { error } = await supabase
        .from('multiplayer_room_players')
        .delete()
        .eq('id', playerId)
      
      if (error) {
        addTestResult(`❌ Failed to simulate disconnect: ${error.message}`)
      } else {
        addTestResult('✅ Player removed from database - you should now be a "ghost"')
        addTestResult('👻 Auto-rejoin should trigger in a few seconds...')
      }
    } catch (err) {
      addTestResult(`❌ Error simulating disconnect: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSimulatingDisconnect(false)
    }
  }

  const manualRejoin = async () => {
    if (!roomCode || !playerId || !ensurePlayerInRoom) return
    
    addTestResult('🔄 Manually triggering rejoin...')
    
    try {
      const success = await ensurePlayerInRoom(playerId, playerName, '👻')
      if (success) {
        addTestResult('✅ Manual rejoin successful!')
      } else {
        addTestResult('❌ Manual rejoin failed')
      }
    } catch (err) {
      addTestResult(`❌ Manual rejoin error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Monitor player status changes
  useEffect(() => {
    if (roomCode && playerId) {
      const wasGhost = testResults.some(r => r.includes('👻') && r.includes('Auto-rejoin'))
      
      if (currentPlayer && wasGhost) {
        addTestResult('🎉 Auto-rejoin successful! Player is back in the room.')
      } else if (isGhost && !wasGhost) {
        addTestResult('👻 Player is now a ghost (not in players list)')
      }
    }
  }, [currentPlayer, isGhost, playerId, roomCode])

  // Monitor connection status
  useEffect(() => {
    if (room && playerId) {
      addTestResult(`📊 Room status: ${room.room_status}`)
      addTestResult(`👥 Players in room: ${players.length}`)
      if (currentPlayer) {
        addTestResult(`✅ Current player found: ${currentPlayer.player_name} (connected: ${currentPlayer.is_connected})`)
      }
    }
  }, [room, players, currentPlayer, playerId])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ghost className="h-6 w-6" />
              Ghost Player Fix Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={createTestRoom}
                disabled={isCreatingRoom || !!roomCode}
                className="flex items-center gap-2"
              >
                {isCreatingRoom ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Create Test Room
              </Button>
              
              <Button
                onClick={simulateDisconnect}
                disabled={!roomCode || !playerId || isSimulatingDisconnect || isGhost}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {isSimulatingDisconnect ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                Simulate Disconnect
              </Button>
              
              <Button
                onClick={manualRejoin}
                disabled={!isGhost}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Manual Rejoin
              </Button>
            </div>

            {roomCode && (
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Room Code:</strong> {roomCode}
                  </div>
                  <div>
                    <strong>Player ID:</strong> {playerId}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    {isGhost ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <Ghost className="h-4 w-4" />
                        Ghost Player
                      </span>
                    ) : currentPlayer ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Wifi className="h-4 w-4" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-yellow-600">Loading...</span>
                    )}
                  </div>
                  <div>
                    <strong>Players:</strong> {players.length}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading room data...
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Results</CardTitle>
            <Button
              onClick={clearResults}
              variant="outline"
              size="sm"
              disabled={testResults.length === 0}
            >
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-sm text-slate-500">No test results yet. Create a room to start testing.</p>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono p-2 bg-slate-50 dark:bg-slate-900 rounded border-l-2 border-slate-300 dark:border-slate-700"
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {players.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Room Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border ${
                      player.id === playerId
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{player.player_emoji}</span>
                        <span className="font-medium">{player.player_name}</span>
                        {player.id === playerId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                        {player.is_host && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={player.is_connected ? 'text-green-600' : 'text-red-600'}>
                          {player.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                        {player.is_ready && (
                          <span className="text-green-600">Ready</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ID: {player.id} | Created: {player.created_at ? new Date(player.created_at).toLocaleTimeString() : 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 