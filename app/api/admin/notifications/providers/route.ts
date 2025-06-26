import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-access'
import { createClient } from '@supabase/supabase-js'

const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - List all notification providers
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()

    // For now, return mock data since we haven't migrated to the new schema yet
    const providers = [
      {
        id: 'onesignal',
        provider_name: 'OneSignal',
        provider_type: 'push',
        is_active: true,
        configuration: {
          app_id: process.env.ONESIGNAL_APP_ID || '',
          rest_api_key: process.env.ONESIGNAL_REST_API_KEY || '',
          supports_segmentation: true,
          supports_rich_content: true
        },
        stats: {
          total_subscribers: 3200,
          campaigns_sent: 45,
          avg_open_rate: 49.2,
          avg_click_rate: 16.4
        }
      },
      {
        id: 'email',
        provider_name: 'Email',
        provider_type: 'email',
        is_active: true,
        configuration: {
          smtp_host: 'smtp.sendgrid.net',
          supports_templates: true,
          supports_scheduling: true
        },
        stats: {
          total_subscribers: 4100,
          campaigns_sent: 23,
          avg_open_rate: 24.8,
          avg_click_rate: 3.2
        }
      },
      {
        id: 'sms',
        provider_name: 'SMS',
        provider_type: 'sms',
        is_active: false,
        configuration: {
          character_limit: 160,
          supports_links: true
        },
        stats: {
          total_subscribers: 1200,
          campaigns_sent: 8,
          avg_open_rate: 98.0,
          avg_click_rate: 15.6
        }
      }
    ]

    return NextResponse.json({
      success: true,
      providers
    })

  } catch (error) {
    console.error('Error fetching notification providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification providers' },
      { status: 500 }
    )
  }
}

// POST - Create or update notification provider configuration
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { provider_name, provider_type, configuration, is_active } = await request.json()

    // Validate required fields
    if (!provider_name || !provider_type) {
      return NextResponse.json(
        { error: 'Provider name and type are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Mock response for now
    const providerConfig = {
      id: provider_name.toLowerCase(),
      provider_name,
      provider_type,
      is_active: is_active !== false,
      configuration: configuration || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: `${provider_name} provider configured successfully`,
      provider: providerConfig
    })

  } catch (error) {
    console.error('Error configuring notification provider:', error)
    return NextResponse.json(
      { error: 'Failed to configure notification provider' },
      { status: 500 }
    )
  }
}

// PUT - Update provider configuration
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { provider_id, configuration, is_active } = await request.json()

    if (!provider_id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    // Mock update for now
    return NextResponse.json({
      success: true,
      message: 'Provider configuration updated successfully',
      provider: {
        id: provider_id,
        configuration,
        is_active,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating notification provider:', error)
    return NextResponse.json(
      { error: 'Failed to update notification provider' },
      { status: 500 }
    )
  }
} 