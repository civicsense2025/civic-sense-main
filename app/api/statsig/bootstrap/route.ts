import { NextRequest, NextResponse } from 'next/server'

// This would require the statsig-node package for server-side initialization
// npm install statsig-node

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json()

    // For now, return a simple bootstrap response
    // In a real implementation, you'd use Statsig.getClientInitializeResponse()
    const bootstrapData = {
      feature_gates: {},
      dynamic_configs: {},
      experiments: {},
      time: Date.now(),
      has_updates: true
    }

    return NextResponse.json({
      success: true,
      data: JSON.stringify(bootstrapData),
      user,
      key: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json(
      { error: 'Failed to generate bootstrap data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Statsig Bootstrap API',
    description: 'Use POST with user data to get bootstrap values'
  })
} 