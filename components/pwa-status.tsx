"use client"

import { useEffect, useState } from 'react'
import { debug } from '@/lib/debug-config'

export function PWAStatus() {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState({
    serviceWorker: 'checking...',
    installable: 'checking...',
    installed: 'checking...',
    displayMode: 'checking...',
    developmentMode: false,
  })
  const [debugConfig, setDebugConfig] = useState(debug.getConfig())

  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update debug config when it changes
  useEffect(() => {
    if (!mounted) return
    
    const updateDebugConfig = () => {
      setDebugConfig(debug.getConfig())
    }
    
    // Set up an interval to check for debug config changes
    // Since the debug system doesn't have events, we'll poll
    const interval = setInterval(updateDebugConfig, 1000)
    
    return () => clearInterval(interval)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      setStatus({
        serviceWorker: 'disabled in dev',
        installable: 'disabled in dev',
        installed: 'disabled in dev',
        displayMode: 'development',
        developmentMode: true,
      })
      return
    }

    // Check service worker support
    const swSupported = 'serviceWorker' in navigator
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true
    
    // Check display mode
    let displayMode = 'browser'
    if (window.matchMedia('(display-mode: standalone)').matches) {
      displayMode = 'standalone'
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      displayMode = 'minimal-ui'
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      displayMode = 'fullscreen'
    }

    setStatus({
      serviceWorker: swSupported ? 'supported' : 'not supported',
      installable: 'waiting for event...',
      installed: isStandalone ? 'yes' : 'no',
      displayMode,
      developmentMode: false,
    })

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      setStatus(prev => ({ ...prev, installable: 'yes' }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check for active service worker
    if (swSupported && navigator.serviceWorker.controller) {
      setStatus(prev => ({ ...prev, serviceWorker: 'active' }))
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [mounted])

  const clearServiceWorkerCache = async () => {
    if (!mounted || !('serviceWorker' in navigator)) return

    try {
      // First try to send message to service worker to clear cache
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
        
        // Wait a bit for the service worker to clear cache
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))
      console.log('Unregistered all service workers')

      // Clear all browser caches
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('Cleared all caches')

      // Clear localStorage and sessionStorage for good measure
      localStorage.clear()
      sessionStorage.clear()
      console.log('Cleared local and session storage')

      // Hard reload to bypass any remaining cache
      window.location.href = window.location.href
    } catch (error) {
      console.error('Error clearing service worker cache:', error)
      // Fallback: just do a hard reload
      window.location.href = window.location.href
    }
  }

  const refreshDesignCache = async () => {
    if (!mounted || !('serviceWorker' in navigator)) return

    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_DESIGN_CACHE' })
        console.log('Sent design cache refresh request to service worker')
        
        // Wait a bit and then reload
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        // No service worker, just do a hard reload
        window.location.href = window.location.href
      }
    } catch (error) {
      console.error('Error refreshing design cache:', error)
      window.location.href = window.location.href
    }
  }

  // Don't render anything until mounted on client to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Only show in development AND if debug allows it
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Hide if debug is disabled entirely
  if (!debugConfig.enabled) {
    return null
  }
  
  // Hide if PWA category is disabled
  if (!debugConfig.categories.pwa) {
    return null
  }
  
  // If minimized mode is on, don't show PWA status
  if (debugConfig.minimized) {
    return null
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 p-2 rounded font-mono text-xs ${
      status.developmentMode 
        ? 'bg-amber-900/80 text-amber-100 border border-amber-700' 
        : 'bg-black/80 text-white'
    }`}>
      <div className="font-bold mb-1">
        PWA Status {status.developmentMode && '(Development Mode)'}:
      </div>
      {status.developmentMode ? (
        <div className="space-y-2">
          <div>🚫 PWA disabled to prevent caching issues</div>
          <div>💡 Service workers won't interfere with hot reload</div>
          <div>🔄 Changes will appear immediately</div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={clearServiceWorkerCache}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-red-100 rounded text-xs font-bold"
              title="Clear all service worker caches and storage"
            >
              Clear All Cache
            </button>
            <button
              onClick={refreshDesignCache}
              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-blue-100 rounded text-xs font-bold"
              title="Refresh CSS/JS cache to get latest design"
            >
              Refresh Design
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div>Service Worker: {status.serviceWorker}</div>
          <div>Installable: {status.installable}</div>
          <div>Installed: {status.installed}</div>
          <div>Display Mode: {status.displayMode}</div>
        </div>
      )}
    </div>
  )
} 