import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, fromTier, toTier, successUrl, cancelUrl } = await request.json()

    if (!userId || !fromTier || !toTier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user's current subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('external_subscription_id, subscription_tier, billing_cycle')
      .eq('user_id', userId)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Calculate upgrade price (lifetime - remaining subscription value)
    let upgradePrice = 5000 // $50.00 in cents (lifetime price)
    
    if (subscription.billing_cycle === 'yearly' && subscription.external_subscription_id) {
      try {
        // Get the Stripe subscription to calculate prorated amount
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.external_subscription_id)
        const currentPeriodEnd = (stripeSubscription as any).current_period_end
        const currentPeriodStart = (stripeSubscription as any).current_period_start
        const now = Math.floor(Date.now() / 1000)
        
        // Calculate remaining time in subscription
        const totalPeriod = currentPeriodEnd - currentPeriodStart
        const remainingTime = currentPeriodEnd - now
        const remainingRatio = Math.max(0, remainingTime / totalPeriod)
        
        // Calculate credit for remaining subscription (assuming $50/year)
        const yearlyPrice = 5000 // $50 in cents
        const creditAmount = Math.floor(yearlyPrice * remainingRatio)
        
        // Upgrade price is lifetime price minus credit
        upgradePrice = Math.max(1000, upgradePrice - creditAmount) // Minimum $10
        
        console.log(`Upgrade calculation: Lifetime $50, Credit $${creditAmount/100}, Final $${upgradePrice/100}`)
      } catch (error) {
        console.warn('Could not calculate prorated upgrade, using full price:', error)
      }
    }

    // Get or create Stripe customer
    let customerId: string | undefined

    if (subscription.external_subscription_id) {
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(subscription.external_subscription_id)
        customerId = existingSubscription.customer as string
      } catch (error) {
        console.warn('Could not retrieve existing subscription:', error)
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: `user-${userId}@example.com`,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id
    }

    // Create checkout session for upgrade
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        product_type: 'premium_lifetime_upgrade',
        from_tier: fromTier,
        original_subscription_id: subscription.external_subscription_id || '',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CivicSense Premium - Lifetime Upgrade',
              description: `Upgrade from ${fromTier} to lifetime access`,
            },
            unit_amount: upgradePrice,
          },
          quantity: 1,
        },
      ],
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating upgrade session:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 