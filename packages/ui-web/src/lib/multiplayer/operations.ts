import { supabase } from '@/lib/supabase/client'

export const multiplayerOperations = {
  async createRoom(
    config: {
      topicId: string
      gameMode: string
      maxPlayers: number
    },
    userId?: string,
    guestToken?: string
  ) {
    const { data: room } = await supabase
      .from('game_rooms')
      .insert({
        topic_id: config.topicId,
        game_mode: config.gameMode,
        max_players: config.maxPlayers,
        created_by: userId || guestToken,
        room_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single()

    const { data: player } = await supabase
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: userId || guestToken,
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    return { room, player }
  },

  async joinRoom(
    config: {
      roomCode: string
      playerName: string
      playerEmoji: string
    },
    userId?: string,
    guestToken?: string
  ) {
    const { data: room } = await supabase
      .from('game_rooms')
      .select()
      .eq('room_code', config.roomCode)
      .single()

    const { data: player } = await supabase
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: userId || guestToken,
        player_name: config.playerName,
        player_emoji: config.playerEmoji,
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    return { room, player }
  }
} 