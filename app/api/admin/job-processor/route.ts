import { NextRequest, NextResponse } from 'next/server'
import { scheduledContentProcessor } from '@/lib/scheduled-content-processor'

// GET - Get processor status and statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'status') {
      const status = scheduledContentProcessor.getStatus()
      
      return NextResponse.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      })
    }

    // Default: return status
    const status = scheduledContentProcessor.getStatus()
    
    return NextResponse.json({
      success: true,
      message: 'CivicSense Background Job Processor',
      status,
      endpoints: {
        'GET /api/admin/job-processor?action=status': 'Get processor status',
        'POST /api/admin/job-processor': 'Trigger job processing or maintenance'
      }
    })

  } catch (error) {
    console.error('Error in job processor status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// POST - Trigger manual processing or maintenance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, authToken } = body

    // Verify authorization for manual triggers
    if (authToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - valid admin token required'
      }, { status: 401 })
    }

    switch (action) {
      case 'process_jobs':
        console.log('🎯 Manual job processing triggered via API')
        
        // Trigger job processing in background
        scheduledContentProcessor.processScheduledJobs()
          .then(() => console.log('✅ Manual job processing completed'))
          .catch(error => console.error('❌ Manual job processing failed:', error))

        return NextResponse.json({
          success: true,
          message: 'Job processing triggered successfully',
          status: scheduledContentProcessor.getStatus()
        })

      case 'maintenance':
        console.log('🧹 Manual maintenance triggered via API')
        
        // Trigger maintenance in background
        scheduledContentProcessor.performMaintenance()
          .then(() => console.log('✅ Manual maintenance completed'))
          .catch(error => console.error('❌ Manual maintenance failed:', error))

        return NextResponse.json({
          success: true,
          message: 'Maintenance triggered successfully'
        })

      case 'shutdown':
        console.log('🛑 Manual shutdown triggered via API')
        
        // Trigger graceful shutdown
        scheduledContentProcessor.shutdown()
          .then(() => console.log('✅ Processor shutdown completed'))
          .catch(error => console.error('❌ Processor shutdown failed:', error))

        return NextResponse.json({
          success: true,
          message: 'Processor shutdown initiated'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: process_jobs, maintenance, shutdown'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in job processor action:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// PUT - Webhook endpoint for external triggers (e.g., cron jobs)
export async function PUT(request: NextRequest) {
  try {
    // Verify webhook authorization
    const authHeader = request.headers.get('Authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || process.env.WEBHOOK_SECRET}`
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - valid webhook token required'
      }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { action = 'process_jobs' } = body

    console.log(`🌐 Webhook triggered: ${action}`)

    switch (action) {
      case 'process_jobs':
        // Process scheduled jobs
        await scheduledContentProcessor.processScheduledJobs()
        
        const status = scheduledContentProcessor.getStatus()
        
        return NextResponse.json({
          success: true,
          message: 'Scheduled jobs processed successfully',
          status,
          timestamp: new Date().toISOString()
        })

      case 'maintenance':
        // Perform maintenance
        await scheduledContentProcessor.performMaintenance()
        
        return NextResponse.json({
          success: true,
          message: 'Maintenance completed successfully',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid webhook action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in webhook processing:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 