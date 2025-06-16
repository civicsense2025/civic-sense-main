"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

export function PWARegister() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('PWA: Service Worker is supported')
      
      window.addEventListener('load', () => {
        console.log('PWA: Window loaded, registering service worker')
        
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('PWA: Service Worker registered with scope:', registration.scope)
            setServiceWorkerRegistration(registration)
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              console.log('PWA: Update found for service worker')
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  console.log('PWA: Service worker state changed to:', newWorker.state)
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('PWA: New content is available')
                    setUpdateAvailable(true)
                    toast({
                      title: "Update available!",
                      description: "A new version is available. Click to update.",
                      action: (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            newWorker.postMessage({ type: 'SKIP_WAITING' })
                            window.location.reload()
                          }}
                        >
                          Update
                        </Button>
                      ),
                      duration: 10000,
                    })
                  }
                })
              }
            })
          })
          .catch(error => {
            console.error('PWA: Service Worker registration failed:', error)
          })
      })

      // Handle service worker updates
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('PWA: Service worker controller changed')
        if (!refreshing) {
          refreshing = true
          console.log('PWA: Reloading page to apply updates')
          window.location.reload()
        }
      })
    } else {
      console.log('PWA: Service Worker is not supported in this browser')
    }
  }, [])

  // Handle install prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: window-controls-overlay)').matches ||
          (window.navigator as any).standalone === true
      
      console.log('PWA: Is app in standalone mode?', isStandalone)
      setIsInstalled(isStandalone)

      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt event fired')
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault()
        // Stash the event so it can be triggered later
        setDeferredPrompt(e)
        setIsInstallable(true)
      })

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        console.log('PWA: App was installed successfully')
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
      })
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    console.log('PWA: Showing install prompt')
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice
    
    // Reset the deferred prompt variable
    setDeferredPrompt(null)
    
    if (choiceResult.outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt')
    } else {
      console.log('PWA: User dismissed the install prompt')
    }
  }

  // Update the service worker
  const handleUpdate = () => {
    if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
      console.log('PWA: Skipping waiting and applying update')
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // No UI rendering by default - this component just handles registration
  return null
} 