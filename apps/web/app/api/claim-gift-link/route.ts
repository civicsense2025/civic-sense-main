import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'

// GET - Get shareable link info (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const linkCode = searchParams.get('linkCode')

  if (!linkCode) {
    return NextResponse.json(
      { error: 'Missing linkCode parameter' },
      { status: 400 }
    )
  }

  try {
    // Get shareable link info using database function
    const { data: linkInfo, error } = await supabase
      .rpc('get_shareable_link_info', { p_link_code: linkCode })

    if (error) {
      console.error('Error fetching link info:', error)
      return NextResponse.json(
        { error: 'Failed to fetch link info' },
        { status: 500 }
      )
    }

    const link = linkInfo?.[0]
    
    if (!link) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Gift link not found'
      })
    }

    return NextResponse.json({
      success: true,
      valid: link.is_valid,
      linkInfo: {
        title: link.title,
        message: link.message,
        accessType: link.access_type,
        availableCredits: link.available_credits,
        totalCredits: link.total_credits,
        expiresAt: link.expires_at
      }
    })

  } catch (error) {
    console.error('Error in claim gift link GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Claim access from shareable link
export async function POST(request: NextRequest) {
  try {
    const { 
      linkCode, 
      claimerEmail, 
      claimerUserId 
    } = await request.json()

    if (!linkCode || !claimerEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(claimerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get IP address and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Claim from shareable link using database function
    const { data: result, error } = await supabase
      .rpc('claim_shareable_gift_link', {
        p_link_code: linkCode,
        p_claimer_email: claimerEmail,
        p_claimer_user_id: claimerUserId || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      })

    if (error) {
      console.error('Error claiming gift link:', error)
      return NextResponse.json(
        { error: 'Failed to claim gift link' },
        { status: 500 }
      )
    }

    const claimResult = result?.[0]
    
    if (!claimResult?.success) {
      return NextResponse.json(
        { error: claimResult?.message || 'Failed to claim gift' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accessType: claimResult.access_type,
      message: claimResult.message,
      subscriptionCreated: claimResult.subscription_created
    })

  } catch (error) {
    console.error('Error in claim gift link POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 