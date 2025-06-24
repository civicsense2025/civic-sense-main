"use client"

import { Suspense, Component, ReactNode, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Safe error boundary component
class AudioErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Audio component error (non-critical):', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ display: 'none' }} />
    }

    return this.props.children
  }
}

// Simplified dynamic import to avoid webpack issues
const GlobalAudioControlsComponent = dynamic(
  () => import('./global-audio-controls').then(mod => ({
    default: mod.GlobalAudioControls
  })).catch(() => ({
    default: () => null
  })),
  { 
    ssr: false,
    loading: () => null
  }
)

export function ClientGlobalAudio() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render on server or before hydration
  if (!isClient || typeof window === 'undefined') {
    return null
  }

  return (
    <AudioErrorBoundary>
      <Suspense fallback={null}>
        <GlobalAudioControlsComponent />
      </Suspense>
    </AudioErrorBoundary>
  )
} 