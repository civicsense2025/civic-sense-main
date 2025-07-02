/**
 * Unified Google OAuth Authentication Route
 * 
 * Handles OAuth authentication for both Google Classroom and Google Calendar
 * with appropriate scopes for each service.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service') // 'calendar', 'classroom', or 'both'
    const returnUrl = searchParams.get('returnUrl') || '/test-calendar-sync'

    // Check if user already has valid access token
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_access_token')?.value

    if (accessToken) {
      // Verify token is still valid by testing appropriate API
      const testEndpoint = service === 'calendar' 
        ? 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
        : 'https://classroom.googleapis.com/v1/courses?pageSize=1'

      try {
        const testResponse = await fetch(testEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (testResponse.ok) {
          // Token is valid, redirect back to return URL
          return NextResponse.redirect(new URL(`${returnUrl}?google_auth=success`, request.url))
        }
      } catch (error) {
        console.log('Token validation failed, will re-authenticate')
      }
    }

    // Need to authenticate - check for required credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Missing Google OAuth credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local'
      }, { status: 500 })
    }

    // Define scopes based on service
    let scopes: string[]
    
    switch (service) {
      case 'calendar':
        scopes = [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
        break
      case 'classroom':
        scopes = [
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.rosters.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
        break
      case 'both':
      default:
        scopes = [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.rosters.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
        break
    }

    // Generate OAuth URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/integrations/google/callback`
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ service, returnUrl })
    })}`

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Error in Google auth:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 