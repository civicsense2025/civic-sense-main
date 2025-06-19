"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  Lock,
  UserPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { useToast } from '@/hooks/use-toast'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { multiplayerOperations, type CreateRoomOptions } from '@/lib/multiplayer'
import { dataService } from '@/lib/data-service'
import { TopicSelector } from './topic-selector'

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
}

export function MultiplayerLobby() {
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { toast } = useToast()
  const { getOrCreateGuestToken } = useGuestAccess()

  const [state, setState] = useState<LobbyState>({
    selectedGameMode: 'classic',
    roomCode: '',
    isCreating: false,
    isJoining: false,
    showAdvanced: false,
    selectedTopic: null,
    maxPlayers: 4,
    includeNPCs: true
  })

  const [creationStep, setCreationStep] = useState<'mode' | 'settings' | 'topic'>('mode')

  const [userRooms, setUserRooms] = useState<any[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Load user's rooms and perform cleanup
  useEffect(() => {
    const loadUserRooms = async () => {
      setIsLoadingRooms(true)
      try {
        // Clean up expired rooms first
        await multiplayerOperations.cleanupExpiredRooms()
        
        // Get user's active rooms
        const guestToken = user ? undefined : getOrCreateGuestToken()
        const rooms = await multiplayerOperations.getUserRooms(user?.id, guestToken)
        
        console.log(`🎮 Loaded ${rooms.length} user rooms`)
        setUserRooms(rooms)
      } catch (error) {
        console.error('Error loading user rooms:', error)
        setUserRooms([])
      } finally {
        setIsLoadingRooms(false)
      }
    }

    loadUserRooms()
    
    // Refresh rooms every 30 seconds to catch status changes
    const interval = setInterval(loadUserRooms, 30000)
    return () => clearInterval(interval)
  }, [user?.id, getOrCreateGuestToken])

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
      // Use selected topic ID or fallback to a known topic
      let topicId = state.selectedTopic
      
      // Fallback to known topic IDs from the database if no topic selected
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
      
      const result = await multiplayerOperations.createRoom(options, user?.id, guestToken)
      console.log('Room created:', result)

      // Navigate to waiting room (no need to join since createRoom already adds the host as a player)
      router.push(`/quiz/${result.room.topic_id}/multiplayer?room=${result.room.room_code}&player=${result.player.id}`)
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

  const handleJoinUserRoom = async (roomData: any) => {
    try {
      // Navigate directly to the room since user is already a player
      router.push(`/quiz/${roomData.room.topic_id}/multiplayer?room=${roomData.room.room_code}&player=${roomData.player.id}`)
    } catch (error) {
      console.error('Error joining user room:', error)
      toast({
        title: "Failed to join room",
        description: "This room may no longer be available.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        {/* Clean Hero Header - Responsive */}
        <div className="text-center py-8 md:py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
            <div className="space-y-2 md:space-y-4">
              {/* Multiplayer Game Icon */}
              <div className="flex justify-center mb-4 md:mb-6">
                <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight">
                Learn Democracy
                <span className="block text-slate-600 dark:text-slate-400">Together</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl font-light text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Join friends or meet new people in interactive civic knowledge games. 
                Build understanding through competition and collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Your Rooms Section - Top */}
        <div className="lg:hidden px-4 mb-6">
          <div className="max-w-4xl mx-auto">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your Rooms</h3>
                  {userRooms.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {userRooms.length}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {userRooms.length > 0 ? (
                  <div className="flex gap-4 pb-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {userRooms.map((roomData) => (
                      <div
                        key={roomData.room.id}
                        className="min-w-[280px] p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900/30 snap-start"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                              {roomData.room.room_name || `${roomData.room.game_mode} Room`}
                            </h4>
                            {roomData.player.is_host && (
                              <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-0">
                                👑 Host
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              roomData.room.room_status === 'waiting' && "text-green-600 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
                              roomData.room.room_status === 'in_progress' && "text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
                              roomData.room.room_status === 'starting' && "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                            )}
                          >
                            {roomData.room.room_status === 'waiting' && '⏳ Waiting'}
                            {roomData.room.room_status === 'starting' && '🚀 Starting'}
                            {roomData.room.room_status === 'in_progress' && '🎮 In Progress'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            {roomData.topic?.emoji || '📝'} {roomData.topic?.topic_title || 'Civic Knowledge'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {roomData.room.current_players}/{roomData.room.max_players}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                            {roomData.room.room_code}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {roomData.room.game_mode}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          onClick={() => handleJoinUserRoom(roomData)}
                        >
                          {roomData.room.room_status === 'waiting' ? 'Join Room' : 'Rejoin Game'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-500">
                    {isLoadingRooms ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-2" />
                    ) : (
                      <Globe className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    )}
                    <p className="text-sm">
                      {isLoadingRooms ? 'Loading your rooms...' : 'No active rooms found'}
                    </p>
                    <p className="text-xs mt-1">
                      {isLoadingRooms ? 'Please wait...' : 'Create your own to get started!'}
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
              
              {/* Left Panel - Game Creation */}
              <div className="xl:col-span-2 space-y-16">
                {/* Create Room Section - Multi-step */}
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 md:space-y-2">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                        Create Room
                      </h2>
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-light">
                        Start a new multiplayer session
                      </p>
                    </div>

                    {/* Progress Indicator - Top Right */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCreationStep('mode')}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          creationStep === 'mode' ? "w-8 bg-slate-600 dark:bg-slate-400" : "w-2 bg-slate-300 dark:bg-slate-700"
                        )}
                        aria-label="Step 1: Choose Mode"
                      />
                      <button
                        onClick={() => creationStep !== 'mode' && setCreationStep('settings')}
                        disabled={creationStep === 'mode'}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          creationStep === 'settings' ? "w-8 bg-slate-600 dark:bg-slate-400" : "w-2 bg-slate-300 dark:bg-slate-700",
                          creationStep === 'mode' && "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Step 2: Configure Settings"
                      />
                      <button
                        onClick={() => creationStep === 'topic' && setCreationStep('topic')}
                        disabled={creationStep !== 'topic'}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          creationStep === 'topic' ? "w-8 bg-slate-600 dark:bg-slate-400" : "w-2 bg-slate-300 dark:bg-slate-700",
                          creationStep !== 'topic' && "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Step 3: Select Topic"
                      />
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>

                  {/* Step 1: Game Mode Selection */}
                  {creationStep === 'mode' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white text-center">Choose Game Mode</h3>
                      
                      {/* Desktop Grid */}
                      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {GAME_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            className={cn(
                              "relative p-6 text-left transition-all duration-200 rounded-xl border",
                              "hover:scale-[1.01] hover:shadow-sm",
                              state.selectedGameMode === mode.id
                                ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30"
                            )}
                            onClick={() => setState(prev => ({ ...prev, selectedGameMode: mode.id }))}
                          >
                            {mode.isPremium && !isPremium && !isPro && (
                              <div className="absolute -top-2 -right-2">
                                <Badge variant="secondary" className="text-xs">
                                  Premium
                                </Badge>
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{mode.emoji}</span>
                                <h4 className="text-base font-medium text-slate-900 dark:text-white">{mode.name}</h4>
                              </div>
                              
                              <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                                {mode.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
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
                          </button>
                        ))}
                      </div>

                      {/* Mobile Carousel */}
                      <div className="md:hidden">
                        <div className="flex gap-4 pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                          {GAME_MODES.map((mode) => (
                            <button
                              key={mode.id}
                              className={cn(
                                "relative min-w-[280px] p-6 text-left transition-all duration-200 rounded-xl border snap-start",
                                "hover:scale-[1.01] hover:shadow-sm",
                                state.selectedGameMode === mode.id
                                  ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50"
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30"
                              )}
                              onClick={() => setState(prev => ({ ...prev, selectedGameMode: mode.id }))}
                            >
                              {mode.isPremium && !isPremium && !isPro && (
                                <div className="absolute -top-2 -right-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Premium
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{mode.emoji}</span>
                                  <h4 className="text-base font-medium text-slate-900 dark:text-white">{mode.name}</h4>
                                </div>
                                
                                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {mode.description}
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
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
                            </button>
                          ))}
                        </div>
                        
                        {/* Mobile carousel indicators */}
                        <div className="flex justify-center gap-2 mt-4">
                          {GAME_MODES.map((mode, index) => (
                            <div
                              key={mode.id}
                              className={cn(
                                "w-2 h-2 rounded-full transition-all duration-200",
                                state.selectedGameMode === mode.id 
                                  ? "bg-slate-600 dark:bg-slate-400" 
                                  : "bg-slate-300 dark:bg-slate-700"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => setCreationStep('settings')}
                          variant="outline"
                          className="px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          Next: Configure Settings
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Settings Configuration */}
                  {creationStep === 'settings' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white text-center">Configure Settings</h3>
                      
                      <div className="max-w-md mx-auto space-y-6">
                        {/* Max Players */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Players</Label>
                          <div className="flex gap-2">
                            {[2, 4, 6, 8].map((num) => (
                              <button
                                key={num}
                                onClick={() => setState(prev => ({ ...prev, maxPlayers: num }))}
                                disabled={selectedMode && (num < selectedMode.playerRange[0] || num > selectedMode.playerRange[1])}
                                className={cn(
                                  "flex-1 py-2 px-3 rounded-lg border transition-all text-sm",
                                  state.maxPlayers === num 
                                    ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white" 
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30",
                                  selectedMode && (num < selectedMode.playerRange[0] || num > selectedMode.playerRange[1]) && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* AI Players Toggle */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Players</Label>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              Add AI-powered opponents with unique personalities and skill levels
                            </p>
                          </div>
                          <button
                            onClick={() => setState(prev => ({ ...prev, includeNPCs: !prev.includeNPCs }))}
                            className={cn(
                              "w-full py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2",
                              state.includeNPCs 
                                ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white" 
                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                            )}
                          >
                            <Bot className="h-4 w-4" />
                            <span className="text-sm">{state.includeNPCs ? 'Enabled' : 'Disabled'}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-3 pt-4">
                        <Button
                          onClick={() => setCreationStep('mode')}
                          variant="ghost"
                          className="px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setCreationStep('topic')}
                          variant="outline"
                          className="px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          Next: Select Topic
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Topic Selection */}
                  {creationStep === 'topic' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white text-center">Select Topic</h3>
                      
                      <TopicSelector
                        selectedTopic={state.selectedTopic}
                        onTopicSelect={(topicId) => setState(prev => ({ ...prev, selectedTopic: topicId }))}
                      />
                      
                      <div className="flex justify-center gap-3 pt-4">
                        <Button
                          onClick={() => setCreationStep('settings')}
                          variant="ghost"
                          className="px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleCreateRoom}
                          disabled={state.isCreating}
                          className="px-8 bg-slate-600 hover:bg-slate-700 dark:bg-slate-400 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg transition-all"
                        >
                          {state.isCreating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900 mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Room
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Join & Browse */}
              <div className="xl:col-span-1 space-y-16">
                {/* Join Room - Desktop */}
                <div className="hidden md:block space-y-6">
                  <div className="space-y-1 lg:space-y-2">
                    <h2 className="text-xl lg:text-2xl font-light text-slate-900 dark:text-white tracking-tight">
                      Join Room
                    </h2>
                    <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 font-light">
                      Enter a room code
                    </p>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>

                  <div className="space-y-4">
                    <Input
                      value={state.roomCode}
                      onChange={(e) => setState(prev => ({ ...prev, roomCode: e.target.value.toUpperCase() }))}
                      placeholder="ABCD1234"
                      className="text-center font-mono text-xl tracking-wider h-14 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600"
                      maxLength={8}
                    />
                    
                    <Button
                      onClick={handleJoinRoom}
                      disabled={state.isJoining || !state.roomCode.trim()}
                      className="w-full h-12 bg-slate-600 hover:bg-slate-700 dark:bg-slate-400 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-light transition-colors"
                    >
                      {state.isJoining ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900 mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Join Room
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Your Rooms - Desktop Only */}
                <div className="hidden lg:block space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your Rooms</h3>
                    {isLoadingRooms && (
                      <p className="text-xs text-slate-500 dark:text-slate-500">Loading rooms...</p>
                    )}
                  </div>
                  
                  {userRooms.length > 0 ? (
                    <div className="space-y-3">
                      {userRooms.map((roomData) => (
                        <div
                          key={roomData.room.id}
                          className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                                {roomData.room.room_name || `${roomData.room.game_mode} Room`}
                              </h4>
                              {roomData.player.is_host && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-0">
                                  👑 Host
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                roomData.room.room_status === 'waiting' && "text-green-600 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
                                roomData.room.room_status === 'in_progress' && "text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
                                roomData.room.room_status === 'starting' && "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                              )}
                            >
                              {roomData.room.room_status === 'waiting' && '⏳ Waiting'}
                              {roomData.room.room_status === 'starting' && '🚀 Starting'}
                              {roomData.room.room_status === 'in_progress' && '🎮 In Progress'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              {roomData.topic?.emoji || '📝'} {roomData.topic?.topic_title || 'Civic Knowledge'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {roomData.room.current_players}/{roomData.room.max_players}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                              {roomData.room.room_code}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {roomData.room.game_mode}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                            onClick={() => handleJoinUserRoom(roomData)}
                          >
                            {roomData.room.room_status === 'waiting' ? 'Join Room' : 'Rejoin Game'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-500">
                      {isLoadingRooms ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-3" />
                      ) : (
                        <Globe className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      )}
                      <p className="text-sm">
                        {isLoadingRooms ? 'Loading your rooms...' : 'No active rooms found'}
                      </p>
                      <p className="text-xs mt-1">
                        {isLoadingRooms ? 'Please wait...' : 'Create your own to get started!'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pro Tips */}
                <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Pro Tips</h4>
                  
                  <div className="space-y-3 text-sm font-light text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p>AI players adapt to your skill level and provide strategic competition</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Learning Lab mode encourages deep thinking and collaborative discussion</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Speed rounds test quick recall and decision-making under pressure</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Join Room - Floating Bottom */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xl">
            {/* Soft glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl -z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-xl blur-sm -z-10"></div>
            
            <div className="space-y-3">
              <div className="text-center mb-3">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Join Room</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Enter a room code</p>
              </div>
              
              <Input
                value={state.roomCode}
                onChange={(e) => setState(prev => ({ ...prev, roomCode: e.target.value.toUpperCase() }))}
                placeholder="ABCD1234"
                className="text-center font-mono text-lg tracking-wider h-12 border-slate-200 dark:border-slate-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-slate-800"
                maxLength={8}
              />
              
              <Button
                onClick={handleJoinRoom}
                disabled={state.isJoining || !state.roomCode.trim()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {state.isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section - Real Talk About Multiplayer */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 pb-32 md:pb-16">
            <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white mb-6 md:mb-8">The Truth About Multiplayer Civics</h2>
            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">How does this actually work?</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Room codes are 8-character keys to your learning session. Here's what they don't tell you: 
                  authenticated users get 24-hour rooms because we trust you're serious about civic education. 
                  Guests get 1 hour—enough to test, not enough to waste server resources.
                </p>
              </div>
              
                              <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Why AI players matter</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our AI players aren't just filling seats—they're modeled on real civic archetypes. The News 
                  Junkie knows current events but fumbles history. The Retired Teacher explains concepts clearly 
                  but misses modern context. They're teaching you how different Americans actually think about democracy.
                </p>
              </div>
              
                              <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Which mode cuts through the BS?</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Classic: Traditional learning with full explanations—when you need depth. Speed Round: Forces 
                  quick thinking like real political decisions. Elimination: High stakes mirror real democracy—wrong 
                  choices have consequences. Learning Lab: Collaborative problem-solving, because democracy isn't a solo sport.
                </p>
              </div>
              
                              <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Remote play = real democracy simulation</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Democracy doesn't require physical proximity—neither does civic education. Create a room, share 
                  the code, connect across distances. This is how modern organizing works. Practice digital 
                  collaboration here, apply it to real political action.
                </p>
              </div>
              
                              <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Group size limits exist for a reason</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  2-8 players per room. Why? Because effective democratic participation happens in small groups, 
                  not mobs. Town halls work. Twitter doesn't. Mix humans and AI to see how group dynamics change 
                  with different perspectives. Premium modes may adjust limits based on pedagogical research.
                </p>
              </div>
              
                              <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-medium text-slate-900 dark:text-white">Disconnection ≠ disengagement</h3>
                <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Lost connection? Your civic education continues. Same room code gets you back in—progress saved, 
                  learning resumed. If the host drops, we pause. Why? Because in real democracy, when leaders fail, 
                  the system should wait for restoration, not collapse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 