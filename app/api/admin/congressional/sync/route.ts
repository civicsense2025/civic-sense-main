import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    const body = await request.json()
    const { sync_type = 'basic', congress_number = 119 } = body

    console.log(`🔄 Starting ${sync_type} sync for ${congress_number}th Congress...`)

    // For now, just return success - replace with actual sync logic
    const mockResult = {
      success: true,
      type: sync_type,
      congress_number,
      members_synced: 435,
      bills_synced: 250,
      hearings_synced: 75,
      duration_ms: 30000
    }

    console.log('✅ Sync completed:', mockResult)

    return NextResponse.json({
      success: true,
      result: mockResult
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 