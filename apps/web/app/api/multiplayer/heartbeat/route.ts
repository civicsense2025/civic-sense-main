import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { multiplayerOperations } from '@civicsense/shared/lib/multiplayer'
import { debug } from '@civicsense/shared/lib/debug-config'
import { envFeatureFlags } from '@civicsense/shared/lib/env-feature-flags'

export async function POST(request: NextRequest) {
  // Feature flag check - disable multiplayer API in production
  if (!envFeatureFlags.getFlag('multiplayer')) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { action, roomId, userId, connectionLatency, connectionQuality } = body
    
    switch (action) {
      case 'heartbeat':
        if (!roomId || !userId) {
          return NextResponse.json({ error: 'Missing roomId or userId' }, { status: 400 })
        }
        
        await multiplayerOperations.updatePlayerHeartbeat(roomId, userId)
        
        return NextResponse.json({ 
          success: true,
          message: 'Heartbeat updated'
        })
      
      case 'check_host_migration':
        if (!roomId) {
          return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })
        }
        
        const migrationResult = await multiplayerOperations.checkAndMigrateHost(roomId)
        
        return NextResponse.json({
          success: true,
          migrated: migrationResult.migrated,
          newHostId: migrationResult.newHostId,
          message: migrationResult.migrated ? 'Host migrated' : 'No migration needed'
        })
      
      case 'cleanup_inactive':
        // This can be called by cron jobs to clean up inactive players across all rooms
        const inactiveThresholdMinutes = body.inactiveThresholdMinutes || 60
        const dryRun = body.dryRun || false
        
        const { data: cleanupResults, error: cleanupError } = await supabase
          .rpc('cleanup_inactive_players', {
            inactive_threshold_minutes: inactiveThresholdMinutes,
            dry_run: dryRun
          })
        
        if (cleanupError) {
          debug.log('multiplayer', 'Cleanup failed', cleanupError)
          return NextResponse.json({ error: 'Cleanup failed', details: cleanupError.message }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          cleanupResults,
          message: `${dryRun ? 'Preview:' : 'Cleaned up'} ${cleanupResults?.length || 0} rooms`
        })
      
      case 'bulk_host_check':
        // Check all active rooms for host migration needs
        const { data: activeRooms, error: roomsError } = await supabase
          .from('multiplayer_rooms')
          .select('id')
          .in('room_status', ['waiting', 'starting', 'in_progress'])
        
        if (roomsError) {
          return NextResponse.json({ error: 'Failed to fetch active rooms' }, { status: 500 })
        }
        
        const migrationResults = []
        for (const room of activeRooms || []) {
          try {
            const result = await multiplayerOperations.checkAndMigrateHost(room.id)
            if (result.migrated) {
              migrationResults.push({
                roomId: room.id,
                newHostId: result.newHostId,
                migrated: result.migrated
              })
            }
          } catch (error) {
            debug.log('multiplayer', `Failed to check host migration for room ${room.id}`, error)
          }
        }
        
        return NextResponse.json({
          success: true,
          migrationsPerformed: migrationResults.length,
          migrations: migrationResults,
          message: `Checked ${activeRooms?.length || 0} rooms, performed ${migrationResults.length} migrations`
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    debug.log('multiplayer', 'Heartbeat API error', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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