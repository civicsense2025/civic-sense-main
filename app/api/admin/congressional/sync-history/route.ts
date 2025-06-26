import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('📋 Fetching sync history...')

    const supabase = await createClient()
    
    // Mock sync history for now - replace with actual sync logs when implemented
    const syncHistory = [
      {
        id: '1',
        source_system: 'congress_api',
        entity_type: 'bills_and_members',
        processed: 450,
        succeeded: 438,
        failed: 12,
        timestamp: new Date().toISOString(),
        errors: ['Failed to sync 12 bills due to placeholder text']
      },
      {
        id: '2',
        source_system: 'govinfo_api', 
        entity_type: 'hearings_and_documents',
        processed: 75,
        succeeded: 73,
        failed: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        errors: ['2 hearings had incomplete witness data']
      },
      {
        id: '3',
        source_system: 'photo_service',
        entity_type: 'congressional_photos',
        processed: 100,
        succeeded: 95,
        failed: 5,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        errors: ['5 photos failed to download from source']
      }
    ]

    console.log('✅ Sync history fetched:', syncHistory.length, 'records')

    return NextResponse.json({
      success: true,
      data: syncHistory
    })

  } catch (error) {
    console.error('Error fetching sync history:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 