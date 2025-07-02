import { NextRequest, NextResponse } from 'next/server'
import { 
  runSourceMaintenance, 
  scanForBrokenSources, 
  removeBrokenSourcesOnly 
} from '@civicsense/shared/utils/source-maintenance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    console.log(`[source-maintenance] Starting action: ${action}`)
    
    switch (action) {
      case 'scan':
        {
          const brokenSources = await scanForBrokenSources()
          return NextResponse.json({
            success: true,
            action: 'scan',
            brokenSources,
            message: `Found ${brokenSources.length} broken sources`
          })
        }
      
      case 'fix':
        {
          const result = await runSourceMaintenance()
          return NextResponse.json({
            success: true,
            action: 'fix',
            ...result,
            message: `Fixed ${result.fixedCount} broken sources. ${result.brokenSources.length} remaining.`
          })
        }
      
      case 'remove':
        {
          const removedCount = await removeBrokenSourcesOnly()
          return NextResponse.json({
            success: true,
            action: 'remove',
            removedCount,
            message: `Removed ${removedCount} broken sources`
          })
        }
      
      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Use "scan", "fix", or "remove"',
            availableActions: ['scan', 'fix', 'remove']
          },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('[source-maintenance] Error:', error)
    return NextResponse.json(
      { 
        error: 'Source maintenance failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  
  if (!action) {
    return NextResponse.json({
      message: 'Source Maintenance API',
      description: 'Manage broken sources in the quiz database',
      usage: {
        scan: 'POST /api/source-maintenance with { "action": "scan" }',
        fix: 'POST /api/source-maintenance with { "action": "fix" }',
        remove: 'POST /api/source-maintenance with { "action": "remove" }'
      },
      actions: {
        scan: 'Scan all questions for broken sources (404s, timeouts, etc.)',
        fix: 'Find and replace broken sources with AI-suggested alternatives',
        remove: 'Remove broken sources without replacement'
      },
      requirements: {
        environment: 'OPENAI_API_KEY required for "fix" action',
        permissions: 'Database write access required'
      }
    })
  }
  
  // Allow GET requests for testing
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ action })
  }))
} 