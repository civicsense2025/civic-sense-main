import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Check if user is authenticated with Google Classroom
export async function GET(request: NextRequest) {
  try {
    // Check if user has valid access token
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('test_access_token')?.value

    if (!accessToken) {
      // Not authenticated - return 401 with OAuth URL for authentication
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({
          error: 'Missing Google OAuth credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local'
        }, { status: 500 })
      }

      // Generate OAuth URL for Google Classroom
      const scopes = [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const redirectUri = `${baseUrl}/api/integrations/classroom/oauth/callback`
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: 'test-connection'
      })}`

      return NextResponse.json({
        authenticated: false,
        authUrl,
        message: 'Authentication required. Use authUrl to authenticate with Google Classroom.'
      }, { status: 401 })
    }

    // Verify token is still valid by making a simple API call
    try {
      const testResponse = await fetch('https://classroom.googleapis.com/v1/courses?pageSize=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!testResponse.ok) {
        // Token is invalid/expired - clear it and return 401
        const response = NextResponse.json({
          authenticated: false,
          error: 'Token expired or invalid',
          message: 'Please re-authenticate with Google Classroom'
        }, { status: 401 })
        
        // Clear the invalid token
        response.cookies.delete('test_access_token')
        return response
      }

      // Token is valid
      return NextResponse.json({
        authenticated: true,
        message: 'Already authenticated with Google Classroom'
      })

    } catch (error) {
      console.error('Error verifying Google token:', error)
      return NextResponse.json({
        authenticated: false,
        error: 'Token verification failed',
        message: 'Please re-authenticate with Google Classroom'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Error in test-auth:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Authentication check failed'
    }, { status: 500 })
  }
} 