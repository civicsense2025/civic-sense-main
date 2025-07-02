'use client'

import { useState } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { supabase } from '@civicsense/shared/lib/supabase/client'

export default function TestNPCRLSPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testNPCRLS = async () => {
    setLoading(true)
    setResults([])
    
    try {
      // Test 1: Create a room as a regular user
      const { data: roomData, error: roomError } = await supabase
        .rpc('create_multiplayer_room', {
          p_topic_id: 'test-topic',
          p_host_guest_token: 'guest_12345',
          p_room_name: 'NPC Test Room',
          p_max_players: 4,
          p_game_mode: 'classic'
        })

      if (roomError) {
        setResults(prev => [...prev, { test: 'Create Room', status: 'FAILED', error: roomError.message }])
        return
      }

      const roomId = roomData[0]?.id
      const roomCode = roomData[0]?.room_code
      
      setResults(prev => [...prev, { 
        test: 'Create Room', 
        status: 'SUCCESS', 
        data: { roomId, roomCode } 
      }])

      // Test 2: Try to add NPC player directly to multiplayer_room_players
      const npcToken = 'npc_test_bot_001'
      const { data: npcData, error: npcError } = await supabase
        .from('multiplayer_room_players')
        .insert({
          room_id: roomId,
          guest_token: npcToken,
          player_name: 'Test NPC Bot',
          player_emoji: '🤖',
          is_host: false,
          is_ready: true,
          is_connected: true,
          join_order: 2
        })
        .select()

      if (npcError) {
        setResults(prev => [...prev, { 
          test: 'Add NPC Player (Direct Insert)', 
          status: 'FAILED', 
          error: npcError.message 
        }])
      } else {
        setResults(prev => [...prev, { 
          test: 'Add NPC Player (Direct Insert)', 
          status: 'SUCCESS', 
          data: npcData 
        }])
      }

      // Test 3: Try to join room as NPC using join function
      const { data: joinData, error: joinError } = await supabase
        .rpc('join_multiplayer_room', {
          p_room_code: roomCode,
          p_player_name: 'Function NPC Bot',
          p_guest_token: 'npc_function_bot_002',
          p_player_emoji: '🤖'
        })

      if (joinError) {
        setResults(prev => [...prev, { 
          test: 'Join as NPC (Function)', 
          status: 'FAILED', 
          error: joinError.message 
        }])
      } else {
        setResults(prev => [...prev, { 
          test: 'Join as NPC (Function)', 
          status: 'SUCCESS', 
          data: joinData 
        }])
      }

      // Test 4: Query all players in the room
      const { data: playersData, error: playersError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)

      if (playersError) {
        setResults(prev => [...prev, { 
          test: 'Query Room Players', 
          status: 'FAILED', 
          error: playersError.message 
        }])
      } else {
        setResults(prev => [...prev, { 
          test: 'Query Room Players', 
          status: 'SUCCESS', 
          data: playersData 
        }])
      }

      // Test 5: Try to update NPC player status
      if (npcData && npcData[0]) {
        const { data: updateData, error: updateError } = await supabase
          .from('multiplayer_room_players')
          .update({ is_ready: false })
          .eq('id', npcData[0].id)
          .select()

        if (updateError) {
          setResults(prev => [...prev, { 
            test: 'Update NPC Player', 
            status: 'FAILED', 
            error: updateError.message 
          }])
        } else {
          setResults(prev => [...prev, { 
            test: 'Update NPC Player', 
            status: 'SUCCESS', 
            data: updateData 
          }])
        }
      }

    } catch (error) {
      setResults(prev => [...prev, { 
        test: 'General Error', 
        status: 'FAILED', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>NPC RLS Policy Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testNPCRLS} disabled={loading}>
            {loading ? 'Testing...' : 'Run NPC RLS Tests'}
          </Button>

          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className={`border-l-4 ${
                result.status === 'SUCCESS' ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {result.test} - <span className={
                      result.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                    }>{result.status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.error && (
                    <div className="text-red-600 text-sm mb-2">
                      Error: {result.error}
                    </div>
                  )}
                  {result.data && (
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 