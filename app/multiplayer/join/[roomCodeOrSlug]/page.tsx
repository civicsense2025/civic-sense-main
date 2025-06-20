import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isMultiplayerEnabled } from '@/lib/feature-flags'

interface PageProps {
  params: Promise<{ roomCodeOrSlug: string }>
}

/**
 * Join room page that supports both room codes and custom slugs
 * 
 * Patterns supported:
 *   /multiplayer/join/ROOMCODE   – 8-character room code
 *   /multiplayer/join/my-custom-room – custom room slug
 */
export default async function JoinRoomPage({ params }: PageProps) {
  // Feature flag check - hide multiplayer in production
  if (!isMultiplayerEnabled()) {
    notFound()
  }

  const resolvedParams = await params
  const { roomCodeOrSlug } = resolvedParams

  if (!roomCodeOrSlug) {
    notFound()
  }

  // Look up the room by code or slug
  const supabase = await createClient()
  
  // Try to find room by code first (8 characters, uppercase)
  let room = null
  if (roomCodeOrSlug.length === 8) {
    const { data } = await supabase
      .from('multiplayer_rooms')
      .select('topic_id, room_code')
      .eq('room_code', roomCodeOrSlug.toUpperCase())
      .single()
    
    room = data
  }
  
  // If not found by code, try to find by custom slug
  if (!room) {
    const { data } = await supabase
      .from('multiplayer_rooms')
      .select('topic_id, room_code')
      .eq('custom_slug', roomCodeOrSlug.toLowerCase())
      .single()
    
    room = data
  }

  if (!room) {
    notFound()
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is not logged in, redirect to marketing page with room code
  if (!user) {
    redirect(`/multiplayer?join=${room.room_code}`)
  }

  // Redirect to the quiz multiplayer page
  redirect(`/quiz/${room.topic_id}/multiplayer?room=${room.room_code}`)
} 