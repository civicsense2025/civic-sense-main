import { NextRequest, NextResponse } from 'next/server'
import { multiplayerOperations } from '@/lib/multiplayer'
import { isMultiplayerEnabled } from '@/lib/feature-flags'

/**
 * Clean up expired multiplayer rooms
 * This endpoint can be called periodically (e.g., by a cron job) to maintain the database
 */
export async function POST(request: NextRequest) {
  // Feature flag check - disable multiplayer API in production
  if (!isMultiplayerEnabled()) {
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
export async function GET(request: NextRequest) {
  // Feature flag check - disable multiplayer API in production
  if (!isMultiplayerEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    // This could be expanded to show cleanup statistics
    return NextResponse.json({
      success: true,
      message: 'Room cleanup endpoint is available',
      description: 'Use POST to trigger cleanup of expired rooms',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 