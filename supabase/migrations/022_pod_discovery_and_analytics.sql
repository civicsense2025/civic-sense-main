-- ============================================
-- Pod Discovery, Sharing & Analytics Migration
-- ============================================
-- Adds pod discovery, shareable links, join requests, and analytics

-- 1. POD INVITE LINKS TABLE
-- Shareable links for joining pods with expiration and usage limits
CREATE TABLE pod_invite_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Link details
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    invite_url TEXT NOT NULL,
    description TEXT,
    
    -- Access control
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Restrictions
    allowed_roles TEXT[] DEFAULT '{"member"}', -- Roles new members can join as
    require_approval BOOLEAN DEFAULT false,
    age_restrictions JSONB DEFAULT '{}', -- { "min_age": 13, "max_age": 18 }
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure invite codes are unique and properly formatted
    CONSTRAINT check_invite_code_format CHECK (invite_code ~ '^[A-Z0-9]{8,20}$')
);

-- 2. POD JOIN REQUESTS TABLE
-- Track requests to join pods (for approval-required pods)
CREATE TABLE pod_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_link_id UUID REFERENCES pod_invite_links(id) ON DELETE SET NULL,
    
    -- Request details
    requested_role VARCHAR(20) DEFAULT 'member',
    message TEXT,
    requester_age INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_message TEXT,
    
    -- Auto-expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pod_id, requester_id) -- Prevent duplicate requests
);

-- 3. POD DISCOVERY TABLE
-- Public pod directory for discovery
CREATE TABLE pod_discovery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    
    -- Discovery settings
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    search_tags TEXT[] DEFAULT '{}',
    
    -- Display information
    display_name VARCHAR(100) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    banner_image_url TEXT,
    
    -- Filtering metadata
    target_age_range VARCHAR(20), -- 'elementary', 'middle_school', 'high_school', 'adult', 'all_ages'
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    topics_covered TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    
    -- Stats for discovery ranking
    member_count INTEGER DEFAULT 0,
    activity_score DECIMAL(10,2) DEFAULT 0.0, -- Calculated engagement score
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. POD ANALYTICS TABLE
-- Aggregate analytics for pods
CREATE TABLE pod_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Member analytics
    total_members INTEGER DEFAULT 0,
    active_members_today INTEGER DEFAULT 0,
    active_members_week INTEGER DEFAULT 0,
    new_members_today INTEGER DEFAULT 0,
    
    -- Activity analytics
    total_quiz_attempts INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0,
    
    -- Engagement analytics
    total_time_spent_minutes INTEGER DEFAULT 0,
    average_session_length_minutes DECIMAL(8,2) DEFAULT 0.0,
    total_achievements_earned INTEGER DEFAULT 0,
    total_streaks_started INTEGER DEFAULT 0,
    
    -- Content analytics
    most_popular_topics JSONB DEFAULT '[]', -- [{"topic": "Elections", "attempts": 45}]
    difficulty_distribution JSONB DEFAULT '{}', -- {"1": 10, "2": 25, "3": 30, "4": 20, "5": 15}
    category_performance JSONB DEFAULT '{}', -- {"Government": 0.85, "Elections": 0.72}
    
    -- Social analytics
    multiplayer_sessions INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    friend_requests_sent INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pod_id, date_recorded)
);

-- 5. POD MEMBER ANALYTICS TABLE
-- Individual member analytics within pods
CREATE TABLE pod_member_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Individual performance
    quiz_attempts INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    longest_session_minutes INTEGER DEFAULT 0,
    
    -- Progress tracking
    topics_completed INTEGER DEFAULT 0,
    achievements_earned INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    
    -- Difficulty progression
    average_difficulty DECIMAL(3,1) DEFAULT 0.0,
    difficulty_progression JSONB DEFAULT '[]', -- Track difficulty over time
    
    -- Social engagement
    multiplayer_participations INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    help_requests_sent INTEGER DEFAULT 0,
    help_provided INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pod_id, user_id, date_recorded)
);

-- 6. POD RATINGS TABLE
-- Member ratings and reviews for pods
CREATE TABLE pod_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pod_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    
    -- Rating categories
    content_quality_rating INTEGER CHECK (content_quality_rating BETWEEN 1 AND 5),
    community_rating INTEGER CHECK (community_rating BETWEEN 1 AND 5),
    organization_rating INTEGER CHECK (organization_rating BETWEEN 1 AND 5),
    
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pod_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_pod_invite_links_pod_id ON pod_invite_links(pod_id);
CREATE INDEX idx_pod_invite_links_code ON pod_invite_links(invite_code);
CREATE INDEX idx_pod_invite_links_active ON pod_invite_links(is_active) WHERE is_active = true;
CREATE INDEX idx_pod_invite_links_expires ON pod_invite_links(expires_at);

CREATE INDEX idx_pod_join_requests_pod_id ON pod_join_requests(pod_id);
CREATE INDEX idx_pod_join_requests_requester ON pod_join_requests(requester_id);
CREATE INDEX idx_pod_join_requests_status ON pod_join_requests(status);
CREATE INDEX idx_pod_join_requests_expires ON pod_join_requests(expires_at);

CREATE INDEX idx_pod_discovery_public ON pod_discovery(is_public) WHERE is_public = true;
CREATE INDEX idx_pod_discovery_featured ON pod_discovery(is_featured) WHERE is_featured = true;
CREATE INDEX idx_pod_discovery_tags ON pod_discovery USING GIN(search_tags);
CREATE INDEX idx_pod_discovery_age_range ON pod_discovery(target_age_range);
CREATE INDEX idx_pod_discovery_activity_score ON pod_discovery(activity_score DESC);

CREATE INDEX idx_pod_analytics_pod_date ON pod_analytics(pod_id, date_recorded);
CREATE INDEX idx_pod_analytics_date ON pod_analytics(date_recorded);

CREATE INDEX idx_pod_member_analytics_pod_user_date ON pod_member_analytics(pod_id, user_id, date_recorded);
CREATE INDEX idx_pod_member_analytics_date ON pod_member_analytics(date_recorded);

CREATE INDEX idx_pod_ratings_pod_id ON pod_ratings(pod_id);
CREATE INDEX idx_pod_ratings_rating ON pod_ratings(rating);
CREATE INDEX idx_pod_ratings_public ON pod_ratings(is_public) WHERE is_public = true;

-- Create triggers for updated_at columns
CREATE TRIGGER update_pod_discovery_updated_at 
    BEFORE UPDATE ON pod_discovery 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pod_ratings_updated_at 
    BEFORE UPDATE ON pod_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE pod_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_discovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_member_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Pod Invite Links: Pod admins can manage, anyone can view active links
CREATE POLICY "Pod admins can manage invite links" ON pod_invite_links
    FOR ALL USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent', 'organizer') AND membership_status = 'active'
        )
    );

CREATE POLICY "Anyone can view active invite links" ON pod_invite_links
    FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Pod Join Requests: Requesters and pod admins can view/manage
CREATE POLICY "Users can view their join requests" ON pod_join_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create join requests" ON pod_join_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Pod admins can manage join requests" ON pod_join_requests
    FOR ALL USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent', 'organizer') AND membership_status = 'active'
        )
    );

-- Pod Discovery: Public read access, pod admins can manage
CREATE POLICY "Anyone can view public pod discovery" ON pod_discovery
    FOR SELECT USING (is_public = true);

CREATE POLICY "Pod admins can manage discovery settings" ON pod_discovery
    FOR ALL USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent', 'organizer') AND membership_status = 'active'
        )
    );

-- Pod Analytics: Pod members can view their pod's analytics
CREATE POLICY "Pod members can view analytics" ON pod_analytics
    FOR SELECT USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND membership_status = 'active'
        )
    );

-- Pod Member Analytics: Users can view their own data, pod admins can view all
CREATE POLICY "Users can view their own member analytics" ON pod_member_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Pod admins can view all member analytics" ON pod_member_analytics
    FOR SELECT USING (
        pod_id IN (
            SELECT pod_id FROM pod_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'parent', 'organizer') AND membership_status = 'active'
        )
    );

-- Pod Ratings: Users can manage their own ratings, everyone can view public ratings
CREATE POLICY "Users can manage their own ratings" ON pod_ratings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view public ratings" ON pod_ratings
    FOR SELECT USING (is_public = true);

-- Helper Functions

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM pod_invite_links WHERE invite_code = code) INTO exists_check;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create shareable invite link
CREATE OR REPLACE FUNCTION create_pod_invite_link(
    p_pod_id UUID,
    p_creator_id UUID,
    p_description TEXT DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 720, -- 30 days
    p_allowed_roles TEXT[] DEFAULT '{"member"}',
    p_require_approval BOOLEAN DEFAULT false
) RETURNS TABLE (
    invite_code TEXT,
    invite_url TEXT,
    link_id UUID
) AS $$
DECLARE
    new_code TEXT;
    new_link_id UUID;
    base_url TEXT := 'https://civicsense.one/join/';
BEGIN
    -- Verify user has permission to create invite links
    IF NOT EXISTS (
        SELECT 1 FROM pod_memberships 
        WHERE pod_id = p_pod_id AND user_id = p_creator_id 
        AND role IN ('admin', 'parent', 'organizer') AND membership_status = 'active'
    ) THEN
        RAISE EXCEPTION 'User does not have permission to create invite links for this pod';
    END IF;
    
    -- Generate unique invite code
    new_code := generate_invite_code();
    
    -- Create invite link
    INSERT INTO pod_invite_links (
        pod_id, created_by, invite_code, invite_url, description, 
        max_uses, expires_at, allowed_roles, require_approval
    ) VALUES (
        p_pod_id, p_creator_id, new_code, base_url || new_code, p_description,
        p_max_uses, NOW() + (p_expires_hours || ' hours')::INTERVAL, 
        p_allowed_roles, p_require_approval
    ) RETURNING id INTO new_link_id;
    
    RETURN QUERY SELECT new_code, base_url || new_code, new_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join pod via invite link
CREATE OR REPLACE FUNCTION join_pod_via_invite(
    p_invite_code TEXT,
    p_user_id UUID,
    p_user_age INTEGER DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    requires_approval BOOLEAN,
    pod_id UUID
) AS $$
DECLARE
    invite_record RECORD;
    pod_record RECORD;
    age_restrictions JSONB;
    min_age INTEGER;
    max_age INTEGER;
BEGIN
    -- Get invite link details
    SELECT * INTO invite_record
    FROM pod_invite_links 
    WHERE invite_code = p_invite_code 
    AND is_active = true 
    AND expires_at > NOW()
    AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Invalid or expired invite link', false, NULL::UUID;
        RETURN;
    END IF;
    
    -- Get pod details
    SELECT * INTO pod_record FROM learning_pods WHERE id = invite_record.pod_id;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM pod_memberships 
        WHERE pod_id = invite_record.pod_id AND user_id = p_user_id
    ) THEN
        RETURN QUERY SELECT false, 'You are already a member of this pod', false, invite_record.pod_id;
        RETURN;
    END IF;
    
    -- Check age restrictions
    age_restrictions := invite_record.age_restrictions;
    IF age_restrictions IS NOT NULL AND p_user_age IS NOT NULL THEN
        min_age := (age_restrictions->>'min_age')::INTEGER;
        max_age := (age_restrictions->>'max_age')::INTEGER;
        
        IF min_age IS NOT NULL AND p_user_age < min_age THEN
            RETURN QUERY SELECT false, 'You do not meet the minimum age requirement for this pod', false, invite_record.pod_id;
            RETURN;
        END IF;
        
        IF max_age IS NOT NULL AND p_user_age > max_age THEN
            RETURN QUERY SELECT false, 'You exceed the maximum age limit for this pod', false, invite_record.pod_id;
            RETURN;
        END IF;
    END IF;
    
    -- Update invite link usage
    UPDATE pod_invite_links 
    SET current_uses = current_uses + 1 
    WHERE id = invite_record.id;
    
    -- If approval required, create join request
    IF invite_record.require_approval THEN
        INSERT INTO pod_join_requests (
            pod_id, requester_id, invite_link_id, requested_role, requester_age
        ) VALUES (
            invite_record.pod_id, p_user_id, invite_record.id, 
            invite_record.allowed_roles[1], p_user_age
        );
        
        RETURN QUERY SELECT true, 'Join request submitted for approval', true, invite_record.pod_id;
        RETURN;
    END IF;
    
    -- Add user directly to pod
    INSERT INTO pod_memberships (
        pod_id, user_id, role, membership_status
    ) VALUES (
        invite_record.pod_id, p_user_id, invite_record.allowed_roles[1], 'active'
    );
    
    RETURN QUERY SELECT true, 'Successfully joined pod!', false, invite_record.pod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate pod analytics
CREATE OR REPLACE FUNCTION calculate_pod_analytics(p_pod_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    member_count INTEGER;
    active_today INTEGER;
    active_week INTEGER;
    new_today INTEGER;
    quiz_attempts INTEGER;
    questions_answered INTEGER;
    correct_answers INTEGER;
    avg_accuracy DECIMAL(5,2);
    total_time INTEGER;
    avg_session DECIMAL(8,2);
    achievements INTEGER;
    streaks INTEGER;
    multiplayer INTEGER;
    messages INTEGER;
    friend_reqs INTEGER;
BEGIN
    -- Calculate member metrics
    SELECT COUNT(*) INTO member_count
    FROM pod_memberships 
    WHERE pod_id = p_pod_id AND membership_status = 'active';
    
    SELECT COUNT(DISTINCT user_id) INTO active_today
    FROM user_progress 
    WHERE DATE(updated_at) = p_date
    AND user_id IN (
        SELECT user_id FROM pod_memberships 
        WHERE pod_id = p_pod_id AND membership_status = 'active'
    );
    
    SELECT COUNT(DISTINCT user_id) INTO active_week
    FROM user_progress 
    WHERE updated_at >= p_date - INTERVAL '7 days'
    AND user_id IN (
        SELECT user_id FROM pod_memberships 
        WHERE pod_id = p_pod_id AND membership_status = 'active'
    );
    
    SELECT COUNT(*) INTO new_today
    FROM pod_memberships 
    WHERE pod_id = p_pod_id AND DATE(joined_at) = p_date;
    
    -- Calculate activity metrics from user_progress and quiz_attempts
    -- Note: These would need to be adjusted based on your actual schema
    quiz_attempts := 0; -- Placeholder
    questions_answered := 0; -- Placeholder
    correct_answers := 0; -- Placeholder
    avg_accuracy := 0.0; -- Placeholder
    total_time := 0; -- Placeholder
    avg_session := 0.0; -- Placeholder
    achievements := 0; -- Placeholder
    streaks := 0; -- Placeholder
    multiplayer := 0; -- Placeholder
    messages := 0; -- Placeholder
    friend_reqs := 0; -- Placeholder
    
    -- Insert or update analytics record
    INSERT INTO pod_analytics (
        pod_id, date_recorded, total_members, active_members_today, 
        active_members_week, new_members_today, total_quiz_attempts,
        total_questions_answered, total_correct_answers, average_accuracy,
        total_time_spent_minutes, average_session_length_minutes,
        total_achievements_earned, total_streaks_started,
        multiplayer_sessions, messages_sent, friend_requests_sent
    ) VALUES (
        p_pod_id, p_date, member_count, active_today, active_week, new_today,
        quiz_attempts, questions_answered, correct_answers, avg_accuracy,
        total_time, avg_session, achievements, streaks,
        multiplayer, messages, friend_reqs
    )
    ON CONFLICT (pod_id, date_recorded) 
    DO UPDATE SET
        total_members = EXCLUDED.total_members,
        active_members_today = EXCLUDED.active_members_today,
        active_members_week = EXCLUDED.active_members_week,
        new_members_today = EXCLUDED.new_members_today,
        total_quiz_attempts = EXCLUDED.total_quiz_attempts,
        total_questions_answered = EXCLUDED.total_questions_answered,
        total_correct_answers = EXCLUDED.total_correct_answers,
        average_accuracy = EXCLUDED.average_accuracy,
        total_time_spent_minutes = EXCLUDED.total_time_spent_minutes,
        average_session_length_minutes = EXCLUDED.average_session_length_minutes,
        total_achievements_earned = EXCLUDED.total_achievements_earned,
        total_streaks_started = EXCLUDED.total_streaks_started,
        multiplayer_sessions = EXCLUDED.multiplayer_sessions,
        messages_sent = EXCLUDED.messages_sent,
        friend_requests_sent = EXCLUDED.friend_requests_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON pod_invite_links TO authenticated;
GRANT ALL ON pod_join_requests TO authenticated;
GRANT ALL ON pod_discovery TO authenticated;
GRANT ALL ON pod_analytics TO authenticated;
GRANT ALL ON pod_member_analytics TO authenticated;
GRANT ALL ON pod_ratings TO authenticated;

GRANT EXECUTE ON FUNCTION generate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION create_pod_invite_link TO authenticated;
GRANT EXECUTE ON FUNCTION join_pod_via_invite TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_pod_analytics TO authenticated; 