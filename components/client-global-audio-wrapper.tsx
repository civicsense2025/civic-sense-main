"use client"

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
  return <ClientGlobalAudio />
} 