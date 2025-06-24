"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ClientGlobalAudio with error handling
const ClientGlobalAudio = dynamic(
  () => import('@/components/client-global-audio').then(mod => mod.ClientGlobalAudio)
    .catch(err => {
      console.error('Error loading ClientGlobalAudio:', err);
      return () => null;
    }),
  { ssr: false }
)

export function GlobalAudioWrapper() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render on client after hydration
  if (!isMounted) {
    return null
  }

  return <ClientGlobalAudio />
} 