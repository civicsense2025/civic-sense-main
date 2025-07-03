"use client"

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { toast } from '@civicsense/ui-web'

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false)
  const [hasShownOnlineToast, setHasShownOnlineToast] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Set initial state
    setIsOnline(navigator.onLine)
    
    // Handle online status changes
    const handleOnline = () => {
      setIsOnline(true)
      if (hasShownOfflineToast && !hasShownOnlineToast) {
        toast({
          title: "You're back online!",
          description: (
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <span>Your connection has been restored.</span>
            </div>
          ),
          duration: 3000,
        })
        setHasShownOnlineToast(true)
      }
    }
    
    // Handle offline status changes
    const handleOffline = () => {
      setIsOnline(false)
      if (!hasShownOfflineToast) {
        toast({
          title: "You're offline",
          description: (
            <div className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-amber-500" />
              <span>Some features may be limited until your connection is restored.</span>
            </div>
          ),
          duration: 5000,
        })
        setHasShownOfflineToast(true)
        setHasShownOnlineToast(false)
      }
    }
    
    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [hasShownOfflineToast, hasShownOnlineToast])
  
  // This component doesn't render anything visible
  return null
} 