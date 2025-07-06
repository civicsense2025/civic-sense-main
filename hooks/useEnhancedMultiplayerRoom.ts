import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { realtimeManager } from '@/lib/supabase-realtime'
import { multiplayerOperations, type MultiplayerRoom, type MultiplayerPlayer } from '@/lib/multiplayer'
import { debug } from '@/lib/debug-config'
import { supabase } from '@/lib/supabase'
import { hostPrivilegeManager } from '@/lib/host-privilege-manager'
import { useConnection } from '@/components/providers/connection-provider'

interface UseEnhancedMultiplayerRoomProps {
  roomId: string
  autoReconnect?: boolean
  heartbeatInterval?: number
}

interface UseEnhancedMultiplayerRoomReturn {
  room: MultiplayerRoom | null
  players: MultiplayerPlayer[]
  isHost: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  loading: boolean
  error: string | null
  
  // Connection management
  reconnect: () => Promise<void>
  ensurePlayerInRoom: () => Promise<void>
  
  // Player management
  updatePlayerStatus: (status: { is_ready?: boolean }) => Promise<void>
  
  // Room management
  startGame: () => Promise<void>
}

export function useEnhancedMultiplayerRoom({ 
  roomId, 
  autoReconnect = true,
  heartbeatInterval = 5000 // 5 seconds like the reference implementation
}: UseEnhancedMultiplayerRoomProps): UseEnhancedMultiplayerRoomReturn {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const { connection } = useConnection()
  
  // State
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for stable references
  const currentPlayerRef = useRef<MultiplayerPlayer | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<string>(`room:${roomId}`)
  
  // Computed values
  const currentPlayer = currentPlayerRef.current
  const isHost = currentPlayer?.is_host || false
  const isConnected = connectionStatus === 'connected'
  const currentUserId = user?.id || undefined
  
  // Helper to get current user identifier
  const getCurrentUserIdentifier = useCallback(() => {
    if (user?.id) {
      return { user_id: user.id, guest_token: undefined }
    } else {
      return { user_id: undefined, guest_token: getOrCreateGuestToken() }
    }
  }, [user?.id, getOrCreateGuestToken])
  
  // Helper to update current player reference
  const updateCurrentPlayerRef = useCallback((updatedPlayers: MultiplayerPlayer[]) => {
    const { user_id, guest_token } = getCurrentUserIdentifier()
    const currentPlayer = updatedPlayers.find(p => 
      user_id ? p.user_id === user_id : p.guest_token === guest_token
    )
    currentPlayerRef.current = currentPlayer || null
  }, [getCurrentUserIdentifier])
  
  // Load initial room and player data
  const loadRoomData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      debug.log('multiplayer', `Loading room data for ${roomId}`)
      
      // Load room
      const roomData = await multiplayerOperations.getRoom(roomId)
      if (!roomData) {
        throw new Error('Room not found')
      }
      setRoom(roomData)
      
      // Load players
      const playersData = await multiplayerOperations.getRoomPlayers(roomId)
      setPlayers(playersData)
      updateCurrentPlayerRef(playersData)
      
      debug.log('multiplayer', `Loaded ${playersData.length} players`, playersData)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room data'
      debug.log('multiplayer', 'Failed to load room data', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [roomId, updateCurrentPlayerRef])
  
  // Ensure player is in room (auto-rejoin logic)
  const ensurePlayerInRoom = useCallback(async () => {
    const { user_id, guest_token } = getCurrentUserIdentifier()
    
    if (!currentPlayerRef.current) {
      debug.log('multiplayer', 'Player not in room, attempting to rejoin')
      
      try {
        const playerName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest'
        
        const result = await multiplayerOperations.joinRoom({
          roomCode: room?.room_code || '',
          playerName,
          playerEmoji: '👤'
        }, user_id, guest_token)
        
        // Update state with rejoined player
        setRoom(result.room)
        await loadRoomData()
        
        debug.log('multiplayer', 'Successfully rejoined room')
      } catch (error) {
        debug.log('multiplayer', 'Failed to rejoin room', error)
        throw error
      }
    }
  }, [room, user, getCurrentUserIdentifier, loadRoomData])
  
  // Player management
  const updatePlayerStatus = useCallback(async (status: { is_ready?: boolean }) => {
    if (!currentPlayer) return
    
    try {
      const { error } = await supabase
        .from('multiplayer_room_players')
        .update(status)
        .eq('id', currentPlayer.id)
      
      if (error) throw error
      debug.log('multiplayer', 'Player status updated', status)
    } catch (error) {
      debug.log('multiplayer', 'Failed to update player status', error)
      throw error
    }
  }, [currentPlayer])
  
  // Room management
  const startGame = useCallback(async () => {
    if (!isHost) {
      throw new Error('Only host can start the game')
    }
    
    try {
      await multiplayerOperations.startGame(roomId)
      debug.log('multiplayer', 'Game started')
    } catch (error) {
      debug.log('multiplayer', 'Failed to start game', error)
      throw error
    }
  }, [isHost, roomId])
  
  // Connection management with heartbeat
  const reconnect = useCallback(async () => {
    if (connectionStatus === 'reconnecting') return
    
    setConnectionStatus('reconnecting')
    
    try {
      // Ensure player is still in room
      await ensurePlayerInRoom()
      
      // Update connection status
      setConnectionStatus('connected')
      
      debug.log('multiplayer', 'Reconnection successful')
    } catch (error) {
      debug.log('multiplayer', 'Reconnection failed', error)
      setConnectionStatus('disconnected')
      
      // Retry after delay if auto-reconnect is enabled
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnect()
        }, 5000)
      }
    }
  }, [connectionStatus, ensurePlayerInRoom, autoReconnect])
  
  // Heartbeat system with host migration
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    
    heartbeatIntervalRef.current = setInterval(async () => {
      if (roomId && currentUserId && isConnected) {
        try {
          // Update heartbeat
          await multiplayerOperations.updatePlayerHeartbeat(
            roomId, 
            currentUserId, 
            connection.latency,
            connection.quality
          )
          
          // Check for host migration if we're the host
          if (isHost) {
            await multiplayerOperations.checkAndMigrateHost(roomId)
          }
        } catch (error) {
          debug.log('multiplayer', 'Heartbeat failed', error)
          setConnectionStatus('disconnected')
          if (autoReconnect) {
            reconnect()
          }
        }
      }
    }, heartbeatInterval)
  }, [roomId, currentUserId, isConnected, isHost, connection.latency, connection.quality, heartbeatInterval, autoReconnect, reconnect])
  
  // Setup heartbeat when connected
  useEffect(() => {
    if (isConnected && currentPlayer) {
      startHeartbeat()
    }
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [isConnected, currentPlayer, startHeartbeat])
  
  // Initial load
  useEffect(() => {
    loadRoomData()
  }, [loadRoomData])
  
  // Setup real-time subscription
  useEffect(() => {
    const setupSubscription = async () => {
      try {
        await realtimeManager.subscribe({
          channelName: channelRef.current,
          table: 'multiplayer_room_players',
          filter: `room_id=eq.${roomId}`,
          events: [
            {
              event: '*',
              callback: (payload) => {
                debug.log('multiplayer', 'Player update received', payload)
                
                if (payload.eventType === 'INSERT') {
                  setPlayers(prev => {
                    const updated = [...prev, payload.new as MultiplayerPlayer]
                    updateCurrentPlayerRef(updated)
                    return updated
                  })
                } else if (payload.eventType === 'UPDATE') {
                  setPlayers(prev => {
                    const updated = prev.map(p => 
                      p.id === payload.new.id ? { ...p, ...payload.new } : p
                    )
                    updateCurrentPlayerRef(updated)
                    return updated
                  })
                } else if (payload.eventType === 'DELETE') {
                  setPlayers(prev => {
                    const updated = prev.filter(p => p.id !== payload.old.id)
                    updateCurrentPlayerRef(updated)
                    return updated
                  })
                }
              }
            }
          ]
        })
        
        setConnectionStatus('connected')
      } catch (error) {
        debug.log('multiplayer', 'Failed to setup subscription', error)
        setConnectionStatus('disconnected')
        if (autoReconnect) {
          reconnect()
        }
      }
    }

    setupSubscription()
    
    return () => {
      realtimeManager.unsubscribe(channelRef.current)
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [roomId, autoReconnect, reconnect, updateCurrentPlayerRef])

  return {
    room,
    players,
    isHost,
    isConnected,
    connectionStatus,
    loading,
    error,
    
    // Functions
    reconnect,
    ensurePlayerInRoom,
    updatePlayerStatus,
    startGame
  }
} 