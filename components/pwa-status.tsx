"use client"

import { useEffect, useState } from 'react'

export function PWAStatus() {
  const [status, setStatus] = useState({
    serviceWorker: 'checking...',
    installable: 'checking...',
    installed: 'checking...',
    displayMode: 'checking...',
    developmentMode: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

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
  }, [])

  const clearServiceWorkerCache = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))
      console.log('Unregistered all service workers')

      // Clear all caches
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('Cleared all caches')

      // Reload the page
      window.location.reload()
    } catch (error) {
      console.error('Error clearing service worker cache:', error)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
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
          <button
            onClick={clearServiceWorkerCache}
            className="mt-2 px-2 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded text-xs font-bold"
          >
            Clear All Cache & SW
          </button>
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