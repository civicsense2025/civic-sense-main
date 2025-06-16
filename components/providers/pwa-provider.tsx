"use client"

import { ReactNode } from 'react'
import { PWARegister } from '@/components/pwa-register'
import { OfflineDetector } from '@/components/offline-detector'
import { PWAPrompt } from '@/components/pwa/pwa-prompt'
import { SplashScreen } from '@/components/splash-screen'

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      {/* App launch splash screen */}
      <SplashScreen />

      {/* Register service worker and handle updates */}
      <PWARegister />
      
      {/* Detect online/offline status */}
      <OfflineDetector />
      
      {/* PWA installation prompt */}
      <PWAPrompt />
      
      {/* Render children */}
      {children}
    </>
  )
} 