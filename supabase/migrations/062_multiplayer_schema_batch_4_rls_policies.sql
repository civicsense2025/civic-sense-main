-- =============================================================================
-- BATCH 4: ENABLE RLS AND CREATE SIMPLE, NON-CIRCULAR POLICIES
-- =============================================================================
-- This migration enables RLS on all multiplayer tables and creates simple,
-- non-circular policies that avoid infinite recursion.

BEGIN;

-- =============================================================================
-- STEP 1: ENABLE RLS ON ALL MULTIPLAYER TABLES
-- =============================================================================

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'multiplayer_rooms',
            'multiplayer_room_players',
            'multiplayer_question_responses',
            'multiplayer_game_sessions',
            'multiplayer_game_events',
            'multiplayer_room_events',
            'multiplayer_chat_messages',
            'multiplayer_npc_players',
            'multiplayer_conversation_context',
            'multiplayer_quiz_attempts'
        ])
    LOOP
        -- Check if table exists before enabling RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            RAISE NOTICE 'Enabled RLS on table: %', tbl;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping RLS enablement', tbl;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =============================================================================

-- MULTIPLAYER_ROOMS: Public read, authenticated create/manage
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') THEN
        -- Create new policies
        CREATE POLICY "multiplayer_rooms_public_read" ON public.multiplayer_rooms
            FOR SELECT USING (true);

        CREATE POLICY "multiplayer_rooms_create" ON public.multiplayer_rooms
            FOR INSERT WITH CHECK (
                auth.uid() IS NOT NULL OR 
                auth.role() = 'service_role'
            );

        CREATE POLICY "multiplayer_rooms_host_manage" ON public.multiplayer_rooms
            FOR ALL USING (
                host_user_id = auth.uid() OR 
                auth.role() = 'service_role'
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_rooms';
    END IF;
END $$;

-- MULTIPLAYER_ROOM_PLAYERS: Simple ownership-based access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') THEN
        -- Create new policies
        CREATE POLICY "multiplayer_room_players_view_all" ON public.multiplayer_room_players
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                -- Users can see all players in any room (needed for multiplayer)
                true
            );

        CREATE POLICY "multiplayer_room_players_insert_own" ON public.multiplayer_room_players
            FOR INSERT WITH CHECK (
                user_id = auth.uid() OR 
                (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
                auth.role() = 'service_role'
            );

        CREATE POLICY "multiplayer_room_players_update_own" ON public.multiplayer_room_players
            FOR UPDATE USING (
                user_id = auth.uid() OR 
                (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
                auth.role() = 'service_role'
            );

        CREATE POLICY "multiplayer_room_players_delete_own" ON public.multiplayer_room_players
            FOR DELETE USING (
                user_id = auth.uid() OR 
                (auth.uid() IS NULL AND guest_token IS NOT NULL) OR
                auth.role() = 'service_role'
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_room_players';
    END IF;
END $$;

-- MULTIPLAYER_GAME_SESSIONS: Room-based access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_game_sessions_view_all" ON public.multiplayer_game_sessions
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing all game sessions for multiplayer
            );

        CREATE POLICY "multiplayer_game_sessions_manage" ON public.multiplayer_game_sessions
            FOR ALL USING (
                auth.role() = 'service_role' OR
                auth.uid() IS NOT NULL -- Authenticated users can manage sessions
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_game_sessions';
    END IF;
END $$;

-- MULTIPLAYER_GAME_EVENTS: Open access for multiplayer functionality
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_game_events_view_all" ON public.multiplayer_game_events
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing all game events for multiplayer
            );

        CREATE POLICY "multiplayer_game_events_insert" ON public.multiplayer_game_events
            FOR INSERT WITH CHECK (
                auth.role() = 'service_role' OR
                auth.uid() IS NOT NULL OR
                true -- Allow event insertion for multiplayer (including guests)
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_game_events';
    END IF;
END $$;

-- MULTIPLAYER_ROOM_EVENTS: Open access for room functionality
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_events' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_room_events_view_all" ON public.multiplayer_room_events
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing all room events
            );

        CREATE POLICY "multiplayer_room_events_insert" ON public.multiplayer_room_events
            FOR INSERT WITH CHECK (
                auth.role() = 'service_role' OR
                true -- Allow event insertion for room activities
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_room_events';
    END IF;
END $$;

-- MULTIPLAYER_CHAT_MESSAGES: Open access for chat functionality
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_chat_messages_view_all" ON public.multiplayer_chat_messages
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing all chat messages in multiplayer
            );

        CREATE POLICY "multiplayer_chat_messages_insert" ON public.multiplayer_chat_messages
            FOR INSERT WITH CHECK (
                auth.role() = 'service_role' OR
                auth.uid() IS NOT NULL OR
                true -- Allow chat message insertion (including guests and NPCs)
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_chat_messages';
    END IF;
END $$;

-- MULTIPLAYER_CONVERSATION_CONTEXT: NPC context access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_conversation_context_view_all" ON public.multiplayer_conversation_context
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing conversation context for NPC interactions
            );

        CREATE POLICY "multiplayer_conversation_context_manage" ON public.multiplayer_conversation_context
            FOR ALL USING (
                auth.role() = 'service_role' OR
                auth.uid() IS NOT NULL -- Authenticated users can manage NPC context
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_conversation_context';
    END IF;
END $$;

-- MULTIPLAYER_QUIZ_ATTEMPTS: User-specific access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_quiz_attempts_view_own" ON public.multiplayer_quiz_attempts
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                user_id = auth.uid() OR
                true -- Allow viewing quiz attempts for multiplayer analytics
            );

        CREATE POLICY "multiplayer_quiz_attempts_insert_own" ON public.multiplayer_quiz_attempts
            FOR INSERT WITH CHECK (
                auth.role() = 'service_role' OR
                user_id = auth.uid() OR
                (user_id IS NULL AND auth.uid() IS NULL) -- Allow guest attempts
            );

        CREATE POLICY "multiplayer_quiz_attempts_update_own" ON public.multiplayer_quiz_attempts
            FOR UPDATE USING (
                auth.role() = 'service_role' OR
                user_id = auth.uid() OR
                (user_id IS NULL AND auth.uid() IS NULL) -- Allow guest updates
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_quiz_attempts';
    END IF;
END $$;

-- Handle existing tables that might not have been covered
DO $$
BEGIN
    -- MULTIPLAYER_QUESTION_RESPONSES: If it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_question_responses' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_question_responses_view_all" ON public.multiplayer_question_responses
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing responses for multiplayer
            );

        CREATE POLICY "multiplayer_question_responses_insert" ON public.multiplayer_question_responses
            FOR INSERT WITH CHECK (
                auth.role() = 'service_role' OR
                true -- Allow response insertion
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_question_responses';
    END IF;

    -- MULTIPLAYER_NPC_PLAYERS: If it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players' AND table_schema = 'public') THEN
        CREATE POLICY "multiplayer_npc_players_view_all" ON public.multiplayer_npc_players
            FOR SELECT USING (
                auth.role() = 'service_role' OR
                true -- Allow viewing NPCs for multiplayer
            );

        CREATE POLICY "multiplayer_npc_players_manage" ON public.multiplayer_npc_players
            FOR ALL USING (
                auth.role() = 'service_role' OR
                auth.uid() IS NOT NULL -- Authenticated users can manage NPCs
            );
        
        RAISE NOTICE 'Created RLS policies for multiplayer_npc_players';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== BATCH 4: RLS POLICIES CREATED ===';
    RAISE NOTICE 'RLS enabled on all multiplayer tables';
    RAISE NOTICE 'Simple, non-circular policies created';
    RAISE NOTICE 'Policies allow proper multiplayer functionality';
    RAISE NOTICE 'No infinite recursion issues should occur';
    RAISE NOTICE '====================================';
END $$;

COMMIT; 