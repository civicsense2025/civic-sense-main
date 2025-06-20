"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MultiplayerLanding } from '@/components/multiplayer/multiplayer-landing'
import { AuthDialog } from '@/components/auth/auth-dialog'

export function MultiplayerMarketingClient() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const searchParams = useSearchParams()
  const joinRoomCode = searchParams.get('join')

  // If there's a join room code, show auth dialog immediately
  useEffect(() => {
    if (joinRoomCode) {
      setShowAuthDialog(true)
    }
  }, [joinRoomCode])

  return (
    <>
      <MultiplayerLanding 
        onSignIn={() => setShowAuthDialog(true)}
        joinRoomCode={joinRoomCode}
      />
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