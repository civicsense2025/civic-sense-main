-- ===========================================
-- CivicSense Performance Indexes Migration (Corrected)
-- Migration: 20241220_003_corrected_performance_indexes.sql
-- Description: Create performance indexes based on actual table schema
-- ===========================================

BEGIN;

-- Drop any failed index attempts from previous migration
DO $$ 
BEGIN
    -- Drop indexes that failed due to missing columns
    DROP INDEX CONCURRENTLY IF EXISTS idx_multiplayer_room_players_room_updated;
    DROP INDEX CONCURRENTLY IF EXISTS idx_user_quiz_attempts_mode_platform_created;
    DROP INDEX CONCURRENTLY IF EXISTS idx_user_quiz_attempts_user_created_desc;
    DROP INDEX CONCURRENTLY IF EXISTS idx_organizations_active_name;
    DROP INDEX CONCURRENTLY IF EXISTS idx_skills_active_name_level;
    DROP INDEX CONCURRENTLY IF EXISTS idx_question_source_links_question;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- MULTIPLAYER TABLES PERFORMANCE INDEXES
-- ============================================

-- Multiplayer room players - corrected to use player_name instead of display_name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multiplayer_room_players_room_updated_corrected
ON multiplayer_room_players (room_id, updated_at DESC)
INCLUDE (user_id, player_name, score, is_ready);

-- Multiplayer room players - active players lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multiplayer_room_players_active
ON multiplayer_room_players (room_id, is_connected)
WHERE is_connected = true;

-- ============================================
-- USER QUIZ ATTEMPTS - CORRECTED COLUMNS
-- ============================================

-- User quiz attempts with corrected column names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quiz_attempts_user_created_corrected
ON user_quiz_attempts (user_id, created_at DESC)
INCLUDE (game_mode, correct_answers, total_questions, time_spent_seconds)
WHERE user_id IS NOT NULL;

-- User quiz attempts by game mode (removed platform column as it doesn't exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quiz_attempts_mode_created
ON user_quiz_attempts (game_mode, created_at DESC)
INCLUDE (user_id, correct_answers, total_questions);

-- Performance tracking for quiz completion analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quiz_attempts_completed
ON user_quiz_attempts (is_completed, completed_at DESC)
WHERE is_completed = true;

-- ============================================
-- ORGANIZATIONS - CORRECTED COLUMNS
-- ============================================

-- Organizations with corrected website column name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active_name_corrected
ON organizations (is_active, name)
INCLUDE (id, description, website_url)
WHERE is_active = true;

-- Organizations by content review status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_content_review
ON organizations (content_review_status, updated_at DESC)
WHERE content_review_status IS NOT NULL;

-- ============================================
-- SKILLS - CORRECTED STRUCTURE
-- ============================================

-- Skills with actual available columns (removed skill_category_id as it doesn't exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_active_name_difficulty
ON skills (is_active, skill_name, difficulty_level)
INCLUDE (id, description, category_id)
WHERE is_active = true;

-- Skills by category and difficulty for performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_category_difficulty
ON skills (category_id, difficulty_level, is_active)
WHERE is_active = true;

-- ============================================
-- QUESTION SOURCE LINKS - CORRECTED COLUMNS
-- ============================================

-- Question source links with corrected column names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_source_links_question_corrected
ON question_source_links (question_id)
INCLUDE (source_name, source_type, relevance_score);

-- Question source links by source type and relevance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_source_links_relevance
ON question_source_links (source_type, relevance_score DESC, is_active)
WHERE is_active = true;

-- ============================================
-- CATEGORIES PERFORMANCE OPTIMIZATION
-- ============================================

-- Categories by display order for navigation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_display_order
ON categories (display_order, is_active)
WHERE is_active = true;

-- ============================================
-- QUESTION TOPICS PERFORMANCE
-- ============================================

-- Question topics by date and activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topics_date_active
ON question_topics (date DESC, is_active)
WHERE is_active = true;

-- Featured topics for homepage queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topics_featured
ON question_topics (is_featured, is_active, updated_at DESC)
WHERE is_featured = true AND is_active = true;

-- ============================================
-- QUESTIONS PERFORMANCE
-- ============================================

-- Questions by topic and difficulty
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_topic_difficulty
ON questions (topic_id, difficulty_level, is_active)
WHERE is_active = true;

-- Questions by category and fact check status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_category_fact_check
ON questions (category, fact_check_status, updated_at DESC)
WHERE is_active = true;

-- ============================================
-- USER PROGRESS OPTIMIZATION
-- ============================================

-- User progress by activity date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_activity
ON user_progress (last_activity_date DESC, user_id)
WHERE last_activity_date IS NOT NULL;

-- User progress weekly tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_weekly
ON user_progress (week_start_date DESC, weekly_completed)
WHERE week_start_date IS NOT NULL;

-- ============================================
-- PROFILES PERFORMANCE
-- ============================================

-- Profiles by achievement level
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_achievements
ON profiles (total_achievements DESC, updated_at DESC)
WHERE total_achievements > 0;

COMMIT;

-- ===========================================
-- Performance Notes:
-- ===========================================
-- 1. All indexes use actual column names from the database schema
-- 2. INCLUDE clauses optimize common query patterns
-- 3. Partial indexes with WHERE clauses reduce index size
-- 4. CONCURRENTLY ensures zero-downtime creation
-- 5. Covers mobile app's most frequent query patterns
-- =========================================== 