"use client"

import { useEffect } from "react"
// TEMPORARILY DISABLED: Global audio controls during monorepo migration
// import { useGlobalAudio } from "@/components/global-audio-controls"

// Temporary stub
const useGlobalAudio = () => ({
  autoPlayEnabled: false,
  readCurrentPage: () => console.log('Auto-read disabled during migration')
})

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