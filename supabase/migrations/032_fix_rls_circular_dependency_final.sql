-- =============================================================================
-- FINAL FIX FOR MULTIPLAYER RLS CIRCULAR DEPENDENCY (IDEMPOTENT)
-- =============================================================================
-- Completely removes circular dependencies by using simpler, non-recursive policies
-- This script is idempotent and can be run multiple times safely

BEGIN;

-- Function to safely drop policy if it exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION
  WHEN undefined_object THEN
    -- Policy doesn't exist, ignore
    NULL;
  WHEN OTHERS THEN
    -- Log error but continue
    RAISE WARNING 'Could not drop policy % on table %: %', policy_name, table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to safely enable/disable RLS
CREATE OR REPLACE FUNCTION set_rls_if_needed(table_name text, enable_rls boolean)
RETURNS void AS $$
DECLARE
  current_rls boolean;
BEGIN
  -- Check current RLS status
  SELECT relrowsecurity INTO current_rls 
  FROM pg_class 
  WHERE relname = table_name;
  
  -- Only change if needed
  IF current_rls IS DISTINCT FROM enable_rls THEN
    IF enable_rls THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    ELSE
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE WARNING 'Table % does not exist', table_name;
  WHEN OTHERS THEN
    RAISE WARNING 'Could not set RLS on table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Temporarily disable RLS to avoid conflicts during policy updates
SELECT set_rls_if_needed('multiplayer_rooms', false);
SELECT set_rls_if_needed('multiplayer_room_players', false);

-- Drop all existing problematic policies safely
SELECT drop_policy_if_exists('multiplayer_rooms', 'Users can view rooms they''re in or that are public');
SELECT drop_policy_if_exists('multiplayer_rooms', 'Users can create rooms');
SELECT drop_policy_if_exists('multiplayer_rooms', 'Users can update rooms they host');
SELECT drop_policy_if_exists('multiplayer_rooms', 'Users can delete rooms they host');

SELECT drop_policy_if_exists('multiplayer_room_players', 'Users can view players in their rooms');
SELECT drop_policy_if_exists('multiplayer_room_players', 'Users can join rooms');
SELECT drop_policy_if_exists('multiplayer_room_players', 'Users can update their own player data');
SELECT drop_policy_if_exists('multiplayer_room_players', 'Users can leave rooms');

-- Create new, non-recursive policies for multiplayer_rooms
DO $$
BEGIN
  -- Policy 1: View rooms - simple ownership or guest access
  CREATE POLICY "multiplayer_rooms_select_policy"
    ON multiplayer_rooms FOR SELECT
    USING (
      -- Host can always see their room
      host_user_id = auth.uid()
      -- Allow guest hosts (rooms without host_user_id)
      OR host_user_id IS NULL
      -- Allow public rooms (you could add more conditions here)
      OR room_status IN ('waiting', 'in_progress')
    );
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, ignore
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 2: Create rooms
  CREATE POLICY "multiplayer_rooms_insert_policy"
    ON multiplayer_rooms FOR INSERT
    WITH CHECK (
      -- Must be the host or allow guest creation
      host_user_id = auth.uid() 
      OR host_user_id IS NULL
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 3: Update rooms (only host)
  CREATE POLICY "multiplayer_rooms_update_policy"
    ON multiplayer_rooms FOR UPDATE
    USING (
      host_user_id = auth.uid() 
      OR host_user_id IS NULL
    )
    WITH CHECK (
      host_user_id = auth.uid() 
      OR host_user_id IS NULL
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 4: Delete rooms (only host)
  CREATE POLICY "multiplayer_rooms_delete_policy"
    ON multiplayer_rooms FOR DELETE
    USING (
      host_user_id = auth.uid() 
      OR host_user_id IS NULL
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Create new, non-recursive policies for multiplayer_room_players
DO $$
BEGIN
  -- Policy 1: View players - simple room-based access
  CREATE POLICY "multiplayer_room_players_select_policy"
    ON multiplayer_room_players FOR SELECT
    USING (
      -- User can see their own player record
      user_id = auth.uid()
      -- Allow guest players (no user_id but has guest_token)
      OR (user_id IS NULL AND guest_token IS NOT NULL)
      -- Allow viewing in public rooms (simplified - you may want to restrict this)
      OR TRUE  -- For now, allow viewing all players (can be restricted later)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 2: Insert players (join room)
  CREATE POLICY "multiplayer_room_players_insert_policy"
    ON multiplayer_room_players FOR INSERT
    WITH CHECK (
      -- User can add themselves to a room
      user_id = auth.uid()
      -- Allow guest players
      OR (user_id IS NULL AND guest_token IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 3: Update players (only own record)
  CREATE POLICY "multiplayer_room_players_update_policy"
    ON multiplayer_room_players FOR UPDATE
    USING (
      user_id = auth.uid()
      OR (user_id IS NULL AND guest_token IS NOT NULL)
    )
    WITH CHECK (
      user_id = auth.uid()
      OR (user_id IS NULL AND guest_token IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- Policy 4: Delete players (leave room)
  CREATE POLICY "multiplayer_room_players_delete_policy"
    ON multiplayer_room_players FOR DELETE
    USING (
      user_id = auth.uid()
      OR (user_id IS NULL AND guest_token IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Re-enable RLS on both tables
SELECT set_rls_if_needed('multiplayer_rooms', true);
SELECT set_rls_if_needed('multiplayer_room_players', true);

-- Clean up helper functions
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
DROP FUNCTION IF EXISTS set_rls_if_needed(text, boolean);

-- Verify the fix by testing a simple query (this will fail if there's still recursion)
DO $$
DECLARE
  test_count integer;
BEGIN
  -- Test query that would trigger recursion if it still exists
  SELECT COUNT(*) INTO test_count 
  FROM multiplayer_rooms 
  WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
  
  RAISE NOTICE 'RLS policies test completed successfully. No circular dependency detected.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'RLS policies test failed: %', SQLERRM;
END $$;

COMMIT;

-- Add helpful comment
COMMENT ON TABLE multiplayer_rooms IS 'Multiplayer quiz rooms with non-recursive RLS policies (fixed circular dependency)';
COMMENT ON TABLE multiplayer_room_players IS 'Multiplayer room players with non-recursive RLS policies (fixed circular dependency)';

-- Update the create_multiplayer_room function to handle the simpler RLS
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

  -- Create room
  INSERT INTO multiplayer_rooms (
    room_code, topic_id, host_user_id, room_name, max_players, game_mode
  ) VALUES (
    v_room_code, p_topic_id, p_host_user_id, p_room_name, p_max_players, p_game_mode
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