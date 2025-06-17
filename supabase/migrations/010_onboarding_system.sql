-- ============================================
-- CivicSense Onboarding System Migration
-- ============================================
-- Creates onboarding flow tables that integrate with existing categories and skills system

-- 1. USER ONBOARDING STATE TABLE
-- Track user's progress through onboarding flow
CREATE TABLE IF NOT EXISTS user_onboarding_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_step TEXT NOT NULL DEFAULT 'welcome' CHECK (current_step IN (
        'welcome', 'categories', 'skills', 'preferences', 'assessment', 'completion'
    )),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    skip_reason TEXT, -- If user skipped onboarding
    onboarding_data JSONB DEFAULT '{}', -- Store step-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER CATEGORY PREFERENCES TABLE
-- Store user's selected categories and interest levels (uses existing categories table)
CREATE TABLE IF NOT EXISTS user_category_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    interest_level INTEGER NOT NULL DEFAULT 3 CHECK (interest_level BETWEEN 1 AND 5), -- 1=Low, 5=High
    selected_during_onboarding BOOLEAN DEFAULT true,
    priority_rank INTEGER, -- User's ranking of importance (1=highest priority)
    learning_goal TEXT, -- What they want to achieve in this category
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category_id)
);

-- 3. USER SKILL PREFERENCES TABLE  
-- Store user's selected skills and learning priorities (uses existing skills table)
CREATE TABLE IF NOT EXISTS user_skill_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    interest_level INTEGER NOT NULL DEFAULT 3 CHECK (interest_level BETWEEN 1 AND 5),
    selected_during_onboarding BOOLEAN DEFAULT true,
    priority_rank INTEGER,
    target_mastery_level TEXT DEFAULT 'intermediate' CHECK (target_mastery_level IN (
        'novice', 'beginner', 'intermediate', 'advanced', 'expert'
    )),
    learning_timeline TEXT DEFAULT 'flexible' CHECK (learning_timeline IN (
        'immediate', 'weeks', 'months', 'flexible'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, skill_id)
);

-- 4. USER PLATFORM PREFERENCES TABLE
-- Store user's platform usage preferences and settings
CREATE TABLE IF NOT EXISTS user_platform_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Learning Preferences
    preferred_quiz_length INTEGER DEFAULT 10 CHECK (preferred_quiz_length BETWEEN 5 AND 50),
    preferred_difficulty TEXT DEFAULT 'adaptive' CHECK (preferred_difficulty IN (
        'easy', 'medium', 'hard', 'adaptive'
    )),
    learning_pace TEXT DEFAULT 'self_paced' CHECK (learning_pace IN (
        'self_paced', 'structured', 'intensive'
    )),
    learning_style TEXT DEFAULT 'mixed' CHECK (learning_style IN (
        'bite_sized', 'deep_dive', 'mixed'
    )),
    study_time_preference TEXT DEFAULT 'any_time' CHECK (study_time_preference IN (
        'morning', 'afternoon', 'evening', 'any_time'
    )),
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    daily_reminder BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    
    -- Accessibility Preferences
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    high_contrast BOOLEAN DEFAULT false,
    reduced_motion BOOLEAN DEFAULT false,
    screen_reader_mode BOOLEAN DEFAULT false,
    
    -- Gamification Preferences
    show_streaks BOOLEAN DEFAULT true,
    show_leaderboards BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    competitive_mode BOOLEAN DEFAULT false,
    
    -- Content Preferences
    show_explanations BOOLEAN DEFAULT true,
    show_sources BOOLEAN DEFAULT true,
    show_difficulty_indicators BOOLEAN DEFAULT true,
    preferred_content_types TEXT[] DEFAULT ARRAY['quiz', 'reading', 'video'],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER ONBOARDING ASSESSMENT TABLE
-- Store results of initial skills assessment
CREATE TABLE IF NOT EXISTS user_onboarding_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL DEFAULT 'initial_skills' CHECK (assessment_type IN (
        'initial_skills', 'category_familiarity', 'learning_style'
    )),
    assessment_data JSONB NOT NULL DEFAULT '{}', -- Store assessment questions and answers
    results JSONB NOT NULL DEFAULT '{}', -- Store calculated results and recommendations
    score INTEGER, -- Overall assessment score if applicable
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, assessment_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_user_id ON user_onboarding_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_step ON user_onboarding_state(current_step);
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_user_id ON user_category_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_category_id ON user_category_preferences(category_id);
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_interest ON user_category_preferences(interest_level);
CREATE INDEX IF NOT EXISTS idx_user_skill_preferences_user_id ON user_skill_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_preferences_skill_id ON user_skill_preferences(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_preferences_interest ON user_skill_preferences(interest_level);
CREATE INDEX IF NOT EXISTS idx_user_platform_preferences_user_id ON user_platform_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_assessment_user_id ON user_onboarding_assessment(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_assessment_type ON user_onboarding_assessment(assessment_type);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_onboarding_state_updated_at ON user_onboarding_state;
CREATE TRIGGER update_user_onboarding_state_updated_at 
    BEFORE UPDATE ON user_onboarding_state 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_category_preferences_updated_at ON user_category_preferences;
CREATE TRIGGER update_user_category_preferences_updated_at 
    BEFORE UPDATE ON user_category_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_skill_preferences_updated_at ON user_skill_preferences;
CREATE TRIGGER update_user_skill_preferences_updated_at 
    BEFORE UPDATE ON user_skill_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_platform_preferences_updated_at ON user_platform_preferences;
CREATE TRIGGER update_user_platform_preferences_updated_at 
    BEFORE UPDATE ON user_platform_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_platform_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_assessment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own onboarding state" ON user_onboarding_state;
DROP POLICY IF EXISTS "Users can manage their own category preferences" ON user_category_preferences;
DROP POLICY IF EXISTS "Users can manage their own skill preferences" ON user_skill_preferences;
DROP POLICY IF EXISTS "Users can manage their own platform preferences" ON user_platform_preferences;
DROP POLICY IF EXISTS "Users can manage their own assessment data" ON user_onboarding_assessment;

-- RLS Policies
CREATE POLICY "Users can manage their own onboarding state" ON user_onboarding_state
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own category preferences" ON user_category_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own skill preferences" ON user_skill_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own platform preferences" ON user_platform_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own assessment data" ON user_onboarding_assessment
    FOR ALL USING (auth.uid() = user_id);

-- Create function to get user's onboarding progress with category and skill data
CREATE OR REPLACE FUNCTION get_user_onboarding_progress(target_user_id UUID)
RETURNS TABLE (
    onboarding_step TEXT,
    is_completed BOOLEAN,
    selected_categories JSONB,
    selected_skills JSONB,
    platform_preferences JSONB,
    assessment_results JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(uos.current_step, 'welcome') as onboarding_step,
        COALESCE(uos.is_completed, false) as is_completed,
        
        -- Aggregate selected categories with names and details
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'emoji', c.emoji,
                    'interest_level', ucp.interest_level,
                    'priority_rank', ucp.priority_rank
                )
            ) FROM user_category_preferences ucp 
            JOIN categories c ON ucp.category_id = c.id 
            WHERE ucp.user_id = target_user_id),
            '[]'::jsonb
        ) as selected_categories,
        
        -- Aggregate selected skills with names and details
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'skill_name', s.skill_name,
                    'category_name', c.name,
                    'interest_level', usp.interest_level,
                    'target_mastery_level', usp.target_mastery_level,
                    'learning_timeline', usp.learning_timeline
                )
            ) FROM user_skill_preferences usp 
            JOIN skills s ON usp.skill_id = s.id 
            JOIN categories c ON s.category_id = c.id
            WHERE usp.user_id = target_user_id),
            '[]'::jsonb
        ) as selected_skills,
        
        -- Platform preferences as JSON
        COALESCE(
            (SELECT to_jsonb(upp.*) FROM user_platform_preferences upp WHERE upp.user_id = target_user_id),
            '{}'::jsonb
        ) as platform_preferences,
        
        -- Assessment results
        COALESCE(
            (SELECT jsonb_object_agg(assessment_type, results) 
             FROM user_onboarding_assessment uoa 
             WHERE uoa.user_id = target_user_id),
            '{}'::jsonb
        ) as assessment_results
        
    FROM user_onboarding_state uos
    WHERE uos.user_id = target_user_id
    
    UNION ALL
    
    -- Return default values if no onboarding state exists
    SELECT 
        'welcome'::TEXT,
        false::BOOLEAN,
        '[]'::jsonb,
        '[]'::jsonb, 
        '{}'::jsonb,
        '{}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM user_onboarding_state WHERE user_id = target_user_id)
    
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available categories for onboarding (from existing categories table)
CREATE OR REPLACE FUNCTION get_onboarding_categories()
RETURNS TABLE (
    id UUID,
    name TEXT,
    emoji TEXT,
    description TEXT,
    display_order INTEGER,
    question_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name::TEXT,
        c.emoji::TEXT,
        c.description::TEXT,
        c.display_order,
        COALESCE(q_count.count, 0) as question_count
    FROM categories c
    LEFT JOIN (
        SELECT 
            q.category,
            COUNT(*) as count
        FROM questions q 
        WHERE q.is_active = true 
        GROUP BY q.category
    ) q_count ON LOWER(c.name) = LOWER(q_count.category)
    WHERE c.is_active = true
    ORDER BY c.display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available skills for onboarding (from existing skills table)
CREATE OR REPLACE FUNCTION get_onboarding_skills(category_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    skill_name TEXT,
    skill_slug TEXT,
    category_id UUID,
    category_name TEXT,
    description TEXT,
    difficulty_level INTEGER,
    is_core_skill BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.skill_name::TEXT,
        s.skill_slug::TEXT,
        s.category_id,
        c.name::TEXT as category_name,
        s.description::TEXT,
        s.difficulty_level,
        s.is_core_skill
    FROM skills s
    JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = true
    AND (category_ids IS NULL OR s.category_id = ANY(category_ids))
    ORDER BY c.display_order, s.is_core_skill DESC, s.display_order, s.skill_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    target_user_id UUID,
    step_name TEXT,
    step_data JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
    next_step TEXT;
BEGIN
    -- Determine next step
    next_step := CASE step_name
        WHEN 'welcome' THEN 'categories'
        WHEN 'categories' THEN 'skills'
        WHEN 'skills' THEN 'preferences'
        WHEN 'preferences' THEN 'assessment'
        WHEN 'assessment' THEN 'completion'
        WHEN 'completion' THEN 'completion'
        ELSE 'welcome'
    END;
    
    -- Insert or update onboarding state
    INSERT INTO user_onboarding_state (user_id, current_step, onboarding_data, is_completed)
    VALUES (
        target_user_id, 
        next_step, 
        step_data,
        (step_name = 'completion')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_step = next_step,
        onboarding_data = user_onboarding_state.onboarding_data || step_data,
        is_completed = (step_name = 'completion'),
        completed_at = CASE WHEN step_name = 'completion' THEN NOW() ELSE user_onboarding_state.completed_at END,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_onboarding_state TO authenticated;
GRANT ALL ON user_category_preferences TO authenticated;
GRANT ALL ON user_skill_preferences TO authenticated;
GRANT ALL ON user_platform_preferences TO authenticated;
GRANT ALL ON user_onboarding_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_onboarding_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_skills(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_step(UUID, TEXT, JSONB) TO authenticated;

-- Insert comments for documentation
COMMENT ON TABLE user_onboarding_state IS 'Tracks user progress through onboarding flow';
COMMENT ON TABLE user_category_preferences IS 'User selected categories and interest levels (references existing categories table)';
COMMENT ON TABLE user_skill_preferences IS 'User selected skills and learning goals (references existing skills table)';
COMMENT ON TABLE user_platform_preferences IS 'User platform usage and accessibility preferences';
COMMENT ON TABLE user_onboarding_assessment IS 'Results of initial skills and learning style assessments';
COMMENT ON FUNCTION get_user_onboarding_progress(UUID) IS 'Returns complete onboarding progress with category and skill details';
COMMENT ON FUNCTION get_onboarding_categories() IS 'Returns available categories for onboarding selection from existing categories table';  
COMMENT ON FUNCTION get_onboarding_skills(UUID[]) IS 'Returns available skills for onboarding selection from existing skills table';
COMMENT ON FUNCTION complete_onboarding_step(UUID, TEXT, JSONB) IS 'Progresses user to next onboarding step'; 