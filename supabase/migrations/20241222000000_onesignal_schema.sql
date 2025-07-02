-- OneSignal Integration Schema for CivicSense
-- This migration creates all necessary tables for managing OneSignal notifications

-- =============================================================================
-- OneSignal Configuration Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id VARCHAR(255) NOT NULL UNIQUE,
  app_name VARCHAR(255) NOT NULL DEFAULT 'CivicSense',
  rest_api_key TEXT NOT NULL,
  user_auth_key TEXT,
  is_active BOOLEAN DEFAULT true,
  environment VARCHAR(50) DEFAULT 'production', -- 'production', 'development', 'testing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- OneSignal User Subscriptions
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onesignal_id VARCHAR(255), -- OneSignal Player ID
  external_user_id VARCHAR(255), -- Our user ID in OneSignal
  push_token TEXT,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  
  -- Subscription status
  is_subscribed BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Platform information
  platform VARCHAR(50), -- 'web', 'mobile', 'ios', 'android'
  device_type VARCHAR(50),
  device_model VARCHAR(100),
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  
  -- Location data
  timezone VARCHAR(100),
  country VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  
  -- Engagement tracking
  first_session TIMESTAMP WITH TIME ZONE,
  last_active TIMESTAMP WITH TIME ZONE,
  session_count INTEGER DEFAULT 0,
  
  -- Notification preferences
  notification_preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user subscriptions
CREATE INDEX idx_onesignal_user_subscriptions_user_id ON onesignal_user_subscriptions(user_id);
CREATE INDEX idx_onesignal_user_subscriptions_onesignal_id ON onesignal_user_subscriptions(onesignal_id);
CREATE INDEX idx_onesignal_user_subscriptions_platform ON onesignal_user_subscriptions(platform);
CREATE INDEX idx_onesignal_user_subscriptions_active ON onesignal_user_subscriptions(is_subscribed, push_enabled);

-- =============================================================================
-- Civic User Tags (for OneSignal targeting)
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Civic engagement tags
  civic_engagement_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
  topics_of_interest TEXT[], -- Array of topic IDs
  preferred_notification_time VARCHAR(50), -- 'morning', 'afternoon', 'evening'
  
  -- Location tags
  location_state VARCHAR(100),
  location_district VARCHAR(100),
  location_county VARCHAR(100),
  location_city VARCHAR(100),
  
  -- Activity tags
  quiz_completion_rate INTEGER DEFAULT 0, -- 0-100
  last_quiz_date TIMESTAMP WITH TIME ZONE,
  voting_status VARCHAR(50), -- 'registered', 'unregistered', 'unknown'
  age_group VARCHAR(20), -- '18-25', '26-35', etc.
  political_engagement VARCHAR(50), -- 'low', 'medium', 'high'
  
  -- Additional custom tags
  custom_tags JSONB DEFAULT '{}',
  
  -- Full tag export for OneSignal
  onesignal_tags JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user tags
CREATE INDEX idx_onesignal_user_tags_user_id ON onesignal_user_tags(user_id);
CREATE INDEX idx_onesignal_user_tags_engagement ON onesignal_user_tags(civic_engagement_level);
CREATE INDEX idx_onesignal_user_tags_location ON onesignal_user_tags(location_state, location_district);
CREATE INDEX idx_onesignal_user_tags_interests ON onesignal_user_tags USING GIN(topics_of_interest);

-- =============================================================================
-- OneSignal Segments
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name VARCHAR(255) NOT NULL,
  segment_id VARCHAR(255), -- OneSignal segment ID
  description TEXT,
  
  -- Segment criteria
  criteria JSONB NOT NULL, -- Filter conditions
  estimated_user_count INTEGER DEFAULT 0,
  actual_user_count INTEGER DEFAULT 0,
  
  -- Civic-specific segment types
  segment_type VARCHAR(100) NOT NULL, -- 'civic_engagement', 'location', 'quiz_performance', 'voting', 'custom'
  is_dynamic BOOLEAN DEFAULT true, -- Whether segment updates automatically
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'error'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for segments
CREATE INDEX idx_onesignal_segments_type ON onesignal_segments(segment_type);
CREATE INDEX idx_onesignal_segments_active ON onesignal_segments(is_active);
CREATE INDEX idx_onesignal_segments_criteria ON onesignal_segments USING GIN(criteria);

-- =============================================================================
-- OneSignal Campaigns
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  onesignal_notification_id VARCHAR(255), -- OneSignal notification ID
  
  -- Campaign content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  subtitle VARCHAR(255),
  
  -- Civic campaign specifics
  campaign_type VARCHAR(100) NOT NULL, -- 'quiz_reminder', 'voting_alert', 'news_update', 'civic_action', 'educational_content'
  urgency_level INTEGER DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 5),
  
  -- Targeting
  target_segments UUID[] DEFAULT '{}', -- Array of segment IDs
  target_user_count INTEGER DEFAULT 0,
  
  -- Delivery channels
  send_push BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT false,
  send_sms BOOLEAN DEFAULT false,
  
  -- Scheduling
  send_immediately BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR(100) DEFAULT 'UTC',
  
  -- Deep linking and actions
  action_url TEXT,
  deep_link TEXT,
  civic_action_steps TEXT[],
  
  -- Campaign status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'completed', 'failed', 'cancelled'
  
  -- Results (populated after sending)
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Civic actions taken
  
  -- Metadata
  additional_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for campaigns
CREATE INDEX idx_onesignal_campaigns_type ON onesignal_campaigns(campaign_type);
CREATE INDEX idx_onesignal_campaigns_status ON onesignal_campaigns(status);
CREATE INDEX idx_onesignal_campaigns_scheduled ON onesignal_campaigns(scheduled_at);
CREATE INDEX idx_onesignal_campaigns_created_by ON onesignal_campaigns(created_by);

-- =============================================================================
-- Notification Events (Analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES onesignal_campaigns(id) ON DELETE CASCADE,
  notification_id VARCHAR(255), -- OneSignal notification ID
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'received', 'opened', 'clicked', 'dismissed', 'converted'
  notification_type VARCHAR(100), -- Campaign type
  
  -- Device/Platform information
  platform VARCHAR(50),
  device_type VARCHAR(50),
  
  -- Timing
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Additional event data
  event_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notification events
CREATE INDEX idx_onesignal_events_user_id ON onesignal_notification_events(user_id);
CREATE INDEX idx_onesignal_events_campaign_id ON onesignal_notification_events(campaign_id);
CREATE INDEX idx_onesignal_events_type ON onesignal_notification_events(event_type);
CREATE INDEX idx_onesignal_events_timestamp ON onesignal_notification_events(event_timestamp);
CREATE INDEX idx_onesignal_events_notification_id ON onesignal_notification_events(notification_id);

-- =============================================================================
-- Civic Engagement Events (Extended Analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS civic_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type VARCHAR(100) NOT NULL, -- 'notification_opened', 'civic_action', 'quiz_completed', 'voting_action', 'content_engagement'
  action_details JSONB DEFAULT '{}',
  
  -- Related content
  notification_type VARCHAR(100),
  related_content_id VARCHAR(255), -- Topic ID, Quiz ID, etc.
  related_content_type VARCHAR(100), -- 'quiz', 'topic', 'news', 'civic_action'
  
  -- Impact measurement
  civic_impact_score INTEGER DEFAULT 1 CHECK (civic_impact_score BETWEEN 1 AND 10),
  follow_up_actions TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for civic engagement events
CREATE INDEX idx_civic_events_user_id ON civic_engagement_events(user_id);
CREATE INDEX idx_civic_events_type ON civic_engagement_events(event_type);
CREATE INDEX idx_civic_events_content ON civic_engagement_events(related_content_id, related_content_type);
CREATE INDEX idx_civic_events_timestamp ON civic_engagement_events(created_at);

-- =============================================================================
-- Campaign Templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL, -- Same as campaign types
  
  -- Template content
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  subtitle_template VARCHAR(255),
  
  -- Default settings
  default_urgency_level INTEGER DEFAULT 1,
  default_channels JSONB DEFAULT '{"push": true, "email": false, "sms": false}',
  default_segments UUID[],
  
  -- Template variables (for personalization)
  available_variables TEXT[], -- e.g., ['user_name', 'quiz_topic', 'civic_action']
  
  -- Civic template specifics
  civic_action_steps_template TEXT[],
  deep_link_pattern TEXT, -- e.g., '/quiz/{quiz_id}', '/voting/{state}'
  
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for templates
CREATE INDEX idx_onesignal_templates_type ON onesignal_campaign_templates(template_type);
CREATE INDEX idx_onesignal_templates_active ON onesignal_campaign_templates(is_active);

-- =============================================================================
-- Automated Workflows
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_automated_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name VARCHAR(255) NOT NULL,
  workflow_type VARCHAR(100) NOT NULL, -- 'quiz_completion', 'onboarding', 're_engagement', 'voting_reminder'
  
  -- Trigger conditions
  trigger_event VARCHAR(100) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Workflow steps (each step can be a notification)
  steps JSONB NOT NULL, -- Array of notification configurations
  
  -- Timing
  delay_between_steps INTERVAL DEFAULT '1 day',
  max_steps INTEGER DEFAULT 3,
  
  -- Targeting
  target_segments UUID[],
  
  -- Status and controls
  is_active BOOLEAN DEFAULT true,
  total_users_entered INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for workflows
CREATE INDEX idx_onesignal_workflows_type ON onesignal_automated_workflows(workflow_type);
CREATE INDEX idx_onesignal_workflows_active ON onesignal_automated_workflows(is_active);

-- =============================================================================
-- User Workflow States
-- =============================================================================

CREATE TABLE IF NOT EXISTS onesignal_user_workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES onesignal_automated_workflows(id) ON DELETE CASCADE,
  
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_step_at TIMESTAMP WITH TIME ZONE,
  next_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  
  -- Step history
  steps_completed JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for workflow states
CREATE INDEX idx_onesignal_workflow_states_user_workflow ON onesignal_user_workflow_states(user_id, workflow_id);
CREATE INDEX idx_onesignal_workflow_states_next_step ON onesignal_user_workflow_states(next_step_at) WHERE status = 'active';

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE onesignal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_automated_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onesignal_user_workflow_states ENABLE ROW LEVEL SECURITY;

-- Admin policies (admins can access everything)
CREATE POLICY "Admin full access to onesignal_config" ON onesignal_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to onesignal_segments" ON onesignal_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to onesignal_campaigns" ON onesignal_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to onesignal_campaign_templates" ON onesignal_campaign_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to onesignal_automated_workflows" ON onesignal_automated_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User policies (users can only access their own data)
CREATE POLICY "Users can manage their own subscription" ON onesignal_user_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own tags" ON onesignal_user_tags
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own notification events" ON onesignal_notification_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own civic engagement events" ON civic_engagement_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own workflow states" ON onesignal_user_workflow_states
  FOR SELECT USING (user_id = auth.uid());

-- Service role policies (for app functionality)
CREATE POLICY "Service role can insert notification events" ON onesignal_notification_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert civic engagement events" ON civic_engagement_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage workflow states" ON onesignal_user_workflow_states
  FOR ALL WITH CHECK (true);

-- =============================================================================
-- Triggers for updated_at timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at columns
CREATE TRIGGER update_onesignal_config_updated_at BEFORE UPDATE ON onesignal_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_user_subscriptions_updated_at BEFORE UPDATE ON onesignal_user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_user_tags_updated_at BEFORE UPDATE ON onesignal_user_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_segments_updated_at BEFORE UPDATE ON onesignal_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_campaigns_updated_at BEFORE UPDATE ON onesignal_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_campaign_templates_updated_at BEFORE UPDATE ON onesignal_campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_automated_workflows_updated_at BEFORE UPDATE ON onesignal_automated_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onesignal_user_workflow_states_updated_at BEFORE UPDATE ON onesignal_user_workflow_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Useful Views for Analytics
-- =============================================================================

-- Campaign performance view
CREATE OR REPLACE VIEW onesignal_campaign_performance AS
SELECT 
  c.id,
  c.campaign_name,
  c.campaign_type,
  c.status,
  c.sent_count,
  c.delivered_count,
  c.opened_count,
  c.clicked_count,
  c.conversion_count,
  CASE 
    WHEN c.sent_count > 0 THEN ROUND((c.delivered_count::DECIMAL / c.sent_count) * 100, 2)
    ELSE 0 
  END as delivery_rate,
  CASE 
    WHEN c.delivered_count > 0 THEN ROUND((c.opened_count::DECIMAL / c.delivered_count) * 100, 2)
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN c.opened_count > 0 THEN ROUND((c.clicked_count::DECIMAL / c.opened_count) * 100, 2)
    ELSE 0 
  END as click_through_rate,
  CASE 
    WHEN c.clicked_count > 0 THEN ROUND((c.conversion_count::DECIMAL / c.clicked_count) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  c.created_at,
  c.sent_at,
  c.completed_at
FROM onesignal_campaigns c;

-- User engagement summary view
CREATE OR REPLACE VIEW onesignal_user_engagement_summary AS
SELECT 
  u.user_id,
  u.civic_engagement_level,
  u.quiz_completion_rate,
  u.voting_status,
  u.location_state,
  s.is_subscribed,
  s.push_enabled,
  s.last_active,
  COUNT(e.id) as total_notifications_received,
  COUNT(CASE WHEN e.event_type = 'opened' THEN 1 END) as notifications_opened,
  COUNT(ce.id) as civic_actions_taken,
  CASE 
    WHEN COUNT(e.id) > 0 THEN ROUND((COUNT(CASE WHEN e.event_type = 'opened' THEN 1 END)::DECIMAL / COUNT(e.id)) * 100, 2)
    ELSE 0 
  END as engagement_rate
FROM onesignal_user_tags u
LEFT JOIN onesignal_user_subscriptions s ON u.user_id = s.user_id
LEFT JOIN onesignal_notification_events e ON u.user_id = e.user_id
LEFT JOIN civic_engagement_events ce ON u.user_id = ce.user_id
GROUP BY u.user_id, u.civic_engagement_level, u.quiz_completion_rate, u.voting_status, u.location_state, s.is_subscribed, s.push_enabled, s.last_active;

-- =============================================================================
-- Helpful Functions
-- =============================================================================

-- Function to get user count for a segment criteria
CREATE OR REPLACE FUNCTION get_segment_user_count(criteria JSONB)
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- This is a simplified version - you'd implement actual filtering logic
  SELECT COUNT(*) INTO user_count
  FROM onesignal_user_tags
  WHERE 
    CASE 
      WHEN criteria ? 'civic_engagement_level' THEN civic_engagement_level = (criteria->>'civic_engagement_level')
      ELSE TRUE
    END
    AND
    CASE 
      WHEN criteria ? 'location_state' THEN location_state = (criteria->>'location_state')
      ELSE TRUE
    END;
  
  RETURN COALESCE(user_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update segment user counts
CREATE OR REPLACE FUNCTION update_segment_user_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE onesignal_segments 
  SET actual_user_count = get_segment_user_count(criteria),
      last_sync = CURRENT_TIMESTAMP,
      sync_status = 'synced'
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Sample Data Insertion (for development/testing)
-- =============================================================================

-- Insert default OneSignal configuration (will need to be updated with real values)
INSERT INTO onesignal_config (
  app_id, 
  app_name, 
  rest_api_key, 
  user_auth_key, 
  is_active,
  environment
) VALUES (
  'your-onesignal-app-id',
  'CivicSense',
  'your-rest-api-key',
  'your-user-auth-key',
  false, -- Disabled by default until configured
  'development'
) ON CONFLICT (app_id) DO NOTHING;

-- Insert default segments
INSERT INTO onesignal_segments (segment_name, description, criteria, segment_type, created_by) 
VALUES 
  ('All Users', 'All subscribed users', '{}', 'custom', NULL),
  ('Beginner Civic Learners', 'Users who are new to civic education', '{"civic_engagement_level": "beginner"}', 'civic_engagement', NULL),
  ('Active Quiz Takers', 'Users with high quiz completion rates', '{"quiz_completion_rate": {"min": 70}}', 'civic_engagement', NULL),
  ('Registered Voters', 'Users who are registered to vote', '{"voting_status": "registered"}', 'voting', NULL),
  ('Breaking News Subscribers', 'Users who want urgent civic news', '{"notification_preferences": {"breaking_news": true}}', 'custom', NULL)
ON CONFLICT DO NOTHING;

-- Insert campaign templates
INSERT INTO onesignal_campaign_templates (
  template_name, 
  template_type, 
  title_template, 
  message_template,
  available_variables,
  civic_action_steps_template
) VALUES 
  (
    'Quiz Reminder', 
    'quiz_reminder',
    'Time for your civic quiz, {user_name}!',
    'Test your knowledge on {quiz_topic}. Every question makes you a more informed citizen.',
    ARRAY['user_name', 'quiz_topic', 'streak_count'],
    ARRAY['Take the quiz now', 'Share with friends', 'Explore related topics']
  ),
  (
    'Voting Alert',
    'voting_alert', 
    'Important: Election in {days_until_election} days',
    'Make your voice heard, {user_name}. Find your polling location and candidate information.',
    ARRAY['user_name', 'days_until_election', 'location_state'],
    ARRAY['Find polling location', 'Research candidates', 'Register to vote', 'Set voting reminder']
  ),
  (
    'Breaking Civic News',
    'news_update',
    'Breaking: {news_headline}',
    'This affects your community, {user_name}. {news_summary}',
    ARRAY['user_name', 'news_headline', 'news_summary'],
    ARRAY['Read full story', 'Contact representatives', 'Share your opinion', 'Learn more about the issue']
  )
ON CONFLICT DO NOTHING; 