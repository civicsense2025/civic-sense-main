import { multiplayerOperations } from './multiplayer'
import { debug } from './debug-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface HostPrivilegeData {
  roomId: string
  hostUserId?: string
  hostGuestToken?: string
  timestamp: number
}

interface HostPrivilegeManager {
  recordHostPrivileges: (roomId: string, userId?: string, guestToken?: string) => void
  restoreHostPrivileges: (roomId: string, userId?: string, guestToken?: string) => Promise<boolean>
  clearHostPrivileges: (roomId: string) => void
  transferHostPrivileges: (roomId: string, fromUserId?: string, fromGuestToken?: string, toUserId?: string, toGuestToken?: string) => Promise<boolean>
  getStoredHostPrivileges: (roomId: string) => HostPrivilegeData | null
}

class HostPrivilegeManagerImpl implements HostPrivilegeManager {
  private storageKey = 'civicSense_hostPrivileges'
  private privilegeTimeout = 24 * 60 * 60 * 1000 // 24 hours

  private getStorageData(): Record<string, HostPrivilegeData> {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private saveStorageData(data: Record<string, HostPrivilegeData>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      debug.log('multiplayer', 'Failed to save host privileges to localStorage', error)
    }
  }

  recordHostPrivileges(roomId: string, userId?: string, guestToken?: string): void {
    if (!userId && !guestToken) return
    
    const data = this.getStorageData()
    data[roomId] = {
      roomId,
      hostUserId: userId,
      hostGuestToken: guestToken,
      timestamp: Date.now()
    }
    
    this.saveStorageData(data)
    debug.log('multiplayer', `Recorded host privileges for room ${roomId}`, { userId, guestToken })
  }

  getStoredHostPrivileges(roomId: string): HostPrivilegeData | null {
    const data = this.getStorageData()
    const privileges = data[roomId]
    
    if (!privileges) return null
    
    // Check if privileges have expired
    if (Date.now() - privileges.timestamp > this.privilegeTimeout) {
      this.clearHostPrivileges(roomId)
      return null
    }
    
    return privileges
  }

  async restoreHostPrivileges(roomId: string, userId?: string, guestToken?: string): Promise<boolean> {
    try {
      // First check stored privileges
      const storedPrivileges = this.getStoredHostPrivileges(roomId)
      
      // Determine if current user should be host
      const shouldBeHost = storedPrivileges && (
        (userId && storedPrivileges.hostUserId === userId) ||
        (guestToken && storedPrivileges.hostGuestToken === guestToken)
      )
      
      if (!shouldBeHost) {
        debug.log('multiplayer', 'User is not the recorded host, skipping privilege restoration')
        return false
      }
      
             // Get current room data to verify (using room ID directly)
       const { data: room, error } = await supabase
         .from('multiplayer_rooms')
         .select('*')
         .eq('id', roomId)
         .single()
       
       if (error || !room) {
         debug.log('multiplayer', 'Room not found, cannot restore host privileges')
         return false
       }
      
      // Check if user is the original room creator
      const isOriginalHost = (
        (userId && room.host_user_id === userId) ||
        (guestToken && room.host_guest_token === guestToken)
      )
      
      if (!isOriginalHost) {
        debug.log('multiplayer', 'User is not the original room creator')
        return false
      }
      
      // Get current players
      const players = await multiplayerOperations.getRoomPlayers(roomId)
      const currentPlayer = players.find(p => 
        userId ? p.user_id === userId : p.guest_token === guestToken
      )
      
      if (!currentPlayer) {
        debug.log('multiplayer', 'Player not found in room, cannot restore host privileges')
        return false
      }
      
      if (currentPlayer.is_host) {
        debug.log('multiplayer', 'Player already has host privileges')
        return true
      }
      
      debug.log('multiplayer', 'Restoring host privileges for original room creator')
      
      // Remove host from other players first
      const otherHostPlayers = players.filter(p => 
        p.is_host && (
          userId ? p.user_id !== userId : p.guest_token !== guestToken
        )
      )
      
      for (const player of otherHostPlayers) {
        await multiplayerOperations.updatePlayerInRoom(roomId, {
          user_id: player.user_id,
          guest_token: player.guest_token,
          is_host: false
        })
        debug.log('multiplayer', `Removed host privileges from ${player.player_name}`)
      }
      
      // Grant host to current player
      await multiplayerOperations.updatePlayerInRoom(roomId, {
        user_id: userId,
        guest_token: guestToken,
        is_host: true
      })
      
      debug.log('multiplayer', 'Host privileges successfully restored')
      return true
      
    } catch (error) {
      debug.log('multiplayer', 'Failed to restore host privileges', error)
      return false
    }
  }

  async transferHostPrivileges(
    roomId: string, 
    fromUserId?: string, 
    fromGuestToken?: string, 
    toUserId?: string, 
    toGuestToken?: string
  ): Promise<boolean> {
    if ((!fromUserId && !fromGuestToken) || (!toUserId && !toGuestToken)) {
      debug.log('multiplayer', 'Invalid parameters for host privilege transfer')
      return false
    }
    
    try {
      // Get current players
      const players = await multiplayerOperations.getRoomPlayers(roomId)
      
      const fromPlayer = players.find(p => 
        fromUserId ? p.user_id === fromUserId : p.guest_token === fromGuestToken
      )
      const toPlayer = players.find(p => 
        toUserId ? p.user_id === toUserId : p.guest_token === toGuestToken
      )
      
      if (!fromPlayer?.is_host) {
        debug.log('multiplayer', 'Source player is not host, cannot transfer privileges')
        return false
      }
      
      if (!toPlayer) {
        debug.log('multiplayer', 'Target player not found in room')
        return false
      }
      
      debug.log('multiplayer', `Transferring host privileges from ${fromPlayer.player_name} to ${toPlayer.player_name}`)
      
      // Remove host from source player
      await multiplayerOperations.updatePlayerInRoom(roomId, {
        user_id: fromUserId,
        guest_token: fromGuestToken,
        is_host: false
      })
      
      // Grant host to target player
      await multiplayerOperations.updatePlayerInRoom(roomId, {
        user_id: toUserId,
        guest_token: toGuestToken,
        is_host: true
      })
      
      // Update stored privileges
      this.recordHostPrivileges(roomId, toUserId, toGuestToken)
      
      debug.log('multiplayer', 'Host privileges transferred successfully')
      return true
      
    } catch (error) {
      debug.log('multiplayer', 'Failed to transfer host privileges', error)
      return false
    }
  }

  clearHostPrivileges(roomId: string): void {
    const data = this.getStorageData()
    delete data[roomId]
    this.saveStorageData(data)
    debug.log('multiplayer', `Cleared host privileges for room ${roomId}`)
  }

  // Cleanup expired privileges
  cleanupExpiredPrivileges(): void {
    const data = this.getStorageData()
    const now = Date.now()
    let hasChanges = false
    
    for (const [roomId, privileges] of Object.entries(data)) {
      if (now - privileges.timestamp > this.privilegeTimeout) {
        delete data[roomId]
        hasChanges = true
        debug.log('multiplayer', `Cleaned up expired host privileges for room ${roomId}`)
      }
    }
    
    if (hasChanges) {
      this.saveStorageData(data)
    }
  }
}

// Create singleton instance
export const hostPrivilegeManager = new HostPrivilegeManagerImpl()

// Utility functions for common operations
export const recordAsHost = (roomId: string, userId?: string, guestToken?: string) => {
  hostPrivilegeManager.recordHostPrivileges(roomId, userId, guestToken)
}

export const restoreHostIfEligible = async (roomId: string, userId?: string, guestToken?: string) => {
  return await hostPrivilegeManager.restoreHostPrivileges(roomId, userId, guestToken)
}

export const transferHost = async (
  roomId: string,
  fromUserId?: string,
  fromGuestToken?: string,
  toUserId?: string,
  toGuestToken?: string
) => {
  return await hostPrivilegeManager.transferHostPrivileges(roomId, fromUserId, fromGuestToken, toUserId, toGuestToken)
}

export const clearHostRecord = (roomId: string) => {
  hostPrivilegeManager.clearHostPrivileges(roomId)
}

// Cleanup expired privileges on module load
if (typeof window !== 'undefined') {
  hostPrivilegeManager.cleanupExpiredPrivileges()
  
  // Set up periodic cleanup
  setInterval(() => {
    hostPrivilegeManager.cleanupExpiredPrivileges()
  }, 60 * 60 * 1000) // Every hour
} 