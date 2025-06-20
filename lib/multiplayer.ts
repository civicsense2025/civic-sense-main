"use client"

import { supabase } from './supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { debug } from './debug-config'
import type {
  DbMultiplayerRoom,
  DbMultiplayerRoomPlayer,
  DbMultiplayerQuizAttempt,
  DbMultiplayerQuestionResponse,
  DbMultiplayerGameEvent,
  DbMultiplayerRoomInsert,
  DbMultiplayerRoomPlayerInsert,
  DbMultiplayerQuestionResponseInsert
} from './database.types'

// =============================================================================
// MULTIPLAYER TYPES (Re-exported for backward compatibility)
// =============================================================================

export type MultiplayerRoom = DbMultiplayerRoom
export type MultiplayerPlayer = DbMultiplayerRoomPlayer
export type MultiplayerQuizAttempt = DbMultiplayerQuizAttempt
export type MultiplayerQuestionResponse = DbMultiplayerQuestionResponse
export type MultiplayerGameEvent = DbMultiplayerGameEvent

export interface CreateRoomOptions {
  topicId: string
  roomName?: string
  maxPlayers?: number
  gameMode?: 'classic' | 'speed_round' | 'elimination' | 'team_battle' | 'learning_lab' | 'matching'
}

export interface JoinRoomOptions {
  roomCode: string
  playerName: string
  playerEmoji?: string
}

export interface GameplaySettings {
  questionTimeLimit: number // seconds
  autoAdvanceDelay: number // seconds after everyone answers
  showHints: boolean
  allowNPCs: boolean
  countdownDuration: number // seconds for game start countdown
}

export interface GameState {
  currentQuestionIndex: number
  gamePhase: 'waiting' | 'countdown' | 'question' | 'results' | 'completed'
  questionStartTime?: number
  countdownStartTime?: number
  answeredPlayers: string[] // player IDs who have answered current question
}

// =============================================================================
// MULTIPLAYER DATABASE OPERATIONS
// =============================================================================

export const multiplayerOperations = {
  /**
   * Create a new multiplayer room
   */
  async createRoom(options: CreateRoomOptions, hostUserId?: string, guestToken?: string): Promise<{
    room: MultiplayerRoom
    player: MultiplayerPlayer
  }> {
    // Either hostUserId or guestToken is required
    if (!hostUserId && !guestToken) {
      // Generate a guest token for anonymous hosts
      guestToken = `guest_host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const { data, error } = await supabase.rpc('create_multiplayer_room', {
      p_topic_id: options.topicId,
      p_host_user_id: hostUserId || undefined,
      p_host_guest_token: guestToken || undefined,
      p_room_name: options.roomName || undefined,
      p_max_players: options.maxPlayers || 6,
      p_game_mode: options.gameMode || 'classic'
    })

    if (error) {
      console.error('Database error in createRoom:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // The error might be a string if it's from the RPC function
      if (typeof error === 'string') {
        throw new Error(`Failed to create room: ${error}`)
      }
      
      // Check for specific error codes
      if (error.code === '42702') {
        throw new Error('Database configuration error: Ambiguous column reference. This may be caused by a database function issue. Please check the latest migrations.')
      } else if (error.code === '42703') {
        throw new Error('Database error: Column does not exist. Please check if all migrations have been run.')
      } else if (error.code === '23505') {
        throw new Error('A room with this code already exists. Please try again.')
      } else if (error.code === '23503') {
        throw new Error('Invalid topic ID provided.')
      } else if (error.message) {
        throw new Error(`Failed to create room: ${error.message}`)
      } else {
        throw new Error(`Failed to create room due to a database error: ${JSON.stringify(error)}`)
      }
    }
    if (!data || data.length === 0) {
      throw new Error('Failed to create room: No data returned from database.')
    }

    const roomData = data[0]
    
    // Get the full room data and the host player data
    const [roomResult, playerResult] = await Promise.all([
      supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('id', roomData.id)
        .single(),
      supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('is_host', true)
        .single()
    ])

    if (roomResult.error) throw roomResult.error
    if (playerResult.error) throw playerResult.error

    // Cache player ID locally so we can restore it later without cluttering URLs
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`multiplayerPlayer_${roomResult.data.room_code}`, playerResult.data.id)
      } catch {
        /* ignore */
      }
    }

    return {
      room: roomResult.data as MultiplayerRoom,
      player: playerResult.data as MultiplayerPlayer
    }
  },

  /**
   * Join an existing multiplayer room
   */
  async joinRoom(options: JoinRoomOptions, userId?: string, guestToken?: string): Promise<{
    room: MultiplayerRoom
    player: MultiplayerPlayer
  }> {
    // Ensure we have either userId or guestToken (but not both)
    let finalUserId: string | undefined = undefined
    let finalGuestToken: string | undefined = undefined
    
    if (userId) {
      finalUserId = userId
      finalGuestToken = undefined
    } else {
      finalUserId = undefined
      finalGuestToken = guestToken || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const { data, error } = await supabase.rpc('join_multiplayer_room', {
      p_room_code: options.roomCode.toUpperCase(),
      p_player_name: options.playerName,
      p_user_id: finalUserId,
      p_guest_token: finalGuestToken,
      p_player_emoji: options.playerEmoji || '😊'
    })

    if (error) throw error
    if (!data || data.length === 0) throw new Error('Failed to join room')

    const result = data[0]
    if (!result.success) {
      throw new Error(result.message)
    }

    // Get full room and player data
    const [roomResult, playerResult] = await Promise.all([
      supabase.from('multiplayer_rooms').select('*').eq('id', result.room_id).single(),
      supabase.from('multiplayer_room_players').select('*').eq('id', result.player_id).single()
    ])

    if (roomResult.error) throw roomResult.error
    if (playerResult.error) throw playerResult.error

    // Cache player ID locally so we can restore it later without cluttering URLs
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`multiplayerPlayer_${roomResult.data.room_code}`, playerResult.data.id)
      } catch {
        /* ignore */
      }
    }

    return {
      room: roomResult.data as MultiplayerRoom,
      player: playerResult.data as MultiplayerPlayer
    }
  },

  /**
   * Get room by code
   */
  async getRoomByCode(roomCode: string): Promise<MultiplayerRoom | null> {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as MultiplayerRoom
  },

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<MultiplayerRoom | null> {
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as MultiplayerRoom
  },

  /**
   * Get players in a room
   */
  async getRoomPlayers(roomId: string): Promise<MultiplayerPlayer[]> {
    const { data, error } = await supabase
      .from('multiplayer_room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('join_order')

    if (error) throw error
    return data as MultiplayerPlayer[]
  },

  /**
   * Get user's active rooms (rooms they created or joined)
   */
  async getUserRooms(userId?: string, guestToken?: string): Promise<Array<{
    room: MultiplayerRoom
    player: MultiplayerPlayer
    topic?: { topic_title: string; emoji: string }
  }>> {
    if (!userId && !guestToken) {
      return []
    }

    // Build the query to get rooms where user is a player
    let query = supabase
      .from('multiplayer_room_players')
      .select(`
        id,
        room_id,
        player_name,
        is_host,
        is_ready,
        is_connected,
        join_order,
        created_at,
        multiplayer_rooms!inner (
          id,
          room_code,
          room_name,
          room_status,
          topic_id,
          game_mode,
          max_players,
          current_players,
          created_at,
          expires_at
        )
      `)

    // Filter by user ID or guest token
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (guestToken) {
      query = query.eq('guest_token', guestToken)
    }

    // Only get active rooms (not completed or cancelled)
    query = query
      .in('multiplayer_rooms.room_status', ['waiting', 'starting', 'in_progress'])
      .order('created_at', { referencedTable: 'multiplayer_rooms', ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user rooms:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Get topic information for each room
    const topicIds = [...new Set(data.map(item => (item as any).multiplayer_rooms.topic_id))]
    const { data: topicsData } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, emoji')
      .in('topic_id', topicIds)

    const topicsMap = new Map(topicsData?.map(t => [t.topic_id, t]) || [])

    return data.map(item => {
      const roomData = (item as any).multiplayer_rooms
      const topic = topicsMap.get(roomData.topic_id)
      
      return {
        room: {
          id: roomData.id,
          room_code: roomData.room_code,
          host_user_id: roomData.host_user_id,
          topic_id: roomData.topic_id,
          room_name: roomData.room_name,
          max_players: roomData.max_players,
          current_players: roomData.current_players,
          room_status: roomData.room_status,
          game_mode: roomData.game_mode,
          settings: roomData.settings || {},
          created_at: roomData.created_at,
          started_at: roomData.started_at,
          completed_at: roomData.completed_at,
          expires_at: roomData.expires_at
        } as MultiplayerRoom,
        player: {
          id: item.id,
          room_id: item.room_id,
          user_id: userId,
          guest_token: guestToken,
          player_name: item.player_name,
          player_emoji: '😊', // Default emoji
          is_ready: item.is_ready,
          is_host: item.is_host,
          is_connected: item.is_connected,
          join_order: item.join_order,
          boost_inventory: {},
          created_at: item.created_at,
          last_activity: item.created_at
        } as MultiplayerPlayer,
        topic: topic ? {
          topic_title: topic.topic_title,
          emoji: topic.emoji
        } : undefined
      }
    })
  },

  /**
   * Clean up expired rooms
   */
  async cleanupExpiredRooms(): Promise<{ cleanedRooms: number; cleanedPlayers: number }> {
    try {
      // Get expired rooms - only clean up rooms that are truly expired (not just old)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: expiredRooms, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('id, room_code, created_at, host_user_id, expires_at')
        .lt('expires_at', new Date().toISOString())
        .in('room_status', ['waiting', 'starting']) // Don't clean up active games
        // Extra safety: only clean rooms that expired more than 5 minutes ago
        .lt('expires_at', fiveMinutesAgo)

      if (fetchError) {
        console.error('Error fetching expired rooms:', fetchError)
        throw fetchError
      }

      if (!expiredRooms || expiredRooms.length === 0) {
        return { cleanedRooms: 0, cleanedPlayers: 0 }
      }

      debug.log('multiplayer', `Found ${expiredRooms.length} expired rooms to clean up`)

      // Check each room to see if it has recently active players
      const roomsToClean: string[] = []
      for (const room of expiredRooms) {
        // Check if any players were active in the last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        
        const { data: recentPlayers } = await supabase
          .from('multiplayer_room_players')
          .select('id')
          .eq('room_id', room.id)
          .gt('last_seen', twoMinutesAgo)
          .limit(1)

        // Only clean up rooms with no recently active players
        if (!recentPlayers || recentPlayers.length === 0) {
          roomsToClean.push(room.id)
        } else {
          debug.log('multiplayer', `Skipping cleanup of room ${room.room_code} - has recently active players`)
        }
      }

      if (roomsToClean.length === 0) {
        debug.log('multiplayer', 'No rooms safe to clean up - all have recent player activity')
        return { cleanedRooms: 0, cleanedPlayers: 0 }
      }

      debug.log('multiplayer', `Cleaning up ${roomsToClean.length} rooms (skipped ${expiredRooms.length - roomsToClean.length} with recent activity)`)

      // Count players before deletion
      const { data: playersToDelete } = await supabase
        .from('multiplayer_room_players')
        .select('id')
        .in('room_id', roomsToClean)

      const playerCount = playersToDelete?.length || 0

      // Delete players from expired rooms
      const { error: playersError } = await supabase
        .from('multiplayer_room_players')
        .delete()
        .in('room_id', roomsToClean)

      if (playersError) {
        console.error('Error cleaning up room players:', playersError)
        throw playersError
      }

      // Delete the expired rooms
      const { error: roomsError } = await supabase
        .from('multiplayer_rooms')
        .delete()
        .in('id', roomsToClean)

      if (roomsError) {
        console.error('Error cleaning up rooms:', roomsError)
        throw roomsError
      }

      debug.log('multiplayer', `Successfully cleaned up ${roomsToClean.length} expired rooms and ${playerCount} players`)
      return { cleanedRooms: roomsToClean.length, cleanedPlayers: playerCount }

    } catch (error) {
      console.error('Room cleanup failed:', error)
      throw error
    }
  },

  /**
   * Check if a room is expired and should be cleaned up
   */
  async isRoomExpired(roomId: string): Promise<boolean> {
    const { data: room, error } = await supabase
      .from('multiplayer_rooms')
      .select('expires_at, room_status, created_at, host_user_id')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      return true // Treat missing rooms as expired
    }

    const now = new Date()
    const expiresAt = new Date(room.expires_at)
    const createdAt = new Date(room.created_at)

    // Check if room has passed its expiration time
    if (now > expiresAt) {
      return true
    }

    // Additional check for guest rooms: 1 hour of inactivity
    if (!room.host_user_id && room.room_status === 'waiting') {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      if (createdAt < oneHourAgo) {
        return true
      }
    }

    return false
  },

  /**
   * Update player ready status
   */
  async updatePlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
    const { error } = await supabase.rpc('update_player_ready_status', {
      p_room_id: roomId,
      p_player_id: playerId,
      p_is_ready: isReady
    })

    if (error) throw error
  },

  /**
   * Start a multiplayer game
   */
  async startGame(roomId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('start_multiplayer_game', {
      p_room_id: roomId
    })

    if (error) throw error
    return data as boolean
  },

  /**
   * Rejoin a room if player got disconnected
   */
  async rejoinRoom(roomId: string, playerId: string, playerName: string, playerEmoji?: string): Promise<MultiplayerPlayer> {
    try {
      // First check if the player still exists in the room
      const { data: existingPlayer, error: playerError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('id', playerId)
        .eq('room_id', roomId)
        .single()

      if (existingPlayer && !playerError) {
        // Player exists, just update their connection status and activity
        const { error: updateError } = await supabase
          .from('multiplayer_room_players')
          .update({
            is_connected: true,
            last_seen: new Date().toISOString(),
            last_activity: new Date().toISOString()
          })
          .eq('id', playerId)

        if (updateError) throw updateError

        debug.log('multiplayer', `Player ${playerId} successfully rejoined room ${roomId}`)
        return existingPlayer as MultiplayerPlayer
      } else {
        // Player doesn't exist, check if room still exists and has space
        const { data: room, error: roomError } = await supabase
          .from('multiplayer_rooms')
          .select('*, current_players:multiplayer_room_players(count)')
          .eq('id', roomId)
          .single()

        if (roomError || !room) {
          throw new Error('Room no longer exists')
        }

        if (room.room_status === 'completed' || room.room_status === 'cancelled') {
          throw new Error('Room has ended')
        }

        const currentPlayerCount = (room.current_players as any)?.[0]?.count || 0
        if (currentPlayerCount >= room.max_players) {
          throw new Error('Room is full')
        }

        // Create new player entry
        const { data: newPlayer, error: createError } = await supabase
          .from('multiplayer_room_players')
          .insert({
            id: playerId, // Keep the same player ID for consistency
            room_id: roomId,
            player_name: playerName,
            player_emoji: playerEmoji || '😊',
            is_ready: false,
            is_host: false,
            is_connected: true,
            join_order: currentPlayerCount + 1
          })
          .select()
          .single()

        if (createError) throw createError

        debug.log('multiplayer', `Player ${playerId} created new entry and rejoined room ${roomId}`)
        return newPlayer as MultiplayerPlayer
      }
    } catch (error) {
      console.error('Error rejoining room:', error)
      throw error
    }
  },

  /**
   * Update player connection status
   */
  async updatePlayerConnection(playerId: string, isConnected: boolean): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_room_players')
      .update({ 
        is_connected: isConnected,
        last_seen: new Date().toISOString()
      })
      .eq('id', playerId)

    if (error) throw error
  },

  /**
   * Leave a room with automatic host reassignment
   */
  async leaveRoom(roomId: string, playerId: string): Promise<{ newHostPlayerId?: string }> {
    debug.log('multiplayer', '[multiplayerOperations] leaveRoom called', { roomId, playerId })
    
    try {
      // Check if the leaving player exists and is the host
      const { data: playerData, error: playerError } = await supabase
        .from('multiplayer_room_players')
        .select('is_host, player_name')
        .eq('id', playerId)
        .eq('room_id', roomId)
        .maybeSingle() // Use maybeSingle instead of single to handle no results

      // If player doesn't exist, they might have already left
      if (playerError) {
        debug.log('multiplayer', '[multiplayerOperations] Player not found or already removed', { playerId, error: playerError })
        return {}
      }

      if (!playerData) {
        debug.log('multiplayer', '[multiplayerOperations] Player not found in room', { playerId, roomId })
        return {}
      }

      let newHostPlayerId: string | undefined

      // If the leaving player is the host, reassign host to next player
      if (playerData.is_host) {
        debug.log('multiplayer', '[multiplayerOperations] Host is leaving, finding new host', { playerId })
        
        // Find the next player to become host (earliest join_order, excluding leaving player)
        const { data: nextHostData, error: nextHostError } = await supabase
          .from('multiplayer_room_players')
          .select('id, player_name')
          .eq('room_id', roomId)
          .eq('is_connected', true)
          .neq('id', playerId)
          .order('join_order', { ascending: true })
          .limit(1)
          .maybeSingle() // Use maybeSingle to handle case where no other players exist

        if (!nextHostError && nextHostData) {
          newHostPlayerId = nextHostData.id
          debug.log('multiplayer', '[multiplayerOperations] New host selected', { newHostPlayerId, newHostName: nextHostData.player_name })

          // Remove host status from current host and assign to new host
          await supabase
            .from('multiplayer_room_players')
            .update({ is_host: false })
            .eq('id', playerId)

          await supabase
            .from('multiplayer_room_players')
            .update({ is_host: true })
            .eq('id', newHostPlayerId)
        } else {
          debug.log('multiplayer', '[multiplayerOperations] No other players to become host', { nextHostError })
        }
      }

      // Remove player from room
      const { error: deleteError } = await supabase
        .from('multiplayer_room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('id', playerId)

      if (deleteError) {
        debug.log('multiplayer', '[multiplayerOperations] Failed to delete player', deleteError)
        throw deleteError
      }

      // Update room player count
      const { data: roomData, error: getRoomError } = await supabase
        .from('multiplayer_rooms')
        .select('current_players')
        .eq('id', roomId)
        .maybeSingle()

      if (getRoomError) {
        debug.log('multiplayer', '[multiplayerOperations] Failed to get room data for count update', getRoomError)
        // Don't throw here, player removal was successful
      } else if (roomData) {
        const { error: updateError } = await supabase
          .from('multiplayer_rooms')
          .update({ current_players: Math.max(0, (roomData.current_players || 1) - 1) })
          .eq('id', roomId)

        if (updateError) {
          debug.log('multiplayer', '[multiplayerOperations] Failed to update room player count', updateError)
          // Don't throw here, player removal was successful
        }
      }

      debug.log('multiplayer', '[multiplayerOperations] Player successfully left room', { 
        playerId, 
        roomId, 
        newHostPlayerId,
        wasHost: playerData.is_host
      })

      return { newHostPlayerId }
    } catch (error) {
      debug.log('multiplayer', '[multiplayerOperations] Error in leaveRoom', error)
      throw error
    }
  },

  /**
   * Create or get existing multiplayer quiz attempt
   */
  async createOrGetQuizAttempt(roomId: string, playerId: string, topicId: string, totalQuestions: number): Promise<string> {
    // First, try to find an existing active attempt
    const { data: existingAttempt, error: findError } = await supabase
      .from('multiplayer_quiz_attempts')
      .select('id')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .eq('is_completed', false)
      .single()

    if (existingAttempt && !findError) {
      return existingAttempt.id
    }

    // Create new attempt if none exists
    const { data: newAttempt, error: createError } = await supabase
      .from('multiplayer_quiz_attempts')
      .insert({
        room_id: roomId,
        player_id: playerId,
        topic_id: topicId,
        total_questions: totalQuestions,
        started_at: new Date().toISOString(),
        is_completed: false,
        score: 0,
        correct_answers: 0,
        time_spent_seconds: 0
      })
      .select('id')
      .single()

    if (createError) {
      debug.log('multiplayer', '[multiplayerOperations] Failed to create quiz attempt', createError)
      throw createError
    }

    return newAttempt.id
  },

  /**
   * Complete a multiplayer quiz attempt
   */
  async completeQuizAttempt(attemptId: string, score: number, correctAnswers: number, timeSpentSeconds: number): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_quiz_attempts')
      .update({
        completed_at: new Date().toISOString(),
        is_completed: true,
        score,
        correct_answers: correctAnswers,
        time_spent_seconds: timeSpentSeconds
      })
      .eq('id', attemptId)

    if (error) {
      debug.log('multiplayer', '[multiplayerOperations] Failed to complete quiz attempt', error)
      throw error
    }

    debug.log('multiplayer', '[multiplayerOperations] Quiz attempt completed successfully', {
      attemptId,
      score,
      correctAnswers
    })
  },

  /**
   * Submit a question response in multiplayer
   */
  async submitQuestionResponse(response: Omit<DbMultiplayerQuestionResponseInsert, 'id' | 'answered_at'>): Promise<void> {
    // Development-only logging
    debug.log('multiplayer', '[multiplayerOperations] submitQuestionResponse called', {
      roomId: response.room_id,
      playerId: response.player_id,
      questionNumber: response.question_number,
      selectedAnswer: response.selected_answer,
      isCorrect: response.is_correct,
      responseTime: response.response_time_seconds,
      timestamp: new Date().toISOString()
    })

    const responseWithTimestamp: DbMultiplayerQuestionResponseInsert = {
      ...response,
      answered_at: new Date().toISOString()
    }

    debug.log('multiplayer', '[multiplayerOperations] Inserting into multiplayer_question_responses', responseWithTimestamp)

    const { error } = await supabase
      .from('multiplayer_question_responses')
      .insert(responseWithTimestamp)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('💾 [multiplayerOperations] ❌ Database insert failed', {
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          responseData: responseWithTimestamp
        })
      }
      throw error
    }

    debug.log('multiplayer', '[multiplayerOperations] Response inserted successfully', {
      questionNumber: response.question_number,
      isCorrect: response.is_correct
    })
  },

  /**
   * Get question responses for a room
   */
  async getQuestionResponses(roomId: string, questionNumber?: number): Promise<MultiplayerQuestionResponse[]> {
    let query = supabase
      .from('multiplayer_question_responses')
      .select('*')
      .eq('room_id', roomId)

    if (questionNumber !== undefined) {
      query = query.eq('question_number', questionNumber)
    }

    const { data, error } = await query.order('answered_at')

    if (error) throw error
    return data as MultiplayerQuestionResponse[]
  },

  /**
   * Update player heartbeat for presence tracking
   */
  async updatePlayerHeartbeat(roomId: string, userId: string, connectionLatency?: number, connectionQuality?: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('multiplayer_room_players')
        .update({ 
          last_activity: new Date().toISOString(),
          is_connected: true,
          connection_latency: connectionLatency || 0,
          connection_quality: connectionQuality || 'excellent'
        })
        .eq('room_id', roomId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      debug.log('multiplayer', '[multiplayerOperations] Failed to update player heartbeat', error)
      return { success: false, error }
    }
  },

  /**
   * Check for inactive players and migrate host if needed
   */
  async checkAndMigrateHost(roomId: string): Promise<{ newHostId?: string; inactivePlayers: string[] }> {
    try {
      const { data: players, error } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('join_order')

      if (error || !players || players.length === 0) {
        return { inactivePlayers: [] }
      }

      const currentHost = players.find(p => p.is_host)
      if (!currentHost) {
        return { inactivePlayers: [] }
      }

             // Check if current host is still active (within last 30 seconds)
       const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
       const hostLastActivity = new Date(currentHost.last_activity || currentHost.created_at)
       
       if (hostLastActivity > thirtySecondsAgo && currentHost.is_connected) {
         // Host is still active, check for other inactive players
         const inactivePlayers = players
           .filter(p => {
             const lastActivity = new Date(p.last_activity || p.created_at)
             return lastActivity < thirtySecondsAgo || !p.is_connected
           })
           .map(p => p.id)

        return { inactivePlayers }
      }

      // Host is inactive, find new host (prioritize non-NPC connected players)
      const eligiblePlayers = players.filter(p => 
        p.id !== currentHost.id && 
        p.is_connected && 
        !p.player_name.includes('🤖') && 
        !p.player_name.includes('AI') &&
        !p.guest_token?.includes('npc_')
      )

      if (eligiblePlayers.length === 0) {
        // No eligible human players, keep current host but mark as inactive
        return { inactivePlayers: [currentHost.id] }
      }

      // Select new host (prioritize by join order)
      const newHost = eligiblePlayers[0]
      
      const transferResult = await this.transferHost(roomId, currentHost.id, newHost.id)
      
      if (transferResult.success) {
        debug.log('multiplayer', `Host migrated from inactive ${currentHost.id} to ${newHost.id}`)
        return { 
          newHostId: newHost.id, 
          inactivePlayers: [currentHost.id] 
        }
      } else {
        return { inactivePlayers: [currentHost.id] }
      }

    } catch (error) {
      console.error('Error in host migration:', error)
      return { inactivePlayers: [] }
    }
  },

  /**
   * Send a chat message to a room
   */
  async sendChatMessage(
    roomId: string, 
    playerId: string, 
    message: string, 
    messageType: 'chat' | 'system' | 'npc_reaction' | 'game_event' = 'chat'
  ): Promise<string> {
    debug.log('multiplayer', '[multiplayerOperations] Sending chat message', { roomId, playerId, messageType })

    const { data: newMessage, error } = await supabase
      .from('multiplayer_chat_messages')
      .insert({
        room_id: roomId,
        player_id: playerId,
        message_content: message.trim(),
        message_type: messageType,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      debug.log('multiplayer', '[multiplayerOperations] Failed to send chat message', error)
      throw error
    }

    // Trigger AI response if this is a user message in a room with NPCs
    if (messageType === 'chat') {
      this.triggerAIResponse(roomId, playerId, message).catch(err => {
        debug.log('multiplayer', '[multiplayerOperations] AI response failed', err)
        // Don't throw - AI response failure shouldn't break chat
      })
    }

    debug.log('multiplayer', '[multiplayerOperations] Chat message sent successfully', { messageId: newMessage.id })
    return newMessage.id
  },

  /**
   * Get chat messages for a room
   */
  async getChatMessages(roomId: string, limit: number = 50): Promise<any[]> {
    const { data: messages, error } = await supabase
      .from('multiplayer_chat_messages')
      .select(`
        id,
        message_content,
        message_type,
        created_at,
        educational_value,
        trigger_context,
        player_id,
        npc_id,
        multiplayer_room_players(
          player_name,
          player_emoji,
          is_host
        ),
        npc_personalities(
          display_name,
          emoji
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      debug.log('multiplayer', '[multiplayerOperations] Failed to get chat messages', error)
      throw error
    }

    // Transform to match ChatMessage interface
    return (messages || []).map(msg => ({
      id: msg.id,
      playerId: msg.player_id || msg.npc_id,
      playerName: msg.multiplayer_room_players?.player_name || msg.npc_personalities?.display_name || 'Unknown',
      playerEmoji: msg.multiplayer_room_players?.player_emoji || msg.npc_personalities?.emoji || '👤',
      text: msg.message_content,
      timestamp: msg.created_at,
      isFromNPC: !!msg.npc_id,
      isFromHost: msg.multiplayer_room_players?.is_host || false,
      messageType: msg.message_type,
      metadata: msg.trigger_context
    }))
  },

  /**
   * Trigger AI response to a chat message
   */
  async triggerAIResponse(roomId: string, triggerPlayerId: string, triggerMessage: string): Promise<void> {
    try {
      // Get NPCs in the room
      const { data: roomNPCs, error: npcError } = await supabase
        .from('multiplayer_npc_players')
        .select(`
          id,
          npc_id,
          player_id,
          npc_personalities(
            id,
            display_name,
            emoji,
            personality_type,
            base_skill_level,
            encouragement_style,
            chattiness_level,
            humor_level
          )
        `)
        .eq('room_id', roomId)

      if (npcError || !roomNPCs?.length) {
        debug.log('multiplayer', '[multiplayerOperations] No NPCs in room for AI response')
        return
      }

      // Get recent chat context
      const recentMessages = await this.getChatMessages(roomId, 10)
      
      // Randomly select an NPC to respond (30% chance per NPC)
      const respondingNPCs = roomNPCs.filter(() => Math.random() < 0.3)
      
      if (respondingNPCs.length === 0) {
        debug.log('multiplayer', '[multiplayerOperations] No NPCs chosen to respond')
        return
      }

      // Generate responses for selected NPCs
      for (const npcPlayer of respondingNPCs) {
        const npc = npcPlayer.npc_personalities
        if (!npc) continue

        try {
          // Generate AI response based on NPC personality
          const response = await this.generateNPCResponse(
            npc,
            triggerMessage,
            recentMessages,
            roomId
          )

          if (response) {
            // Send NPC message with a small delay to feel natural
            setTimeout(async () => {
              await supabase
                .from('multiplayer_chat_messages')
                .insert({
                  room_id: roomId,
                  player_id: npcPlayer.player_id,
                  npc_id: npc.id,
                  message_content: response.message,
                  message_type: 'npc_reaction',
                  educational_value: response.educationalValue,
                  trigger_context: response.metadata,
                  npc_personality_traits: [npc.personality_type, npc.encouragement_style],
                  created_at: new Date().toISOString()
                })
            }, Math.random() * 2000 + 1000) // 1-3 second delay
          }
        } catch (err) {
          debug.log('multiplayer', '[multiplayerOperations] Failed to generate NPC response', err)
        }
      }
    } catch (error) {
      debug.log('multiplayer', '[multiplayerOperations] Error in triggerAIResponse', error)
    }
  },

  /**
   * Generate NPC response using AI
   */
  async generateNPCResponse(
    npc: any,
    triggerMessage: string,
    recentMessages: any[],
    roomId: string
  ): Promise<{ message: string; educationalValue: string; metadata: any } | null> {
    try {
      // Get room topic for context
      const { data: room } = await supabase
        .from('multiplayer_rooms')
        .select('topic_id')
        .eq('id', roomId)
        .single()

      if (!room) return null

      // Create context for AI response
      const context = {
        npcName: npc.display_name,
        personalityType: npc.personality_type,
        skillLevel: npc.base_skill_level,
        encouragementStyle: npc.encouragement_style,
        chattinessLevel: npc.chattiness_level,
        humorLevel: npc.humor_level,
        triggerMessage: triggerMessage,
        recentMessages: recentMessages.slice(-5), // Last 5 messages for context
        topicId: room.topic_id
      }

      // For now, generate a simple response based on patterns
      // In production, this would call an AI service
      const response = this.generateSimpleNPCResponse(context)
      
      return response
    } catch (error) {
      debug.log('multiplayer', '[multiplayerOperations] Error generating NPC response', error)
      return null
    }
  },

  /**
   * Generate simple NPC response (placeholder for full AI integration)
   */
  generateSimpleNPCResponse(context: any): { message: string; educationalValue: string; metadata: any } {
    const { npcName, personalityType, skillLevel, encouragementStyle, triggerMessage, chattinessLevel, humorLevel } = context
    
    // Simple response patterns based on message content
    const civicKeywords = ['vote', 'election', 'government', 'democracy', 'constitution', 'rights', 'law', 'policy']
    const hasCivicContent = civicKeywords.some(keyword => 
      triggerMessage.toLowerCase().includes(keyword)
    )

    // Adjust responses based on personality type and encouragement style
    let responses: string[] = []
    
    if (hasCivicContent) {
      if (personalityType === 'scholar' || personalityType === 'expert') {
        responses = [
          "That's a fascinating constitutional question! 📚",
          "The legal framework around that is quite complex.",
          "From a theoretical perspective, that's an interesting point.",
          "The historical precedent for this is worth exploring.",
          "That touches on some important democratic principles."
        ]
      } else if (personalityType === 'activist') {
        responses = [
          "That's exactly why civic engagement matters! ✊",
          "We need more people thinking about these issues!",
          "Have you considered how this affects your community?",
          "This is why local action is so important.",
          "That's the kind of thinking that creates change!"
        ]
      } else if (personalityType === 'newcomer') {
        responses = [
          "I'm still learning about this too! 🤔",
          "That's a good question - I wonder about that myself.",
          "This stuff is complicated, but really important!",
          "Thanks for explaining that - I hadn't thought about it that way.",
          "We're all learning together here!"
        ]
      } else {
        responses = [
          "That's a great point about civic engagement! 🗳️",
          "I love discussing how government actually works!",
          "Democracy is fascinating when you understand the mechanics behind it.",
          "Have you ever contacted your representatives about this?",
          "The Constitution has some interesting provisions about that topic."
        ]
      }
    } else {
      // General chat responses
      if (encouragementStyle === 'supportive') {
        responses = [
          "Thanks for sharing that perspective! 😊",
          "That's really thoughtful of you to mention.",
          "I appreciate you bringing that up!",
          "Good point! Let's keep the discussion going.",
          "That's an interesting way to look at it."
        ]
      } else if (encouragementStyle === 'competitive') {
        responses = [
          "Interesting take! I might see it differently though.",
          "That's one perspective - here's another angle...",
          "Good point, but have you considered...?",
          "I like the debate! Keep the ideas coming.",
          "Now that's what I call a discussion! 🔥"
        ]
      } else {
        responses = [
          "Interesting perspective! 🤔",
          "I hadn't thought about it that way.",
          "Thanks for sharing that insight!",
          "Good point! Let's keep the discussion going.",
          "That reminds me of something I read recently..."
        ]
      }
    }

    const selectedResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      message: selectedResponse,
      educationalValue: hasCivicContent ? 'high' : 'medium',
      metadata: {
        personalityType: personalityType,
        encouragementStyle: encouragementStyle,
        triggerType: hasCivicContent ? 'civic_discussion' : 'general_chat',
        chattinessLevel: chattinessLevel,
        generatedAt: new Date().toISOString()
      }
    }
  },

  /**
   * Transfer host privileges to another non-NPC player
   */
  async transferHost(roomId: string, currentHostId: string, newHostId: string): Promise<{ success: boolean; newHost?: MultiplayerPlayer }> {
    try {
      // Verify the new host is a real player (not NPC) and is in the room
      const { data: newHostPlayer, error: hostError } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('id', newHostId)
        .eq('room_id', roomId)
        .eq('is_connected', true)
        .single()

      if (hostError || !newHostPlayer) {
        throw new Error('New host player not found or not connected')
      }

      // Check if player is an NPC
      if (newHostPlayer.player_name.includes('🤖') || newHostPlayer.player_name.includes('AI') || newHostPlayer.guest_token?.includes('npc_')) {
        throw new Error('Cannot transfer host to NPC player')
      }

             // Transfer host privileges manually using database updates
       const { error: removeHostError } = await supabase
         .from('multiplayer_room_players')
         .update({ is_host: false })
         .eq('id', currentHostId)
         .eq('room_id', roomId)

       if (removeHostError) throw removeHostError

       const { error: assignHostError } = await supabase
         .from('multiplayer_room_players')
         .update({ is_host: true })
         .eq('id', newHostId)
         .eq('room_id', roomId)

       if (assignHostError) throw assignHostError

      debug.log('multiplayer', `Host transferred from ${currentHostId} to ${newHostId} in room ${roomId}`)
      
      return {
        success: true,
        newHost: newHostPlayer as MultiplayerPlayer
      }
    } catch (error) {
      console.error('Error transferring host:', error)
      return { success: false }
    }
  },

     /**
    * Enhanced game state management (using settings column)
    */
   async updateGameState(roomId: string, gameState: Partial<GameState>): Promise<void> {
     // Get current settings to merge with game state
     const { data: currentRoom } = await supabase
       .from('multiplayer_rooms')
       .select('settings')
       .eq('id', roomId)
       .single()

     const currentSettings = (currentRoom?.settings as any) || {}
     const updatedSettings = {
       ...currentSettings,
       gameState: {
         ...((currentSettings.gameState as GameState) || {}),
         ...gameState
       }
     }

     const { error } = await supabase
       .from('multiplayer_rooms')
       .update({ settings: updatedSettings })
       .eq('id', roomId)

     if (error) throw error
   },

   async getGameState(roomId: string): Promise<GameState | null> {
     const { data, error } = await supabase
       .from('multiplayer_rooms')
       .select('settings')
       .eq('id', roomId)
       .single()

     if (error) return null
     const settings = (data?.settings as any) || {}
     return (settings.gameState as GameState) || null
   },

  /**
   * Start game with countdown
   */
     async startGameWithCountdown(roomId: string, countdownDuration: number = 5): Promise<boolean> {
     try {
       // Update room status and game state
       const gameState: GameState = {
         currentQuestionIndex: 0,
         gamePhase: 'countdown',
         countdownStartTime: Date.now(),
         answeredPlayers: []
       }

       // Update game state first
       await this.updateGameState(roomId, gameState)

       // Then update room status
       const { error } = await supabase
         .from('multiplayer_rooms')
         .update({
           room_status: 'starting',
           started_at: new Date().toISOString()
         })
         .eq('id', roomId)

       if (error) throw error

      // Schedule automatic transition to first question
      setTimeout(async () => {
        await this.advanceToQuestion(roomId, 0)
      }, countdownDuration * 1000)

      return true
    } catch (error) {
      console.error('Error starting game with countdown:', error)
      return false
    }
  },

  /**
   * Advance to next question
   */
  async advanceToQuestion(roomId: string, questionIndex: number): Promise<void> {
    const gameState: GameState = {
      currentQuestionIndex: questionIndex,
      gamePhase: 'question',
      questionStartTime: Date.now(),
      answeredPlayers: []
    }

    await this.updateGameState(roomId, gameState)
    
    // Update room status if transitioning from countdown
    const { error } = await supabase
      .from('multiplayer_rooms')
      .update({ room_status: 'in_progress' })
      .eq('id', roomId)
      .eq('room_status', 'starting') // Only update if still in starting state

    if (error) {
      console.warn('Could not update room status to in_progress:', error)
    }
  },

  /**
   * Record player answer and check for auto-advance
   */
  async recordPlayerAnswer(roomId: string, playerId: string, questionIndex: number, autoAdvanceDelay: number = 5): Promise<void> {
    try {
      // Get current game state
      const currentState = await this.getGameState(roomId)
      if (!currentState || currentState.currentQuestionIndex !== questionIndex) {
        return // Question has already advanced
      }

      // Add player to answered list
      const answeredPlayers = [...(currentState.answeredPlayers || []), playerId]
      
      await this.updateGameState(roomId, {
        ...currentState,
        answeredPlayers
      })

      // Check if all human players have answered
      const { data: humanPlayers } = await supabase
        .from('multiplayer_room_players')
        .select('id')
        .eq('room_id', roomId)
        .eq('is_connected', true)
        .not('player_name', 'like', '%🤖%')
        .not('player_name', 'like', '%AI%')

      const humanPlayerIds = humanPlayers?.map(p => p.id) || []
      const allHumansAnswered = humanPlayerIds.every(id => answeredPlayers.includes(id))

      if (allHumansAnswered) {
        // All humans answered, auto-advance after delay
        setTimeout(async () => {
          await this.autoAdvanceQuestion(roomId, questionIndex)
        }, autoAdvanceDelay * 1000)
      }

    } catch (error) {
      console.error('Error recording player answer:', error)
    }
  },

  /**
   * Auto-advance to next question or end game
   */
  async autoAdvanceQuestion(roomId: string, currentQuestionIndex: number): Promise<void> {
    try {
      // Get total questions for this room's topic
      const { data: room } = await supabase
        .from('multiplayer_rooms')
        .select('topic_id')
        .eq('id', roomId)
        .single()

      if (!room) return

      // For now, assume 10 questions per game (this could be configurable)
      const totalQuestions = 10
      const nextQuestionIndex = currentQuestionIndex + 1

      if (nextQuestionIndex >= totalQuestions) {
        // Game complete
        await this.completeGame(roomId)
      } else {
        // Advance to next question
        await this.advanceToQuestion(roomId, nextQuestionIndex)
      }
    } catch (error) {
      console.error('Error auto-advancing question:', error)
    }
  },

  /**
   * Complete the game
   */
  async completeGame(roomId: string): Promise<void> {
    const gameState: GameState = {
      currentQuestionIndex: -1,
      gamePhase: 'completed',
      answeredPlayers: []
    }

    await this.updateGameState(roomId, gameState)

    const { error } = await supabase
      .from('multiplayer_rooms')
      .update({
        room_status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (error) throw error
  },
}

// =============================================================================
// REALTIME HOOKS
// =============================================================================

// Development-only logging utility
const devLog = (message: string, data?: any) => {
  debug.log('multiplayer', `[useMultiplayerRoom] ${message}`, data)
}

/**
 * Hook for managing multiplayer room state with real-time updates
 * Accepts either room ID (UUID) or room code (8-char string)
 */
export function useMultiplayerRoom(roomIdOrCode?: string) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([])
  const [gameEvents, setGameEvents] = useState<MultiplayerGameEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actualRoomId, setActualRoomId] = useState<string | null>(null)
  
  // Track loading state via ref to avoid changing dependencies in callbacks
  const loadingRef = useRef(false)
  // Track current channel via ref to avoid dependency issues
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Track if we've already loaded data to prevent duplicate calls
  const hasLoadedRef = useRef(false)
  // Track the current roomIdOrCode to detect changes
  const currentRoomIdOrCodeRef = useRef<string | undefined>(undefined)

  // Stable function to load room data
  const loadRoomData = useCallback(async (roomCode: string) => {
    if (loadingRef.current) {
      devLog('Already loading, skipping duplicate call')
      return
    }
    
    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      devLog('Loading room data', { roomCode })
      
      let roomResult: any
      let roomId: string

      // Check if it's a UUID or room code
      const isUUID = roomCode.length === 36 && roomCode.includes('-')
      
      if (isUUID) {
        roomId = roomCode
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('id', roomId).single()
      } else {
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('room_code', roomCode.toUpperCase()).single()
        if (roomResult.data) {
          roomId = roomResult.data.id
        } else {
          throw new Error('Room not found')
        }
      }

      if (roomResult.error) {
        throw roomResult.error
      }

      // Load players
      const playersResult = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('join_order')

      if (playersResult.error) {
        throw playersResult.error
      }

      // Update state
      setActualRoomId(roomId)
      setRoom(roomResult.data as MultiplayerRoom)
      setPlayers(playersResult.data as MultiplayerPlayer[])
      hasLoadedRef.current = true
      devLog('Room data loaded successfully', { roomId, playerCount: playersResult.data?.length })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room'
      devLog('Error loading room', { error: errorMessage })
      setError(errorMessage)
      setRoom(null)
      setPlayers([])
      setActualRoomId(null)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Load initial room data - with proper dependency management
  useEffect(() => {
    // If roomIdOrCode hasn't changed, don't reload
    if (currentRoomIdOrCodeRef.current === roomIdOrCode && hasLoadedRef.current) {
      return
    }
    
    currentRoomIdOrCodeRef.current = roomIdOrCode
    hasLoadedRef.current = false
    
    // If no room code, reset everything
    if (!roomIdOrCode) {
      devLog('No roomIdOrCode provided, resetting state')
      setRoom(null)
      setPlayers([])
      setGameEvents([])
      setError(null)
      setActualRoomId(null)
      setIsLoading(false)
      
      // Clean up channel if exists
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    // Load room data
    loadRoomData(roomIdOrCode)
  }, [roomIdOrCode, loadRoomData])

  // Set up real-time subscriptions - separate effect with proper cleanup
  useEffect(() => {
    if (!actualRoomId) {
      return
    }

    devLog('Setting up realtime subscriptions', { actualRoomId })
    
    // Clean up any existing channel first
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    // Create a unique channel name with timestamp to avoid conflicts
    const channelName = `multiplayer_room:${actualRoomId}:${Date.now()}`
    const newChannel = supabase.channel(channelName)

    // Subscribe to room changes
    newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'multiplayer_rooms',
        filter: `id=eq.${actualRoomId}`
      },
      (payload) => {
        devLog('Room change received', { eventType: payload.eventType })
        if (payload.eventType === 'UPDATE') {
          setRoom(payload.new as MultiplayerRoom)
        }
      }
    )

    // Subscribe to player changes
    newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'multiplayer_room_players',
        filter: `room_id=eq.${actualRoomId}`
      },
      (payload) => {
        devLog('Player change received', { eventType: payload.eventType })
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as MultiplayerPlayer].sort((a, b) => a.join_order - b.join_order))
        } else if (payload.eventType === 'UPDATE') {
          setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new as MultiplayerPlayer : p))
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
        }
      }
    )

    // Subscribe to game events
    newChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'multiplayer_game_events',
        filter: `room_id=eq.${actualRoomId}`
      },
      (payload) => {
        devLog('Game event received', { eventType: (payload.new as any).event_type })
        setGameEvents(prev => [...prev, payload.new as MultiplayerGameEvent])
      }
    )
    
    // Subscribe and handle potential errors
    newChannel.subscribe((status) => {
      devLog('Channel subscription status', { status })
      if (status === 'CHANNEL_ERROR') {
        setError('Real-time connection failed')
      }
    })
    
    // Store in ref
    channelRef.current = newChannel

    return () => {
      devLog('Cleaning up realtime subscriptions')
      newChannel.unsubscribe()
      channelRef.current = null
    }
  }, [actualRoomId])

  const updatePlayerReady = useCallback(async (playerId: string, isReady: boolean) => {
    if (!actualRoomId) {
      devLog('Cannot update player ready - no room ID')
      return
    }
    
    try {
      devLog('Updating player ready status', { playerId, isReady })
      await multiplayerOperations.updatePlayerReady(actualRoomId, playerId, isReady)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ready status'
      devLog('Error updating player ready', { error: errorMessage })
      setError(errorMessage)
      throw err
    }
  }, [actualRoomId])

  // Function to check and rejoin if player is missing
  const ensurePlayerInRoom = useCallback(async (playerId: string, playerName: string, playerEmoji?: string) => {
    if (!actualRoomId) {
      return false
    }

    const currentPlayer = players.find(p => p.id === playerId)
    if (currentPlayer) {
      // Player exists, just update connection status
      try {
        await multiplayerOperations.updatePlayerConnection(playerId, true)
        return true
      } catch (err) {
        devLog('Failed to update player connection', { error: err })
        return false
      }
    }

    // Player is missing, try to rejoin
    try {
      devLog('Player missing from room, attempting rejoin', { playerId })
      const rejoinedPlayer = await multiplayerOperations.rejoinRoom(actualRoomId, playerId, playerName, playerEmoji)
      devLog('Successfully rejoined room', { playerId, rejoinedPlayer })
      return true
    } catch (err) {
      devLog('Failed to rejoin room', { error: err })
      setError('Lost connection to room. Please try refreshing the page.')
      return false
    }
  }, [actualRoomId, players])

  const startGame = useCallback(async () => {
    if (!actualRoomId) {
      devLog('Cannot start game - no room ID')
      return false
    }
    
    try {
      devLog('Starting game', { actualRoomId })
      const result = await multiplayerOperations.startGame(actualRoomId)
      devLog('Game start result', { success: result })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game'
      devLog('Error starting game', { error: errorMessage })
      setError(errorMessage)
      return false
    }
  }, [actualRoomId])

  const leaveRoom = useCallback(async (playerId: string) => {
    if (!actualRoomId) {
      devLog('Cannot leave room - no room ID')
      return
    }
    
    try {
      devLog('Player leaving room', { playerId, actualRoomId })
      await multiplayerOperations.leaveRoom(actualRoomId, playerId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room'
      devLog('Error leaving room', { error: errorMessage })
      setError(errorMessage)
      throw err
    }
  }, [actualRoomId])

  return {
    room,
    players,
    gameEvents,
    isLoading,
    error,
    updatePlayerReady,
    startGame,
    leaveRoom,
    ensurePlayerInRoom
  }
}

/**
 * Hook for managing multiplayer quiz gameplay
 */
export function useMultiplayerQuiz(roomId: string, playerId: string, topicId?: string, totalQuestions?: number) {
  const [responses, setResponses] = useState<MultiplayerQuestionResponse[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Subscribe to question responses
  useEffect(() => {
    if (!roomId) return

    // Clean up existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    // Create unique channel name
    const channelName = `multiplayer_quiz:${roomId}:${Date.now()}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'multiplayer_question_responses',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        setResponses(prev => [...prev, payload.new as MultiplayerQuestionResponse])
      }
    )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId])

  const submitResponse = useCallback(async (
    questionNumber: number,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTimeSeconds: number,
    _ignoredAttemptId?: string  // Ignore the passed attempt ID, we'll create our own
  ) => {
    // Development-only logging
    debug.log('multiplayer', '[useMultiplayerQuiz] submitResponse called', {
      roomId,
      playerId,
      questionNumber,
      questionId,
      selectedAnswer,
      isCorrect,
      responseTimeSeconds,
      timestamp: new Date().toISOString()
    })

    try {
      // Create or get quiz attempt if we don't have one
      let currentAttemptId = quizAttemptId
      if (!currentAttemptId && topicId && totalQuestions) {
        currentAttemptId = await multiplayerOperations.createOrGetQuizAttempt(
          roomId,
          playerId,
          topicId,
          totalQuestions
        )
        setQuizAttemptId(currentAttemptId)
        debug.log('multiplayer', '[useMultiplayerQuiz] Created/got quiz attempt', { attemptId: currentAttemptId })
      }

      if (!currentAttemptId) {
        throw new Error('Unable to create or find quiz attempt. Missing topicId or totalQuestions.')
      }

      const responseData = {
        room_id: roomId,
        player_id: playerId,
        attempt_id: currentAttemptId,
        question_number: questionNumber,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_seconds: responseTimeSeconds,
        bonus_applied: null // No bonus for now, can be enhanced later
      }

      debug.log('multiplayer', '[useMultiplayerQuiz] Calling multiplayerOperations.submitQuestionResponse', responseData)

      await multiplayerOperations.submitQuestionResponse(responseData)

      debug.log('multiplayer', '[useMultiplayerQuiz] Response submitted successfully', {
        questionNumber,
        isCorrect,
        responseTime: responseTimeSeconds
      })
    } catch (err) {
      const errorDetails = {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: (err as any)?.code,
        details: (err as any)?.details,
        hint: (err as any)?.hint,
        stack: err instanceof Error ? err.stack : undefined,
        responseData: {
          roomId,
          playerId,
          questionNumber,
          selectedAnswer,
          isCorrect
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('🎯 [useMultiplayerQuiz] ❌ Failed to submit response', errorDetails)
      }
      
      setError(errorDetails.message)
      throw new Error(`Failed to submit response: ${errorDetails.message}`)
    }
  }, [roomId, playerId, topicId, totalQuestions, quizAttemptId])

  const completeQuizAttempt = useCallback(async (score: number, correctAnswers: number, timeSpentSeconds: number) => {
    if (!quizAttemptId) {
      debug.log('multiplayer', '[useMultiplayerQuiz] No quiz attempt to complete')
      return
    }

    try {
      await multiplayerOperations.completeQuizAttempt(quizAttemptId, score, correctAnswers, timeSpentSeconds)
      debug.log('multiplayer', '[useMultiplayerQuiz] Quiz attempt completed successfully')
    } catch (err) {
      debug.log('multiplayer', '[useMultiplayerQuiz] Failed to complete quiz attempt', err)
      console.error('Failed to complete multiplayer quiz attempt:', err)
    }
  }, [quizAttemptId])

  return {
    responses,
    currentQuestion,
    isLoading,
    error,
    submitResponse,
    completeQuizAttempt,
    quizAttemptId,
    setCurrentQuestion
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing characters
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get emoji options for player selection
 */
export function getPlayerEmojiOptions(): string[] {
  return [
    '😊', '😎', '🤓', '😄', '😆', '🙂', '😋', '😇',
    '🤔', '😏', '🤗', '🤠', '🥳', '😌', '😍', '🤩',
    '🦄', '🐱', '🐶', '🐸', '🦊', '🐨', '🐼', '🦁',
    '⚡', '🔥', '💎', '🌟', '💪', '🚀', '🎯', '🏆'
  ]
}

/**
 * Check if user can use boosts (premium feature)
 */
export function canUseBoosts(user: any, isPremium: boolean): boolean {
  return !!user && isPremium
}