-- Quiz Engine V2 - Response Time Tracking & Topic Filtering Enhancements
-- Enhanced analytics and filtering capabilities for improved user experience

BEGIN;

-- 1. Add response time tracking fields to user_quiz_attempts
ALTER TABLE public.user_quiz_attempts 
ADD COLUMN IF NOT EXISTS avg_response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS fastest_response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS slowest_response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS response_time_variance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS speed_score INTEGER CHECK (speed_score >= 0 AND speed_score <= 100),
ADD COLUMN IF NOT EXISTS question_response_times JSONB DEFAULT '[]'::jsonb;

-- 2. Add difficulty and subject filtering to question_topics
ALTER TABLE public.question_topics 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS subject_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prerequisite_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_tags JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS civic_impact_score INTEGER CHECK (civic_impact_score >= 0 AND civic_impact_score <= 100) DEFAULT 50;

-- 3. Add social sharing tracking to user_quiz_attempts
ALTER TABLE public.user_quiz_attempts 
ADD COLUMN IF NOT EXISTS shared_platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS share_metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Create quiz performance metrics table
CREATE TABLE IF NOT EXISTS public.quiz_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT NOT NULL REFERENCES public.question_topics(topic_id) ON DELETE CASCADE,
    game_mode TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web',
    
    -- Performance aggregations
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Response time metrics
    avg_response_time_ms INTEGER,
    median_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    
    -- Score metrics
    avg_score DECIMAL(5,2) DEFAULT 0.0,
    median_score DECIMAL(5,2) DEFAULT 0.0,
    score_distribution JSONB DEFAULT '{}'::jsonb,
    
    -- Civic learning metrics
    avg_civic_knowledge_score DECIMAL(5,2) DEFAULT 0.0,
    misconceptions_corrected_rate DECIMAL(5,2) DEFAULT 0.0,
    uncomfortable_truths_engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    action_steps_completion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(topic_id, game_mode, platform, period_start)
);

-- 5. Create topic filtering view for enhanced discovery
CREATE OR REPLACE VIEW public.topic_discovery AS
SELECT 
    t.*,
    -- Popularity metrics
    COALESCE(pm.total_attempts, 0) as total_attempts,
    COALESCE(pm.completion_rate, 0) as completion_rate,
    COALESCE(pm.avg_score, 0) as average_score,
    
    -- Difficulty assessment
    CASE 
        WHEN pm.avg_score > 80 THEN 'easy'
        WHEN pm.avg_score > 60 THEN 'medium'
        ELSE 'hard'
    END as actual_difficulty,
    
    -- Time estimation
    COALESCE(pm.avg_response_time_ms / 1000 / 60, t.estimated_time_minutes) as estimated_completion_minutes,
    
    -- Civic impact
    t.civic_impact_score,
    COALESCE(pm.avg_civic_knowledge_score, 50) as civic_effectiveness_score,
    
    -- Categorization
    array_length(t.categories::text[], 1) as category_count,
    array_length(t.subject_areas, 1) as subject_area_count,
    
    -- Prerequisites
    array_length(t.prerequisite_topics, 1) as prerequisite_count,
    
    -- Updated metrics
    pm.last_updated as metrics_last_updated
FROM public.question_topics t
LEFT JOIN public.quiz_performance_metrics pm ON t.topic_id = pm.topic_id 
    AND pm.period_start = (
        SELECT MAX(period_start) 
        FROM public.quiz_performance_metrics pm2 
        WHERE pm2.topic_id = t.topic_id
    )
WHERE t.is_active = true;

-- 6. Create function to update response time metrics
CREATE OR REPLACE FUNCTION public.update_response_time_metrics(
    p_quiz_attempt_id UUID,
    p_question_response_times JSONB
) RETURNS VOID AS $$
DECLARE
    response_times INTEGER[];
    avg_time INTEGER;
    min_time INTEGER;
    max_time INTEGER;
    variance_val DECIMAL(10,2);
    speed_score_val INTEGER;
BEGIN
    -- Extract response times from JSONB array
    SELECT ARRAY(
        SELECT (value->>'time_spent')::integer 
        FROM jsonb_array_elements(p_question_response_times) 
        WHERE value->>'time_spent' IS NOT NULL
    ) INTO response_times;
    
    -- Calculate metrics if we have data
    IF array_length(response_times, 1) > 0 THEN
        avg_time := (SELECT AVG(time)::integer FROM unnest(response_times) AS time);
        min_time := (SELECT MIN(time) FROM unnest(response_times) AS time);
        max_time := (SELECT MAX(time) FROM unnest(response_times) AS time);
        
        -- Calculate variance
        SELECT VARIANCE(time) INTO variance_val FROM unnest(response_times) AS time;
        
        -- Calculate speed score (inverse relationship with average time, normalized to 0-100)
        speed_score_val := GREATEST(0, LEAST(100, 100 - (avg_time / 1000))); -- Rough calculation
        
        -- Update the quiz attempt
        UPDATE public.user_quiz_attempts 
        SET 
            avg_response_time_ms = avg_time,
            fastest_response_time_ms = min_time,
            slowest_response_time_ms = max_time,
            response_time_variance = variance_val,
            speed_score = speed_score_val,
            question_response_times = p_question_response_times,
            updated_at = NOW()
        WHERE id = p_quiz_attempt_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to track social sharing
CREATE OR REPLACE FUNCTION public.track_quiz_share(
    p_quiz_attempt_id UUID,
    p_platform TEXT,
    p_share_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    UPDATE public.user_quiz_attempts 
    SET 
        shared_platforms = array_append(
            COALESCE(shared_platforms, '{}'), 
            p_platform
        ),
        share_count = COALESCE(share_count, 0) + 1,
        social_engagement_score = COALESCE(social_engagement_score, 0) + 
            CASE p_platform
                WHEN 'twitter' THEN 10
                WHEN 'facebook' THEN 8
                WHEN 'linkedin' THEN 12
                WHEN 'email' THEN 5
                ELSE 5
            END,
        shared_at = NOW(),
        share_metadata = COALESCE(share_metadata, '{}'::jsonb) || p_share_metadata,
        updated_at = NOW()
    WHERE id = p_quiz_attempt_id;
    
    -- Log the sharing event
    INSERT INTO public.analytics_events (
        event_type,
        event_category,
        quiz_attempt_id,
        event_data,
        social_interaction_type,
        created_at
    ) VALUES (
        'social_interaction',
        'social',
        p_quiz_attempt_id,
        jsonb_build_object(
            'action', 'share',
            'platform', p_platform,
            'metadata', p_share_metadata
        ),
        'share',
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to aggregate performance metrics
CREATE OR REPLACE FUNCTION public.aggregate_quiz_performance_metrics(
    p_topic_id TEXT DEFAULT NULL,
    p_period_days INTEGER DEFAULT 30
) RETURNS VOID AS $$
DECLARE
    topic_record RECORD;
    period_start_date TIMESTAMPTZ;
    period_end_date TIMESTAMPTZ;
BEGIN
    period_end_date := NOW();
    period_start_date := period_end_date - INTERVAL '1 day' * p_period_days;
    
    -- Process all topics or specific topic
    FOR topic_record IN 
        SELECT topic_id FROM public.question_topics 
        WHERE (p_topic_id IS NULL OR topic_id = p_topic_id)
        AND is_active = true
    LOOP
        -- Insert or update performance metrics for each game mode and platform
        INSERT INTO public.quiz_performance_metrics (
            topic_id,
            game_mode,
            platform,
            total_attempts,
            total_completions,
            completion_rate,
            avg_response_time_ms,
            median_response_time_ms,
            p95_response_time_ms,
            avg_score,
            median_score,
            score_distribution,
            avg_civic_knowledge_score,
            misconceptions_corrected_rate,
            uncomfortable_truths_engagement_rate,
            action_steps_completion_rate,
            period_start,
            period_end
        )
        SELECT 
            topic_record.topic_id,
            COALESCE(qa.game_mode, 'standard') as game_mode,
            COALESCE(qa.platform, 'web') as platform,
            COUNT(*) as total_attempts,
            COUNT(*) FILTER (WHERE qa.is_completed = true) as total_completions,
            (COUNT(*) FILTER (WHERE qa.is_completed = true)::decimal / COUNT(*)) * 100 as completion_rate,
            AVG(qa.avg_response_time_ms)::integer as avg_response_time_ms,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qa.avg_response_time_ms)::integer as median_response_time_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY qa.avg_response_time_ms)::integer as p95_response_time_ms,
            AVG(qa.score) as avg_score,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY qa.score) as median_score,
            jsonb_build_object(
                '0-20', COUNT(*) FILTER (WHERE qa.score BETWEEN 0 AND 20),
                '21-40', COUNT(*) FILTER (WHERE qa.score BETWEEN 21 AND 40),
                '41-60', COUNT(*) FILTER (WHERE qa.score BETWEEN 41 AND 60),
                '61-80', COUNT(*) FILTER (WHERE qa.score BETWEEN 61 AND 80),
                '81-100', COUNT(*) FILTER (WHERE qa.score BETWEEN 81 AND 100)
            ) as score_distribution,
            -- Civic learning metrics from analytics_events
            COALESCE(civic_metrics.avg_civic_score, 50) as avg_civic_knowledge_score,
            COALESCE(civic_metrics.misconception_rate, 0) as misconceptions_corrected_rate,
            COALESCE(civic_metrics.truth_rate, 0) as uncomfortable_truths_engagement_rate,
            COALESCE(civic_metrics.action_rate, 0) as action_steps_completion_rate,
            period_start_date,
            period_end_date
        FROM public.user_quiz_attempts qa
        LEFT JOIN (
            SELECT 
                quiz_attempt_id,
                AVG(civic_knowledge_score) as avg_civic_score,
                (SUM(misconceptions_corrected)::decimal / COUNT(*)) * 100 as misconception_rate,
                (SUM(uncomfortable_truths_revealed)::decimal / COUNT(*)) * 100 as truth_rate,
                (SUM(action_steps_engaged)::decimal / COUNT(*)) * 100 as action_rate
            FROM public.analytics_events 
            WHERE created_at BETWEEN period_start_date AND period_end_date
            GROUP BY quiz_attempt_id
        ) civic_metrics ON qa.id = civic_metrics.quiz_attempt_id
        WHERE qa.topic_id = topic_record.topic_id
        AND qa.created_at BETWEEN period_start_date AND period_end_date
        GROUP BY qa.game_mode, qa.platform
        HAVING COUNT(*) > 0
        ON CONFLICT (topic_id, game_mode, platform, period_start) 
        DO UPDATE SET
            total_attempts = EXCLUDED.total_attempts,
            total_completions = EXCLUDED.total_completions,
            completion_rate = EXCLUDED.completion_rate,
            avg_response_time_ms = EXCLUDED.avg_response_time_ms,
            median_response_time_ms = EXCLUDED.median_response_time_ms,
            p95_response_time_ms = EXCLUDED.p95_response_time_ms,
            avg_score = EXCLUDED.avg_score,
            median_score = EXCLUDED.median_score,
            score_distribution = EXCLUDED.score_distribution,
            avg_civic_knowledge_score = EXCLUDED.avg_civic_knowledge_score,
            misconceptions_corrected_rate = EXCLUDED.misconceptions_corrected_rate,
            uncomfortable_truths_engagement_rate = EXCLUDED.uncomfortable_truths_engagement_rate,
            action_steps_completion_rate = EXCLUDED.action_steps_completion_rate,
            period_end = EXCLUDED.period_end,
            last_updated = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create indexes for enhanced filtering and performance
CREATE INDEX IF NOT EXISTS idx_question_topics_difficulty ON public.question_topics(difficulty_level, is_active);
CREATE INDEX IF NOT EXISTS idx_question_topics_subject_areas ON public.question_topics USING GIN (subject_areas);
CREATE INDEX IF NOT EXISTS idx_question_topics_content_tags ON public.question_topics USING GIN (content_tags);
CREATE INDEX IF NOT EXISTS idx_question_topics_civic_impact ON public.question_topics(civic_impact_score DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_question_topics_estimated_time ON public.question_topics(estimated_time_minutes, is_active);
CREATE INDEX IF NOT EXISTS idx_question_topics_prerequisites ON public.question_topics USING GIN (prerequisite_topics);

CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_speed_score ON public.user_quiz_attempts(speed_score DESC) WHERE speed_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_response_times ON public.user_quiz_attempts USING GIN (question_response_times);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_social_sharing ON public.user_quiz_attempts(share_count DESC, social_engagement_score DESC) WHERE share_count > 0;

CREATE INDEX IF NOT EXISTS idx_quiz_performance_metrics_topic_period ON public.quiz_performance_metrics(topic_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_performance_metrics_completion_rate ON public.quiz_performance_metrics(completion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_performance_metrics_civic_score ON public.quiz_performance_metrics(avg_civic_knowledge_score DESC);

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.quiz_performance_metrics TO authenticated;
GRANT SELECT ON public.topic_discovery TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_response_time_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_quiz_share TO authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_quiz_performance_metrics TO authenticated;

-- 11. Add helpful comments
COMMENT ON TABLE public.quiz_performance_metrics IS 'Aggregated performance metrics for quiz topics across different modes and platforms';
COMMENT ON VIEW public.topic_discovery IS 'Enhanced topic discovery view with filtering and recommendation capabilities';
COMMENT ON FUNCTION public.update_response_time_metrics IS 'Updates response time analytics for quiz attempts';
COMMENT ON FUNCTION public.track_quiz_share IS 'Tracks social sharing events and updates engagement scores';
COMMENT ON FUNCTION public.aggregate_quiz_performance_metrics IS 'Aggregates quiz performance metrics for analytics and recommendations';

COMMIT; 