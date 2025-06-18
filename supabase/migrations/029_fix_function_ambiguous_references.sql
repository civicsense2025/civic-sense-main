-- =============================================================================
-- FIX AMBIGUOUS COLUMN REFERENCES IN MULTIPLAYER FUNCTIONS
-- =============================================================================
-- Fixes ambiguous column references in functions that cause PostgreSQL errors

BEGIN;

-- =============================================================================
-- DROP AND RECREATE FUNCTIONS WITH PROPER COLUMN QUALIFICATION
-- =============================================================================

-- Fix join_multiplayer_room function
DROP FUNCTION IF EXISTS join_multiplayer_room(VARCHAR(8), VARCHAR(50), UUID, VARCHAR(255), VARCHAR(10));

CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_code VARCHAR(8),
  p_player_name VARCHAR(50),
  p_user_id UUID DEFAULT NULL,
  p_guest_token VARCHAR(255) DEFAULT NULL,
  p_player_emoji VARCHAR(10) DEFAULT '😊'
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  room_id UUID,
  player_id UUID,
  join_order INTEGER
) AS $$
DECLARE
  target_room_id UUID;
  target_max_players INTEGER;
  target_current_players INTEGER;
  target_status VARCHAR(20);
  new_player_id UUID;
  new_join_order INTEGER;
BEGIN
  -- Find the room
  SELECT mr.id, mr.max_players, mr.current_players, mr.room_status
  INTO target_room_id, target_max_players, target_current_players, target_status
  FROM multiplayer_rooms mr
  WHERE mr.room_code = p_room_code;
  
  -- Check if room exists
  IF target_room_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Room not found', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if room is in waiting state
  IF target_status != 'waiting' THEN
    RETURN QUERY SELECT FALSE, 'Room is not accepting new players', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if room is full
  IF target_current_players >= target_max_players THEN
    RETURN QUERY SELECT FALSE, 'Room is full', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if player is already in room (with proper table qualification)
  IF EXISTS (
    SELECT 1 FROM multiplayer_room_players mrp
    WHERE mrp.room_id = target_room_id 
    AND (
      (p_user_id IS NOT NULL AND mrp.user_id = p_user_id) OR
      (p_guest_token IS NOT NULL AND mrp.guest_token = p_guest_token)
    )
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already in this room', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Calculate join order (with proper table qualification)
  SELECT COALESCE(MAX(mrp.join_order), 0) + 1
  INTO new_join_order
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = target_room_id;
  
  -- Add player to room
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    join_order,
    is_host
  ) VALUES (
    target_room_id,
    p_user_id,
    p_guest_token,
    p_player_name,
    p_player_emoji,
    new_join_order,
    FALSE
  ) RETURNING id INTO new_player_id;
  
  -- Update room player count (with proper table qualification)
  UPDATE multiplayer_rooms mr
  SET current_players = mr.current_players + 1
  WHERE mr.id = target_room_id;
  
  RETURN QUERY SELECT TRUE, 'Successfully joined room', target_room_id, new_player_id, new_join_order;
END;
$$ LANGUAGE plpgsql;

-- Fix update_player_ready_status function
DROP FUNCTION IF EXISTS update_player_ready_status(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION update_player_ready_status(
  p_room_id UUID,
  p_player_id UUID,
  p_is_ready BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE multiplayer_room_players mrp
  SET is_ready = p_is_ready,
      last_activity = NOW()
  WHERE mrp.room_id = p_room_id AND mrp.id = p_player_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fix check_all_players_ready function
DROP FUNCTION IF EXISTS check_all_players_ready(UUID);

CREATE OR REPLACE FUNCTION check_all_players_ready(p_room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_players INTEGER;
  ready_players INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_players
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE;
  
  SELECT COUNT(*) INTO ready_players
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE AND mrp.is_ready = TRUE;
  
  RETURN total_players > 1 AND total_players = ready_players;
END;
$$ LANGUAGE plpgsql;

-- Fix start_multiplayer_game function
DROP FUNCTION IF EXISTS start_multiplayer_game(UUID);

CREATE OR REPLACE FUNCTION start_multiplayer_game(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all players are ready
  IF NOT check_all_players_ready(p_room_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Update room status (with proper table qualification)
  UPDATE multiplayer_rooms mr
  SET room_status = 'in_progress',
      started_at = NOW()
  WHERE mr.id = p_room_id;
  
  -- Create quiz attempts for all players (with proper table qualification)
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

-- Fix cleanup_expired_rooms function
DROP FUNCTION IF EXISTS cleanup_expired_rooms();

CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM multiplayer_rooms mr
  WHERE mr.expires_at < NOW()
  OR (mr.room_status = 'waiting' AND mr.created_at < NOW() - INTERVAL '2 hours')
  OR (mr.room_status = 'completed' AND mr.completed_at < NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on the fixed functions
GRANT EXECUTE ON FUNCTION join_multiplayer_room(VARCHAR(8), VARCHAR(50), UUID, VARCHAR(255), VARCHAR(10)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_ready_status(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_players_ready(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_multiplayer_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rooms() TO authenticated;

-- Also grant permissions on other functions that might be needed
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION generate_room_code TO authenticated;

-- Grant permissions for NPC functions with specific signatures (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'add_npc_to_multiplayer_room') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION add_npc_to_multiplayer_room(VARCHAR(8), VARCHAR(20)) TO authenticated';
  END IF;
  
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'send_npc_message') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION send_npc_message(UUID, UUID, TEXT, VARCHAR(20), VARCHAR(30), JSONB, VARCHAR(10), DECIMAL(3,2)) TO authenticated';
  END IF;
  
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_conversation_context') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION update_conversation_context(UUID, BOOLEAN, VARCHAR(20), BOOLEAN) TO authenticated';
  END IF;
  
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'check_silence_intervention') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION check_silence_intervention(UUID) TO authenticated';
  END IF;
END $$;

COMMIT;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Fixed ambiguous column references in all multiplayer functions by using proper table aliases'; 