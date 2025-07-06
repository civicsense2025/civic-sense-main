import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AppleIAPService, APPLE_IAP_PRODUCTS } from '@/lib/apple-iap'
import { debug } from '@/lib/debug-config'

// Apple IAP validation endpoint
export async function POST(request: NextRequest) {
  try {
    const { receiptData, productId } = await request.json()

    // Validate input
    if (!receiptData || !productId) {
      return NextResponse.json(
        { error: 'Missing receiptData or productId' },
        { status: 400 }
      )
    }

    // Validate that this is a known product
    if (!Object.values(APPLE_IAP_PRODUCTS).includes(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      debug.error('apple-iap', 'Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    debug.log('apple-iap', `Processing IAP validation for user ${user.id}, product: ${productId}`)

    // Process the purchase with Apple IAP service
    const result = await AppleIAPService.processPurchase(user.id, receiptData, productId)

    if (!result.success) {
      debug.error('apple-iap', 'Purchase processing failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to process purchase' },
        { status: 400 }
      )
    }

    debug.log('apple-iap', `Successfully processed IAP purchase for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Purchase validated and access granted',
      subscription: result.subscription
    })

  } catch (error) {
    debug.error('apple-iap', 'API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle restore purchases
export async function PUT(request: NextRequest) {
  try {
    const { receiptData } = await request.json()

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Missing receiptData' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    debug.log('apple-iap', `Restoring purchases for user ${user.id}`)

    // Restore purchases with Apple IAP service
    const result = await AppleIAPService.restorePurchases(user.id, receiptData)

    if (!result.success) {
      debug.error('apple-iap', 'Purchase restoration failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to restore purchases' },
        { status: 400 }
      )
    }

    debug.log('apple-iap', `Successfully restored ${result.restoredProducts.length} products for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: `Restored ${result.restoredProducts.length} purchase(s)`,
      restoredProducts: result.restoredProducts
    })

  } catch (error) {
    debug.error('apple-iap', 'Restore API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 