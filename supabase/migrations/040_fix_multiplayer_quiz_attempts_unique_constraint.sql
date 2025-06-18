-- Fix multiplayer quiz attempts unique constraint
-- The UNIQUE(room_id, player_id) constraint is too restrictive
-- Players should be able to play multiple games in the same room

BEGIN;

-- Remove the problematic unique constraint that prevents players from playing multiple games in the same room
ALTER TABLE multiplayer_quiz_attempts 
DROP CONSTRAINT IF EXISTS multiplayer_quiz_attempts_room_id_player_id_key;

-- Instead, we'll add a unique constraint on (room_id, player_id, started_at) 
-- to ensure uniqueness per game session while allowing multiple games
-- But first, let's add a game_session_id to better track individual game sessions

-- Add a game_session_id column to track individual game sessions within a room
ALTER TABLE multiplayer_quiz_attempts 
ADD COLUMN IF NOT EXISTS game_session_id UUID DEFAULT gen_random_uuid();

-- Create an index for better performance on game sessions
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_game_session 
ON multiplayer_quiz_attempts(game_session_id);

-- Add a unique constraint that allows multiple attempts per player per room
-- but ensures uniqueness within a specific game session
ALTER TABLE multiplayer_quiz_attempts 
ADD CONSTRAINT multiplayer_quiz_attempts_room_player_session_key 
UNIQUE(room_id, player_id, game_session_id);

-- Update the start_multiplayer_game function to handle the new game_session_id
CREATE OR REPLACE FUNCTION start_multiplayer_game(p_room_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_game_session_id UUID;
BEGIN
  -- Check if all players are ready
  IF NOT check_all_players_ready(p_room_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Generate a new game session ID for this game
  new_game_session_id := gen_random_uuid();
  
  -- Update room status
  UPDATE multiplayer_rooms
  SET room_status = 'in_progress',
      started_at = NOW()
  WHERE id = p_room_id;
  
  -- Create quiz attempts for all players with the new game session ID
  INSERT INTO multiplayer_quiz_attempts (
    room_id,
    player_id,
    topic_id,
    total_questions,
    game_session_id
  )
  SELECT 
    p_room_id,
    mrp.id,
    mr.topic_id,
    10, -- Default question count, can be made configurable
    new_game_session_id
  FROM multiplayer_room_players mrp
  JOIN multiplayer_rooms mr ON mr.id = p_room_id
  WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE;
  
  RETURN TRUE;
END;
$$;

-- Add helpful comment
COMMENT ON COLUMN multiplayer_quiz_attempts.game_session_id IS 'Unique identifier for each game session within a room, allowing players to play multiple games';

COMMIT; 