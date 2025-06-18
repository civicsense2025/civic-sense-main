-- =============================================================================
-- TEST SCRIPT FOR HOST ASSIGNMENT FIX
-- =============================================================================
-- Run this after applying the fix to verify everything works correctly

-- =============================================================================
-- 1. CHECK CURRENT STATE
-- =============================================================================

DO $$
DECLARE
  total_rooms INTEGER;
  rooms_without_hosts INTEGER;
  rooms_with_hosts INTEGER;
  success_rate NUMERIC;
BEGIN
  -- Count total active rooms
  SELECT COUNT(*) INTO total_rooms
  FROM multiplayer_rooms mr
  WHERE mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  -- Count rooms without hosts
  SELECT COUNT(DISTINCT mr.id) INTO rooms_without_hosts
  FROM multiplayer_rooms mr
  LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
  WHERE mrp.id IS NULL 
  AND mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  rooms_with_hosts := total_rooms - rooms_without_hosts;
  
  IF total_rooms > 0 THEN
    success_rate := (rooms_with_hosts * 100.0) / total_rooms;
  ELSE
    success_rate := 100.0;
  END IF;
  
  RAISE NOTICE '=== HOST ASSIGNMENT STATUS ===';
  RAISE NOTICE 'Total active rooms: %', total_rooms;
  RAISE NOTICE 'Rooms with hosts: %', rooms_with_hosts;
  RAISE NOTICE 'Rooms without hosts: %', rooms_without_hosts;
  RAISE NOTICE 'Success rate: %% %%', ROUND(success_rate, 1);
  
  IF success_rate >= 100.0 THEN
    RAISE NOTICE '✅ SUCCESS: All rooms have hosts!';
  ELSE
    RAISE WARNING '❌ ISSUE: % rooms still need hosts', rooms_without_hosts;
  END IF;
END $$;

-- =============================================================================
-- 2. LIST PROBLEMATIC ROOMS (IF ANY)
-- =============================================================================

DO $$
DECLARE
  problem_room RECORD;
  problem_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== ROOMS WITHOUT HOSTS ===';
  
  FOR problem_room IN
    SELECT DISTINCT mr.room_code, mr.id, mr.room_status, mr.current_players,
           (SELECT COUNT(*) FROM multiplayer_room_players mrp WHERE mrp.room_id = mr.id) as actual_players
    FROM multiplayer_rooms mr
    LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
    WHERE mrp.id IS NULL 
    AND mr.room_status IN ('waiting', 'starting', 'in_progress')
  LOOP
    problem_count := problem_count + 1;
    RAISE NOTICE 'Room %: Status=%, Current Players=%, Actual Players=%', 
      problem_room.room_code, problem_room.room_status, 
      problem_room.current_players, problem_room.actual_players;
  END LOOP;
  
  IF problem_count = 0 THEN
    RAISE NOTICE 'No problematic rooms found! ✅';
  ELSE
    RAISE NOTICE 'Found % problematic rooms ⚠️', problem_count;
  END IF;
END $$;

-- =============================================================================
-- 3. TEST CREATING A NEW ROOM
-- =============================================================================

DO $$
DECLARE
  test_room_data RECORD;
  host_count INTEGER;
  player_count INTEGER;
BEGIN
  RAISE NOTICE '=== TESTING NEW ROOM CREATION ===';
  
  -- Create a test room
  SELECT * INTO test_room_data
  FROM create_multiplayer_room(
    'test-topic-verification',
    NULL, -- Guest host
    'test-verification-guest-token',
    'Host Assignment Test Room',
    4,
    'classic'
  );
  
  RAISE NOTICE 'Created test room: % (ID: %)', test_room_data.room_code, test_room_data.id;
  
  -- Check if host was automatically added
  SELECT COUNT(*) INTO host_count
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = test_room_data.id AND mrp.is_host = TRUE;
  
  SELECT COUNT(*) INTO player_count
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = test_room_data.id;
  
  RAISE NOTICE 'Room has % hosts and % total players', host_count, player_count;
  
  IF host_count = 1 AND player_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS: New room creation works correctly!';
  ELSE
    RAISE WARNING '❌ ISSUE: New room creation has problems';
  END IF;
  
  -- Cleanup test room
  DELETE FROM multiplayer_room_players WHERE room_id = test_room_data.id;
  DELETE FROM multiplayer_rooms WHERE id = test_room_data.id;
  RAISE NOTICE 'Cleaned up test room';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ ERROR testing new room creation: %', SQLERRM;
END $$;

-- =============================================================================
-- 4. FINAL SUMMARY
-- =============================================================================

DO $$
DECLARE
  final_total INTEGER;
  final_without_hosts INTEGER;
  final_success_rate NUMERIC;
BEGIN
  RAISE NOTICE '=== FINAL VERIFICATION ===';
  
  -- Final count
  SELECT COUNT(*) INTO final_total
  FROM multiplayer_rooms mr
  WHERE mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  SELECT COUNT(DISTINCT mr.id) INTO final_without_hosts
  FROM multiplayer_rooms mr
  LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id AND mrp.is_host = TRUE
  WHERE mrp.id IS NULL 
  AND mr.room_status IN ('waiting', 'starting', 'in_progress');
  
  IF final_total > 0 THEN
    final_success_rate := ((final_total - final_without_hosts) * 100.0) / final_total;
  ELSE
    final_success_rate := 100.0;
  END IF;
  
  RAISE NOTICE 'Final state: %/% rooms have hosts (%% %%)', 
    final_total - final_without_hosts, final_total, ROUND(final_success_rate, 1);
  
  IF final_success_rate >= 100.0 THEN
    RAISE NOTICE '🎉 HOST ASSIGNMENT BUG IS FIXED! All rooms have hosts.';
  ELSIF final_success_rate >= 90.0 THEN
    RAISE NOTICE '⚠️ Mostly fixed, but % rooms still need attention', final_without_hosts;
  ELSE
    RAISE WARNING '❌ Fix incomplete - % rooms still without hosts', final_without_hosts;
  END IF;
END $$; 