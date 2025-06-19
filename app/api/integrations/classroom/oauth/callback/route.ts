import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

// Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('OAuth error:', error)
      return redirect(`/test-classroom-setup?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return redirect('/test-classroom-setup?error=no_authorization_code')
    }

    // Exchange code for tokens
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/integrations/classroom/oauth/callback`

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
      return redirect('/test-classroom-setup?error=token_exchange_failed')
    }

    const tokens = await tokenResponse.json()

    // Test the API with the access token
    const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!coursesResponse.ok) {
      const errorText = await coursesResponse.text()
      console.error('Courses API failed:', errorText)
      return redirect('/test-classroom-setup?error=api_test_failed')
    }

    const coursesData = await coursesResponse.json()
    console.log('Successfully connected to Google Classroom:', {
      coursesFound: coursesData.courses?.length || 0
    })

    // Store tokens temporarily for the test (in production, store securely)
    const response = NextResponse.redirect(new URL('/test-classroom-setup?success=true', request.url))
    response.cookies.set('test_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirect(`/test-classroom-setup?error=${encodeURIComponent('callback_failed')}`)
  }
} 