"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Users, Gamepad2, Zap, Clock, Target, Shield, Bot, Brain, Puzzle } from 'lucide-react'
import { useAuth } from "../../components/ui"
import { useGuestAccess } from '@civicsense/business-logic/hooks/useGuestAccess'
import { usePremium } from '@civicsense/business-logic/hooks/usePremium'
import { multiplayerOperations, getPlayerEmojiOptions } from '../lib/multiplayer/operations'
import { createBalancedNPCMix, NPCBehaviorEngine } from '../lib/multiplayer/operations-npcs'
import { useToast } from "../../components/ui"
import { cn } from '@civicsense/business-logic/utils'

interface CreateRoomDialogProps {
  topicId: string
  topicTitle: string
  children: React.ReactNode
}

export function CreateRoomDialog({ topicId, topicTitle, children }: CreateRoomDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { guestToken, hasReachedDailyLimit } = useGuestAccess()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [gameMode, setGameMode] = useState<'classic' | 'speed_round' | 'matching' | 'elimination' | 'team_battle' | 'learning_lab'>('classic')
  const [playerName, setPlayerName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
  const [selectedEmoji, setSelectedEmoji] = useState('😊')
  const [fillWithNPCs, setFillWithNPCs] = useState(true)
  const [npcDifficulty, setNpcDifficulty] = useState<'mixed' | 'easy' | 'hard'>('mixed')

  const emojiOptions = getPlayerEmojiOptions()

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Player name required",
        description: "Please enter your name to create a room.",
        variant: "destructive"
      })
      return
    }

    // Check guest limits
    if (!user && hasReachedDailyLimit()) {
      toast({
        title: "Daily limit reached",
        description: "Sign up for an account to create multiplayer rooms!",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      // Create the room
      const { room } = await multiplayerOperations.createRoom({
        topicId,
        roomName: roomName.trim() || undefined,
        maxPlayers: parseInt(maxPlayers),
        gameMode
      }, user?.id)

      // Join the room as host
      const { player } = await multiplayerOperations.joinRoom({
        roomCode: room.room_code,
        playerName: playerName.trim(),
        playerEmoji: selectedEmoji
             }, user?.id, guestToken || undefined)

      // Mark the host
      await multiplayerOperations.updatePlayerReady(room.id, player.id, false)

      toast({
        title: "Room created!",
        description: `Room ${room.room_code} is ready for players.`,
      })

      // Navigate to the multiplayer quiz page
      router.push(`/quiz/${topicId}/multiplayer?room=${room.room_code}&player=${player.id}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create room:', error)
      toast({
        title: "Failed to create room",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getGameModeDescription = (mode: string) => {
    switch (mode) {
      case 'classic':
        return 'Traditional quiz with standard timing and scoring'
      case 'speed_round':
        return 'Faster questions with time pressure and speed bonuses'
      case 'matching':
        return 'Collaborative puzzle-solving with team hints and matching challenges'
      case 'elimination':
        return 'Players eliminated after wrong answers - last one standing wins'
      case 'team_battle':
        return 'Team-based competition with collaborative scoring'
      case 'learning_lab':
        return 'Collaborative exploration with AI teachers and group discussion'
      default:
        return 'Standard quiz mode'
    }
  }

  const getGameModeIcon = (mode: string) => {
    switch (mode) {
      case 'classic':
        return <Target className="h-4 w-4" />
      case 'speed_round':
        return <Zap className="h-4 w-4" />
      case 'matching':
        return <Puzzle className="h-4 w-4" />
      case 'elimination':
        return <Shield className="h-4 w-4" />
      case 'team_battle':
        return <Users className="h-4 w-4" />
      case 'learning_lab':
        return <Brain className="h-4 w-4" />
      default:
        return <Gamepad2 className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Multiplayer Room
          </DialogTitle>
          <DialogDescription>
            Set up a room for <strong>{topicTitle}</strong> and invite friends to compete!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Your Emoji</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {emojiOptions.slice(0, 16).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "p-2 text-xl rounded-lg border-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-transparent"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Room Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName">Room Name (Optional)</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter a room name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maxPlayers">Max Players</Label>
              <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="6">6 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Game Mode</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {(['classic', 'speed_round', 'matching', 'elimination', 'team_battle', 'learning_lab'] as const).map((mode) => (
                  <Card
                    key={mode}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900",
                      gameMode === mode && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => setGameMode(mode)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {getGameModeIcon(mode)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">
                              {mode.replace('_', ' ')}
                            </p>
                            {mode !== 'classic' && (
                              <Badge variant="outline" className="text-xs">
                                {isPremium || isPro ? 'Available' : 'Premium'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getGameModeDescription(mode)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* NPC Settings */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fillWithNPCs"
                  checked={fillWithNPCs}
                  onCheckedChange={(checked) => setFillWithNPCs(checked === true)}
                />
                <Label htmlFor="fillWithNPCs" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Fill empty slots with AI players
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Add AI opponents if not enough players join
              </p>

              {fillWithNPCs && (
                <div className="mt-3">
                  <Label>AI Difficulty</Label>
                  <Select value={npcDifficulty} onValueChange={(value: 'mixed' | 'easy' | 'hard') => setNpcDifficulty(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Good for beginners</SelectItem>
                      <SelectItem value="mixed">Mixed - Varied skill levels</SelectItem>
                      <SelectItem value="hard">Hard - Expert opponents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Premium Features Notice */}
          {!isPremium && !isPro && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Zap className="h-4 w-4" />
                <p className="font-medium text-sm">Premium Features</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Some game modes and features require a premium account. Upgrade to unlock all multiplayer options!
              </p>
            </div>
          )}

          {/* Guest Limits Warning */}
          {!user && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <p className="font-medium text-sm">Guest Limits</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                As a guest, you can create rooms but have daily limits. Sign up for unlimited access!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || !playerName.trim() || (!isPremium && !isPro && gameMode !== 'classic')}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Room
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 