import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { amount, successUrl, cancelUrl } = await request.json()

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

    console.log('Creating donation session for amount:', donationAmount / 100)

    // Create Stripe checkout session for donation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CivicSense Donation',
              description: 'Supporting civic education and democracy awareness',
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
        type: 'donation',
        amount: donationAmount.toString(),
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