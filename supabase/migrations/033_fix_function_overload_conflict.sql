-- =============================================================================
-- FIX FUNCTION OVERLOAD CONFLICT FOR create_multiplayer_room
-- =============================================================================
-- Resolves the "Could not choose the best candidate function" error by
-- dropping all versions and creating a single, clean function definition

BEGIN;

-- Drop ALL possible versions of the function to avoid overload conflicts
-- We need to be very specific about parameter types to catch all variations

-- Drop the version from migration 030 (VARCHAR types)
DROP FUNCTION IF EXISTS create_multiplayer_room(VARCHAR(255), UUID, VARCHAR(100), INTEGER, VARCHAR(20));
DROP FUNCTION IF EXISTS create_multiplayer_room(UUID, VARCHAR(255), VARCHAR(100), INTEGER, VARCHAR(20));

-- Drop the version from migration 032 (TEXT types with extra parameter)
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INTEGER, TEXT);

-- Drop any other possible variations
DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS create_multiplayer_room(VARCHAR, UUID, VARCHAR, INTEGER, VARCHAR);

-- Also try dropping without specifying parameter types (catches any remaining versions)
DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

-- Now create the single, definitive version with proper parameter handling
CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id TEXT,
  p_host_user_id UUID DEFAULT NULL,
  p_host_guest_token TEXT DEFAULT NULL,
  p_room_name TEXT DEFAULT NULL,
  p_max_players INTEGER DEFAULT 4,
  p_game_mode TEXT DEFAULT 'classic'
)
RETURNS TABLE(
  id UUID,
  room_code TEXT,
  topic_id TEXT,
  room_name TEXT,
  max_players INTEGER,
  current_players INTEGER,
  game_mode TEXT,
  room_status TEXT,
  host_user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_room_code TEXT;
  v_room_id UUID;
BEGIN
  -- Generate unique room code
  LOOP
    v_room_code := generate_room_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM multiplayer_rooms WHERE room_code = v_room_code
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

  -- Return room details
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

-- Grant execute permissions to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;

-- Verify the function exists and is unique
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'create_multiplayer_room'
    AND n.nspname = 'public';
  
  IF function_count = 1 THEN
    RAISE NOTICE 'SUCCESS: create_multiplayer_room function is now unique (1 version found)';
  ELSE
    RAISE WARNING 'ISSUE: Found % versions of create_multiplayer_room function', function_count;
  END IF;
END $$;

COMMIT;

-- Add helpful comment
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms for both authenticated users and guests - unified version (no overloads)'; 