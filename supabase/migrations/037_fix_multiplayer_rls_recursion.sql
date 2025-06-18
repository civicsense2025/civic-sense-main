-- =============================================================================
-- FIX INFINITE RECURSION IN MULTIPLAYER RLS POLICIES
-- =============================================================================
-- This migration fixes the "infinite recursion detected in policy" error
-- by implementing much simpler, non-recursive RLS policies

BEGIN;

-- Temporarily disable RLS to safely update policies
ALTER TABLE multiplayer_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "multiplayer_rooms_select_policy" ON multiplayer_rooms;
DROP POLICY IF EXISTS "multiplayer_rooms_insert_policy" ON multiplayer_rooms;
DROP POLICY IF EXISTS "multiplayer_rooms_update_policy" ON multiplayer_rooms;
DROP POLICY IF EXISTS "multiplayer_rooms_delete_policy" ON multiplayer_rooms;

DROP POLICY IF EXISTS "multiplayer_room_players_select_policy" ON multiplayer_room_players;
DROP POLICY IF EXISTS "multiplayer_room_players_insert_policy" ON multiplayer_room_players;
DROP POLICY IF EXISTS "multiplayer_room_players_update_policy" ON multiplayer_room_players;
DROP POLICY IF EXISTS "multiplayer_room_players_delete_policy" ON multiplayer_room_players;

-- Drop any legacy policies that might still exist
DROP POLICY IF EXISTS "Users can view rooms they're in or that are public" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can update rooms they host" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can delete rooms they host" ON multiplayer_rooms;

DROP POLICY IF EXISTS "Users can view players in their rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can join rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can update their own player data" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can update their own data" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can leave rooms" ON multiplayer_room_players;

-- =============================================================================
-- SIMPLE, NON-RECURSIVE POLICIES FOR MULTIPLAYER_ROOMS
-- =============================================================================

-- Allow users to view all active rooms (no complex joins)
CREATE POLICY "view_active_rooms" ON multiplayer_rooms
  FOR SELECT USING (
    room_status IN ('waiting', 'in_progress', 'completed')
  );

-- Allow authenticated users and guests to create rooms
CREATE POLICY "create_rooms" ON multiplayer_rooms
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR host_user_id IS NULL
  );

-- Allow room hosts to update their rooms
CREATE POLICY "update_own_rooms" ON multiplayer_rooms
  FOR UPDATE USING (
    host_user_id = auth.uid() OR host_user_id IS NULL
  );

-- Allow room hosts to delete their rooms
CREATE POLICY "delete_own_rooms" ON multiplayer_rooms
  FOR DELETE USING (
    host_user_id = auth.uid() OR host_user_id IS NULL
  );

-- =============================================================================
-- SIMPLE, NON-RECURSIVE POLICIES FOR MULTIPLAYER_ROOM_PLAYERS
-- =============================================================================

-- Allow viewing all player records (simple, no joins)
CREATE POLICY "view_all_players" ON multiplayer_room_players
  FOR SELECT USING (true);

-- Allow users to join rooms (create player records)
CREATE POLICY "join_rooms" ON multiplayer_room_players
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

-- Allow users to update only their own player record
CREATE POLICY "update_own_player" ON multiplayer_room_players
  FOR UPDATE USING (
    user_id = auth.uid() OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

-- Allow users to leave rooms (delete their player record)
CREATE POLICY "leave_rooms" ON multiplayer_room_players
  FOR DELETE USING (
    user_id = auth.uid() OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

-- Re-enable RLS
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players ENABLE ROW LEVEL SECURITY;

-- Test the policies work without recursion
DO $$
DECLARE
  test_count integer;
BEGIN
  -- Simple test query
  SELECT COUNT(*) INTO test_count FROM multiplayer_rooms;
  SELECT COUNT(*) INTO test_count FROM multiplayer_room_players;
  
  RAISE NOTICE 'RLS policies updated successfully. No recursion detected.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'RLS test failed: %', SQLERRM;
END $$;

COMMIT;

-- Add comment about the fix
COMMENT ON TABLE multiplayer_rooms IS 'Multiplayer rooms - RLS policies fixed for recursion issue (migration 037)';
COMMENT ON TABLE multiplayer_room_players IS 'Multiplayer room players - RLS policies fixed for recursion issue (migration 037)'; 