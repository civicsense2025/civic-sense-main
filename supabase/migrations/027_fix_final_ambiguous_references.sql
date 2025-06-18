-- =============================================================================
-- FIX FINAL AMBIGUOUS COLUMN REFERENCES
-- =============================================================================
-- Fixes all remaining ambiguous column references in RLS policies and functions

BEGIN;

-- =============================================================================
-- DROP ALL PROBLEMATIC RLS POLICIES
-- =============================================================================

-- Drop all multiplayer RLS policies that might have ambiguous references
DROP POLICY IF EXISTS "Players can view players in rooms they joined" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can view quiz attempts in their games" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can view responses in their games" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "Players can view game events in their rooms" ON multiplayer_game_events;
DROP POLICY IF EXISTS "Players can view chat in their rooms" ON multiplayer_chat_messages;
DROP POLICY IF EXISTS "Players can view NPCs in their games" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Players can view conversation context in their games" ON multiplayer_conversation_context;
DROP POLICY IF EXISTS "Users can view multiplayer rooms" ON multiplayer_rooms;

-- =============================================================================
-- CREATE FIXED RLS POLICIES WITH PROPER ALIASES
-- =============================================================================

-- Fixed policy for multiplayer_rooms
CREATE POLICY "Users can view multiplayer rooms"
  ON multiplayer_rooms FOR SELECT
  USING (
    -- Host can always see their rooms
    multiplayer_rooms.host_user_id = auth.uid()
    OR
    -- Anyone can see rooms they're a player in
    EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.room_id = multiplayer_rooms.id AND mrp.user_id = auth.uid()
    )
    OR
    -- Allow viewing waiting rooms for joining
    multiplayer_rooms.room_status = 'waiting'
  );

-- Fixed policy for multiplayer_room_players
CREATE POLICY "Players can view players in rooms they joined"
  ON multiplayer_room_players FOR SELECT
  USING (
    -- User can see players in rooms where they are a player or host
    multiplayer_room_players.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE (
        -- User is the host
        mr.host_user_id = auth.uid()
        OR
        -- User is a player in the room
        EXISTS (
          SELECT 1 FROM multiplayer_room_players mrp2
          WHERE mrp2.room_id = mr.id 
          AND mrp2.user_id = auth.uid()
        )
      )
    )
    OR
    -- Always allow viewing guest/NPC players for public visibility
    multiplayer_room_players.user_id IS NULL
  );

-- Fixed policy for multiplayer_quiz_attempts
CREATE POLICY "Players can view quiz attempts in their games"
  ON multiplayer_quiz_attempts FOR SELECT
  USING (
    -- User can see attempts in rooms they're participating in
    multiplayer_quiz_attempts.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
  );

-- Fixed policy for multiplayer_question_responses
CREATE POLICY "Players can view responses in their games"
  ON multiplayer_question_responses FOR SELECT
  USING (
    -- User can see responses in rooms they're participating in
    multiplayer_question_responses.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
  );

-- Fixed policy for multiplayer_game_events
CREATE POLICY "Players can view game events in their rooms"
  ON multiplayer_game_events FOR SELECT
  USING (
    -- User can see events in rooms they're participating in
    multiplayer_game_events.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
  );

-- Fixed policy for multiplayer_chat_messages (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages') THEN
    EXECUTE 'CREATE POLICY "Players can view chat in their rooms"
      ON multiplayer_chat_messages FOR SELECT
      USING (
        multiplayer_chat_messages.room_id IN (
          SELECT mr.id FROM multiplayer_rooms mr
          WHERE mr.host_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM multiplayer_room_players mrp
            WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
          )
        )
      )';
  END IF;
END $$;

-- Fixed policy for multiplayer_npc_players (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players') THEN
    EXECUTE 'CREATE POLICY "Players can view NPCs in their games"
      ON multiplayer_npc_players FOR SELECT
      USING (
        multiplayer_npc_players.room_id IN (
          SELECT mr.id FROM multiplayer_rooms mr
          WHERE mr.host_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM multiplayer_room_players mrp
            WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
          )
        )
      )';
  END IF;
END $$;

-- Fixed policy for multiplayer_conversation_context (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context') THEN
    EXECUTE 'CREATE POLICY "Players can view conversation context in their games"
      ON multiplayer_conversation_context FOR SELECT
      USING (
        multiplayer_conversation_context.room_id IN (
          SELECT mr.id FROM multiplayer_rooms mr
          WHERE mr.host_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM multiplayer_room_players mrp
            WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
          )
        )
      )';
  END IF;
END $$;

-- =============================================================================
-- FIX REMAINING FUNCTION AMBIGUITIES
-- =============================================================================

-- Fix any remaining functions that might have ambiguous references
-- Drop all versions of update_conversation_context to avoid conflicts
DROP FUNCTION IF EXISTS update_conversation_context(UUID, BOOLEAN, VARCHAR(20), BOOLEAN);
DROP FUNCTION IF EXISTS update_conversation_context(UUID, INTEGER, INTEGER, INTEGER, INTEGER);

-- Recreate the function with the original signature but fixed column references
CREATE OR REPLACE FUNCTION update_conversation_context(
  p_room_id UUID,
  p_player_message BOOLEAN DEFAULT TRUE,
  p_mood VARCHAR(20) DEFAULT NULL,
  p_conflict_detected BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO multiplayer_conversation_context (
    room_id,
    last_message_at,
    total_messages,
    room_mood,
    conflict_detected
  ) VALUES (
    p_room_id,
    NOW(),
    1,
    COALESCE(p_mood, 'neutral'),
    COALESCE(p_conflict_detected, false)
  )
  ON CONFLICT (room_id) DO UPDATE SET
    last_message_at = NOW(),
    silence_duration_seconds = 0,
    total_messages = multiplayer_conversation_context.total_messages + 1,
    room_mood = COALESCE(p_mood, multiplayer_conversation_context.room_mood),
    conflict_detected = COALESCE(p_conflict_detected, multiplayer_conversation_context.conflict_detected),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fix check_silence_intervention function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'check_silence_intervention') THEN
    EXECUTE 'DROP FUNCTION IF EXISTS check_silence_intervention(UUID)';
    EXECUTE '
    CREATE OR REPLACE FUNCTION check_silence_intervention(p_room_id UUID)
    RETURNS TABLE(
      needs_intervention BOOLEAN,
      silence_duration INTEGER,
      last_message_at TIMESTAMPTZ,
      participant_count INTEGER
    ) AS $func$
    BEGIN
      RETURN QUERY
      SELECT 
        (mcc.silence_duration_seconds > 300) as needs_intervention,
        mcc.silence_duration_seconds,
        mcc.last_message_at,
        (SELECT COUNT(*)::INTEGER FROM multiplayer_room_players mrp WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE)
      FROM multiplayer_conversation_context mcc
      WHERE mcc.room_id = p_room_id;
    END;
    $func$ LANGUAGE plpgsql';
  END IF;
END $$;

-- =============================================================================
-- ADD INSERT/UPDATE POLICIES
-- =============================================================================

-- Allow users to join rooms (insert into multiplayer_room_players)
CREATE POLICY "Users can join rooms" ON multiplayer_room_players FOR INSERT
  WITH CHECK (
    -- User can join if the room exists and is accepting players
    EXISTS (
      SELECT 1 FROM multiplayer_rooms mr
      WHERE mr.id = multiplayer_room_players.room_id
      AND mr.room_status = 'waiting'
      AND mr.current_players < mr.max_players
    )
  );

-- Allow players to update their own data
CREATE POLICY "Players can update their own data" ON multiplayer_room_players FOR UPDATE
  USING (
    multiplayer_room_players.user_id = auth.uid()
    OR
    -- Allow updates for guest players by the room host
    (multiplayer_room_players.user_id IS NULL AND EXISTS (
      SELECT 1 FROM multiplayer_rooms mr
      WHERE mr.id = multiplayer_room_players.room_id AND mr.host_user_id = auth.uid()
    ))
  );

-- Allow players to create quiz attempts
CREATE POLICY "Players can create their own attempts" ON multiplayer_quiz_attempts FOR INSERT
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
  );

-- Allow players to update their own attempts
CREATE POLICY "Players can update their own attempts" ON multiplayer_quiz_attempts FOR UPDATE
  USING (multiplayer_quiz_attempts.player_id = auth.uid());

-- Allow players to create question responses
CREATE POLICY "Players can create their own responses" ON multiplayer_question_responses FOR INSERT
  WITH CHECK (
    -- User can create responses in rooms they're participating in
    multiplayer_question_responses.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
  );

-- Allow players to create game events
CREATE POLICY "Players can create events in their rooms" ON multiplayer_game_events FOR INSERT
  WITH CHECK (
    -- User can create events in rooms they're participating in
    multiplayer_game_events.room_id IN (
      SELECT mr.id FROM multiplayer_rooms mr
      WHERE mr.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM multiplayer_room_players mrp
        WHERE mrp.room_id = mr.id AND mrp.user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Ensure all necessary permissions are granted
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_ready_status TO authenticated;
GRANT EXECUTE ON FUNCTION start_multiplayer_game TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_players_ready TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rooms TO authenticated;

-- Grant permissions for NPC functions with specific signatures
GRANT EXECUTE ON FUNCTION add_npc_to_multiplayer_room(VARCHAR(8), VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION send_npc_message(UUID, UUID, TEXT, VARCHAR(20), VARCHAR(30), JSONB, VARCHAR(10), DECIMAL(3,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_context(UUID, BOOLEAN, VARCHAR(20), BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_silence_intervention(UUID) TO authenticated;

COMMIT;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Fixed all ambiguous column references in multiplayer RLS policies and functions by using fully qualified table names'; 