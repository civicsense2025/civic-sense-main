-- Fix ambiguous column references in create_multiplayer_room function
-- This specifically addresses PostgreSQL error 42702 in room creation

-- Drop the existing function
DROP FUNCTION IF EXISTS create_multiplayer_room;

-- Recreate with properly qualified column names
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
  v_host_identifier TEXT;
  v_expiry_hours INT;
BEGIN
  -- Validate inputs
  IF p_host_user_id IS NULL AND p_host_guest_token IS NULL THEN
    RETURN QUERY 
    SELECT 
      NULL::UUID as id,
      NULL::TEXT as room_code,
      'Either user ID or guest token is required'::TEXT as message,
      FALSE as success;
    RETURN;
  END IF;

  -- Determine host identifier and expiry time
  IF p_host_user_id IS NOT NULL THEN
    v_host_identifier := 'user_' || p_host_user_id::TEXT;
    v_expiry_hours := 24; -- 24 hours for authenticated users
  ELSE
    v_host_identifier := 'guest_' || p_host_guest_token;
    v_expiry_hours := 1; -- 1 hour for guests
  END IF;

  -- Generate unique room code
  LOOP
    v_room_code := upper(
      substring(md5(random()::text || clock_timestamp()::text) for 8)
    );
    
    -- Check if code already exists (with explicit table qualification)
    EXIT WHEN NOT EXISTS (
      SELECT 1 
      FROM multiplayer_rooms mr 
      WHERE mr.room_code = v_room_code 
        AND mr.room_status IN ('waiting', 'starting', 'in_progress')
    );
  END LOOP;

  -- Create the room (with explicit column qualification)
  INSERT INTO multiplayer_rooms (
    room_code,
    host_user_id,
    host_guest_token,
    topic_id,
    room_name,
    max_players,
    game_mode,
    room_status,
    current_players,
    expires_at
  ) VALUES (
    v_room_code,
    p_host_user_id,
    p_host_guest_token,
    p_topic_id,
    COALESCE(p_room_name, 'Room ' || v_room_code),
    p_max_players,
    p_game_mode,
    'waiting',
    1, -- Host counts as first player
    NOW() + INTERVAL '1 hour' * v_expiry_hours
  )
  RETURNING multiplayer_rooms.id INTO v_room_id; -- Explicit table qualification

  -- Add host as first player (with explicit column qualification)
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    is_host,
    is_ready,
    join_order,
    is_connected
  ) VALUES (
    v_room_id,
    p_host_user_id,
    p_host_guest_token,
    CASE 
      WHEN p_host_user_id IS NOT NULL THEN 
        COALESCE(
          (SELECT au.raw_user_meta_data->>'full_name' 
           FROM auth.users au 
           WHERE au.id = p_host_user_id),
          'Player 1'
        )
      ELSE 'Guest Player'
    END,
    '😊',
    TRUE, -- Host flag
    FALSE, -- Not ready initially
    1, -- First to join
    TRUE -- Connected
  )
  RETURNING multiplayer_room_players.id INTO v_player_id; -- Explicit table qualification

  -- Return success with room details (no table qualification in RETURNING)
  RETURN QUERY 
  SELECT 
    v_room_id as id,
    v_room_code as room_code,
    'Room created successfully'::TEXT as message,
    TRUE as success;

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN QUERY 
  SELECT 
    NULL::UUID as id,
    NULL::TEXT as room_code,
    SQLERRM::TEXT as message,
    FALSE as success;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon; 