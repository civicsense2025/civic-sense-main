import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = await request.json()

    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('Received priceId:', priceId)
    console.log('Environment yearly price ID:', process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID)
    console.log('Environment lifetime price ID:', process.env.NEXT_PUBLIC_STRIPE_PREMIUM_LIFETIME_PRICE_ID)

    // Get user details from Supabase (simplified for testing)
    const userEmail = `user-${userId}@example.com` // Fallback for testing

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('external_subscription_id')
      .eq('user_id', userId)
      .single()

    let customerId: string | undefined

    if (subscription?.external_subscription_id) {
      // Extract customer ID from existing subscription
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(subscription.external_subscription_id)
        customerId = existingSubscription.customer as string
      } catch (error) {
        console.warn('Could not retrieve existing subscription:', error)
      }
    }

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id
    }

    // Determine pricing model and session configuration
    let sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
      },
    }

    // Handle different pricing models
    if (priceId === 'premium_lifetime' || priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_LIFETIME_PRICE_ID) {
      // Lifetime access - one-time payment
      sessionConfig.mode = 'payment'
      sessionConfig.metadata.product_type = 'premium_lifetime'
      
      if (priceId === 'premium_lifetime') {
        // Use inline pricing for testing
        sessionConfig.line_items = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'CivicSense Premium - Lifetime Access',
                description: 'One-time payment for lifetime access to all premium features',
              },
              unit_amount: 2500, // $25.00 in cents
            },
            quantity: 1,
          },
        ]
      } else {
        // Use actual Stripe price ID
        sessionConfig.line_items = [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      }
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      // Yearly subscription - recurring payment
      sessionConfig.mode = 'subscription'
      sessionConfig.metadata.product_type = 'premium_yearly'
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    } else {
      // Fallback to inline pricing for unknown price IDs
      sessionConfig.mode = 'payment'
      sessionConfig.metadata.product_type = 'premium_lifetime'
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CivicSense Premium - Lifetime Access',
              description: 'One-time payment for lifetime access to all premium features',
            },
            unit_amount: 2500, // $25.00 in cents
          },
          quantity: 1,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 