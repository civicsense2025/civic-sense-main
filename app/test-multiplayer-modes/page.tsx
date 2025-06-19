"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MultiplayerQuizRouter } from "@/components/multiplayer/multiplayer-quiz-router"
import { GAME_MODE_CONFIGS } from "@/components/multiplayer/game-modes/base-multiplayer-engine"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/utils/supabase/client"
import { Users, Play, Settings, Info, CheckCircle, XCircle, Clock } from "lucide-react"

const MOCK_QUESTIONS = [
  {
    question_number: 1,
    question: "What is the primary role of the legislative branch?",
    option_a: "To enforce laws",
    option_b: "To make laws", 
    option_c: "To interpret laws",
    option_d: "To veto laws",
    correct_answer: "B",
    explanation: "The legislative branch makes laws.",
    category: "Government",
    difficulty_level: "medium",
    question_type: "multiple_choice" as const,
    topic_id: "test-topic",
    hint: "Think about what Congress does.",
    tags: ["basic", "government"],
    sources: []
  }
]

const MOCK_TOPIC = {
  id: "test-topic",
  title: "Government Structure",
  emoji: "🏛️",
  date: new Date().toISOString().split('T')[0],
  dayOfWeek: "Monday"
}

export default function MultiplayerModesTestPage() {
  const { user } = useAuth()
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [testRoom, setTestRoom] = useState<any>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const gameModes = [
    { mode: 'classic', name: 'Classic Quiz', icon: '📚' },
    { mode: 'speed_round', name: 'Speed Round', icon: '⚡' },
    { mode: 'matching', name: 'Matching Challenge', icon: '🧩' },
    { mode: 'elimination', name: 'Elimination', icon: '🏆' },
    { mode: 'learning_lab', name: 'Learning Lab', icon: '🧪' }
  ]

  const createTestRoom = async (gameMode: string) => {
    if (!user) return
    setIsCreatingRoom(true)
    
    try {
      const supabase = createClient()
      const { data: room, error } = await supabase
        .from('multiplayer_rooms')
        .insert({
          creator_id: user.id,
          topic_id: MOCK_TOPIC.id,
          game_mode: gameMode,
          max_players: 4,
          room_status: 'active',
          room_name: `Test ${gameMode} Room`
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('multiplayer_players')
        .insert({
          room_id: room.id,
          user_id: user.id,
          player_name: 'Test Player',
          is_ready: true,
          join_order: 1
        })

      setTestRoom(room)
      setSelectedMode(gameMode)
    } catch (error) {
      console.error('Error creating test room:', error)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleTestComplete = () => {
    setSelectedMode(null)
    setTestRoom(null)
  }

  if (selectedMode && testRoom) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <Button onClick={handleTestComplete} className="mb-4">
            ← Back to Test Dashboard
          </Button>
          <MultiplayerQuizRouter
            questions={MOCK_QUESTIONS}
            topicId={MOCK_TOPIC.id}
            roomId={testRoom.id}
            playerId={user?.id || 'test-player'}
            onComplete={handleTestComplete}
            currentTopic={MOCK_TOPIC}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Multiplayer Game Modes Test Suite
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {gameModes.map((mode) => (
            <Card key={mode.mode}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{mode.icon}</span>
                  {mode.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => createTestRoom(mode.mode)}
                  disabled={isCreatingRoom}
                  className="w-full"
                >
                  {isCreatingRoom ? (
                    <>
                      <Settings className="mr-2 h-4 w-4 animate-spin" />
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Test {mode.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!user && (
          <Alert className="mt-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please log in to run multiplayer tests.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
} 