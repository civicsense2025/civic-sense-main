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
    
    // Get the full room data using the returned id (function returns 'id', not 'room_id')
    const { data: room, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomData.id)
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [actualRoomId, setActualRoomId] = useState<string | null>(null)

  console.log('🏠 useMultiplayerRoom - Hook called with roomIdOrCode:', roomIdOrCode)
  console.log('🏠 useMultiplayerRoom - Current state:', { isLoading, room: !!room, error })

  // Memoize the room loading function to prevent infinite calls
  const loadRoomData = useCallback(async (roomCode: string) => {
    console.log('🏠 useMultiplayerRoom - Starting to load room data...')
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🏠 useMultiplayerRoom - Querying for room:', roomCode)
      
      let roomResult: any
      let roomId: string

      // Check if it's a UUID or room code
      if (roomCode.length === 36 && roomCode.includes('-')) {
        console.log('🏠 useMultiplayerRoom - Querying by room ID (UUID)')
        roomId = roomCode
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('id', roomId).single()
      } else {
        console.log('🏠 useMultiplayerRoom - Querying by room code')
        roomResult = await supabase.from('multiplayer_rooms').select('*').eq('room_code', roomCode.toUpperCase()).single()
        if (roomResult.data) {
          roomId = roomResult.data.id
        } else {
          throw new Error('Room not found')
        }
      }

      if (roomResult.error) {
        console.error('🏠 useMultiplayerRoom - Room query failed:', roomResult.error)
        throw roomResult.error
      }

      console.log('🏠 useMultiplayerRoom - Room found:', {
        id: roomResult.data.id,
        code: roomResult.data.room_code,
        status: roomResult.data.room_status
      })

      // Load players
      console.log('🏠 useMultiplayerRoom - Loading players...')
      const playersResult = await supabase
        .from('multiplayer_room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('join_order')

      if (playersResult.error) {
        console.error('🏠 useMultiplayerRoom - Players query failed:', playersResult.error)
        throw playersResult.error
      }

      console.log('🏠 useMultiplayerRoom - Players loaded:', playersResult.data.length)

      // Update state
      setActualRoomId(roomId)
      setRoom(roomResult.data as MultiplayerRoom)
      setPlayers(playersResult.data as MultiplayerPlayer[])
      setError(null)
      console.log('🏠 useMultiplayerRoom - ✅ Room data loaded successfully!')
      
    } catch (err) {
      console.error('🏠 useMultiplayerRoom - ❌ Error loading room:', err)
      setError(err instanceof Error ? err.message : 'Failed to load room')
      setRoom(null)
      setPlayers([])
      setActualRoomId(null)
    } finally {
      console.log('🏠 useMultiplayerRoom - Setting isLoading to false')
      setIsLoading(false)
    }
  }, []) // Empty dependency array - this function should be stable

  // Load initial room data - with proper dependency management
  useEffect(() => {
    console.log('🏠 useMultiplayerRoom - ✅ useEffect TRIGGERED!!! roomIdOrCode:', roomIdOrCode)
    
    // If no room code, reset everything
    if (!roomIdOrCode) {
      console.log('🏠 useMultiplayerRoom - No roomIdOrCode, resetting state')
      setRoom(null)
      setPlayers([])
      setError(null)
      setActualRoomId(null)
      setIsLoading(false)
      return
    }

    // Call the memoized function
    loadRoomData(roomIdOrCode)
  }, [roomIdOrCode, loadRoomData]) // Only depend on roomIdOrCode and the memoized function

  console.log('🏠 useMultiplayerRoom - After useEffect setup, current state:', { 
    room: room ? 'loaded' : 'null', 
    isLoading, 
    error
  })

  // Set up real-time subscriptions - separate effect with proper cleanup
  useEffect(() => {
    if (!actualRoomId) {
      console.log('🏠 useMultiplayerRoom - No actual room ID, skipping realtime setup')
      return
    }

    console.log('🏠 useMultiplayerRoom - Setting up realtime subscriptions for room:', actualRoomId)
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
        console.log('🏠 useMultiplayerRoom - Room change received:', payload.eventType)
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
        console.log('🏠 useMultiplayerRoom - Player change received:', payload.eventType)
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
        console.log('🏠 useMultiplayerRoom - Game event received:', payload.new)
        setGameEvents(prev => [...prev, payload.new as MultiplayerGameEvent])
      }
    )

    newChannel.subscribe()
    setChannel(newChannel)

    return () => {
      console.log('🏠 useMultiplayerRoom - Cleaning up realtime subscriptions')
      newChannel.unsubscribe()
    }
  }, [actualRoomId]) // Only depend on actualRoomId

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