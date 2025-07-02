import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'

// GET - Get user's gift credits summary
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    )
  }

  try {
    // Get user's gift credits summary
    const { data: giftCredits, error } = await supabase
      .rpc('get_user_gift_credits', { p_user_id: userId })

    if (error) {
      console.error('Error fetching gift credits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gift credits' },
        { status: 500 }
      )
    }

    // Transform the data into a more usable format
    const creditsMap = {
      annual: { total: 0, used: 0, available: 0, totalDonation: 0 },
      lifetime: { total: 0, used: 0, available: 0, totalDonation: 0 }
    }

    giftCredits?.forEach((credit: any) => {
      const type = credit.credit_type as 'annual' | 'lifetime'
      creditsMap[type] = {
        total: credit.total_credits || 0,
        used: credit.used_credits || 0,
        available: credit.available_credits || 0,
        totalDonation: credit.total_donation_amount || 0
      }
    })

    return NextResponse.json({
      success: true,
      giftCredits: creditsMap
    })

  } catch (error) {
    console.error('Error in gift credits API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Process donation and create gift credits
export async function POST(request: NextRequest) {
  try {
    const { userId, donationAmount, stripeSessionId } = await request.json()

    if (!userId || !donationAmount || !stripeSessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Process donation and create gift credits
    const { data: result, error } = await supabase
      .rpc('process_donation_gift_credits', {
        p_user_id: userId,
        p_donation_amount_cents: donationAmount,
        p_stripe_session_id: stripeSessionId
      })

    if (error) {
      console.error('Error processing donation gift credits:', error)
      return NextResponse.json(
        { error: 'Failed to process gift credits' },
        { status: 500 }
      )
    }

    const giftResult = result?.[0]
    
    return NextResponse.json({
      success: true,
      donorAccessType: giftResult?.donor_access_type || 'none',
      annualCreditsGranted: giftResult?.annual_credits_granted || 0,
      lifetimeCreditsGranted: giftResult?.lifetime_credits_granted || 0
    })

  } catch (error) {
    console.error('Error in gift credits POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 