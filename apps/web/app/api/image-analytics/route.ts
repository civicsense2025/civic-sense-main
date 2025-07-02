import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export const runtime = 'edge'

interface AnalyticsTrackingRequest {
  template: string
  variant?: string
  theme?: string
  userId?: string
  engagementType: 'view' | 'click' | 'share' | 'download'
  timestamp: number
  userAgent: string
  referrer: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const data: AnalyticsTrackingRequest = await request.json()
    
    // Validate engagement type
    const validEngagementTypes = ['view', 'click', 'share', 'download']
    if (!validEngagementTypes.includes(data.engagementType)) {
      return NextResponse.json(
        { error: 'Invalid engagement type' },
        { status: 400 }
      )
    }
    
    // Insert into A/B test results table for tracking
    const { error: abTestError } = await supabase
      .from('image_ab_test_results')
      .insert({
        test_name: 'image_engagement_tracking',
        variant: data.variant || 'default',
        user_id: data.userId,
        session_id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        engagement_type: data.engagementType,
        engagement_value: 1,
        created_at: new Date(data.timestamp).toISOString()
      })
    
    if (abTestError) {
      console.warn('Failed to track A/B test result:', abTestError)
    }
    
    // Get user IP for analytics (respecting privacy)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown'
    
    // Log analytics event
    const analyticsEvent = {
      event_type: 'image_engagement',
      template: data.template,
      variant: data.variant || 'default',
      theme: data.theme || 'default',
      engagement_type: data.engagementType,
      user_id: data.userId,
      user_agent: data.userAgent,
      referrer: data.referrer,
      ip_address: ip.slice(0, -1) + 'x', // Anonymize last octet for privacy
      timestamp: new Date(data.timestamp).toISOString()
    }
    
    // Insert into system logs (if table exists)
    try {
      await supabase
        .from('analytics_events')
        .insert(analyticsEvent)
    } catch (error) {
      // Table might not exist, continue without blocking
      console.warn('Analytics events table not available:', error)
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Analytics tracked successfully'
    })
    
  } catch (error) {
    console.error('Analytics tracking failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to track analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Get analytics parameters
    const timeframe = searchParams.get('timeframe') || '7d'
    const template = searchParams.get('template')
    const variant = searchParams.get('variant')
    const theme = searchParams.get('theme')
    
    // Calculate date range
    const now = new Date()
    const timeframeMap = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    const timeframeDuration = timeframeMap[timeframe as keyof typeof timeframeMap] || timeframeMap['7d']
    const startDate = new Date(now.getTime() - timeframeDuration)
    
    // Build query
    let query = supabase
      .from('image_generation_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
    
    if (template) {
      query = query.eq('template', template)
    }
    if (variant) {
      query = query.eq('variant', variant)
    }
    if (theme) {
      query = query.eq('theme', theme)
    }
    
    const { data: analytics, error } = await query.limit(1000)
    
    if (error) {
      throw error
    }
    
    // Calculate summary metrics
    const totalGenerations = analytics?.length || 0
    const successfulGenerations = analytics?.filter(a => a.success).length || 0
    const averageGenerationTime = analytics?.reduce((sum, a) => sum + a.generation_time_ms, 0) / totalGenerations || 0
    const errorRate = ((totalGenerations - successfulGenerations) / totalGenerations) * 100 || 0
    
    // Template usage breakdown
    const templateUsage = analytics?.reduce((acc, item) => {
      acc[item.template] = (acc[item.template] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Variant performance
    const variantPerformance: Record<string, { usage: number; totalTime: number; errors: number }> = 
      analytics?.reduce((acc, item) => {
        const variant = item.variant || 'default'
        if (!acc[variant]) {
          acc[variant] = { usage: 0, totalTime: 0, errors: 0 }
        }
        acc[variant].usage += 1
        acc[variant].totalTime += item.generation_time_ms
        if (!item.success) acc[variant].errors += 1
        return acc
      }, {} as Record<string, { usage: number; totalTime: number; errors: number }>) || {}
    
    // Calculate averages for variants
    const variantMetrics: Record<string, { usage: number; avgGenerationTime: number; errorRate: number }> = 
      Object.entries(variantPerformance).reduce((acc, [variant, data]) => {
        acc[variant] = {
          usage: data.usage,
          avgGenerationTime: data.totalTime / data.usage,
          errorRate: (data.errors / data.usage) * 100
        }
        return acc
      }, {} as Record<string, { usage: number; avgGenerationTime: number; errorRate: number }>)
    
    // Theme popularity
    const themePopularity = analytics?.reduce((acc, item) => {
      const theme = item.theme || 'default'
      acc[theme] = (acc[theme] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalGenerations,
          successfulGenerations,
          averageGenerationTime,
          errorRate,
          timeframe,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        },
        metrics: {
          templateUsage,
          variantPerformance: variantMetrics,
          themePopularity
        },
        rawData: analytics
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 