-- =============================================================================
-- FIX AMBIGUOUS COLUMN REFERENCES IN MULTIPLAYER FUNCTIONS
-- =============================================================================
-- Resolves the "column reference 'room_code' is ambiguous" error by
-- making all column references explicit with proper table prefixes

BEGIN;

-- Drop the problematic function
DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

-- Recreate with explicit table references to avoid ambiguity
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
  -- Generate unique room code with explicit table reference
  LOOP
    v_room_code := generate_room_code();
    -- Fix: Explicitly reference the table column to avoid ambiguity
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

-- Also fix the generate_room_code function to be explicit
DROP FUNCTION IF EXISTS generate_room_code CASCADE;

CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase letters and numbers)
    code := UPPER(
      SUBSTRING(
        REPLACE(
          REPLACE(
            REPLACE(gen_random_uuid()::text, '-', ''),
            'a', 'A'
          ),
          'b', 'B'
        ),
        1, 8
      )
    );
    
    -- Make it more readable by avoiding confusing characters
    code := REPLACE(code, '0', '2');
    code := REPLACE(code, 'O', '3');
    code := REPLACE(code, 'I', '4');
    code := REPLACE(code, '1', '5');
    
    -- Check if code already exists with explicit table reference
    IF NOT EXISTS (SELECT 1 FROM multiplayer_rooms mr WHERE mr.room_code = code) THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique room code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the join_multiplayer_room function as well
DROP FUNCTION IF EXISTS join_multiplayer_room CASCADE;

CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_code TEXT,
  p_player_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL,
  p_player_emoji TEXT DEFAULT '😊'
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
  target_status TEXT;
  new_player_id UUID;
  new_join_order INTEGER;
BEGIN
  -- Find the room with explicit table reference
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
  
  -- Check if player is already in room with explicit table references
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
  
  -- Calculate join order with explicit table reference
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
  
  -- Update room player count with explicit table reference
  UPDATE multiplayer_rooms mr
  SET current_players = mr.current_players + 1
  WHERE mr.id = target_room_id;
  
  RETURN QUERY SELECT TRUE, 'Successfully joined room', target_room_id, new_player_id, new_join_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;
GRANT EXECUTE ON FUNCTION generate_room_code TO authenticated;
GRANT EXECUTE ON FUNCTION generate_room_code TO anon;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO anon;

-- Verify the functions exist and work
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  -- Check create_multiplayer_room
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'create_multiplayer_room'
    AND n.nspname = 'public';
  
  IF function_count = 1 THEN
    RAISE NOTICE 'SUCCESS: create_multiplayer_room function exists and is unique';
  ELSE
    RAISE WARNING 'ISSUE: Found % versions of create_multiplayer_room function', function_count;
  END IF;
  
  -- Check generate_room_code
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'generate_room_code'
    AND n.nspname = 'public';
  
  IF function_count = 1 THEN
    RAISE NOTICE 'SUCCESS: generate_room_code function exists and is unique';
  ELSE
    RAISE WARNING 'ISSUE: Found % versions of generate_room_code function', function_count;
  END IF;
  
  -- Check join_multiplayer_room
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'join_multiplayer_room'
    AND n.nspname = 'public';
  
  IF function_count = 1 THEN
    RAISE NOTICE 'SUCCESS: join_multiplayer_room function exists and is unique';
  ELSE
    RAISE WARNING 'ISSUE: Found % versions of join_multiplayer_room function', function_count;
  END IF;
END $$;

COMMIT;

-- Add helpful comments
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms with explicit column references to avoid ambiguity';
COMMENT ON FUNCTION generate_room_code IS 'Generates unique room codes with explicit table references';
COMMENT ON FUNCTION join_multiplayer_room IS 'Joins players to multiplayer rooms with explicit column references'; 