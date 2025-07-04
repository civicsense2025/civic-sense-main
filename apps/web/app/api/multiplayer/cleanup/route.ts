import { NextRequest, NextResponse } from 'next/server'
import { multiplayerOperations } from '@/lib/multiplayer'
import { envFeatureFlags } from '@/lib/env-feature-flags'
import { isMultiplayerEnabled } from '@civicsense/business-logic'
import { createClient } from '@/lib/supabase/server'

/**
 * Clean up expired multiplayer rooms
 * This endpoint can be called periodically (e.g., by a cron job) to maintain the database
 */
export async function POST(request: NextRequest) {
  // Feature flag check - disable multiplayer API in production
  if (!envFeatureFlags.getFlag('multiplayer')) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    console.log('🧹 Starting multiplayer room cleanup...')
    
    const result = await multiplayerOperations.cleanupExpiredRooms()
    
    console.log(`✅ Cleanup completed: ${result.cleaned} items`)
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.cleaned} expired items`,
      cleaned: result.cleaned,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Room cleanup failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Get cleanup status and statistics
 */
export async function GET() {
  // Feature flag check
  if (!isMultiplayerEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    
    // Get stale rooms (inactive for 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { data: staleRooms, error: roomsError } = await supabase
      .from('multiplayer_rooms')
      .select('id')
      .lt('last_activity', oneDayAgo.toISOString())
      .eq('status', 'active')

    if (roomsError) {
      console.error('Error fetching stale rooms:', roomsError)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    if (!staleRooms || staleRooms.length === 0) {
      return NextResponse.json({ message: 'No stale rooms found' })
    }

    // Mark rooms as inactive
    const staleRoomIds = staleRooms.map(room => room.id)
    const { error: updateError } = await supabase
      .from('multiplayer_rooms')
      .update({ status: 'inactive' })
      .in('id', staleRoomIds)

    if (updateError) {
      console.error('Error updating stale rooms:', updateError)
      return NextResponse.json({ error: 'Failed to update rooms' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Cleaned up ${staleRooms.length} stale rooms`,
      roomIds: staleRoomIds
    })
  } catch (error) {
    console.error('Error in cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 