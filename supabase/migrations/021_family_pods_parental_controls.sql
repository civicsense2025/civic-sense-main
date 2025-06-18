-- ============================================
-- Learning Pods & Parental Controls System Migration
-- ============================================
-- Creates learning pods for families, friends, classrooms, campaigns, study groups, etc.

-- 1. LEARNING PODS TABLE
-- Groups related users for collaborative learning (families, friends, classrooms, campaigns, etc.)
CREATE TABLE learning_pods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_name VARCHAR(100) NOT NULL,
    pod_type VARCHAR(20) NOT NULL DEFAULT 'family' CHECK (pod_type IN ('family', 'friends', 'classroom', 'study_group', 'campaign', 'organization', 'book_club', 'debate_team')),
    pod_description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT true,
    join_code VARCHAR(20) UNIQUE, -- Optional join code for easy sharing
    max_members INTEGER DEFAULT 10 CHECK (max_members BETWEEN 2 AND 50),
    
    -- Family-specific settings
    family_name VARCHAR(100), -- For family pods
    parent_email VARCHAR(255), -- Primary parent contact
    
    -- Content filtering settings
    content_filter_level VARCHAR(20) DEFAULT 'moderate' CHECK (content_filter_level IN ('none', 'light', 'moderate', 'strict')),
    allow_sensitive_topics BOOLEAN DEFAULT true,
    blocked_categories TEXT[] DEFAULT '{}', -- Array of category names to block
    allowed_age_range VARCHAR(20) DEFAULT 'all_ages' CHECK (allowed_age_range IN ('elementary', 'middle_school', 'high_school', 'all_ages')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. POD MEMBERSHIPS TABLE
-- Track who belongs to which pods and their roles
CREATE TABLE pod_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'parent', 'child', 'member', 'moderator', 'organizer', 'volunteer', 'student', 'teacher')),
    
    -- Child-specific fields
    birth_date DATE, -- For age-appropriate content filtering
    grade_level VARCHAR(20), -- 'K', '1', '2', ..., '12', 'college'
    parental_consent BOOLEAN DEFAULT false, -- Required for children under 13
    
    -- Permission settings
    can_invite_members BOOLEAN DEFAULT false,
    can_modify_settings BOOLEAN DEFAULT false,
    can_view_progress BOOLEAN DEFAULT true,
    can_message BOOLEAN DEFAULT true,
    
    -- Status
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('pending', 'active', 'suspended', 'removed')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pod_id, user_id)
);

-- 3. PARENTAL CONTROLS TABLE
-- Detailed parental control settings per child
CREATE TABLE parental_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    
    -- Time restrictions
    daily_time_limit_minutes INTEGER DEFAULT 60 CHECK (daily_time_limit_minutes > 0),
    allowed_start_time TIME DEFAULT '06:00:00',
    allowed_end_time TIME DEFAULT '21:00:00',
    allowed_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
    
    -- Content filtering
    content_filter_level VARCHAR(20) DEFAULT 'moderate' CHECK (content_filter_level IN ('none', 'light', 'moderate', 'strict')),
    blocked_topics TEXT[] DEFAULT '{}', -- Specific topic IDs to block
    blocked_categories TEXT[] DEFAULT '{}', -- Category names to block
    allowed_difficulty_max INTEGER DEFAULT 5 CHECK (allowed_difficulty_max BETWEEN 1 AND 5),
    
    -- Feature restrictions
    can_access_multiplayer BOOLEAN DEFAULT true,
    can_access_chat BOOLEAN DEFAULT false,
    can_share_progress BOOLEAN DEFAULT true,
    can_view_leaderboards BOOLEAN DEFAULT true,
    require_parent_approval_for_friends BOOLEAN DEFAULT true,
    
    -- Monitoring settings
    send_progress_reports BOOLEAN DEFAULT true,
    report_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (report_frequency IN ('daily', 'weekly', 'monthly')),
    alert_on_inappropriate_content BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(parent_user_id, child_user_id, pod_id)
);

-- 4. CONTENT FILTERING RULES TABLE
-- Define what content is appropriate for different age groups and filter levels
CREATE TABLE content_filtering_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    filter_level VARCHAR(20) NOT NULL CHECK (filter_level IN ('none', 'light', 'moderate', 'strict')),
    age_range VARCHAR(20) NOT NULL CHECK (age_range IN ('elementary', 'middle_school', 'high_school', 'all_ages')),
    
    -- Content restrictions
    blocked_keywords TEXT[] DEFAULT '{}',
    blocked_categories TEXT[] DEFAULT '{}',
    blocked_topics TEXT[] DEFAULT '{}',
    max_difficulty_level INTEGER DEFAULT 5,
    
    -- Topic sensitivity levels
    sensitive_topics JSONB DEFAULT '{}', -- { "topic_id": "sensitivity_level" }
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POD ACTIVITIES TABLE
-- Track shared activities and progress within pods
CREATE TABLE pod_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'quiz_completed', 'achievement_earned', 'streak_milestone', 'challenge_completed'
    activity_data JSONB DEFAULT '{}',
    
    -- Visibility settings
    is_visible_to_pod BOOLEAN DEFAULT true,
    is_shared_publicly BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. POD CHALLENGES TABLE
-- Pod challenges and competitions
CREATE TABLE pod_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    challenge_name VARCHAR(200) NOT NULL,
    challenge_description TEXT,
    challenge_type VARCHAR(50) NOT NULL, -- 'quiz_streak', 'topic_mastery', 'points_race', 'accuracy_challenge'
    
    -- Challenge parameters
    target_metric JSONB NOT NULL, -- { "type": "streak", "target": 7 } or { "type": "topics", "count": 5, "categories": ["Government"] }
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Rewards
    reward_type VARCHAR(50), -- 'badge', 'points', 'custom'
    reward_data JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. POD CHALLENGE PARTICIPANTS TABLE
-- Track who's participating in challenges and their progress
CREATE TABLE pod_challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES pod_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    current_progress JSONB DEFAULT '{}', -- Track progress toward challenge goal
    completed_at TIMESTAMP WITH TIME ZONE,
    final_score INTEGER DEFAULT 0,
    rank_position INTEGER,
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- 8. FRIEND REQUESTS TABLE
-- Handle friend requests within and outside of pods
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    request_type VARCHAR(20) DEFAULT 'friend' CHECK (request_type IN ('friend', 'pod_invite')),
    pod_id UUID REFERENCES learning_pods(id) ON DELETE CASCADE,
    
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    
    -- Parental approval for children
    requires_parental_approval BOOLEAN DEFAULT false,
    parent_approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(requester_id, recipient_id, request_type)
);

-- Create indexes for performance
CREATE INDEX idx_learning_pods_created_by ON learning_pods(created_by);
CREATE INDEX idx_learning_pods_type ON learning_pods(pod_type);
CREATE INDEX idx_learning_pods_join_code ON learning_pods(join_code) WHERE join_code IS NOT NULL;

CREATE INDEX idx_pod_memberships_pod_id ON pod_memberships(pod_id);
CREATE INDEX idx_pod_memberships_user_id ON pod_memberships(user_id);
CREATE INDEX idx_pod_memberships_role ON pod_memberships(role);
CREATE INDEX idx_pod_memberships_status ON pod_memberships(membership_status);

CREATE INDEX idx_parental_controls_parent ON parental_controls(parent_user_id);
CREATE INDEX idx_parental_controls_child ON parental_controls(child_user_id);
CREATE INDEX idx_parental_controls_pod ON parental_controls(pod_id);
CREATE INDEX idx_parental_controls_active ON parental_controls(is_active) WHERE is_active = true;

CREATE INDEX idx_content_filtering_rules_level_age ON content_filtering_rules(filter_level, age_range);
CREATE INDEX idx_content_filtering_rules_active ON content_filtering_rules(is_active) WHERE is_active = true;

CREATE INDEX idx_pod_activities_pod_id ON pod_activities(pod_id);
CREATE INDEX idx_pod_activities_user_id ON pod_activities(user_id);
CREATE INDEX idx_pod_activities_type ON pod_activities(activity_type);
CREATE INDEX idx_pod_activities_created_at ON pod_activities(created_at);

CREATE INDEX idx_pod_challenges_pod_id ON pod_challenges(pod_id);
CREATE INDEX idx_pod_challenges_created_by ON pod_challenges(created_by);
CREATE INDEX idx_pod_challenges_active ON pod_challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_pod_challenges_dates ON pod_challenges(start_date, end_date);

CREATE INDEX idx_pod_challenge_participants_challenge ON pod_challenge_participants(challenge_id);
CREATE INDEX idx_pod_challenge_participants_user ON pod_challenge_participants(user_id);

CREATE INDEX idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_parental_approval ON friend_requests(requires_parental_approval) WHERE requires_parental_approval = true;

-- Create triggers for updated_at columns
CREATE TRIGGER update_learning_pods_updated_at 
    BEFORE UPDATE ON learning_pods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parental_controls_updated_at 
    BEFORE UPDATE ON parental_controls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE learning_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_filtering_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Learning Pods: Members can view their pods, admins can manage
CREATE POLICY "Pod members can view their pods" ON learning_pods
    FOR SELECT USING (
        id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND membership_status = 'active'
        )
    );

CREATE POLICY "Pod admins can manage their pods" ON learning_pods
    FOR ALL USING (
        created_by = auth.uid() OR 
        id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent') AND membership_status = 'active'
        )
    );

-- Pod Memberships: Members can view, admins can manage
CREATE POLICY "Users can view pod memberships" ON pod_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent') AND membership_status = 'active'
        )
    );

CREATE POLICY "Pod admins can manage memberships" ON pod_memberships
    FOR ALL USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent') AND membership_status = 'active'
        )
    );

-- Parental Controls: Parents and children can view their own data
CREATE POLICY "Users can view their parental controls" ON parental_controls
    FOR SELECT USING (
        parent_user_id = auth.uid() OR child_user_id = auth.uid()
    );

CREATE POLICY "Parents can manage their children's controls" ON parental_controls
    FOR ALL USING (parent_user_id = auth.uid());

-- Content Filtering Rules: Public read access
CREATE POLICY "Anyone can view content filtering rules" ON content_filtering_rules
    FOR SELECT USING (is_active = true);

-- Pod Activities: Pod members can view
CREATE POLICY "Pod members can view activities" ON pod_activities
    FOR SELECT USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND membership_status = 'active'
        )
    );

CREATE POLICY "Users can create their own activities" ON pod_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Pod Challenges: Pod members can view and participate
CREATE POLICY "Pod members can view challenges" ON pod_challenges
    FOR SELECT USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND membership_status = 'active'
        )
    );

CREATE POLICY "Pod admins can manage challenges" ON pod_challenges
    FOR ALL USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent') AND membership_status = 'active'
        )
    );

-- Challenge Participants: Users can manage their own participation
CREATE POLICY "Users can view challenge participants" ON pod_challenge_participants
    FOR SELECT USING (
        challenge_id IN (
            SELECT c.id FROM pod_challenges c
            JOIN pod_memberships pm ON c.pod_id = pm.pod_id
            WHERE pm.user_id = auth.uid() AND pm.membership_status = 'active'
        )
    );

CREATE POLICY "Users can manage their own participation" ON pod_challenge_participants
    FOR ALL USING (user_id = auth.uid());

-- Friend Requests: Users can view and manage their own requests
CREATE POLICY "Users can view their friend requests" ON friend_requests
    FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can create friend requests" ON friend_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their friend requests" ON friend_requests
    FOR UPDATE USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Insert default content filtering rules
INSERT INTO content_filtering_rules (rule_name, filter_level, age_range, blocked_keywords, blocked_categories, max_difficulty_level) VALUES
-- Elementary (K-5, ages 5-11)
('Elementary Safe', 'strict', 'elementary', 
 ARRAY['violence', 'death', 'war', 'terrorism', 'crime', 'drugs', 'alcohol', 'sexuality', 'abortion', 'controversial'], 
 ARRAY['National Security', 'Justice'], 3),

('Elementary Moderate', 'moderate', 'elementary',
 ARRAY['violence', 'death', 'terrorism', 'crime', 'drugs', 'sexuality', 'abortion'],
 ARRAY[]::TEXT[], 4),

-- Middle School (6-8, ages 11-14)
('Middle School Safe', 'strict', 'middle_school',
 ARRAY['terrorism', 'crime', 'drugs', 'sexuality', 'abortion'],
 ARRAY[]::TEXT[], 4),

('Middle School Moderate', 'moderate', 'middle_school',
 ARRAY['terrorism', 'drugs', 'sexuality'],
 ARRAY[]::TEXT[], 4),

-- High School (9-12, ages 14-18)
('High School Safe', 'strict', 'high_school',
 ARRAY['terrorism', 'drugs'],
 ARRAY[]::TEXT[], 5),

('High School Moderate', 'moderate', 'high_school',
 ARRAY['terrorism'],
 ARRAY[]::TEXT[], 5),

-- All Ages
('All Ages Open', 'none', 'all_ages', ARRAY[]::TEXT[], ARRAY[]::TEXT[], 5),
('All Ages Light', 'light', 'all_ages', ARRAY['terrorism'], ARRAY[]::TEXT[], 5);

-- Create helper functions

-- Function to check if content is appropriate for user
CREATE OR REPLACE FUNCTION is_content_appropriate_for_user(
    p_user_id UUID,
    p_topic_id VARCHAR(100),
    p_category VARCHAR(100),
    p_difficulty INTEGER DEFAULT 1,
    p_keywords TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
    user_age INTEGER;
    user_grade VARCHAR(20);
    control_filter_level VARCHAR(20);
    control_difficulty_max INTEGER;
    control_blocked_topics TEXT[];
    control_blocked_categories TEXT[];
    rules_record RECORD;
    is_appropriate BOOLEAN := true;
BEGIN
    -- Get user's age and parental controls
    SELECT 
        EXTRACT(YEAR FROM AGE(pm.birth_date)) as age,
        pm.grade_level,
        pc.content_filter_level,
        pc.allowed_difficulty_max,
        pc.blocked_topics,
        pc.blocked_categories
    INTO user_age, user_grade, control_filter_level, control_difficulty_max, control_blocked_topics, control_blocked_categories
    FROM pod_memberships pm
    LEFT JOIN parental_controls pc ON pc.child_user_id = pm.user_id AND pc.is_active = true
    WHERE pm.user_id = p_user_id
    AND pm.membership_status = 'active'
    LIMIT 1;
    
    -- If no parental controls found, allow content (adult user)
    IF control_filter_level IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check difficulty level
    IF p_difficulty > control_difficulty_max THEN
        RETURN false;
    END IF;
    
    -- Check blocked topics
    IF p_topic_id = ANY(control_blocked_topics) THEN
        RETURN false;
    END IF;
    
    -- Check blocked categories
    IF p_category = ANY(control_blocked_categories) THEN
        RETURN false;
    END IF;
    
    -- Get applicable content filtering rules
    SELECT * INTO rules_record
    FROM content_filtering_rules
    WHERE filter_level = control_filter_level
    AND (
        (user_age <= 11 AND age_range = 'elementary') OR
        (user_age BETWEEN 12 AND 14 AND age_range = 'middle_school') OR
        (user_age BETWEEN 15 AND 18 AND age_range = 'high_school') OR
        (age_range = 'all_ages')
    )
    AND is_active = true
    ORDER BY 
        CASE age_range 
            WHEN 'elementary' THEN 1
            WHEN 'middle_school' THEN 2  
            WHEN 'high_school' THEN 3
            WHEN 'all_ages' THEN 4
        END
    LIMIT 1;
    
    -- Apply filtering rules if found
    IF rules_record IS NOT NULL THEN
        -- Check blocked keywords
        IF p_keywords && rules_record.blocked_keywords THEN
            RETURN false;
        END IF;
        
        -- Check blocked categories
        IF p_category = ANY(rules_record.blocked_categories) THEN
            RETURN false;
        END IF;
        
        -- Check blocked topics
        IF p_topic_id = ANY(rules_record.blocked_topics) THEN
            RETURN false;
        END IF;
        
        -- Check difficulty
        IF p_difficulty > rules_record.max_difficulty_level THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN is_appropriate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's pod memberships with details
CREATE OR REPLACE FUNCTION get_user_pod_memberships(p_user_id UUID)
RETURNS TABLE (
    pod_id UUID,
    pod_name VARCHAR(100),
    pod_type VARCHAR(20),
    user_role VARCHAR(20),
    member_count BIGINT,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.id,
        fp.pod_name,
        fp.pod_type,
        pm.role,
        (SELECT COUNT(*) FROM pod_memberships WHERE pod_id = fp.id AND membership_status = 'active'),
        (pm.role IN ('admin', 'parent'))
    FROM learning_pods fp
    JOIN pod_memberships pm ON fp.id = pm.pod_id
    WHERE pm.user_id = p_user_id 
    AND pm.membership_status = 'active'
    ORDER BY fp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a learning pod with initial setup
CREATE OR REPLACE FUNCTION create_learning_pod(
    p_creator_id UUID,
    p_pod_name VARCHAR(100),
    p_pod_type VARCHAR(20) DEFAULT 'family',
    p_family_name VARCHAR(100) DEFAULT NULL,
    p_content_filter_level VARCHAR(20) DEFAULT 'moderate'
) RETURNS UUID AS $$
DECLARE
    new_pod_id UUID;
    join_code_val VARCHAR(20);
BEGIN
    -- Generate unique join code
    join_code_val := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Create the pod
    INSERT INTO learning_pods (
        pod_name, pod_type, family_name, created_by, content_filter_level, join_code
    ) VALUES (
        p_pod_name, p_pod_type, p_family_name, p_creator_id, p_content_filter_level, join_code_val
    ) RETURNING id INTO new_pod_id;
    
    -- Add creator as admin
    INSERT INTO pod_memberships (
        pod_id, user_id, role, can_invite_members, can_modify_settings, membership_status
    ) VALUES (
        new_pod_id, p_creator_id, 'admin', true, true, 'active'
    );
    
    RETURN new_pod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON learning_pods TO authenticated;
GRANT ALL ON pod_memberships TO authenticated;
GRANT ALL ON parental_controls TO authenticated;
GRANT ALL ON content_filtering_rules TO authenticated;
GRANT ALL ON pod_activities TO authenticated;
GRANT ALL ON pod_challenges TO authenticated;
GRANT ALL ON pod_challenge_participants TO authenticated;
GRANT ALL ON friend_requests TO authenticated;

GRANT EXECUTE ON FUNCTION is_content_appropriate_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_pod_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION create_learning_pod TO authenticated; 