"use client"

import { useEffect, useState } from 'react'

export function PWAStatus() {
  const [status, setStatus] = useState({
    serviceWorker: 'checking...',
    installable: 'checking...',
    installed: 'checking...',
    displayMode: 'checking...',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

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
    })

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', () => {
      setStatus(prev => ({ ...prev, installable: 'yes' }))
    })

    // Check for active service worker
    if (swSupported && navigator.serviceWorker.controller) {
      setStatus(prev => ({ ...prev, serviceWorker: 'active' }))
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>PWA Status:</div>
      <div>Service Worker: {status.serviceWorker}</div>
      <div>Installable: {status.installable}</div>
      <div>Installed: {status.installed}</div>
      <div>Display Mode: {status.displayMode}</div>
    </div>
  )
} 