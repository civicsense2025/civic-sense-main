"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Simplified dynamic import to avoid webpack issues
const ClientGlobalAudio = dynamic(
  () => import('@/components/client-global-audio').then(mod => ({
    default: mod.ClientGlobalAudio
  })).catch(err => {
    console.warn('ClientGlobalAudio not available:', err);
    // Return a safe fallback component
    return { default: () => null };
  }),
  { 
    ssr: false,
    loading: () => null
  }
)

export function GlobalAudioWrapper() {
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render on client after hydration
  if (!isMounted || hasError) {
    return null
  }

  return (
    <div suppressHydrationWarning>
      <ClientGlobalAudio />
    </div>
  )
} 