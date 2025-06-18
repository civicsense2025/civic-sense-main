"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from '@/lib/enhanced-npc-service'
import { NPC_PERSONALITIES } from '@/lib/multiplayer-npcs'
import { addNPCToRoom } from '@/lib/multiplayer-npc-integration'
import { multiplayerOperations } from '@/lib/multiplayer'
import { useToast } from '@/hooks/use-toast'

export default function TestMultiplayerPage() {
  const [npcs, setNpcs] = useState<any[]>([])
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load NPCs on mount
    const loadNPCs = async () => {
      try {
        const npcList = await enhancedNPCService.getAllNPCs()
        setNpcs(npcList)
        addTestResult(`✅ Loaded ${npcList.length} NPC personalities`)
      } catch (error) {
        addTestResult(`❌ Failed to load NPCs: ${error}`)
      }
    }
    loadNPCs()
  }, [])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testNPCConversation = async () => {
    setIsLoading(true)
    try {
      const context: NPCConversationContext = {
        npcId: 'news_junkie',
        playerId: 'test_player',
        roomId: 'test_room',
        triggerType: 'on_join',
        userMood: 'neutral',
        quizContext: {
          topicId: 'test_topic',
          userPerformance: {
            correctAnswers: 3,
            totalAnswered: 5,
            averageTime: 15
          },
          roomPerformance: {
            averageScore: 70,
            playerCount: 3,
            userRank: 2
          }
        }
      }

      const response = await enhancedNPCService.generateNPCMessage(context)
      addTestResult(`✅ NPC Response: "${response.message}" (${response.tone})`)
    } catch (error) {
      addTestResult(`❌ NPC conversation test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testRoomCreation = async () => {
    setIsLoading(true)
    try {
      const room = await multiplayerOperations.createRoom({
        topicId: 'test_topic',
        roomName: 'Test Room',
        maxPlayers: 4,
        gameMode: 'classic'
      })
      addTestResult(`✅ Created room: ${room.room_code}`)
      
      // Test adding NPC to room
      const npcResult = await addNPCToRoom(room.room_code, 'news_junkie')
      if (npcResult.success) {
        addTestResult(`✅ Added NPC to room: ${npcResult.playerId}`)
      } else {
        addTestResult(`❌ Failed to add NPC: ${npcResult.error}`)
      }
    } catch (error) {
      addTestResult(`❌ Room creation failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testNPCBehavior = async () => {
    setIsLoading(true)
    try {
      // Test different NPC personalities
      for (const npc of npcs.slice(0, 3)) {
        const analytics = await enhancedNPCService.getUserVsNPCComparison('test_user', ['government_structure'])
        addTestResult(`✅ ${npc.name}: Analytics generated`)
      }
    } catch (error) {
      addTestResult(`❌ NPC behavior test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">🧪 Multiplayer NPC System Test</h1>
        <p className="text-lg text-muted-foreground">
          Testing the enhanced NPC system and multiplayer integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPCs Display */}
        <Card>
          <CardHeader>
            <CardTitle>Available NPCs ({npcs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {npcs.map((npc) => (
                <div key={npc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-2xl">{npc.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-medium">{npc.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {npc.description}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {npc.skillLevel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {npc.traits.specialties[0]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testNPCConversation}
              disabled={isLoading}
              className="w-full"
            >
              Test NPC Conversation (OpenAI)
            </Button>
            
            <Button 
              onClick={testRoomCreation}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Test Room Creation + NPC Join
            </Button>
            
            <Button 
              onClick={testNPCBehavior}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Test NPC Analytics
            </Button>
            
            <Button 
              onClick={clearResults}
              disabled={isLoading}
              className="w-full"
              variant="destructive"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-[200px] max-h-[400px] overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-slate-500">No tests run yet. Click a test button above.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 