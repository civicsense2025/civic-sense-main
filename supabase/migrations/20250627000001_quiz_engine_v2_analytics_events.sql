-- Quiz Engine V2 - Analytics Events System
-- Comprehensive tracking for all quiz interactions and civic learning analytics

BEGIN;

-- 1. Create analytics_events table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core event identification
    event_type TEXT NOT NULL CHECK (event_type IN (
        'quiz_started',
        'question_viewed',
        'question_answered',
        'quiz_completed',
        'quiz_abandoned',
        'mode_changed',
        'hint_requested',
        'explanation_viewed',
        'social_interaction',
        'achievement_earned',
        'power_up_used',
        'navigation_event',
        'error_occurred',
        'performance_metric'
    )),
    event_category TEXT NOT NULL CHECK (event_category IN (
        'engagement',
        'learning',
        'social',
        'performance',
        'error',
        'achievement'
    )),
    
    -- User identification (supports both authenticated and guest users)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_token TEXT,
    session_id TEXT NOT NULL,
    
    -- Quiz context
    topic_id TEXT REFERENCES public.question_topics(topic_id) ON DELETE CASCADE,
    quiz_attempt_id UUID REFERENCES public.user_quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    game_mode TEXT,
    
    -- Event data and metadata
    event_data JSONB NOT NULL DEFAULT '{}',
    performance_data JSONB DEFAULT '{}',
    
    -- Response time tracking for speed optimization
    response_time_ms INTEGER,
    time_since_question_start_ms INTEGER,
    time_since_quiz_start_ms INTEGER,
    
    -- Civic learning metrics
    civic_knowledge_score INTEGER CHECK (civic_knowledge_score >= 0 AND civic_knowledge_score <= 100),
    misconceptions_corrected INTEGER DEFAULT 0,
    uncomfortable_truths_revealed INTEGER DEFAULT 0,
    action_steps_engaged INTEGER DEFAULT 0,
    
    -- Context and environment
    platform TEXT CHECK (platform IN ('web', 'mobile')) DEFAULT 'web',
    device_type TEXT,
    user_agent TEXT,
    referrer_url TEXT,
    page_url TEXT,
    
    -- Multiplayer and social context
    room_code TEXT,
    team_id TEXT,
    social_interaction_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT analytics_events_user_identification CHECK (
        user_id IS NOT NULL OR guest_token IS NOT NULL
    ),
    CONSTRAINT analytics_events_response_time_valid CHECK (
        response_time_ms IS NULL OR response_time_ms >= 0
    ),
    CONSTRAINT analytics_events_quiz_times_logical CHECK (
        time_since_question_start_ms IS NULL OR 
        time_since_quiz_start_ms IS NULL OR 
        time_since_quiz_start_ms >= time_since_question_start_ms
    )
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_guest_token ON public.analytics_events(guest_token, created_at DESC) WHERE guest_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_topic_id ON public.analytics_events(topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_quiz_attempt ON public.analytics_events(quiz_attempt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_category ON public.analytics_events(event_type, event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_game_mode ON public.analytics_events(game_mode, created_at DESC) WHERE game_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON public.analytics_events(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_room_code ON public.analytics_events(room_code, created_at DESC) WHERE room_code IS NOT NULL;

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_data ON public.analytics_events USING GIN (event_data);
CREATE INDEX IF NOT EXISTS idx_analytics_events_performance_data ON public.analytics_events USING GIN (performance_data);

-- 3. Create response time aggregation view for speed optimization
CREATE OR REPLACE VIEW public.response_time_analytics AS
SELECT 
    topic_id,
    game_mode,
    platform,
    question_id,
    COUNT(*) as response_count,
    AVG(response_time_ms) as avg_response_time_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) as median_response_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time_ms,
    MIN(response_time_ms) as min_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms,
    STDDEV(response_time_ms) as response_time_stddev
FROM public.analytics_events 
WHERE 
    event_type = 'question_answered'
    AND response_time_ms IS NOT NULL
    AND response_time_ms > 0
    AND response_time_ms < 300000 -- Filter out unrealistic times (5+ minutes)
GROUP BY topic_id, game_mode, platform, question_id;

-- 4. Create civic learning impact view
CREATE OR REPLACE VIEW public.civic_learning_impact AS
SELECT 
    user_id,
    guest_token,
    topic_id,
    quiz_attempt_id,
    COUNT(*) as total_events,
    SUM(misconceptions_corrected) as total_misconceptions_corrected,
    SUM(uncomfortable_truths_revealed) as total_uncomfortable_truths,
    SUM(action_steps_engaged) as total_action_steps_engaged,
    AVG(civic_knowledge_score) as avg_civic_knowledge_score,
    MAX(civic_knowledge_score) as max_civic_knowledge_score,
    MIN(created_at) as first_interaction,
    MAX(created_at) as last_interaction,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as session_duration_seconds
FROM public.analytics_events 
WHERE 
    civic_knowledge_score IS NOT NULL
GROUP BY user_id, guest_token, topic_id, quiz_attempt_id;

-- 5. Create function to log quiz events with automatic civic metrics
CREATE OR REPLACE FUNCTION public.log_quiz_event(
    p_event_type TEXT,
    p_event_category TEXT,
    p_user_id UUID DEFAULT NULL,
    p_guest_token TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_topic_id TEXT DEFAULT NULL,
    p_quiz_attempt_id UUID DEFAULT NULL,
    p_question_id UUID DEFAULT NULL,
    p_game_mode TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_performance_data JSONB DEFAULT '{}',
    p_response_time_ms INTEGER DEFAULT NULL,
    p_time_since_question_start_ms INTEGER DEFAULT NULL,
    p_time_since_quiz_start_ms INTEGER DEFAULT NULL,
    p_platform TEXT DEFAULT 'web',
    p_device_type TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer_url TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_room_code TEXT DEFAULT NULL,
    p_team_id TEXT DEFAULT NULL,
    p_social_interaction_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
    calculated_civic_score INTEGER;
    calculated_misconceptions INTEGER := 0;
    calculated_truths INTEGER := 0;
    calculated_actions INTEGER := 0;
BEGIN
    -- Calculate civic learning metrics based on event data
    IF p_event_type = 'question_answered' AND p_event_data ? 'is_correct' THEN
        calculated_civic_score := CASE 
            WHEN (p_event_data->>'is_correct')::boolean THEN 85 
            ELSE 65 
        END;
        
        -- Check for civic learning indicators in event data
        IF p_event_data ? 'misconception_addressed' AND (p_event_data->>'misconception_addressed')::boolean THEN
            calculated_misconceptions := 1;
        END IF;
        
        IF p_event_data ? 'uncomfortable_truth_revealed' AND (p_event_data->>'uncomfortable_truth_revealed')::boolean THEN
            calculated_truths := 1;
        END IF;
        
        IF p_event_data ? 'action_steps_shown' AND (p_event_data->>'action_steps_shown')::boolean THEN
            calculated_actions := 1;
        END IF;
    END IF;
    
    -- Insert the event
    INSERT INTO public.analytics_events (
        event_type,
        event_category,
        user_id,
        guest_token,
        session_id,
        topic_id,
        quiz_attempt_id,
        question_id,
        game_mode,
        event_data,
        performance_data,
        response_time_ms,
        time_since_question_start_ms,
        time_since_quiz_start_ms,
        civic_knowledge_score,
        misconceptions_corrected,
        uncomfortable_truths_revealed,
        action_steps_engaged,
        platform,
        device_type,
        user_agent,
        referrer_url,
        page_url,
        room_code,
        team_id,
        social_interaction_type
    ) VALUES (
        p_event_type,
        p_event_category,
        p_user_id,
        p_guest_token,
        p_session_id,
        p_topic_id,
        p_quiz_attempt_id,
        p_question_id,
        p_game_mode,
        p_event_data,
        p_performance_data,
        p_response_time_ms,
        p_time_since_question_start_ms,
        p_time_since_quiz_start_ms,
        calculated_civic_score,
        calculated_misconceptions,
        calculated_truths,
        calculated_actions,
        p_platform,
        p_device_type,
        p_user_agent,
        p_referrer_url,
        p_page_url,
        p_room_code,
        p_team_id,
        p_social_interaction_type
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RLS policies for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events (authenticated users)
CREATE POLICY "analytics_events_user_own_select" ON public.analytics_events
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL)
    );

-- Users can insert their own events
CREATE POLICY "analytics_events_user_own_insert" ON public.analytics_events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL)
    );

-- Service role can insert and view all events
CREATE POLICY "analytics_events_service_role_all" ON public.analytics_events
    FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all events for analytics
CREATE POLICY "analytics_events_admin_select" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Grant permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.response_time_analytics TO authenticated;
GRANT SELECT ON public.civic_learning_impact TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_quiz_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_quiz_event TO anon;

-- 8. Add helpful comments
COMMENT ON TABLE public.analytics_events IS 'Comprehensive tracking of quiz interactions and civic learning analytics for Quiz Engine V2';
COMMENT ON COLUMN public.analytics_events.civic_knowledge_score IS 'Calculated score based on civic learning effectiveness (0-100)';
COMMENT ON COLUMN public.analytics_events.misconceptions_corrected IS 'Number of political misconceptions addressed in this interaction';
COMMENT ON COLUMN public.analytics_events.uncomfortable_truths_revealed IS 'Number of uncomfortable truths about power revealed';
COMMENT ON COLUMN public.analytics_events.action_steps_engaged IS 'Number of civic action steps user engaged with';
COMMENT ON FUNCTION public.log_quiz_event IS 'Logs quiz events with automatic civic learning metric calculation';

COMMIT; 