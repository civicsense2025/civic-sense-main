-- Fix join_multiplayer_room Function Conflict
-- This migration specifically addresses the function signature conflict between text and character varying

BEGIN;

-- =============================================================================
-- DROP ALL VERSIONS OF join_multiplayer_room WITH ALL POSSIBLE SIGNATURES
-- =============================================================================

-- Drop function with text parameters
DROP FUNCTION IF EXISTS join_multiplayer_room(text, text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(text, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(text, text, uuid) CASCADE;

-- Drop function with character varying parameters
DROP FUNCTION IF EXISTS join_multiplayer_room(character varying, text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(character varying, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(character varying, text, uuid) CASCADE;

-- Drop function with varchar parameters
DROP FUNCTION IF EXISTS join_multiplayer_room(varchar, text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(varchar, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(varchar, text, uuid) CASCADE;

-- Drop any remaining versions
DROP FUNCTION IF EXISTS join_multiplayer_room CASCADE;

-- =============================================================================
-- CREATE SINGLE UNAMBIGUOUS join_multiplayer_room FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_code TEXT,
  p_player_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL,
  p_player_emoji TEXT DEFAULT '😊'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  room_id UUID,
  player_id UUID,
  join_order INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_record RECORD;
  v_player_id UUID;
  v_join_order INT;
  v_is_host BOOLEAN := FALSE;
BEGIN
  -- Validate inputs
  IF p_room_code IS NULL OR p_room_code = '' THEN
    RETURN QUERY SELECT FALSE, 'Room code is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  IF p_player_name IS NULL OR p_player_name = '' THEN
    RETURN QUERY SELECT FALSE, 'Player name is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Ensure we have either user_id or guest_token
  IF p_user_id IS NULL AND (p_guest_token IS NULL OR p_guest_token = '') THEN
    RETURN QUERY SELECT FALSE, 'Either user ID or guest token is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Get room details with explicit column qualification
  SELECT 
    multiplayer_rooms.id,
    multiplayer_rooms.room_code,
    multiplayer_rooms.host_user_id,
    multiplayer_rooms.topic_id,
    multiplayer_rooms.room_name,
    multiplayer_rooms.max_players,
    multiplayer_rooms.current_players,
    multiplayer_rooms.room_status,
    multiplayer_rooms.game_mode,
    multiplayer_rooms.settings,
    multiplayer_rooms.created_at,
    multiplayer_rooms.started_at,
    multiplayer_rooms.expires_at
  INTO v_room_record
  FROM multiplayer_rooms
  WHERE multiplayer_rooms.room_code = UPPER(p_room_code);

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Room not found'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check room status
  IF v_room_record.room_status != 'waiting' THEN
    RETURN QUERY SELECT FALSE, 'Room is not accepting new players'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check room capacity
  IF v_room_record.current_players >= v_room_record.max_players THEN
    RETURN QUERY SELECT FALSE, 'Room is full'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check if player already in room
  IF EXISTS (
    SELECT 1 FROM multiplayer_room_players 
    WHERE multiplayer_room_players.room_id = v_room_record.id 
    AND (
      (p_user_id IS NOT NULL AND multiplayer_room_players.user_id = p_user_id) OR
      (p_guest_token IS NOT NULL AND multiplayer_room_players.guest_token = p_guest_token)
    )
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already in this room'::TEXT, NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check if this is the room creator (host)
  IF (p_user_id IS NOT NULL AND v_room_record.host_user_id = p_user_id) THEN
    v_is_host := TRUE;
  END IF;

  -- If no existing host in room, make this player the host
  IF NOT EXISTS (
    SELECT 1 FROM multiplayer_room_players 
    WHERE multiplayer_room_players.room_id = v_room_record.id 
    AND multiplayer_room_players.is_host = TRUE
  ) THEN
    v_is_host := TRUE;
  END IF;

  -- Get next join order
  SELECT COALESCE(MAX(multiplayer_room_players.join_order), 0) + 1 INTO v_join_order
  FROM multiplayer_room_players
  WHERE multiplayer_room_players.room_id = v_room_record.id;

  -- Add player to room
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    is_host,
    is_ready,
    is_connected,
    join_order
  ) VALUES (
    v_room_record.id,
    p_user_id,
    p_guest_token,
    p_player_name,
    p_player_emoji,
    v_is_host,
    FALSE,
    TRUE,
    v_join_order
  ) RETURNING multiplayer_room_players.id INTO v_player_id;

  -- Update room player count
  UPDATE multiplayer_rooms 
  SET current_players = current_players + 1
  WHERE multiplayer_rooms.id = v_room_record.id;

  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Joined room successfully'::TEXT,
    v_room_record.id,
    v_player_id,
    v_join_order;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION join_multiplayer_room TO anon, authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  function_count INT;
BEGIN
  -- Check that we have exactly one join_multiplayer_room function
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'join_multiplayer_room';
  
  IF function_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Exactly one join_multiplayer_room function exists';
  ELSE
    RAISE WARNING 'ISSUE: Found % versions of join_multiplayer_room function', function_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION join_multiplayer_room IS 'Joins players to multiplayer rooms with single unambiguous signature using TEXT parameters';

COMMIT; 