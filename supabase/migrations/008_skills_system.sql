-- Enhanced Skills System Migration
-- This migration adds tables to support skill tracking, question-skill mappings, and personalized learning paths

-- Create skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    skill_slug TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    description TEXT,
    difficulty_level SMALLINT NOT NULL DEFAULT 1,
    is_core_skill BOOLEAN DEFAULT FALSE,
    prerequisites JSONB,
    learning_objectives JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT check_difficulty_level CHECK (difficulty_level BETWEEN 1 AND 5)
);

-- Create user_skill_progress table to track individual skill progress
CREATE TABLE IF NOT EXISTS user_skill_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_level INTEGER NOT NULL DEFAULT 0,
    mastery_level TEXT NOT NULL DEFAULT 'novice',
    questions_attempted INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    avg_response_time_seconds NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT check_skill_level CHECK (skill_level BETWEEN 0 AND 100),
    CONSTRAINT check_mastery_level CHECK (mastery_level IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert'))
);

-- Create skill_question_mappings table to map questions to skills
CREATE TABLE IF NOT EXISTS skill_question_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id TEXT NOT NULL,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relevance_score SMALLINT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(question_id, skill_id),
    CONSTRAINT check_relevance_score CHECK (relevance_score BETWEEN 1 AND 10)
);

-- Create skill_relationships table for prerequisite relationships
CREATE TABLE IF NOT EXISTS skill_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    target_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'prerequisite',
    required_mastery_level TEXT DEFAULT 'beginner',
    is_strict_requirement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_skill_relationship UNIQUE(source_skill_id, target_skill_id, relationship_type),
    CONSTRAINT check_required_mastery_level CHECK (required_mastery_level IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert')),
    CONSTRAINT check_relationship_type CHECK (relationship_type IN ('prerequisite', 'related', 'next_step'))
);

-- Create learning_objectives table
CREATE TABLE IF NOT EXISTS learning_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    objective_text TEXT NOT NULL,
    objective_type TEXT NOT NULL DEFAULT 'knowledge',
    mastery_level_required TEXT DEFAULT 'beginner',
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT check_objective_type CHECK (objective_type IN ('knowledge', 'application', 'analysis', 'synthesis', 'evaluation')),
    CONSTRAINT check_mastery_level_required CHECK (mastery_level_required IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert'))
);

-- Create skill_categories table for grouping skills by category
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spaced_repetition_schedule table for personalized review schedules
CREATE TABLE IF NOT EXISTS spaced_repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    next_review_date DATE NOT NULL,
    easiness_factor NUMERIC(4, 2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetition_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_skill_schedule UNIQUE(user_id, skill_id)
);

-- Create a view for convenient access to user skill analytics
CREATE OR REPLACE VIEW user_skill_analytics AS
SELECT 
    usp.user_id,
    s.id as skill_id,
    s.skill_name,
    s.skill_slug,
    s.category_name,
    s.difficulty_level as skill_difficulty,
    s.is_core_skill,
    usp.skill_level,
    usp.mastery_level,
    usp.questions_attempted,
    usp.questions_correct,
    usp.last_practiced_at,
    usp.avg_response_time_seconds,
    CASE 
        WHEN usp.questions_attempted > 0 THEN 
            ROUND((usp.questions_correct::NUMERIC / usp.questions_attempted) * 100, 1)
        ELSE 0
    END as accuracy_percentage,
    -- Calculate if the skill needs practice based on mastery level and time since last practice
    CASE 
        WHEN usp.mastery_level = 'novice' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '1 day') THEN true
        WHEN usp.mastery_level = 'beginner' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '3 days') THEN true
        WHEN usp.mastery_level = 'intermediate' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '7 days') THEN true
        WHEN usp.mastery_level = 'advanced' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '14 days') THEN true
        WHEN usp.mastery_level = 'expert' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '30 days') THEN true
        ELSE false
    END as needs_practice
FROM 
    skills s
LEFT JOIN 
    user_skill_progress usp ON s.id = usp.skill_id;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for skills table
DROP TRIGGER IF EXISTS set_skills_updated_at ON skills;
CREATE TRIGGER set_skills_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_skill_progress table
DROP TRIGGER IF EXISTS set_user_skill_progress_updated_at ON user_skill_progress;
CREATE TRIGGER set_user_skill_progress_updated_at
BEFORE UPDATE ON user_skill_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for skill_categories table
DROP TRIGGER IF EXISTS set_skill_categories_updated_at ON skill_categories;
CREATE TRIGGER set_skill_categories_updated_at
BEFORE UPDATE ON skill_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed basic skill categories
INSERT INTO skill_categories (category_name, display_name, description, emoji, display_order)
VALUES 
    ('government', 'Government', 'Understanding how different levels of government work', '🏛️', 1),
    ('elections', 'Elections', 'Voting procedures and electoral processes', '🗳️', 2),
    ('media-literacy', 'Media Literacy', 'Evaluating information sources and identifying misinformation', '📰', 3),
    ('civic-engagement', 'Civic Engagement', 'Participating in community and political processes', '🤝', 4),
    ('constitutional-rights', 'Constitutional Rights', 'Understanding civil liberties and protections', '📜', 5),
    ('law', 'Law', 'Legal systems and justice processes', '⚖️', 6)
ON CONFLICT (category_name) DO NOTHING;

-- Seed core skills
INSERT INTO skills (skill_name, skill_slug, category_name, description, difficulty_level, is_core_skill)
VALUES
    ('Understand Government Branches', 'understand-government-branches', 'Government', 'Learn how the executive, legislative, and judicial branches function and interact', 1, true),
    ('Read Government Budgets', 'read-budgets', 'Government', 'Understand where tax money goes and what governments prioritize', 2, true),
    ('Navigate Voting Procedures', 'voting-procedures', 'Elections', 'Understand registration requirements, voting methods, and deadlines', 1, true),
    ('Research Candidates', 'research-candidates', 'Elections', 'Look up candidates' backgrounds, positions, and track records', 2, true),
    ('Check Sources', 'check-sources', 'Media Literacy', 'Verify whether news sources and websites are trustworthy', 1, true),
    ('Verify Claims', 'verify-claims', 'Media Literacy', 'Assess factual claims using multiple reliable sources', 2, true),
    ('Engage in Civil Discourse', 'civil-discourse', 'Civic Engagement', 'Discuss contentious issues respectfully while focusing on facts', 2, false),
    ('Understand Constitutional Rights', 'constitutional-rights', 'Constitutional Rights', 'Know your civil liberties and how they apply in different contexts', 2, true),
    ('Analyze Policy Impacts', 'policy-impact', 'Law', 'Identify how legislation affects different communities and issues', 3, true)
ON CONFLICT (skill_slug) DO NOTHING;

-- Row Level Security Policies
-- Enable RLS on all new tables
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_question_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedule ENABLE ROW LEVEL SECURITY;

-- Public can view skills, categories, mappings, relationships, and objectives
CREATE POLICY "Public can view skills" ON skills
    FOR SELECT USING (true);

CREATE POLICY "Public can view skill categories" ON skill_categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view skill question mappings" ON skill_question_mappings
    FOR SELECT USING (true);

CREATE POLICY "Public can view skill relationships" ON skill_relationships
    FOR SELECT USING (true);

CREATE POLICY "Public can view learning objectives" ON learning_objectives
    FOR SELECT USING (true);

-- Users can only view and modify their own progress and schedules
CREATE POLICY "Users can view their own skill progress" ON user_skill_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill progress" ON user_skill_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill progress" ON user_skill_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own spaced repetition schedules" ON spaced_repetition_schedule
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaced repetition schedules" ON spaced_repetition_schedule
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaced repetition schedules" ON spaced_repetition_schedule
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get skill progress and calculate needs-practice
CREATE OR REPLACE FUNCTION get_skills_needing_review(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    skill_id UUID,
    skill_name TEXT,
    skill_slug TEXT,
    category_name TEXT,
    description TEXT,
    difficulty_level SMALLINT,
    is_core_skill BOOLEAN,
    mastery_level TEXT,
    days_since_practice INTEGER,
    needs_practice BOOLEAN,
    priority_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS skill_id,
        s.skill_name,
        s.skill_slug,
        s.category_name,
        s.description,
        s.difficulty_level,
        s.is_core_skill,
        COALESCE(usp.mastery_level, 'novice') AS mastery_level,
        CASE 
            WHEN usp.last_practiced_at IS NULL THEN 999
            ELSE EXTRACT(DAY FROM now() - usp.last_practiced_at)::INTEGER
        END AS days_since_practice,
        CASE
            WHEN usp.mastery_level = 'novice' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '1 day') THEN TRUE
            WHEN usp.mastery_level = 'beginner' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '3 days') THEN TRUE
            WHEN usp.mastery_level = 'intermediate' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '7 days') THEN TRUE
            WHEN usp.mastery_level = 'advanced' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '14 days') THEN TRUE
            WHEN usp.mastery_level = 'expert' AND (usp.last_practiced_at IS NULL OR usp.last_practiced_at < now() - interval '30 days') THEN TRUE
            ELSE FALSE
        END AS needs_practice,
        -- Calculate priority score: higher = more urgent to review
        -- Formula considers: days since practice / interval for mastery level * (1 + (1 - accuracy))
        CASE
            WHEN usp.last_practiced_at IS NULL THEN 100.0 -- Highest priority for never practiced
            ELSE (
                EXTRACT(DAY FROM now() - usp.last_practiced_at) / 
                CASE 
                    WHEN usp.mastery_level = 'novice' THEN 1
                    WHEN usp.mastery_level = 'beginner' THEN 3
                    WHEN usp.mastery_level = 'intermediate' THEN 7
                    WHEN usp.mastery_level = 'advanced' THEN 14
                    WHEN usp.mastery_level = 'expert' THEN 30
                    ELSE 7
                END
                *
                (1.0 + (1.0 - CASE 
                    WHEN COALESCE(usp.questions_attempted, 0) > 0 
                    THEN COALESCE(usp.questions_correct, 0)::NUMERIC / usp.questions_attempted 
                    ELSE 0.0 
                END))
            )
        END AS priority_score
    FROM 
        skills s
    LEFT JOIN 
        user_skill_progress usp ON s.id = usp.skill_id AND usp.user_id = p_user_id
    ORDER BY 
        priority_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 