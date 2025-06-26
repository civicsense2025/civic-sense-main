import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-access'
import { createClient } from '@supabase/supabase-js'

const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()

    // Get OneSignal configuration from database or environment
    const config = {
      app_id: process.env.ONESIGNAL_APP_ID || '',
      rest_api_key: process.env.ONESIGNAL_REST_API_KEY ? '••••••••••••••••' : '',
      user_auth_key: process.env.ONESIGNAL_USER_AUTH_KEY ? '••••••••••••••••' : '',
      is_configured: !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY),
      last_sync: null // TODO: Get from database
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error getting OneSignal config:', error)
    return NextResponse.json({ error: 'Failed to get configuration' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { app_id, rest_api_key, user_auth_key } = await request.json()

    // Validate the configuration by testing OneSignal API
    try {
      const testResponse = await fetch(`https://onesignal.com/api/v1/apps/${app_id}`, {
        headers: {
          'Authorization': `Basic ${rest_api_key}`
        }
      })

      if (!testResponse.ok) {
        return NextResponse.json({ 
          error: 'Invalid OneSignal credentials',
          details: 'Failed to authenticate with OneSignal API'
        }, { status: 400 })
      }

      // TODO: Store configuration in database
      // For now, suggest setting environment variables
      return NextResponse.json({
        success: true,
        message: 'Configuration validated. Please set environment variables: ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, ONESIGNAL_USER_AUTH_KEY'
      })

    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to validate OneSignal configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating OneSignal config:', error)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
} 