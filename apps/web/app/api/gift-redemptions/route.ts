import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Create a gift redemption
export async function POST(request: NextRequest) {
  try {
    const { donorUserId, recipientEmail, accessType, giftMessage } = await request.json()

    if (!donorUserId || !recipientEmail || !accessType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate access type
    if (!['annual', 'lifetime'].includes(accessType)) {
      return NextResponse.json(
        { error: 'Invalid access type' },
        { status: 400 }
      )
    }

    // Create gift redemption using database function
    const { data: result, error } = await supabase
      .rpc('create_gift_redemption', {
        p_donor_user_id: donorUserId,
        p_recipient_email: recipientEmail,
        p_access_type: accessType,
        p_gift_message: giftMessage || null
      })

    if (error) {
      console.error('Error creating gift redemption:', error)
      return NextResponse.json(
        { error: 'Failed to create gift redemption' },
        { status: 500 }
      )
    }

    const redemptionResult = result?.[0]
    
    if (!redemptionResult?.success) {
      return NextResponse.json(
        { error: redemptionResult?.error_message || 'Failed to create gift' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      redemptionId: redemptionResult.redemption_id,
      redemptionCode: redemptionResult.redemption_code,
      message: 'Gift created successfully'
    })

  } catch (error) {
    console.error('Error in gift redemptions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get gift redemptions for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') // 'sent' or 'received'

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('gift_redemptions')
      .select(`
        id,
        recipient_email,
        access_type,
        gift_message,
        redemption_status,
        redemption_code,
        expires_at,
        claimed_at,
        created_at
      `)

    if (type === 'sent') {
      query = query.eq('donor_user_id', userId)
    } else if (type === 'received') {
      query = query.eq('recipient_user_id', userId)
    } else {
      // Default to sent gifts
      query = query.eq('donor_user_id', userId)
    }

    const { data: redemptions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching gift redemptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gift redemptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      redemptions: redemptions || []
    })

  } catch (error) {
    console.error('Error in gift redemptions GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 