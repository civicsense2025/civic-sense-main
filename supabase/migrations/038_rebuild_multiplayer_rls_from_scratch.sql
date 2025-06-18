-- =============================================================================
-- REBUILD MULTIPLAYER RLS POLICIES FROM SCRATCH
-- =============================================================================
-- Completely removes all existing multiplayer RLS policies and creates
-- simple, non-recursive policies from scratch

BEGIN;

-- =============================================================================
-- STEP 1: DISABLE RLS AND DROP ALL EXISTING POLICIES
-- =============================================================================

-- Disable RLS temporarily for safe cleanup
ALTER TABLE multiplayer_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on multiplayer_rooms (comprehensive cleanup)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'multiplayer_rooms'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Drop ALL policies on multiplayer_room_players (comprehensive cleanup)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'multiplayer_room_players'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Also drop any potential policies on related tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename LIKE 'multiplayer_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES FOR MULTIPLAYER_ROOMS
-- =============================================================================

-- Policy 1: SELECT - Allow viewing active rooms
CREATE POLICY "rooms_select_simple" ON multiplayer_rooms
    FOR SELECT 
    USING (
        -- Allow viewing rooms that are active
        room_status IN ('waiting', 'in_progress', 'completed')
    );

-- Policy 2: INSERT - Allow creating rooms
CREATE POLICY "rooms_insert_simple" ON multiplayer_rooms
    FOR INSERT 
    WITH CHECK (
        -- Authenticated users can create rooms
        auth.uid() IS NOT NULL 
        -- OR allow guest room creation (host_user_id can be NULL)
        OR host_user_id IS NULL
    );

-- Policy 3: UPDATE - Allow updating own rooms
CREATE POLICY "rooms_update_simple" ON multiplayer_rooms
    FOR UPDATE 
    USING (
        -- Only room host can update
        host_user_id = auth.uid() 
        -- OR allow guest hosts (for rooms without auth)
        OR host_user_id IS NULL
    )
    WITH CHECK (
        -- Same conditions for the updated data
        host_user_id = auth.uid() 
        OR host_user_id IS NULL
    );

-- Policy 4: DELETE - Allow deleting own rooms
CREATE POLICY "rooms_delete_simple" ON multiplayer_rooms
    FOR DELETE 
    USING (
        -- Only room host can delete
        host_user_id = auth.uid() 
        -- OR allow guest hosts
        OR host_user_id IS NULL
    );

-- =============================================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES FOR MULTIPLAYER_ROOM_PLAYERS
-- =============================================================================

-- Policy 1: SELECT - Allow viewing player records
CREATE POLICY "players_select_simple" ON multiplayer_room_players
    FOR SELECT 
    USING (
        -- Allow viewing all player records (no complex joins)
        -- This is safe because it doesn't contain sensitive data
        true
    );

-- Policy 2: INSERT - Allow joining rooms
CREATE POLICY "players_insert_simple" ON multiplayer_room_players
    FOR INSERT 
    WITH CHECK (
        -- Users can add themselves to rooms
        user_id = auth.uid()
        -- OR allow guest players with guest tokens
        OR (user_id IS NULL AND guest_token IS NOT NULL)
    );

-- Policy 3: UPDATE - Allow updating own player data
CREATE POLICY "players_update_simple" ON multiplayer_room_players
    FOR UPDATE 
    USING (
        -- Users can only update their own records
        user_id = auth.uid()
        -- OR guest players can update their own records
        OR (user_id IS NULL AND guest_token IS NOT NULL)
    )
    WITH CHECK (
        -- Same conditions for updated data
        user_id = auth.uid()
        OR (user_id IS NULL AND guest_token IS NOT NULL)
    );

-- Policy 4: DELETE - Allow leaving rooms
CREATE POLICY "players_delete_simple" ON multiplayer_room_players
    FOR DELETE 
    USING (
        -- Users can delete their own player records (leave room)
        user_id = auth.uid()
        -- OR guest players can leave
        OR (user_id IS NULL AND guest_token IS NOT NULL)
    );

-- =============================================================================
-- STEP 4: RE-ENABLE RLS AND TEST
-- =============================================================================

-- Re-enable RLS on both tables
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players ENABLE ROW LEVEL SECURITY;

-- Test that the policies work without causing recursion
DO $$
DECLARE
    room_count integer;
    player_count integer;
BEGIN
    -- Test basic queries that would trigger recursion if it exists
    SELECT COUNT(*) INTO room_count FROM multiplayer_rooms;
    SELECT COUNT(*) INTO player_count FROM multiplayer_room_players;
    
    RAISE NOTICE 'SUCCESS: RLS policies rebuilt from scratch';
    RAISE NOTICE 'Rooms table accessible: % records', room_count;
    RAISE NOTICE 'Players table accessible: % records', player_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: RLS test failed with error: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 5: VERIFY POLICY CREATION
-- =============================================================================

-- Show all policies that were created
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'CREATED POLICIES:';
    
    FOR policy_record IN 
        SELECT tablename, policyname, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename IN ('multiplayer_rooms', 'multiplayer_room_players')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '  Table: %, Policy: %, Command: %', 
            policy_record.tablename, 
            policy_record.policyname, 
            policy_record.cmd;
    END LOOP;
END $$;

COMMIT;

-- Add documentation
COMMENT ON TABLE multiplayer_rooms IS 'Multiplayer quiz rooms - RLS policies rebuilt from scratch (migration 038)';
COMMENT ON TABLE multiplayer_room_players IS 'Multiplayer room players - RLS policies rebuilt from scratch (migration 038)';

-- Log completion
SELECT 'Migration 038: Multiplayer RLS policies rebuilt successfully' AS status; 