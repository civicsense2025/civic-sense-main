-- Comprehensive RLS Policies for AI NPC Players
-- This migration adds RLS policies to allow AI NPCs to function properly across all multiplayer tables

BEGIN;

-- =============================================================================
-- MULTIPLAYER_ROOM_PLAYERS - NPC POLICIES (EXTEND EXISTING)
-- =============================================================================

-- Policy for NPC players (identified by guest_token starting with 'npc_')
CREATE POLICY "npc_players_access" ON public.multiplayer_room_players
    FOR ALL 
    USING (
        guest_token IS NOT NULL AND 
        guest_token LIKE 'npc_%'
    )
    WITH CHECK (
        guest_token IS NOT NULL AND 
        guest_token LIKE 'npc_%'
    );

-- =============================================================================
-- MULTIPLAYER_CHAT_MESSAGES - NPC POLICIES
-- =============================================================================

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_chat_messages' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_chat_messages', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.multiplayer_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view all messages in rooms they're in
CREATE POLICY "users_can_view_room_messages" ON public.multiplayer_chat_messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_chat_messages.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 2: Users can insert messages in rooms they're in
CREATE POLICY "users_can_insert_room_messages" ON public.multiplayer_chat_messages
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_chat_messages.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 3: NPC messages (identified by npc_id being not null)
CREATE POLICY "npc_chat_messages_access" ON public.multiplayer_chat_messages
    FOR ALL 
    USING (npc_id IS NOT NULL)
    WITH CHECK (npc_id IS NOT NULL);

-- Policy 4: Service role full access
CREATE POLICY "service_role_chat_messages" ON public.multiplayer_chat_messages
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_chat_messages TO authenticated;

-- =============================================================================
-- MULTIPLAYER_NPC_PLAYERS - NPC POLICIES
-- =============================================================================

-- Drop existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_npc_players' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_npc_players', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.multiplayer_npc_players ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view NPC players in rooms they're in
CREATE POLICY "users_can_view_room_npcs" ON public.multiplayer_npc_players
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_npc_players.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 2: Allow NPC creation and updates
CREATE POLICY "npc_management_access" ON public.multiplayer_npc_players
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Policy 3: Service role full access
CREATE POLICY "service_role_npc_players" ON public.multiplayer_npc_players
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_npc_players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_npc_players TO authenticated;

-- =============================================================================
-- MULTIPLAYER_QUIZ_ATTEMPTS - NPC POLICIES
-- =============================================================================

-- Drop existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_quiz_attempts' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_quiz_attempts', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own quiz attempts
CREATE POLICY "users_own_quiz_attempts" ON public.multiplayer_quiz_attempts
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view quiz attempts in their rooms
CREATE POLICY "users_can_view_room_quiz_attempts" ON public.multiplayer_quiz_attempts
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_quiz_attempts.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 3: Guest players can manage their own attempts
CREATE POLICY "guest_quiz_attempts_access" ON public.multiplayer_quiz_attempts
    FOR ALL 
    USING (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    )
    WITH CHECK (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    );

-- Policy 4: Service role full access
CREATE POLICY "service_role_quiz_attempts" ON public.multiplayer_quiz_attempts
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_quiz_attempts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_quiz_attempts TO authenticated;

-- =============================================================================
-- MULTIPLAYER_QUESTION_RESPONSES - NPC POLICIES
-- =============================================================================

-- Drop existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_question_responses' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_question_responses', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own responses
CREATE POLICY "users_own_question_responses" ON public.multiplayer_question_responses
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view responses in their rooms
CREATE POLICY "users_can_view_room_responses" ON public.multiplayer_question_responses
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_question_responses.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 3: Guest players can manage their own responses
CREATE POLICY "guest_question_responses_access" ON public.multiplayer_question_responses
    FOR ALL 
    USING (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    )
    WITH CHECK (
        user_id IS NULL AND 
        guest_token IS NOT NULL AND 
        guest_token != ''
    );

-- Policy 4: Service role full access
CREATE POLICY "service_role_question_responses" ON public.multiplayer_question_responses
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_question_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_question_responses TO authenticated;

-- =============================================================================
-- MULTIPLAYER_GAME_EVENTS - NPC POLICIES
-- =============================================================================

-- Drop existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'multiplayer_game_events' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_game_events', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.multiplayer_game_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view events in their rooms
CREATE POLICY "users_can_view_room_events" ON public.multiplayer_game_events
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_game_events.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 2: Users can create events in their rooms
CREATE POLICY "users_can_create_room_events" ON public.multiplayer_game_events
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_game_events.room_id
            AND (
                mrp.user_id = auth.uid() OR
                (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
            )
        )
    );

-- Policy 3: Service role full access
CREATE POLICY "service_role_game_events" ON public.multiplayer_game_events
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_game_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_game_events TO authenticated;

-- =============================================================================
-- NPC_PERSONALITIES - BASELINE POLICIES
-- =============================================================================

-- Drop existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'npc_personalities' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.npc_personalities', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.npc_personalities ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view active NPCs
CREATE POLICY "public_can_view_active_npcs" ON public.npc_personalities
    FOR SELECT 
    USING (is_active = true);

-- Policy 2: Service role full access
CREATE POLICY "service_role_npc_personalities" ON public.npc_personalities
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT ON public.npc_personalities TO anon;
GRANT SELECT ON public.npc_personalities TO authenticated;

-- =============================================================================
-- NPC_CONVERSATION_HISTORY - POLICIES
-- =============================================================================

-- Check if table exists before creating policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'npc_conversation_history' AND table_schema = 'public') THEN
        -- Drop existing policies
        DECLARE 
            pol RECORD;
        BEGIN
            FOR pol IN 
                SELECT policyname FROM pg_policies 
                WHERE tablename = 'npc_conversation_history' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.npc_conversation_history', pol.policyname);
            END LOOP;
        END;

        -- Enable RLS
        ALTER TABLE public.npc_conversation_history ENABLE ROW LEVEL SECURITY;

        -- Policy 1: Users can view conversation history in their rooms
        CREATE POLICY "users_can_view_room_npc_history" ON public.npc_conversation_history
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.room_id = npc_conversation_history.room_id
                    AND (
                        mrp.user_id = auth.uid() OR
                        (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
                    )
                )
            );

        -- Policy 2: Service role full access
        CREATE POLICY "service_role_npc_history" ON public.npc_conversation_history
            FOR ALL 
            USING (current_setting('role') = 'service_role')
            WITH CHECK (current_setting('role') = 'service_role');

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.npc_conversation_history TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.npc_conversation_history TO authenticated;
    END IF;
END $$;

-- =============================================================================
-- NPC_LEARNING_PROGRESSION - POLICIES
-- =============================================================================

-- Check if table exists before creating policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'npc_learning_progression' AND table_schema = 'public') THEN
        -- Drop existing policies
        DECLARE 
            pol RECORD;
        BEGIN
            FOR pol IN 
                SELECT policyname FROM pg_policies 
                WHERE tablename = 'npc_learning_progression' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.npc_learning_progression', pol.policyname);
            END LOOP;
        END;

        -- Enable RLS
        ALTER TABLE public.npc_learning_progression ENABLE ROW LEVEL SECURITY;

        -- Policy 1: Everyone can view NPC learning data (for educational purposes)
        CREATE POLICY "public_can_view_npc_learning" ON public.npc_learning_progression
            FOR SELECT 
            USING (true);

        -- Policy 2: Service role full access
        CREATE POLICY "service_role_npc_learning" ON public.npc_learning_progression
            FOR ALL 
            USING (current_setting('role') = 'service_role')
            WITH CHECK (current_setting('role') = 'service_role');

        -- Grant permissions
        GRANT SELECT ON public.npc_learning_progression TO anon;
        GRANT SELECT ON public.npc_learning_progression TO authenticated;
        GRANT INSERT, UPDATE, DELETE ON public.npc_learning_progression TO service_role;
    END IF;
END $$;

-- =============================================================================
-- MULTIPLAYER_CONVERSATION_CONTEXT - POLICIES (IF EXISTS)
-- =============================================================================

-- Check if table exists before creating policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context' AND table_schema = 'public') THEN
        -- Drop existing policies
        DECLARE 
            pol RECORD;
        BEGIN
            FOR pol IN 
                SELECT policyname FROM pg_policies 
                WHERE tablename = 'multiplayer_conversation_context' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_conversation_context', pol.policyname);
            END LOOP;
        END;

        -- Enable RLS
        ALTER TABLE public.multiplayer_conversation_context ENABLE ROW LEVEL SECURITY;

        -- Policy 1: Users can view context in their rooms
        CREATE POLICY "users_can_view_room_context" ON public.multiplayer_conversation_context
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.room_id = multiplayer_conversation_context.room_id
                    AND (
                        mrp.user_id = auth.uid() OR
                        (mrp.guest_token IS NOT NULL AND mrp.guest_token != '')
                    )
                )
            );

        -- Policy 2: Service role full access
        CREATE POLICY "service_role_conversation_context" ON public.multiplayer_conversation_context
            FOR ALL 
            USING (current_setting('role') = 'service_role')
            WITH CHECK (current_setting('role') = 'service_role');

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_conversation_context TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_conversation_context TO authenticated;
    END IF;
END $$;

-- =============================================================================
-- CREATE TEST FUNCTION FOR NPC RLS VERIFICATION
-- =============================================================================

CREATE OR REPLACE FUNCTION test_npc_rls_policies()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_result TEXT := 'NPC RLS Policies Test Results:' || chr(10);
    table_name TEXT;
    policy_count INTEGER;
BEGIN
    -- Test all multiplayer tables
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'multiplayer_room_players',
            'multiplayer_chat_messages', 
            'multiplayer_npc_players',
            'multiplayer_quiz_attempts',
            'multiplayer_question_responses',
            'multiplayer_game_events',
            'npc_personalities'
        ])
    LOOP
        -- Check if RLS is enabled
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_name 
            AND schemaname = 'public' 
            AND rowsecurity = true
        ) THEN
            test_result := test_result || '✓ RLS enabled on ' || table_name || chr(10);
        ELSE
            test_result := test_result || '✗ RLS NOT enabled on ' || table_name || chr(10);
        END IF;
        
        -- Count policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_name 
        AND schemaname = 'public';
        
        test_result := test_result || '  📊 Policies: ' || policy_count::TEXT || chr(10);
    END LOOP;
    
    RETURN test_result;
END;
$$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- Run the test function to verify setup
SELECT test_npc_rls_policies();

COMMIT; 