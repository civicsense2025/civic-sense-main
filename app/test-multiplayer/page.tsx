"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from '@/lib/enhanced-npc-service'
import { NPC_PERSONALITIES } from '@/lib/multiplayer-npcs'
import { addNPCToRoom } from '@/lib/multiplayer-npc-integration'
import { multiplayerOperations, useMultiplayerRoom } from '@/lib/multiplayer'
import { GAME_MODE_CONFIGS } from '@/components/multiplayer/game-modes/base-multiplayer-engine'
import { MultiplayerQuizRouter } from '@/components/multiplayer/multiplayer-quiz-router'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { useToast } from '@/hooks/use-toast'
import { dataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase/client'
import { 
  Info, CheckCircle, XCircle, Clock, AlertTriangle, Users, Play, Settings,
  Zap, Trophy, BookOpen, FlaskConical, Database, Network, TestTube
} from 'lucide-react'

// Mock data for testing
const MOCK_QUESTIONS = [
  {
    question_number: 1,
    question: "What is the primary role of the legislative branch?",
    option_a: "To enforce laws",
    option_b: "To make laws", 
    option_c: "To interpret laws",
    option_d: "To veto laws",
    correct_answer: "To make laws",
    explanation: "The legislative branch makes laws.",
    category: "Government",
    difficulty_level: 2,
    question_type: "multiple_choice" as const,
    topic_id: "test-topic",
    hint: "Think about what Congress does.",
    tags: ["basic", "government"],
    sources: []
  },
  {
    question_number: 2,
    question: "The Supreme Court is part of which branch of government?",
    option_a: "Executive",
    option_b: "Legislative", 
    option_c: "Judicial",
    option_d: "Administrative",
    correct_answer: "Judicial",
    explanation: "The Supreme Court is the highest court in the judicial branch.",
    category: "Government",
    difficulty_level: 1,
    question_type: "multiple_choice" as const,
    topic_id: "test-topic",
    hint: "Courts interpret laws.",
    tags: ["basic", "government"],
    sources: []
  }
]

const MOCK_TOPIC = {
  id: "test-topic",
  title: "Government Structure Test",
  emoji: "🏛️",
  date: new Date().toISOString().split('T')[0],
  dayOfWeek: "Monday"
}

export default function TestMultiplayerPage() {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const { toast } = useToast()
  
  // Shared state
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  
  // NPC testing state
  const [npcs, setNpcs] = useState<any[]>([])
  
  // Debug testing state
  const [testRoomCode, setTestRoomCode] = useState('')
  const [testPlayerId, setTestPlayerId] = useState('')
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  
  // Game mode testing state
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [testRoom, setTestRoom] = useState<any>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [user])

  const loadInitialData = async () => {
    try {
      // Load NPCs
      const npcList = await enhancedNPCService.getAllNPCs()
      setNpcs(npcList)
      
      // Load available rooms if user is logged in
      if (user) {
        await loadAvailableRooms()
      }
      
      addTestResult('info', `✅ Loaded ${npcList.length} NPC personalities`)
    } catch (error) {
      addTestResult('error', `❌ Failed to load initial data: ${error}`)
    }
  }

  const loadAvailableRooms = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
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
          const mostRecent = userRooms[0]
          setTestRoomCode((mostRecent as any).multiplayer_rooms.room_code)
          setTestPlayerId(mostRecent.id)
        }
      }
    } catch (error) {
      console.error('Error loading available rooms:', error)
    }
  }

  const addTestResult = (type: 'info' | 'success' | 'error' | 'warning', message: string, details?: any) => {
    setTestResults(prev => [...prev, { 
      type, 
      message, 
      details, 
      timestamp: new Date().toISOString() 
    }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // =============================================================================
  // NPC TESTING FUNCTIONS
  // =============================================================================

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
      addTestResult('success', `✅ NPC Response: "${response.message}" (${response.tone})`)
    } catch (error) {
      addTestResult('error', `❌ NPC conversation test failed: ${error}`)
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
      }, user?.id, user ? undefined : getOrCreateGuestToken())
      
      addTestResult('success', `✅ Created room: ${room.room_code}`)
      
      // Test adding NPC to room
      const npcResult = await addNPCToRoom(room.room_code, 'news_junkie')
      if (npcResult.success) {
        addTestResult('success', `✅ Added NPC to room: ${npcResult.playerId}`)
      } else {
        addTestResult('error', `❌ Failed to add NPC: ${npcResult.error}`)
      }
    } catch (error) {
      addTestResult('error', `❌ Room creation failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testNPCBehavior = async () => {
    setIsLoading(true)
    try {
      for (const npc of npcs.slice(0, 3)) {
        const analytics = await enhancedNPCService.getUserVsNPCComparison('test_user', ['government_structure'])
        addTestResult('success', `✅ ${npc.name}: Analytics generated`)
      }
    } catch (error) {
      addTestResult('error', `❌ NPC behavior test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // DEBUG TESTING FUNCTIONS
  // =============================================================================

  const testRoomLoading = async () => {
    setIsLoading(true)
    addTestResult('info', 'Starting room loading test...')

    try {
      const roomCode = testRoomCode || 'A34D7526'
      addTestResult('info', `Testing room code: ${roomCode}`)

      const supabase = createClient()
      
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError) {
        addTestResult('error', `Room query error: ${roomError.message}`, roomError)
      } else {
        addTestResult('success', 'Room found in database', roomData)
      }

      if (roomData) {
        const { data: playersData, error: playersError } = await supabase
          .from('multiplayer_room_players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('join_order')

        if (playersError) {
          addTestResult('error', `Players query error: ${playersError.message}`, playersError)
        } else {
          addTestResult('success', `Players found: ${playersData.length}`, playersData)
        }
      }

    } catch (error) {
      addTestResult('error', 'Test failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testTopicLoading = async () => {
    setIsLoading(true)
    addTestResult('info', 'Starting topic loading test...')

    try {
      const topicId = 'deportation_due_process_2025'
      addTestResult('info', `Testing topic ID: ${topicId}`)

      const topicData = await dataService.getTopicById(topicId)
      if (topicData) {
        addTestResult('success', 'Topic loaded successfully', topicData)
      } else {
        addTestResult('error', 'Topic not found')
      }

      const questionsData = await dataService.getQuestionsByTopic(topicId)
      if (questionsData && questionsData.length > 0) {
        addTestResult('success', `Questions loaded: ${questionsData.length}`, questionsData[0])
      } else {
        addTestResult('error', 'No questions found')
      }

    } catch (error) {
      addTestResult('error', 'Topic test failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testHostAssignment = async () => {
    setIsLoading(true)
    addTestResult('info', 'Starting host assignment test...')

    try {
      const supabase = createClient()

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
        addTestResult('error', `Failed to load rooms: ${roomsError.message}`)
        return
      }

      addTestResult('info', `Found ${rooms.length} recent rooms to analyze`)

      let correctHostAssignments = 0
      let totalRoomsChecked = 0

      for (const room of rooms) {
        totalRoomsChecked++
        const players = (room as any).multiplayer_room_players
        const hostPlayers = players.filter((p: any) => p.is_host)
        const roomHostPlayer = players.find((p: any) => p.user_id === room.host_user_id)

        if (hostPlayers.length === 1 && roomHostPlayer?.is_host) {
          correctHostAssignments++
          addTestResult('success', `✅ Room ${room.room_code}: Host assignment correct`)
        } else if (hostPlayers.length === 0) {
          addTestResult('error', `❌ Room ${room.room_code}: NO HOST ASSIGNED`)
        } else {
          addTestResult('warning', `⚠️ Room ${room.room_code}: Host assignment issue`)
        }
      }

      const successRate = totalRoomsChecked > 0 ? (correctHostAssignments / totalRoomsChecked) * 100 : 0
      addTestResult(
        successRate === 100 ? 'success' : successRate > 50 ? 'warning' : 'error', 
        `Host assignment summary: ${correctHostAssignments}/${totalRoomsChecked} rooms correct (${successRate.toFixed(1)}%)`
      )

    } catch (error) {
      addTestResult('error', 'Host assignment test failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // ROOM MANAGEMENT TESTING FUNCTIONS
  // =============================================================================

  const testRoomCleanup = async () => {
    setIsLoading(true)
    addTestResult('info', 'Testing room cleanup...')

    try {
      const response = await fetch('/api/multiplayer/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (response.ok) {
        addTestResult('success', `✅ Cleanup successful: ${data.cleanedRooms} rooms, ${data.cleanedPlayers} players`, data)
      } else {
        addTestResult('error', `❌ Cleanup failed: ${data.error}`, data)
      }
    } catch (error) {
      addTestResult('error', 'Failed to call cleanup endpoint', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testUserRooms = async () => {
    setIsLoading(true)
    addTestResult('info', 'Testing user rooms loading...')

    try {
      const guestToken = user ? undefined : getOrCreateGuestToken()
      const rooms = await multiplayerOperations.getUserRooms(user?.id, guestToken)
      
      addTestResult('success', `✅ Found ${rooms.length} user rooms`, rooms.map(r => ({
        room_code: r.room.room_code,
        room_status: r.room.room_status,
        game_mode: r.room.game_mode,
        is_host: r.player.is_host,
        topic_title: r.topic?.topic_title
      })))
    } catch (error) {
      addTestResult('error', 'Failed to load user rooms', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectCleanup = async () => {
    setIsLoading(true)
    addTestResult('info', 'Testing direct cleanup operation...')

    try {
      const result = await multiplayerOperations.cleanupExpiredRooms()
      addTestResult('success', `✅ Direct cleanup: ${result.cleanedRooms} rooms, ${result.cleanedPlayers} players`, result)
    } catch (error) {
      addTestResult('error', 'Direct cleanup failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // GAME MODE TESTING FUNCTIONS
  // =============================================================================

  const createTestRoom = async (gameMode: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to test game modes.",
        variant: "destructive"
      })
      return
    }
    
    setIsCreatingRoom(true)
    
    try {
      const room = await multiplayerOperations.createRoom({
        topicId: MOCK_TOPIC.id,
        roomName: `Test ${gameMode} Room`,
        maxPlayers: 4,
        gameMode: gameMode as any
      }, user.id)

      setTestRoom(room)
      setSelectedMode(gameMode)
      addTestResult('success', `✅ Created ${gameMode} test room: ${room.room_code}`)
    } catch (error) {
      addTestResult('error', `❌ Failed to create ${gameMode} room: ${error}`)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleTestComplete = () => {
    setSelectedMode(null)
    setTestRoom(null)
    addTestResult('info', '🏁 Game mode test completed')
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

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

  const gameModes = [
    { mode: 'classic', name: 'Classic Quiz', icon: <BookOpen className="h-5 w-5" />, color: 'bg-blue-500' },
    { mode: 'speed_round', name: 'Speed Round', icon: <Zap className="h-5 w-5" />, color: 'bg-orange-500' },
    { mode: 'elimination', name: 'Elimination', icon: <Trophy className="h-5 w-5" />, color: 'bg-red-500' },
    { mode: 'learning_lab', name: 'Learning Lab', icon: <FlaskConical className="h-5 w-5" />, color: 'bg-purple-500' }
  ]

  // If testing a game mode, show the game interface
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🧪 Comprehensive Multiplayer Test Suite</h1>
        <p className="text-lg text-muted-foreground">
          All-in-one testing interface for multiplayer quiz functionality
        </p>
        
        {user ? (
          <Badge variant="default">Logged in as {user.email}</Badge>
        ) : (
          <Badge variant="secondary">Guest user</Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="npcs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            NPCs
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Debug
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="modes" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Game Modes
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multiplayer System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-semibold">{npcs.length}</div>
                  <div className="text-sm text-muted-foreground">NPCs Available</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Network className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="font-semibold">{availableRooms.length}</div>
                  <div className="text-sm text-muted-foreground">Your Rooms</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Play className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-semibold">{gameModes.length}</div>
                  <div className="text-sm text-muted-foreground">Game Modes</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <TestTube className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="font-semibold">{testResults.length}</div>
                  <div className="text-sm text-muted-foreground">Test Results</div>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This test suite consolidates all multiplayer testing functionality. Use the tabs above to access different test categories.
                  {!user && " Some tests require authentication - please log in for full functionality."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NPCs Tab */}
        <TabsContent value="npcs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available NPCs ({npcs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
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

            <Card>
              <CardHeader>
                <CardTitle>NPC Test Controls</CardTitle>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          {user && availableRooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Multiplayer Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 max-h-64 overflow-y-auto">
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
              onClick={testHostAssignment} 
              disabled={isLoading}
              className="h-12 bg-purple-600 hover:bg-purple-700"
            >
              Test Host Assignment
            </Button>
            <Button 
              onClick={() => {
                testRoomLoading()
                testTopicLoading()
                testHostAssignment()
              }} 
              disabled={isLoading}
              className="h-12 bg-green-600 hover:bg-green-700"
            >
              Run All Tests
            </Button>
          </div>
        </TabsContent>

        {/* Room Management Tab */}
        <TabsContent value="rooms" className="space-y-6">
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
        </TabsContent>

        {/* Game Modes Tab */}
        <TabsContent value="modes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {gameModes.map((mode) => (
              <Card key={mode.mode}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${mode.color}`}>
                      {mode.icon}
                    </div>
                    {mode.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {GAME_MODE_CONFIGS[mode.mode]?.timePerQuestion}s per question • 
                      {GAME_MODE_CONFIGS[mode.mode]?.showExplanations ? ' With explanations' : ' Fast-paced'}
                    </p>
                    <Button 
                      onClick={() => createTestRoom(mode.mode)}
                      disabled={isCreatingRoom || !user}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!user && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please log in to test game modes.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Test Results ({testResults.length})</h2>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
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

          {testResults.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No test results yet. Run tests from the other tabs to see results here.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 