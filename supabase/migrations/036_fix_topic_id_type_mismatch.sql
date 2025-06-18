-- =============================================================================
-- FIX TOPIC_ID TYPE MISMATCH
-- =============================================================================
-- Fixes the type mismatch where topic_id is VARCHAR(255) in the table but 
-- TEXT in the function return type, causing "structure of query does not 
-- match function result type" error in column 3

BEGIN;

-- Drop the problematic function
DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

-- Recreate with correct VARCHAR(255) type for topic_id to match the table column
CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id VARCHAR(255),  -- Changed from TEXT to VARCHAR(255) to match table column
  p_host_user_id UUID DEFAULT NULL,
  p_host_guest_token TEXT DEFAULT NULL,
  p_room_name TEXT DEFAULT NULL,
  p_max_players INTEGER DEFAULT 4,
  p_game_mode TEXT DEFAULT 'classic'
)
RETURNS TABLE(
  id UUID,
  room_code VARCHAR(8),
  topic_id VARCHAR(255),  -- Changed from TEXT to VARCHAR(255) to match table column
  room_name TEXT,
  max_players INTEGER,
  current_players INTEGER,
  game_mode TEXT,
  room_status TEXT,
  host_user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_room_code VARCHAR(8);
  v_room_id UUID;
BEGIN
  -- Generate unique room code with explicit table reference
  LOOP
    v_room_code := generate_room_code();
    -- Explicitly reference the table column to avoid ambiguity
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM multiplayer_rooms mr WHERE mr.room_code = v_room_code
    );
  END LOOP;

  -- Create room (host_user_id can be NULL for guest hosts)
  INSERT INTO multiplayer_rooms (
    room_code, 
    topic_id, 
    host_user_id, 
    room_name, 
    max_players, 
    game_mode,
    current_players,
    room_status
  ) VALUES (
    v_room_code, 
    p_topic_id, 
    p_host_user_id, 
    COALESCE(p_room_name, 'Quiz Room'), 
    p_max_players, 
    p_game_mode,
    0,
    'waiting'
  ) RETURNING multiplayer_rooms.id INTO v_room_id;

  -- Return room details with explicit table references
  RETURN QUERY
  SELECT 
    mr.id,
    mr.room_code,
    mr.topic_id,
    mr.room_name,
    mr.max_players,
    mr.current_players,
    mr.game_mode,
    mr.room_status,
    mr.host_user_id,
    mr.created_at
  FROM multiplayer_rooms mr
  WHERE mr.id = v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;

-- Test the function to ensure it works
DO $$
DECLARE
  test_result RECORD;
  test_room_code VARCHAR(8);
BEGIN
  -- Test create_multiplayer_room function
  SELECT * INTO test_result
  FROM create_multiplayer_room(
    'test-topic',
    NULL,
    'test-guest-token',
    'Test Room',
    4,
    'classic'
  );
  
  IF test_result.room_code IS NOT NULL THEN
    test_room_code := test_result.room_code;
    RAISE NOTICE 'SUCCESS: Created test room with code %', test_room_code;
    
    -- Clean up test room
    DELETE FROM multiplayer_rooms WHERE room_code = test_room_code;
    RAISE NOTICE 'SUCCESS: Cleaned up test room';
  ELSE
    RAISE WARNING 'FAILED: Could not create test room';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERROR testing create_multiplayer_room: %', SQLERRM;
END $$;

COMMIT;

-- Add helpful comments
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms with correct VARCHAR types to match table columns: room_code VARCHAR(8), topic_id VARCHAR(255)'; 