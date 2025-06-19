import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to check Google Classroom API authentication setup
export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
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
      success: true,
      authUrl,
      message: 'Ready to authenticate with Google Classroom'
    })
  } catch (error) {
    console.error('Error in test-auth:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Authentication setup failed'
    }, { status: 500 })
  }
} 