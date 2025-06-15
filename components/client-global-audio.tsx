"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Improved dynamic import with error handling and suspense
const GlobalAudioControlsComponent = dynamic(
  () => import('./global-audio-controls').then(mod => ({ default: mod.GlobalAudioControls }))
    .catch(err => {
      console.error('Error loading GlobalAudioControls:', err);
      return { default: () => null };
    }),
  { 
    ssr: false,
    loading: () => null
  }
)

export function ClientGlobalAudio() {
  return (
    <Suspense fallback={null}>
      <GlobalAudioControlsComponent />
    </Suspense>
  )
} 