import { NextRequest, NextResponse } from 'next/server'
import { BillTrackingService } from '@/lib/services/bill-tracking-service'
import { checkAdminAccess } from '@/lib/admin-access'

/**
 * Bill Tracking API Endpoint
 * 
 * Provides comprehensive bill status tracking, content relationships,
 * and civic education content generation.
 */
export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, billId, options } = body

    const trackingService = new BillTrackingService()

    switch (action) {
      case 'track_bill':
        if (!billId) {
          return NextResponse.json(
            { error: 'billId is required' },
            { status: 400 }
          )
        }

        const trackResult = await trackingService.trackBill(billId, {
          enableNotifications: options?.enableNotifications || false,
          linkToQuizTopics: options?.linkToQuizTopics || true,
          generateCivicContent: options?.generateCivicContent || true
        })

        if (!trackResult.success) {
          return NextResponse.json(
            { error: trackResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Bill tracking enabled successfully',
          data: trackResult.trackingRecord
        })

      case 'update_status':
        if (!billId) {
          return NextResponse.json(
            { error: 'billId is required' },
            { status: 400 }
          )
        }

        const updateResult = await trackingService.updateBillStatus(billId)

        if (!updateResult.success) {
          return NextResponse.json(
            { error: updateResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Bill status updated successfully',
          data: {
            hasSignificantChanges: updateResult.hasSignificantChanges,
            changes: updateResult.changes || []
          }
        })

      case 'get_relationships':
        if (!billId) {
          return NextResponse.json(
            { error: 'billId is required' },
            { status: 400 }
          )
        }

        const relationships = await trackingService.getBillRelationships(billId)

        return NextResponse.json({
          success: true,
          message: 'Bill relationships retrieved successfully',
          data: {
            billId,
            relationships
          }
        })

      case 'monitor_all':
        const monitorResult = await trackingService.monitorAllTrackedBills()

        return NextResponse.json({
          success: true,
          message: 'Monitoring completed for all tracked bills',
          data: {
            summary: monitorResult,
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: track_bill, update_status, get_relationships, monitor_all' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bill tracking API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for retrieving bill tracking information
 */
export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const billId = url.searchParams.get('billId')

    if (!billId) {
      return NextResponse.json(
        { error: 'billId parameter is required' },
        { status: 400 }
      )
    }

    const trackingService = new BillTrackingService()
    const relationships = await trackingService.getBillRelationships(billId)

    return NextResponse.json({
      success: true,
      data: {
        billId,
        relationships,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Bill tracking GET error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 