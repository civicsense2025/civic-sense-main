/**
 * Google Calendar Sync API Route
 * 
 * Handles syncing CivicSense topics and news to users' Google Calendars
 * Leverages existing Google OAuth integration from classroom features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { cookies } from 'next/headers'
import { 
  syncTopicsToCalendar, 
  getUserCalendarToken,
  type CalendarSyncOptions 
} from '@civicsense/shared/lib/integrations/google-calendar'

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

interface SyncRequest {
  includeBreakingNews?: boolean
  includeFeaturedTopics?: boolean
  includeAllTopics?: boolean
  timeZone?: string
}

function validateSyncRequest(body: any): SyncRequest {
  return {
    includeBreakingNews: Boolean(body.includeBreakingNews),
    includeFeaturedTopics: Boolean(body.includeFeaturedTopics),
    includeAllTopics: Boolean(body.includeAllTopics),
    timeZone: typeof body.timeZone === 'string' ? body.timeZone : undefined,
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const syncOptions = validateSyncRequest(body)

    // Check if user has Google Calendar access token
    let accessToken = await getUserCalendarToken(user.id)
    
    // Fallback to cookies if database token not found
    if (!accessToken) {
      const cookieStore = await cookies()
      const cookieToken = cookieStore.get('google_access_token')?.value
      const googleService = cookieStore.get('google_service')?.value
      
      if (cookieToken && (googleService === 'calendar' || googleService === 'both')) {
        accessToken = cookieToken
        console.log('Using Google Calendar token from cookies')
      }
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Google Calendar access not found',
          details: 'Please connect your Google account first to sync with Google Calendar',
          requiresAuth: true 
        },
        { status: 403 }
      )
    }

    // Perform the sync
    const syncResult = await syncTopicsToCalendar(
      accessToken,
      user.id,
      syncOptions
    )

    // Return success response
    return NextResponse.json({
      success: true,
      result: syncResult,
      message: `Successfully synced ${syncResult.syncedCount} topics to your Google Calendar${
        syncResult.skippedCount > 0 ? ` (${syncResult.skippedCount} skipped)` : ''
      }`
    })

  } catch (error) {
    console.error('Calendar sync error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('access_denied') || error.message.includes('401')) {
        return NextResponse.json(
          { 
            error: 'Google Calendar access denied',
            details: 'Please reconnect your Google account',
            requiresAuth: true 
          },
          { status: 403 }
        )
      }

      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            details: 'Please try again later' 
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Calendar sync failed',
        details: 'An unexpected error occurred while syncing to Google Calendar' 
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// CHECK SYNC STATUS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has Google Calendar integration
    let accessToken = await getUserCalendarToken(user.id)
    
    // Fallback to cookies if database token not found
    if (!accessToken) {
      const cookieStore = await cookies()
      const cookieToken = cookieStore.get('google_access_token')?.value
      const googleService = cookieStore.get('google_service')?.value
      
      if (cookieToken && (googleService === 'calendar' || googleService === 'both')) {
        accessToken = cookieToken
      }
    }
    
    const hasGoogleAccess = !!accessToken

    // Get recent sync logs
    const { data: recentSyncs, error: syncError } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })
      .limit(5)

    if (syncError) {
      console.error('Error fetching sync logs:', syncError)
    }

    // Get user calendar sync settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('calendar_sync_enabled, calendar_sync_options')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      hasGoogleAccess,
      isEnabled: settings?.calendar_sync_enabled || false,
      syncOptions: settings?.calendar_sync_options || {},
      recentSyncs: recentSyncs || [],
      lastSyncAt: recentSyncs?.[0]?.synced_at || null,
    })

  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
} 