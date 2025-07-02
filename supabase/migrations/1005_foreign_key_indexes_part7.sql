-- Foreign Key Indexes Migration - Part 7 (Final)
-- User and School schema indexes
-- Generated: 2024-12-19

BEGIN;

-- User Assessments
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id 
ON public.user_assessments(user_id);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
ON public.user_badges(badge_id);

-- User Deck Content
CREATE INDEX IF NOT EXISTS idx_user_deck_content_question_id 
ON public.user_deck_content(question_id);

CREATE INDEX IF NOT EXISTS idx_user_deck_content_topic_id 
ON public.user_deck_content(topic_id);

-- User Feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id 
ON public.user_feedback(user_id);

-- User Question Memory
CREATE INDEX IF NOT EXISTS idx_user_question_memory_question_id 
ON public.user_question_memory(question_id);

-- User Question Responses
CREATE INDEX IF NOT EXISTS idx_user_question_responses_question_id 
ON public.user_question_responses(question_id);

-- User Quiz Analytics
CREATE INDEX IF NOT EXISTS idx_user_quiz_analytics_quiz_attempt_id 
ON public.user_quiz_analytics(quiz_attempt_id);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by 
ON public.user_roles(granted_by);

-- User Survey Completions
CREATE INDEX IF NOT EXISTS idx_user_survey_completions_response_id 
ON public.user_survey_completions(response_id);

-- School Schema Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_school_assignments_created_by 
ON school.assignments(created_by);

CREATE INDEX IF NOT EXISTS idx_school_course_pod_links_created_by 
ON school.course_pod_links(created_by);

CREATE INDEX IF NOT EXISTS idx_school_course_pod_links_pod_id 
ON school.course_pod_links(pod_id);

CREATE INDEX IF NOT EXISTS idx_school_sync_logs_pod_id 
ON school.sync_logs(pod_id);

CREATE INDEX IF NOT EXISTS idx_school_sync_logs_started_by 
ON school.sync_logs(started_by);

COMMIT; 