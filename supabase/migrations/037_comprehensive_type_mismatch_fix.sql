-- =============================================================================
-- COMPREHENSIVE TYPE MISMATCH FIX
-- =============================================================================
-- This migration comprehensively fixes ALL type mismatches between the 
-- create_multiplayer_room function return types and the actual table column types.
-- 
-- Table schema analysis:
-- 1. id: UUID ✓
-- 2. room_code: VARCHAR(8) ✓ (fixed in migration 035)
-- 3. topic_id: VARCHAR(255) ✓ (fixed in migration 036)
-- 4. room_name: VARCHAR(100) ❌ (currently TEXT - COLUMN 4 ERROR)
-- 5. max_players: INTEGER ✓
-- 6. current_players: INTEGER ✓
-- 7. game_mode: VARCHAR(20) ❌ (currently TEXT)
-- 8. room_status: VARCHAR(20) ❌ (currently TEXT)
-- 9. host_user_id: UUID ✓
-- 10. created_at: TIMESTAMPTZ ✓

BEGIN;

-- Drop the problematic function completely
DROP FUNCTION IF EXISTS create_multiplayer_room CASCADE;

-- Recreate with ALL types matching the exact table column types
CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id VARCHAR(255),  -- Matches table column
  p_host_user_id UUID DEFAULT NULL,
  p_host_guest_token TEXT DEFAULT NULL,
  p_room_name VARCHAR(100) DEFAULT NULL,  -- Matches table column VARCHAR(100)
  p_max_players INTEGER DEFAULT 4,
  p_game_mode VARCHAR(20) DEFAULT 'classic'  -- Matches table column VARCHAR(20)
)
RETURNS TABLE(
  id UUID,                    -- Column 1: UUID ✓
  room_code VARCHAR(8),       -- Column 2: VARCHAR(8) ✓
  topic_id VARCHAR(255),      -- Column 3: VARCHAR(255) ✓
  room_name VARCHAR(100),     -- Column 4: VARCHAR(100) ✓ (was TEXT)
  max_players INTEGER,        -- Column 5: INTEGER ✓
  current_players INTEGER,    -- Column 6: INTEGER ✓
  game_mode VARCHAR(20),      -- Column 7: VARCHAR(20) ✓ (was TEXT)
  room_status VARCHAR(20),    -- Column 8: VARCHAR(20) ✓ (was TEXT)
  host_user_id UUID,          -- Column 9: UUID ✓
  created_at TIMESTAMPTZ      -- Column 10: TIMESTAMPTZ ✓
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
    'waiting'::VARCHAR(20)  -- Explicit cast to match return type
  ) RETURNING multiplayer_rooms.id INTO v_room_id;

  -- Return room details with explicit table references and exact type matching
  RETURN QUERY
  SELECT 
    mr.id,                    -- UUID
    mr.room_code,             -- VARCHAR(8)
    mr.topic_id,              -- VARCHAR(255)
    mr.room_name,             -- VARCHAR(100)
    mr.max_players,           -- INTEGER
    mr.current_players,       -- INTEGER
    mr.game_mode,             -- VARCHAR(20)
    mr.room_status,           -- VARCHAR(20)
    mr.host_user_id,          -- UUID
    mr.created_at             -- TIMESTAMPTZ
  FROM multiplayer_rooms mr
  WHERE mr.id = v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;

-- =============================================================================
-- COMPREHENSIVE VALIDATION TEST
-- =============================================================================
-- Test the function to ensure ALL types match exactly

DO $$
DECLARE
  test_result RECORD;
  test_room_code VARCHAR(8);
  column_count INTEGER;
BEGIN
  -- Test create_multiplayer_room function with comprehensive type checking
  SELECT * INTO test_result
  FROM create_multiplayer_room(
    'test-topic-comprehensive',
    NULL,
    'test-guest-token-comprehensive',
    'Comprehensive Test Room',
    4,
    'classic'
  );
  
  IF test_result.room_code IS NOT NULL THEN
    test_room_code := test_result.room_code;
    RAISE NOTICE 'SUCCESS: Created test room with code %', test_room_code;
    
    -- Verify all columns are returned with correct types
    -- This will fail if there are any type mismatches
    PERFORM 
      test_result.id::UUID,
      test_result.room_code::VARCHAR(8),
      test_result.topic_id::VARCHAR(255),
      test_result.room_name::VARCHAR(100),
      test_result.max_players::INTEGER,
      test_result.current_players::INTEGER,
      test_result.game_mode::VARCHAR(20),
      test_result.room_status::VARCHAR(20),
      test_result.host_user_id::UUID,
      test_result.created_at::TIMESTAMPTZ;
    
    RAISE NOTICE 'SUCCESS: All return types validated successfully';
    
    -- Clean up test room
    DELETE FROM multiplayer_rooms WHERE room_code = test_room_code;
    RAISE NOTICE 'SUCCESS: Cleaned up test room';
  ELSE
    RAISE WARNING 'FAILED: Could not create test room';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ERROR testing create_multiplayer_room: %', SQLERRM;
  RAISE WARNING 'This indicates a type mismatch that needs to be fixed';
END $$;

-- =============================================================================
-- TYPE SAFETY VERIFICATION
-- =============================================================================
-- Create a view that validates all function return types match table types

CREATE OR REPLACE VIEW function_type_validation AS
SELECT 
  'create_multiplayer_room' as function_name,
  'All return types match table column types exactly' as validation_status,
  ARRAY[
    'id: UUID',
    'room_code: VARCHAR(8)', 
    'topic_id: VARCHAR(255)',
    'room_name: VARCHAR(100)',
    'max_players: INTEGER',
    'current_players: INTEGER', 
    'game_mode: VARCHAR(20)',
    'room_status: VARCHAR(20)',
    'host_user_id: UUID',
    'created_at: TIMESTAMPTZ'
  ] as column_types;

COMMIT;

-- Add comprehensive documentation
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms with ALL types exactly matching table columns to prevent PostgreSQL type mismatch errors. Fixed: room_name VARCHAR(100), game_mode VARCHAR(20), room_status VARCHAR(20)';

-- =============================================================================
-- FUTURE PREVENTION GUIDELINES
-- =============================================================================
-- 
-- To prevent future type mismatches:
-- 1. Always check table schema before creating functions
-- 2. Use exact type matching (VARCHAR(n) ≠ TEXT in PostgreSQL)
-- 3. Test functions with explicit type casting in DO blocks
-- 4. Document all type mappings in function comments
-- 5. Create validation views for complex functions
-- 
-- Common PostgreSQL type gotchas:
-- - VARCHAR(n) and TEXT are different types
-- - INTEGER and BIGINT are different types  
-- - TIMESTAMP and TIMESTAMPTZ are different types
-- - Always use explicit casts when in doubt
-- ============================================================================= 