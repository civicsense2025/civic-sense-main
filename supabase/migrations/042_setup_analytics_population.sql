-- Setup Analytics Data Population System
-- This migration creates functions and triggers to automatically populate analytics tables

BEGIN;

-- Create function to update pod analytics
CREATE OR REPLACE FUNCTION update_pod_analytics(pod_uuid UUID)
RETURNS VOID AS $$
DECLARE
    analytics_record RECORD;
    member_count INT;
    active_count INT;
    quiz_stats RECORD;
    time_stats RECORD;
BEGIN
    -- Get basic member counts
    SELECT COUNT(*) INTO member_count
    FROM pod_memberships 
    WHERE pod_id = pod_uuid 
    AND membership_status = 'active';
    
    -- Get active members (those with recent activity)
    SELECT COUNT(DISTINCT pm.user_id) INTO active_count
    FROM pod_memberships pm
    JOIN user_quiz_attempts uqa ON pm.user_id = uqa.user_id
    WHERE pm.pod_id = pod_uuid 
    AND pm.membership_status = 'active'
    AND uqa.created_at >= NOW() - INTERVAL '7 days';
    
    -- Get quiz statistics
    SELECT 
        COUNT(DISTINCT uqa.user_id) as active_users,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN uqa.score >= 70 THEN 1 ELSE 0 END) as passing_attempts,
        AVG(uqa.score) as avg_score,
        SUM(uqa.time_spent_seconds) as total_time_spent
    INTO quiz_stats
    FROM pod_memberships pm
    JOIN user_quiz_attempts uqa ON pm.user_id = uqa.user_id
    WHERE pm.pod_id = pod_uuid 
    AND pm.membership_status = 'active'
    AND uqa.created_at >= CURRENT_DATE;
    
    -- Insert or update pod analytics for today
    INSERT INTO pod_analytics (
        pod_id,
        date_recorded,
        total_members,
        active_members_today,
        active_members_week,
        total_quiz_attempts,
        total_questions_answered,
        total_correct_answers,
        average_accuracy,
        total_time_spent_minutes,
        average_session_length_minutes,
        created_at
    ) VALUES (
        pod_uuid,
        CURRENT_DATE,
        member_count,
        COALESCE(quiz_stats.active_users, 0),
        active_count,
        COALESCE(quiz_stats.total_attempts, 0),
        COALESCE(quiz_stats.total_attempts * 10, 0), -- Estimate questions per attempt
        COALESCE((quiz_stats.avg_score / 100.0) * quiz_stats.total_attempts * 10, 0),
        COALESCE(quiz_stats.avg_score, 0),
        COALESCE(quiz_stats.total_time_spent / 60, 0),
        CASE 
            WHEN quiz_stats.total_attempts > 0 
            THEN COALESCE(quiz_stats.total_time_spent / quiz_stats.total_attempts / 60, 0)
            ELSE 0 
        END,
        NOW()
    )
    ON CONFLICT (pod_id, date_recorded) 
    DO UPDATE SET
        total_members = EXCLUDED.total_members,
        active_members_today = EXCLUDED.active_members_today,
        active_members_week = EXCLUDED.active_members_week,
        total_quiz_attempts = EXCLUDED.total_quiz_attempts,
        total_questions_answered = EXCLUDED.total_questions_answered,
        total_correct_answers = EXCLUDED.total_correct_answers,
        average_accuracy = EXCLUDED.average_accuracy,
        total_time_spent_minutes = EXCLUDED.total_time_spent_minutes,
        average_session_length_minutes = EXCLUDED.average_session_length_minutes,
        created_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Create function to update member analytics
CREATE OR REPLACE FUNCTION update_member_analytics(pod_uuid UUID, member_user_id UUID)
RETURNS VOID AS $$
DECLARE
    member_stats RECORD;
    progress_stats RECORD;
BEGIN
    -- Get member quiz statistics for today
    SELECT 
        COUNT(*) as quiz_attempts,
        AVG(score) as avg_accuracy,
        SUM(time_spent_seconds) as total_time_spent,
        MAX(time_spent_seconds) as longest_session_seconds
    INTO member_stats
    FROM user_quiz_attempts
    WHERE user_id = member_user_id
    AND created_at >= CURRENT_DATE;
    
    -- Get member progress statistics
    SELECT 
        current_streak,
        longest_streak,
        total_questions_answered,
        total_correct_answers
    INTO progress_stats
    FROM user_progress
    WHERE user_id = member_user_id;
    
    -- Insert or update member analytics for today
    INSERT INTO pod_member_analytics (
        pod_id,
        user_id,
        date_recorded,
        quiz_attempts,
        questions_answered,
        correct_answers,
        accuracy_rate,
        time_spent_minutes,
        longest_session_minutes,
        current_streak,
        longest_streak,
        sessions_count,
        created_at
    ) VALUES (
        pod_uuid,
        member_user_id,
        CURRENT_DATE,
        COALESCE(member_stats.quiz_attempts, 0),
        COALESCE(member_stats.quiz_attempts * 10, 0), -- Estimate questions per attempt
        COALESCE((member_stats.avg_accuracy / 100.0) * member_stats.quiz_attempts * 10, 0),
        COALESCE(member_stats.avg_accuracy, 0),
        COALESCE(member_stats.total_time_spent / 60, 0),
        COALESCE(member_stats.longest_session_seconds / 60, 0),
        COALESCE(progress_stats.current_streak, 0),
        COALESCE(progress_stats.longest_streak, 0),
        COALESCE(member_stats.quiz_attempts, 0),
        NOW()
    )
    ON CONFLICT (pod_id, user_id, date_recorded)
    DO UPDATE SET
        quiz_attempts = EXCLUDED.quiz_attempts,
        questions_answered = EXCLUDED.questions_answered,
        correct_answers = EXCLUDED.correct_answers,
        accuracy_rate = EXCLUDED.accuracy_rate,
        time_spent_minutes = EXCLUDED.time_spent_minutes,
        longest_session_minutes = EXCLUDED.longest_session_minutes,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        sessions_count = EXCLUDED.sessions_count,
        created_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for quiz attempts
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
DECLARE
    member_pods UUID[];
    pod_uuid UUID;
BEGIN
    -- Get all pods this user is a member of
    SELECT ARRAY_AGG(pod_id) INTO member_pods
    FROM pod_memberships
    WHERE user_id = NEW.user_id
    AND membership_status = 'active';
    
    -- Update analytics for each pod
    IF member_pods IS NOT NULL THEN
        FOREACH pod_uuid IN ARRAY member_pods
        LOOP
            -- Update pod-level analytics
            PERFORM update_pod_analytics(pod_uuid);
            
            -- Update member-level analytics
            PERFORM update_member_analytics(pod_uuid, NEW.user_id);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz attempts
DROP TRIGGER IF EXISTS quiz_attempt_analytics_trigger ON user_quiz_attempts;
CREATE TRIGGER quiz_attempt_analytics_trigger
    AFTER INSERT OR UPDATE ON user_quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_analytics();

-- Create function to populate historical analytics
CREATE OR REPLACE FUNCTION populate_historical_analytics()
RETURNS VOID AS $$
DECLARE
    pod_record RECORD;
    member_record RECORD;
BEGIN
    -- Update analytics for all active pods
    FOR pod_record IN 
        SELECT DISTINCT id 
        FROM learning_pods 
        WHERE created_at IS NOT NULL
    LOOP
        PERFORM update_pod_analytics(pod_record.id);
        
        -- Update analytics for all active members of this pod
        FOR member_record IN
            SELECT DISTINCT user_id
            FROM pod_memberships
            WHERE pod_id = pod_record.id
            AND membership_status = 'active'
        LOOP
            PERFORM update_member_analytics(pod_record.id, member_record.user_id);
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Historical analytics population completed';
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to prevent duplicate daily records
ALTER TABLE pod_analytics 
DROP CONSTRAINT IF EXISTS pod_analytics_pod_date_unique;

ALTER TABLE pod_analytics 
ADD CONSTRAINT pod_analytics_pod_date_unique 
UNIQUE (pod_id, date_recorded);

ALTER TABLE pod_member_analytics 
DROP CONSTRAINT IF EXISTS pod_member_analytics_pod_user_date_unique;

ALTER TABLE pod_member_analytics 
ADD CONSTRAINT pod_member_analytics_pod_user_date_unique 
UNIQUE (pod_id, user_id, date_recorded);

-- Populate historical data
SELECT populate_historical_analytics();

COMMIT; 