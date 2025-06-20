"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MultiplayerLanding } from '@/components/multiplayer/multiplayer-landing'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { Header } from '@/components/header'
import { useToast } from '@/hooks/use-toast'
import { multiplayerOperations, type CreateRoomOptions } from '@/lib/multiplayer'

export function MultiplayerMarketingClient() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const searchParams = useSearchParams()
  const joinRoomCode = searchParams.get('join')
  const router = useRouter()
  const { toast } = useToast()

  // If there's a join room code, show auth dialog immediately
  useEffect(() => {
    if (joinRoomCode) {
      setShowAuthDialog(true)
    }
  }, [joinRoomCode])

  const handleTryMode = async (modeId: string) => {
    setIsCreatingRoom(true)
    
    try {
      // Create a guest room for immediate play
      const fallbackTopics = [
        'trump-agency-control-2025',
        '2025-social-media-algorithms', 
        'trump-tariffs-2025',
        'clean-energy-climate-cuts-2025',
        'federal-assistance-restrictions-may2025'
      ]
      
      const topicId = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)]
      const guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const options: CreateRoomOptions = {
        topicId,
        roomName: `Guest ${modeId === 'classic' ? 'Classic Quiz' : 'Speed Round'} Room`,
        maxPlayers: 4,
        gameMode: modeId as any
      }

      console.log('Creating guest room with options:', options)
      
      const result = await multiplayerOperations.createRoom(options, undefined, guestToken)
      console.log('Guest room created:', result)

      // Cache the player ID in localStorage for this room
      try {
        localStorage.setItem(`multiplayerPlayer_${result.room.room_code}`, result.player.id)
        console.log('Cached guest player ID:', result.player.id, 'for room:', result.room.room_code)
      } catch (error) {
        console.warn('Failed to cache player ID:', error)
      }

      // Navigate directly to the game with explicit player ID
      const gameUrl = `/quiz/${result.room.topic_id}/multiplayer?room=${result.room.room_code}&player=${result.player.id}`
      console.log('Navigating to:', gameUrl)
      router.push(gameUrl)
    } catch (error) {
      console.error('Error creating guest room:', error)
      
      toast({
        title: "Failed to create room",
        description: "Please try again or sign up for a better experience.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingRoom(false)
    }
  }

  return (
    <>
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      <MultiplayerLanding 
        onSignIn={() => setShowAuthDialog(true)}
        onTryMode={handleTryMode}
        joinRoomCode={joinRoomCode}
      />
      
      {/* Loading overlay for guest room creation */}
      {isCreatingRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Creating Your Room...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Getting everything ready for multiplayer civic learning
            </p>
          </div>
        </div>
      )}
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={() => {
          setShowAuthDialog(false)
          // If there was a join code, redirect after auth
          if (joinRoomCode) {
            window.location.href = `/multiplayer/join/${joinRoomCode}`
          }
        }}
      />
    </>
  )
} 