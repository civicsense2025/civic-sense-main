
// app/api/guest/reset-usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resetGuestUsage } from '@/lib/guest-tracking'

export async function POST(request: NextRequest) {
  try {
    const { ip, guestToken } = await request.json()
    
    if (!ip || ip === 'unknown') {
      return NextResponse.json(
        { error: 'Invalid IP address', success: false },
        { status: 400 }
      )
    }
    
    // Reset usage for this IP (admin function)
    await resetGuestUsage(ip, guestToken)
    
    return NextResponse.json({
      ip,
      success: true,
      message: 'Usage reset successfully'
    })
  } catch (error) {
    console.error('Error resetting usage:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage', success: false },
      { status: 500 }
    )
  }
}