"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Check, Smartphone } from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function PWAInstallButton({ 
  variant = 'default', 
  size = 'default',
  className = ''
}: PWAInstallButtonProps) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: window-controls-overlay)').matches ||
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }
      
      // Check if iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      setIsIOS(isIOS)
      
      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault()
        // Stash the event so it can be triggered later
        setDeferredPrompt(e)
        setIsInstallable(true)
      })
      
      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
      })
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice
    
    // Reset the deferred prompt variable
    setDeferredPrompt(null)
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
  }
  
  // Don't render if already installed
  if (isInstalled) {
    return null
  }
  
  // For iOS, show instructions
  if (isIOS) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={variant} size={size} className={className} disabled>
              <Smartphone className="mr-2 h-4 w-4" />
              Install App
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>To install this app on iOS: tap the share icon and then &quot;Add to Home Screen&quot;</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  // Only show if installable
  if (!isInstallable) {
    return null
  }
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleInstallClick}
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  )
} 