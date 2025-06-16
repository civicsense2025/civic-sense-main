import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      successUrl, 
      cancelUrl, 
      userId,
      accessTier 
    } = await request.json()

    if (!amount || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate amount (minimum $5, maximum $10,000)
    const donationAmount = parseInt(amount)
    if (isNaN(donationAmount) || donationAmount < 500 || donationAmount > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between $5 and $10,000' },
        { status: 400 }
      )
    }

    // Determine if this donation qualifies for premium access
    const qualifiesForAnnual = donationAmount >= 2500 // $25+
    const qualifiesForLifetime = donationAmount >= 5000 // $50+
    
    // Determine access tier based on donation amount if not explicitly provided
    let effectiveAccessTier = accessTier
    if (!effectiveAccessTier) {
      if (qualifiesForLifetime) {
        effectiveAccessTier = 'lifetime'
      } else if (qualifiesForAnnual) {
        effectiveAccessTier = 'annual'
      } else {
        effectiveAccessTier = 'none'
      }
    }

    console.log(`Creating donation session for amount: $${donationAmount / 100} with access tier: ${effectiveAccessTier}`)

    // Determine product name based on access tier
    let productName = 'CivicSense Donation'
    let productDescription = 'Supporting civic education and democracy awareness'
    
    if (effectiveAccessTier === 'lifetime') {
      productName = 'CivicSense Donation + Lifetime Access'
      productDescription = 'Supporting civic education with lifetime access to all quizzes and premium features'
    } else if (effectiveAccessTier === 'annual') {
      productName = 'CivicSense Donation + Annual Access'
      productDescription = 'Supporting civic education with 1 year access to all quizzes'
    }

    // Create Stripe checkout session for donation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
              images: ['https://civicsense.app/logo.png'], // Add your logo URL
            },
            unit_amount: donationAmount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product_type: 'donation',
        amount: donationAmount.toString(),
        access_tier: effectiveAccessTier,
        user_id: userId || '',
      },
      custom_text: {
        submit: {
          message: 'Thank you for supporting civic education! Your contribution helps us build a more informed society.',
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating donation session:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 