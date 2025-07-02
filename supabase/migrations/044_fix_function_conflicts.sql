-- Fix Function Conflicts Migration
-- This migration resolves function name conflicts by dropping all versions and recreating them

BEGIN;

-- =============================================================================
-- DROP ALL EXISTING MULTIPLAYER FUNCTIONS (ALL VERSIONS)
-- =============================================================================

-- Drop all versions of create_multiplayer_room
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT) CASCADE;

-- Drop all versions of join_multiplayer_room
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT) CASCADE;

-- Drop all versions of leave_multiplayer_room
DROP FUNCTION IF EXISTS leave_multiplayer_room(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS leave_multiplayer_room(TEXT, TEXT) CASCADE;

-- Drop all versions of update_player_ready_status
DROP FUNCTION IF EXISTS update_player_ready_status(UUID, UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS update_player_ready_status(TEXT, TEXT, BOOLEAN) CASCADE;

-- Drop all versions of start_multiplayer_game
DROP FUNCTION IF EXISTS start_multiplayer_game(UUID) CASCADE;
DROP FUNCTION IF EXISTS start_multiplayer_game(TEXT) CASCADE;

-- =============================================================================
-- CREATE CLEAN MULTIPLAYER FUNCTIONS WITH UNIQUE SIGNATURES
-- =============================================================================

-- Create multiplayer room function (version 2)
CREATE OR REPLACE FUNCTION create_multiplayer_room_v2(
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
  v_host_identifier TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate inputs
  IF p_topic_id IS NULL OR p_topic_id = '' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'Topic ID is required'::TEXT, FALSE;
    RETURN;
  END IF;

  -- Ensure we have either user_id or guest_token
  IF p_host_user_id IS NULL AND (p_host_guest_token IS NULL OR p_host_guest_token = '') THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'Either user ID or guest token is required'::TEXT, FALSE;
    RETURN;
  END IF;

  -- Generate unique room code
  v_room_code := generate_room_code();
  
  -- Set expiration (24 hours for users, 1 hour for guests)
  IF p_host_user_id IS NOT NULL THEN
    v_expires_at := NOW() + INTERVAL '24 hours';
  ELSE
    v_expires_at := NOW() + INTERVAL '1 hour';
  END IF;

  -- Create room
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
    COALESCE(p_room_name, 'Quiz Room'),
    p_max_players,
    1,
    'waiting',
    p_game_mode,
    '{}',
    v_expires_at
  ) RETURNING multiplayer_rooms.id INTO v_room_id;

  -- Add host as first player
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
    v_room_id,
    p_host_user_id,
    p_host_guest_token,
    COALESCE(p_room_name, 'Host'),
    '👑',
    TRUE,
    FALSE,
    TRUE,
    1
  ) RETURNING multiplayer_room_players.id INTO v_player_id;

  -- Return success
  RETURN QUERY SELECT 
    v_room_id,
    v_room_code,
    'Room created successfully'::TEXT,
    TRUE;
END;
$$;

-- Join multiplayer room function (version 2)
CREATE OR REPLACE FUNCTION join_multiplayer_room_v2(
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

  -- Get room details
  SELECT multiplayer_rooms.* INTO v_room_record
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
    FALSE,
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

-- Leave multiplayer room function (version 2)
CREATE OR REPLACE FUNCTION leave_multiplayer_room_v2(
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
  v_player_record RECORD;
  v_new_host_id UUID;
BEGIN
  -- Get player details
  SELECT * INTO v_player_record
  FROM multiplayer_room_players
  WHERE multiplayer_room_players.id = p_player_id AND multiplayer_room_players.room_id = p_room_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Player not found in room'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- If leaving player is host, reassign host
  IF v_player_record.is_host THEN
    SELECT multiplayer_room_players.id INTO v_new_host_id
    FROM multiplayer_room_players
    WHERE multiplayer_room_players.room_id = p_room_id 
    AND multiplayer_room_players.id != p_player_id
    AND multiplayer_room_players.is_connected = TRUE
    ORDER BY multiplayer_room_players.join_order
    LIMIT 1;

    IF v_new_host_id IS NOT NULL THEN
      UPDATE multiplayer_room_players
      SET is_host = TRUE
      WHERE multiplayer_room_players.id = v_new_host_id;
    END IF;
  END IF;

  -- Remove player from room
  DELETE FROM multiplayer_room_players
  WHERE multiplayer_room_players.id = p_player_id;

  -- Update room player count
  UPDATE multiplayer_rooms
  SET current_players = GREATEST(0, current_players - 1)
  WHERE multiplayer_rooms.id = p_room_id;

  RETURN QUERY SELECT TRUE, 'Left room successfully'::TEXT, v_new_host_id;
END;
$$;

-- Update player ready status function (version 2)
CREATE OR REPLACE FUNCTION update_player_ready_status_v2(
  p_room_id UUID,
  p_player_id UUID,
  p_is_ready BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE multiplayer_room_players
  SET is_ready = p_is_ready
  WHERE multiplayer_room_players.room_id = p_room_id 
  AND multiplayer_room_players.id = p_player_id;

  RETURN FOUND;
END;
$$;

-- Start multiplayer game function (version 2)
CREATE OR REPLACE FUNCTION start_multiplayer_game_v2(
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
  -- Check if all players are ready
  SELECT 
    COUNT(*) FILTER (WHERE multiplayer_room_players.is_ready = TRUE),
    COUNT(*)
  INTO v_ready_count, v_total_count
  FROM multiplayer_room_players
  WHERE multiplayer_room_players.room_id = p_room_id 
  AND multiplayer_room_players.is_connected = TRUE;

  -- Need at least 1 player and all must be ready
  IF v_total_count = 0 OR v_ready_count != v_total_count THEN
    RETURN FALSE;
  END IF;

  -- Update room status
  UPDATE multiplayer_rooms
  SET 
    room_status = 'in_progress',
    started_at = NOW()
  WHERE multiplayer_rooms.id = p_room_id;

  RETURN TRUE;
END;
$$;

-- =============================================================================
-- CREATE WRAPPER FUNCTIONS WITH ORIGINAL NAMES FOR BACKWARD COMPATIBILITY
-- =============================================================================

-- Wrapper for create_multiplayer_room
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
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM create_multiplayer_room_v2(
    p_topic_id,
    p_host_user_id,
    p_host_guest_token,
    p_room_name,
    p_max_players,
    p_game_mode
  );
$$;

-- Wrapper for join_multiplayer_room
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
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM join_multiplayer_room_v2(
    p_room_code,
    p_player_name,
    p_user_id,
    p_guest_token,
    p_player_emoji
  );
$$;

-- Wrapper for leave_multiplayer_room
CREATE OR REPLACE FUNCTION leave_multiplayer_room(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_host_player_id UUID
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM leave_multiplayer_room_v2(p_room_id, p_player_id);
$$;

-- Wrapper for update_player_ready_status
CREATE OR REPLACE FUNCTION update_player_ready_status(
  p_room_id UUID,
  p_player_id UUID,
  p_is_ready BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT update_player_ready_status_v2(p_room_id, p_player_id, p_is_ready);
$$;

-- Wrapper for start_multiplayer_game
CREATE OR REPLACE FUNCTION start_multiplayer_game(
  p_room_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT start_multiplayer_game_v2(p_room_id);
$$;

COMMIT; 