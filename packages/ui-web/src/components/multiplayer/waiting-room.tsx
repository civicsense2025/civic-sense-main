"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { ConnectionStatusIndicator } from '@/components/providers/connection-provider'
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
  Target,
  Loader2,
  CheckCircle,
  Circle
} from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@civicsense/shared/hooks/useGuestAccess'
import { usePremium } from '@civicsense/shared/hooks/usePremium'
import { 
  multiplayerOperations,
  getPlayerEmojiOptions, 
  canUseBoosts,
  type MultiplayerRoom,
  type MultiplayerPlayer 
} from '@civicsense/shared/lib/multiplayer'
import { addNPCToRoom } from '@civicsense/shared/lib/multiplayer-npc-integration'
import { enhancedNPCService } from '@civicsense/shared/lib/enhanced-npc-service'
import { type NPCPersonality } from '@civicsense/shared/lib/multiplayer-npcs'
import { useToast } from '@civicsense/shared/hooks/use-toast'

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
  ensurePlayerInRoom: (playerId: string, playerName: string, playerEmoji?: string) => Promise<boolean>
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
  ensurePlayerInRoom,
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
  const [isUpdatingReady, setIsUpdatingReady] = useState(false)
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
  const isFirstPlayer = players.length > 0 && players.sort((a, b) => (a.join_order || 0) - (b.join_order || 0))[0]?.id === playerId
  const isHost = isMarkedAsHost || isFirstPlayer
  
  const hasMinimumPlayers = players.length >= 2
  const allPlayersReady = hasMinimumPlayers && players.every(p => p.is_ready)
  const canStart = isHost && allPlayersReady && !isStarting
  
  // Generate waiting message
  const waitingMessage = (() => {
    if (!hasMinimumPlayers) {
      return `Waiting for ${2 - players.length} more player${2 - players.length === 1 ? '' : 's'}...`
    }
    if (!allPlayersReady) {
      const notReadyCount = players.filter(p => !p.is_ready).length
      return `Waiting for ${notReadyCount} player${notReadyCount === 1 ? '' : 's'} to ready up...`
    }
    if (isHost) {
      return "All players ready! You can start the game."
    }
    return "All players ready! Waiting for host to start..."
  })()

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

  // Auto-rejoin if player is missing from room
  useEffect(() => {
    // Only check if we have a stable room and players list (not loading)
    if (!room || isLoading || !playerId || players.length === 0) {
      return
    }

    const currentPlayer = players.find(p => p.id === playerId)
    
    // If player is missing, try to rejoin
    if (!currentPlayer) {
      console.log('🔄 Player missing from room, attempting rejoin...', { playerId, roomId })
      
      const playerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
      const playerEmoji = selectedEmoji || '😊'
      
      ensurePlayerInRoom(playerId, playerName, playerEmoji)
        .then((success) => {
          if (success) {
            console.log('✅ Successfully rejoined room')
            toast({
              title: "Reconnected to room",
              description: "You've been automatically reconnected to the game.",
            })
          } else {
            console.error('❌ Failed to rejoin room')
            toast({
              title: "Connection lost",
              description: "Unable to reconnect. Please refresh the page.",
              variant: "destructive"
            })
          }
        })
        .catch((err) => {
          console.error('❌ Error rejoining room:', err)
          const errorMessage = err instanceof Error ? err.message : 
                              typeof err === 'string' ? err :
                              'Lost connection to room. Please refresh the page.'
          toast({
            title: "Connection error",
            description: errorMessage,
            variant: "destructive"
          })
        })
    }
  }, [room, players, playerId, isLoading, ensurePlayerInRoom, selectedEmoji, user, toast])

  const handleCopyRoomCode = async () => {
    if (!room?.room_code) return
    
    try {
      const shareUrl = `${window.location.origin}/multiplayer/${room.room_code}`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedCode(true)
      toast({
        title: "Share link copied!",
        description: "Send this link to friends to join the room.",
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

    setIsUpdatingReady(true)
    try {
      await updatePlayerReady(playerId, !currentPlayer.is_ready)
    } catch (err) {
      toast({
        title: "Failed to update ready status",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingReady(false)
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
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Full Width Header */}
      <div className="w-full p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {room.game_mode === 'speed_round' && '⚡'}
                {room.game_mode === 'elimination' && '🏆'}
                {(!['speed_round', 'elimination'].includes(room.game_mode || '')) && '📚'}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {room.room_name || `Topic ${room.topic_id}`}
                </h1>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {players.length}/{room.max_players} players
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <ConnectionStatusIndicator />
            
            {/* Room Code with Copy Button Inside */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
                  {room.room_code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRoomCode}
                  className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Share this room code
              </div>
            </div>
            
            {/* Leave Button */}
            <Button 
              variant="outline" 
              onClick={handleLeaveRoom}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
            >
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Centered Ready Button */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          {canStart ? (
            <>
              <Button
                onClick={handleStartGame}
                disabled={isStarting}
                className="h-16 px-12 text-xl bg-green-600 hover:bg-green-700 text-white rounded-full"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="mr-3 h-6 w-6" />
                    Start Game
                  </>
                )}
              </Button>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All players are ready! Click to begin the quiz.
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={handleToggleReady}
                disabled={!currentPlayer || isUpdatingReady}
                className={`h-16 px-12 text-xl rounded-full ${
                  currentPlayer?.is_ready 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUpdatingReady ? (
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                ) : currentPlayer?.is_ready ? (
                  <CheckCircle className="mr-3 h-6 w-6" />
                ) : (
                  <Circle className="mr-3 h-6 w-6" />
                )}
                {currentPlayer?.is_ready ? 'Ready!' : 'Ready Up'}
              </Button>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {waitingMessage}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Fixed Bottom Player Section */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Players ({players.length}/{room.max_players})
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {players
              // Sort players to show hosts first
              .sort((a, b) => {
                if (a.is_host && !b.is_host) return -1
                if (!a.is_host && b.is_host) return 1
                return (a.join_order || 0) - (b.join_order || 0)
              })
              .map((player) => (
              <div
                key={player.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="text-lg mb-1">{player.player_emoji}</div>
                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {player.player_name}
                  {player.is_host && ' 👑'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {player.is_ready ? (
                    <span className="text-green-600 dark:text-green-400">Ready</span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">Waiting</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add AI Player Card (Dashed Outline) - Only show to hosts */}
            {isHost && players.length < (room.max_players || 8) && (
              <div 
                onClick={() => setShowNPCSelector(true)}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer"
              >
                <div className="text-lg mb-1">🤖</div>
                <div className="font-medium text-sm text-slate-500 dark:text-slate-400">
                  Add AI
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click to add
                </div>
              </div>
            )}
            
            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, (room.max_players || 8) - players.length - (isHost ? 1 : 0)) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"
              >
                <div className="text-lg mb-1 text-slate-300 dark:text-slate-600">👤</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Open</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NPC Selector Modal */}
      {showNPCSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Choose AI Player
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Each AI has unique strengths, weaknesses, and personalities
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNPCSelector(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingNPCs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading AI players...</p>
                  </div>
                </div>
              ) : availableNPCs.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No AI Players Available
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    All AI players are already in the room or there was an error loading them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableNPCs.slice(0, npcDisplayCount).map((npc) => (
                    <div
                      key={npc.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => handleAddNPC(npc.id)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">{npc.emoji}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                            {npc.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                npc.skillLevel === 'beginner' && "text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20",
                                npc.skillLevel === 'intermediate' && "text-yellow-600 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900/20",
                                npc.skillLevel === 'advanced' && "text-red-600 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900/20",
                                npc.skillLevel === 'expert' && "text-purple-600 border-purple-300 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-900/20"
                              )}
                            >
                              {npc.skillLevel}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {npc.accuracyRange[0]}-{npc.accuracyRange[1]}% accuracy
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {npc.description}
                      </p>
                      
                      {npc.traits.specialties.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Strengths:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {npc.traits.specialties.slice(0, 2).map((specialty) => (
                              <span
                                key={specialty}
                                className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded"
                              >
                                {specialty.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {addingNPC ? (
                        <Button
                          disabled
                          className="w-full mt-2 h-8 text-xs"
                        >
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Adding...
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleAddNPC(npc.id)}
                          className="w-full mt-2 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Add {npc.name.split(' ')[0]}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show More Button */}
              {!loadingNPCs && availableNPCs.length > npcDisplayCount && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setNpcDisplayCount(prev => prev + 6)}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    Show More AI Players
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CivicSense Logo - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-10">
        <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            CivicSense
          </span>
        </div>
      </div>
    </div>
  )
}
