-- User Email Preferences Table
-- Stores user preferences for email delivery, matching the settings interface

CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email delivery preferences
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
  
  -- Communication channels
  notification_channels JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
CREATE POLICY user_email_preferences_policy ON user_email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_user_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_email_preferences_updated_at
  BEFORE UPDATE ON user_email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_email_preferences_updated_at();

-- Function to get user email preferences with defaults
CREATE OR REPLACE FUNCTION get_user_email_preferences(p_user_id UUID)
RETURNS TABLE(
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
  notification_channels JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(uep.email_notifications, TRUE),
    COALESCE(uep.weekly_digest, TRUE),
    COALESCE(uep.achievement_alerts, TRUE),
    COALESCE(uep.email_delivery_frequency, 'immediate'),
    COALESCE(uep.email_format, 'html'),
    COALESCE(uep.marketing_emails, TRUE),
    COALESCE(uep.product_updates, TRUE),
    COALESCE(uep.community_digest, TRUE),
    COALESCE(uep.survey_invitations, TRUE),
    COALESCE(uep.civic_news_alerts, TRUE),
    COALESCE(uep.re_engagement_emails, TRUE),
    COALESCE(uep.notification_channels, '[]'::jsonb)
  FROM user_email_preferences uep
  WHERE uep.user_id = p_user_id
  
  UNION ALL
  
  -- Return defaults if no preferences exist
  SELECT 
    TRUE, TRUE, TRUE, 'immediate', 'html', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '[]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM user_email_preferences WHERE user_id = p_user_id
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 