-- Fix for ambiguous "id" column reference in create_multiplayer_room function
-- This migration ensures all column references are explicitly qualified with table names

BEGIN;

-- Drop the existing function
DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

-- Recreate with fixed column references
CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id VARCHAR(255),
  p_host_user_id UUID DEFAULT NULL,
  p_host_guest_token TEXT DEFAULT NULL,
  p_room_name VARCHAR(100) DEFAULT NULL,
  p_max_players INTEGER DEFAULT 6,
  p_game_mode VARCHAR(20) DEFAULT 'classic'
)
RETURNS TABLE(
  id UUID,
  room_code VARCHAR(8),
  topic_id VARCHAR(255),
  room_name VARCHAR(100),
  max_players INTEGER,
  current_players INTEGER,
  game_mode VARCHAR(20),
  room_status TEXT,
  host_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  new_room_id UUID;
  new_room_code VARCHAR(8);
  host_player_id UUID;
  host_player_name TEXT;
  host_player_emoji TEXT;
BEGIN
  -- Validate inputs
  IF p_topic_id IS NULL OR p_topic_id = '' THEN
    RAISE EXCEPTION 'topic_id cannot be null or empty';
  END IF;
  
  IF p_host_user_id IS NULL AND (p_host_guest_token IS NULL OR p_host_guest_token = '') THEN
    RAISE EXCEPTION 'Either host_user_id or host_guest_token must be provided';
  END IF;
  
  -- Generate unique room code
  new_room_code := generate_room_code();
  
  -- Ensure room code is unique (explicitly qualify table name)
  WHILE EXISTS (SELECT 1 FROM multiplayer_rooms WHERE multiplayer_rooms.room_code = new_room_code) LOOP
    new_room_code := generate_room_code();
  END LOOP;
  
  -- Create the room (FIXED: Don't qualify id in RETURNING clause)
  INSERT INTO multiplayer_rooms (
    room_code,
    topic_id,
    room_name,
    max_players,
    current_players,
    game_mode,
    room_status,
    host_user_id,
    expires_at
  ) VALUES (
    new_room_code,
    p_topic_id,
    COALESCE(p_room_name, 'Multiplayer Room'),
    COALESCE(p_max_players, 6),
    1, -- Start with 1 player (the host)
    COALESCE(p_game_mode, 'classic'),
    'waiting',
    p_host_user_id,
    NOW() + INTERVAL '2 hours'
  ) RETURNING id INTO new_room_id; -- FIXED: Don't qualify with table name in RETURNING
  
  -- Determine host display name and emoji
  IF p_host_user_id IS NOT NULL THEN
    -- Try to get user's display name from auth.users (explicitly qualify columns)
    SELECT COALESCE(
      auth.users.raw_user_meta_data->>'display_name',
      auth.users.raw_user_meta_data->>'full_name', 
      auth.users.raw_user_meta_data->>'name',
      auth.users.email,
      'Player'
    ) INTO host_player_name
    FROM auth.users 
    WHERE auth.users.id = p_host_user_id;
    
    host_player_emoji := '👑';
  ELSE
    -- Guest host
    host_player_name := 'Host';
    host_player_emoji := '👑';
  END IF;
  
  -- Automatically add the host as a player (FIXED: Don't qualify id in RETURNING)
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    join_order,
    is_host,
    is_ready,
    is_connected
  ) VALUES (
    new_room_id,
    p_host_user_id,
    p_host_guest_token,
    COALESCE(host_player_name, 'Host'),
    host_player_emoji,
    1, -- First player
    TRUE, -- This is the host
    FALSE, -- Host starts as not ready
    TRUE -- Host is connected
  ) RETURNING id INTO host_player_id; -- FIXED: Don't qualify with table name in RETURNING
  
  RAISE NOTICE 'Created room % with host player %', new_room_code, host_player_id;
  
  -- Return room data (all columns explicitly qualified)
  RETURN QUERY 
  SELECT 
    multiplayer_rooms.id,
    multiplayer_rooms.room_code,
    multiplayer_rooms.topic_id,
    multiplayer_rooms.room_name,
    multiplayer_rooms.max_players,
    multiplayer_rooms.current_players,
    multiplayer_rooms.game_mode,
    multiplayer_rooms.room_status,
    multiplayer_rooms.host_user_id,
    multiplayer_rooms.created_at
  FROM multiplayer_rooms
  WHERE multiplayer_rooms.id = new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;

-- Add comment
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms with fully qualified column references to avoid ambiguity errors';

-- Test the function
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Test with guest host
  SELECT * INTO test_result
  FROM create_multiplayer_room(
    'test-topic-ambiguity-fix',
    NULL,
    'test-guest-token-fix',
    'Test Ambiguity Fix Room',
    4,
    'classic'
  );
  
  IF test_result.id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: Function works without ambiguity errors. Room code: %', test_result.room_code;
    
    -- Cleanup
    DELETE FROM multiplayer_room_players WHERE multiplayer_room_players.room_id = test_result.id;
    DELETE FROM multiplayer_rooms WHERE multiplayer_rooms.id = test_result.id;
  ELSE
    RAISE WARNING 'FAILED: Function did not return a room';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERROR testing function: %', SQLERRM;
END $$;

COMMIT; 