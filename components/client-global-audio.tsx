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
      return null // Return null instead of div to avoid DOM issues
    }

    return this.props.children
  }
}

// More reliable dynamic import
const GlobalAudioControlsComponent = dynamic(
  async () => {
    try {
      const mod = await import('./global-audio-controls')
      return { default: mod.GlobalAudioControls }
    } catch (error) {
      console.warn('Global audio controls not available:', error)
      return { default: () => null }
    }
  },
  { 
    ssr: false,
    loading: () => null
  }
)

export function ClientGlobalAudio() {
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Small delay to ensure full hydration
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Don't render on server or before full hydration
  if (!isClient || !isReady || typeof window === 'undefined') {
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