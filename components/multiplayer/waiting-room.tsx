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
  Bot
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
    <div className="multiplayer-container max-w-4xl mx-auto px-4 sm:px-8 py-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="multiplayer-title">
          {room.room_name || 'Multiplayer Quiz'}
        </h1>
        <p className="multiplayer-text-muted">
          Get ready to test your civic knowledge together!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Room Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Code */}
              <div>
                <Label className="text-sm font-medium">Room Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-lg font-mono tracking-wider">
                    {room.room_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyRoomCode}
                    className="px-3"
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Game Mode */}
              <div>
                <Label className="text-sm font-medium">Game Mode</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {room.game_mode.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Player Count */}
              <div>
                <Label className="text-sm font-medium">Players</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{room.current_players} / {room.max_players}</span>
                </div>
              </div>

              {/* Topic Info */}
              <div>
                <Label className="text-sm font-medium">Topic</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {room.topic_id}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleToggleReady}
                  className={cn(
                    "w-full",
                    currentPlayer?.is_ready 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                  disabled={!currentPlayer}
                >
                  {currentPlayer?.is_ready ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Ready!
                    </>
                  ) : (
                    <>
                      <Timer className="mr-2 h-4 w-4" />
                      Ready Up
                    </>
                  )}
                </Button>

                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={!canStart}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isStarting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Game
                      </>
                    )}
                  </Button>
                )}

                {/* Add AI Player Section (Host Only) */}
                {isHost && room && room.current_players < room.max_players && availableNPCs.length > 0 && (
                  <div className="space-y-2">
                    {!showNPCSelector ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowNPCSelector(true)}
                        disabled={addingNPC}
                        className="w-full"
                      >
                        <Bot className="mr-2 h-4 w-4" />
                        Add AI Player
                      </Button>
                    ) : (
                      <div className="space-y-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Label className="text-sm font-medium">Choose AI Player</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {availableNPCs.slice(0, 4).map((npc) => (
                            <button
                              key={npc.id}
                              onClick={() => handleAddNPC(npc.id)}
                              disabled={addingNPC}
                              className={cn(
                                "flex items-center gap-2 p-2 text-left rounded border transition-colors",
                                "hover:bg-white dark:hover:bg-slate-800",
                                selectedNPC === npc.id ? "border-primary bg-primary/5" : "border-border"
                              )}
                            >
                              <span className="text-lg">{npc.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{npc.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {npc.skillLevel} • {npc.traits.specialties[0]}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNPCSelector(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </div>
                {!allPlayersReady && (
                  <Badge variant="outline" className="text-xs">
                    Waiting for players...
                  </Badge>
                )}
                {allPlayersReady && (
                  <Badge className="text-xs bg-green-600">
                    All Ready!
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      player.is_ready 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                      player.id === playerId && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {/* Player Emoji */}
                    <div className="text-2xl">
                      {player.player_emoji}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {player.player_name}
                          {player.id === playerId && (
                            <span className="text-xs text-muted-foreground ml-1">(You)</span>
                          )}
                        </p>
                        {getPlayerStatusIcon(player)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={getPlayerBadgeVariant(player)}
                          className="text-xs"
                        >
                          {getPlayerStatusText(player)}
                        </Badge>
                        
                        {/* Premium/Pro indicators */}
                        {player.user_id && (
                          <div className="flex items-center gap-1">
                            {canUseBoosts(player, isPremium) && (
                              <Zap className="h-3 w-3 text-yellow-500" />
                            )}
                            {isPro && (
                              <Star className="h-3 w-3 text-purple-500" />
                            )}
                          </div>
                        )}

                        {/* Guest/AI indicator */}
                        {!player.user_id && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              player.guest_token?.startsWith('npc_') 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                                : ''
                            }`}
                          >
                            {player.guest_token?.startsWith('npc_') ? '🤖 AI' : 'Guest'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: room.max_players - players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/25"
                  >
                    <div className="text-2xl text-slate-400">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Waiting for player...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <UserPlus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Share room code to invite
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Game Start Instructions */}
              {allPlayersReady && isHost && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Play className="h-4 w-4" />
                    <p className="font-medium">Ready to start!</p>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    All players are ready. Click "Start Game" to begin the quiz.
                  </p>
                </div>
              )}

              {allPlayersReady && !isHost && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Timer className="h-4 w-4" />
                    <p className="font-medium">Waiting for host</p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    All players are ready. Waiting for the host to start the game.
                  </p>
                </div>
              )}

              {/* Guest Limits Warning */}
              {!user && hasReachedDailyLimit() && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Shield className="h-4 w-4" />
                    <p className="font-medium">Daily limit reached</p>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    You've reached your daily quiz limit as a guest. Sign up for unlimited access!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
