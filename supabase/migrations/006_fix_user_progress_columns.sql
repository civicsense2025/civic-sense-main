-- Fix user_progress table columns that failed in previous migration
-- Each ALTER TABLE ADD COLUMN must be separate or use proper syntax

-- Add weekly goal tracking columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 3;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS weekly_completed INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS week_start_date DATE;

-- Add user preferences columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS preferred_categories JSONB DEFAULT '[]';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS adaptive_difficulty BOOLEAN DEFAULT true;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS learning_style VARCHAR(50) DEFAULT 'mixed';

-- Add XP/leveling system columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 100;

-- Add comments for documentation
COMMENT ON COLUMN user_progress.weekly_goal IS 'Number of quizzes user wants to complete per week';
COMMENT ON COLUMN user_progress.weekly_completed IS 'Number of quizzes completed this week';
COMMENT ON COLUMN user_progress.week_start_date IS 'Start date of current week for tracking';
COMMENT ON COLUMN user_progress.preferred_categories IS 'Array of category names user prefers';
COMMENT ON COLUMN user_progress.adaptive_difficulty IS 'Whether to adapt question difficulty based on performance';
COMMENT ON COLUMN user_progress.learning_style IS 'User preferred learning style: visual, reading, mixed, challenge';
COMMENT ON COLUMN user_progress.total_xp IS 'Total experience points earned';
COMMENT ON COLUMN user_progress.current_level IS 'Current user level based on XP';
COMMENT ON COLUMN user_progress.xp_to_next_level IS 'XP needed to reach next level'; 

-- Create view for comprehensive user stats (moved from migration 005)
CREATE OR REPLACE VIEW user_comprehensive_stats AS
SELECT 
    up.user_id,
    up.current_streak,
    up.longest_streak,
    up.total_quizzes_completed,
    up.total_questions_answered,
    up.total_correct_answers,
    up.total_xp,
    up.current_level,
    up.weekly_goal,
    up.weekly_completed,
    up.preferred_categories,
    ROUND(CAST(up.total_correct_answers AS DECIMAL) / NULLIF(up.total_questions_answered, 0) * 100, 2) as accuracy_percentage,
    
    -- Category mastery stats
    (SELECT COUNT(*) FROM user_category_skills ucs WHERE ucs.user_id = up.user_id AND ucs.mastery_level IN ('advanced', 'expert')) as categories_mastered,
    (SELECT COUNT(DISTINCT category) FROM user_category_skills ucs WHERE ucs.user_id = up.user_id) as categories_attempted,
    
    -- Active goals
    (SELECT COUNT(*) FROM user_learning_goals ulg WHERE ulg.user_id = up.user_id AND ulg.is_active = true) as active_goals,
    
    -- Custom decks
    (SELECT COUNT(*) FROM user_custom_decks ucd WHERE ucd.user_id = up.user_id AND ucd.is_active = true) as custom_decks_count,
    
    -- Recent achievements
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = up.user_id AND ua.earned_at > NOW() - INTERVAL '7 days') as achievements_this_week

FROM user_progress up; 