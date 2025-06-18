import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Redeem a gift code
export async function POST(request: NextRequest) {
  try {
    const { redemptionCode, recipientUserId } = await request.json()

    if (!redemptionCode || !recipientUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate redemption code format
    if (!redemptionCode.startsWith('CIVIC-') || redemptionCode.length !== 14) {
      return NextResponse.json(
        { error: 'Invalid redemption code format' },
        { status: 400 }
      )
    }

    // Redeem gift code using database function
    const { data: result, error } = await supabase
      .rpc('redeem_gift_code', {
        p_redemption_code: redemptionCode,
        p_recipient_user_id: recipientUserId
      })

    if (error) {
      console.error('Error redeeming gift code:', error)
      return NextResponse.json(
        { error: 'Failed to redeem gift code' },
        { status: 500 }
      )
    }

    const redemptionResult = result?.[0]
    
    if (!redemptionResult?.success) {
      return NextResponse.json(
        { error: redemptionResult?.error_message || 'Failed to redeem gift' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accessType: redemptionResult.access_type,
      message: `${redemptionResult.access_type === 'lifetime' ? 'Lifetime' : 'Annual'} access granted successfully!`
    })

  } catch (error) {
    console.error('Error in redeem gift API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Check if a gift code is valid (without redeeming)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redemptionCode = searchParams.get('code')

  if (!redemptionCode) {
    return NextResponse.json(
      { error: 'Missing redemption code' },
      { status: 400 }
    )
  }

  try {
    // Check if redemption code exists and is valid
    const { data: redemption, error } = await supabase
      .from('gift_redemptions')
      .select(`
        id,
        access_type,
        gift_message,
        redemption_status,
        expires_at,
        donor_user_id
      `)
      .eq('redemption_code', redemptionCode)
      .eq('redemption_status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !redemption) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Invalid or expired redemption code'
      })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      accessType: redemption.access_type,
      giftMessage: redemption.gift_message,
      expiresAt: redemption.expires_at
    })

  } catch (error) {
    console.error('Error checking gift code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 