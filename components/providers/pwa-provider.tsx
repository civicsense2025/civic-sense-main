"use client"

import { ReactNode, Suspense, lazy, useEffect, useState } from 'react'
import { debug } from "@/lib/debug-config"

// ============================================================================
// OPTIMIZED PWA PROVIDER FOR PERFORMANCE
// ============================================================================

// ✅ Ultra-lightweight lazy loading - only when actually needed
const PWARegister = lazy(() => 
  import('@/components/pwa-register').then(mod => ({ 
    default: mod.PWARegister 
  })).catch(() => ({ 
    default: () => null // Graceful fallback
  }))
)

const OfflineDetector = lazy(() => 
  import('@/components/offline-detector').then(mod => ({ 
    default: mod.OfflineDetector 
  })).catch(() => ({ 
    default: () => null // Graceful fallback
  }))
)

interface PWAProviderProps {
  children: ReactNode
}

// ✅ Empty fallback that never renders - zero performance impact
const EmptyFallback = () => null

/**
 * Optimized PWA Provider that doesn't block initial page load
 * - Completely disabled in development to prevent caching conflicts
 * - Only loads PWA components after page is fully interactive
 * - Uses intersection observer to defer loading until needed
 * - Graceful fallbacks for all PWA features
 */
export function PWAProvider({ children }: PWAProviderProps) {
  const [shouldLoadPWA, setShouldLoadPWA] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)

  useEffect(() => {
    // ✅ Completely disable PWA in development for better DX
    if (process.env.NODE_ENV === 'development') {
      if (!sessionStorage.getItem('pwa-dev-warned')) {
        debug.log('pwa', '🚫 PWA disabled in development to prevent caching issues')
        sessionStorage.setItem('pwa-dev-warned', 'true')
      }
      return
    }

    // ✅ Only proceed in production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    // ✅ Ultra-aggressive deferring - wait for complete interactivity
    const enablePWAFeatures = () => {
      // Use requestIdleCallback for maximum performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Additional delay to ensure no interference with Core Web Vitals
          setTimeout(() => {
            setIsPageReady(true)
            setShouldLoadPWA(true)
          }, 3000) // 3 second delay for initial page performance
        }, { timeout: 5000 })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          setIsPageReady(true)
          setShouldLoadPWA(true)
        }, 4000) // Even longer fallback delay
      }
    }

    // ✅ Check readiness states with multiple triggers
    if (document.readyState === 'complete') {
      enablePWAFeatures()
    } else {
      // Wait for both DOM and all resources
      window.addEventListener('load', enablePWAFeatures, { once: true })
      
      // Additional safety net
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(enablePWAFeatures, 2000)
      }, { once: true })
    }

    return () => {
      window.removeEventListener('load', enablePWAFeatures)
    }
  }, [])

  // ✅ Additional performance check - only load if user is still active
  useEffect(() => {
    if (!shouldLoadPWA || !isPageReady) return

    let userIsActive = true
    
    const handleVisibilityChange = () => {
      userIsActive = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Delay PWA loading if user switches tabs
    const finalCheck = setTimeout(() => {
      if (!userIsActive) {
        debug.log('pwa', '👤 User inactive, deferring PWA registration')
        setShouldLoadPWA(false)
      }
    }, 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(finalCheck)
    }
  }, [shouldLoadPWA, isPageReady])

  return (
    <>
      {/* ✅ Children render immediately - zero PWA interference */}
      {children}
      
      {/* ✅ PWA features only load when safe and beneficial */}
      {shouldLoadPWA && isPageReady && process.env.NODE_ENV === 'production' && (
        <>
          {/* PWA Registration - Most critical */}
          <Suspense fallback={<EmptyFallback />}>
            <PWARegister />
          </Suspense>
          
          {/* Offline Detection - Lower priority */}
          <Suspense fallback={<EmptyFallback />}>
            <OfflineDetector />
          </Suspense>
        </>
      )}
    </>
  )
}

// ============================================================================
// PWA READINESS CHECKER (OPTIONAL UTILITY)
// ============================================================================

/**
 * Hook to check if PWA features should be enabled
 * Useful for conditional PWA feature loading
 */
export function usePWAReadiness() {
  const [isReady, setIsReady] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check PWA support
    const checkSupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasManifest = 'manifest' in document.createElement('link')
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
      
      return hasServiceWorker && hasManifest && isSecure
    }

    setIsSupported(checkSupport())

    // Only enable in production after delay
    if (process.env.NODE_ENV === 'production' && checkSupport()) {
      const timer = setTimeout(() => setIsReady(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  return { isReady, isSupported }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Track PWA loading performance
 */
export function trackPWAPerformance(event: string, duration?: number) {
  if (process.env.NODE_ENV === 'development') {
    debug.log('pwa', `Performance: ${event}${duration ? ` (${duration}ms)` : ''}`)
  }

  // In production, you could send this to analytics
  if (process.env.NODE_ENV === 'production' && 'performance' in window) {
    performance.mark(`pwa-${event}`)
    
    if (duration && typeof window !== 'undefined' && 'gtag' in window) {
      // Example: Send to Google Analytics
      // @ts-ignore
      window.gtag?.('event', 'timing_complete', {
        name: `pwa_${event}`,
        value: Math.round(duration)
      })
    }
  }
} 