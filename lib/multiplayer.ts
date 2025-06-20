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

// New types for the enhanced schema
export interface MultiplayerGameSession {
  id: string
  room_id: string
  session_number: number
  topic_id: string
  game_mode: string
  session_status: 'active' | 'paused' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  total_questions: number
  current_question_number: number
  session_config: any
  final_scores: any
  performance_stats: any
  created_at: string
  updated_at: string
}

export interface MultiplayerChatMessage {
  id: string
  room_id: string
  player_id: string
  message_type: 'chat' | 'system' | 'npc_reaction' | 'game_event'
  message_text: string
  metadata: any
  is_from_npc: boolean
  is_from_host: boolean
  reply_to_message_id?: string
  timestamp: string
  created_at: string
}

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
   * Create a new multiplayer room with enhanced session tracking
   */
  async createRoom(options: CreateRoomOptions, hostUserId?: string, guestToken?: string): Promise<{
    room: MultiplayerRoom
    player: MultiplayerPlayer
    session: MultiplayerGameSession
  }> {
    // Either hostUserId or guestToken is required
    if (!hostUserId && !guestToken) {
      // Generate a guest token for anonymous hosts
      guestToken = `guest_host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Generate a unique room code
    const roomCode = generateRoomCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    try {
      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .insert({
          room_code: roomCode,
          host_user_id: hostUserId || null,
          topic_id: options.topicId,
          room_name: options.roomName || 'Quiz Room',
          max_players: options.maxPlayers || 6,
          current_players: 0,
          room_status: 'waiting',
          game_mode: options.gameMode || 'classic',
          settings: {},
          expires_at: expiresAt
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Create the host player
      const { data: playerData, error: playerError } = await supabase
        .from('multiplayer_room_players')
        .insert({
          room_id: roomData.id,
          user_id: hostUserId || null,
          guest_token: guestToken || null,
          player_name: 'Host',
          player_emoji: '👑',
          is_host: true,
          is_ready: false,
          is_connected: true,
          join_order: 1,
          score: 0,
          questions_answered: 0,
          questions_correct: 0,
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single()

      if (playerError) throw playerError

      // Update room player count
      await supabase
        .from('multiplayer_rooms')
        .update({ current_players: 1 })
        .eq('id', roomData.id)

      // Create initial game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('multiplayer_game_sessions')
        .insert({
          room_id: roomData.id,
          session_number: 1,
          topic_id: options.topicId,
          game_mode: options.gameMode || 'classic',
          session_status: 'active',
          total_questions: 0,
          current_question_number: 0,
          session_config: {},
          final_scores: {},
          performance_stats: {}
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Log room creation event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomData.id,
          event_type: 'room_created',
          player_id: playerData.id,
          event_data: { 
            room_code: roomCode, 
            topic_id: options.topicId,
            game_mode: options.gameMode || 'classic'
          }
        })

      // Cache player ID locally
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`multiplayerPlayer_${roomCode}`, playerData.id)
        } catch {
          /* ignore */
        }
      }

      return {
        room: roomData as MultiplayerRoom,
        player: playerData as MultiplayerPlayer,
        session: sessionData as MultiplayerGameSession
      }
    } catch (error) {
      console.error('Database error in createRoom:', error)
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Join an existing multiplayer room with enhanced tracking
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

    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('room_code', options.roomCode.toUpperCase())
        .single()

      if (roomError || !roomData) {
        throw new Error('Room not found')
      }

      if (roomData.room_status !== 'waiting') {
        throw new Error('Room is not accepting new players')
      }

      if ((roomData.current_players || 0) >= (roomData.max_players || 6)) {
        throw new Error('Room is full')
      }

      // Check if player already exists in room
      const { data: existingPlayer } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomData.id)
        .or(
          finalUserId ? `user_id.eq.${finalUserId}` : `guest_token.eq.${finalGuestToken}`
        )
        .single()

      if (existingPlayer) {
        // Update existing player
        const { data: updatedPlayer, error: updateError } = await supabase
          .from('multiplayer_room_players')
          .update({
            player_name: options.playerName,
            player_emoji: options.playerEmoji || '😊',
            is_connected: true,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', existingPlayer.id)
          .select()
          .single()

        if (updateError) throw updateError

        return {
          room: roomData as MultiplayerRoom,
          player: updatedPlayer as MultiplayerPlayer
        }
      }

      // Create new player
      const { data: playerData, error: playerError } = await supabase
        .from('multiplayer_room_players')
        .insert({
          room_id: roomData.id,
          user_id: finalUserId,
          guest_token: finalGuestToken,
          player_name: options.playerName,
          player_emoji: options.playerEmoji || '😊',
          is_host: false,
          is_ready: false,
          is_connected: true,
          join_order: (roomData.current_players || 0) + 1,
          score: 0,
          questions_answered: 0,
          questions_correct: 0,
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single()

      if (playerError) throw playerError

             // Update room player count
       await supabase
         .from('multiplayer_rooms')
         .update({ current_players: (roomData.current_players || 0) + 1 })
         .eq('id', roomData.id)

      // Log player join event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomData.id,
          event_type: 'player_joined',
          player_id: playerData.id,
          event_data: { player_name: options.playerName }
        })

      // Cache player ID locally
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`multiplayerPlayer_${roomData.room_code}`, playerData.id)
        } catch {
          /* ignore */
        }
      }

      return {
        room: roomData as MultiplayerRoom,
        player: playerData as MultiplayerPlayer
      }
    } catch (error) {
      console.error('Error joining room:', error)
      throw new Error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
   * Get current game session for a room
   */
  async getCurrentGameSession(roomId: string): Promise<MultiplayerGameSession | null> {
    const { data, error } = await supabase
      .from('multiplayer_game_sessions')
      .select('*')
      .eq('room_id', roomId)
      .eq('session_status', 'active')
      .order('session_number', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      return null
    }

    return data as MultiplayerGameSession
  },

  /**
   * Update player ready status
   */
  async updatePlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_room_players')
      .update({ 
        is_ready: isReady,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', playerId)
      .eq('room_id', roomId)

    if (error) throw error
  },

  /**
   * Start a multiplayer game with session tracking
   */
  async startGame(roomId: string): Promise<boolean> {
    try {
      // Update room status
      const { error: roomError } = await supabase
        .from('multiplayer_rooms')
        .update({ 
          room_status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (roomError) throw roomError

      // Get current session and update it
      const session = await this.getCurrentGameSession(roomId)
      if (session) {
        await supabase
          .from('multiplayer_game_sessions')
          .update({ 
            started_at: new Date().toISOString(),
            session_status: 'active'
          })
          .eq('id', session.id)
      }

      // Log game start event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomId,
          event_type: 'game_started',
          event_data: { timestamp: new Date().toISOString() }
        })

      return true
    } catch (error) {
      console.error('Error starting game:', error)
      return false
    }
  },

  /**
   * Submit a question response with enhanced tracking
   */
  async submitQuestionResponse(response: {
    room_id: string
    player_id: string
    question_id: string
    question_number: number
    topic_id: string
    selected_answer?: string
    is_correct?: boolean
    response_time_ms?: number
    points_earned?: number
    hints_used?: number
  }): Promise<void> {
    try {
      // Insert into question responses
      const { error: responseError } = await supabase
        .from('multiplayer_question_responses')
        .insert({
          room_id: response.room_id,
          player_id: response.player_id,
          question_id: response.question_id,
          question_number: response.question_number,
          topic_id: response.topic_id,
          selected_answer: response.selected_answer,
          is_correct: response.is_correct,
          response_time_ms: response.response_time_ms,
          points_earned: response.points_earned || 0,
          hints_used: response.hints_used || 0,
          response_metadata: {},
          submitted_at: new Date().toISOString()
        })

      if (responseError) throw responseError

             // Log game event (if session exists)
       const currentSession = await this.getCurrentGameSession(response.room_id)
       if (currentSession) {
         await supabase
           .from('multiplayer_game_events')
           .insert({
             session_id: currentSession.id,
             room_id: response.room_id,
             player_id: response.player_id,
             event_type: 'answer_submitted',
             event_data: {
               question_id: response.question_id,
               question_number: response.question_number,
               is_correct: response.is_correct,
               response_time_ms: response.response_time_ms
             },
             question_number: response.question_number
           })
       }

             // Update player stats (get current values first)
       const { data: currentPlayer } = await supabase
         .from('multiplayer_room_players')
         .select('questions_answered, questions_correct, score')
         .eq('id', response.player_id)
         .single()

       if (currentPlayer) {
         const updates: any = {
           questions_answered: (currentPlayer.questions_answered || 0) + 1,
           last_activity_at: new Date().toISOString()
         }

         if (response.is_correct) {
           updates.questions_correct = (currentPlayer.questions_correct || 0) + 1
         }

         if (response.points_earned) {
           updates.score = (currentPlayer.score || 0) + response.points_earned
         }

         await supabase
           .from('multiplayer_room_players')
           .update(updates)
           .eq('id', response.player_id)
       }

    } catch (error) {
      console.error('Error submitting question response:', error)
      throw error
    }
  },

  /**
   * Send a chat message with enhanced tracking
   */
  async sendChatMessage(
    roomId: string, 
    playerId: string, 
    message: string, 
    messageType: 'chat' | 'system' | 'npc_reaction' | 'game_event' = 'chat'
  ): Promise<string> {
    try {
      const { data: newMessage, error } = await supabase
        .from('multiplayer_chat_messages')
        .insert({
          room_id: roomId,
          player_id: playerId,
          message_type: messageType,
          message_text: message.trim(),
          metadata: {},
          is_from_npc: false,
          is_from_host: false,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error

      return newMessage.id
    } catch (error) {
      console.error('Error sending chat message:', error)
      throw error
    }
  },

  /**
   * Get chat messages for a room
   */
  async getChatMessages(roomId: string, limit: number = 50): Promise<MultiplayerChatMessage[]> {
    const { data, error } = await supabase
      .from('multiplayer_chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).reverse() as MultiplayerChatMessage[]
  },

  /**
   * Leave a room with proper cleanup
   */
  async leaveRoom(roomId: string, playerId: string): Promise<{ newHostPlayerId?: string }> {
    try {
      // Get player info before deletion
      const { data: player } = await supabase
        .from('multiplayer_room_players')
        .select('is_host, user_id, guest_token')
        .eq('id', playerId)
        .single()

      // Delete player
      await supabase
        .from('multiplayer_room_players')
        .delete()
        .eq('id', playerId)

             // Update room player count
       const { data: roomData } = await supabase
         .from('multiplayer_rooms')
         .select('current_players')
         .eq('id', roomId)
         .single()

       if (roomData) {
         await supabase
           .from('multiplayer_rooms')
           .update({ current_players: Math.max(0, (roomData.current_players || 1) - 1) })
           .eq('id', roomId)
       }

      // Log leave event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomId,
          event_type: 'player_left',
          player_id: playerId,
          event_data: {}
        })

      // If host left, transfer to next player
      let newHostPlayerId: string | undefined
      if (player?.is_host) {
        const { data: nextPlayer } = await supabase
          .from('multiplayer_room_players')
          .select('id')
          .eq('room_id', roomId)
          .order('join_order')
          .limit(1)
          .single()

        if (nextPlayer) {
          await supabase
            .from('multiplayer_room_players')
            .update({ is_host: true })
            .eq('id', nextPlayer.id)
          
          newHostPlayerId = nextPlayer.id
        }
      }

      return { newHostPlayerId }
    } catch (error) {
      console.error('Error leaving room:', error)
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
        last_activity_at: new Date().toISOString()
      })
      .eq('id', playerId)

    if (error) throw error
  },

  /**
   * Enhanced game state management using game sessions
   */
  async updateGameState(roomId: string, gameState: Partial<GameState>): Promise<void> {
    try {
      const session = await this.getCurrentGameSession(roomId)
      if (!session) return

      const updatedConfig = {
        ...session.session_config,
        gameState: {
          ...(session.session_config?.gameState || {}),
          ...gameState
        }
      }

      await supabase
        .from('multiplayer_game_sessions')
        .update({ 
          session_config: updatedConfig,
          current_question_number: gameState.currentQuestionIndex || session.current_question_number
        })
        .eq('id', session.id)
    } catch (error) {
      console.error('Error updating game state:', error)
      throw error
    }
  },

  async getGameState(roomId: string): Promise<GameState | null> {
    try {
      const session = await this.getCurrentGameSession(roomId)
      if (!session) return null

      return session.session_config?.gameState || null
    } catch (error) {
      console.error('Error getting game state:', error)
      return null
    }
  },

  /**
   * Complete a game session
   */
  async completeGame(roomId: string): Promise<void> {
    try {
      // Update room status
      await supabase
        .from('multiplayer_rooms')
        .update({ 
          room_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', roomId)

      // Complete current session
      const session = await this.getCurrentGameSession(roomId)
      if (session) {
        await supabase
          .from('multiplayer_game_sessions')
          .update({ 
            session_status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id)
      }

      // Log completion event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomId,
          event_type: 'game_completed',
          event_data: { timestamp: new Date().toISOString() }
        })
    } catch (error) {
      console.error('Error completing game:', error)
      throw error
    }
  },

  /**
   * Rejoin a room (for reconnection scenarios)
   */
  async rejoinRoom(roomId: string, playerId: string, playerName: string, playerEmoji?: string): Promise<MultiplayerPlayer> {
    try {
      // Update existing player with new connection
      const { data: updatedPlayer, error } = await supabase
        .from('multiplayer_room_players')
        .update({
          player_name: playerName,
          player_emoji: playerEmoji || '😊',
          is_connected: true,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', playerId)
        .eq('room_id', roomId)
        .select()
        .single()

      if (error) throw error
      
      // Log rejoin event
      await supabase
        .from('multiplayer_room_events')
        .insert({
          room_id: roomId,
          event_type: 'player_rejoined',
          player_id: playerId,
          event_data: { player_name: playerName }
        })

      return updatedPlayer as MultiplayerPlayer
    } catch (error) {
      console.error('Error rejoining room:', error)
      throw error
    }
  },

  /**
   * Create or get existing quiz attempt for multiplayer
   */
  async createOrGetQuizAttempt(roomId: string, playerId: string, topicId: string): Promise<string> {
    try {
      // Check if attempt already exists
      const { data: existingAttempt } = await supabase
        .from('multiplayer_quiz_attempts')
        .select('id')
        .eq('room_id', roomId)
        .eq('player_id', playerId)
        .eq('topic_id', topicId)
        .single()

      if (existingAttempt) {
        return existingAttempt.id
      }

      // Get current session for this room
      const currentSession = await this.getCurrentGameSession(roomId)
      if (!currentSession) {
        throw new Error('No active game session found for room')
      }

      // Create new attempt - using correct field names from schema
      const { data: newAttempt, error } = await supabase
        .from('multiplayer_quiz_attempts')
        .insert({
          session_id: currentSession.id,
          room_id: roomId,
          player_id: playerId,
          topic_id: topicId,
          final_score: 0,
          questions_correct: 0,
          questions_total: 0,
          time_spent_seconds: 0,
          attempt_data: {},
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      
      return newAttempt.id
    } catch (error) {
      console.error('Error creating/getting quiz attempt:', error)
      throw error
    }
  },

  /**
   * Complete a quiz attempt
   */
  async completeQuizAttempt(attemptId: string, score: number, correctAnswers: number, timeSpentSeconds: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('multiplayer_quiz_attempts')
        .update({
          final_score: score,
          questions_correct: correctAnswers,
          time_spent_seconds: timeSpentSeconds,
          completed_at: new Date().toISOString()
        })
        .eq('id', attemptId)

      if (error) throw error
    } catch (error) {
      console.error('Error completing quiz attempt:', error)
      throw error
    }
  },

  /**
   * Start game with countdown
   */
  async startGameWithCountdown(roomId: string, countdownDuration: number = 5): Promise<boolean> {
    try {
      // Update room status to starting
      const { error: roomError } = await supabase
        .from('multiplayer_rooms')
        .update({ 
          room_status: 'starting',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (roomError) throw roomError

      // After countdown, start the actual game
      setTimeout(async () => {
        await this.startGame(roomId)
      }, countdownDuration * 1000)

      return true
    } catch (error) {
      console.error('Error starting game with countdown:', error)
      return false
    }
  },

  /**
   * Record player answer
   */
  async recordPlayerAnswer(response: {
    room_id: string
    player_id: string
    question_id: string
    question_number: number
    topic_id: string
    selected_answer: string
    is_correct: boolean
    response_time_ms: number
    points_earned?: number
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('multiplayer_question_responses')
        .insert({
          room_id: response.room_id,
          player_id: response.player_id,
          question_id: response.question_id,
          question_number: response.question_number,
          topic_id: response.topic_id,
          selected_answer: response.selected_answer,
          is_correct: response.is_correct,
          response_time_ms: response.response_time_ms,
          points_earned: response.points_earned || 0
        })

      if (error) throw error
    } catch (error) {
      console.error('Error recording player answer:', error)
      throw error
    }
  },

  /**
   * Cleanup expired rooms
   */
  async cleanupExpiredRooms(): Promise<{ cleaned: number }> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_rooms')
      
      if (error) throw error
      
      return { cleaned: data || 0 }
    } catch (error) {
      console.error('Error cleaning up expired rooms:', error)
      return { cleaned: 0 }
    }
  },

  /**
   * Get user rooms
   */
  async getUserRooms(userId?: string, guestToken?: string): Promise<MultiplayerRoom[]> {
    try {
      let query = supabase
        .from('multiplayer_rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('host_user_id', userId)
      } else if (guestToken) {
        // For guest users, we need to check through player memberships
        const { data: playerRooms } = await supabase
          .from('multiplayer_room_players')
          .select('room_id')
          .eq('guest_token', guestToken)

        if (playerRooms && playerRooms.length > 0) {
          const roomIds = playerRooms.map(p => p.room_id)
          query = query.in('id', roomIds)
        } else {
          return []
        }
      } else {
        return []
      }

      const { data, error } = await query

      if (error) throw error
      return data as MultiplayerRoom[]
    } catch (error) {
      console.error('Error getting user rooms:', error)
      return []
    }
  },

  /**
   * Update player heartbeat
   */
  async updatePlayerHeartbeat(roomId: string, playerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('multiplayer_room_players')
        .update({ 
          last_activity_at: new Date().toISOString(),
          is_connected: true
        })
        .eq('id', playerId)
        .eq('room_id', roomId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating player heartbeat:', error)
      throw error
    }
  },

  /**
   * Check and migrate host if needed
   */
  async checkAndMigrateHost(roomId: string): Promise<{ migrated: boolean; newHostId?: string }> {
    try {
      // Get current host
      const { data: currentHost } = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', true)
        .single()

      // If host is disconnected, find a new one
      if (currentHost && !currentHost.is_connected) {
        const { data: newHost } = await supabase
          .from('multiplayer_room_players')
          .select('*')
          .eq('room_id', roomId)
          .eq('is_connected', true)
          .neq('id', currentHost.id)
          .order('join_order')
          .limit(1)
          .single()

        if (newHost) {
          // Update old host
          await supabase
            .from('multiplayer_room_players')
            .update({ is_host: false })
            .eq('id', currentHost.id)

          // Update new host
          await supabase
            .from('multiplayer_room_players')
            .update({ is_host: true })
            .eq('id', newHost.id)

          return { migrated: true, newHostId: newHost.id }
        }
      }

      return { migrated: false }
    } catch (error) {
      console.error('Error checking and migrating host:', error)
      return { migrated: false }
    }
  },

  /**
   * Update player in room
   */
  async updatePlayerInRoom(roomId: string, updates: {
    player_name?: string
    player_emoji?: string
    is_ready?: boolean
    is_connected?: boolean
    score?: number
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('multiplayer_room_players')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString()
        })
        .eq('room_id', roomId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating player in room:', error)
      throw error
    }
  }
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
      
      console.log('🎮 Room lookup:', { roomCode, isUUID, length: roomCode.length })
      
      if (isUUID) {
        roomId = roomCode
        console.log('🎮 Looking up room by UUID:', roomId)
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('id', roomId).single()
      } else {
        console.log('🎮 Looking up room by code:', roomCode.toUpperCase())
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('room_code', roomCode.toUpperCase()).single()
        if (roomResult.data) {
          roomId = roomResult.data.id
        } else {
          throw new Error('Room not found')
        }
      }

      if (roomResult.error) {
        console.error('🎮 Error loading room:', roomResult.error)
        throw roomResult.error
      }

      console.log('🎮 Room query result:', {
        roomCode,
        roomId,
        roomData: roomResult.data,
        roomExists: !!roomResult.data
      })

      // Load players with detailed debugging
      console.log('🎮 About to query players for room:', roomId)
      
      const playersResult = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('join_order')

      console.log('🎮 Raw players query response:', {
        data: playersResult.data,
        error: playersResult.error,
        count: playersResult.count,
        status: playersResult.status,
        statusText: playersResult.statusText
      })

      if (playersResult.error) {
        console.error('🎮 Error loading players:', playersResult.error)
        throw playersResult.error
      }

      console.log('🎮 Players query result:', {
        roomId,
        playersData: playersResult.data,
        playerCount: playersResult.data?.length,
        players: playersResult.data?.map(p => ({
          id: p.id,
          name: p.player_name,
          isHost: p.is_host,
          guestToken: p.guest_token,
          userId: p.user_id
        }))
      })

      // Also try a direct query to see if the player exists at all
      console.log('🎮 Checking if ANY players exist in this room with different query...')
      const debugPlayersResult = await supabase
        .from('multiplayer_room_players')
        .select('id, player_name, guest_token, user_id, is_host, room_id')
        .eq('room_id', roomId)
      
      console.log('🎮 Debug players query result:', debugPlayersResult)

      // Also check if there are ANY players in the database for this room (without RLS)
      console.log('🎮 Checking if player exists with direct room_id query...')
      const directRoomCheck = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
      
      console.log('🎮 Direct room check result:', directRoomCheck)

      // Check if the room was created correctly
      console.log('🎮 Checking room creation details...')
      const roomCreationCheck = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('id', roomId)
        .single()
      
      console.log('🎮 Room creation check:', roomCreationCheck)

      // Try to query all players in the table to see if any exist
      console.log('🎮 Checking ALL players in multiplayer_room_players table...')
      const allPlayersCheck = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .limit(5)
      
      console.log('🎮 All players check (first 5):', allPlayersCheck)

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
        console.log('🎮 Real-time player change:', {
          eventType: payload.eventType,
          playerId: (payload.new as any)?.id || (payload.old as any)?.id,
          playerName: (payload.new as any)?.player_name || (payload.old as any)?.player_name,
          payload: payload
        })
        devLog('Player change received', { eventType: payload.eventType })
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as MultiplayerPlayer].sort((a, b) => (a.join_order || 0) - (b.join_order || 0)))
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
          topicId
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
        question_id: questionId,
        question_number: questionNumber,
        topic_id: topicId!,  // We know this is available since we check for it above
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: responseTimeSeconds * 1000, // Convert seconds to milliseconds
        points_earned: isCorrect ? 100 : 0, // Basic scoring
        hints_used: 0 // No hints for now
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