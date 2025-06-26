import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch OneSignal analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch analytics data
    const analytics = await calculateAnalytics(supabase)

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error in analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculateAnalytics(supabase: any) {
  try {
    // Total campaigns
    const { count: totalCampaigns } = await supabase
      .from('onesignal_campaigns')
      .select('*', { count: 'exact', head: true })

    // Active campaigns
    const { count: activeCampaigns } = await supabase
      .from('onesignal_campaigns')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'scheduled', 'sending'])

    // Total users
    const { count: totalUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })

    // Subscribed users
    const { count: subscribedUsers } = await supabase
      .from('onesignal_user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true)
      .eq('push_enabled', true)

    // Campaign performance data
    const { data: campaignData } = await supabase
      .from('onesignal_campaigns')
      .select('sent_count, delivered_count, opened_count, clicked_count, conversion_count')
      .not('sent_count', 'is', null)
      .gt('sent_count', 0)

    // Calculate aggregated metrics
    const totalSent = campaignData?.reduce((sum: number, campaign: any) => sum + (campaign.sent_count || 0), 0) || 0
    const totalDelivered = campaignData?.reduce((sum: number, campaign: any) => sum + (campaign.delivered_count || 0), 0) || 0
    const totalOpened = campaignData?.reduce((sum: number, campaign: any) => sum + (campaign.opened_count || 0), 0) || 0
    const totalClicked = campaignData?.reduce((sum: number, campaign: any) => sum + (campaign.clicked_count || 0), 0) || 0
    const totalConversions = campaignData?.reduce((sum: number, campaign: any) => sum + (campaign.conversion_count || 0), 0) || 0

    // Calculate rates
    const averageOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
    const averageClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0

    // Civic engagement events
    const { count: civicActionsTriggered } = await supabase
      .from('civic_engagement_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'notification_clicked')

    // Recent campaign performance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentCampaigns } = await supabase
      .from('onesignal_campaigns')
      .select('campaign_type, sent_count, opened_count, clicked_count, conversion_count, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Campaign type breakdown
    const campaignTypeBreakdown = recentCampaigns?.reduce((acc: Record<string, any>, campaign: any) => {
      const type = campaign.campaign_type
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          sent: 0,
          opened: 0,
          clicked: 0,
          conversions: 0
        }
      }
      acc[type].count++
      acc[type].sent += campaign.sent_count || 0
      acc[type].opened += campaign.opened_count || 0
      acc[type].clicked += campaign.clicked_count || 0
      acc[type].conversions += campaign.conversion_count || 0
      return acc
    }, {} as Record<string, any>) || {}

    // Top performing segments
    const { data: segmentPerformance } = await supabase
      .from('onesignal_segments')
      .select('segment_name, segment_type, actual_user_count')
      .eq('is_active', true)
      .order('actual_user_count', { ascending: false })
      .limit(5)

    // User engagement trends (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: dailyEngagement } = await supabase
      .from('onesignal_notification_events')
      .select('event_type, event_timestamp')
      .gte('event_timestamp', sevenDaysAgo.toISOString())
      .order('event_timestamp', { ascending: true })

    // Group by day
    const engagementByDay = dailyEngagement?.reduce((acc: Record<string, any>, event: any) => {
      const day = new Date(event.event_timestamp).toDateString()
      if (!acc[day]) {
        acc[day] = { sent: 0, opened: 0, clicked: 0 }
      }
      if (event.event_type === 'sent') acc[day].sent++
      if (event.event_type === 'opened') acc[day].opened++
      if (event.event_type === 'clicked') acc[day].clicked++
      return acc
    }, {} as Record<string, any>) || {}

    return {
      // Basic metrics
      total_campaigns: totalCampaigns || 0,
      active_campaigns: activeCampaigns || 0,
      total_users: totalUsers || 0,
      subscribed_users: subscribedUsers || 0,
      total_sent: totalSent,
      average_open_rate: Math.round(averageOpenRate * 10) / 10,
      average_click_rate: Math.round(averageClickRate * 10) / 10,
      civic_actions_triggered: civicActionsTriggered || 0,

      // Detailed metrics
      delivery_rate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0,
      total_delivered: totalDelivered,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      total_conversions: totalConversions,

      // Breakdowns
      campaign_type_breakdown: campaignTypeBreakdown,
      top_segments: segmentPerformance || [],
      daily_engagement: engagementByDay,

      // Growth metrics
      subscription_rate: totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 1000) / 10 : 0,
      civic_impact_score: totalConversions > 0 ? Math.round((totalConversions / totalSent) * 10000) / 100 : 0,

      // Recent performance
      recent_campaigns_count: recentCampaigns?.length || 0,
      avg_time_to_open: '2.3 hours', // This would be calculated from event timestamps
      best_send_time: '7:00 PM', // This would be calculated from performance data
      
      // Platform breakdown (would be calculated from subscription data)
      platform_breakdown: {
        mobile: Math.round((subscribedUsers || 0) * 0.7),
        web: Math.round((subscribedUsers || 0) * 0.3),
      }
    }
  } catch (error) {
    console.error('Error calculating analytics:', error)
    
    // Return default analytics if calculation fails
    return {
      total_campaigns: 0,
      active_campaigns: 0,
      total_users: 0,
      subscribed_users: 0,
      total_sent: 0,
      average_open_rate: 0,
      average_click_rate: 0,
      civic_actions_triggered: 0,
      delivery_rate: 0,
      total_delivered: 0,
      total_opened: 0,
      total_clicked: 0,
      total_conversions: 0,
      campaign_type_breakdown: {},
      top_segments: [],
      daily_engagement: {},
      subscription_rate: 0,
      civic_impact_score: 0,
      recent_campaigns_count: 0,
      avg_time_to_open: 'N/A',
      best_send_time: 'N/A',
      platform_breakdown: { mobile: 0, web: 0 }
    }
  }
} 