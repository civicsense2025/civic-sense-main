import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

/**
 * Catch-all route to support clean multiplayer URLs.
 *
 * Patterns supported:
 *   /multiplayer/ROOMCODE                – viewer / not yet joined
 *   /multiplayer/ROOMCODE/PLAYERID       – player who already joined
 *
 * We look up the room to discover its topic and then forward the user to the
 * legacy multiplayer route that the rest of the app still expects:
 *   /quiz/<topicId>/multiplayer?room=<ROOMCODE>[&player=<PLAYERID>]
 */
export default async function MultiplayerRedirectPage({ params }: PageProps) {
  const resolvedParams = await params
  const [roomCode, playerId] = resolvedParams.slug ?? []

  // Basic validation – room code must be 8 chars.
  if (!roomCode || roomCode.length !== 8) {
    notFound()
  }

  // Look up the room to get its topic.
  const supabase = await createClient()
  const { data: room, error } = await supabase
    .from('multiplayer_rooms')
    .select('topic_id')
    .eq('room_code', roomCode.toUpperCase())
    .single()

  if (error || !room) {
    notFound()
  }

  const topicId = room.topic_id
  const query = new URLSearchParams({ room: roomCode })
  if (playerId) query.set('player', playerId)

  redirect(`/quiz/${topicId}/multiplayer?${query.toString()}`)
} 