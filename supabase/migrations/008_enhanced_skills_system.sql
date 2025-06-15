-- Enhanced Skills System Migration
-- Creates a more granular skills system that links categories, skills, and questions

-- 1. SKILLS TAXONOMY TABLE
-- Define specific skills within categories (e.g., "Constitutional Interpretation" within "Constitutional Law")
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name VARCHAR(200) NOT NULL,
    skill_slug VARCHAR(200) NOT NULL UNIQUE, -- URL-friendly version
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT,
    parent_skill_id UUID REFERENCES skills(id), -- For hierarchical skills
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_core_skill BOOLEAN DEFAULT false, -- Whether this is a fundamental skill for the category
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. QUESTION-SKILL MAPPING
-- Many-to-many relationship: questions can test multiple skills
CREATE TABLE question_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_weight REAL DEFAULT 1.0, -- How much this question tests this skill (0.1-1.0)
    is_primary_skill BOOLEAN DEFAULT false, -- Whether this is the main skill being tested
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(question_id, skill_id)
);

-- 3. USER SKILL PROGRESS
-- Track detailed progress on individual skills
CREATE TABLE user_skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Skill metrics
    skill_level REAL DEFAULT 0.0, -- 0-100 skill score
    confidence_level REAL DEFAULT 0.0, -- 0-100 confidence score
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    
    -- Learning analytics
    average_time_per_question REAL DEFAULT 0.0, -- seconds
    improvement_rate REAL DEFAULT 0.0, -- skill gain per question
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    
    -- Spaced repetition
    next_review_date DATE,
    review_interval_days INTEGER DEFAULT 1,
    consecutive_correct INTEGER DEFAULT 0,
    
    -- Mastery tracking
    mastery_level VARCHAR(20) DEFAULT 'novice', -- 'novice', 'beginner', 'intermediate', 'advanced', 'expert'
    mastery_achieved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, skill_id)
);

-- 4. SKILL PREREQUISITES
-- Define learning paths and dependencies between skills
CREATE TABLE skill_prerequisites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_mastery_level VARCHAR(20) DEFAULT 'intermediate', -- minimum level needed
    is_strict_requirement BOOLEAN DEFAULT false, -- whether this is absolutely required
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(skill_id, prerequisite_skill_id),
    -- Prevent circular dependencies
    CHECK (skill_id != prerequisite_skill_id)
);

-- 5. LEARNING OBJECTIVES
-- Define what users should achieve for each skill
CREATE TABLE skill_learning_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    objective_text TEXT NOT NULL,
    objective_type VARCHAR(50) DEFAULT 'knowledge', -- 'knowledge', 'comprehension', 'application', 'analysis'
    mastery_level_required VARCHAR(20) DEFAULT 'intermediate',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_skills_category ON skills(category_id);
CREATE INDEX idx_skills_parent ON skills(parent_skill_id);
CREATE INDEX idx_skills_active ON skills(is_active) WHERE is_active = true;
CREATE INDEX idx_question_skills_question ON question_skills(question_id);
CREATE INDEX idx_question_skills_skill ON question_skills(skill_id);
CREATE INDEX idx_question_skills_primary ON question_skills(skill_id, is_primary_skill) WHERE is_primary_skill = true;
CREATE INDEX idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX idx_user_skill_progress_skill ON user_skill_progress(skill_id);
CREATE INDEX idx_user_skill_progress_review ON user_skill_progress(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX idx_user_skill_progress_mastery ON user_skill_progress(mastery_level);
CREATE INDEX idx_skill_prerequisites_skill ON skill_prerequisites(skill_id);
CREATE INDEX idx_skill_prerequisites_prereq ON skill_prerequisites(prerequisite_skill_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_skills_updated_at 
    BEFORE UPDATE ON skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skill_progress_updated_at 
    BEFORE UPDATE ON user_skill_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample skills for Constitutional Law category
WITH constitutional_law_category AS (
    SELECT id FROM categories WHERE name = 'Constitutional Law' LIMIT 1
)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Constitutional Interpretation', 'constitutional-interpretation', (SELECT id FROM constitutional_law_category), 'Understanding how to interpret constitutional text and amendments', 3, true, 1),
    ('Separation of Powers', 'separation-of-powers', (SELECT id FROM constitutional_law_category), 'Knowledge of how power is divided between branches of government', 2, true, 2),
    ('Federalism', 'federalism', (SELECT id FROM constitutional_law_category), 'Understanding the relationship between federal and state governments', 2, true, 3),
    ('Bill of Rights', 'bill-of-rights', (SELECT id FROM constitutional_law_category), 'Knowledge of individual rights and liberties', 2, true, 4),
    ('Due Process', 'due-process', (SELECT id FROM constitutional_law_category), 'Understanding procedural and substantive due process', 3, false, 5),
    ('Equal Protection', 'equal-protection', (SELECT id FROM constitutional_law_category), 'Understanding equal protection under the law', 3, false, 6),
    ('Commerce Clause', 'commerce-clause', (SELECT id FROM constitutional_law_category), 'Understanding federal power to regulate interstate commerce', 4, false, 7),
    ('First Amendment Rights', 'first-amendment-rights', (SELECT id FROM constitutional_law_category), 'Freedom of speech, religion, press, assembly', 2, true, 8)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM constitutional_law_category) IS NOT NULL;

-- Insert sample skills for Government category
WITH government_category AS (
    SELECT id FROM categories WHERE name = 'Government' LIMIT 1
)
INSERT INTO skills (skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order) 
SELECT * FROM (VALUES
    ('Legislative Process', 'legislative-process', (SELECT id FROM government_category), 'How bills become laws', 2, true, 1),
    ('Executive Powers', 'executive-powers', (SELECT id FROM government_category), 'Presidential and executive branch authority', 2, true, 2),
    ('Judicial System', 'judicial-system', (SELECT id FROM government_category), 'Court structure and judicial review', 2, true, 3),
    ('Bureaucracy', 'bureaucracy', (SELECT id FROM government_category), 'Federal agencies and administrative law', 3, false, 4),
    ('Checks and Balances', 'checks-and-balances', (SELECT id FROM government_category), 'How branches limit each other', 2, true, 5),
    ('Federal vs State Power', 'federal-vs-state-power', (SELECT id FROM government_category), 'Division of governmental authority', 3, false, 6)
) AS v(skill_name, skill_slug, category_id, description, difficulty_level, is_core_skill, display_order)
WHERE (SELECT id FROM government_category) IS NOT NULL;

-- Create enhanced view for user skill analytics
CREATE OR REPLACE VIEW user_skill_analytics AS
SELECT 
    usp.user_id,
    s.skill_name,
    s.skill_slug,
    c.name as category_name,
    usp.skill_level,
    usp.confidence_level,
    usp.questions_attempted,
    usp.questions_correct,
    ROUND(CAST(usp.questions_correct AS DECIMAL) / NULLIF(usp.questions_attempted, 0) * 100, 2) as accuracy_percentage,
    usp.mastery_level,
    usp.last_practiced_at,
    usp.next_review_date,
    s.is_core_skill,
    s.difficulty_level as skill_difficulty,
    
    -- Calculate skill strength (combination of level and confidence)
    ROUND(CAST(usp.skill_level * 0.7 + usp.confidence_level * 0.3 AS NUMERIC), 2) as skill_strength,
    
    -- Determine if skill needs practice (low level or overdue review)
    CASE 
        WHEN usp.skill_level < 50 THEN true
        WHEN usp.next_review_date IS NOT NULL AND usp.next_review_date <= CURRENT_DATE THEN true
        ELSE false
    END as needs_practice,
    
    -- Calculate days since last practice
    CASE 
        WHEN usp.last_practiced_at IS NOT NULL 
        THEN EXTRACT(days FROM NOW() - usp.last_practiced_at)::INTEGER
        ELSE NULL
    END as days_since_practice

FROM user_skill_progress usp
JOIN skills s ON usp.skill_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE s.is_active = true;

-- Create function to get recommended skills for a user
CREATE OR REPLACE FUNCTION get_recommended_skills_for_user(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    skill_id UUID,
    skill_name VARCHAR(200),
    category_name VARCHAR(100),
    recommendation_reason TEXT,
    priority_score REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_skills AS (
        SELECT usa.skill_id, usa.skill_level, usa.needs_practice, usa.is_core_skill
        FROM user_skill_analytics usa
        WHERE usa.user_id = p_user_id
    ),
    skill_recommendations AS (
        SELECT 
            s.id as skill_id,
            s.skill_name,
            c.name as category_name,
            CASE 
                WHEN us.skill_id IS NULL AND s.is_core_skill THEN 'Core skill not yet started'
                WHEN us.needs_practice THEN 'Skill needs practice'
                WHEN us.skill_level < 70 AND s.is_core_skill THEN 'Core skill needs improvement'
                ELSE 'Recommended for skill development'
            END as recommendation_reason,
            CASE 
                WHEN us.skill_id IS NULL AND s.is_core_skill THEN 10.0
                WHEN us.needs_practice AND s.is_core_skill THEN 9.0
                WHEN us.needs_practice THEN 7.0
                WHEN us.skill_level < 70 AND s.is_core_skill THEN 8.0
                WHEN us.skill_level < 50 THEN 6.0
                ELSE 3.0
            END as priority_score
        FROM skills s
        JOIN categories c ON s.category_id = c.id
        LEFT JOIN user_skills us ON s.id = us.skill_id
        WHERE s.is_active = true
        ORDER BY priority_score DESC, s.is_core_skill DESC, s.display_order
        LIMIT p_limit
    )
    SELECT sr.skill_id, sr.skill_name, sr.category_name, sr.recommendation_reason, sr.priority_score
    FROM skill_recommendations sr;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user skill progress after answering questions
CREATE OR REPLACE FUNCTION update_user_skill_progress(
    p_user_id UUID,
    p_question_id UUID,
    p_is_correct BOOLEAN,
    p_time_spent INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    skill_record RECORD;
    new_skill_level REAL;
    new_confidence REAL;
BEGIN
    -- Update progress for each skill tested by this question
    FOR skill_record IN 
        SELECT qs.skill_id, qs.skill_weight, s.difficulty_level
        FROM question_skills qs
        JOIN skills s ON qs.skill_id = s.id
        WHERE qs.question_id = p_question_id
    LOOP
        -- Get or create user skill progress record
        INSERT INTO user_skill_progress (user_id, skill_id, questions_attempted, questions_correct)
        VALUES (p_user_id, skill_record.skill_id, 0, 0)
        ON CONFLICT (user_id, skill_id) DO NOTHING;
        
        -- Update the record
        UPDATE user_skill_progress 
        SET 
            questions_attempted = questions_attempted + 1,
            questions_correct = questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
            last_practiced_at = NOW(),
            
            -- Update skill level using a learning algorithm
            skill_level = CASE 
                WHEN p_is_correct THEN 
                    LEAST(100, skill_level + (skill_record.skill_weight * 5 * (1 - skill_level / 100)))
                ELSE 
                    GREATEST(0, skill_level - (skill_record.skill_weight * 3 * (skill_level / 100)))
            END,
            
            -- Update confidence based on consistency
            confidence_level = CASE 
                WHEN questions_attempted + 1 >= 3 THEN
                    LEAST(100, (questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END) * 100.0 / (questions_attempted + 1))
                ELSE confidence_level
            END,
            
            -- Update consecutive correct count
            consecutive_correct = CASE 
                WHEN p_is_correct THEN consecutive_correct + 1 
                ELSE 0 
            END,
            
            -- Update average time if provided
            average_time_per_question = CASE 
                WHEN p_time_spent IS NOT NULL THEN
                    (average_time_per_question * questions_attempted + p_time_spent) / (questions_attempted + 1)
                ELSE average_time_per_question
            END
            
        WHERE user_id = p_user_id AND skill_id = skill_record.skill_id;
        
        -- Update mastery level based on new skill level
        SELECT skill_level INTO new_skill_level 
        FROM user_skill_progress 
        WHERE user_id = p_user_id AND skill_id = skill_record.skill_id;
        
        UPDATE user_skill_progress 
        SET mastery_level = CASE 
            WHEN new_skill_level >= 90 THEN 'expert'
            WHEN new_skill_level >= 75 THEN 'advanced'
            WHEN new_skill_level >= 50 THEN 'intermediate'
            WHEN new_skill_level >= 25 THEN 'beginner'
            ELSE 'novice'
        END,
        mastery_achieved_at = CASE 
            WHEN new_skill_level >= 75 AND mastery_level != 'advanced' AND mastery_level != 'expert' THEN NOW()
            WHEN new_skill_level >= 90 AND mastery_level != 'expert' THEN NOW()
            ELSE mastery_achieved_at
        END
        WHERE user_id = p_user_id AND skill_id = skill_record.skill_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql; 