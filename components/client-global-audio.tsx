"use client"

import dynamic from 'next/dynamic'

const GlobalAudioControls = dynamic(
  () => import('./global-audio-controls').then(mod => mod.GlobalAudioControls),
  { ssr: false }
)

export function ClientGlobalAudio() {
  return <GlobalAudioControls />
} 