-- Comprehensive Multiplayer Function Fix
-- This migration completely recreates all multiplayer functions with proper column qualification

BEGIN;

-- Drop all existing multiplayer functions to start fresh
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS leave_multiplayer_room(UUID, UUID);
DROP FUNCTION IF EXISTS update_player_ready_status(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS start_multiplayer_game(UUID);

-- =============================================================================
-- CREATE MULTIPLAYER ROOM FUNCTION (FIXED)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id TEXT,
  p_host_user_id UUID DEFAULT NULL,
  p_host_guest_token TEXT DEFAULT NULL,
  p_room_name TEXT DEFAULT NULL,
  p_max_players INT DEFAULT 6,
  p_game_mode TEXT DEFAULT 'classic'
)
RETURNS TABLE (
  id UUID,
  room_code TEXT,
  message TEXT,
  success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_player_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate unique room code
  LOOP
    v_room_code := '';
    FOR i IN 1..8 LOOP
      v_room_code := v_room_code || CHR(65 + FLOOR(RANDOM() * 26)::INT);
    END LOOP;
    
    -- Check if code is unique
    IF NOT EXISTS (SELECT 1 FROM multiplayer_rooms WHERE multiplayer_rooms.room_code = v_room_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Calculate expiration time
  IF p_host_user_id IS NOT NULL THEN
    v_expires_at := NOW() + INTERVAL '24 hours'; -- 24 hours for authenticated users
  ELSE
    v_expires_at := NOW() + INTERVAL '1 hour';   -- 1 hour for guests
  END IF;

  -- Create the room
  INSERT INTO multiplayer_rooms (
    room_code,
    host_user_id,
    topic_id,
    room_name,
    max_players,
    current_players,
    room_status,
    game_mode,
    settings,
    expires_at
  ) VALUES (
    v_room_code,
    p_host_user_id,
    p_topic_id,
    COALESCE(p_room_name, 'Multiplayer Quiz'),
    p_max_players,
    0, -- Will be incremented when host joins
    'waiting',
    p_game_mode,
    '{}',
    v_expires_at
  ) RETURNING multiplayer_rooms.id INTO v_room_id;

  -- Add the host as the first player
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    is_ready,
    is_host,
    is_connected,
    join_order,
    boost_inventory
  ) VALUES (
    v_room_id,
    p_host_user_id,
    p_host_guest_token,
    CASE 
      WHEN p_host_user_id IS NOT NULL THEN 
        COALESCE((SELECT profiles.display_name FROM profiles WHERE profiles.id = p_host_user_id), 'Host')
      ELSE 'Guest Host'
    END,
    '👑',
    false,
    true,
    true,
    1,
    '{}'
  ) RETURNING multiplayer_room_players.id INTO v_player_id;

  -- Update room player count
  UPDATE multiplayer_rooms 
  SET current_players = 1 
  WHERE multiplayer_rooms.id = v_room_id;

  -- Return success
  RETURN QUERY SELECT 
    v_room_id as id,
    v_room_code as room_code,
    'Room created successfully' as message,
    true as success;
END;
$$;

-- =============================================================================
-- JOIN MULTIPLAYER ROOM FUNCTION (FIXED)
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
  v_room_id UUID;
  v_current_players INT;
  v_max_players INT;
  v_room_status TEXT;
  v_player_id UUID;
  v_join_order INT;
  v_host_user_id UUID;
BEGIN
  -- Find the room
  SELECT 
    multiplayer_rooms.id, 
    multiplayer_rooms.current_players, 
    multiplayer_rooms.max_players, 
    multiplayer_rooms.room_status,
    multiplayer_rooms.host_user_id
  INTO v_room_id, v_current_players, v_max_players, v_room_status, v_host_user_id
  FROM multiplayer_rooms 
  WHERE multiplayer_rooms.room_code = UPPER(p_room_code);

  -- Check if room exists
  IF v_room_id IS NULL THEN
    RETURN QUERY SELECT false, 'Room not found', NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check if room is accepting players
  IF v_room_status != 'waiting' THEN
    RETURN QUERY SELECT false, 'Room is not accepting new players', NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check if room is full
  IF v_current_players >= v_max_players THEN
    RETURN QUERY SELECT false, 'Room is full', NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Check if player is already in room
  IF EXISTS (
    SELECT 1 FROM multiplayer_room_players 
    WHERE multiplayer_room_players.room_id = v_room_id 
    AND (
      (p_user_id IS NOT NULL AND multiplayer_room_players.user_id = p_user_id) OR
      (p_guest_token IS NOT NULL AND multiplayer_room_players.guest_token = p_guest_token)
    )
  ) THEN
    RETURN QUERY SELECT false, 'You are already in this room', NULL::UUID, NULL::UUID, NULL::INT;
    RETURN;
  END IF;

  -- Get next join order
  SELECT COALESCE(MAX(multiplayer_room_players.join_order), 0) + 1 
  INTO v_join_order
  FROM multiplayer_room_players 
  WHERE multiplayer_room_players.room_id = v_room_id;

  -- Add player to room
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    is_ready,
    is_host,
    is_connected,
    join_order,
    boost_inventory
  ) VALUES (
    v_room_id,
    p_user_id,
    p_guest_token,
    p_player_name,
    p_player_emoji,
    false,
    false, -- Only the room creator is host
    true,
    v_join_order,
    '{}'
  ) RETURNING multiplayer_room_players.id INTO v_player_id;

  -- Update room player count
  UPDATE multiplayer_rooms 
  SET current_players = current_players + 1 
  WHERE multiplayer_rooms.id = v_room_id;

  -- Return success
  RETURN QUERY SELECT 
    true as success,
    'Joined room successfully' as message,
    v_room_id as room_id,
    v_player_id as player_id,
    v_join_order as join_order;
END;
$$;

-- =============================================================================
-- LEAVE MULTIPLAYER ROOM FUNCTION (FIXED)
-- =============================================================================

CREATE OR REPLACE FUNCTION leave_multiplayer_room(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_host_player_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_host BOOLEAN;
  v_new_host_id UUID;
  v_current_players INT;
BEGIN
  -- Check if player is host
  SELECT multiplayer_room_players.is_host 
  INTO v_is_host
  FROM multiplayer_room_players 
  WHERE multiplayer_room_players.id = p_player_id 
  AND multiplayer_room_players.room_id = p_room_id;

  -- If player not found
  IF v_is_host IS NULL THEN
    RETURN QUERY SELECT false, 'Player not found in room', NULL::UUID;
    RETURN;
  END IF;

  -- If leaving player is host, find new host
  IF v_is_host THEN
    SELECT multiplayer_room_players.id 
    INTO v_new_host_id
    FROM multiplayer_room_players 
    WHERE multiplayer_room_players.room_id = p_room_id 
    AND multiplayer_room_players.id != p_player_id
    AND multiplayer_room_players.is_connected = true
    ORDER BY multiplayer_room_players.join_order
    LIMIT 1;

    -- Assign new host if found
    IF v_new_host_id IS NOT NULL THEN
      UPDATE multiplayer_room_players 
      SET is_host = true 
      WHERE multiplayer_room_players.id = v_new_host_id;
    END IF;
  END IF;

  -- Remove player from room
  DELETE FROM multiplayer_room_players 
  WHERE multiplayer_room_players.id = p_player_id 
  AND multiplayer_room_players.room_id = p_room_id;

  -- Update room player count
  SELECT multiplayer_rooms.current_players 
  INTO v_current_players
  FROM multiplayer_rooms 
  WHERE multiplayer_rooms.id = p_room_id;

  UPDATE multiplayer_rooms 
  SET current_players = GREATEST(0, v_current_players - 1)
  WHERE multiplayer_rooms.id = p_room_id;

  -- If no players left, mark room as abandoned
  IF v_current_players <= 1 THEN
    UPDATE multiplayer_rooms 
    SET room_status = 'abandoned' 
    WHERE multiplayer_rooms.id = p_room_id;
  END IF;

  RETURN QUERY SELECT 
    true as success,
    'Left room successfully' as message,
    v_new_host_id as new_host_player_id;
END;
$$;

-- =============================================================================
-- UPDATE PLAYER READY STATUS FUNCTION (FIXED)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_player_ready_status(
  p_room_id UUID,
  p_player_id UUID,
  p_is_ready BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update player ready status
  UPDATE multiplayer_room_players 
  SET is_ready = p_is_ready,
      last_activity = NOW()
  WHERE multiplayer_room_players.id = p_player_id 
  AND multiplayer_room_players.room_id = p_room_id;

  -- Return true if update was successful
  RETURN FOUND;
END;
$$;

-- =============================================================================
-- START MULTIPLAYER GAME FUNCTION (FIXED)
-- =============================================================================

CREATE OR REPLACE FUNCTION start_multiplayer_game(
  p_room_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ready_count INT;
  v_total_count INT;
BEGIN
  -- Count ready players
  SELECT 
    COUNT(*) FILTER (WHERE multiplayer_room_players.is_ready = true),
    COUNT(*)
  INTO v_ready_count, v_total_count
  FROM multiplayer_room_players 
  WHERE multiplayer_room_players.room_id = p_room_id 
  AND multiplayer_room_players.is_connected = true;

  -- Check if all players are ready (minimum 1 player)
  IF v_total_count = 0 OR v_ready_count < v_total_count THEN
    RETURN false;
  END IF;

  -- Update room status to starting
  UPDATE multiplayer_rooms 
  SET room_status = 'starting',
      started_at = NOW()
  WHERE multiplayer_rooms.id = p_room_id;

  -- Create game event
  INSERT INTO multiplayer_game_events (
    room_id,
    event_type,
    event_data,
    created_at
  ) VALUES (
    p_room_id,
    'game_started',
    jsonb_build_object('started_at', NOW()),
    NOW()
  );

  RETURN true;
END;
$$;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_multiplayer_rooms()
RETURNS TABLE (
  cleaned_rooms INT,
  cleaned_players INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_rooms INT := 0;
  v_cleaned_players INT := 0;
  v_room_ids UUID[];
BEGIN
  -- Get expired room IDs
  SELECT ARRAY_AGG(multiplayer_rooms.id)
  INTO v_room_ids
  FROM multiplayer_rooms
  WHERE multiplayer_rooms.expires_at < NOW()
  AND multiplayer_rooms.room_status IN ('waiting', 'starting');

  -- Count players to be cleaned
  SELECT COUNT(*)
  INTO v_cleaned_players
  FROM multiplayer_room_players
  WHERE multiplayer_room_players.room_id = ANY(v_room_ids);

  -- Delete players from expired rooms
  DELETE FROM multiplayer_room_players
  WHERE multiplayer_room_players.room_id = ANY(v_room_ids);

  -- Delete expired rooms
  DELETE FROM multiplayer_rooms
  WHERE multiplayer_rooms.id = ANY(v_room_ids);

  GET DIAGNOSTICS v_cleaned_rooms = ROW_COUNT;

  RETURN QUERY SELECT v_cleaned_rooms, v_cleaned_players;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO anon, authenticated;
GRANT EXECUTE ON FUNCTION leave_multiplayer_room TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_player_ready_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION start_multiplayer_game TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_multiplayer_rooms TO anon, authenticated;

COMMIT; 