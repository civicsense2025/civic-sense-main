import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { educationalAccess } from '@/lib/premium'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, emailConfirmed } = await request.json()

    // Validate required parameters
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing userId or userEmail' },
        { status: 400 }
      )
    }

    // Only process if email is confirmed
    if (!emailConfirmed) {
      return NextResponse.json(
        { message: 'Email not confirmed, skipping educational access check' },
        { status: 200 }
      )
    }

    // Verify the user exists in auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify email matches
    if (user.email !== userEmail) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 400 }
      )
    }

    // Process educational access
    await educationalAccess.processNewUserEducationalAccess(userId, userEmail, emailConfirmed)

    return NextResponse.json(
      { message: 'Educational access processed successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in grant-educational-access API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for manual triggers or testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const userEmail = searchParams.get('userEmail')
  
  if (!userId || !userEmail) {
    return NextResponse.json(
      { error: 'Missing userId or userEmail parameters' },
      { status: 400 }
    )
  }

  try {
    // For GET requests, assume email is confirmed (manual trigger)
    await educationalAccess.processNewUserEducationalAccess(userId, userEmail, true)
    
    return NextResponse.json(
      { message: 'Educational access processed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in grant-educational-access GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 