"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { multiplayerOperations, getPlayerEmojiOptions } from '@/lib/multiplayer'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface JoinRoomDialogProps {
  children: React.ReactNode
}

export function JoinRoomDialog({ children }: JoinRoomDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { guestToken, hasReachedDailyLimit } = useGuestAccess()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
  const [selectedEmoji, setSelectedEmoji] = useState('😊')

  const emojiOptions = getPlayerEmojiOptions()

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code to join.",
        variant: "destructive"
      })
      return
    }

    if (!playerName.trim()) {
      toast({
        title: "Player name required",
        description: "Please enter your name to join the room.",
        variant: "destructive"
      })
      return
    }

    // Check guest limits
    if (!user && hasReachedDailyLimit()) {
      toast({
        title: "Daily limit reached",
        description: "Sign up for an account to join multiplayer rooms!",
        variant: "destructive"
      })
      return
    }

    setIsJoining(true)

    try {
      // Join the room
      const { room, player } = await multiplayerOperations.joinRoom({
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
        playerEmoji: selectedEmoji
      }, user?.id, guestToken || undefined)

      toast({
        title: "Joined room!",
        description: `Welcome to room ${room.room_code}.`,
      })

      // Navigate to the multiplayer quiz page
      router.push(`/quiz/${room.topic_id}/multiplayer?room=${room.room_code}&player=${player.id}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to join room:', error)
      toast({
        title: "Failed to join room",
        description: error instanceof Error ? error.message : "Please check the room code and try again.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleRoomCodeChange = (value: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    setRoomCode(cleaned)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Multiplayer Room
          </DialogTitle>
          <DialogDescription>
            Enter a room code to join an existing multiplayer quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Code Input */}
          <div>
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => handleRoomCodeChange(e.target.value)}
              placeholder="Enter 8-character room code"
              className="mt-1 text-center text-lg font-mono tracking-wider uppercase"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ask the host for the room code to join their game
            </p>
          </div>

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

          {/* Guest Limits Warning */}
          {!user && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium text-sm">Guest Player</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                You're playing as a guest with daily limits. Sign up for unlimited access and to save your progress!
              </p>
            </div>
          )}

          {/* Daily Limit Warning */}
          {!user && hasReachedDailyLimit() && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium text-sm">Daily Limit Reached</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                You've reached your daily quiz limit. Sign up for an account to continue playing!
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
              onClick={handleJoinRoom}
              disabled={isJoining || !roomCode.trim() || !playerName.trim() || (!user && hasReachedDailyLimit())}
              className="flex-1"
            >
              {isJoining ? (
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
      </DialogContent>
    </Dialog>
  )
} 