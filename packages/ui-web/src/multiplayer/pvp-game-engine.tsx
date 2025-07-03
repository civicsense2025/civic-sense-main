"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from '@civicsense/shared/useGuestAccess'
import { multiplayerOperations } from '@/lib/multiplayer/operations'
import { Share2, Copy, Home } from "lucide-react"
import { toast } from "../ui/use-toast"
import type { QuizQuestion } from '@civicsense/shared/quiz-data'

interface PvPGameEngineProps {
  questions: QuizQuestion[]
  topicId: string
  topicTitle: string
  onExit: () => void
}

export function PvPGameEngine({
  questions,
  topicId,
  topicTitle,
  onExit
}: PvPGameEngineProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [players, setPlayers] = useState<any[]>([])
  const [gameStarted, setGameStarted] = useState(false)

    // Subscribe to room updates
  useEffect(() => {
    if (!roomCode) return

    // Use the singleton supabase client (already imported above)
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const connectedPlayers = Object.values(state).flat()
        setPlayers(connectedPlayers)
        
        // Start game when we have 2 players
        if (connectedPlayers.length === 2) {
          setGameStarted(true)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomCode])

  // Handle room creation or joining on mount
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        setIsCreatingRoom(true)
        const searchParams = new URLSearchParams(window.location.search)
        const existingRoomCode = searchParams.get('room')
        
        if (existingRoomCode) {
          // Join existing room
          const guestToken = !user ? getOrCreateGuestToken() : undefined
          const result = await multiplayerOperations.joinRoom({
            roomCode: existingRoomCode,
            playerName: user?.user_metadata?.name || 'Player 2',
            playerEmoji: '😊'
          }, user?.id, guestToken)
          setRoomCode(result.room.room_code)
          setPlayers(prev => [...prev, result.player])
        } else {
          // Create new room
          const guestToken = !user ? getOrCreateGuestToken() : undefined
          const result = await multiplayerOperations.createRoom({
            topicId,
            gameMode: 'classic',
            maxPlayers: 2
          }, user?.id, !user ? guestToken : undefined)
          setRoomCode(result.room.room_code)
          setPlayers(prev => [...prev, result.player])
        }
      } catch (error) {
        console.error('Failed to initialize room:', error)
        toast({
          title: "Error",
          description: "Failed to setup game room. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsCreatingRoom(false)
      }
    }
    initializeRoom()
  }, [topicId, user, getOrCreateGuestToken])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/quiz/${topicId}/multiplayer?room=${roomCode}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Share this link with your friend to join the game.",
    })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/quiz/${topicId}/multiplayer?room=${roomCode}`
    try {
      await navigator.share({
        title: `Join my CivicSense PvP Quiz: ${topicTitle}`,
        text: "Let's test our civic knowledge together!",
        url
      })
    } catch (error) {
      // Fall back to copying the link
      handleCopyLink()
    }
  }

  if (isCreatingRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Creating your game room...</p>
        </div>
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950 p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-light">PvP Mode</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {topicTitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl text-center">
              <div className="text-6xl mb-4">👤</div>
              <div className="font-medium">Player 1</div>
              <div className="text-sm text-slate-500">(You)</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl text-center">
              <div className="text-6xl mb-4">⌛</div>
              <div className="font-medium">Waiting...</div>
              <div className="text-sm text-slate-500">for Player 2</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button onClick={handleShare} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Game Link
              </Button>
              <Button onClick={handleCopyLink} variant="outline" className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy Game Link
              </Button>
            </div>
            
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Room Code: <span className="font-mono">{roomCode}</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            onClick={onExit}
            className="mt-8"
          >
            <Home className="w-4 h-4 mr-2" />
            Exit Game
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Game interface will go here once a player joins */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl">👤</div>
          <div>
            <div className="font-medium">Player 1</div>
            <div className="text-sm text-slate-500">Score: 0</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <div className="font-medium text-right">Player 2</div>
            <div className="text-sm text-slate-500">Score: 0</div>
          </div>
          <div className="text-2xl">👤</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium mb-4">question title</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Question options will go here */}
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Option {i}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 