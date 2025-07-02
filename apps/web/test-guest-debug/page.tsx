'use client'

import { useState } from 'react'
import { supabase } from '@civicsense/shared/lib/supabase/client'
import { useGuestAccess } from '@civicsense/shared/hooks/useGuestAccess'

export default function GuestDebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { getOrCreateGuestToken } = useGuestAccess()

  const addResult = (result: any) => {
    setResults(prev => [...prev, { 
      timestamp: new Date().toISOString(), 
      ...result 
    }])
  }

  const testGuestRoomCreation = async () => {
    setLoading(true)
    try {
      const guestToken = getOrCreateGuestToken()
      addResult({ step: 'Generated guest token', guestToken })

      // Create a room
      const { data: roomData, error: roomError } = await supabase
        .rpc('create_multiplayer_room', {
          p_topic_id: 'constitutional-rights',
          p_host_user_id: undefined,
          p_host_guest_token: guestToken,
          p_room_name: 'Debug Test Room',
          p_max_players: 4,
          p_game_mode: 'classic'
        })

      if (roomError) {
        addResult({ step: 'Room creation error', error: roomError })
        return
      }

      addResult({ step: 'Room created', roomData })

      const roomId = roomData?.[0]?.id
      if (!roomId) {
        addResult({ step: 'No room ID returned', roomData })
        return
      }

      // Wait a moment for the room to be created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Query for players in the room
      const { data: playersData, error: playersError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)

      addResult({ 
        step: 'Players query result', 
        playersData, 
        playersError,
        playersCount: playersData?.length || 0
      })

      // Query for the room itself
      const { data: roomQuery, error: roomQueryError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('id', roomId)

      addResult({ 
        step: 'Room query result', 
        roomQuery, 
        roomQueryError 
      })

    } catch (error) {
      addResult({ step: 'Test error', error })
    } finally {
      setLoading(false)
    }
  }

  const testDirectPlayerQuery = async () => {
    setLoading(true)
    try {
      // Query all players
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .limit(10)

      addResult({ 
        step: 'All players query', 
        allPlayers, 
        allPlayersError,
        count: allPlayers?.length || 0
      })

      // Query all rooms
      const { data: allRooms, error: allRoomsError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .limit(10)

      addResult({ 
        step: 'All rooms query', 
        allRooms, 
        allRoomsError,
        count: allRooms?.length || 0
      })

    } catch (error) {
      addResult({ step: 'Direct query error', error })
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Guest Multiplayer Debug Tool</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testGuestRoomCreation}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Guest Room Creation'}
        </button>
        
        <button
          onClick={testDirectPlayerQuery}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Querying...' : 'Test Direct Player Query'}
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Debug Results</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet. Click a test button to start.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="p-4 border rounded bg-gray-50">
              <div className="text-sm text-gray-500 mb-2">
                {result.timestamp} - Step: {result.step}
              </div>
              <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 