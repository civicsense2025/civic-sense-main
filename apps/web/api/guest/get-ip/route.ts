// app/api/guest/get-ip/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get IP from headers (handles proxies, CDNs)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIP || 'unknown'
    
    return NextResponse.json({ 
      ip,
      success: true 
    })
  } catch (error) {
    console.error('Error getting IP:', error)
    return NextResponse.json(
      { error: 'Failed to get IP address', success: false },
      { status: 500 }
    )
  }
}
