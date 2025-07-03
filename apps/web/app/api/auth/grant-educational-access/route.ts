import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Server-side educational access functions
const serverEducationalAccess = {
  async processNewUserEducationalAccess(userId: string, userEmail: string, emailConfirmed: boolean = false): Promise<void> {
    
    if (!emailConfirmed) {
      console.log(`🎓 Educational access: Email not confirmed for ${userEmail}, skipping check`)
      return
    }

    // Check if email is from educational institution
    if (!userEmail.toLowerCase().includes('.edu')) {
      console.log(`🎓 Educational access: ${userEmail} is not from .edu domain, skipping`)
      return
    }

    console.log(`🎓 Educational access: Processing ${userEmail} for user ${userId}`)

    try {
      // Check if user already has active subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('subscription_status, subscription_tier')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single()

      if (existingSubscription) {
        console.log(`🎓 Educational access: User ${userId} already has active ${existingSubscription.subscription_tier} subscription`)
        return
      }

      // Grant educational premium access
      const { error: upsertError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          subscription_tier: 'premium',
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: null, // Educational access doesn't expire
          payment_provider: 'educational',
          external_subscription_id: `edu_${userId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        })

      if (upsertError) {
        console.error('🎓 Educational access: Error granting premium access:', upsertError)
        throw upsertError
      }

      console.log(`✅ Educational access: Successfully granted premium access to ${userEmail}`)
    } catch (error) {
      console.error('🎓 Educational access: Error processing educational access:', error)
      throw error
    }
  }
}

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

    // Check if user already has active premium subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_status')
      .eq('user_id', userId)
      .eq('subscription_status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'User already has active premium subscription' },
        { status: 200 }
      )
    }

    // Process educational access
    await serverEducationalAccess.processNewUserEducationalAccess(userId, userEmail, emailConfirmed)

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
    // Check if user already has active premium subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_status')
      .eq('user_id', userId)
      .eq('subscription_status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'User already has active premium subscription' },
        { status: 200 }
      )
    }

    // For GET requests, assume email is confirmed (manual trigger)
    await serverEducationalAccess.processNewUserEducationalAccess(userId, userEmail, true)
    
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