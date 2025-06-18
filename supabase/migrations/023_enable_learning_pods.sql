-- ============================================
-- Enable Learning Pods System
-- ============================================
-- This migration enables the learning pods functionality by updating API endpoints

-- First, ensure all necessary extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update the learning pods API to use real data
-- This is handled in the application layer, but we can add some helper functions

-- Function to get pod analytics data
CREATE OR REPLACE FUNCTION get_pod_analytics(
    p_pod_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    member_ids UUID[];
    start_date DATE;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '1 day' * p_days;
    
    -- Get member IDs
    SELECT ARRAY_AGG(user_id) INTO member_ids
    FROM pod_memberships 
    WHERE pod_id = p_pod_id AND membership_status = 'active';
    
    -- Build analytics result
    result := jsonb_build_object(
        'totalMembers', COALESCE(array_length(member_ids, 1), 0),
        'activeMembers', (
            SELECT COUNT(DISTINCT user_id) 
            FROM user_progress 
            WHERE user_id = ANY(member_ids) 
            AND updated_at >= start_date
        ),
        'totalQuestions', (
            SELECT COALESCE(SUM(total_questions_attempted), 0)
            FROM user_progress 
            WHERE user_id = ANY(member_ids)
        ),
        'totalCorrect', (
            SELECT COALESCE(SUM(total_correct_answers), 0)
            FROM user_progress 
            WHERE user_id = ANY(member_ids)
        ),
        'totalTimeSpent', (
            SELECT COALESCE(SUM(total_time_spent), 0)
            FROM user_progress 
            WHERE user_id = ANY(member_ids)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can join pod via invite
CREATE OR REPLACE FUNCTION can_join_pod_via_invite(
    p_invite_code VARCHAR(20),
    p_user_id UUID,
    p_user_age INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    pod_record RECORD;
    result JSONB;
BEGIN
    -- Get invite link details
    SELECT * INTO invite_record
    FROM pod_invite_links 
    WHERE invite_code = p_invite_code 
    AND is_active = true 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('canJoin', false, 'reason', 'invalid_or_expired');
    END IF;
    
    -- Check usage limits
    IF invite_record.max_uses IS NOT NULL AND invite_record.current_uses >= invite_record.max_uses THEN
        RETURN jsonb_build_object('canJoin', false, 'reason', 'usage_limit_reached');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM pod_memberships 
        WHERE pod_id = invite_record.pod_id 
        AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object('canJoin', false, 'reason', 'already_member');
    END IF;
    
    -- Check age restrictions if provided
    IF p_user_age IS NOT NULL AND invite_record.age_restrictions IS NOT NULL THEN
        IF (invite_record.age_restrictions->>'min_age')::INTEGER IS NOT NULL 
           AND p_user_age < (invite_record.age_restrictions->>'min_age')::INTEGER THEN
            RETURN jsonb_build_object('canJoin', false, 'reason', 'too_young');
        END IF;
        
        IF (invite_record.age_restrictions->>'max_age')::INTEGER IS NOT NULL 
           AND p_user_age > (invite_record.age_restrictions->>'max_age')::INTEGER THEN
            RETURN jsonb_build_object('canJoin', false, 'reason', 'too_old');
        END IF;
    END IF;
    
    -- Get pod details
    SELECT * INTO pod_record FROM learning_pods WHERE id = invite_record.pod_id;
    
    RETURN jsonb_build_object(
        'canJoin', true,
        'requiresApproval', invite_record.require_approval,
        'podName', pod_record.pod_name,
        'podType', pod_record.pod_type,
        'inviteDescription', invite_record.description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: join_pod_via_invite function is already defined in migration 022

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pod_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION can_join_pod_via_invite TO authenticated;
-- Note: join_pod_via_invite permissions already granted in migration 022

-- Add some sample content filtering rules
INSERT INTO content_filtering_rules (rule_name, filter_level, age_range, blocked_categories, max_difficulty_level) VALUES
('Elementary Strict', 'strict', 'elementary', '{"National Security", "Justice", "Foreign Policy"}', 2),
('Middle School Moderate', 'moderate', 'middle_school', '{"National Security"}', 3),
('High School Light', 'light', 'high_school', '{}', 4),
('Adult None', 'none', 'all_ages', '{}', 5)
ON CONFLICT DO NOTHING;

-- Add notification for successful migration
DO $$
BEGIN
    RAISE NOTICE 'Learning Pods system has been enabled! You can now create and manage learning pods.';
END $$; 