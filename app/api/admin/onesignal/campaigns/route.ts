import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-access'
import { OneSignalCivicClient } from '@/lib/integrations/onesignal/client'
import { createClient } from '@supabase/supabase-js'

const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const getOneSignalClient = () => {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
    throw new Error('OneSignal not configured')
  }

  return new OneSignalCivicClient({
    appId: process.env.ONESIGNAL_APP_ID,
    restApiKey: process.env.ONESIGNAL_REST_API_KEY,
    userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY
  })
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()

    // Get campaigns from database
    const { data: campaigns, error } = await supabase
      .from('onesignal_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error && error.code !== 'PGRST116') { // Table might not exist yet
      console.error('Error fetching campaigns:', error)
    }

    // Return mock data if no database table exists yet
    const mockCampaigns = [
      {
        id: '1',
        name: 'Weekly Constitutional Quiz',
        type: 'quiz_reminder',
        status: 'completed',
        title: '📚 New Constitutional Quiz Available!',
        message: 'Test your knowledge of the Bill of Rights and earn civic points!',
        channels: ['push', 'email'],
        targeting: { segments: ['high-engagement'], user_count: 1247, filters: {} },
        scheduling: { send_immediately: false },
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        results: { sent: 1247, delivered: 1198, opened: 892, clicked: 267, conversions: 145 }
      },
      {
        id: '2',
        name: 'Election Day Reminder',
        type: 'voting_alert',
        status: 'scheduled',
        title: '🗳️ Election Day is Tomorrow!',
        message: 'Don\'t forget to vote! Find your polling location and make your voice heard.',
        channels: ['push', 'email', 'sms'],
        targeting: { segments: ['all-users'], user_count: 5432, filters: {} },
        scheduling: { send_immediately: false, scheduled_at: '2024-11-05T07:00:00Z' },
        created_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(campaigns || mockCampaigns)
  } catch (error) {
    console.error('Error getting campaigns:', error)
    return NextResponse.json({ error: 'Failed to get campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const campaignData = await request.json()
    const {
      name,
      type,
      title,
      message,
      channels,
      target_segments,
      send_immediately,
      scheduled_at
    } = campaignData

    const supabase = createServiceClient()
    const oneSignal = getOneSignalClient()

    // Create civic notification structure
    const notification = {
      type: type as any,
      title,
      message,
      channels: channels as any[],
      data: {
        action_type: type,
        deep_link: getDeepLinkForCampaignType(type),
        campaign_id: crypto.randomUUID()
      },
      personalization: {
        use_user_name: true,
        use_location: type === 'voting_alert',
        use_representative_info: type === 'civic_action'
      }
    }

    // Build targeting
    const targeting = {
      segments: target_segments.length > 0 ? target_segments : ['All'],
      filters: buildFiltersFromSegments(target_segments)
    }

    let result
    if (send_immediately) {
      // Send immediately
      result = await oneSignal.sendCivicNotification(notification, targeting)
    } else {
      // Schedule for later (TODO: implement scheduling)
      result = { success: true, notification_id: 'scheduled-' + crypto.randomUUID() }
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to create campaign',
        details: result.error
      }, { status: 400 })
    }

    // Store campaign in database
    const campaign = {
      id: crypto.randomUUID(),
      name,
      type,
      status: send_immediately ? 'sending' : 'scheduled',
      title,
      message,
      channels,
      targeting: {
        segments: target_segments,
        user_count: 0, // TODO: Calculate actual user count
        filters: targeting.filters
      },
      scheduling: {
        send_immediately,
        scheduled_at,
        timezone: 'UTC'
      },
      created_at: new Date().toISOString(),
      onesignal_notification_id: result.notification_id
    }

    // Try to store in database, but don't fail if table doesn't exist
    try {
      await supabase
        .from('onesignal_campaigns')
        .insert(campaign)
    } catch (dbError) {
      console.warn('Could not store campaign in database:', dbError)
    }

    return NextResponse.json({
      success: true,
      campaign,
      onesignal_result: result
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ 
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getDeepLinkForCampaignType(type: string): string {
  switch (type) {
    case 'quiz_reminder':
      return '/quiz'
    case 'voting_alert':
      return '/voting-guide'
    case 'news_update':
      return '/news'
    case 'civic_action':
      return '/actions'
    case 'educational_content':
      return '/learn'
    default:
      return '/'
  }
}

function buildFiltersFromSegments(segments: string[]): any[] {
  // Convert segment names to OneSignal filters
  const filters: any[] = []

  segments.forEach(segment => {
    switch (segment) {
      case 'high-engagement':
        filters.push({
          field: 'tag',
          key: 'engagement_level',
          relation: '=',
          value: 'high'
        })
        break
      case 'swing-states':
        filters.push({
          field: 'tag',
          key: 'state',
          relation: '=',
          value: 'PA' // Example - would need to handle multiple states
        })
        break
      case 'new-users':
        filters.push({
          field: 'tag',
          key: 'user_type',
          relation: '=',
          value: 'new_civic_learner'
        })
        break
    }
  })

  return filters
} 