-- Enhanced Gamification System Migration
-- Builds on existing user_progress table and adds meaningful tracking

-- 1. USER LEARNING GOALS & PREFERENCES
CREATE TABLE user_learning_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'category_mastery', 'streak_target', 'weekly_target', 'skill_building'
    target_value INTEGER NOT NULL, -- goal target (e.g. 10 for 10-day streak, 5 for 5 quizzes per week)
    category VARCHAR(100), -- category for category-specific goals
    difficulty_level INTEGER, -- 1-4 for difficulty-specific goals
    is_active BOOLEAN DEFAULT true,
    target_date DATE, -- optional deadline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOM LEARNING DECKS
CREATE TABLE user_custom_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_name VARCHAR(200) NOT NULL,
    description TEXT,
    deck_type VARCHAR(50) NOT NULL DEFAULT 'custom', -- 'custom', 'adaptive', 'review', 'challenge'
    preferences JSONB DEFAULT '{}', -- categories, difficulty_levels, question_types, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DECK CONTENT (which topics/questions are in each deck)
CREATE TABLE user_deck_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES user_custom_decks(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) REFERENCES question_topics(topic_id),
    question_id UUID REFERENCES questions(id),
    priority_score REAL DEFAULT 1.0, -- for adaptive ordering
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Either topic_id OR question_id should be set, not both
    CONSTRAINT deck_content_check CHECK (
        (topic_id IS NOT NULL AND question_id IS NULL) OR 
        (topic_id IS NULL AND question_id IS NOT NULL)
    )
);

-- 4. ENHANCED SKILL TRACKING
CREATE TABLE user_category_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    skill_level REAL DEFAULT 0.0, -- 0-100 skill score
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    mastery_level VARCHAR(20) DEFAULT 'novice', -- 'novice', 'beginner', 'intermediate', 'advanced', 'expert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, category)
);

-- 5. STREAK & ACHIEVEMENT TRACKING
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL, -- 'first_quiz', 'streak_3', 'category_mastery', etc.
    achievement_data JSONB DEFAULT '{}', -- metadata about the achievement
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_milestone BOOLEAN DEFAULT false, -- true for major achievements
    
    UNIQUE(user_id, achievement_type)
);

-- 6. ENHANCED STREAK TRACKING
CREATE TABLE user_streak_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'category_specific'
    streak_value INTEGER NOT NULL,
    category VARCHAR(100), -- for category-specific streaks
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for active streaks
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SPACED REPETITION TRACKING
CREATE TABLE user_question_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    easiness_factor REAL DEFAULT 2.5, -- SM-2 algorithm factor
    repetition_count INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 1,
    next_review_date DATE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    consecutive_correct INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    
    UNIQUE(user_id, question_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_learning_goals_user_active ON user_learning_goals(user_id, is_active);
CREATE INDEX idx_user_custom_decks_user_active ON user_custom_decks(user_id, is_active);
CREATE INDEX idx_user_deck_content_deck ON user_deck_content(deck_id);
CREATE INDEX idx_user_category_skills_user ON user_category_skills(user_id);
CREATE INDEX idx_user_category_skills_category ON user_category_skills(category);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_user_streak_history_user_active ON user_streak_history(user_id, is_active);
CREATE INDEX idx_user_question_memory_user ON user_question_memory(user_id);
CREATE INDEX idx_user_question_memory_review_date ON user_question_memory(next_review_date) WHERE next_review_date IS NOT NULL;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_learning_goals_updated_at 
    BEFORE UPDATE ON user_learning_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_custom_decks_updated_at 
    BEFORE UPDATE ON user_custom_decks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_category_skills_updated_at 
    BEFORE UPDATE ON user_category_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enhanced user_progress table with new columns
-- Note: These columns are added in migration 006_fix_user_progress_columns.sql
-- Note: The comprehensive stats view is also created in migration 006 after columns are added

-- Insert default learning goals for existing users
-- This will be handled by the application logic when users first access the new features 