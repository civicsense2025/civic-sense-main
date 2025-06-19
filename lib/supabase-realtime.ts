import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { debug } from './debug-config'

interface ConnectionManager {
  client: SupabaseClient
  channels: Map<string, RealtimeChannel>
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
  heartbeatInterval: NodeJS.Timeout | null
  onConnectionChange?: (state: ConnectionManager['connectionState']) => void
}

interface ChannelConfig {
  channelName: string
  table?: string
  filter?: string
  events: Array<{
    event: string
    callback: (payload: any) => void
  }>
  onSubscribed?: () => void
  onError?: (error: any) => void
}

class SupabaseRealtimeManager {
  private manager: ConnectionManager
  private static instance: SupabaseRealtimeManager

  constructor() {
    this.manager = {
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          realtime: {
            params: {
              eventsPerSecond: 50, // Increased for multiplayer
            },
          },
          db: {
            schema: 'public',
          },
        }
      ),
      channels: new Map(),
      connectionState: 'disconnected',
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
      reconnectInterval: 1000,
      heartbeatInterval: null,
    }

    this.setupConnectionMonitoring()
  }

  static getInstance(): SupabaseRealtimeManager {
    if (!SupabaseRealtimeManager.instance) {
      SupabaseRealtimeManager.instance = new SupabaseRealtimeManager()
    }
    return SupabaseRealtimeManager.instance
  }

  private setupConnectionMonitoring() {
    // Monitor connection state
    this.manager.heartbeatInterval = setInterval(() => {
      this.checkConnectionHealth()
    }, 30000) // Check every 30 seconds

    // Listen for visibility changes to handle tab switching
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.handleTabVisible()
        }
      })

      // Listen for online/offline events
      window.addEventListener('online', () => {
        debug.log('multiplayer', 'Browser came online, attempting reconnection')
        this.handleReconnection()
      })

      window.addEventListener('offline', () => {
        debug.log('multiplayer', 'Browser went offline')
        this.updateConnectionState('disconnected')
      })
    }
  }

  private async checkConnectionHealth() {
    try {
      // Simple health check query
      const { error } = await this.manager.client
        .from('multiplayer_rooms')
        .select('id')
        .limit(1)

      if (error) {
        throw error
      }

      if (this.manager.connectionState !== 'connected') {
        this.updateConnectionState('connected')
        this.manager.reconnectAttempts = 0
      }
         } catch (error) {
       debug.log('multiplayer', 'Health check failed', error)
       if (this.manager.connectionState === 'connected') {
         this.updateConnectionState('disconnected')
         this.handleReconnection()
       }
     }
  }

     private handleTabVisible() {
     // When tab becomes visible, check if we need to reconnect
     if (this.manager.connectionState === 'disconnected') {
       debug.log('multiplayer', 'Tab visible, attempting reconnection')
       this.handleReconnection()
     }
   }

     private async handleReconnection() {
     if (this.manager.reconnectAttempts >= this.manager.maxReconnectAttempts) {
       debug.log('multiplayer', 'Max reconnection attempts reached')
       return
     }

     this.updateConnectionState('reconnecting')
     this.manager.reconnectAttempts++

     // Exponential backoff
     const delay = Math.min(
       this.manager.reconnectInterval * Math.pow(2, this.manager.reconnectAttempts - 1),
       30000 // Max 30 seconds
     )

     debug.log('multiplayer', `Reconnection attempt ${this.manager.reconnectAttempts} in ${delay}ms`)

     setTimeout(async () => {
       try {
         // Resubscribe to all channels
         for (const channelName of Array.from(this.manager.channels.keys())) {
           const channel = this.manager.channels.get(channelName)!
           await this.resubscribeChannel(channelName, channel)
         }
         
         this.updateConnectionState('connected')
         this.manager.reconnectAttempts = 0
       } catch (error) {
         debug.log('multiplayer', 'Reconnection failed', error)
         this.handleReconnection()
       }
     }, delay)
   }

  private async resubscribeChannel(channelName: string, oldChannel: RealtimeChannel) {
    try {
      // Remove old channel
      this.manager.client.removeChannel(oldChannel)
      
      // Note: We'll need to store channel configs to recreate them
      // For now, we'll emit an event that channels should resubscribe
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-reconnected', {
          detail: { channelName }
        }))
      }
         } catch (error) {
       debug.log('multiplayer', 'Failed to resubscribe channel', { channelName, error })
     }
   }

   private updateConnectionState(newState: ConnectionManager['connectionState']) {
     if (this.manager.connectionState !== newState) {
       debug.log('multiplayer', `Connection state changed: ${this.manager.connectionState} -> ${newState}`)
       this.manager.connectionState = newState
       this.manager.onConnectionChange?.(newState)
     }
   }

  // Public API
  getClient(): SupabaseClient {
    return this.manager.client
  }

  getConnectionState(): ConnectionManager['connectionState'] {
    return this.manager.connectionState
  }

  onConnectionChange(callback: (state: ConnectionManager['connectionState']) => void) {
    this.manager.onConnectionChange = callback
  }

  async subscribe(config: ChannelConfig): Promise<RealtimeChannel> {
    const { channelName, table, filter, events, onSubscribed, onError } = config

    // Remove existing channel if it exists
    if (this.manager.channels.has(channelName)) {
      const existingChannel = this.manager.channels.get(channelName)!
      this.manager.client.removeChannel(existingChannel)
    }

    let channelBuilder = this.manager.client.channel(channelName)

    // Add postgres changes if table is specified
    if (table) {
      const postgresConfig = {
        event: '*' as any,
        schema: 'public',
        table,
        ...(filter && { filter }),
      }
      
      channelBuilder = (channelBuilder as any).on(
        'postgres_changes',
        postgresConfig,
        (payload: any) => {
          debug.log('multiplayer', `Database change in ${table}`, payload)
          // Route to appropriate event handler
          const eventType = payload.eventType.toLowerCase()
          const matchingEvent = events.find(e => e.event === eventType || e.event === '*')
          if (matchingEvent) {
            matchingEvent.callback(payload)
          }
        }
      )
    }

    // Add custom events (using broadcast for multiplayer communication)
    events.forEach(({ event, callback }) => {
      if (event !== 'insert' && event !== 'update' && event !== 'delete' && event !== '*') {
        channelBuilder = channelBuilder.on('broadcast', { event }, callback)
      }
    })

    const channel = channelBuilder.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        debug.log('multiplayer', `Subscribed to channel: ${channelName}`)
        this.updateConnectionState('connected')
        onSubscribed?.()
      } else if (status === 'CHANNEL_ERROR') {
        debug.log('multiplayer', `Channel error: ${channelName}`, error)
        onError?.(error)
        this.updateConnectionState('disconnected')
        this.handleReconnection()
      } else if (status === 'TIMED_OUT') {
        debug.log('multiplayer', `Channel timed out: ${channelName}`)
        this.updateConnectionState('disconnected')
        this.handleReconnection()
      } else if (status === 'CLOSED') {
        debug.log('multiplayer', `Channel closed: ${channelName}`)
        this.updateConnectionState('disconnected')
      }
    })

    this.manager.channels.set(channelName, channel)
    return channel
  }

  unsubscribe(channelName: string) {
    const channel = this.manager.channels.get(channelName)
    if (channel) {
      this.manager.client.removeChannel(channel)
      this.manager.channels.delete(channelName)
      debug.log('multiplayer', `Unsubscribed from channel: ${channelName}`)
    }
  }

  unsubscribeAll() {
    this.manager.channels.forEach((channel, channelName) => {
      this.manager.client.removeChannel(channel)
    })
    this.manager.channels.clear()
    debug.log('multiplayer', 'Unsubscribed from all channels')
  }

  // Batch operations for efficiency
  async batchUpdate(table: string, updates: Array<{ id: string; data: any }>) {
    const promises = updates.map(({ id, data }) =>
      this.manager.client
        .from(table)
        .update(data)
        .eq('id', id)
    )

    const results = await Promise.allSettled(promises)
    const failures = results.filter(r => r.status === 'rejected')
    
    if (failures.length > 0) {
      debug.log('multiplayer', `Batch update had ${failures.length} failures`, failures)
    }

    return results
  }

  // Cleanup
  destroy() {
    this.unsubscribeAll()
    if (this.manager.heartbeatInterval) {
      clearInterval(this.manager.heartbeatInterval)
    }
  }
}

export const realtimeManager = SupabaseRealtimeManager.getInstance()
export default realtimeManager 