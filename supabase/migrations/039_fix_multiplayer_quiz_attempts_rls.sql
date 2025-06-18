-- =============================================================================
-- FIX MULTIPLAYER QUIZ ATTEMPTS RLS POLICY
-- =============================================================================
-- Fixes the RLS policy that prevents start_multiplayer_game from creating
-- quiz attempts for all players in a room

BEGIN;

-- =============================================================================
-- DROP EXISTING POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Players can create their own attempts" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can update their own attempts" ON multiplayer_quiz_attempts;

-- =============================================================================
-- CREATE SECURITY DEFINER FUNCTION FOR STARTING GAMES
-- =============================================================================

-- Make start_multiplayer_game run with elevated privileges
DROP FUNCTION IF EXISTS start_multiplayer_game(UUID);

CREATE OR REPLACE FUNCTION start_multiplayer_game(p_room_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  -- Check if all players are ready
  IF NOT check_all_players_ready(p_room_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Update room status
  UPDATE multiplayer_rooms
  SET room_status = 'in_progress',
      started_at = NOW()
  WHERE id = p_room_id;
  
  -- Create quiz attempts for all players (including NPCs)
  INSERT INTO multiplayer_quiz_attempts (
    room_id,
    player_id,
    topic_id,
    total_questions
  )
  SELECT 
    p_room_id,
    mrp.id,
    mr.topic_id,
    10 -- Default question count, can be made configurable
  FROM multiplayer_room_players mrp
  JOIN multiplayer_rooms mr ON mr.id = p_room_id
  WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE NEW RLS POLICIES
-- =============================================================================

-- Allow players to create attempts in rooms they're participating in
-- OR allow the start_multiplayer_game function to create attempts for anyone
CREATE POLICY "Players can create quiz attempts" ON multiplayer_quiz_attempts FOR INSERT
  WITH CHECK (
    -- User can create attempts in rooms they're participating in
    multiplayer_quiz_attempts.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
    OR
    -- Allow creation during game start (when function runs as SECURITY DEFINER)
    current_setting('role', true) = 'postgres'
  );

-- Allow players to update their own attempts
CREATE POLICY "Players can update their own attempts" ON multiplayer_quiz_attempts FOR UPDATE
  USING (
    -- Find the user_id associated with this player_id
    EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.id = multiplayer_quiz_attempts.player_id
      AND mrp.user_id = auth.uid()
    )
    OR
    -- Allow updates for NPCs by room host
    EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      JOIN multiplayer_rooms mr ON mr.id = mrp.room_id
      WHERE mrp.id = multiplayer_quiz_attempts.player_id
      AND mrp.user_id IS NULL -- NPC player
      AND mr.host_user_id = auth.uid()
    )
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permission on the security definer function
GRANT EXECUTE ON FUNCTION start_multiplayer_game(UUID) TO authenticated;

-- Ensure the function owner has necessary permissions
ALTER FUNCTION start_multiplayer_game(UUID) OWNER TO postgres;

COMMIT;

-- Add helpful comment
COMMENT ON FUNCTION start_multiplayer_game(UUID) IS 'Starts a multiplayer game and creates quiz attempts for all players. Runs with elevated privileges to bypass RLS.'; 