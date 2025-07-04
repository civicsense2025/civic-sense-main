-- Update user_quiz_attempts table to support unified quiz/game modes and social features
BEGIN;

-- Remove Clever-specific columns
ALTER TABLE public.user_quiz_attempts
  DROP COLUMN IF EXISTS clever_assignment_id,
  DROP COLUMN IF EXISTS quest_type,
  DROP COLUMN IF EXISTS quest_status,
  DROP COLUMN IF EXISTS quest_progress;

-- Keep and add core columns
ALTER TABLE public.user_quiz_attempts
  ADD COLUMN IF NOT EXISTS game_mode text CHECK (game_mode IN ('solo', 'multiplayer', 'assessment', 'practice')),
  ADD COLUMN IF NOT EXISTS platform text CHECK (platform IN ('web', 'mobile')),
  ADD COLUMN IF NOT EXISTS guest_token text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_streak integer DEFAULT 0,
  
  -- Enhanced game metadata for multiplayer/social features
  ADD COLUMN IF NOT EXISTS game_metadata jsonb DEFAULT '{
    "room_code": null,
    "room_type": null,
    "match_duration": null,
    "player_count": null,
    "round_count": null,
    "power_ups_used": [],
    "achievements_earned": [],
    "social_interactions": []
  }'::jsonb,
  
  -- Game mode specific settings
  ADD COLUMN IF NOT EXISTS mode_settings jsonb DEFAULT '{}'::jsonb,
  
  -- Detailed response data
  ADD COLUMN IF NOT EXISTS response_data jsonb DEFAULT '[]'::jsonb,
  
  -- Social and multiplayer tracking
  ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS team_id text,
  ADD COLUMN IF NOT EXISTS team_role text,
  ADD COLUMN IF NOT EXISTS social_interactions jsonb DEFAULT '{
    "chat_messages": 0,
    "reactions_given": 0,
    "reactions_received": 0,
    "helpful_votes": 0,
    "player_ratings": {}
  }'::jsonb,
  
  -- Keep integration columns (except assignments)
  ADD COLUMN IF NOT EXISTS pod_id uuid REFERENCES public.learning_pods(id),
  ADD COLUMN IF NOT EXISTS classroom_course_id text,
  ADD COLUMN IF NOT EXISTS classroom_assignment_id text,
  ADD COLUMN IF NOT EXISTS clever_section_id text;

-- Add check constraint for platform
ALTER TABLE public.user_quiz_attempts
  ADD CONSTRAINT user_quiz_attempts_platform_check 
  CHECK (platform IN ('web', 'mobile'));

-- Add check constraint for game mode
ALTER TABLE public.user_quiz_attempts
  ADD CONSTRAINT user_quiz_attempts_game_mode_check 
  CHECK (game_mode IN (
    'standard',
    'practice',
    'assessment',
    'multiplayer_casual',
    'multiplayer_ranked',
    'tournament',
    'team_vs_team',
    'speed_round',
    'debate_mode'
  ));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_pod_id ON public.user_quiz_attempts(pod_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_game_mode ON public.user_quiz_attempts(game_mode);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_platform ON public.user_quiz_attempts(platform);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_team_id ON public.user_quiz_attempts(team_id);

-- Add GIN index for JSON fields that will be queried
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_participants ON public.user_quiz_attempts USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_game_metadata ON public.user_quiz_attempts USING GIN (game_metadata);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_social_interactions ON public.user_quiz_attempts USING GIN (social_interactions);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_quiz_attempts_updated_at ON public.user_quiz_attempts;

CREATE TRIGGER update_user_quiz_attempts_updated_at
  BEFORE UPDATE ON public.user_quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to find potential friends based on gameplay history
CREATE OR REPLACE FUNCTION public.find_potential_friends(p_user_id uuid)
RETURNS TABLE (
  friend_id uuid,
  interaction_count bigint,
  last_played_together timestamp,
  shared_games jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH user_games AS (
    SELECT 
      a.id,
      a.created_at,
      a.game_mode,
      a.participants
    FROM public.user_quiz_attempts a
    WHERE 
      a.game_mode LIKE 'multiplayer%'
      AND (a.participants @> jsonb_build_array(jsonb_build_object('user_id', p_user_id)))
  )
  SELECT 
    (p->>'user_id')::uuid as friend_id,
    COUNT(*) as interaction_count,
    MAX(g.created_at) as last_played_together,
    jsonb_agg(DISTINCT jsonb_build_object(
      'game_id', g.id,
      'game_mode', g.game_mode,
      'played_at', g.created_at
    )) as shared_games
  FROM user_games g,
       jsonb_array_elements(g.participants) p
  WHERE 
    (p->>'user_id')::uuid != p_user_id
  GROUP BY (p->>'user_id')::uuid
  HAVING COUNT(*) >= 2  -- Require at least 2 games together
  ORDER BY interaction_count DESC, last_played_together DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT; 