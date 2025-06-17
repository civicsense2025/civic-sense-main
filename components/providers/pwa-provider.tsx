"use client"

import { ReactNode, Suspense, lazy, useEffect, useState } from 'react'

// Only load PWA components when they're actually needed
const PWARegister = lazy(() => import('@/components/pwa-register').then(mod => ({ default: mod.PWARegister })))
const OfflineDetector = lazy(() => import('@/components/offline-detector').then(mod => ({ default: mod.OfflineDetector })))

// Simple fallback that doesn't affect UI
const EmptyFallback = () => null

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [shouldLoadPWA, setShouldLoadPWA] = useState(false)

  useEffect(() => {
    // Completely disable PWA in development to prevent caching issues
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA: Disabled in development mode to prevent caching issues')
      return
    }

    // Only load PWA components in production after the page is fully interactive
    const enablePWA = () => {
      // Wait for page to be fully loaded and then some
      setTimeout(() => {
        setShouldLoadPWA(true)
      }, 2000)
    }

    if (document.readyState === 'complete') {
      enablePWA()
    } else {
      window.addEventListener('load', enablePWA)
      return () => window.removeEventListener('load', enablePWA)
    }
  }, [])

  return (
    <>
      {/* Remove splash screen completely - it's causing conflicts */}
      
      {/* Children are rendered immediately without any PWA interference */}
      {children}
      
      {/* Only load PWA components in production after page is fully loaded */}
      {shouldLoadPWA && process.env.NODE_ENV === 'production' && (
        <>
          <Suspense fallback={<EmptyFallback />}>
            <PWARegister />
          </Suspense>
          
          <Suspense fallback={<EmptyFallback />}>
            <OfflineDetector />
          </Suspense>
        </>
      )}
    </>
  )
} 