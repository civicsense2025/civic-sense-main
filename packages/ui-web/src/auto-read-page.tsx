"use client"

import { useEffect } from "react"
import { useGlobalAudio } from "./global-audio-controls"

interface AutoReadPageProps {
  delay?: number // Delay in ms before reading
  minContentLength?: number // Minimum content length to trigger reading
}

export function AutoReadPage({ delay = 2000, minContentLength = 100 }: AutoReadPageProps) {
  const { autoPlayEnabled, readCurrentPage } = useGlobalAudio()

  useEffect(() => {
    if (autoPlayEnabled) {
      // Auto-read page content when component mounts and autoplay is enabled
      const timer = setTimeout(() => {
        readCurrentPage()
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [autoPlayEnabled, readCurrentPage, delay])

  // This component doesn't render anything visible
  return null
} 