"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { X, Download, Smartphone, Monitor, Zap, Star, ArrowUp } from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from "@/lib/auth"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAPromptProps {
  className?: string
}

interface PWADisplayMode {
  type: 'standalone' | 'browser' | 'minimal-ui' | 'fullscreen'
  isInstalled: boolean
  isInstallable: boolean
}

export function PWAPrompt({ className }: PWAPromptProps) {
  const { user } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [displayMode, setDisplayMode] = useState<PWADisplayMode>({
    type: 'browser',
    isInstalled: false,
    isInstallable: false
  })
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)
  const [showMobileInstructions, setShowMobileInstructions] = useState(false)
  const promptShownRef = useRef(false)

  // Detect PWA display mode and installation status
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://')

    // Check display mode
    let detectedMode: PWADisplayMode['type'] = 'browser'
    if (window.matchMedia('(display-mode: standalone)').matches) {
      detectedMode = 'standalone'
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      detectedMode = 'minimal-ui'
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      detectedMode = 'fullscreen'
    }

    setDisplayMode(prev => ({
      ...prev,
      type: detectedMode,
      isInstalled: isStandalone
    }))

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    const dismissedDate = dismissed ? new Date(dismissed) : null
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Reset dismissal after 7 days
    if (dismissedDate && dismissedDate < sevenDaysAgo) {
      localStorage.removeItem('pwa-prompt-dismissed')
      setHasBeenDismissed(false)
    } else if (dismissed) {
      setHasBeenDismissed(true)
    }
  }, [])

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      setDisplayMode(prev => ({
        ...prev,
        isInstallable: true
      }))

      // Show prompt after user has interacted with the app a bit
      if (!hasBeenDismissed && !promptShownRef.current && user) {
        setTimeout(() => {
          setShowPrompt(true)
          promptShownRef.current = true
        }, 3000) // Wait 3 seconds
      }
    }

    const handleAppInstalled = () => {
      console.log('PWA: App installed')
      setDisplayMode(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false
      }))
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Track installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'home_screen_install'
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [hasBeenDismissed, user])

  // Handle manual install prompt
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: show manual instructions
      setShowMobileInstructions(true)
      return
    }

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      console.log('PWA: User choice result:', choiceResult.outcome)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('PWA: User dismissed the install prompt')
        handleDismiss()
      }
    } catch (error) {
      console.error('PWA: Error during installation:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setHasBeenDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString())
    
    // Track dismissal
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'pwa_prompt_dismissed', {
        event_category: 'engagement',
        event_label: 'home_screen_prompt'
      })
    }
  }

  const handleShowPrompt = () => {
    setShowPrompt(true)
    promptShownRef.current = true
  }

  // Don't show if app is already installed or not installable
  if (displayMode.isInstalled || (!displayMode.isInstallable && !showMobileInstructions)) {
    return null
  }

  // Mobile instructions modal
  if (showMobileInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Add to Home Screen</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileInstructions(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Install CivicSense for the best experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">1</span>
                </div>
                <div>
                  <p className="font-medium">Tap the share button</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Usually at the bottom of your browser</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">2</span>
                </div>
                <div>
                  <p className="font-medium">Select "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scroll down if you don't see it</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">3</span>
                </div>
                <div>
                  <p className="font-medium">Tap "Add"</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">CivicSense will appear on your home screen</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Star className="h-3 w-3" />
                <span>Faster access • Offline support • Native feel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main PWA prompt
  if (!showPrompt) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShowPrompt}
        className={cn(
          "fixed bottom-20 right-4 z-40 bg-white/90 dark:bg-black/90 backdrop-blur border shadow-lg hover:shadow-xl transition-all duration-300",
          "hidden sm:flex", // Only show on mobile
          className
        )}
      >
        <Download className="h-4 w-4 mr-2" />
        Install App
      </Button>
    )
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-white/0 dark:from-black dark:via-black dark:to-black/0",
      "sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:bg-none sm:p-0",
      className
    )}>
      <Card className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <CardTitle className="text-lg font-semibold">Install CivicSense</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Get the full app experience with offline access
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-medium">Faster</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Native speed</p>
            </div>
            
            <div className="space-y-1">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto">
                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-medium">Offline</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Works anywhere</p>
            </div>
            
            <div className="space-y-1">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto">
                <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-medium">Native</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">App-like feel</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="px-6"
            >
              Not now
            </Button>
          </div>

          {/* Additional info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            <div className="flex items-center justify-center space-x-1">
              <Star className="h-3 w-3" />
              <span>Free • No ads • Works offline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// PWA Status indicator (for development/debugging)
export function PWAStatus() {
  const [status, setStatus] = useState<{
    isInstalled: boolean
    isInstallable: boolean
    displayMode: string
  }>({
    isInstalled: false,
    isInstallable: false,
    displayMode: 'browser'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone

      let displayMode = 'browser'
      if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = 'standalone'
      } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        displayMode = 'minimal-ui'
      } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
        displayMode = 'fullscreen'
      }

      setStatus({
        isInstalled: isStandalone,
        isInstallable: false, // Will be updated by beforeinstallprompt
        displayMode
      })
    }

    const handleBeforeInstallPrompt = () => {
      setStatus(prev => ({ ...prev, isInstallable: true }))
    }

    checkPWAStatus()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Mode: {status.displayMode}</div>
      <div>Installed: {status.isInstalled ? 'Yes' : 'No'}</div>
      <div>Installable: {status.isInstallable ? 'Yes' : 'No'}</div>
    </div>
  )
} 