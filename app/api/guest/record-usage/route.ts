// app/api/guest/record-usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { recordGuestUsage, getGuestUsage } from '@/lib/guest-tracking'

export async function POST(request: NextRequest) {
  try {
    const { ip, guestToken, timestamp, topicId } = await request.json()
    
    if (!ip || ip === 'unknown') {
      return NextResponse.json(
        { error: 'Invalid IP address', success: false },
        { status: 400 }
      )
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    // Record the usage with topic ID if provided
    await recordGuestUsage(ip, guestToken, timestamp, topicId)
    
    // Get updated usage count
    const usage = await getGuestUsage(ip, today)
    
    return NextResponse.json({
      ip,
      attemptsToday: usage.attempts,
      limitReached: usage.attempts >= 3, // GUEST_DAILY_QUIZ_LIMIT
      completedTopics: usage.completedTopics || [],
      success: true
    })
  } catch (error) {
    console.error('Error recording usage:', error)
    return NextResponse.json(
      { error: 'Failed to record usage', success: false },
      { status: 500 }
    )
  }
}