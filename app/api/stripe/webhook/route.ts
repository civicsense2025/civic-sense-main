import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const productType = session.metadata?.product_type
  
  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  if (session.payment_status === 'paid') {
    if (productType === 'premium_lifetime') {
      // Create lifetime premium subscription record
      const subscriptionData = {
        user_id: userId,
        subscription_tier: 'premium',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null, // null = lifetime
        payment_provider: 'stripe',
        external_subscription_id: session.id, // Use session ID for one-time payments
        last_payment_date: new Date().toISOString(),
        next_billing_date: null, // No recurring billing
        billing_cycle: 'lifetime',
        amount_cents: session.amount_total || 5000, // Updated to $50
        currency: session.currency || 'usd',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })

      if (error) {
        console.error('Error creating premium lifetime subscription:', error)
      } else {
        console.log(`Premium lifetime access granted to user ${userId}`)
      }
    } else if (productType === 'premium_lifetime_upgrade') {
      // Handle upgrade from existing subscription to lifetime
      const originalSubscriptionId = session.metadata?.original_subscription_id
      
      // Cancel the original subscription if it exists
      if (originalSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(originalSubscriptionId)
          console.log(`Cancelled original subscription ${originalSubscriptionId} for upgrade`)
        } catch (error) {
          console.warn('Could not cancel original subscription:', error)
        }
      }

      // Create lifetime subscription record
      const subscriptionData = {
        user_id: userId,
        subscription_tier: 'premium',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null, // null = lifetime
        payment_provider: 'stripe',
        external_subscription_id: session.id,
        last_payment_date: new Date().toISOString(),
        next_billing_date: null,
        billing_cycle: 'lifetime',
        amount_cents: session.amount_total || 5000,
        currency: session.currency || 'usd',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' })

      if (error) {
        console.error('Error upgrading to lifetime subscription:', error)
      } else {
        console.log(`User ${userId} upgraded to lifetime access`)
      }
    } else if (productType === 'premium_yearly') {
      // For yearly subscriptions, the actual subscription will be handled in subscription.created
      console.log(`Yearly subscription checkout completed for user ${userId}, waiting for subscription.created event`)
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // For one-time payments, the main logic is handled in checkout.session.completed
  // This is just for logging
  console.log(`Payment succeeded: ${paymentIntent.id}`)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  
  if (!userId) {
    console.error('No user_id found in customer metadata for subscription:', subscription.id)
    return
  }

  // Create yearly subscription record
  const subscriptionData = {
    user_id: userId,
    subscription_tier: 'premium',
    subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
    subscription_start_date: new Date((subscription as any).current_period_start * 1000).toISOString(),
    subscription_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
    payment_provider: 'stripe',
    external_subscription_id: subscription.id,
    last_payment_date: new Date().toISOString(),
    next_billing_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
    billing_cycle: 'yearly',
    amount_cents: subscription.items.data[0]?.price.unit_amount || 5000, // $50 default
    currency: subscription.currency || 'usd',
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.error('Error creating yearly subscription:', error)
  } else {
    console.log(`Yearly premium subscription created for user ${userId}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  
  if (!userId) {
    console.error('No user_id found in customer metadata for subscription:', subscription.id)
    return
  }

  // Update subscription record
  const subscriptionData = {
    subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
    subscription_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
    next_billing_date: subscription.status === 'active' ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update(subscriptionData)
    .eq('user_id', userId)
    .eq('external_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  
  if (!userId) {
    console.error('No user_id found in customer metadata for subscription:', subscription.id)
    return
  }

  // Mark subscription as cancelled
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ 
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('external_subscription_id', subscription.id)

  if (error) {
    console.error('Error cancelling subscription:', error)
  } else {
    console.log(`Subscription cancelled for user ${userId}`)
  }
} 