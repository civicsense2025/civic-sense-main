"use client"

import { ReactNode, Suspense, lazy } from 'react'
import { SplashScreen } from '@/components/splash-screen'

// Lazily load non-critical PWA components
const PWARegister = lazy(() => import('@/components/pwa-register').then(mod => ({ default: mod.PWARegister })))
const OfflineDetector = lazy(() => import('@/components/offline-detector').then(mod => ({ default: mod.OfflineDetector })))
const PWAPrompt = lazy(() => import('@/components/pwa/pwa-prompt').then(mod => ({ default: mod.PWAPrompt })))

// Simple fallback that doesn't affect UI
const EmptyFallback = () => null

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      {/* App launch splash screen */}
      <SplashScreen />

      {/* Children are rendered immediately */}
      {children}
      
      {/* Defer non-critical PWA components */}
      <Suspense fallback={<EmptyFallback />}>
        <PWARegister />
      </Suspense>
      
      <Suspense fallback={<EmptyFallback />}>
        <OfflineDetector />
      </Suspense>
      
      <Suspense fallback={<EmptyFallback />}>
        <PWAPrompt />
      </Suspense>
    </>
  )
} 