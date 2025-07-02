BEGIN;

-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES
-- ============================================================================

-- Category-Topic relationship optimization (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topics_categories_gin 
ON question_topics USING GIN (categories)
WHERE is_active = true;

-- Category display optimization with covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active_display_covering 
ON categories (is_active, display_order) 
INCLUDE (id, name, emoji, description)
WHERE is_active = true;

-- Topic browsing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_topics_active_title_covering 
ON question_topics (is_active, topic_title) 
INCLUDE (topic_id, description, categories, created_at)
WHERE is_active = true;

-- Question queries optimization (topic-based browsing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_topic_active_difficulty 
ON questions (topic_id, is_active, difficulty_level) 
INCLUDE (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
WHERE is_active = true;

-- User progress queries (dashboard and stats)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quiz_attempts_user_created_desc 
ON user_quiz_attempts (user_id, created_at DESC) 
INCLUDE (game_mode, correct_count, question_count, total_time_seconds)
WHERE user_id IS NOT NULL;

-- Quiz attempt analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_quiz_attempts_mode_platform_created 
ON user_quiz_attempts (game_mode, platform, created_at DESC)
INCLUDE (user_id, correct_count, question_count);

-- Multiplayer room queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multiplayer_rooms_active_created 
ON multiplayer_rooms (room_status, created_at DESC) 
INCLUDE (id, room_code, room_name, current_players, max_players, topic_id)
WHERE room_status IN ('waiting', 'in_progress');

-- Real-time multiplayer optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multiplayer_room_players_room_updated 
ON multiplayer_room_players (room_id, updated_at DESC)
INCLUDE (user_id, display_name, score, status);

-- Public figures for topic enrichment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_public_figures_active_name 
ON public_figures (is_active, name)
INCLUDE (id, description, image_url)
WHERE is_active = true;

-- Organizations for topic enrichment  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active_name
ON organizations (is_active, name)
INCLUDE (id, description, website)
WHERE is_active = true;

-- Skills queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_active_name_level
ON skills (is_active, skill_name, difficulty_level)
INCLUDE (id, description, skill_category_id)
WHERE is_active = true;

-- User skill progress optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skill_progress_user_updated
ON user_skill_progress (user_id, updated_at DESC)
INCLUDE (skill_id, mastery_level, confidence_level);

-- Question source links optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_source_links_question
ON question_source_links (question_id)
INCLUDE (source_url, source_title, credibility_score);

COMMIT; 