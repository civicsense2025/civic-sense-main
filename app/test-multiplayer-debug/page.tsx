"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMultiplayerRoom } from '@/lib/multiplayer'
import { dataService } from '@/lib/data-service'

export default function MultiplayerDebugPage() {
  const [roomCode, setRoomCode] = useState('76EBD254')
  const [topicId, setTopicId] = useState('trump_g7_early_departure_2025')
  const [results, setResults] = useState<any[]>([])

  const addResult = (result: any) => {
    setResults(prev => [...prev, { timestamp: new Date().toISOString(), ...result }])
  }

  const testRoomLoading = async () => {
    try {
      addResult({ type: 'info', message: `Testing room loading for code: ${roomCode}` })
      
      // Test the same logic as useMultiplayerRoom
      const { supabase } = await import('@/lib/supabase')
      
      const roomResult = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomResult.error) {
        addResult({ type: 'error', message: `Room query error: ${roomResult.error.message}` })
        return
      }

      addResult({ type: 'success', message: `Room found: ${JSON.stringify(roomResult.data)}` })

      // Test players loading
      const playersResult = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomResult.data.id)
        .order('join_order')

      if (playersResult.error) {
        addResult({ type: 'error', message: `Players query error: ${playersResult.error.message}` })
        return
      }

      addResult({ type: 'success', message: `Players found: ${playersResult.data.length} players` })

    } catch (error) {
      addResult({ type: 'error', message: `Exception: ${error}` })
    }
  }

  const testTopicLoading = async () => {
    try {
      addResult({ type: 'info', message: `Testing topic loading for ID: ${topicId}` })
      
      const topic = await dataService.getTopicById(topicId)
      
      if (!topic) {
        addResult({ type: 'error', message: 'Topic not found' })
        return
      }

      addResult({ type: 'success', message: `Topic found: ${topic.topic_title}` })

      // Test questions loading
      const questions = await dataService.getQuestionsByTopic(topicId)
      addResult({ type: 'success', message: `Questions found: ${questions.length} questions` })

    } catch (error) {
      addResult({ type: 'error', message: `Exception: ${error}` })
    }
  }

  const testFullFlow = async () => {
    setResults([])
    await testRoomLoading()
    await testTopicLoading()
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Multiplayer Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Room code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Topic ID</label>
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Topic ID"
              />
            </div>
            <div className="space-y-2">
              <Button onClick={testRoomLoading} className="w-full">
                Test Room Loading
              </Button>
              <Button onClick={testTopicLoading} className="w-full">
                Test Topic Loading
              </Button>
              <Button onClick={testFullFlow} className="w-full bg-green-600 hover:bg-green-700">
                Test Full Flow
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>useMultiplayerRoom Hook Test</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiplayerRoomTest roomCode={roomCode} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.type === 'error' 
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : result.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm">{result.message}</div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                No results yet. Run a test to see debug information.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MultiplayerRoomTest({ roomCode }: { roomCode: string }) {
  const { room, players, isLoading, error } = useMultiplayerRoom(roomCode)

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </div>
      <div className="text-sm">
        <strong>Error:</strong> {error || 'None'}
      </div>
      <div className="text-sm">
        <strong>Room:</strong> {room ? `${room.room_code} (${room.room_status})` : 'None'}
      </div>
      <div className="text-sm">
        <strong>Players:</strong> {players.length}
      </div>
    </div>
  )
} 