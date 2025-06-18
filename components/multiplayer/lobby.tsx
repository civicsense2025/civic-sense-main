"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Zap, 
  Target, 
  Brain, 
  Trophy, 
  Clock, 
  Plus,
  Search,
  Filter,
  Gamepad2,
  Bot,
  Globe,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { useToast } from '@/hooks/use-toast'
import { multiplayerOperations, type CreateRoomOptions } from '@/lib/multiplayer'
import { dataService } from '@/lib/data-service'

// Game mode definitions
export interface GameMode {
  id: string
  name: string
  description: string
  emoji: string
  features: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  playerRange: [number, number]
  estimatedTime: string
  isPremium?: boolean
}

const GAME_MODES: GameMode[] = [
  {
    id: 'classic',
    name: 'Classic Quiz',
    description: 'Traditional quiz format with detailed explanations after each question',
    emoji: '📚',
    features: ['Detailed explanations', 'Balanced pacing', 'Educational focus'],
    difficulty: 'mixed',
    playerRange: [2, 6],
    estimatedTime: '10-15 min'
  },
  {
    id: 'speed_round',
    name: 'Speed Round',
    description: 'Fast-paced questions for quick thinking and competitive play',
    emoji: '⚡',
    features: ['Quick answers', 'Real-time leaderboard', 'Adrenaline rush'],
    difficulty: 'intermediate',
    playerRange: [2, 8],
    estimatedTime: '5-8 min'
  },
  {
    id: 'learning_lab',
    name: 'Learning Lab',
    description: 'Collaborative exploration with AI teachers and discussion',
    emoji: '🧪',
    features: ['AI teachers', 'Group discussion', 'Deep learning'],
    difficulty: 'mixed',
    playerRange: [2, 4],
    estimatedTime: '15-20 min',
    isPremium: true
  },
  {
    id: 'elimination',
    name: 'Elimination',
    description: 'Last player standing wins in this high-stakes format',
    emoji: '🏆',
    features: ['High stakes', 'Progressive difficulty', 'Winner takes all'],
    difficulty: 'advanced',
    playerRange: [3, 10],
    estimatedTime: '8-12 min'
  }
]

interface LobbyState {
  selectedGameMode: string
  roomCode: string
  isCreating: boolean
  isJoining: boolean
  showAdvanced: boolean
  selectedTopic: string | null
  maxPlayers: number
  includeNPCs: boolean
  topicSearchQuery: string
  topicsDisplayCount: number
}

export function MultiplayerLobby() {
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { toast } = useToast()

  const [state, setState] = useState<LobbyState>({
    selectedGameMode: 'classic',
    roomCode: '',
    isCreating: false,
    isJoining: false,
    showAdvanced: false,
    selectedTopic: null,
    maxPlayers: 4,
    includeNPCs: true,
    topicSearchQuery: '',
    topicsDisplayCount: 15
  })

  const [topics, setTopics] = useState<any[]>([])
  const [publicRooms, setPublicRooms] = useState<any[]>([])

  // Load available topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsData = await dataService.getAllTopics()
        // dataService.getAllTopics() returns a Record<string, TopicMetadata>, convert to array
        if (topicsData && typeof topicsData === 'object') {
          const topicsArray = Object.values(topicsData)
          // Sort by date (newest first) and load ALL topics
          const sortedTopics = topicsArray.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime()
            const dateB = new Date(b.date || 0).getTime()
            return dateB - dateA
          })
          setTopics(sortedTopics) // Load ALL topics, not just 10
          console.log(`🎮 Loaded ${sortedTopics.length} topics for multiplayer lobby`)
        } else {
          console.warn('Unexpected topics data format:', topicsData)
          setTopics([])
        }
      } catch (error) {
        console.error('Error loading topics:', error)
        setTopics([])
        
        // If topics fail to load, we can still create rooms with a fallback topic
        console.log('🎮 Topics failed to load, will use fallback topic for room creation')
      }
    }
    loadTopics()
  }, [])

  // Load public rooms (mock for now)
  useEffect(() => {
    // TODO: Implement actual public room fetching
    setPublicRooms([
      {
        id: '1',
        name: 'Constitutional Quiz Night',
        gameMode: 'classic',
        players: 3,
        maxPlayers: 6,
        topic: 'Constitutional Law',
        host: 'Sarah M.',
        isPublic: true
      },
      {
        id: '2',
        name: 'Speed Politics',
        gameMode: 'speed_round',
        players: 2,
        maxPlayers: 4,
        topic: 'Current Events',
        host: 'Mike R.',
        isPublic: true
      }
    ])
  }, [])

  const selectedMode = GAME_MODES.find(mode => mode.id === state.selectedGameMode)

  const handleCreateRoom = async () => {
    if (!selectedMode) return
    
    // Check premium requirements
    if (selectedMode.isPremium && !isPremium && !isPro) {
      toast({
        title: "Premium Feature",
        description: "This game mode requires a premium subscription.",
        variant: "destructive"
      })
      return
    }

    setState(prev => ({ ...prev, isCreating: true }))

    try {
      // Use a real topic ID - either selected by user or first available topic
      let topicId = state.selectedTopic
      if (!topicId && topics.length > 0) {
        // Use the first available topic as default
        topicId = topics[0].topic_id || topics[0].id
      }
      
      // Fallback to known topic IDs from the database if no topics loaded
      if (!topicId) {
        // These are real topic IDs from the question_topics table
        const fallbackTopics = [
          'trump-agency-control-2025',
          '2025-social-media-algorithms', 
          'trump-tariffs-2025',
          'clean-energy-climate-cuts-2025',
          'federal-assistance-restrictions-may2025'
        ]
        topicId = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)]
        console.log(`🎮 Using fallback topic: ${topicId}`)
      }

      const options: CreateRoomOptions = {
        topicId,
        roomName: `${selectedMode.name} Room`,
        maxPlayers: state.maxPlayers,
        gameMode: selectedMode.id as any
      }

      console.log('Creating room with options:', options)
      
      // Generate a guest token if user is not logged in
      const guestToken = !user ? `guest_host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
      
      const room = await multiplayerOperations.createRoom(options, user?.id, guestToken)
      console.log('Room created:', room)
      
      // Join the room as host
      const result = await multiplayerOperations.joinRoom({
        roomCode: room.room_code,
        playerName: user?.user_metadata?.display_name || 'Host',
        playerEmoji: '👑'
      }, user?.id, guestToken)
      console.log('Joined room as host:', result)

      // Navigate to waiting room
      router.push(`/quiz/${room.topic_id}/multiplayer?room=${room.room_code}&player=${result.player.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
      
      // Better error handling
      let errorMessage = "Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('error' in error) {
          errorMessage = String(error.error)
        } else if ('code' in error) {
          // Handle PostgreSQL error codes
          const pgError = error as any
          if (pgError.code === '42P17') {
            errorMessage = "Database configuration issue. Please try again in a moment."
          } else {
            errorMessage = `Database error (${pgError.code}): ${pgError.message || 'Unknown error'}`
          }
        } else {
          errorMessage = JSON.stringify(error)
        }
      }
      
      toast({
        title: "Failed to create room",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, isCreating: false }))
    }
  }

  const handleJoinRoom = async () => {
    if (!state.roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code to join.",
        variant: "destructive"
      })
      return
    }

    setState(prev => ({ ...prev, isJoining: true }))

    try {
      const result = await multiplayerOperations.joinRoom({
        roomCode: state.roomCode.toUpperCase(),
        playerName: user?.user_metadata?.display_name || 'Player',
        playerEmoji: '😊'
      }, user?.id)

      // Navigate to waiting room
      router.push(`/quiz/${result.room.topic_id}/multiplayer?room=${state.roomCode.toUpperCase()}&player=${result.player.id}`)
    } catch (error) {
      console.error('Error joining room:', error)
      toast({
        title: "Failed to join room",
        description: "Check your room code and try again.",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, isJoining: false }))
    }
  }

  const handleJoinPublicRoom = async (room: any) => {
    try {
      const result = await multiplayerOperations.joinRoom({
        roomCode: room.code || 'DEMO123', // TODO: Use actual room code
        playerName: user?.user_metadata?.display_name || 'Player',
        playerEmoji: '😊'
      }, user?.id)

      router.push(`/quiz/demo/multiplayer?room=${room.code || 'DEMO123'}&player=${result.player.id}`)
    } catch (error) {
      console.error('Error joining public room:', error)
      toast({
        title: "Failed to join room",
        description: "This room may be full or no longer available.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="multiplayer-container max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="multiplayer-title">
          🎮 Multiplayer Civic Learning
        </h1>
        <p className="multiplayer-subtitle">
          Join friends or meet new people in interactive civic knowledge games. 
          Learn together, compete fairly, and build understanding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Play Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Choose Your Game Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GAME_MODES.map((mode) => (
                  <div
                    key={mode.id}
                    className={cn(
                      "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50",
                      "hover:shadow-md dark:hover:shadow-slate-800/50",
                      state.selectedGameMode === mode.id
                        ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    )}
                    onClick={() => setState(prev => ({ ...prev, selectedGameMode: mode.id }))}
                  >
                    {mode.isPremium && !isPremium && !isPro && (
                      <Badge className="absolute -top-2 -right-2 bg-amber-500">
                        Premium
                      </Badge>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{mode.emoji}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{mode.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {mode.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {mode.features.slice(0, 2).map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {mode.playerRange[0]}-{mode.playerRange[1]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mode.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedMode && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {selectedMode.emoji} {selectedMode.name} Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedMode.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Max Players</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {[2, 4, 6, 8].map((num) => (
                      <Button
                        key={num}
                        variant={state.maxPlayers === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, maxPlayers: num }))}
                        disabled={selectedMode && (num < selectedMode.playerRange[0] || num > selectedMode.playerRange[1])}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Include AI Players</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant={state.includeNPCs ? "default" : "outline"}
                      size="sm"
                      onClick={() => setState(prev => ({ ...prev, includeNPCs: !prev.includeNPCs }))}
                      className="flex items-center gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      {state.includeNPCs ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Topic Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quiz Topic ({topics.length} available)</Label>
                <div className="space-y-2">
                  {topics.length > 0 ? (
                    <div className="space-y-2">
                      {/* Random Topic Option */}
                      <Button
                        variant={!state.selectedTopic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, selectedTopic: null }))}
                        className="justify-start h-auto p-3 w-full"
                      >
                        <span className="text-lg mr-3">🎲</span>
                        <div className="text-left">
                          <div className="font-medium text-sm">Random Topic</div>
                          <div className="text-xs text-muted-foreground">Surprise me with any topic!</div>
                        </div>
                      </Button>
                      
                                             {/* Scrollable Topic List */}
                       <div className="border rounded-lg p-2 bg-slate-50 dark:bg-slate-900/50">
                         <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                           Choose a specific topic:
                         </div>
                         
                         {/* Search Input */}
                         <div className="mb-3 px-2">
                           <div className="relative">
                             <Input
                               placeholder="Search topics..."
                               value={state.topicSearchQuery}
                               onChange={(e) => setState(prev => ({ 
                                 ...prev, 
                                 topicSearchQuery: e.target.value,
                                 topicsDisplayCount: 15 // Reset display count when searching
                               }))}
                               className="h-8 text-xs pr-8"
                             />
                             {state.topicSearchQuery && (
                               <button
                                 onClick={() => setState(prev => ({ 
                                   ...prev, 
                                   topicSearchQuery: '',
                                   topicsDisplayCount: 15 
                                 }))}
                                 className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                               >
                                 <span className="text-xs">✕</span>
                               </button>
                             )}
                           </div>
                           {state.topicSearchQuery && (
                             <div className="text-xs text-muted-foreground mt-1 px-1">
                               {topics.filter(topic => {
                                 const query = state.topicSearchQuery.toLowerCase()
                                 const title = (topic.topic_title || topic.title || '').toLowerCase()
                                 const date = topic.date ? new Date(topic.date).toLocaleDateString() : ''
                                 return title.includes(query) || date.includes(query)
                               }).length} topics found
                             </div>
                           )}
                         </div>
                         
                         <div className="max-h-64 overflow-y-auto space-y-1">
                           {(() => {
                             // Filter topics based on search query
                             const filteredTopics = topics.filter(topic => {
                               if (!state.topicSearchQuery.trim()) return true
                               const query = state.topicSearchQuery.toLowerCase()
                               const title = (topic.topic_title || topic.title || '').toLowerCase()
                               const date = topic.date ? new Date(topic.date).toLocaleDateString() : ''
                               return title.includes(query) || date.includes(query)
                             })
                             
                             // Show more topics when searching, or use display count
                             const displayCount = state.topicSearchQuery.trim() 
                               ? Math.min(50, filteredTopics.length) 
                               : state.topicsDisplayCount
                             const displayTopics = filteredTopics.slice(0, displayCount)
                             
                             if (displayTopics.length === 0) {
                               return (
                                 <div className="text-center py-4 text-muted-foreground">
                                   <div className="text-xs">No topics found</div>
                                   <div className="text-xs">Try a different search term</div>
                                 </div>
                               )
                             }
                             
                             return (
                               <>
                                 {displayTopics.map((topic) => (
                                   <button
                                     key={topic.topic_id || topic.id}
                                     onClick={() => setState(prev => ({ ...prev, selectedTopic: topic.topic_id || topic.id }))}
                                     className={cn(
                                       "w-full text-left p-2 rounded transition-colors",
                                       "hover:bg-white dark:hover:bg-slate-800",
                                       state.selectedTopic === (topic.topic_id || topic.id)
                                         ? "bg-primary text-primary-foreground"
                                         : "bg-transparent"
                                     )}
                                   >
                                     <div className="flex items-start gap-2">
                                       <span className="text-sm mt-0.5">{topic.emoji || '📝'}</span>
                                       <div className="flex-1 min-w-0">
                                         <div className="font-medium text-xs truncate">
                                           {topic.topic_title || topic.title}
                                         </div>
                                         <div className="text-xs opacity-75 truncate">
                                           {topic.date ? new Date(topic.date).toLocaleDateString() : 'Civic Knowledge'}
                                         </div>
                                       </div>
                                     </div>
                                   </button>
                                 ))}
                                 
                                 {/* Load More Button */}
                                 {!state.topicSearchQuery.trim() && filteredTopics.length > state.topicsDisplayCount && (
                                   <div className="text-center py-2">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => setState(prev => ({ 
                                         ...prev, 
                                         topicsDisplayCount: prev.topicsDisplayCount + 15 
                                       }))}
                                       className="text-xs h-7"
                                     >
                                       Load {Math.min(15, filteredTopics.length - state.topicsDisplayCount)} more topics
                                     </Button>
                                   </div>
                                 )}
                                 
                                 {/* Search Results Summary */}
                                 {state.topicSearchQuery.trim() && filteredTopics.length > displayCount && (
                                   <div className="text-center py-2 text-xs text-muted-foreground">
                                     Showing {displayCount} of {filteredTopics.length} matching topics
                                   </div>
                                 )}
                               </>
                             )
                           })()}
                         </div>
                      </div>
                      
                      {/* Selected Topic Display */}
                      {state.selectedTopic && (
                        <div className="p-2 bg-primary/10 rounded border">
                          <div className="text-xs font-medium text-primary">Selected Topic:</div>
                          {(() => {
                            const selectedTopicData = topics.find(t => (t.topic_id || t.id) === state.selectedTopic)
                            return selectedTopicData ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span>{selectedTopicData.emoji || '📝'}</span>
                                <span className="text-xs font-medium truncate">
                                  {selectedTopicData.topic_title || selectedTopicData.title}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Topic not found</div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="text-sm">Loading topics...</div>
                      <div className="text-xs mt-1">This may take a moment</div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleCreateRoom}
                disabled={state.isCreating}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {state.isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create {selectedMode?.name} Room
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Join & Browse Section */}
        <div className="space-y-6">
          {/* Join with Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Join with Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roomCode" className="text-sm font-medium">
                  Room Code
                </Label>
                <Input
                  id="roomCode"
                  value={state.roomCode}
                  onChange={(e) => setState(prev => ({ ...prev, roomCode: e.target.value.toUpperCase() }))}
                  placeholder="ABCD1234"
                  className="mt-1 text-center font-mono text-lg tracking-wider"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                disabled={state.isJoining || !state.roomCode.trim()}
                className="w-full"
              >
                {state.isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Room'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Public Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Public Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {publicRooms.length > 0 ? (
                <div className="space-y-3">
                  {publicRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{room.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {room.gameMode}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{room.topic}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.players}/{room.maxPlayers}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => handleJoinPublicRoom(room)}
                      >
                        Join Room
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No public rooms available</p>
                  <p className="text-xs">Create your own to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                  <p>AI players adapt to your skill level and provide helpful hints</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                  <p>Learning Lab mode encourages discussion and deep thinking</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                  <p>Speed rounds are great for testing quick recall</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 