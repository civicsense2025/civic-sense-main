// app/api/guest/check-usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGuestUsage } from '@/lib/guest-tracking' // Your storage implementation

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json()
    
    if (!ip || ip === 'unknown') {
      return NextResponse.json(
        { error: 'Invalid IP address', success: false },
        { status: 400 }
      )
    }
    
    // Get today's usage for this IP
    const today = new Date().toISOString().split('T')[0]
    const usage = await getGuestUsage(ip, today)
    
    return NextResponse.json({
      ip,
      attemptsToday: usage.attempts,
      limitReached: usage.attempts >= 3, // GUEST_DAILY_QUIZ_LIMIT
      completedTopics: usage.completedTopics || [],
      success: true
    })
  } catch (error) {
    console.error('Error checking usage:', error)
    return NextResponse.json(
      { error: 'Failed to check usage', success: false },
      { status: 500 }
    )
  }
}