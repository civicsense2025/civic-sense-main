/**
 * Unified Google OAuth Callback Handler
 * 
 * Processes OAuth callback for both Google Calendar and Classroom integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateParam = searchParams.get('state')

    // Parse state parameter
    let state: { service?: string; returnUrl?: string } = {}
    try {
      if (stateParam) {
        state = JSON.parse(stateParam)
      }
    } catch (error) {
      console.warn('Failed to parse state parameter:', error)
    }

    const returnUrl = state.returnUrl || '/test-calendar-sync'
    const service = state.service || 'calendar'

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL(`${returnUrl}?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL(`${returnUrl}?error=no_authorization_code`, request.url))
    }

    // Exchange code for tokens
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/integrations/google/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(new URL(`${returnUrl}?error=token_exchange_failed`, request.url))
    }

    const tokens = await tokenResponse.json()

    // Test the appropriate API based on service
    let testApiSuccess = false
    try {
      if (service === 'calendar') {
        // Test Calendar API
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        })
        testApiSuccess = calendarResponse.ok
      } else if (service === 'classroom') {
        // Test Classroom API
        const classroomResponse = await fetch('https://classroom.googleapis.com/v1/courses', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        })
        testApiSuccess = classroomResponse.ok
      } else {
        // Test both APIs for 'both' service
        const [calendarResponse, classroomResponse] = await Promise.all([
          fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }),
          fetch('https://classroom.googleapis.com/v1/courses', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          })
        ])
        testApiSuccess = calendarResponse.ok || classroomResponse.ok
      }
    } catch (error) {
      console.error('API test failed:', error)
      return NextResponse.redirect(new URL(`${returnUrl}?error=api_test_failed`, request.url))
    }

    if (!testApiSuccess) {
      return NextResponse.redirect(new URL(`${returnUrl}?error=api_access_denied`, request.url))
    }

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    let userInfo = null
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json()
    }

    // Store tokens in database for the authenticated user
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (user && !authError) {
        // Save integration to user_integrations table
        const { error: integrationError } = await supabase
          .from('user_integrations')
          .upsert({
            user_id: user.id,
            provider: 'google',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_in 
              ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              : null,
            scopes: service === 'calendar' 
              ? ['calendar']
              : service === 'classroom' 
              ? ['classroom']
              : ['calendar', 'classroom'],
            provider_user_id: userInfo?.id,
            provider_email: userInfo?.email,
            provider_name: userInfo?.name,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,provider'
          })

        if (integrationError) {
          console.error('Failed to save integration:', integrationError)
        } else {
          console.log(`✅ Google ${service} integration saved for user ${user.id}`)
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue anyway - we'll still store tokens in cookies as fallback
    }

    // Set cookies for immediate access (fallback if database storage fails)
    const response = NextResponse.redirect(new URL(`${returnUrl}?google_auth=success&service=${service}`, request.url))
    
    // Store access token in httpOnly cookie
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in || 3600, // Use actual expiry or default to 1 hour
      sameSite: 'lax'
    })

    // Store refresh token if available
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax'
      })
    }

    // Store service type for reference
    response.cookies.set('google_service', service, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
      sameSite: 'lax'
    })

    console.log(`✅ Google ${service} authentication successful for ${userInfo?.email || 'unknown user'}`)

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    const returnUrl = '/test-calendar-sync'
    return NextResponse.redirect(new URL(`${returnUrl}?error=callback_failed`, request.url))
  }
} 