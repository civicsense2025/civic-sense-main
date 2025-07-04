"use client"

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Download, Check, Smartphone, Monitor, AlertCircle } from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showWhenNotInstallable?: boolean
}

export function PWAInstallButton({ 
  variant = 'default', 
  size = 'default',
  className = '',
  showWhenNotInstallable = false
}: PWAInstallButtonProps) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: window-controls-overlay)').matches ||
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }
      
      // Check if iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      setIsIOS(isIOSDevice)
      
      // Check if desktop (roughly)
      const isDesktopDevice = window.innerWidth >= 1024 && !('ontouchstart' in window)
      setIsDesktop(isDesktopDevice)
      
      // Listen for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: any) => {
        console.log('PWA: beforeinstallprompt event fired')
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault()
        // Stash the event so it can be triggered later
        setDeferredPrompt(e)
        setIsInstallable(true)
      }
      
      // Listen for app installed event
      const handleAppInstalled = () => {
        console.log('PWA: App installed')
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt()
        
        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice
        
        // Reset the deferred prompt variable
        setDeferredPrompt(null)
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt')
        } else {
          console.log('PWA: User dismissed the install prompt')
        }
      } catch (error) {
        console.error('PWA: Error during installation:', error)
      }
    } else {
      // Show instructions instead
      setShowInstructions(true)
    }
  }
  
  // Don't render if already installed
  if (isInstalled) {
    return null
  }

  // Don't render in development mode
  if (process.env.NODE_ENV === 'development') {
    return null
  }
  
  // For iOS, show manual instructions
  if (isIOS) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              className={className}
              onClick={() => setShowInstructions(true)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Install App
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Tap to see installation instructions for iOS</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // For desktop without install prompt
  if (isDesktop && !isInstallable) {
    if (!showWhenNotInstallable) {
      return null
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size={size} 
              className={className}
              disabled
            >
              <Monitor className="mr-2 h-4 w-4" />
              App Install
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Not available on this browser</span>
              </div>
              <p className="text-sm">Try Chrome, Edge, or Firefox for app installation</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  // Only show if installable or if we want to show instructions
  if (!isInstallable && !showWhenNotInstallable) {
    return null
  }
  
  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={handleInstallClick}
        disabled={!isInstallable && !isIOS}
      >
        <Download className="mr-2 h-4 w-4" />
        {isInstallable ? 'Install App' : 'View Instructions'}
      </Button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isIOS ? 'Add to Home Screen' : 'Install Instructions'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">1</span>
                  </div>
                  <p>Tap the share button <span className="font-mono">⬆</span> at the bottom of Safari</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">2</span>
                  </div>
                  <p>Scroll down and tap "Add to Home Screen"</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">3</span>
                  </div>
                  <p>Tap "Add" to install CivicSense on your home screen</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>To install this app:</p>
                <ul className="space-y-2 list-disc list-inside ml-4">
                  <li>Use Chrome, Edge, or Firefox</li>
                  <li>Look for an install icon in the address bar</li>
                  <li>Or check your browser's menu for "Install app" option</li>
                </ul>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Installation may not be available on all browsers or devices.
                </p>
              </div>
            )}
            
            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 