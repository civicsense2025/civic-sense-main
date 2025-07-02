-- Pod Settings and Management System
-- This migration creates the complete infrastructure for pod customization and management

BEGIN;

-- Create pod settings table for customizable pod-wide settings
CREATE TABLE IF NOT EXISTS pod_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    
    -- Basic Settings
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    welcome_message TEXT,
    
    -- Time Management Settings
    daily_time_limit_minutes INTEGER DEFAULT 60 CHECK (daily_time_limit_minutes > 0),
    allowed_start_time TIME DEFAULT '15:00',
    allowed_end_time TIME DEFAULT '20:00',
    allowed_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- Monday = 1, Sunday = 7
    
    -- Feature Access Settings
    can_access_multiplayer BOOLEAN DEFAULT TRUE,
    can_access_chat BOOLEAN DEFAULT FALSE,
    can_share_progress BOOLEAN DEFAULT TRUE,
    can_view_leaderboards BOOLEAN DEFAULT TRUE,
    require_parent_approval_for_friends BOOLEAN DEFAULT TRUE,
    
    -- Content Settings
    max_difficulty_level INTEGER DEFAULT 5 CHECK (max_difficulty_level BETWEEN 1 AND 5),
    blocked_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    allow_sensitive_topics BOOLEAN DEFAULT FALSE,
    
    -- Monitoring Settings
    send_progress_reports BOOLEAN DEFAULT TRUE,
    report_frequency TEXT DEFAULT 'weekly' CHECK (report_frequency IN ('daily', 'weekly', 'monthly')),
    alert_on_inappropriate_content BOOLEAN DEFAULT TRUE,
    track_detailed_activity BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(pod_id)
);

-- Create member individual settings table for per-member customizations
CREATE TABLE IF NOT EXISTS member_individual_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Time Management Overrides
    override_time_limits BOOLEAN DEFAULT FALSE,
    daily_time_limit_minutes INTEGER CHECK (daily_time_limit_minutes > 0),
    allowed_start_time TIME,
    allowed_end_time TIME,
    allowed_days INTEGER[],
    
    -- Content Filter Overrides  
    override_content_filter BOOLEAN DEFAULT FALSE,
    content_filter_level TEXT CHECK (content_filter_level IN ('none', 'light', 'moderate', 'strict')),
    blocked_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    max_difficulty_level INTEGER CHECK (max_difficulty_level BETWEEN 1 AND 5),
    
    -- Feature Access Overrides
    override_feature_access BOOLEAN DEFAULT FALSE,
    can_access_multiplayer BOOLEAN,
    can_access_chat BOOLEAN,
    can_share_progress BOOLEAN,
    can_view_leaderboards BOOLEAN,
    
    -- Monitoring Overrides
    override_monitoring BOOLEAN DEFAULT FALSE,
    send_progress_reports BOOLEAN,
    report_frequency TEXT CHECK (report_frequency IN ('daily', 'weekly', 'monthly')),
    alert_on_inappropriate_content BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(pod_id, user_id)
);

-- Create pod invite links table for invite management
CREATE TABLE IF NOT EXISTS pod_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    
    -- Invite Details
    invite_code TEXT NOT NULL UNIQUE,
    invite_url TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Usage Limits
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    
    -- Access Control
    allowed_roles TEXT[] DEFAULT ARRAY['member']::TEXT[],
    require_approval BOOLEAN DEFAULT FALSE,
    age_restrictions JSONB DEFAULT '{}'::JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create pod join requests table for approval workflow
CREATE TABLE IF NOT EXISTS pod_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL,
    invite_link_id UUID REFERENCES pod_invite_links(id) ON DELETE SET NULL,
    
    -- Request Details
    message TEXT,
    requester_age INTEGER,
    requested_role TEXT DEFAULT 'member',
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(pod_id, requester_id) -- Prevent duplicate requests
);

-- Create pod activity log for tracking member actions
CREATE TABLE IF NOT EXISTS pod_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Activity Details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'joined', 'left', 'quiz_completed', 'message_sent', 
        'achievement_earned', 'helped_member', 'content_flagged'
    )),
    activity_data JSONB DEFAULT '{}'::JSONB,
    
    -- Context
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pod_settings_pod_id ON pod_settings(pod_id);
CREATE INDEX IF NOT EXISTS idx_member_settings_pod_user ON member_individual_settings(pod_id, user_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_pod_id ON pod_invite_links(pod_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON pod_invite_links(invite_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_join_requests_pod_status ON pod_join_requests(pod_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester ON pod_join_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_log_pod_time ON pod_activity_log(pod_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_time ON pod_activity_log(user_id, created_at DESC);

-- Set up RLS policies
ALTER TABLE pod_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_individual_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_activity_log ENABLE ROW LEVEL SECURITY;

-- Pod Settings Policies
CREATE POLICY "Pod settings viewable by pod members" ON pod_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_settings.pod_id
            AND pm.user_id = auth.uid()
            AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Pod settings editable by pod admins" ON pod_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_settings.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

-- Member Settings Policies
CREATE POLICY "Member settings viewable by pod admins and self" ON member_individual_settings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = member_individual_settings.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Member settings editable by pod admins" ON member_individual_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = member_individual_settings.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

-- Invite Links Policies
CREATE POLICY "Invite links viewable by pod members" ON pod_invite_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_invite_links.pod_id
            AND pm.user_id = auth.uid()
            AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Invite links manageable by pod admins" ON pod_invite_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_invite_links.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

-- Join Requests Policies
CREATE POLICY "Join requests viewable by pod admins and requester" ON pod_join_requests
    FOR SELECT USING (
        requester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_join_requests.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Join requests creatable by anyone" ON pod_join_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Join requests manageable by pod admins" ON pod_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_join_requests.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

-- Activity Log Policies
CREATE POLICY "Activity log viewable by pod admins" ON pod_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_activity_log.pod_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
            AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Activity log insertable by pod members" ON pod_activity_log
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM pod_memberships pm
            WHERE pm.pod_id = pod_activity_log.pod_id
            AND pm.user_id = auth.uid()
            AND pm.membership_status = 'active'
        )
    );

-- Functions for automatic pod settings creation
CREATE OR REPLACE FUNCTION create_default_pod_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pod_settings (pod_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings when a pod is created
CREATE TRIGGER trigger_create_default_pod_settings
    AFTER INSERT ON learning_pods
    FOR EACH ROW
    EXECUTE FUNCTION create_default_pod_settings();

-- Function to log pod activities
CREATE OR REPLACE FUNCTION log_pod_activity(
    p_pod_id UUID,
    p_user_id UUID,
    p_activity_type TEXT,
    p_activity_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO pod_activity_log (pod_id, user_id, activity_type, activity_data)
    VALUES (p_pod_id, p_user_id, p_activity_type, p_activity_data)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective member settings (pod defaults + individual overrides)
CREATE OR REPLACE FUNCTION get_effective_member_settings(
    p_pod_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    pod_settings_data RECORD;
    member_settings_data RECORD;
    effective_settings JSONB;
BEGIN
    -- Get pod default settings
    SELECT * INTO pod_settings_data FROM pod_settings WHERE pod_id = p_pod_id;
    
    -- Get member individual settings
    SELECT * INTO member_settings_data FROM member_individual_settings 
    WHERE pod_id = p_pod_id AND user_id = p_user_id;
    
    -- Build effective settings JSON
    effective_settings := jsonb_build_object(
        'daily_time_limit_minutes', 
        CASE WHEN member_settings_data.override_time_limits THEN 
            member_settings_data.daily_time_limit_minutes 
        ELSE 
            pod_settings_data.daily_time_limit_minutes 
        END,
        
        'allowed_start_time',
        CASE WHEN member_settings_data.override_time_limits THEN 
            member_settings_data.allowed_start_time 
        ELSE 
            pod_settings_data.allowed_start_time 
        END,
        
        'allowed_end_time',
        CASE WHEN member_settings_data.override_time_limits THEN 
            member_settings_data.allowed_end_time 
        ELSE 
            pod_settings_data.allowed_end_time 
        END,
        
        'can_access_multiplayer',
        CASE WHEN member_settings_data.override_feature_access THEN 
            member_settings_data.can_access_multiplayer 
        ELSE 
            pod_settings_data.can_access_multiplayer 
        END,
        
        'can_access_chat',
        CASE WHEN member_settings_data.override_feature_access THEN 
            member_settings_data.can_access_chat 
        ELSE 
            pod_settings_data.can_access_chat 
        END,
        
        'content_filter_level',
        CASE WHEN member_settings_data.override_content_filter THEN 
            member_settings_data.content_filter_level 
        ELSE 
            (SELECT content_filter_level FROM learning_pods WHERE id = p_pod_id)
        END
    );
    
    RETURN effective_settings;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_pod_settings_updated_at
    BEFORE UPDATE ON pod_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_settings_updated_at
    BEFORE UPDATE ON member_individual_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invite_links_updated_at
    BEFORE UPDATE ON pod_invite_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT; 