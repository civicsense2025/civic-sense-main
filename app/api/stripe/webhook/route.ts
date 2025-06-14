import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

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
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
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
  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  // The subscription will be handled by the subscription.created event
  console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Determine subscription tier based on price ID
  const priceId = subscription.items.data[0]?.price.id
  let tier: 'premium' | 'pro' = 'premium'
  
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID) {
    tier = 'pro'
  }

  // Determine billing cycle
  const billingCycle = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

  // Update or create subscription record
  const subscriptionData = {
    user_id: userId,
    subscription_tier: tier,
    subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
    subscription_start_date: new Date(subscription.created * 1000).toISOString(),
    subscription_end_date: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
    payment_provider: 'stripe',
    external_subscription_id: subscription.id,
    last_payment_date: subscription.latest_invoice ? new Date().toISOString() : null,
    next_billing_date: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
    billing_cycle: billingCycle,
    amount_cents: subscription.items.data[0]?.price.unit_amount || 0,
    currency: subscription.items.data[0]?.price.currency || 'usd',
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${tier}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Update subscription status to cancelled
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
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

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id
  
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Update last payment date
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      last_payment_date: new Date().toISOString(),
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('external_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment success:', error)
  } else {
    console.log(`Payment succeeded for user ${userId}`)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id
  
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Note: Don't immediately cancel on payment failure - Stripe will retry
  console.log(`Payment failed for user ${userId}`)
} 