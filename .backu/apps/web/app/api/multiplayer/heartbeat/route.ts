import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMultiplayerEnabled } from '@civicsense/business-logic'

// POST /api/multiplayer/heartbeat - Update room activity timestamp
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!isMultiplayerEnabled()) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await request.json()
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
    }

    // Update room activity timestamp
    const { error: updateError } = await supabase
      .from('multiplayer_rooms')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', roomId)
      .eq('status', 'active')

    if (updateError) {
      console.error('Error updating room activity:', updateError)
      return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in heartbeat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Feature flag check - disable multiplayer API in production
  if (!envFeatureFlags.getFlag('multiplayer')) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'health':
        // Health check endpoint
        const { data: roomCount, error } = await supabase
          .from('multiplayer_rooms')
          .select('count')
          .in('room_status', ['waiting', 'starting', 'in_progress'])
          .single()
        
        if (error) {
          return NextResponse.json({ error: 'Health check failed' }, { status: 500 })
        }
        
        return NextResponse.json({
          status: 'healthy',
          activeRooms: roomCount?.count || 0,
          timestamp: new Date().toISOString()
        })
      
      case 'inactive_preview':
        // Preview what would be cleaned up
        const thresholdMinutes = parseInt(searchParams.get('threshold') || '60')
        
        const { data: previewResults, error: previewError } = await supabase
          .rpc('cleanup_inactive_players', {
            inactive_threshold_minutes: thresholdMinutes,
            dry_run: true
          })
        
        if (previewError) {
          return NextResponse.json({ error: 'Preview failed' }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          preview: previewResults,
          thresholdMinutes,
          message: `Would clean up ${previewResults?.length || 0} rooms`
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    debug.log('multiplayer', 'Heartbeat GET API error', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 