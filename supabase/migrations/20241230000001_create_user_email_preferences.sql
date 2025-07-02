-- Create user email preferences table with proper structure and RLS
BEGIN;

-- Create user_email_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core email preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  achievement_alerts BOOLEAN DEFAULT TRUE,
  email_delivery_frequency TEXT DEFAULT 'immediate' CHECK (email_delivery_frequency IN ('immediate', 'daily', 'weekly', 'monthly', 'never')),
  email_format TEXT DEFAULT 'html' CHECK (email_format IN ('html', 'text', 'mixed')),
  
  -- Specific email types  
  marketing_emails BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  community_digest BOOLEAN DEFAULT TRUE,
  survey_invitations BOOLEAN DEFAULT TRUE,
  civic_news_alerts BOOLEAN DEFAULT TRUE,
  re_engagement_emails BOOLEAN DEFAULT TRUE,
  
  -- Platform preferences
  social_sharing_enabled BOOLEAN DEFAULT TRUE,
  auto_share_achievements BOOLEAN DEFAULT TRUE,
  allow_data_analytics BOOLEAN DEFAULT TRUE,
  allow_personalization BOOLEAN DEFAULT TRUE,
  export_format TEXT DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'pdf')),
  integration_sync BOOLEAN DEFAULT TRUE,
  notification_channels JSONB DEFAULT '[]'::jsonb,
  data_retention_period TEXT DEFAULT 'forever' CHECK (data_retention_period IN ('1year', '2years', '5years', 'forever')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_email_preferences_updated_at ON user_email_preferences;
CREATE TRIGGER update_user_email_preferences_updated_at
    BEFORE UPDATE ON user_email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own preferences
DROP POLICY IF EXISTS "Users can view their own email preferences" ON user_email_preferences;
CREATE POLICY "Users can view their own email preferences"
ON user_email_preferences FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own email preferences" ON user_email_preferences;
CREATE POLICY "Users can insert their own email preferences"
ON user_email_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own email preferences" ON user_email_preferences;
CREATE POLICY "Users can update their own email preferences"
ON user_email_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own email preferences" ON user_email_preferences;
CREATE POLICY "Users can delete their own email preferences"
ON user_email_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Create function to get user email preferences with defaults
CREATE OR REPLACE FUNCTION get_user_email_preferences(p_user_id UUID)
RETURNS TABLE (
  email_notifications BOOLEAN,
  weekly_digest BOOLEAN,
  achievement_alerts BOOLEAN,
  email_delivery_frequency TEXT,
  email_format TEXT,
  marketing_emails BOOLEAN,
  product_updates BOOLEAN,
  community_digest BOOLEAN,
  survey_invitations BOOLEAN,
  civic_news_alerts BOOLEAN,
  re_engagement_emails BOOLEAN,
  social_sharing_enabled BOOLEAN,
  auto_share_achievements BOOLEAN,
  allow_data_analytics BOOLEAN,
  allow_personalization BOOLEAN,
  export_format TEXT,
  integration_sync BOOLEAN,
  notification_channels JSONB,
  data_retention_period TEXT
) AS $$
BEGIN
  -- Try to get existing preferences
  RETURN QUERY
  SELECT 
    uep.email_notifications,
    uep.weekly_digest,
    uep.achievement_alerts,
    uep.email_delivery_frequency,
    uep.email_format,
    uep.marketing_emails,
    uep.product_updates,
    uep.community_digest,
    uep.survey_invitations,
    uep.civic_news_alerts,
    uep.re_engagement_emails,
    uep.social_sharing_enabled,
    uep.auto_share_achievements,
    uep.allow_data_analytics,
    uep.allow_personalization,
    uep.export_format,
    uep.integration_sync,
    uep.notification_channels,
    uep.data_retention_period
  FROM user_email_preferences uep
  WHERE uep.user_id = p_user_id;
  
  -- If no preferences exist, return defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      TRUE::BOOLEAN,  -- email_notifications
      TRUE::BOOLEAN,  -- weekly_digest
      TRUE::BOOLEAN,  -- achievement_alerts
      'immediate'::TEXT, -- email_delivery_frequency
      'html'::TEXT,   -- email_format
      TRUE::BOOLEAN,  -- marketing_emails
      TRUE::BOOLEAN,  -- product_updates
      TRUE::BOOLEAN,  -- community_digest
      TRUE::BOOLEAN,  -- survey_invitations
      TRUE::BOOLEAN,  -- civic_news_alerts
      TRUE::BOOLEAN,  -- re_engagement_emails
      TRUE::BOOLEAN,  -- social_sharing_enabled
      TRUE::BOOLEAN,  -- auto_share_achievements
      TRUE::BOOLEAN,  -- allow_data_analytics
      TRUE::BOOLEAN,  -- allow_personalization
      'json'::TEXT,   -- export_format
      TRUE::BOOLEAN,  -- integration_sync
      '[]'::JSONB,    -- notification_channels
      'forever'::TEXT -- data_retention_period
    ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert user email preferences
CREATE OR REPLACE FUNCTION upsert_user_email_preferences(
  p_user_id UUID,
  p_email_notifications BOOLEAN DEFAULT TRUE,
  p_weekly_digest BOOLEAN DEFAULT TRUE,
  p_achievement_alerts BOOLEAN DEFAULT TRUE,
  p_email_delivery_frequency TEXT DEFAULT 'immediate',
  p_email_format TEXT DEFAULT 'html',
  p_marketing_emails BOOLEAN DEFAULT TRUE,
  p_product_updates BOOLEAN DEFAULT TRUE,
  p_community_digest BOOLEAN DEFAULT TRUE,
  p_survey_invitations BOOLEAN DEFAULT TRUE,
  p_civic_news_alerts BOOLEAN DEFAULT TRUE,
  p_re_engagement_emails BOOLEAN DEFAULT TRUE,
  p_social_sharing_enabled BOOLEAN DEFAULT TRUE,
  p_auto_share_achievements BOOLEAN DEFAULT TRUE,
  p_allow_data_analytics BOOLEAN DEFAULT TRUE,
  p_allow_personalization BOOLEAN DEFAULT TRUE,
  p_export_format TEXT DEFAULT 'json',
  p_integration_sync BOOLEAN DEFAULT TRUE,
  p_notification_channels JSONB DEFAULT '[]'::jsonb,
  p_data_retention_period TEXT DEFAULT 'forever'
)
RETURNS user_email_preferences AS $$
DECLARE
  result user_email_preferences;
BEGIN
  INSERT INTO user_email_preferences (
    user_id,
    email_notifications,
    weekly_digest,
    achievement_alerts,
    email_delivery_frequency,
    email_format,
    marketing_emails,
    product_updates,
    community_digest,
    survey_invitations,
    civic_news_alerts,
    re_engagement_emails,
    social_sharing_enabled,
    auto_share_achievements,
    allow_data_analytics,
    allow_personalization,
    export_format,
    integration_sync,
    notification_channels,
    data_retention_period
  ) VALUES (
    p_user_id,
    p_email_notifications,
    p_weekly_digest,
    p_achievement_alerts,
    p_email_delivery_frequency,
    p_email_format,
    p_marketing_emails,
    p_product_updates,
    p_community_digest,
    p_survey_invitations,
    p_civic_news_alerts,
    p_re_engagement_emails,
    p_social_sharing_enabled,
    p_auto_share_achievements,
    p_allow_data_analytics,
    p_allow_personalization,
    p_export_format,
    p_integration_sync,
    p_notification_channels,
    p_data_retention_period
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_notifications = EXCLUDED.email_notifications,
    weekly_digest = EXCLUDED.weekly_digest,
    achievement_alerts = EXCLUDED.achievement_alerts,
    email_delivery_frequency = EXCLUDED.email_delivery_frequency,
    email_format = EXCLUDED.email_format,
    marketing_emails = EXCLUDED.marketing_emails,
    product_updates = EXCLUDED.product_updates,
    community_digest = EXCLUDED.community_digest,
    survey_invitations = EXCLUDED.survey_invitations,
    civic_news_alerts = EXCLUDED.civic_news_alerts,
    re_engagement_emails = EXCLUDED.re_engagement_emails,
    social_sharing_enabled = EXCLUDED.social_sharing_enabled,
    auto_share_achievements = EXCLUDED.auto_share_achievements,
    allow_data_analytics = EXCLUDED.allow_data_analytics,
    allow_personalization = EXCLUDED.allow_personalization,
    export_format = EXCLUDED.export_format,
    integration_sync = EXCLUDED.integration_sync,
    notification_channels = EXCLUDED.notification_channels,
    data_retention_period = EXCLUDED.data_retention_period,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON user_email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_updated_at ON user_email_preferences(updated_at DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_email_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_email_preferences(UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, JSONB, TEXT) TO authenticated;

COMMIT; 