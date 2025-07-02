-- Add missing completed_steps column and enhance onboarding tracking
BEGIN;

-- Add completed_steps column to user_onboarding_state if it doesn't exist
ALTER TABLE public.user_onboarding_state 
ADD COLUMN IF NOT EXISTS completed_steps TEXT[] DEFAULT '{}';

-- Add additional tracking columns for better onboarding analytics
ALTER TABLE public.user_onboarding_state
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'skipped')),
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS skipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have proper status
UPDATE public.user_onboarding_state 
SET status = CASE 
    WHEN is_completed = true THEN 'completed'
    WHEN current_step = 'completion' THEN 'completed'
    WHEN skip_reason IS NOT NULL THEN 'skipped'
    ELSE 'in_progress'
END
WHERE status IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_status 
ON public.user_onboarding_state(user_id, status);

-- Function to get personalized content based on user preferences
CREATE OR REPLACE FUNCTION get_personalized_quizzes(p_user_id UUID, p_limit INTEGER DEFAULT 3)
RETURNS TABLE (
    topic_id TEXT,
    topic_title TEXT,
    description TEXT,
    emoji TEXT,
    category_id UUID,
    category_name TEXT,
    question_count BIGINT,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT 
            ucp.category_id,
            ucp.interest_level,
            ucp.priority_rank
        FROM public.user_category_preferences ucp
        WHERE ucp.user_id = p_user_id
    ),
    topic_scores AS (
        SELECT 
            qt.topic_id,
            qt.topic_title,
            qt.description,
            qt.emoji,
            qt.category_id,
            c.name as category_name,
            COUNT(q.id) as question_count,
            COALESCE(up.interest_level, 0) * 
            CASE 
                WHEN up.priority_rank IS NOT NULL THEN (6 - up.priority_rank) 
                ELSE 1 
            END as relevance_score
        FROM public.question_topics qt
        LEFT JOIN public.categories c ON qt.category_id = c.id
        LEFT JOIN public.questions q ON q.topic_id = qt.topic_id
        LEFT JOIN user_preferences up ON up.category_id = qt.category_id
        WHERE qt.is_active = true
        GROUP BY qt.topic_id, qt.topic_title, qt.description, qt.emoji, 
                 qt.category_id, c.name, up.interest_level, up.priority_rank
    )
    SELECT 
        ts.topic_id,
        ts.topic_title,
        ts.description,
        ts.emoji,
        ts.category_id,
        ts.category_name,
        ts.question_count,
        ts.relevance_score
    FROM topic_scores ts
    WHERE ts.question_count > 0
    ORDER BY 
        ts.relevance_score DESC,
        ts.question_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_progress(
    p_user_id UUID,
    p_step_name TEXT,
    p_step_data JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
    v_completed_steps TEXT[];
BEGIN
    -- Get current completed steps
    SELECT COALESCE(completed_steps, '{}') INTO v_completed_steps
    FROM public.user_onboarding_state
    WHERE user_id = p_user_id;
    
    -- Add new step if not already completed
    IF NOT p_step_name = ANY(v_completed_steps) THEN
        v_completed_steps := array_append(v_completed_steps, p_step_name);
    END IF;
    
    -- Update onboarding state
    INSERT INTO public.user_onboarding_state (
        user_id,
        current_step,
        completed_steps,
        onboarding_data,
        status,
        last_active_at
    ) VALUES (
        p_user_id,
        array_length(v_completed_steps, 1),
        v_completed_steps,
        p_step_data,
        CASE 
            WHEN array_length(v_completed_steps, 1) >= 6 THEN 'completed'
            ELSE 'in_progress'
        END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_step = array_length(v_completed_steps, 1),
        completed_steps = v_completed_steps,
        onboarding_data = user_onboarding_state.onboarding_data || p_step_data,
        status = CASE 
            WHEN array_length(v_completed_steps, 1) >= 6 THEN 'completed'
            ELSE 'in_progress'
        END,
        last_active_at = NOW(),
        completed_at = CASE 
            WHEN array_length(v_completed_steps, 1) >= 6 THEN NOW()
            ELSE user_onboarding_state.completed_at
        END;
END;
$$ LANGUAGE plpgsql;

COMMIT; 