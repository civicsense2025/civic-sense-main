"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Plus,
  ChevronRight,
  Globe,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { useToast } from '@/hooks/use-toast'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { multiplayerOperations, type CreateRoomOptions } from '@/lib/multiplayer'
import { TopicSelector } from './topic-selector'
import { GameModeCard, type GameMode } from './game-mode-card'
import { RoomCard } from './room-card'
import { JoinRoomForm } from './join-room-form'
import { ProTips } from './pro-tips'
import { MultiplayerLanding } from './multiplayer-landing'
import { AuthDialog } from '@/components/auth/auth-dialog'

// Game mode definitions
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
    id: 'matching',
    name: 'Matching Challenge',
    description: 'Collaborative puzzle-solving with team hints and matching gameplay',
    emoji: '🧩',
    features: ['Puzzle solving', 'Team collaboration', 'Strategy bonuses'],
    difficulty: 'mixed',
    playerRange: [2, 6],
    estimatedTime: '12-18 min'
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
  isCreating: boolean
  isJoining: boolean
  selectedTopic: string | null
  maxPlayers: number
  includeNPCs: boolean
}

export function MultiplayerLobbyNew() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { toast } = useToast()
  const { getOrCreateGuestToken } = useGuestAccess()

  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [state, setState] = useState<LobbyState>({
    selectedGameMode: 'classic',
    isCreating: false,
    isJoining: false,
    selectedTopic: null,
    maxPlayers: 4,
    includeNPCs: true
  })

  const [creationStep, setCreationStep] = useState<'mode' | 'settings' | 'topic'>('mode')
  const [userRooms, setUserRooms] = useState<any[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Load user's rooms and perform cleanup - ONLY run for logged-in users
  useEffect(() => {
    if (!user) return

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
    
    // Optional: refresh when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserRooms()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, getOrCreateGuestToken, user])

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
      
      const guestToken = !user ? `guest_host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
      
      const result = await multiplayerOperations.createRoom(options, user?.id, guestToken)
      console.log('Room created:', result)

      // Navigate to waiting room
      router.push(`/quiz/${result.room.topic_id}/multiplayer?room=${result.room.room_code}&player=${result.player.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
      
      let errorMessage = "Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('error' in error) {
          errorMessage = String(error.error)
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

  const handleJoinRoom = async (roomCode: string) => {
    setState(prev => ({ ...prev, isJoining: true }))

    try {
      const result = await multiplayerOperations.joinRoom({
        roomCode: roomCode.toUpperCase(),
        playerName: user?.user_metadata?.display_name || 'Player',
        playerEmoji: '😊'
      }, user?.id)

      // Navigate to waiting room
      router.push(`/quiz/${result.room.topic_id}/multiplayer?room=${roomCode.toUpperCase()}&player=${result.player.id}`)
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

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  // If user is not logged in, show landing page
  if (!user) {
    return (
      <>
        <MultiplayerLanding onSignIn={() => setShowAuthDialog(true)} />
        <AuthDialog 
          isOpen={showAuthDialog} 
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Clean Hero Header */}
        <div className="text-center py-8 md:py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight">
                Learn Democracy
                <span className="block text-slate-600 dark:text-slate-400">Together</span>
              </h1>
              
              <p className="text-lg md:text-xl font-light text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Join friends or meet new people in interactive civic knowledge games. 
                Build understanding through competition and collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              
              {/* Left Panel - Game Creation */}
              <div className="xl:col-span-2 space-y-12">
                {/* Create Room Section */}
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                        Create Room
                      </h2>
                      <p className="text-base text-slate-600 dark:text-slate-400 font-light">
                        Start a new multiplayer session
                      </p>
                    </div>

                    {/* Progress Indicator */}
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
                          <GameModeCard
                            key={mode.id}
                            mode={mode}
                            isSelected={state.selectedGameMode === mode.id}
                            onSelect={(modeId) => setState(prev => ({ ...prev, selectedGameMode: modeId }))}
                            isPremium={isPremium}
                            isPro={isPro}
                          />
                        ))}
                      </div>

                      {/* Mobile Carousel */}
                      <div className="md:hidden">
                        <div className="flex gap-4 pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                          {GAME_MODES.map((mode) => (
                            <GameModeCard
                              key={mode.id}
                              mode={mode}
                              isSelected={state.selectedGameMode === mode.id}
                              onSelect={(modeId) => setState(prev => ({ ...prev, selectedGameMode: modeId }))}
                              isPremium={isPremium}
                              isPro={isPro}
                              className="min-w-[280px] snap-start"
                            />
                          ))}
                        </div>
                        
                        {/* Mobile carousel indicators */}
                        <div className="flex justify-center gap-2 mt-4">
                          {GAME_MODES.map((mode) => (
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

                {/* Pro Tips - Horizontal Layout */}
                <ProTips />
              </div>

              {/* Right Panel - Join & Your Rooms */}
              <div className="xl:col-span-1 space-y-8">
                {/* Join Room - Desktop */}
                <div className="hidden md:block">
                  <JoinRoomForm
                    onJoin={handleJoinRoom}
                    isJoining={state.isJoining}
                    variant="desktop"
                  />
                </div>

                {/* Your Rooms - Expanded */}
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your Rooms</h3>
                    {isLoadingRooms && (
                      <p className="text-xs text-slate-500 dark:text-slate-500">Loading rooms...</p>
                    )}
                  </div>
                  
                  {userRooms.length > 0 ? (
                    <div className="space-y-4">
                      {userRooms.map((roomData) => (
                        <RoomCard
                          key={roomData.room.id}
                          roomData={roomData}
                          onJoin={handleJoinUserRoom}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-500">
                      {isLoadingRooms ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-3" />
                      ) : (
                        <Globe className="h-6 w-6 mx-auto mb-3 opacity-50" />
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
            
            <JoinRoomForm
              onJoin={handleJoinRoom}
              isJoining={state.isJoining}
              variant="mobile"
            />
          </div>
        </div>
      </div>
    </>
  )
}
