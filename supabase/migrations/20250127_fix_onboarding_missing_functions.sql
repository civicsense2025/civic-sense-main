-- Fix missing onboarding functions and tables
BEGIN;

-- Drop the problematic constraint if it exists (causing the current_step check error)
ALTER TABLE public.user_onboarding_state 
DROP CONSTRAINT IF EXISTS user_onboarding_state_current_step_check;

-- Modify current_step to be TEXT instead of INTEGER to match the onboarding flow
ALTER TABLE public.user_onboarding_state 
ALTER COLUMN current_step TYPE TEXT;

-- Create onboarding_invites table for social onboarding features
CREATE TABLE IF NOT EXISTS public.onboarding_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_code TEXT UNIQUE NOT NULL,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for onboarding_invites
CREATE INDEX IF NOT EXISTS idx_onboarding_invites_invite_code 
ON public.onboarding_invites(invite_code);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_inviter_id 
ON public.onboarding_invites(inviter_id);

-- Enable RLS on onboarding_invites
ALTER TABLE public.onboarding_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_invites
CREATE POLICY "Users can create their own invites" ON public.onboarding_invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can view invites they created" ON public.onboarding_invites
    FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invites they received" ON public.onboarding_invites
    FOR SELECT USING (auth.uid() = invitee_id);

-- Drop existing get_onboarding_skills function if it exists (to fix return type mismatch)
DROP FUNCTION IF EXISTS public.get_onboarding_skills(UUID[]);

-- Function to get onboarding skills based on selected categories
CREATE OR REPLACE FUNCTION public.get_onboarding_skills(p_category_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    skill_name VARCHAR(200),  -- Match actual column type
    description TEXT,
    emoji VARCHAR(10),       -- Match actual column type  
    category_id UUID,
    category_name VARCHAR(100), -- Match actual column type
    difficulty_level INTEGER,
    is_core_skill BOOLEAN,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.skill_name,
        s.description,
        s.emoji,
        s.category_id,
        c.name as category_name,
        s.difficulty_level,
        s.is_core_skill,
        s.display_order
    FROM public.skills s
    LEFT JOIN public.categories c ON s.category_id = c.id
    WHERE s.is_active = true
    AND (p_category_ids IS NULL OR s.category_id = ANY(p_category_ids))
    ORDER BY 
        s.is_core_skill DESC,
        c.name,
        s.display_order,
        s.skill_name;
END;
$$ LANGUAGE plpgsql;

-- Drop existing get_onboarding_categories function if it exists
DROP FUNCTION IF EXISTS public.get_onboarding_categories();

-- Function to get onboarding categories with question counts
CREATE OR REPLACE FUNCTION public.get_onboarding_categories()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),    -- Match actual column type
    description TEXT,
    emoji VARCHAR(10),    -- Match actual column type
    question_count BIGINT,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.emoji,
        COUNT(qt.topic_id) as question_count,
        c.display_order
    FROM public.categories c
    LEFT JOIN public.question_topics qt ON qt.category_id = c.id AND qt.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.description, c.emoji, c.display_order
    ORDER BY c.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing get_user_onboarding_progress function if it exists
DROP FUNCTION IF EXISTS public.get_user_onboarding_progress(UUID);

-- Function to get user onboarding progress with detailed information
CREATE OR REPLACE FUNCTION public.get_user_onboarding_progress(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    current_step TEXT,
    completed_steps TEXT[],
    status TEXT,
    is_completed BOOLEAN,
    onboarding_data JSONB,
    categories JSONB,
    skills JSONB,
    preferences JSONB,
    assessment JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH onboarding_base AS (
        SELECT 
            uos.user_id,
            uos.current_step,
            uos.completed_steps,
            uos.status,
            uos.is_completed,
            uos.onboarding_data,
            uos.created_at,
            uos.updated_at,
            uos.completed_at
        FROM public.user_onboarding_state uos
        WHERE uos.user_id = p_user_id
    ),
    user_categories AS (
        SELECT 
            json_agg(
                json_build_object(
                    'id', ucp.category_id,
                    'name', c.name,
                    'emoji', c.emoji,
                    'interest_level', ucp.interest_level,
                    'priority_rank', ucp.priority_rank
                )
            ) as categories_data
        FROM public.user_category_preferences ucp
        LEFT JOIN public.categories c ON ucp.category_id = c.id
        WHERE ucp.user_id = p_user_id
    ),
    user_skills AS (
        SELECT 
            json_agg(
                json_build_object(
                    'id', usp.skill_id,
                    'skill_name', s.skill_name,
                    'interest_level', usp.interest_level,
                    'target_mastery_level', usp.target_mastery_level,
                    'learning_timeline', usp.learning_timeline
                )
            ) as skills_data
        FROM public.user_skill_preferences usp
        LEFT JOIN public.skills s ON usp.skill_id = s.id
        WHERE usp.user_id = p_user_id
    ),
    user_preferences AS (
        SELECT 
            json_build_object(
                'learning_style', upp.learning_style,
                'preferred_difficulty', upp.preferred_difficulty,
                'push_notifications', upp.push_notifications,
                'email_notifications', upp.email_notifications
            ) as preferences_data
        FROM public.user_platform_preferences upp
        WHERE upp.user_id = p_user_id
    ),
    user_assessment AS (
        SELECT 
            json_build_object(
                'assessment_type', uoa.assessment_type,
                'results', uoa.results,
                'score', uoa.score,
                'assessment_data', uoa.assessment_data
            ) as assessment_data
        FROM public.user_onboarding_assessment uoa
        WHERE uoa.user_id = p_user_id
        AND uoa.assessment_type = 'initial_skills'
        ORDER BY uoa.created_at DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(ob.user_id, p_user_id),
        COALESCE(ob.current_step, 'welcome'),
        COALESCE(ob.completed_steps, '{}'),
        COALESCE(ob.status, 'started'),
        COALESCE(ob.is_completed, false),
        COALESCE(ob.onboarding_data, '{}'::jsonb),
        COALESCE(uc.categories_data::jsonb, '[]'::jsonb),
        COALESCE(us.skills_data::jsonb, '[]'::jsonb),
        COALESCE(up.preferences_data::jsonb, '{}'::jsonb),
        COALESCE(ua.assessment_data::jsonb, '{}'::jsonb),
        ob.created_at,
        ob.updated_at,
        ob.completed_at
    FROM onboarding_base ob
    FULL OUTER JOIN user_categories uc ON true
    FULL OUTER JOIN user_skills us ON true
    FULL OUTER JOIN user_preferences up ON true
    FULL OUTER JOIN user_assessment ua ON true;
END;
$$ LANGUAGE plpgsql;

-- Update the update_onboarding_progress function to handle TEXT current_step
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
    p_user_id UUID,
    p_step_name TEXT,
    p_step_data JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
    v_completed_steps TEXT[];
    v_step_index INTEGER;
    v_total_steps TEXT[] := ARRAY['welcome', 'categories', 'skills', 'preferences', 'assessment', 'completion'];
BEGIN
    -- Get current completed steps
    SELECT COALESCE(completed_steps, '{}') INTO v_completed_steps
    FROM public.user_onboarding_state
    WHERE user_id = p_user_id;
    
    -- Add new step if not already completed
    IF NOT p_step_name = ANY(v_completed_steps) THEN
        v_completed_steps := array_append(v_completed_steps, p_step_name);
    END IF;
    
    -- Calculate step index for current step
    SELECT array_position(v_total_steps, p_step_name) INTO v_step_index;
    
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
        p_step_name,
        v_completed_steps,
        p_step_data,
        CASE 
            WHEN p_step_name = 'completion' OR array_length(v_completed_steps, 1) >= 6 THEN 'completed'
            ELSE 'in_progress'
        END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_step = p_step_name,
        completed_steps = v_completed_steps,
        onboarding_data = user_onboarding_state.onboarding_data || p_step_data,
        status = CASE 
            WHEN p_step_name = 'completion' OR array_length(v_completed_steps, 1) >= 6 THEN 'completed'
            ELSE 'in_progress'
        END,
        last_active_at = NOW(),
        completed_at = CASE 
            WHEN p_step_name = 'completion' OR array_length(v_completed_steps, 1) >= 6 THEN NOW()
            ELSE user_onboarding_state.completed_at
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to safely process invite codes
CREATE OR REPLACE FUNCTION public.process_invite_code(p_invite_code TEXT, p_invitee_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_invite RECORD;
    v_result JSONB;
BEGIN
    -- Find the invite
    SELECT * INTO v_invite
    FROM public.onboarding_invites
    WHERE invite_code = p_invite_code
    AND used_at IS NULL
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invite code'
        );
    END IF;
    
    -- Mark invite as used
    UPDATE public.onboarding_invites
    SET 
        invitee_id = p_invitee_id,
        used_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invite.id;
    
    -- Return success with inviter info
    RETURN json_build_object(
        'success', true,
        'inviter_id', v_invite.inviter_id,
        'invite_id', v_invite.id
    );
END;
$$ LANGUAGE plpgsql;

COMMIT; 