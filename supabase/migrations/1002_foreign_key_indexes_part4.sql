-- Foreign Key Indexes Migration - Part 4
-- Learning, Media, and Multiplayer related indexes
-- Generated: 2024-12-19

BEGIN;

-- Learning Objectives
CREATE INDEX IF NOT EXISTS idx_learning_objectives_skill_id 
ON public.learning_objectives(skill_id);

-- Learning Pods
CREATE INDEX IF NOT EXISTS idx_learning_pods_theme_id 
ON public.learning_pods(theme_id);

-- Media Organizations
CREATE INDEX IF NOT EXISTS idx_media_organizations_parent_organization_id 
ON public.media_organizations(parent_organization_id);

-- Multiplayer Chat Messages
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_player_id 
ON public.multiplayer_chat_messages(player_id);

-- Multiplayer Game Events
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_triggered_by 
ON public.multiplayer_game_events(triggered_by);

-- Multiplayer Question Responses
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_player_id 
ON public.multiplayer_question_responses(player_id);

-- Multiplayer Quiz Attempts
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_player_id 
ON public.multiplayer_quiz_attempts(player_id);

-- Multiplayer Rooms
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_host_user_id 
ON public.multiplayer_rooms(host_user_id);

COMMIT; 