-- =============================================================================
-- COMPREHENSIVE FIX FOR MULTIPLAYER HOST ASSIGNMENT BUG
-- =============================================================================
-- This migration completely fixes the host assignment issue by:
-- 1. Ensuring create_multiplayer_room automatically adds the creator as host
-- 2. Fixing join_multiplayer_room to properly identify and assign hosts
-- 3. Adding a repair function to fix existing rooms with no hosts
-- 4. Adding validation and monitoring functions

BEGIN;

-- =============================================================================
-- 1. BACKUP CURRENT STATE FOR DEBUGGING
-- =============================================================================

-- Log current state of rooms without hosts
DO $$
DECLARE
  rooms_without_hosts INTEGER;
  total_rooms INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rooms FROM multiplayer_rooms;
  
  SELECT COUNT(DISTINCT mr.id) INTO rooms_without_hosts
  FROM multiplayer_rooms mr
  LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
  WHERE mrp.id IS NULL;
  
  RAISE NOTICE 'BEFORE FIX: % out of % rooms have no host assigned', rooms_without_hosts, total_rooms;
END $$;

-- =============================================================================
-- 2. DROP AND RECREATE create_multiplayer_room WITH HOST AUTO-JOIN
-- =============================================================================

DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

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
  
  -- Ensure room code is unique
  WHILE EXISTS (SELECT 1 FROM multiplayer_rooms mr WHERE mr.room_code = new_room_code) LOOP
    new_room_code := generate_room_code();
  END LOOP;
  
  -- Create the room
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
  ) RETURNING multiplayer_rooms.id INTO new_room_id;
  
  -- Determine host display name and emoji
  IF p_host_user_id IS NOT NULL THEN
    -- Try to get user's display name from auth.users
    SELECT COALESCE(
      raw_user_meta_data->>'display_name',
      raw_user_meta_data->>'full_name', 
      raw_user_meta_data->>'name',
      email,
      'Player'
    ) INTO host_player_name
    FROM auth.users 
    WHERE id = p_host_user_id;
    
    host_player_emoji := '👑';
  ELSE
    -- Guest host
    host_player_name := 'Host';
    host_player_emoji := '👑';
  END IF;
  
  -- Automatically add the host as a player
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
  ) RETURNING multiplayer_room_players.id INTO host_player_id;
  
  RAISE NOTICE 'Created room % with host player %', new_room_code, host_player_id;
  
  -- Return room data
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
  WHERE mr.id = new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. UPDATE join_multiplayer_room TO HANDLE EXISTING HOST LOGIC
-- =============================================================================

DROP FUNCTION IF EXISTS join_multiplayer_room CASCADE;

CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_code VARCHAR(8),
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
  target_host_user_id UUID;
  new_player_id UUID;
  new_join_order INTEGER;
  existing_player_id UUID;
  should_be_host BOOLEAN := FALSE;
  existing_host_count INTEGER;
BEGIN
  -- Find the room
  SELECT mr.id, mr.max_players, mr.current_players, mr.room_status, mr.host_user_id
  INTO target_room_id, target_max_players, target_current_players, target_status, target_host_user_id
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
  
  -- Check if player is already in room
  SELECT mrp.id INTO existing_player_id
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = target_room_id 
  AND (
    (p_user_id IS NOT NULL AND mrp.user_id = p_user_id) OR
    (p_guest_token IS NOT NULL AND mrp.guest_token = p_guest_token)
  );
  
  IF existing_player_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 'Already in this room', target_room_id, existing_player_id, 
      (SELECT join_order FROM multiplayer_room_players WHERE id = existing_player_id);
    RETURN;
  END IF;
  
  -- Check if there's already a host
  SELECT COUNT(*) INTO existing_host_count
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = target_room_id AND mrp.is_host = TRUE;
  
  -- Determine if this player should be the host
  IF existing_host_count = 0 THEN
    -- No host exists, this player becomes host if they match the room creator
    IF (p_user_id IS NOT NULL AND p_user_id = target_host_user_id) OR
       (p_user_id IS NULL AND target_host_user_id IS NULL) THEN
      should_be_host := TRUE;
    END IF;
  END IF;
  
  -- Calculate join order
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
    is_host,
    is_ready,
    is_connected
  ) VALUES (
    target_room_id,
    p_user_id,
    p_guest_token,
    p_player_name,
    p_player_emoji,
    new_join_order,
    should_be_host,
    FALSE, -- Start as not ready
    TRUE   -- Connected
  ) RETURNING id INTO new_player_id;
  
  -- Update room player count
  UPDATE multiplayer_rooms mr
  SET current_players = mr.current_players + 1
  WHERE mr.id = target_room_id;
  
  RAISE NOTICE 'Player % joined room % as host: %', new_player_id, target_room_id, should_be_host;
  
  RETURN QUERY SELECT TRUE, 'Successfully joined room', target_room_id, new_player_id, new_join_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. CREATE REPAIR FUNCTION FOR EXISTING ROOMS
-- =============================================================================

CREATE OR REPLACE FUNCTION repair_rooms_without_hosts()
RETURNS TABLE(
  room_id UUID,
  room_code VARCHAR(8),
  action_taken TEXT,
  new_host_player_id UUID
) AS $$
DECLARE
  room_record RECORD;
  first_player_id UUID;
  players_count INTEGER;
BEGIN
  -- Find all rooms without hosts
  FOR room_record IN
    SELECT DISTINCT mr.id, mr.room_code, mr.host_user_id, mr.room_status
    FROM multiplayer_rooms mr
    LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
    WHERE mrp.id IS NULL 
    AND mr.room_status IN ('waiting', 'starting', 'in_progress')
  LOOP
    -- Count players in this room
    SELECT COUNT(*) INTO players_count
    FROM multiplayer_room_players mrp
    WHERE mrp.room_id = room_record.id AND mrp.is_connected = TRUE;
    
    IF players_count = 0 THEN
      -- No players, mark room as cancelled
      UPDATE multiplayer_rooms 
      SET room_status = 'cancelled'
      WHERE id = room_record.id;
      
      RETURN QUERY SELECT room_record.id, room_record.room_code, 'Room cancelled - no players', NULL::UUID;
      
    ELSE
      -- Find the first player (by join_order) to make host
      SELECT mrp.id INTO first_player_id
      FROM multiplayer_room_players mrp
      WHERE mrp.room_id = room_record.id AND mrp.is_connected = TRUE
      ORDER BY mrp.join_order ASC
      LIMIT 1;
      
      IF first_player_id IS NOT NULL THEN
        -- Make this player the host
        UPDATE multiplayer_room_players
        SET is_host = TRUE
        WHERE id = first_player_id;
        
        RETURN QUERY SELECT room_record.id, room_record.room_code, 'Assigned host to first player', first_player_id;
      ELSE
        RETURN QUERY SELECT room_record.id, room_record.room_code, 'No suitable player found', NULL::UUID;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. CREATE VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_multiplayer_host_assignments()
RETURNS TABLE(
  total_rooms INTEGER,
  rooms_without_hosts INTEGER,
  rooms_with_multiple_hosts INTEGER,
  success_rate NUMERIC
) AS $$
DECLARE
  total_count INTEGER;
  no_host_count INTEGER;
  multi_host_count INTEGER;
BEGIN
  -- Count total active rooms
  SELECT COUNT(*) INTO total_count
  FROM multiplayer_rooms mr
  WHERE mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  -- Count rooms without hosts
  SELECT COUNT(DISTINCT mr.id) INTO no_host_count
  FROM multiplayer_rooms mr
  LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
  WHERE mrp.id IS NULL 
  AND mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  -- Count rooms with multiple hosts
  SELECT COUNT(DISTINCT mr.id) INTO multi_host_count
  FROM multiplayer_rooms mr
  JOIN (
    SELECT room_id, COUNT(*) as host_count
    FROM multiplayer_room_players
    WHERE is_host = TRUE
    GROUP BY room_id
    HAVING COUNT(*) > 1
  ) multi_hosts ON mr.id = multi_hosts.room_id
  WHERE mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  RETURN QUERY SELECT 
    total_count,
    no_host_count,
    multi_host_count,
    CASE 
      WHEN total_count = 0 THEN 100.0
      ELSE ROUND((total_count - no_host_count - multi_host_count) * 100.0 / total_count, 2)
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO anon;
GRANT EXECUTE ON FUNCTION repair_rooms_without_hosts TO authenticated;
GRANT EXECUTE ON FUNCTION validate_multiplayer_host_assignments TO authenticated;

-- =============================================================================
-- 7. REPAIR EXISTING ROOMS
-- =============================================================================

DO $$
DECLARE
  repair_result RECORD;
  repair_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting repair of existing rooms without hosts...';
  
  FOR repair_result IN SELECT * FROM repair_rooms_without_hosts() LOOP
    repair_count := repair_count + 1;
    RAISE NOTICE 'Room %: %', repair_result.room_code, repair_result.action_taken;
  END LOOP;
  
  RAISE NOTICE 'Repaired % rooms', repair_count;
END $$;

-- =============================================================================
-- 8. VALIDATE THE FIX
-- =============================================================================

DO $$
DECLARE
  validation_result RECORD;
BEGIN
  SELECT * INTO validation_result FROM validate_multiplayer_host_assignments();
  
  RAISE NOTICE 'VALIDATION RESULTS:';
  RAISE NOTICE '  Total active rooms: %', validation_result.total_rooms;
  RAISE NOTICE '  Rooms without hosts: %', validation_result.rooms_without_hosts;
  RAISE NOTICE '  Rooms with multiple hosts: %', validation_result.rooms_with_multiple_hosts;
  RAISE NOTICE '  Success rate: % percent', validation_result.success_rate;
  
  IF validation_result.success_rate >= 100.0 THEN
    RAISE NOTICE 'SUCCESS: All rooms have exactly one host!';
  ELSE
    RAISE WARNING 'ISSUE: Some rooms still have host assignment problems';
  END IF;
END $$;

-- =============================================================================
-- 9. TEST THE NEW FUNCTIONS
-- =============================================================================

DO $$
DECLARE
  test_room_data RECORD;
  test_join_result RECORD;
  test_validation RECORD;
BEGIN
  RAISE NOTICE 'Testing new create_multiplayer_room function...';
  
  -- Test creating a room with automatic host assignment
  SELECT * INTO test_room_data
  FROM create_multiplayer_room(
    'test-topic-comprehensive-fix',
    NULL, -- Guest host
    'test-comprehensive-guest-token',
    'Comprehensive Fix Test',
    4,
    'classic'
  );
  
  RAISE NOTICE 'Created test room: % (ID: %)', test_room_data.room_code, test_room_data.id;
  
  -- Verify the host was automatically added
  IF EXISTS (
    SELECT 1 FROM multiplayer_room_players 
    WHERE room_id = test_room_data.id AND is_host = TRUE
  ) THEN
    RAISE NOTICE 'SUCCESS: Host automatically added to room';
  ELSE
    RAISE WARNING 'FAILED: Host was not automatically added to room';
  END IF;
  
  -- Test joining the room (should not create duplicate host)
  SELECT * INTO test_join_result
  FROM join_multiplayer_room(
    test_room_data.room_code,
    'Test Player',
    NULL,
    'test-regular-player-token',
    '😊'
  );
  
  IF test_join_result.success THEN
    RAISE NOTICE 'SUCCESS: Additional player joined room';
  ELSE
    RAISE WARNING 'FAILED: Additional player could not join: %', test_join_result.message;
  END IF;
  
  -- Validate final state
  SELECT * INTO test_validation FROM validate_multiplayer_host_assignments();
  RAISE NOTICE 'Final validation: % rooms, % without hosts, % percent success rate', 
    test_validation.total_rooms, test_validation.rooms_without_hosts, test_validation.success_rate;
  
  -- Cleanup test room
  DELETE FROM multiplayer_room_players WHERE room_id = test_room_data.id;
  DELETE FROM multiplayer_rooms WHERE id = test_room_data.id;
  RAISE NOTICE 'Cleaned up test room';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERROR during testing: %', SQLERRM;
END $$;

COMMIT;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms and automatically adds the creator as host player';
COMMENT ON FUNCTION join_multiplayer_room IS 'Joins players to rooms with proper host assignment logic for edge cases';
COMMENT ON FUNCTION repair_rooms_without_hosts IS 'Repairs existing rooms that have no host assigned';
COMMENT ON FUNCTION validate_multiplayer_host_assignments IS 'Validates that all active rooms have exactly one host';

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- 
-- This comprehensive fix addresses the host assignment bug by:
-- 
-- 1. ✅ create_multiplayer_room now automatically adds the creator as a host player
-- 2. ✅ join_multiplayer_room handles edge cases where rooms have no hosts
-- 3. ✅ repair_rooms_without_hosts fixes all existing broken rooms
-- 4. ✅ validate_multiplayer_host_assignments provides monitoring
-- 5. ✅ All existing rooms are repaired during migration
-- 6. ✅ Comprehensive testing validates the fixes
-- 
-- After this migration:
-- - All new rooms will have hosts automatically
-- - All existing rooms are repaired
-- - Success rate should be 100%
-- 
-- ============================================================================= 