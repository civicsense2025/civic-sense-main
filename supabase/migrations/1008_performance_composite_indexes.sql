-- Performance Composite Indexes Migration
-- Adds strategic composite indexes for common query patterns
-- Generated: 2024-12-19

BEGIN;

-- ==============================================================================
-- PERFORMANCE COMPOSITE INDEXES
-- ==============================================================================
-- These indexes are designed to optimize common query patterns in CivicSense

-- User Quiz Attempts - Common query patterns
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_topic 
ON public.user_quiz_attempts(user_id, topic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_score 
ON public.user_quiz_attempts(user_id, score DESC, created_at DESC);

-- Multiplayer Rooms - Active room discovery (using correct column name: room_status)
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_active 
ON public.multiplayer_rooms(room_status, created_at DESC) 
WHERE room_status IN ('waiting', 'starting');

-- Pod Memberships - Active members by role (using correct column name: membership_status)
CREATE INDEX IF NOT EXISTS idx_pod_memberships_pod_role 
ON public.pod_memberships(pod_id, role, membership_status) 
WHERE membership_status = 'active';

-- Learning Pods - Public pod discovery
CREATE INDEX IF NOT EXISTS idx_learning_pods_public_type 
ON public.learning_pods(is_public, pod_type, created_at DESC) 
WHERE is_public = true;

-- User Question Responses - Recent activity (table doesn't have user_id, only attempt_id)
-- CREATE INDEX IF NOT EXISTS idx_user_question_responses_user_recent 
-- ON public.user_question_responses(user_id, created_at DESC);
-- Skipping this index as user_question_responses doesn't have user_id column

-- Quiz Attempts - Performance tracking
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_performance 
ON public.user_quiz_attempts(topic_id, score, completion_time);

-- Multiplayer Game Events - Room activity
CREATE INDEX IF NOT EXISTS idx_multiplayer_events_room_time 
ON public.multiplayer_game_events(room_id, created_at DESC);

-- Pod Activities - Recent pod activity
CREATE INDEX IF NOT EXISTS idx_pod_activities_pod_time 
ON public.pod_activities(pod_id, created_at DESC);

-- User Progress - Skill mastery tracking
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_mastery_time 
ON public.user_skill_progress(user_id, mastery_level, updated_at DESC);

-- Survey Responses - User completion tracking
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_survey 
ON public.survey_responses(user_id, survey_id, completed_at DESC);

-- Bookmark Collections - User content organization
CREATE INDEX IF NOT EXISTS idx_bookmark_collections_user_updated 
ON public.bookmark_collections(user_id, updated_at DESC);

-- Question Topics - Category browsing
CREATE INDEX IF NOT EXISTS idx_question_topics_category_difficulty 
ON public.question_topics(category_id, difficulty_level, created_at DESC);

-- User Badges - Achievement tracking (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_user_badges_user_earned 
-- ON public.user_badges(user_id, earned_at DESC);
-- Skipping - need to verify table schema

-- Gift Redemptions - Usage tracking (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_gift_redemptions_recipient_redeemed 
-- ON public.gift_redemptions(recipient_user_id, redeemed_at DESC);
-- Skipping - need to verify table schema

-- Learning Objectives - Skill-based learning (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_learning_objectives_skill_priority 
-- ON public.learning_objectives(skill_id, priority_order);
-- Skipping - need to verify table schema

-- NPC Interactions - Conversation history (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_npc_conversation_user_time 
-- ON public.npc_conversation_history(user_id, created_at DESC);
-- Skipping - need to verify table schema

-- Content Generation Queue - Job processing (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_content_queue_status_priority 
-- ON public.content_generation_queue(status, priority, created_at);
-- Skipping - need to verify table schema

-- User Feature Usage - Analytics (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_user_feature_usage_user_feature_date 
-- ON public.user_feature_usage(user_id, feature_name, usage_date DESC);
-- Skipping - need to verify table schema

-- Assessment Questions - Skill mapping (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_assessment_questions_skill_difficulty 
-- ON public.assessment_questions(skill_id, difficulty_level);
-- Skipping - need to verify table schema

-- Multiplayer Chat - Room conversation (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_room_time 
-- ON public.multiplayer_chat_messages(room_id, created_at DESC);
-- Skipping - need to verify table schema

-- Pod Partnerships - Collaboration tracking (table exists in pod system)
CREATE INDEX IF NOT EXISTS idx_pod_partnerships_pods_status 
ON public.pod_partnerships(pod_1_id, pod_2_id, status);

-- Translation Jobs - Processing queue (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_translation_jobs_status_created 
-- ON public.translation_jobs(status, created_at);
-- Skipping - need to verify table schema

-- Bias Feedback - Organization analysis (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_bias_feedback_org_verified 
-- ON public.bias_feedback(organization_id, is_verified, created_at DESC);
-- Skipping - need to verify table schema

-- User Assessments - Progress tracking (check if table exists)
-- CREATE INDEX IF NOT EXISTS idx_user_assessments_user_completed 
-- ON public.user_assessments(user_id, completed_at DESC);
-- Skipping - need to verify table schema

COMMIT;

-- Add comments explaining the performance optimizations
COMMENT ON INDEX public.idx_user_quiz_attempts_user_topic 
IS 'Optimizes user quiz history queries by topic';

COMMENT ON INDEX public.idx_multiplayer_rooms_active 
IS 'Partial index for discovering active multiplayer rooms';

COMMENT ON INDEX public.idx_pod_memberships_pod_role 
IS 'Partial index for active pod members by role';

COMMENT ON INDEX public.idx_learning_pods_public_type 
IS 'Partial index for public pod discovery by type';

COMMENT ON INDEX public.idx_user_skill_progress_mastery_time 
IS 'Tracks skill mastery progression over time';

COMMENT ON INDEX public.idx_pod_partnerships_pods_status 
IS 'Optimizes pod partnership queries by status';

-- Note: Several indexes were commented out pending table schema verification
-- These can be re-enabled once the actual column names are confirmed: 