-- Comprehensive RLS Policies for CivicSense - Part 5: User Preferences and Settings
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- USER PREFERENCES AND SETTINGS (User-specific data)
-- =============================================================================

-- User Learning Goals - Users can manage their own goals
ALTER TABLE user_learning_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own learning goals"
ON user_learning_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Category Skills - Users can view their own skill progress
ALTER TABLE user_category_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own category skills"
ON user_category_skills FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category skills"
ON user_category_skills FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category skills"
ON user_category_skills FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Question Memory - Users can manage their own memory data
ALTER TABLE user_question_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own question memory"
ON user_question_memory FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Streak History - Users can view their own streaks
ALTER TABLE user_streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak history"
ON user_streak_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak history"
ON user_streak_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User Badges - Users can view their own badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
ON user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Skill Mastery Tracking - Users can view their own mastery progress
ALTER TABLE skill_mastery_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skill mastery"
ON skill_mastery_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill mastery"
ON skill_mastery_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill mastery"
ON skill_mastery_tracking FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Skill Practice Recommendations - Users can view their own recommendations
ALTER TABLE skill_practice_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice recommendations"
ON skill_practice_recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create practice recommendations"
ON skill_practice_recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- PREMIUM FEATURES (User-specific data)
-- =============================================================================

-- User Custom Decks - Users can manage their own custom decks
ALTER TABLE user_custom_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom decks"
ON user_custom_decks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User Deck Content - Users can manage their own deck content
ALTER TABLE user_deck_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own deck content"
ON user_deck_content FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT; 