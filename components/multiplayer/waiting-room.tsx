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
  Copy, 
  Check, 
  Crown, 
  Gamepad2, 
  Settings, 
  Play, 
  UserPlus,
  LogOut,
  Timer,
  Zap,
  Shield,
  Star,
  Bot,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { usePremium } from '@/hooks/usePremium'
import { 
  multiplayerOperations,
  getPlayerEmojiOptions, 
  canUseBoosts,
  type MultiplayerRoom,
  type MultiplayerPlayer 
} from '@/lib/multiplayer'
import { addNPCToRoom } from '@/lib/multiplayer-npc-integration'
import { enhancedNPCService } from '@/lib/enhanced-npc-service'
import { type NPCPersonality } from '@/lib/multiplayer-npcs'
import { useToast } from '@/hooks/use-toast'

interface WaitingRoomProps {
  roomId: string
  playerId: string
  room: MultiplayerRoom | null
  players: MultiplayerPlayer[]
  isLoading: boolean
  error: string | null
  updatePlayerReady: (playerId: string, isReady: boolean) => Promise<void>
  startGame: () => Promise<boolean>
  leaveRoom: (playerId: string) => Promise<void>
  onGameStart: () => void
}

export function WaitingRoom({ 
  roomId, 
  playerId, 
  room,
  players,
  isLoading,
  error,
  updatePlayerReady,
  startGame,
  leaveRoom,
  onGameStart 
}: WaitingRoomProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { hasReachedDailyLimit } = useGuestAccess()
  const { toast } = useToast()
  
  const [copiedCode, setCopiedCode] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('😊')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [addingNPC, setAddingNPC] = useState(false)
  const [selectedNPC, setSelectedNPC] = useState<string>('news_junkie')
  const [showNPCSelector, setShowNPCSelector] = useState(false)
  const [availableNPCs, setAvailableNPCs] = useState<NPCPersonality[]>([])
  const [loadingNPCs, setLoadingNPCs] = useState(true)
  const [npcDisplayCount, setNpcDisplayCount] = useState(6)
  const [npcSearchQuery, setNpcSearchQuery] = useState('')

  const currentPlayer = players.find(p => p.id === playerId)
  
  // Check if user is host - either marked as host OR is the first player (fallback)
  const isMarkedAsHost = currentPlayer?.is_host || false
  const isFirstPlayer = players.length > 0 && players.sort((a, b) => a.join_order - b.join_order)[0]?.id === playerId
  const isHost = isMarkedAsHost || isFirstPlayer
  
  const hasMinimumPlayers = players.length >= 2
  const allPlayersReady = hasMinimumPlayers && players.every(p => p.is_ready)
  const canStart = isHost && allPlayersReady && !isStarting

  // Load NPCs from database
  useEffect(() => {
    const loadNPCs = async () => {
      try {
        setLoadingNPCs(true)
        const allNPCs = await enhancedNPCService.getAllNPCs()
        // Filter out NPCs that are already in the room
        const filteredNPCs = allNPCs.filter(npc => 
          !players.some(p => p.guest_token === `npc_${npc.id}`)
        )
        setAvailableNPCs(filteredNPCs)
      } catch (error) {
        console.error('Error loading NPCs:', error)
        toast({
          title: "Failed to load AI players",
          description: "Using fallback AI players.",
          variant: "destructive"
        })
        // Fallback to empty array if database fails
        setAvailableNPCs([])
      } finally {
        setLoadingNPCs(false)
      }
    }

    loadNPCs()
  }, [players, toast])

  // Debug logging
  console.log('🚀 WaitingRoom Debug:', {
    playerId,
    currentPlayer,
    isMarkedAsHost,
    isFirstPlayer,
    isHost,
    hasMinimumPlayers,
    allPlayersReady,
    canStart,
    playersCount: players.length,
    players: players.map(p => ({ id: p.id, name: p.player_name, isHost: p.is_host, isReady: p.is_ready, joinOrder: p.join_order }))
  })
  
  // Handle game start
  useEffect(() => {
    if (room?.room_status === 'in_progress') {
      onGameStart()
    }
  }, [room?.room_status, onGameStart])

  const handleCopyRoomCode = async () => {
    if (!room?.room_code) return
    
    try {
      await navigator.clipboard.writeText(room.room_code)
      setCopiedCode(true)
      toast({
        title: "Room code copied!",
        description: "Share this code with friends to invite them.",
      })
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the room code manually.",
        variant: "destructive"
      })
    }
  }

  const handleToggleReady = async () => {
    if (!currentPlayer) return

    // Check guest limits
    if (!user && hasReachedDailyLimit()) {
      toast({
        title: "Daily limit reached",
        description: "Sign up for an account to continue playing!",
        variant: "destructive"
      })
      return
    }

    try {
      await updatePlayerReady(playerId, !currentPlayer.is_ready)
    } catch (err) {
      toast({
        title: "Failed to update ready status",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleStartGame = async () => {
    if (!canStart) return
    
    setIsStarting(true)
    try {
      const success = await startGame()
      if (!success) {
        toast({
          title: "Cannot start game",
          description: "Make sure all players are ready.",
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Failed to start game",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(playerId)
      router.push('/')
    } catch (err) {
      toast({
        title: "Failed to leave room",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddNPC = async (npcId?: string) => {
    if (!room || !isHost) return
    
    const npcToAdd = npcId || selectedNPC
    const npcData = availableNPCs.find(npc => npc.id === npcToAdd)
    
    if (!npcData) {
      toast({
        title: "NPC not found",
        description: "Please select a valid AI player.",
        variant: "destructive"
      })
      return
    }
    
    setAddingNPC(true)
    try {
      const result = await addNPCToRoom(room.room_code, npcToAdd)
      
      if (!result.success) {
        toast({
          title: "Failed to add AI player",
          description: result.error || "Please try again.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "AI player added!",
        description: `${npcData.name} joined the room.`,
      })
      
      setShowNPCSelector(false)
    } catch (error) {
      toast({
        title: "Failed to add AI player",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setAddingNPC(false)
    }
  }

  const getPlayerStatusIcon = (player: MultiplayerPlayer) => {
    if (player.is_host) return <Crown className="h-4 w-4 text-yellow-500" />
    if (player.is_ready) return <Check className="h-4 w-4 text-green-500" />
    return <Timer className="h-4 w-4 text-slate-400" />
  }

  const getPlayerStatusText = (player: MultiplayerPlayer) => {
    if (player.is_host && player.is_ready) return "Host • Ready"
    if (player.is_host) return "Host • Waiting"
    if (player.is_ready) return "Ready"
    return "Waiting"
  }

  const getPlayerBadgeVariant = (player: MultiplayerPlayer) => {
    if (player.is_ready) return "default"
    return "secondary"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The room could not be found."}</p>
          <Button onClick={() => router.push('/')} className="rounded-xl">
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        {/* Clean Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {room.game_mode === 'speed_round' && '⚡'}
                  {room.game_mode === 'elimination' && '🏆'}
                  {(!['speed_round', 'elimination'].includes(room.game_mode)) && '📚'}
                </div>
                <div>
                  <h1 className="text-xl font-medium text-slate-900 dark:text-white">
                    {room.room_name || 'Multiplayer Quiz'}
                  </h1>
                  <p className="text-sm font-light text-slate-500 dark:text-slate-500">Room {room.room_code}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {room.game_mode.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                  <Users className="h-4 w-4" />
                  <span>{room.current_players}/{room.max_players}</span>
                </div>
              </div>
            </div>

            {/* Room Code Display */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide">Share Code</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-lg font-mono tracking-wider text-slate-900 dark:text-white">
                    {room.room_code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyRoomCode}
                    className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={handleLeaveRoom}
                className="text-slate-500 dark:text-slate-500 hover:text-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>
        </div>

        {/* Main Game Lobby */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto h-full">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 h-full">
              
              {/* Players Area - Takes most space */}
              <div className="xl:col-span-3">
                <div className="h-full space-y-8">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                        Players
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        {!allPlayersReady ? (
                          <Badge variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">
                            <Timer className="h-3 w-3 mr-1" />
                            Waiting for players...
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Check className="h-3 w-3 mr-1" />
                            All Ready!
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm font-light text-slate-500 dark:text-slate-500">
                      {players.length} of {room.max_players} players
                    </p>
                  </div>

                  {/* Players Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className={cn(
                          "relative p-8 rounded-2xl border transition-all duration-300",
                          player.is_ready 
                            ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900/50 shadow-sm" 
                            : "border-slate-200 dark:border-slate-800",
                          player.id === playerId && "ring-2 ring-slate-400 dark:ring-slate-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
                          "hover:scale-[1.02]"
                        )}
                      >
                        {/* Player Status Indicator */}
                        <div className="absolute -top-2 -right-2">
                          {player.is_ready ? (
                            <div className="w-6 h-6 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white dark:text-slate-900" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <Timer className="h-3 w-3 text-slate-500 dark:text-slate-500" />
                            </div>
                          )}
                        </div>

                        {/* Host Crown */}
                        {player.is_host && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-slate-900 dark:bg-white rounded-full p-1">
                              <Crown className="h-4 w-4 text-white dark:text-slate-900" />
                            </div>
                          </div>
                        )}

                        {/* Player Info */}
                        <div className="text-center space-y-3">
                          <div className="text-4xl">{player.player_emoji}</div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {player.player_name}
                            {player.id === playerId && (
                              <span className="block text-xs text-slate-500 dark:text-slate-500 font-light">(You)</span>
                            )}
                          </h3>
                          
                          <div className="flex flex-wrap justify-center gap-2">
                            {player.is_host && (
                              <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs">
                                Host
                              </Badge>
                            )}
                            
                            {!player.user_id && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs border-slate-200 dark:border-slate-800",
                                  player.guest_token?.startsWith('npc_') 
                                    ? 'text-slate-600 dark:text-slate-400' 
                                    : 'text-slate-500 dark:text-slate-500'
                                )}
                              >
                                {player.guest_token?.startsWith('npc_') ? '🤖 AI' : 'Guest'}
                              </Badge>
                            )}

                            {canUseBoosts(player, isPremium) && (
                              <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: room.max_players - players.length }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="text-4xl text-slate-300 dark:text-slate-700 mb-3">👤</div>
                        <p className="text-sm font-light text-slate-500 dark:text-slate-500 mb-2">Waiting for player...</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
                          <UserPlus className="h-3 w-3" />
                          <span>Share room code</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Game Status Messages */}
                  {allPlayersReady && isHost && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center mx-auto">
                          <Play className="h-6 w-6 text-white dark:text-slate-900" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">Ready to Launch!</h3>
                          <p className="text-sm font-light text-slate-600 dark:text-slate-400">All players are ready. Start the quiz when you're ready.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {allPlayersReady && !isHost && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Timer className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">Waiting for Host</h3>
                          <p className="text-sm font-light text-slate-600 dark:text-slate-400">All players are ready. The host will start the game.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Topic Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                        <Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Quiz Topic</h4>
                        <p className="text-sm font-light text-slate-500 dark:text-slate-500">{room.topic_id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div className="xl:col-span-1 space-y-8">
                {/* Ready Button */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Player Status</h3>
                  
                  <Button
                    onClick={handleToggleReady}
                    className={cn(
                      "w-full h-14 text-lg font-light transition-all duration-300 rounded-xl",
                      currentPlayer?.is_ready 
                        ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white shadow-lg" 
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
                    )}
                    disabled={!currentPlayer}
                  >
                    {currentPlayer?.is_ready ? (
                      <>
                        <Check className="mr-3 h-5 w-5" />
                        Ready!
                      </>
                    ) : (
                      <>
                        <Timer className="mr-3 h-5 w-5" />
                        Ready Up
                      </>
                    )}
                  </Button>
                </div>

                {/* Host Controls */}
                {isHost && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Host Controls</h3>
                    
                    <div className="space-y-4">
                      {/* Start Game Button */}
                      <Button
                        onClick={handleStartGame}
                        disabled={!canStart}
                        className={cn(
                          "w-full h-12 font-light transition-all duration-300 rounded-xl",
                          canStart 
                            ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white shadow-lg"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-900 dark:text-slate-600"
                        )}
                      >
                        {isStarting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900 mr-2" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Game
                          </>
                        )}
                      </Button>

                      {/* Add AI Player */}
                      {room && room.current_players < room.max_players && availableNPCs.length > 0 && (
                        <div>
                          {!showNPCSelector ? (
                            <Button
                              variant="outline"
                              onClick={() => setShowNPCSelector(true)}
                              disabled={addingNPC}
                              className="w-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              Add AI Player
                            </Button>
                          ) : (
                            <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-slate-900 dark:text-white">Choose AI Player</Label>
                                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500">
                                  {availableNPCs.length} available
                                </Badge>
                              </div>
                              
                              {/* Search Input */}
                              {availableNPCs.length > 6 && (
                                <div className="relative">
                                  <Input
                                    placeholder="Search AI players..."
                                    value={npcSearchQuery}
                                    onChange={(e) => {
                                      setNpcSearchQuery(e.target.value)
                                      setNpcDisplayCount(6)
                                    }}
                                    className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                  />
                                  {npcSearchQuery && (
                                    <button
                                      onClick={() => {
                                        setNpcSearchQuery('')
                                        setNpcDisplayCount(6)
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                      <span className="text-xs">✕</span>
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {(() => {
                                  const filteredNPCs = availableNPCs.filter(npc => {
                                    if (!npcSearchQuery.trim()) return true
                                    const query = npcSearchQuery.toLowerCase()
                                    const name = npc.name.toLowerCase()
                                    const specialties = npc.traits.specialties.join(' ').toLowerCase()
                                    const skillLevel = npc.skillLevel.toLowerCase()
                                    return name.includes(query) || specialties.includes(query) || skillLevel.includes(query)
                                  })
                                  
                                  const displayCount = npcSearchQuery.trim() 
                                    ? Math.min(20, filteredNPCs.length) 
                                    : npcDisplayCount
                                  const displayNPCs = filteredNPCs.slice(0, displayCount)
                                  
                                  if (loadingNPCs) {
                                    return (
                                      <div className="text-center py-4 text-slate-500 dark:text-slate-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-2"></div>
                                        <div className="text-xs">Loading AI players...</div>
                                      </div>
                                    )
                                  }
                                  
                                  if (displayNPCs.length === 0) {
                                    return (
                                      <div className="text-center py-4 text-slate-500 dark:text-slate-500">
                                        <div className="text-xs">
                                          {npcSearchQuery.trim() ? 'No AI players found' : 'No AI players available'}
                                        </div>
                                      </div>
                                    )
                                  }
                                  
                                  return (
                                    <>
                                      {displayNPCs.map((npc) => (
                                        <button
                                          key={npc.id}
                                          onClick={() => handleAddNPC(npc.id)}
                                          disabled={addingNPC}
                                          className={cn(
                                            "flex items-center gap-3 p-3 text-left rounded-lg border transition-all duration-200 w-full",
                                            "hover:border-slate-300 dark:hover:border-slate-700",
                                            "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950",
                                            addingNPC && "opacity-50 cursor-not-allowed"
                                          )}
                                        >
                                          <span className="text-xl">{npc.emoji}</span>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{npc.name}</p>
                                              <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500">
                                                {npc.skillLevel}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                              {npc.traits.specialties.slice(0, 2).join(', ')}
                                            </p>
                                          </div>
                                        </button>
                                      ))}
                                      
                                      {/* Load More Button */}
                                      {!npcSearchQuery.trim() && filteredNPCs.length > npcDisplayCount && (
                                        <div className="text-center py-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNpcDisplayCount(prev => prev + 6)}
                                            className="text-xs h-8 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                          >
                                            Load {Math.min(6, filteredNPCs.length - npcDisplayCount)} more
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                              
                              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowNPCSelector(false)
                                    setNpcSearchQuery('')
                                    setNpcDisplayCount(6)
                                  }}
                                  className="flex-1 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Game Info */}
                <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Game Info</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-500">Mode:</span>
                      <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {room.game_mode.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-500">Players:</span>
                      <span className="text-slate-900 dark:text-white font-medium">{room.current_players}/{room.max_players}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-500">Status:</span>
                      <span className={cn(
                        "font-medium",
                        allPlayersReady ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {allPlayersReady ? "Ready to Start" : "Waiting"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning Messages */}
                {!user && hasReachedDailyLimit() && (
                  <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                      <Shield className="h-5 w-5" />
                      <h4 className="font-medium">Daily Limit Reached</h4>
                    </div>
                    <p className="text-sm font-light text-amber-600 dark:text-amber-400">
                      You've reached your daily quiz limit as a guest. Sign up for unlimited access!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
