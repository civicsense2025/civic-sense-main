"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { realtimeManager } from "../lib/supabase/realtime"
import { useToast } from '@civicsense/ui-web'

interface ConnectionState {
  status: 'online' | 'offline' | 'connecting' | 'reconnecting'
  quality: 'excellent' | 'good' | 'poor' | 'offline'
  latency: number
  reconnectAttempts: number
  lastConnected: Date | null
}

interface ConnectionContextType {
  connection: ConnectionState
  reconnect: () => void
  ping: () => Promise<number>
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'connecting',
    quality: 'offline',
    latency: 0,
    reconnectAttempts: 0,
    lastConnected: null
  })
  
  const { toast } = useToast()

  // Enhanced ping function with latency measurement
  const ping = useCallback(async (): Promise<number> => {
    const startTime = performance.now()
    
    try {
      // Simple ping using a lightweight Supabase query
      const { error } = await realtimeManager.getClient()
        .from('multiplayer_rooms')
        .select('count')
        .limit(1)
        .single()
      
      const latency = performance.now() - startTime
      
      // Update connection quality based on latency
      let quality: ConnectionState['quality'] = 'excellent'
      if (latency > 1000) quality = 'poor'
      else if (latency > 500) quality = 'good'
      else if (latency > 200) quality = 'good'
      else quality = 'excellent'
      
      setConnection(prev => ({
        ...prev,
        latency: Math.round(latency),
        quality,
        status: 'online',
        lastConnected: new Date(),
        reconnectAttempts: 0
      }))
      
      return latency
    } catch (error) {
      console.error('Ping failed:', error)
      setConnection(prev => ({
        ...prev,
        status: 'offline',
        quality: 'offline'
      }))
      return -1
    }
  }, [])

  // Enhanced reconnection function
  const reconnect = useCallback(async () => {
    setConnection(prev => ({
      ...prev,
      status: 'reconnecting',
      reconnectAttempts: prev.reconnectAttempts + 1
    }))
    
         try {
       // Force reconnection by destroying and recreating connections
       realtimeManager.unsubscribeAll()
       await ping()
      
      toast({
        title: "Connection restored",
        description: "Successfully reconnected to CivicSense servers",
        variant: "default",
      })
    } catch (error) {
      console.error('Reconnection failed:', error)
      setConnection(prev => ({
        ...prev,
        status: 'offline',
        quality: 'offline'
      }))
      
      toast({
        title: "Connection failed",
        description: "Unable to reconnect. Please check your internet connection.",
        variant: "destructive",
      })
    }
  }, [ping, toast])

  // Connection monitoring with heartbeat
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout
    let qualityCheckInterval: NodeJS.Timeout
    
    // Only enable connection monitoring in multiplayer contexts
    // Check if we're in a multiplayer route or have active real-time connections
    const isMultiplayerContext = window.location.pathname.includes('/multiplayer') || 
                                window.location.pathname.includes('/quiz/') && window.location.search.includes('room=')
    
    if (!isMultiplayerContext) {
      // For non-multiplayer contexts, just do an initial connection check without continuous monitoring
      ping().then(() => {
        // Set status without starting intervals
      })
      return
    }
    
    const startMonitoring = () => {
      // Heartbeat every 30 seconds - only for multiplayer contexts
      heartbeatInterval = setInterval(async () => {
        if (connection.status === 'online') {
          await ping()
        }
      }, 30000)
      
      // Quality check every 5 minutes - only for multiplayer contexts  
      qualityCheckInterval = setInterval(async () => {
        if (navigator.onLine) {
          await ping()
        } else {
          setConnection(prev => ({
            ...prev,
            status: 'offline',
            quality: 'offline'
          }))
        }
      }, 300000)
    }
    
    // Initial connection check
    ping().then(() => startMonitoring())
    
    // Online/offline event listeners
    const handleOnline = () => {
      console.log('🟢 Browser came online')
      ping()
    }
    
    const handleOffline = () => {
      console.log('🔴 Browser went offline')
      setConnection(prev => ({
        ...prev,
        status: 'offline',
        quality: 'offline'
      }))
    }
    
    // Visibility change handler for tab switching
    const handleVisibilityChange = () => {
      if (!document.hidden && connection.status === 'offline') {
        console.log('🔄 Tab became visible, checking connection')
        setTimeout(ping, 1000) // Small delay to ensure tab is fully active
      }
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (qualityCheckInterval) clearInterval(qualityCheckInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ping, connection.status])

  // Auto-reconnect with exponential backoff
  useEffect(() => {
    if (connection.status === 'offline' && connection.reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 30000)
      
      const timeout = setTimeout(() => {
        console.log(`🔄 Auto-reconnect attempt ${connection.reconnectAttempts + 1}`)
        reconnect()
      }, delay)
      
      return () => clearTimeout(timeout)
    }
  }, [connection.status, connection.reconnectAttempts, reconnect])

  return (
    <ConnectionContext.Provider value={{ connection, reconnect, ping }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}

// Connection status indicator component
export function ConnectionStatusIndicator() {
  const { connection } = useConnection()
  
  const getStatusColor = () => {
    switch (connection.quality) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-yellow-500'
      case 'poor': return 'bg-orange-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getStatusText = () => {
    if (connection.status === 'reconnecting') return 'Reconnecting...'
    if (connection.status === 'connecting') return 'Connecting...'
    return `${connection.quality} (${connection.latency}ms)`
  }
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-muted-foreground">
        {getStatusText()}
      </span>
    </div>
  )
} 