import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user email preferences using the database function
    const { data, error } = await supabase
      .rpc('get_user_email_preferences', { p_user_id: user.id })
      .single()

    if (error) {
      console.error('Error fetching email preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await request.json()

    // Use the upsert function to save preferences
    const { data, error } = await supabase
      .rpc('upsert_user_email_preferences', {
        p_user_id: user.id,
        p_email_notifications: preferences.emailNotifications ?? preferences.email_notifications ?? true,
        p_weekly_digest: preferences.weeklyDigest ?? preferences.weekly_digest ?? true,
        p_achievement_alerts: preferences.achievementAlerts ?? preferences.achievement_alerts ?? true,
        p_email_delivery_frequency: preferences.emailDeliveryFrequency ?? preferences.email_delivery_frequency ?? 'immediate',
        p_email_format: preferences.emailFormat ?? preferences.email_format ?? 'html',
        p_marketing_emails: preferences.marketingEmails ?? preferences.marketing_emails ?? true,
        p_product_updates: preferences.productUpdates ?? preferences.product_updates ?? true,
        p_community_digest: preferences.communityDigest ?? preferences.community_digest ?? true,
        p_survey_invitations: preferences.surveyInvitations ?? preferences.survey_invitations ?? true,
        p_civic_news_alerts: preferences.civicNewsAlerts ?? preferences.civic_news_alerts ?? true,
        p_re_engagement_emails: preferences.reEngagementEmails ?? preferences.re_engagement_emails ?? true,
        p_social_sharing_enabled: preferences.socialSharingEnabled ?? preferences.social_sharing_enabled ?? true,
        p_auto_share_achievements: preferences.autoShareAchievements ?? preferences.auto_share_achievements ?? true,
        p_allow_data_analytics: preferences.allowDataAnalytics ?? preferences.allow_data_analytics ?? true,
        p_allow_personalization: preferences.allowPersonalization ?? preferences.allow_personalization ?? true,
        p_export_format: preferences.exportFormat ?? preferences.export_format ?? 'json',
        p_integration_sync: preferences.integrationSync ?? preferences.integration_sync ?? true,
        p_notification_channels: preferences.notificationChannels ?? preferences.notification_channels ?? [],
        p_data_retention_period: preferences.dataRetentionPeriod ?? preferences.data_retention_period ?? 'forever'
      })

    if (error) {
      console.error('Error saving email preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      preferences: data,
      message: 'Email preferences saved successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 