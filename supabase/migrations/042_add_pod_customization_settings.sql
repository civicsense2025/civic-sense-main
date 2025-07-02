-- Add customization options and settings for learning pods
-- Migration: 042_add_pod_customization_settings.sql

BEGIN;

-- Add missing columns to learning_pods table
ALTER TABLE learning_pods 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Time Management Settings
ADD COLUMN IF NOT EXISTS daily_time_limit_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS allowed_start_time TIME DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS allowed_end_time TIME DEFAULT '20:00',
ADD COLUMN IF NOT EXISTS allowed_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],

-- Feature Access Settings
ADD COLUMN IF NOT EXISTS can_access_multiplayer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_access_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_share_progress BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_leaderboards BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS require_parent_approval_for_friends BOOLEAN DEFAULT TRUE,

-- Content & Safety Settings
ADD COLUMN IF NOT EXISTS max_difficulty_level INTEGER DEFAULT 5 CHECK (max_difficulty_level >= 1 AND max_difficulty_level <= 5),
ADD COLUMN IF NOT EXISTS blocked_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS allow_sensitive_topics BOOLEAN DEFAULT FALSE,

-- Monitoring & Reporting Settings
ADD COLUMN IF NOT EXISTS send_progress_reports BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'weekly' CHECK (report_frequency IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS alert_on_inappropriate_content BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS track_detailed_activity BOOLEAN DEFAULT TRUE,

-- Classroom Integration Settings
ADD COLUMN IF NOT EXISTS classroom_course_id TEXT,
ADD COLUMN IF NOT EXISTS classroom_integration_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS roster_last_synced TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grade_passback_enabled BOOLEAN DEFAULT FALSE,

-- Discovery & Visibility Settings
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS target_age_range TEXT DEFAULT 'all_ages' CHECK (target_age_range IN ('elementary', 'middle_school', 'high_school', 'adult', 'all_ages')),
ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS topics_covered TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_pods_is_public ON learning_pods(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_pods_pod_type ON learning_pods(pod_type);
CREATE INDEX IF NOT EXISTS idx_learning_pods_target_age_range ON learning_pods(target_age_range);
CREATE INDEX IF NOT EXISTS idx_learning_pods_activity_score ON learning_pods(activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_learning_pods_classroom_course ON learning_pods(classroom_course_id) WHERE classroom_course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_pods_updated_at ON learning_pods(updated_at);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_pods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_learning_pods_updated_at ON learning_pods;
CREATE TRIGGER trigger_learning_pods_updated_at
    BEFORE UPDATE ON learning_pods
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_pods_updated_at();

-- Drop any existing pod_discovery table or view
DROP VIEW IF EXISTS pod_discovery CASCADE;
DROP TABLE IF EXISTS pod_discovery CASCADE;

-- Create pod_discovery view for public pod discovery
CREATE VIEW pod_discovery AS
SELECT 
    learning_pods.id,
    learning_pods.id AS pod_id,
    COALESCE(learning_pods.display_name, learning_pods.pod_name) AS display_name,
    COALESCE(learning_pods.short_description, learning_pods.description, 'A learning pod for civic education') AS short_description,
    learning_pods.banner_image_url,
    learning_pods.target_age_range,
    learning_pods.content_filter_level AS difficulty_level_numeric,
    CASE learning_pods.content_filter_level
        WHEN 'none' THEN 1
        WHEN 'light' THEN 2  
        WHEN 'moderate' THEN 3
        WHEN 'strict' THEN 4
        ELSE 3
    END AS difficulty_level,
    learning_pods.topics_covered,
    learning_pods.search_tags,
    (SELECT COUNT(*) FROM pod_memberships pm WHERE pm.pod_id = learning_pods.id AND pm.membership_status = 'active') AS member_count,
    learning_pods.activity_score,
    learning_pods.average_rating,
    learning_pods.total_ratings,
    learning_pods.is_featured,
    learning_pods.pod_type,
    learning_pods.created_at
FROM learning_pods
WHERE learning_pods.is_public = TRUE;

-- Create individual member settings table for per-member customization
CREATE TABLE IF NOT EXISTS pod_member_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time Management Overrides
    override_time_limits BOOLEAN DEFAULT FALSE,
    daily_time_limit_minutes INTEGER,
    allowed_start_time TIME,
    allowed_end_time TIME,
    allowed_days INTEGER[],
    
    -- Content Filter Overrides
    override_content_filter BOOLEAN DEFAULT FALSE,
    content_filter_level TEXT CHECK (content_filter_level IN ('none', 'light', 'moderate', 'strict')),
    blocked_categories TEXT[],
    max_difficulty_level INTEGER CHECK (max_difficulty_level >= 1 AND max_difficulty_level <= 5),
    allow_sensitive_topics BOOLEAN,
    
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
    track_detailed_activity BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(pod_id, user_id)
);

-- Create indexes for pod_member_settings
CREATE INDEX IF NOT EXISTS idx_pod_member_settings_pod_id ON pod_member_settings(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_member_settings_user_id ON pod_member_settings(user_id);

-- Add RLS policies for pod_member_settings
ALTER TABLE pod_member_settings ENABLE ROW LEVEL SECURITY;

-- Members can view their own settings
CREATE POLICY "Members can view their own settings" ON pod_member_settings
FOR SELECT USING (
    auth.uid() = user_id
);

-- Pod admins can manage member settings
CREATE POLICY "Pod admins can manage member settings" ON pod_member_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM pod_memberships pm
        WHERE pm.pod_id = pod_member_settings.pod_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
        AND pm.membership_status = 'active'
    )
);

-- Add trigger for pod_member_settings updated_at
CREATE OR REPLACE FUNCTION update_pod_member_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pod_member_settings_updated_at ON pod_member_settings;
CREATE TRIGGER trigger_pod_member_settings_updated_at
    BEFORE UPDATE ON pod_member_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pod_member_settings_updated_at();

-- Create pod_invite_links table for shareable invite links
CREATE TABLE IF NOT EXISTS pod_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    invite_code TEXT NOT NULL UNIQUE,
    invite_url TEXT NOT NULL,
    description TEXT,
    
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    
    allowed_roles TEXT[] DEFAULT ARRAY['member'],
    require_approval BOOLEAN DEFAULT FALSE,
    age_restrictions JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for pod_invite_links
CREATE INDEX IF NOT EXISTS idx_pod_invite_links_pod_id ON pod_invite_links(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_invite_links_invite_code ON pod_invite_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_pod_invite_links_created_by ON pod_invite_links(created_by);
CREATE INDEX IF NOT EXISTS idx_pod_invite_links_expires_at ON pod_invite_links(expires_at);

-- Add RLS policies for pod_invite_links
ALTER TABLE pod_invite_links ENABLE ROW LEVEL SECURITY;

-- Pod admins can manage invite links
CREATE POLICY "Pod admins can manage invite links" ON pod_invite_links
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM pod_memberships pm
        WHERE pm.pod_id = pod_invite_links.pod_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'parent', 'organizer', 'teacher')
        AND pm.membership_status = 'active'
    )
);

-- Public can view active, non-expired invite links for joining
CREATE POLICY "Public can view active invite links" ON pod_invite_links
FOR SELECT USING (
    is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Add trigger for pod_invite_links updated_at
CREATE OR REPLACE FUNCTION update_pod_invite_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pod_invite_links_updated_at ON pod_invite_links;
CREATE TRIGGER trigger_pod_invite_links_updated_at
    BEFORE UPDATE ON pod_invite_links
    FOR EACH ROW
    EXECUTE FUNCTION update_pod_invite_links_updated_at();

-- Add some helpful comments
COMMENT ON TABLE learning_pods IS 'Learning pods with comprehensive customization settings';
COMMENT ON TABLE pod_member_settings IS 'Individual member settings that override pod-wide settings';
COMMENT ON TABLE pod_invite_links IS 'Shareable invite links for pods with usage tracking';
COMMENT ON VIEW pod_discovery IS 'Public view for discovering available learning pods';

-- Update existing pods with sensible defaults based on pod type
UPDATE learning_pods SET
    description = CASE 
        WHEN pod_type = 'family' THEN COALESCE(family_name, pod_name) || ' - A safe space for family civic learning'
        WHEN pod_type = 'classroom' THEN pod_name || ' - Classroom civic education pod'
        WHEN pod_type = 'study_group' THEN pod_name || ' - Collaborative civic learning group'
        ELSE pod_name || ' - Civic education learning pod'
    END,
    can_access_chat = CASE 
        WHEN pod_type = 'family' THEN FALSE
        WHEN pod_type = 'classroom' THEN FALSE
        ELSE TRUE
    END,
    daily_time_limit_minutes = CASE 
        WHEN pod_type = 'family' THEN 45
        WHEN pod_type = 'classroom' THEN 90
        ELSE 60
    END,
    target_age_range = CASE 
        WHEN pod_type = 'family' THEN 'all_ages'
        WHEN pod_type = 'classroom' THEN 'high_school'
        ELSE 'adult'
    END
WHERE description IS NULL;

COMMIT; 