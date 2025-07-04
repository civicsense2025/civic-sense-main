import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Get user's shareable gift links
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
    // Get user's shareable links using database function
    const { data: shareableLinks, error } = await supabase
      .rpc('get_user_shareable_links', { p_user_id: userId })

    if (error) {
      console.error('Error fetching shareable links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shareable links' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareableLinks: shareableLinks || []
    })

  } catch (error) {
    console.error('Error in shareable links GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new shareable gift link
export async function POST(request: NextRequest) {
  try {
    const { 
      donorUserId, 
      accessType, 
      creditsToUse, 
      title, 
      message, 
      customSlug 
    } = await request.json()

    if (!donorUserId || !accessType || !creditsToUse) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Validate credits to use
    if (creditsToUse <= 0 || creditsToUse > 100) {
      return NextResponse.json(
        { error: 'Invalid credits amount (must be between 1 and 100)' },
        { status: 400 }
      )
    }

    // Create shareable link using database function
    const { data: result, error } = await supabase
      .rpc('create_shareable_gift_link', {
        p_donor_user_id: donorUserId,
        p_access_type: accessType,
        p_credits_to_use: creditsToUse,
        p_title: title || null,
        p_message: message || null,
        p_custom_slug: customSlug || null
      })

    if (error) {
      console.error('Error creating shareable link:', error)
      return NextResponse.json(
        { error: 'Failed to create shareable link' },
        { status: 500 }
      )
    }

    const linkResult = result?.[0]
    
    if (!linkResult?.success) {
      return NextResponse.json(
        { error: linkResult?.error_message || 'Failed to create shareable link' },
        { status: 400 }
      )
    }

    // Generate the full shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const shareableUrl = `${baseUrl}/gift/${linkResult.link_code}`

    return NextResponse.json({
      success: true,
      linkId: linkResult.link_id,
      linkCode: linkResult.link_code,
      shareableUrl,
      message: 'Shareable gift link created successfully'
    })

  } catch (error) {
    console.error('Error in shareable links POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 