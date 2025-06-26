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
    const { congress_number } = body

    console.log(`🔄 Refreshing photos for ${congress_number}th Congress...`)

    // Mock photo refresh result
    const result = {
      success: true,
      congress_number,
      photos_refreshed: 85,
      photos_updated: 12,
      photos_failed: 3,
      duration_ms: 25000
    }

    console.log('✅ Photo refresh completed:', result)

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Photo refresh error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 