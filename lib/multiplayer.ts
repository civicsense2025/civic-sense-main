"use client"

import { supabase } from './supabase'
import { useAuth } from '@/components/auth/auth-provider'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { useState, useEffect, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

// =============================================================================
// MULTIPLAYER TYPES
// =============================================================================

export interface MultiplayerRoom {
  id: string
  room_code: string
  host_user_id: string | null
  topic_id: string
  room_name?: string
  max_players: number
  current_players: number
  room_status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'
  game_mode: 'classic' | 'speed_round' | 'elimination' | 'team_battle'
  settings: Record<string, any>
  created_at: string
  started_at?: string
  completed_at?: string
  expires_at: string
}

export interface MultiplayerPlayer {
  id: string
  room_id: string
  user_id?: string
  guest_token?: string
  player_name: string
  player_emoji: string
  is_ready: boolean
  is_host: boolean
  is_connected: boolean
  join_order: number
  boost_inventory: Record<string, any>
  created_at: string
  last_activity: string
}

export interface MultiplayerQuizAttempt {
  id: string
  room_id: string
  player_id: string
  topic_id: string
  total_questions: number
  correct_answers: number
  score: number
  time_spent_seconds: number
  bonus_points: number
  final_rank?: number
  started_at: string
  completed_at?: string
  is_completed: boolean
}

export interface MultiplayerQuestionResponse {
  id: string
  room_id: string
  player_id: string
  attempt_id: string
  question_number: number
  question_id: string
  selected_answer?: string
  is_correct: boolean
  response_time_seconds: number
  bonus_applied?: string
  answered_at: string
}

export interface MultiplayerGameEvent {
  id: string
  room_id: string
  event_type: string
  event_data: Record<string, any>
  triggered_by?: string
  created_at: string
}

export interface CreateRoomOptions {
  topicId: string
  roomName?: string
  maxPlayers?: number
  gameMode?: 'classic' | 'speed_round' | 'elimination' | 'team_battle'
}

export interface JoinRoomOptions {
  roomCode: string
  playerName: string
  playerEmoji?: string
}

// =============================================================================
// MULTIPLAYER DATABASE OPERATIONS
// =============================================================================

export const multiplayerOperations = {
  /**
   * Create a new multiplayer room
   */
  async createRoom(options: CreateRoomOptions, hostUserId?: string, guestToken?: string): Promise<MultiplayerRoom> {
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
      console.error('Database error in createRoom:', error)
      throw error
    }
    if (!data || data.length === 0) throw new Error('Failed to create room')

    const roomData = data[0]
    
    // Get the full room data using the returned room_id
    const { data: room, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomData.room_id)
      .single()

    if (roomError) throw roomError
    return room as MultiplayerRoom
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
   * Leave a room
   */
  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    // Remove player from room
    const { error: deleteError } = await supabase
      .from('multiplayer_room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('id', playerId)

    if (deleteError) throw deleteError

    // Update room player count
    const { data: roomData, error: getRoomError } = await supabase
      .from('multiplayer_rooms')
      .select('current_players')
      .eq('id', roomId)
      .single()

    if (getRoomError) throw getRoomError

    const { error: updateError } = await supabase
      .from('multiplayer_rooms')
      .update({ current_players: Math.max(0, (roomData.current_players || 1) - 1) })
      .eq('id', roomId)

    if (updateError) throw updateError
  },

  /**
   * Submit a question response in multiplayer
   */
  async submitQuestionResponse(response: Omit<MultiplayerQuestionResponse, 'id' | 'answered_at'>): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_question_responses')
      .insert({
        ...response,
        answered_at: new Date().toISOString()
      })

    if (error) throw error
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
  }
}

// =============================================================================
// REALTIME HOOKS
// =============================================================================

/**
 * Hook for managing multiplayer room state with real-time updates
 * Accepts either room ID (UUID) or room code (8-char string)
 */
export function useMultiplayerRoom(roomIdOrCode?: string) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([])
  const [gameEvents, setGameEvents] = useState<MultiplayerGameEvent[]>([])
  const [isLoading, setIsLoading] = useState(!!roomIdOrCode) // Start loading if we have a room code/ID
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [actualRoomId, setActualRoomId] = useState<string | null>(null)

  // Load initial room data
  useEffect(() => {
    if (!roomIdOrCode) return

    const loadRoomData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let roomResult: any
        let roomId: string

        // Check if input looks like a UUID (36 chars with dashes) or room code (shorter)
        if (roomIdOrCode.length === 36 && roomIdOrCode.includes('-')) {
          // It's a UUID room ID
          roomId = roomIdOrCode
          roomResult = await supabase.from('multiplayer_rooms').select('*').eq('id', roomId).single()
        } else {
          // It's a room code
          roomResult = await supabase.from('multiplayer_rooms').select('*').eq('room_code', roomIdOrCode.toUpperCase()).single()
          if (roomResult.data) {
            roomId = roomResult.data.id
          } else {
            throw new Error('Room not found')
          }
        }

        if (roomResult.error) throw roomResult.error

        setActualRoomId(roomId)
        setRoom(roomResult.data as MultiplayerRoom)

        // Load players using the actual room ID
        const playersResult = await supabase
          .from('multiplayer_room_players')
          .select('*')
          .eq('room_id', roomId)
          .order('join_order')

        if (playersResult.error) throw playersResult.error
        setPlayers(playersResult.data as MultiplayerPlayer[])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room data')
      } finally {
        setIsLoading(false)
      }
    }

    loadRoomData()
  }, [roomIdOrCode])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!actualRoomId) return

    const newChannel = supabase.channel(`multiplayer_room:${actualRoomId}`)

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
        setGameEvents(prev => [...prev, payload.new as MultiplayerGameEvent])
      }
    )

    newChannel.subscribe()
    setChannel(newChannel)

    return () => {
      newChannel.unsubscribe()
    }
  }, [actualRoomId])

  const updatePlayerReady = useCallback(async (playerId: string, isReady: boolean) => {
    if (!actualRoomId) return
    try {
      await multiplayerOperations.updatePlayerReady(actualRoomId, playerId, isReady)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ready status')
    }
  }, [actualRoomId])

  const startGame = useCallback(async () => {
    if (!actualRoomId) return false
    try {
      return await multiplayerOperations.startGame(actualRoomId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
      return false
    }
  }, [actualRoomId])

  const leaveRoom = useCallback(async (playerId: string) => {
    if (!actualRoomId) return
    try {
      await multiplayerOperations.leaveRoom(actualRoomId, playerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room')
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
    leaveRoom
  }
}

/**
 * Hook for managing multiplayer quiz gameplay
 */
export function useMultiplayerQuiz(roomId: string, playerId: string) {
  const [responses, setResponses] = useState<MultiplayerQuestionResponse[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to question responses
  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`multiplayer_quiz:${roomId}`)

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

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const submitResponse = useCallback(async (
    questionNumber: number,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    responseTimeSeconds: number,
    attemptId: string
  ) => {
    try {
      await multiplayerOperations.submitQuestionResponse({
        room_id: roomId,
        player_id: playerId,
        attempt_id: attemptId,
        question_number: questionNumber,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_seconds: responseTimeSeconds
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    }
  }, [roomId, playerId])

  return {
    responses,
    currentQuestion,
    isLoading,
    error,
    submitResponse,
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
  for (let i = 0; i < 6; i++) {
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