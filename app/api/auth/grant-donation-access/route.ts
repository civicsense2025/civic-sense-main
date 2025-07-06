import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const { userId, userEmail, emailConfirmed } = await request.json()

  if (!userId || !userEmail) {
    return NextResponse.json(
      { error: 'Missing userId or userEmail' },
      { status: 400 }
    )
  }

  if (!emailConfirmed) {
    return NextResponse.json(
      { message: 'Email not confirmed yet' },
      { status: 200 }
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

    // Search for Stripe payments by this email
    const donations = await findDonationsByEmail(userEmail)

    if (donations.length === 0) {
      return NextResponse.json(
        { message: 'No qualifying donations found for this email' },
        { status: 200 }
      )
    }

    // Find the best donation (highest amount or most recent)
    const bestDonation = donations.reduce((best, current) => {
      // Prefer by amount first, then by recency
      if (current.amount_total! > best.amount_total!) return current
      if (current.amount_total === best.amount_total && current.created > best.created) return current
      return best
    })

    // Determine access tier based on donation amount
    const donationAmount = bestDonation.amount_total! / 100 // Convert from cents
    let accessTier: 'annual' | 'lifetime' | null = null
    
    if (donationAmount >= 50) {
      accessTier = 'lifetime'
    } else if (donationAmount >= 25) {
      accessTier = 'annual'
    }

    if (!accessTier) {
      return NextResponse.json(
        { message: 'Donation amount does not qualify for premium access' },
        { status: 200 }
      )
    }

    // Calculate subscription end date for annual access
    let subscriptionEndDate = null
    if (accessTier === 'annual') {
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)
      subscriptionEndDate = endDate.toISOString()
    }

    // Create subscription record based on donation
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_tier: 'premium',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate,
        payment_provider: 'stripe',
        external_subscription_id: `donation_${bestDonation.id}`,
        last_payment_date: new Date(bestDonation.created * 1000).toISOString(),
        next_billing_date: null, // No recurring billing for donations
        billing_cycle: accessTier,
        amount_cents: bestDonation.amount_total!,
        currency: bestDonation.currency || 'usd',
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating subscription from donation:', error)
      return NextResponse.json(
        { error: 'Failed to grant access' },
        { status: 500 }
      )
    }

    console.log(`✅ Premium ${accessTier} access granted to ${userEmail} based on $${donationAmount} donation`)

    return NextResponse.json({
      message: `Premium ${accessTier} access granted based on your $${donationAmount} donation`,
      accessTier,
      donationAmount
    })

  } catch (error) {
    console.error('Error processing donation access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual testing
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

    // Search for Stripe payments by this email
    const donations = await findDonationsByEmail(userEmail)

    if (donations.length === 0) {
      return NextResponse.json(
        { message: 'No qualifying donations found for this email' },
        { status: 200 }
      )
    }

    // Find the best donation (highest amount or most recent)
    const bestDonation = donations.reduce((best, current) => {
      // Prefer by amount first, then by recency
      if (current.amount_total! > best.amount_total!) return current
      if (current.amount_total === best.amount_total && current.created > best.created) return current
      return best
    })

    // Determine access tier based on donation amount
    const donationAmount = bestDonation.amount_total! / 100 // Convert from cents
    let accessTier: 'annual' | 'lifetime' | null = null
    
    if (donationAmount >= 50) {
      accessTier = 'lifetime'
    } else if (donationAmount >= 25) {
      accessTier = 'annual'
    }

    if (!accessTier) {
      return NextResponse.json(
        { message: 'Donation amount does not qualify for premium access' },
        { status: 200 }
      )
    }

    // Calculate subscription end date for annual access
    let subscriptionEndDate = null
    if (accessTier === 'annual') {
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)
      subscriptionEndDate = endDate.toISOString()
    }

    // Create subscription record based on donation
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_tier: 'premium',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate,
        payment_provider: 'stripe',
        external_subscription_id: `donation_${bestDonation.id}`,
        last_payment_date: new Date(bestDonation.created * 1000).toISOString(),
        next_billing_date: null, // No recurring billing for donations
        billing_cycle: accessTier,
        amount_cents: bestDonation.amount_total!,
        currency: bestDonation.currency || 'usd',
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating subscription from donation:', error)
      return NextResponse.json(
        { error: 'Failed to grant access' },
        { status: 500 }
      )
    }

    console.log(`✅ Premium ${accessTier} access granted to ${userEmail} based on $${donationAmount} donation`)

    return NextResponse.json({
      message: `Premium ${accessTier} access granted based on your $${donationAmount} donation`,
      accessTier,
      donationAmount
    })

  } catch (error) {
    console.error('Error processing donation access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Search for Stripe checkout sessions by customer email
 */
async function findDonationsByEmail(email: string): Promise<Stripe.Checkout.Session[]> {
  try {
    const sessions: Stripe.Checkout.Session[] = []
    
    // Search checkout sessions by customer email
    const sessionList = await stripe.checkout.sessions.list({
      limit: 100, // Max allowed by Stripe
      expand: ['data.customer']
    })

    for (const session of sessionList.data) {
      // Check if this session matches our criteria
      if (
        session.payment_status === 'paid' &&
        session.metadata?.product_type === 'donation' &&
        session.customer_details?.email === email &&
        session.amount_total &&
        session.amount_total >= 2500 // Minimum $25 for premium access
      ) {
        sessions.push(session)
      }
    }

    // Also search by customer records if we have them
    const customers = await stripe.customers.list({
      email: email,
      limit: 10
    })

    for (const customer of customers.data) {
      const customerSessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 50
      })

      for (const session of customerSessions.data) {
        if (
          session.payment_status === 'paid' &&
          session.metadata?.product_type === 'donation' &&
          session.amount_total &&
          session.amount_total >= 2500 &&
          !sessions.find(s => s.id === session.id) // Avoid duplicates
        ) {
          sessions.push(session)
        }
      }
    }

    console.log(`📧 Found ${sessions.length} qualifying donations for ${email}`)
    return sessions

  } catch (error) {
    console.error('Error searching for donations by email:', error)
    return []
  }
} 