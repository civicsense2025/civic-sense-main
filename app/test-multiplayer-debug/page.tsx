"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import { dataService } from "@/lib/data-service"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/utils/supabase/client"
import { Info, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

export default function MultiplayerDebugPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testRoomCode, setTestRoomCode] = useState('')
  const [testPlayerId, setTestPlayerId] = useState('')
  const [availableRooms, setAvailableRooms] = useState<any[]>([])

  const addResult = (result: any) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }])
  }

  // Load available rooms for the user
  const loadAvailableRooms = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
      // Get rooms where user is a player
      const { data: userRooms, error } = await supabase
        .from('multiplayer_room_players')
        .select(`
          id,
          room_id,
          player_name,
          is_host,
          multiplayer_rooms!inner (
            id,
            room_code,
            room_status,
            topic_id,
            game_mode,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { referencedTable: 'multiplayer_rooms', ascending: false })

      if (!error && userRooms) {
        setAvailableRooms(userRooms)
        if (userRooms.length > 0) {
          // Auto-select the most recent room
          const mostRecent = userRooms[0]
          setTestRoomCode((mostRecent as any).multiplayer_rooms.room_code)
          setTestPlayerId(mostRecent.id)
        }
      }
    } catch (error) {
      console.error('Error loading available rooms:', error)
    }
  }

  // Load available rooms on component mount
  useEffect(() => {
    loadAvailableRooms()
  }, [user])

  const testRoomLoading = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Starting room loading test...' })

    try {
      const roomCode = testRoomCode || 'A34D7526' // Fallback to old hardcoded value
      addResult({ type: 'info', message: `Testing room code: ${roomCode}` })

      const supabase = createClient()
      
      // Test direct database query
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError) {
        addResult({ type: 'error', message: `Room query error: ${roomError.message}`, details: roomError })
      } else {
        addResult({ type: 'success', message: 'Room found in database', details: roomData })
      }

      // Test players query
      if (roomData) {
        const { data: playersData, error: playersError } = await supabase
          .from('multiplayer_room_players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('join_order')

        if (playersError) {
          addResult({ type: 'error', message: `Players query error: ${playersError.message}`, details: playersError })
        } else {
          addResult({ type: 'success', message: `Players found: ${playersData.length}`, details: playersData })
        }
      }

    } catch (error) {
      addResult({ type: 'error', message: 'Test failed', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const testTopicLoading = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Starting topic loading test...' })

    try {
      // Test topic from the logs
      const topicId = 'deportation_due_process_2025'
      addResult({ type: 'info', message: `Testing topic ID: ${topicId}` })

      const topicData = await dataService.getTopicById(topicId)
      if (topicData) {
        addResult({ type: 'success', message: 'Topic loaded successfully', details: topicData })
      } else {
        addResult({ type: 'error', message: 'Topic not found' })
      }

      const questionsData = await dataService.getQuestionsByTopic(topicId)
      if (questionsData && questionsData.length > 0) {
        addResult({ type: 'success', message: `Questions loaded: ${questionsData.length}`, details: questionsData[0] })
      } else {
        addResult({ type: 'error', message: 'No questions found' })
      }

    } catch (error) {
      addResult({ type: 'error', message: 'Topic test failed', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const testFullFlow = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Starting full multiplayer flow test...' })

    try {
      const roomCode = testRoomCode || 'A34D7526' // Fallback
      const playerId = testPlayerId || '8909880a-f8d3-44d4-941b-02609adc555a' // Fallback
      let topicId = 'deportation_due_process_2025' // Default fallback

      // Step 1: Test room loading
      addResult({ type: 'info', message: 'Step 1: Testing room loading...' })
      const supabase = createClient()
      
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError) {
        addResult({ type: 'error', message: `Room loading failed: ${roomError.message}` })
        return
      }

      // Use the room's actual topic ID
      topicId = roomData.topic_id

      addResult({ type: 'success', message: 'Room loaded successfully', details: {
        id: roomData.id,
        room_code: roomData.room_code,
        room_status: roomData.room_status,
        topic_id: roomData.topic_id,
        game_mode: roomData.game_mode,
        host_user_id: roomData.host_user_id
      }})

      // Step 2: Test player verification and HOST ASSIGNMENT CHECK
      addResult({ type: 'info', message: 'Step 2: Testing player verification and host assignment...' })
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('join_order')

      if (allPlayersError) {
        addResult({ type: 'error', message: `Players query failed: ${allPlayersError.message}` })
        return
      }

      // Check host assignment
      const hostPlayers = allPlayers.filter(p => p.is_host)
      const roomHostPlayer = allPlayers.find(p => p.user_id === roomData.host_user_id)
      
      addResult({ type: 'info', message: `Host assignment analysis:`, details: {
        totalPlayers: allPlayers.length,
        hostPlayersCount: hostPlayers.length,
        hostPlayers: hostPlayers.map(p => ({
          id: p.id,
          player_name: p.player_name,
          user_id: p.user_id,
          is_host: p.is_host,
          join_order: p.join_order
        })),
        roomHostUserId: roomData.host_user_id,
        roomHostPlayer: roomHostPlayer ? {
          id: roomHostPlayer.id,
          player_name: roomHostPlayer.player_name,
          is_host: roomHostPlayer.is_host
        } : null
      }})

      // Validate host assignment
      if (hostPlayers.length === 0) {
        addResult({ type: 'error', message: '❌ NO HOST FOUND! This is the bug we fixed.' })
      } else if (hostPlayers.length > 1) {
        addResult({ type: 'warning', message: `⚠️ Multiple hosts found (${hostPlayers.length}). Should be exactly 1.` })
      } else {
        const host = hostPlayers[0]
        if (host.user_id === roomData.host_user_id) {
          addResult({ type: 'success', message: '✅ Host assignment is CORRECT! Room creator is properly marked as host.' })
        } else {
          addResult({ type: 'warning', message: '⚠️ Host assignment mismatch. Host player does not match room host_user_id.' })
        }
      }

      // Check specific player if provided
      if (playerId) {
        const { data: playerData, error: playerError } = await supabase
          .from('multiplayer_room_players')
          .select('*')
          .eq('room_id', roomData.id)
          .eq('id', playerId)
          .single()

        if (playerError) {
          addResult({ type: 'warning', message: `Specific player not found: ${playerError.message}` })
        } else {
          addResult({ type: 'success', message: 'Specific player found in room', details: {
            id: playerData.id,
            player_name: playerData.player_name,
            is_ready: playerData.is_ready,
            is_host: playerData.is_host,
            join_order: playerData.join_order
          }})
        }
      }

      // Step 3: Test topic and questions
      addResult({ type: 'info', message: 'Step 3: Testing topic and questions...' })
      const topicData = await dataService.getTopicById(topicId)
      if (!topicData) {
        addResult({ type: 'error', message: 'Topic not found' })
        return
      }

      addResult({ type: 'success', message: 'Topic loaded', details: {
        topic_id: topicData.topic_id,
        topic_title: topicData.topic_title,
        emoji: topicData.emoji
      }})

      const questionsData = await dataService.getQuestionsByTopic(topicId)
      if (!questionsData || questionsData.length === 0) {
        addResult({ type: 'error', message: 'No questions found for topic' })
        return
      }

      addResult({ type: 'success', message: `Questions loaded: ${questionsData.length}`, details: {
        firstQuestion: {
          question_number: questionsData[0].question_number,
          question_type: questionsData[0].question_type,
          hasOptions: !!(questionsData[0].option_a && questionsData[0].option_b),
          correct_answer: questionsData[0].correct_answer
        }
      }})

      // Step 4: Test multiplayer URL construction
      addResult({ type: 'info', message: 'Step 4: Testing URL construction...' })
      const multiplayerUrl = `/quiz/${topicId}/multiplayer?room=${roomCode}&player=${playerId}`
      addResult({ type: 'success', message: 'Multiplayer URL constructed', details: { url: multiplayerUrl }})

      addResult({ type: 'success', message: '✅ Full flow test completed successfully!' })

    } catch (error) {
      addResult({ type: 'error', message: 'Full flow test failed', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const testHostAssignment = async () => {
    setIsLoading(true)
    addResult({ type: 'info', message: 'Starting host assignment test...' })

    try {
      const supabase = createClient()

      // Test 1: Check existing rooms for host assignment
      addResult({ type: 'info', message: 'Test 1: Checking existing rooms for host assignment...' })
      
      const { data: rooms, error: roomsError } = await supabase
        .from('multiplayer_rooms')
        .select(`
          id,
          room_code,
          host_user_id,
          room_status,
          multiplayer_room_players!inner (
            id,
            user_id,
            player_name,
            is_host,
            join_order
          )
        `)
        .limit(5)
        .order('created_at', { ascending: false })

      if (roomsError) {
        addResult({ type: 'error', message: `Failed to load rooms: ${roomsError.message}` })
        return
      }

      addResult({ type: 'info', message: `Found ${rooms.length} recent rooms to analyze` })

      let correctHostAssignments = 0
      let totalRoomsChecked = 0

      for (const room of rooms) {
        totalRoomsChecked++
        const players = (room as any).multiplayer_room_players
        const hostPlayers = players.filter((p: any) => p.is_host)
        const roomHostPlayer = players.find((p: any) => p.user_id === room.host_user_id)

        addResult({ type: 'info', message: `Room ${room.room_code} analysis:`, details: {
          room_id: room.id,
          host_user_id: room.host_user_id,
          total_players: players.length,
          host_players_count: hostPlayers.length,
          host_players: hostPlayers.map((p: any) => ({
            player_name: p.player_name,
            user_id: p.user_id,
            join_order: p.join_order
          })),
          room_host_player_is_host: roomHostPlayer?.is_host || false
        }})

        if (hostPlayers.length === 1 && roomHostPlayer?.is_host) {
          correctHostAssignments++
          addResult({ type: 'success', message: `✅ Room ${room.room_code}: Host assignment correct` })
        } else if (hostPlayers.length === 0) {
          addResult({ type: 'error', message: `❌ Room ${room.room_code}: NO HOST ASSIGNED (this is the bug!)` })
        } else if (hostPlayers.length > 1) {
          addResult({ type: 'warning', message: `⚠️ Room ${room.room_code}: Multiple hosts (${hostPlayers.length})` })
        } else if (!roomHostPlayer?.is_host) {
          addResult({ type: 'warning', message: `⚠️ Room ${room.room_code}: Room creator is not marked as host` })
        }
      }

      // Summary
      const successRate = totalRoomsChecked > 0 ? (correctHostAssignments / totalRoomsChecked) * 100 : 0
      addResult({ 
        type: successRate === 100 ? 'success' : successRate > 50 ? 'warning' : 'error', 
        message: `Host assignment summary: ${correctHostAssignments}/${totalRoomsChecked} rooms have correct host assignment (${successRate.toFixed(1)}%)` 
      })

      // Test 2: Test database functions (if user is logged in)
      if (user) {
        addResult({ type: 'info', message: 'Test 2: Testing database functions...' })
        
        // Test join_multiplayer_room function with a dummy call
        const { data: functionTest, error: functionError } = await supabase.rpc('join_multiplayer_room', {
          p_room_code: 'TESTCODE',
          p_player_name: 'Test Player',
          p_user_id: user.id,
          p_guest_token: null,
          p_player_emoji: '🧪'
        })

        if (functionError) {
          addResult({ type: 'warning', message: `join_multiplayer_room function error: ${functionError.message}` })
        } else if (functionTest && functionTest.length > 0) {
          const result = functionTest[0]
          if (result.success === false && result.message === 'Room not found') {
            addResult({ type: 'success', message: '✅ join_multiplayer_room function correctly rejects non-existent rooms' })
          } else if (result.success === true) {
            addResult({ type: 'warning', message: 'join_multiplayer_room function returned success for non-existent room (unexpected)' })
          } else {
            addResult({ type: 'warning', message: `join_multiplayer_room function returned unexpected result: ${result.message}` })
          }
        } else {
          addResult({ type: 'warning', message: 'join_multiplayer_room function returned no data' })
        }
      }

      addResult({ type: 'success', message: '✅ Host assignment test completed!' })

    } catch (error) {
      addResult({ type: 'error', message: 'Host assignment test failed', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
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
        <h1 className="text-4xl font-bold">Multiplayer Debug Console</h1>
        <p className="text-lg text-muted-foreground">
          Debug and test the multiplayer quiz flow step by step
        </p>
      </div>

      {!user && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please log in to run comprehensive multiplayer tests.
          </AlertDescription>
        </Alert>
      )}

      {user && availableRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Multiplayer Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {availableRooms.map((room: any, index) => (
                <div 
                  key={index}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    testRoomCode === room.multiplayer_rooms.room_code 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setTestRoomCode(room.multiplayer_rooms.room_code)
                    setTestPlayerId(room.id)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Room: {room.multiplayer_rooms.room_code}</div>
                      <div className="text-sm text-muted-foreground">
                        Player: {room.player_name} {room.is_host && '👑'}
                      </div>
                    </div>
                    <Badge variant={room.multiplayer_rooms.room_status === 'waiting' ? 'secondary' : 'default'}>
                      {room.multiplayer_rooms.room_status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {room.multiplayer_rooms.game_mode} • {room.multiplayer_rooms.topic_id}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Selected: Room {testRoomCode} • Player {testPlayerId}
            </div>
          </CardContent>
        </Card>
      )}

      {user && availableRooms.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No multiplayer rooms found. Create or join a room first to test the debug tools.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button 
          onClick={testRoomLoading} 
          disabled={isLoading}
          className="h-12"
        >
          Test Room Loading
        </Button>
        <Button 
          onClick={testTopicLoading} 
          disabled={isLoading}
          className="h-12"
        >
          Test Topic Loading
        </Button>
        <Button 
          onClick={testFullFlow} 
          disabled={isLoading}
          className="h-12 bg-green-600 hover:bg-green-700"
        >
          Test Full Flow
        </Button>
        <Button 
          onClick={testHostAssignment} 
          disabled={isLoading}
          className="h-12 bg-purple-600 hover:bg-purple-700"
        >
          Test Host Assignment
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Debug Results</h2>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <Card key={index} className={getColorClass(result.type)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getIcon(result.type)}
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
            No test results yet. Run a test to see debug information.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Component to test the useMultiplayerRoom hook directly
function MultiplayerRoomTest({ roomCode }: { roomCode: string }) {
  const { room, players, isLoading, error } = useMultiplayerRoom(roomCode)

  return (
    <Card>
      <CardHeader>
        <CardTitle>useMultiplayerRoom Hook Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {error || 'None'}</div>
          <div>Room: {room ? `${room.room_code} (${room.room_status})` : 'None'}</div>
          <div>Players: {players.length}</div>
        </div>
      </CardContent>
    </Card>
  )
} 