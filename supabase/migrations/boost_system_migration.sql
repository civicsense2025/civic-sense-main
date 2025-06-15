-- ============================================
-- CivicSense Enhanced Boost System Migration
-- ============================================
-- Creates tables for user boost inventory and active boosts
-- Supports expanded boost types with emojis and advanced features

-- Create boost inventory table
CREATE TABLE IF NOT EXISTS user_boost_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    boost_type TEXT NOT NULL CHECK (boost_type IN (
        -- Time Management Boosts
        'extra_time',
        'time_freeze',
        'speed_boost',
        'time_bank',
        'rush_mode',
        
        -- Scoring & XP Boosts
        'double_xp', 
        'triple_xp',
        'perfect_bonus',
        'comeback_king',
        'first_try_bonus',
        
        -- Learning Assistance Boosts
        'auto_hint',
        'smart_hint',
        'answer_reveal',
        'category_insight',
        'explanation_preview',
        'concept_map',
        
        -- Protection & Safety Boosts
        'second_chance',
        'streak_shield',
        'mistake_forgiveness',
        'confidence_boost',
        'safety_net',
        
        -- Strategic & Advanced Boosts
        'lucky_guess',
        'question_preview',
        'difficulty_scout',
        'skip_token',
        'topic_mastery',
        'civic_scholar',
        
        -- Social & Engagement Boosts
        'mentor_mode',
        'achievement_hunter',
        'daily_streak',
        'weekend_warrior',
        'night_owl',
        
        -- Specialized Learning Boosts
        'constitution_focus',
        'current_events',
        'historical_context',
        'local_connection',
        'debate_prep'
    )),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    total_purchased INTEGER NOT NULL DEFAULT 0 CHECK (total_purchased >= 0),
    last_purchased TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per boost type
    UNIQUE(user_id, boost_type)
);

-- Add last_cooldown_used column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_boost_inventory' 
        AND column_name = 'last_cooldown_used'
    ) THEN
        ALTER TABLE user_boost_inventory 
        ADD COLUMN last_cooldown_used TIMESTAMPTZ;
    END IF;
END $$;

-- Create active boosts table
CREATE TABLE IF NOT EXISTS user_active_boosts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    boost_type TEXT NOT NULL CHECK (boost_type IN (
        -- Time Management Boosts
        'extra_time',
        'time_freeze',
        'speed_boost',
        'time_bank',
        'rush_mode',
        
        -- Scoring & XP Boosts
        'double_xp',
        'triple_xp',
        'perfect_bonus',
        'comeback_king',
        'first_try_bonus',
        
        -- Learning Assistance Boosts
        'auto_hint',
        'smart_hint',
        'answer_reveal',
        'category_insight',
        'explanation_preview',
        'concept_map',
        
        -- Protection & Safety Boosts
        'second_chance',
        'streak_shield',
        'mistake_forgiveness',
        'confidence_boost',
        'safety_net',
        
        -- Strategic & Advanced Boosts
        'lucky_guess',
        'question_preview',
        'difficulty_scout',
        'skip_token',
        'topic_mastery',
        'civic_scholar',
        
        -- Social & Engagement Boosts
        'mentor_mode',
        'achievement_hunter',
        'daily_streak',
        'weekend_warrior',
        'night_owl',
        
        -- Specialized Learning Boosts
        'constitution_focus',
        'current_events',
        'historical_context',
        'local_connection',
        'debate_prep'
    )),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL for permanent boosts
    uses_remaining INTEGER, -- NULL for unlimited use boosts
    boost_data JSONB DEFAULT '{}', -- Additional boost-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate active boosts of same type
    UNIQUE(user_id, boost_type)
);

-- Create boost definitions table for storing boost metadata including emojis
CREATE TABLE IF NOT EXISTS boost_definitions (
    boost_type TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    emoji TEXT NOT NULL, -- Primary emoji for the boost
    icon TEXT NOT NULL, -- Secondary icon for backwards compatibility
    xp_cost INTEGER NOT NULL CHECK (xp_cost > 0),
    category TEXT NOT NULL CHECK (category IN ('time', 'scoring', 'assistance', 'protection', 'strategic', 'social', 'learning')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
    duration INTEGER, -- Duration in quizzes
    max_uses INTEGER, -- Maximum uses per activation
    cooldown_hours INTEGER, -- Cooldown period in hours
    level_requirement INTEGER DEFAULT 1, -- Minimum user level
    tags TEXT[] DEFAULT '{}', -- Tags for filtering
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (with IF NOT EXISTS to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_user_boost_inventory_user_id ON user_boost_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boost_inventory_boost_type ON user_boost_inventory(boost_type);
CREATE INDEX IF NOT EXISTS idx_user_boost_inventory_cooldown ON user_boost_inventory(last_cooldown_used);
CREATE INDEX IF NOT EXISTS idx_user_active_boosts_user_id ON user_active_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_boosts_expires_at ON user_active_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_boost_definitions_category ON boost_definitions(category);
CREATE INDEX IF NOT EXISTS idx_boost_definitions_rarity ON boost_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_boost_definitions_level_req ON boost_definitions(level_requirement);

-- Create updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (with IF NOT EXISTS equivalent using DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_user_boost_inventory_updated_at ON user_boost_inventory;
CREATE TRIGGER update_user_boost_inventory_updated_at 
    BEFORE UPDATE ON user_boost_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boost_definitions_updated_at ON boost_definitions;
CREATE TRIGGER update_boost_definitions_updated_at 
    BEFORE UPDATE ON boost_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_boost_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_active_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_definitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own boost inventory" ON user_boost_inventory;
DROP POLICY IF EXISTS "Users can insert their own boost inventory" ON user_boost_inventory;
DROP POLICY IF EXISTS "Users can update their own boost inventory" ON user_boost_inventory;
DROP POLICY IF EXISTS "Users can view their own active boosts" ON user_active_boosts;
DROP POLICY IF EXISTS "Users can insert their own active boosts" ON user_active_boosts;
DROP POLICY IF EXISTS "Users can update their own active boosts" ON user_active_boosts;
DROP POLICY IF EXISTS "Users can delete their own active boosts" ON user_active_boosts;
DROP POLICY IF EXISTS "Anyone can view boost definitions" ON boost_definitions;

-- RLS Policies for user_boost_inventory
CREATE POLICY "Users can view their own boost inventory" ON user_boost_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boost inventory" ON user_boost_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boost inventory" ON user_boost_inventory
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_active_boosts  
CREATE POLICY "Users can view their own active boosts" ON user_active_boosts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active boosts" ON user_active_boosts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active boosts" ON user_active_boosts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active boosts" ON user_active_boosts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for boost_definitions (read-only for users)
CREATE POLICY "Anyone can view boost definitions" ON boost_definitions
    FOR SELECT USING (true);

-- Create function to clean up expired boosts
CREATE OR REPLACE FUNCTION cleanup_expired_boosts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_active_boosts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to check cooldown status
CREATE OR REPLACE FUNCTION check_boost_cooldown(target_user_id UUID, target_boost_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    last_used TIMESTAMPTZ;
    cooldown_hours INTEGER;
    is_ready BOOLEAN := true;
BEGIN
    -- Get cooldown period from boost definitions
    SELECT bd.cooldown_hours INTO cooldown_hours
    FROM boost_definitions bd
    WHERE bd.boost_type = target_boost_type;
    
    -- If no cooldown defined, always ready
    IF cooldown_hours IS NULL THEN
        RETURN true;
    END IF;
    
    -- Get last cooldown usage
    SELECT ubi.last_cooldown_used INTO last_used
    FROM user_boost_inventory ubi
    WHERE ubi.user_id = target_user_id 
    AND ubi.boost_type = target_boost_type;
    
    -- If never used, ready
    IF last_used IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if cooldown period has passed
    IF last_used + (cooldown_hours || ' hours')::INTERVAL < NOW() THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS get_user_boost_summary(UUID);

-- Create function to get user's comprehensive boost summary
CREATE OR REPLACE FUNCTION get_user_boost_summary(target_user_id UUID)
RETURNS TABLE (
    boost_type TEXT,
    name TEXT,
    emoji TEXT,
    quantity INTEGER,
    is_active BOOLEAN,
    uses_remaining INTEGER,
    expires_at TIMESTAMPTZ,
    cooldown_ready BOOLEAN,
    level_requirement INTEGER,
    category TEXT,
    rarity TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bd.boost_type,
        bd.name,
        bd.emoji,
        COALESCE(i.quantity, 0) as quantity,
        (a.boost_type IS NOT NULL) as is_active,
        a.uses_remaining,
        a.expires_at,
        check_boost_cooldown(target_user_id, bd.boost_type) as cooldown_ready,
        bd.level_requirement,
        bd.category,
        bd.rarity
    FROM boost_definitions bd
    LEFT JOIN user_boost_inventory i ON i.user_id = target_user_id AND i.boost_type = bd.boost_type
    LEFT JOIN user_active_boosts a ON a.user_id = target_user_id AND a.boost_type = bd.boost_type
    WHERE bd.is_active = true
    ORDER BY bd.category, bd.rarity, bd.boost_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available boosts for purchase (considering level requirements)
CREATE OR REPLACE FUNCTION get_available_boosts_for_user(target_user_id UUID, user_level INTEGER DEFAULT 1)
RETURNS TABLE (
    boost_type TEXT,
    name TEXT,
    description TEXT,
    emoji TEXT,
    xp_cost INTEGER,
    category TEXT,
    rarity TEXT,
    level_requirement INTEGER,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bd.boost_type,
        bd.name,
        bd.description,
        bd.emoji,
        bd.xp_cost,
        bd.category,
        bd.rarity,
        bd.level_requirement,
        bd.tags
    FROM boost_definitions bd
    WHERE bd.is_active = true
    AND bd.level_requirement <= user_level
    ORDER BY bd.category, bd.xp_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear existing boost definitions to avoid conflicts
DELETE FROM boost_definitions WHERE boost_type IN (
    'extra_time', 'time_freeze', 'speed_boost', 'time_bank', 'rush_mode',
    'double_xp', 'triple_xp', 'perfect_bonus', 'comeback_king', 'first_try_bonus',
    'auto_hint', 'smart_hint', 'answer_reveal', 'category_insight', 'explanation_preview', 'concept_map',
    'second_chance', 'streak_shield', 'mistake_forgiveness', 'confidence_boost', 'safety_net',
    'lucky_guess', 'question_preview', 'difficulty_scout', 'skip_token', 'topic_mastery', 'civic_scholar',
    'mentor_mode', 'achievement_hunter', 'daily_streak', 'weekend_warrior', 'night_owl',
    'constitution_focus', 'current_events', 'historical_context', 'local_connection', 'debate_prep'
);

-- Insert all boost definitions with emojis
INSERT INTO boost_definitions (boost_type, name, description, emoji, icon, xp_cost, category, rarity, duration, max_uses, cooldown_hours, level_requirement, tags) VALUES
-- Time Management Boosts
('extra_time', 'Extra Time', '+30 seconds per question for this quiz', '⏰', '⏰', 50, 'time', 'common', 1, NULL, NULL, 1, ARRAY['time', 'beginner', 'helpful']),
('time_freeze', 'Time Freeze', 'Freeze the timer for 10 seconds (3 uses)', '❄️', '❄️', 150, 'time', 'epic', NULL, 3, NULL, 1, ARRAY['time', 'strategic', 'limited']),
('speed_boost', 'Speed Boost', '+50% XP bonus for completing questions under time limit', '🚀', '🚀', 120, 'time', 'rare', 1, NULL, NULL, 1, ARRAY['speed', 'bonus', 'challenge']),
('time_bank', 'Time Bank', 'Save unused time from questions for later use', '🏦', '🏦', 200, 'time', 'epic', 1, NULL, NULL, 5, ARRAY['time', 'strategic', 'advanced']),
('rush_mode', 'Rush Mode', 'Double XP but half time limit - high risk, high reward!', '⚡', '⚡', 300, 'time', 'legendary', 1, NULL, NULL, 10, ARRAY['risk', 'reward', 'expert', 'challenge']),

-- Scoring & XP Boosts
('double_xp', 'Double XP', 'Earn 2x experience points for this quiz', '💎', '⚡', 100, 'scoring', 'rare', 1, NULL, NULL, 1, ARRAY['xp', 'popular', 'valuable']),
('triple_xp', 'Triple XP', 'Earn 3x experience points for this quiz', '💰', '💰', 250, 'scoring', 'legendary', 1, NULL, 24, 15, ARRAY['xp', 'rare', 'valuable', 'limited']),
('perfect_bonus', 'Perfect Bonus', '+100% XP bonus if you achieve 100% score', '🎯', '🎯', 150, 'scoring', 'rare', 1, NULL, NULL, 1, ARRAY['perfect', 'bonus', 'challenge']),
('comeback_king', 'Comeback King', '+25% XP for each correct answer after a wrong one', '👑', '👑', 180, 'scoring', 'epic', 1, NULL, NULL, 1, ARRAY['comeback', 'resilience', 'bonus']),
('first_try_bonus', 'First Try Bonus', '+25% XP for first-attempt correct answers', '🥇', '🥇', 90, 'scoring', 'uncommon', 1, NULL, NULL, 1, ARRAY['first', 'accuracy', 'bonus']),

-- Learning Assistance Boosts
('auto_hint', 'Auto Hint', 'Automatically show hints on wrong answers', '💡', '💡', 75, 'assistance', 'common', 1, NULL, NULL, 1, ARRAY['hint', 'learning', 'helpful']),
('smart_hint', 'Smart Hint', 'AI-powered contextual hints tailored to your knowledge gaps', '🧠', '🧠', 200, 'assistance', 'epic', 1, NULL, NULL, 8, ARRAY['ai', 'smart', 'personalized', 'advanced']),
('answer_reveal', 'Answer Reveal', 'Eliminate one wrong answer in multiple choice (5 uses)', '🔍', '🔍', 120, 'assistance', 'rare', NULL, 5, NULL, 1, ARRAY['reveal', 'multiple-choice', 'strategic']),
('category_insight', 'Category Insight', 'See which civic category each question tests', '🏷️', '🏷️', 60, 'assistance', 'common', 1, NULL, NULL, 1, ARRAY['category', 'insight', 'learning']),
('explanation_preview', 'Explanation Preview', 'See explanation before answering (no XP penalty)', '📖', '📖', 100, 'assistance', 'uncommon', 1, NULL, NULL, 1, ARRAY['explanation', 'preview', 'learning']),
('concept_map', 'Concept Map', 'Visual connections between questions and civic concepts', '🗺️', '🗺️', 250, 'learning', 'epic', 1, NULL, NULL, 12, ARRAY['visual', 'connections', 'advanced', 'learning']),

-- Protection & Safety Boosts
('second_chance', 'Second Chance', 'Get one retry on wrong answers this quiz', '🔄', '🔄', 200, 'protection', 'epic', 1, NULL, NULL, 1, ARRAY['retry', 'protection', 'safety']),
('streak_shield', 'Streak Shield', 'Protect your streak from one wrong answer', '🛡️', '🛡️', 300, 'protection', 'legendary', NULL, 1, NULL, 1, ARRAY['streak', 'protection', 'valuable']),
('mistake_forgiveness', 'Mistake Forgiveness', 'First wrong answer doesn''t count against your score', '🤗', '🤗', 150, 'protection', 'rare', 1, NULL, NULL, 1, ARRAY['forgiveness', 'first', 'protection']),
('confidence_boost', 'Confidence Boost', 'Wrong answers don''t reduce confidence score', '💪', '💪', 120, 'protection', 'uncommon', 1, NULL, NULL, 1, ARRAY['confidence', 'protection', 'mental']),
('safety_net', 'Safety Net', 'Minimum 50% score guaranteed for this quiz', '🥅', '🥅', 400, 'protection', 'mythic', 1, NULL, 48, 20, ARRAY['safety', 'guarantee', 'rare', 'powerful']),

-- Strategic & Advanced Boosts
('lucky_guess', 'Lucky Guess', '50% chance to get correct answer on timeout/skip', '🍀', '🍀', 80, 'strategic', 'rare', 1, NULL, NULL, 1, ARRAY['luck', 'chance', 'timeout']),
('question_preview', 'Question Preview', 'See next 3 questions before starting quiz', '👀', '👀', 180, 'strategic', 'epic', 1, NULL, NULL, 7, ARRAY['preview', 'planning', 'strategic']),
('difficulty_scout', 'Difficulty Scout', 'See difficulty level of each question', '🎚️', '🎚️', 100, 'strategic', 'uncommon', 1, NULL, NULL, 1, ARRAY['difficulty', 'information', 'planning']),
('skip_token', 'Skip Token', 'Skip one question without penalty (3 uses)', '⏭️', '⏭️', 160, 'strategic', 'rare', NULL, 3, NULL, 1, ARRAY['skip', 'strategic', 'limited']),
('topic_mastery', 'Topic Mastery', '+200% XP if you achieve 90%+ score (mastery level)', '🎓', '🎓', 300, 'strategic', 'legendary', 1, NULL, NULL, 15, ARRAY['mastery', 'challenge', 'expert']),
('civic_scholar', 'Civic Scholar', 'Unlock 3 bonus questions for extra XP and learning', '📚', '📚', 220, 'learning', 'epic', 1, NULL, NULL, 10, ARRAY['bonus', 'scholar', 'extra', 'learning']),

-- Social & Engagement Boosts
('mentor_mode', 'Mentor Mode', 'Get encouraging messages and tips during quiz', '👨‍🏫', '👨‍🏫', 70, 'social', 'common', 1, NULL, NULL, 1, ARRAY['mentor', 'encouragement', 'support']),
('achievement_hunter', 'Achievement Hunter', '2x progress toward all achievements this quiz', '🏆', '🏆', 140, 'social', 'rare', 1, NULL, NULL, 1, ARRAY['achievement', 'progress', 'hunter']),
('daily_streak', 'Daily Streak', '+50% XP bonus for maintaining daily quiz streak', '🔥', '🔥', 90, 'social', 'uncommon', 1, NULL, NULL, 1, ARRAY['daily', 'streak', 'habit']),
('weekend_warrior', 'Weekend Warrior', '+75% XP bonus for weekend quizzing', '🌅', '🌅', 110, 'social', 'uncommon', 1, NULL, NULL, 1, ARRAY['weekend', 'bonus', 'warrior']),
('night_owl', 'Night Owl', '+60% XP bonus for late-night quizzing (after 9 PM)', '🦉', '🦉', 95, 'social', 'uncommon', 1, NULL, NULL, 1, ARRAY['night', 'late', 'owl', 'bonus']),

-- Specialized Learning Boosts
('constitution_focus', 'Constitution Focus', 'Extra hints and context for constitutional questions', '📜', '📜', 130, 'learning', 'rare', 1, NULL, NULL, 1, ARRAY['constitution', 'focus', 'specialized']),
('current_events', 'Current Events', 'Bonus context connecting questions to recent developments', '📰', '📰', 140, 'learning', 'rare', 1, NULL, NULL, 1, ARRAY['current', 'events', 'context']),
('historical_context', 'Historical Context', 'Additional historical background for better understanding', '🏛️', '🏛️', 120, 'learning', 'uncommon', 1, NULL, NULL, 1, ARRAY['history', 'context', 'background']),
('local_connection', 'Local Connection', 'Connect federal topics to local implications and examples', '🏙️', '🏙️', 110, 'learning', 'uncommon', 1, NULL, NULL, 1, ARRAY['local', 'connection', 'practical']),
('debate_prep', 'Debate Prep', 'Practice articulating positions on civic issues', '🗣️', '🗣️', 200, 'learning', 'epic', 1, NULL, NULL, 12, ARRAY['debate', 'articulation', 'advanced', 'civic']);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_boost_inventory TO authenticated;
GRANT ALL ON user_active_boosts TO authenticated;
GRANT SELECT ON boost_definitions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_boost_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_boosts_for_user(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_boost_cooldown(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_boosts() TO authenticated;

-- Insert comments for documentation
COMMENT ON TABLE user_boost_inventory IS 'Stores user boost inventory with cooldown tracking';
COMMENT ON TABLE user_active_boosts IS 'Tracks currently active boosts with expiration and usage limits';
COMMENT ON TABLE boost_definitions IS 'Master table of all available boosts with metadata and emojis';
COMMENT ON FUNCTION get_user_boost_summary(UUID) IS 'Returns comprehensive boost status for a user including cooldowns';
COMMENT ON FUNCTION get_available_boosts_for_user(UUID, INTEGER) IS 'Returns boosts available for purchase based on user level';
COMMENT ON FUNCTION check_boost_cooldown(UUID, TEXT) IS 'Checks if a boost cooldown has expired';
COMMENT ON FUNCTION cleanup_expired_boosts() IS 'Removes expired active boosts, returns count deleted'; 