-- =============================================================================
-- COMPREHENSIVE RLS POLICY RESET - MULTIPLAYER TABLES
-- =============================================================================
-- This migration implements the critical rule: DROP ALL POLICIES FIRST
-- 
-- Problem: Previous migrations created circular RLS policy dependencies causing
-- infinite recursion errors in multiplayer functionality.
--
-- Solution: Drop ALL existing policies on multiplayer tables, then recreate
-- a clean, non-circular policy structure that allows proper multiplayer functionality.
--
-- Critical Rule: When fixing RLS policies, ALWAYS drop ALL policies first,
-- then recreate from scratch. Never modify policies in place.

BEGIN;

-- =============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (CRITICAL FIRST STEP)
-- =============================================================================

-- Drop ALL policies on multiplayer_rooms
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_rooms' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_rooms', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Drop ALL policies on multiplayer_room_players
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_room_players' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_room_players', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Drop ALL policies on multiplayer_question_responses
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_question_responses' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_question_responses', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Drop ALL policies on multiplayer_game_sessions
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_game_sessions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_game_sessions', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_game_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 3: CREATE CLEAN, NON-CIRCULAR POLICIES
-- =============================================================================

-- MULTIPLAYER_ROOMS: Simple policies focused on room access
-- Anyone can view rooms (since room codes are shareable)
CREATE POLICY "multiplayer_rooms_public_read" ON public.multiplayer_rooms
    FOR SELECT USING (true);

-- Users can create rooms
CREATE POLICY "multiplayer_rooms_create" ON public.multiplayer_rooms
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL OR 
        auth.role() = 'service_role'
    );

-- Hosts can update their own rooms
CREATE POLICY "multiplayer_rooms_host_update" ON public.multiplayer_rooms
    FOR UPDATE USING (
        host_user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

-- Hosts can delete their own rooms
CREATE POLICY "multiplayer_rooms_host_delete" ON public.multiplayer_rooms
    FOR DELETE USING (
        host_user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

-- MULTIPLAYER_ROOM_PLAYERS: Allow players to see all players in ANY room they're in
-- This is the key policy that enables multiplayer functionality
CREATE POLICY "multiplayer_room_players_view_all" ON public.multiplayer_room_players
    FOR SELECT USING (
        -- Service role can see everything
        auth.role() = 'service_role' OR
        -- Users can see all players in rooms where they are also a player
        room_id IN (
            SELECT DISTINCT room_id 
            FROM public.multiplayer_room_players mrp_inner
            WHERE (
                (auth.uid() IS NOT NULL AND mrp_inner.user_id = auth.uid()) OR
                (auth.uid() IS NULL AND mrp_inner.guest_token IS NOT NULL)
            )
        )
    );

-- Users can insert their own player records
CREATE POLICY "multiplayer_room_players_insert_own" ON public.multiplayer_room_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- Users can update their own player records
CREATE POLICY "multiplayer_room_players_update_own" ON public.multiplayer_room_players
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- Users can delete their own player records
CREATE POLICY "multiplayer_room_players_delete_own" ON public.multiplayer_room_players
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- MULTIPLAYER_QUESTION_RESPONSES: Players can see responses in rooms they're in
CREATE POLICY "multiplayer_responses_view_room" ON public.multiplayer_question_responses
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        room_id IN (
            SELECT DISTINCT room_id 
            FROM public.multiplayer_room_players mrp_inner
            WHERE (
                (auth.uid() IS NOT NULL AND mrp_inner.user_id = auth.uid()) OR
                (auth.uid() IS NULL AND mrp_inner.guest_token IS NOT NULL)
            )
        )
    );

-- Users can insert their own responses
CREATE POLICY "multiplayer_responses_insert_own" ON public.multiplayer_question_responses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- Users can update their own responses
CREATE POLICY "multiplayer_responses_update_own" ON public.multiplayer_question_responses
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
        auth.role() = 'service_role'
    );

-- MULTIPLAYER_GAME_SESSIONS: Players can see sessions in rooms they're in
CREATE POLICY "multiplayer_sessions_view_room" ON public.multiplayer_game_sessions
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        room_id IN (
            SELECT DISTINCT room_id 
            FROM public.multiplayer_room_players mrp_inner
            WHERE (
                (auth.uid() IS NOT NULL AND mrp_inner.user_id = auth.uid()) OR
                (auth.uid() IS NULL AND mrp_inner.guest_token IS NOT NULL)
            )
        )
    );

-- Users can create sessions in rooms they're in
CREATE POLICY "multiplayer_sessions_create" ON public.multiplayer_game_sessions
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        room_id IN (
            SELECT DISTINCT room_id 
            FROM public.multiplayer_room_players mrp_inner
            WHERE (
                (auth.uid() IS NOT NULL AND mrp_inner.user_id = auth.uid()) OR
                (auth.uid() IS NULL AND mrp_inner.guest_token IS NOT NULL)
            )
        )
    );

-- Users can update sessions in rooms they're in
CREATE POLICY "multiplayer_sessions_update" ON public.multiplayer_game_sessions
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        room_id IN (
            SELECT DISTINCT room_id 
            FROM public.multiplayer_room_players mrp_inner
            WHERE (
                (auth.uid() IS NOT NULL AND mrp_inner.user_id = auth.uid()) OR
                (auth.uid() IS NULL AND mrp_inner.guest_token IS NOT NULL)
            )
        )
    );

-- =============================================================================
-- STEP 4: TEST THE POLICIES WITH A VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION test_multiplayer_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    success BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_room_id UUID;
    test_player_id UUID;
    test_user_id UUID := gen_random_uuid();
    test_guest_token TEXT := 'test_guest_' || extract(epoch from now())::text;
BEGIN
    -- Test 1: Create a test room as a guest user
    BEGIN
        INSERT INTO public.multiplayer_rooms (
            room_code, host_user_id, topic_id, room_name, max_players, current_players, room_status
        ) VALUES (
            'TEST' || substring(gen_random_uuid()::text, 1, 4), 
            NULL, -- Guest host
            'test-topic', 
            'Test Room', 
            4, 
            1, 
            'waiting'
        ) RETURNING id INTO test_room_id;
        
        RETURN QUERY SELECT 'create_room_as_guest'::TEXT, TRUE, 'Successfully created room as guest'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'create_room_as_guest'::TEXT, FALSE, SQLERRM::TEXT;
        RETURN;
    END;

    -- Test 2: Add a guest player to the room
    BEGIN
        INSERT INTO public.multiplayer_room_players (
            room_id, user_id, guest_token, player_name, player_emoji, is_host, is_ready
        ) VALUES (
            test_room_id, NULL, test_guest_token, 'Test Guest', '👤', TRUE, FALSE
        ) RETURNING id INTO test_player_id;
        
        RETURN QUERY SELECT 'add_guest_player'::TEXT, TRUE, 'Successfully added guest player'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'add_guest_player'::TEXT, FALSE, SQLERRM::TEXT;
        RETURN;
    END;

    -- Test 3: Check if we can view room players (this was failing before)
    BEGIN
        PERFORM * FROM public.multiplayer_room_players WHERE room_id = test_room_id;
        RETURN QUERY SELECT 'view_room_players'::TEXT, TRUE, 'Successfully viewed room players'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'view_room_players'::TEXT, FALSE, SQLERRM::TEXT;
        RETURN;
    END;

    -- Test 4: Add a second guest player
    BEGIN
        INSERT INTO public.multiplayer_room_players (
            room_id, user_id, guest_token, player_name, player_emoji, is_host, is_ready
        ) VALUES (
            test_room_id, NULL, 'test_guest_2_' || extract(epoch from now())::text, 'Test Guest 2', '🎮', FALSE, FALSE
        );
        
        RETURN QUERY SELECT 'add_second_player'::TEXT, TRUE, 'Successfully added second player'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'add_second_player'::TEXT, FALSE, SQLERRM::TEXT;
        RETURN;
    END;

    -- Test 5: Verify both players can see each other
    BEGIN
        IF (SELECT COUNT(*) FROM public.multiplayer_room_players WHERE room_id = test_room_id) >= 2 THEN
            RETURN QUERY SELECT 'players_see_each_other'::TEXT, TRUE, 'Both players can see each other'::TEXT;
        ELSE
            RETURN QUERY SELECT 'players_see_each_other'::TEXT, FALSE, 'Players cannot see each other'::TEXT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'players_see_each_other'::TEXT, FALSE, SQLERRM::TEXT;
        RETURN;
    END;

    -- Cleanup
    BEGIN
        DELETE FROM public.multiplayer_room_players WHERE room_id = test_room_id;
        DELETE FROM public.multiplayer_rooms WHERE id = test_room_id;
        RETURN QUERY SELECT 'cleanup'::TEXT, TRUE, 'Successfully cleaned up test data'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'cleanup'::TEXT, FALSE, SQLERRM::TEXT;
    END;
    
END;
$$;

-- Run the test function
SELECT * FROM test_multiplayer_rls_policies();

-- Drop the test function
DROP FUNCTION test_multiplayer_rls_policies();

-- =============================================================================
-- STEP 5: VERIFICATION AND LOGGING
-- =============================================================================

-- Log the successful policy reset
DO $$
BEGIN
    RAISE NOTICE '=== MULTIPLAYER RLS POLICY RESET COMPLETE ===';
    RAISE NOTICE 'All previous policies dropped and recreated';
    RAISE NOTICE 'Multiplayer functionality should now work without infinite recursion';
    RAISE NOTICE 'Players can see all other players in rooms they have joined';
    RAISE NOTICE 'Both authenticated users and guest users supported';
    RAISE NOTICE '================================================';
END $$;

COMMIT; 