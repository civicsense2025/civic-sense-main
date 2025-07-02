-- ============================================================================
-- GENERIC NOTIFICATION SYSTEM MIGRATION
-- ============================================================================
-- Provider-agnostic notification system that can work with OneSignal, 
-- Firebase, email, SMS, or any other notification provider
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- NOTIFICATION PROVIDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL UNIQUE, -- 'onesignal', 'firebase', 'email', 'sms'
  provider_type TEXT NOT NULL, -- 'push', 'email', 'sms', 'in_app'
  is_active BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}', -- Provider-specific config
  rate_limits JSONB DEFAULT '{}', -- Rate limiting settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER NOTIFICATION SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES notification_providers(id) ON DELETE CASCADE,
  
  -- Provider-specific subscription data
  external_user_id TEXT, -- OneSignal player_id, Firebase token, email, phone
  subscription_data JSONB DEFAULT '{}', -- Provider-specific data
  
  -- Civic engagement context
  civic_interests TEXT[] DEFAULT '{}',
  engagement_level TEXT DEFAULT 'basic', -- 'basic', 'active', 'engaged', 'advocate'
  location_data JSONB DEFAULT '{}', -- State, district, city for targeting
  
  -- Preferences
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}', -- Frequency, topics, etc.
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_engagement TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, provider_id, external_user_id)
);

-- ============================================================================
-- USER SEGMENTS FOR TARGETING
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_name TEXT NOT NULL,
  description TEXT,
  
  -- Targeting criteria
  targeting_rules JSONB NOT NULL DEFAULT '{}', -- Flexible targeting rules
  estimated_user_count INTEGER DEFAULT 0,
  actual_user_count INTEGER DEFAULT 0,
  
  -- Civic focus
  civic_category TEXT, -- 'voting', 'local_government', 'federal_policy', etc.
  engagement_criteria JSONB DEFAULT '{}',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'quiz_reminder', 'voting_alert', 'news_update', 'civic_action'
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  rich_content JSONB DEFAULT '{}', -- Images, buttons, etc.
  
  -- Targeting
  target_segments UUID[] DEFAULT '{}', -- References to notification_segments
  targeting_criteria JSONB DEFAULT '{}', -- Additional targeting
  
  -- Delivery
  providers UUID[] DEFAULT '{}', -- Which providers to use
  delivery_schedule JSONB DEFAULT '{}', -- When to send
  
  -- Civic context
  civic_action_steps TEXT[] DEFAULT '{}',
  civic_urgency_level INTEGER DEFAULT 1, -- 1-5 scale
  civic_category TEXT,
  
  -- Status and tracking
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'paused'
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Civic actions taken
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'civic_reminder', 'voting_alert', 'educational'
  
  -- Template content
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  rich_content_template JSONB DEFAULT '{}',
  
  -- Template variables
  template_variables JSONB DEFAULT '{}', -- Available variables
  civic_focus TEXT, -- What civic area this template addresses
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION EVENTS (Analytics & Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES notification_providers(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'converted'
  external_event_id TEXT, -- Provider's event ID
  
  -- Civic engagement tracking
  civic_action_taken TEXT, -- What action did the user take
  civic_impact_score INTEGER, -- How impactful was this engagement
  
  -- Context
  event_data JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CIVIC ENGAGEMENT TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS civic_engagement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_campaign_id UUID REFERENCES notification_campaigns(id),
  
  -- Engagement details
  engagement_type TEXT NOT NULL, -- 'quiz_completed', 'voted', 'contacted_representative', etc.
  engagement_context JSONB DEFAULT '{}',
  
  -- Impact measurement
  civic_knowledge_increase INTEGER, -- 0-100 scale
  democratic_participation_score INTEGER, -- 0-100 scale
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATED WORKFLOWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- 'onboarding', 'quiz_sequence', 'civic_journey'
  
  -- Trigger conditions
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Workflow steps
  workflow_steps JSONB NOT NULL DEFAULT '[]', -- Array of steps
  
  -- Civic education context
  civic_learning_objectives TEXT[] DEFAULT '{}',
  estimated_completion_time INTEGER, -- minutes
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER WORKFLOW STATE TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_workflow_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES notification_workflows(id) ON DELETE CASCADE,
  
  -- Current state
  current_step INTEGER DEFAULT 0,
  workflow_status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
  
  -- Progress tracking
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Engagement metrics
  civic_actions_taken INTEGER DEFAULT 0,
  knowledge_gained INTEGER DEFAULT 0, -- 0-100 scale
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, workflow_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Subscription lookups
CREATE INDEX idx_notification_subscriptions_user_provider 
ON notification_subscriptions(user_id, provider_id);

CREATE INDEX idx_notification_subscriptions_external_id 
ON notification_subscriptions(external_user_id) 
WHERE external_user_id IS NOT NULL;

CREATE INDEX idx_notification_subscriptions_engagement 
ON notification_subscriptions(engagement_level, is_active);

-- Campaign targeting
CREATE INDEX idx_notification_campaigns_status 
ON notification_campaigns(status);

CREATE INDEX idx_notification_campaigns_civic_category 
ON notification_campaigns(civic_category);

CREATE INDEX idx_notification_campaigns_schedule 
ON notification_campaigns(scheduled_at) 
WHERE scheduled_at IS NOT NULL;

-- Event tracking
CREATE INDEX idx_notification_events_campaign_user 
ON notification_events(campaign_id, user_id);

CREATE INDEX idx_notification_events_type_time 
ON notification_events(event_type, created_at);

-- Civic engagement analytics
CREATE INDEX idx_civic_engagement_events_user_time 
ON civic_engagement_events(user_id, created_at);

CREATE INDEX idx_civic_engagement_events_type 
ON civic_engagement_events(engagement_type);

-- Workflow state tracking
CREATE INDEX idx_user_workflow_states_user 
ON user_workflow_states(user_id, workflow_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE notification_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflow_states ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions and events
CREATE POLICY "Users can view own subscriptions" 
ON notification_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" 
ON notification_subscriptions FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification events" 
ON notification_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own civic engagement" 
ON civic_engagement_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workflow states" 
ON user_workflow_states FOR SELECT 
USING (auth.uid() = user_id);

-- Admin-only access for management tables
CREATE POLICY "Admin access to providers" 
ON notification_providers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access to segments" 
ON notification_segments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access to campaigns" 
ON notification_campaigns FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access to templates" 
ON notification_templates FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin access to workflows" 
ON notification_workflows FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- ============================================================================
-- TRIGGER FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_notification_providers_updated_at 
BEFORE UPDATE ON notification_providers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_subscriptions_updated_at 
BEFORE UPDATE ON notification_subscriptions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_segments_updated_at 
BEFORE UPDATE ON notification_segments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_campaigns_updated_at 
BEFORE UPDATE ON notification_campaigns 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
BEFORE UPDATE ON notification_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_workflows_updated_at 
BEFORE UPDATE ON notification_workflows 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Campaign performance view
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
  c.id,
  c.campaign_name,
  c.campaign_type,
  c.civic_category,
  c.sent_count,
  c.delivered_count,
  c.opened_count,
  c.clicked_count,
  c.conversion_count,
  CASE 
    WHEN c.sent_count > 0 THEN ROUND((c.delivered_count::FLOAT / c.sent_count) * 100, 2)
    ELSE 0 
  END as delivery_rate,
  CASE 
    WHEN c.delivered_count > 0 THEN ROUND((c.opened_count::FLOAT / c.delivered_count) * 100, 2)
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN c.opened_count > 0 THEN ROUND((c.clicked_count::FLOAT / c.opened_count) * 100, 2)
    ELSE 0 
  END as click_rate,
  CASE 
    WHEN c.clicked_count > 0 THEN ROUND((c.conversion_count::FLOAT / c.clicked_count) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  c.created_at,
  c.sent_at,
  c.completed_at
FROM notification_campaigns c;

-- User engagement view
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT s.id) as active_subscriptions,
  COUNT(DISTINCT ne.id) as total_notifications_received,
  COUNT(DISTINCT CASE WHEN ne.event_type = 'opened' THEN ne.id END) as notifications_opened,
  COUNT(DISTINCT CASE WHEN ne.event_type = 'clicked' THEN ne.id END) as notifications_clicked,
  COUNT(DISTINCT cee.id) as civic_actions_taken,
  AVG(cee.civic_knowledge_increase) as avg_knowledge_increase,
  AVG(cee.democratic_participation_score) as avg_participation_score,
  MAX(ne.created_at) as last_notification_interaction,
  MAX(cee.created_at) as last_civic_engagement
FROM auth.users u
LEFT JOIN notification_subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN notification_events ne ON u.id = ne.user_id
LEFT JOIN civic_engagement_events cee ON u.id = cee.user_id
GROUP BY u.id, u.email;

-- ============================================================================
-- INSERT INITIAL DATA
-- ============================================================================

-- Insert default notification providers
INSERT INTO notification_providers (provider_name, provider_type, configuration) VALUES
('onesignal', 'push', '{"supports_segmentation": true, "supports_rich_content": true}'),
('email', 'email', '{"supports_templates": true, "supports_scheduling": true}'),
('sms', 'sms', '{"character_limit": 160, "supports_links": true}')
ON CONFLICT (provider_name) DO NOTHING;

-- Insert default civic templates
INSERT INTO notification_templates (template_name, template_type, title_template, message_template, civic_focus) VALUES
('Voting Reminder', 'voting_alert', 'Your Vote Matters: {{election_name}}', 'Election day is {{days_until}} days away. Your vote is your voice in democracy. Find your polling location: {{polling_url}}', 'voting'),
('Quiz Completion', 'civic_reminder', 'Keep Learning: {{topic_name}}', 'You completed {{quiz_name}}! Continue building civic knowledge with our next challenge.', 'education'),
('Local Government Alert', 'civic_action', 'Your City Needs You: {{issue_name}}', 'A decision affecting your community is being made. Take action: {{action_url}}', 'local_government'),
('Bill Tracking', 'legislative_update', 'Bill Update: {{bill_title}}', 'The bill you''re following has changed status. {{bill_status}} - Stay informed: {{bill_url}}', 'federal_policy')
ON CONFLICT (template_name) DO NOTHING;

-- Insert default segments
INSERT INTO notification_segments (segment_name, description, targeting_rules, civic_category) VALUES
('New Users', 'Users who joined in the last 30 days', '{"user_age_days": {"max": 30}}', 'onboarding'),
('Active Learners', 'Users who complete quizzes regularly', '{"quiz_completion_rate": {"min": 0.7}}', 'education'),
('Voting Eligible', 'Users who are eligible to vote', '{"age": {"min": 18}, "voting_eligible": true}', 'voting'),
('Local Government Interested', 'Users interested in local civic issues', '{"civic_interests": ["local_government", "city_council", "school_board"]}', 'local_government')
ON CONFLICT (segment_name) DO NOTHING; 