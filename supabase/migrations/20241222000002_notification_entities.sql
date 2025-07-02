-- ============================================================================
-- GENERIC NOTIFICATION ENTITIES MIGRATION
-- ============================================================================
-- Simplified notification system that treats notifications as generic entities
-- Can work with OneSignal, email, SMS, or any other notification provider
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- ============================================================================
-- NOTIFICATION PROVIDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL UNIQUE, -- 'OneSignal', 'Email', 'SMS', etc.
  provider_type TEXT NOT NULL CHECK (provider_type IN ('push', 'email', 'sms', 'in_app')),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER SUBSCRIPTIONS (Generic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES notification_providers(id) ON DELETE CASCADE,
  external_user_id TEXT, -- Provider's user ID (OneSignal player_id, email address, phone number, etc.)
  subscription_data JSONB DEFAULT '{}', -- Provider-specific subscription info
  is_subscribed BOOLEAN DEFAULT true,
  civic_tags JSONB DEFAULT '[]', -- Array of civic engagement tags
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

-- ============================================================================
-- NOTIFICATION SEGMENTS (Targeting Rules)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_name TEXT NOT NULL UNIQUE,
  description TEXT,
  targeting_rules JSONB NOT NULL DEFAULT '{}',
  -- Example targeting rules:
  -- {
  --   \"civic_engagement_level\": \"high\",
  --   \"quiz_completion_rate\": 0.7,
  --   \"location\": [\"California\", \"New York\"],
  --   \"voting_status\": \"registered\",
  --   \"last_active_days\": 30,
  --   \"topics_interested\": [\"constitutional-rights\", \"voting\"]
  -- }
  calculated_user_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  civic_category TEXT, -- 'voting', 'education', 'local_gov', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION TEMPLATES (Reusable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL, -- 'quiz_reminder', 'voting_alert', 'news_update', etc.
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  civic_focus TEXT, -- 'constitution', 'voting', 'local_government', etc.
  variables JSONB DEFAULT '[]', -- Array of template variables like ['user_name', 'quiz_topic']
  provider_specific_config JSONB DEFAULT '{}', -- Provider-specific template config
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'quiz_reminder', 'voting_alert', 'breaking_news', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'completed', 'failed', 'cancelled')),
  civic_urgency_level INTEGER DEFAULT 1 CHECK (civic_urgency_level >= 1 AND civic_urgency_level <= 5),
  
  -- Multi-provider support
  target_providers JSONB DEFAULT '[]', -- Array of provider IDs to send through
  target_segments JSONB DEFAULT '[]', -- Array of segment IDs
  target_user_ids JSONB DEFAULT '[]', -- Array of specific user IDs
  
  -- Civic action elements
  civic_action_steps JSONB DEFAULT '[]', -- Array of action steps for users
  deep_link TEXT, -- App deep link
  action_url TEXT, -- Web action URL
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Analytics (aggregated across all providers)
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Civic actions taken
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION EVENTS (Individual Notifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES notification_providers(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider-specific data
  external_notification_id TEXT, -- Provider's notification ID
  provider_response JSONB DEFAULT '{}', -- Full provider response
  
  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'conversion', 'failed')),
  event_data JSONB DEFAULT '{}',
  
  -- Civic engagement tracking
  civic_action_taken TEXT, -- Specific action taken (if conversion)
  civic_context JSONB DEFAULT '{}', -- Additional civic context
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CIVIC ENGAGEMENT METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS civic_engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'quiz_completed', 'voted', 'contacted_representative', etc.
  event_data JSONB DEFAULT '{}',
  notification_campaign_id UUID REFERENCES notification_campaigns(id), -- If triggered by notification
  engagement_score INTEGER DEFAULT 1, -- Weight of this engagement type
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_notification_subscriptions_user_provider 
ON user_notification_subscriptions(user_id, provider_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_subscriptions_external_user 
ON user_notification_subscriptions(provider_id, external_user_id);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status 
ON notification_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_scheduled 
ON notification_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_events_campaign 
ON notification_events(campaign_id);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_type 
ON notification_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_notification_events_provider_type 
ON notification_events(provider_id, event_type);

CREATE INDEX IF NOT EXISTS idx_civic_engagement_events_user 
ON civic_engagement_events(user_id);

CREATE INDEX IF NOT EXISTS idx_civic_engagement_events_campaign 
ON civic_engagement_events(notification_campaign_id) WHERE notification_campaign_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- notification_providers: Admin only
ALTER TABLE notification_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Admin can manage notification providers\" ON notification_providers
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- user_notification_subscriptions: Users can manage their own subscriptions
ALTER TABLE user_notification_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Users can manage own subscriptions\" ON user_notification_subscriptions
FOR ALL USING (auth.uid() = user_id);

-- notification_segments: Admin only
ALTER TABLE notification_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Admin can manage segments\" ON notification_segments
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- notification_templates: Admin only
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Admin can manage templates\" ON notification_templates
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- notification_campaigns: Admin only
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Admin can manage campaigns\" ON notification_campaigns
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- notification_events: Users can view their own events
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Users can view own notification events\" ON notification_events
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Admin can view all notification events\" ON notification_events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- civic_engagement_events: Users can view their own events
ALTER TABLE civic_engagement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Users can manage own civic events\" ON civic_engagement_events
FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update campaign analytics when notification events are created
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'sent' THEN
    UPDATE notification_campaigns 
    SET sent_count = sent_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'delivered' THEN
    UPDATE notification_campaigns 
    SET delivered_count = delivered_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE notification_campaigns 
    SET opened_count = opened_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE notification_campaigns 
    SET clicked_count = clicked_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'conversion' THEN
    UPDATE notification_campaigns 
    SET conversion_count = conversion_count + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_campaign_analytics
  AFTER INSERT ON notification_events
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_analytics();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default notification providers
INSERT INTO notification_providers (provider_name, provider_type, configuration) VALUES
('OneSignal', 'push', '{\"supports_segmentation\": true, \"supports_rich_content\": true}'),
('Email', 'email', '{\"supports_templates\": true, \"supports_scheduling\": true}'),
('SMS', 'sms', '{\"character_limit\": 160, \"supports_links\": true}')
ON CONFLICT (provider_name) DO NOTHING;

-- Insert sample segments
INSERT INTO notification_segments (segment_name, description, targeting_rules, civic_category) VALUES
('Active Learners', 'Users with high quiz completion rates', '{\"quiz_completion_rate\": 0.7, \"last_active_days\": 30}', 'education'),
('New Voters', 'Recently registered voters', '{\"voting_status\": \"registered\", \"last_active_days\": 90}', 'voting'),
('Civic Beginners', 'Users new to civic education', '{\"civic_engagement_level\": \"low\"}', 'education'),
('Local Government Interested', 'Users interested in local politics', '{\"topics_interested\": [\"local-government\", \"city-council\"]}', 'local_gov')
ON CONFLICT (segment_name) DO NOTHING;

-- Insert sample templates
INSERT INTO notification_templates (template_name, template_type, title_template, message_template, civic_focus, variables) VALUES
('Quiz Reminder', 'quiz_reminder', 'Time for your civic quiz, {user_name}!', 'Test your knowledge on {quiz_topic}. Every question makes you a more informed citizen.', 'education', '[\"user_name\", \"quiz_topic\"]'),
('Voting Alert', 'voting_alert', 'Important: Election in {days_until_election} days', 'Make your voice heard, {user_name}. Find your polling location and candidate information.', 'voting', '[\"user_name\", \"days_until_election\"]'),
('Breaking Civic News', 'breaking_news', 'Breaking: {headline}', '{summary} Learn more about how this affects your community.', 'news', '[\"headline\", \"summary\"]'),
('Representative Contact', 'civic_action', 'Your voice matters on {issue_topic}', 'Contact your representatives about {issue_topic}. Here''s how to make your voice heard.', 'action', '[\"issue_topic\", \"user_name\"]')
ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Campaign performance view
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
  c.id,
  c.campaign_name,
  c.campaign_type,
  c.status,
  c.civic_urgency_level,
  c.sent_count,
  c.delivered_count,
  c.opened_count,
  c.clicked_count,
  c.conversion_count,
  CASE 
    WHEN c.sent_count > 0 THEN ROUND((c.opened_count::DECIMAL / c.sent_count) * 100, 2)
    ELSE 0
  END AS open_rate_percent,
  CASE 
    WHEN c.opened_count > 0 THEN ROUND((c.clicked_count::DECIMAL / c.opened_count) * 100, 2)
    ELSE 0
  END AS click_rate_percent,
  CASE 
    WHEN c.clicked_count > 0 THEN ROUND((c.conversion_count::DECIMAL / c.clicked_count) * 100, 2)
    ELSE 0
  END AS conversion_rate_percent
FROM notification_campaigns c;

-- Provider performance view
CREATE OR REPLACE VIEW provider_performance AS
SELECT 
  p.id,
  p.provider_name,
  p.provider_type,
  COUNT(DISTINCT ne.campaign_id) as campaigns_sent,
  COUNT(CASE WHEN ne.event_type = 'sent' THEN 1 END) as total_sent,
  COUNT(CASE WHEN ne.event_type = 'delivered' THEN 1 END) as total_delivered,
  COUNT(CASE WHEN ne.event_type = 'opened' THEN 1 END) as total_opened,
  COUNT(CASE WHEN ne.event_type = 'clicked' THEN 1 END) as total_clicked,
  COUNT(CASE WHEN ne.event_type = 'conversion' THEN 1 END) as total_conversions
FROM notification_providers p
LEFT JOIN notification_events ne ON p.id = ne.provider_id
GROUP BY p.id, p.provider_name, p.provider_type;

-- Civic engagement impact view
CREATE OR REPLACE VIEW civic_engagement_impact AS
SELECT 
  c.id as campaign_id,
  c.campaign_name,
  c.campaign_type,
  COUNT(cee.id) as civic_actions_triggered,
  COUNT(DISTINCT cee.user_id) as unique_users_engaged,
  SUM(cee.engagement_score) as total_engagement_score
FROM notification_campaigns c
LEFT JOIN civic_engagement_events cee ON c.id = cee.notification_campaign_id
GROUP BY c.id, c.campaign_name, c.campaign_type; 