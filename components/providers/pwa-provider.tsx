"use client"

import { ReactNode } from 'react'
import { PWARegister } from '@/components/pwa-register'
import { OfflineDetector } from '@/components/offline-detector'

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      {/* Register service worker and handle updates */}
      <PWARegister />
      
      {/* Detect online/offline status */}
      <OfflineDetector />
      
      {/* Render children */}
      {children}
    </>
  )
} 