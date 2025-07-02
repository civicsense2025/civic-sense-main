-- Comprehensive RLS Policies for CivicSense - Part 1: Core Content Tables
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- CORE CONTENT TABLES (Read-only for everyone, including guests)
-- =============================================================================

-- Categories - Public read access for quiz content
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
ON categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage categories"
ON categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update categories"
ON categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete categories"
ON categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Questions - Public read access for quiz content
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are publicly readable"
ON questions FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can insert questions"
ON questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update questions"
ON questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete questions"
ON questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Question Topics - Public read access for quiz content
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question topics are publicly readable"
ON question_topics FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage question topics"
ON question_topics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update question topics"
ON question_topics FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete question topics"
ON question_topics FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Question Skills - Public read access for skill mapping
ALTER TABLE question_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question skills are publicly readable"
ON question_skills FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage question skills"
ON question_skills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update question skills"
ON question_skills FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete question skills"
ON question_skills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Events - Public read access for civic content
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
ON events FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage events"
ON events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update events"
ON events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete events"
ON events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- ASSESSMENT AND LEARNING CONTENT (Public read access)
-- =============================================================================

-- Assessment Questions - Public read access
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assessment questions are publicly readable"
ON assessment_questions FOR SELECT
USING (is_active = true);

-- Assessment Scoring - Public read access
ALTER TABLE assessment_scoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assessment scoring is publicly readable"
ON assessment_scoring FOR SELECT
USING (true);

-- Skills system - Public read access
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are publicly readable"
ON skills FOR SELECT
USING (is_active = true);

ALTER TABLE skill_learning_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill learning objectives are publicly readable"
ON skill_learning_objectives FOR SELECT
USING (true);

ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill prerequisites are publicly readable"
ON skill_prerequisites FOR SELECT
USING (true);

ALTER TABLE skill_assessment_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill assessment criteria are publicly readable"
ON skill_assessment_criteria FOR SELECT
USING (true);

ALTER TABLE skill_progression_pathways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill progression pathways are publicly readable"
ON skill_progression_pathways FOR SELECT
USING (is_active = true);

ALTER TABLE pathway_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pathway skills are publicly readable"
ON pathway_skills FOR SELECT
USING (true);

ALTER TABLE skill_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill badges are publicly readable"
ON skill_badges FOR SELECT
USING (is_active = true);

ALTER TABLE badge_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badge requirements are publicly readable"
ON badge_requirements FOR SELECT
USING (true);

-- =============================================================================
-- PUBLIC FIGURES AND ORGANIZATIONS (Public read access)
-- =============================================================================

ALTER TABLE public_figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public figures are publicly readable"
ON public_figures FOR SELECT
USING (is_active = true);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are publicly readable"
ON organizations FOR SELECT
USING (is_active = true);

ALTER TABLE figure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure events are publicly readable"
ON figure_events FOR SELECT
USING (true);

ALTER TABLE figure_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure relationships are publicly readable"
ON figure_relationships FOR SELECT
USING (is_active = true);

ALTER TABLE figure_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure organizations are publicly readable"
ON figure_organizations FOR SELECT
USING (is_active = true);

ALTER TABLE figure_policy_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure policy positions are publicly readable"
ON figure_policy_positions FOR SELECT
USING (is_active = true);

ALTER TABLE key_policy_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Key policy positions are publicly readable"
ON key_policy_positions FOR SELECT
USING (is_active = true);

-- =============================================================================
-- REFERENCE DATA (Public read access)
-- =============================================================================

ALTER TABLE category_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category synonyms are publicly readable"
ON category_synonyms FOR SELECT
USING (true);

ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Glossary terms are publicly readable"
ON glossary_terms FOR SELECT
USING (is_active = true);

ALTER TABLE subscription_tier_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription tier limits are publicly readable"
ON subscription_tier_limits FOR SELECT
USING (true);

-- =============================================================================
-- USER PROGRESS AND ANALYTICS (User-specific data)
-- =============================================================================

-- User Progress - Users can manage their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON user_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Quiz Attempts - Users can manage their own attempts
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON user_quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
ON user_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts"
ON user_quiz_attempts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON user_quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Question Responses - Users can manage their own responses
ALTER TABLE user_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own question responses"
ON user_question_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question responses"
ON user_question_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all question responses"
ON user_question_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User Assessments - Users can manage their own assessments
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments"
ON user_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
ON user_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
ON user_assessments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments"
ON user_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

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

-- =============================================================================
-- FEEDBACK AND ANALYTICS (Mixed permissions)
-- =============================================================================

-- Question Feedback - Users can submit feedback, admins can view all
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit question feedback"
ON question_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own feedback"
ON question_feedback FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all feedback"
ON question_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Assessment Analytics - Users can create analytics, admins can view all
ALTER TABLE assessment_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own assessment analytics"
ON assessment_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own assessment analytics"
ON assessment_analytics FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all assessment analytics"
ON assessment_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- ADMIN-ONLY TABLES
-- =============================================================================

-- User Roles - Admin only
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage user roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Questions Test - Admin only
ALTER TABLE questions_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage test questions"
ON questions_test FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fact Check Logs - Admin only
ALTER TABLE fact_check_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage fact check logs"
ON fact_check_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- System Alerts - Admin only
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system alerts"
ON system_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Question Analytics - Admin only (aggregate data)
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view question analytics"
ON question_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- SOURCE MANAGEMENT (Admin-managed, public read)
-- =============================================================================

-- Question Source Links - Admin managed, public read
ALTER TABLE question_source_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question source links are publicly readable"
ON question_source_links FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert question source links"
ON question_source_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update question source links"
ON question_source_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete question source links"
ON question_source_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Source Fetch Queue - Admin only
ALTER TABLE source_fetch_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage source fetch queue"
ON source_fetch_queue FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Source Metadata - Admin managed, public read for active sources
ALTER TABLE source_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active source metadata is publicly readable"
ON source_metadata FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can insert source metadata"
ON source_metadata FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update source metadata"
ON source_metadata FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete source metadata"
ON source_metadata FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- INTEGRATION TABLES (User-specific or admin-managed)
-- =============================================================================

-- Clever User Mapping - Users can view their own mapping, admins can manage all
ALTER TABLE clever_user_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clever mapping"
ON clever_user_mapping FOR SELECT
USING (auth.uid()::text = civicsense_user_id);

CREATE POLICY "Admins can manage all clever mappings"
ON clever_user_mapping FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- GUEST ACCESS TABLES (Special handling for guest users)
-- =============================================================================

-- These tables are specifically designed for guest user tracking
-- They use IP addresses and guest tokens instead of user IDs

-- Note: These tables are not included in this migration as they should
-- be handled by the application layer with proper rate limiting
-- rather than database-level RLS policies

COMMIT; 