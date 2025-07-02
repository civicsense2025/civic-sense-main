-- =============================================================================
-- BATCH 5: HELPER FUNCTIONS AND TRIGGERS
-- =============================================================================
-- This migration creates helpful functions for multiplayer operations and
-- triggers for automatic timestamp updates.

BEGIN;

-- =============================================================================
-- STEP 1: CREATE HELPFUL FUNCTIONS FOR MULTIPLAYER
-- =============================================================================

-- Function to get room members (non-recursive)
CREATE OR REPLACE FUNCTION get_room_members(room_uuid UUID)
RETURNS TABLE (
    player_id UUID,
    user_id UUID,
    guest_token TEXT,
    player_name TEXT,
    player_emoji TEXT,
    is_host BOOLEAN,
    is_ready BOOLEAN,
    is_connected BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the table exists before querying
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        mrp.id,
        mrp.user_id,
        mrp.guest_token,
        mrp.player_name,
        mrp.player_emoji,
        mrp.is_host,
        mrp.is_ready,
        mrp.is_connected
    FROM public.multiplayer_room_players mrp
    WHERE mrp.room_id = room_uuid
    ORDER BY mrp.join_order ASC;
END;
$$;

-- Function to check if user can access room
CREATE OR REPLACE FUNCTION can_access_room(room_uuid UUID, check_user_id UUID DEFAULT NULL, check_guest_token TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Service role can access everything
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if the table exists before querying
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is a member of the room
    RETURN EXISTS (
        SELECT 1 
        FROM public.multiplayer_room_players mrp
        WHERE mrp.room_id = room_uuid
        AND (
            (check_user_id IS NOT NULL AND mrp.user_id = check_user_id) OR
            (check_guest_token IS NOT NULL AND mrp.guest_token = check_guest_token) OR
            (check_user_id IS NULL AND check_guest_token IS NULL AND (
                mrp.user_id = auth.uid() OR 
                (auth.uid() IS NULL AND mrp.guest_token IS NOT NULL)
            ))
        )
    );
END;
$$;

-- Function to get active game session for a room
CREATE OR REPLACE FUNCTION get_active_game_session(room_uuid UUID)
RETURNS TABLE (
    session_id UUID,
    session_number INTEGER,
    topic_id TEXT,
    game_mode TEXT,
    session_status TEXT,
    current_question_number INTEGER,
    total_questions INTEGER,
    started_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the table exists before querying
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        mgs.id,
        mgs.session_number,
        mgs.topic_id,
        mgs.game_mode,
        mgs.session_status,
        mgs.current_question_number,
        mgs.total_questions,
        mgs.started_at
    FROM public.multiplayer_game_sessions mgs
    WHERE mgs.room_id = room_uuid
    AND mgs.session_status IN ('active', 'paused')
    ORDER BY mgs.started_at DESC
    LIMIT 1;
END;
$$;

-- Function to record game event
CREATE OR REPLACE FUNCTION record_game_event(
    p_session_id UUID,
    p_room_id UUID,
    p_player_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}',
    p_question_number INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    -- Check if the table exists before inserting
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public') THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.multiplayer_game_events (
        session_id,
        room_id,
        player_id,
        event_type,
        event_data,
        question_number
    ) VALUES (
        p_session_id,
        p_room_id,
        p_player_id,
        p_event_type,
        p_event_data,
        p_question_number
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$;

-- Function to record room event
CREATE OR REPLACE FUNCTION record_room_event(
    p_room_id UUID,
    p_event_type TEXT,
    p_player_id UUID DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    -- Check if the table exists before inserting
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_events' AND table_schema = 'public') THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.multiplayer_room_events (
        room_id,
        event_type,
        player_id,
        event_data
    ) VALUES (
        p_room_id,
        p_event_type,
        p_player_id,
        p_event_data
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$;

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Check if the table exists before cleaning up
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') THEN
        RETURN 0;
    END IF;

    -- Delete rooms that have expired
    DELETE FROM public.multiplayer_rooms
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND room_status IN ('waiting', 'abandoned');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- =============================================================================
-- STEP 2: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables (only if they exist)
DO $$
BEGIN
    -- multiplayer_game_sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_multiplayer_game_sessions_updated_at ON public.multiplayer_game_sessions;
        CREATE TRIGGER update_multiplayer_game_sessions_updated_at
            BEFORE UPDATE ON public.multiplayer_game_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for multiplayer_game_sessions';
    END IF;

    -- multiplayer_conversation_context
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_multiplayer_conversation_context_updated_at ON public.multiplayer_conversation_context;
        CREATE TRIGGER update_multiplayer_conversation_context_updated_at
            BEFORE UPDATE ON public.multiplayer_conversation_context
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for multiplayer_conversation_context';
    END IF;

    -- multiplayer_quiz_attempts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_multiplayer_quiz_attempts_updated_at ON public.multiplayer_quiz_attempts;
        CREATE TRIGGER update_multiplayer_quiz_attempts_updated_at
            BEFORE UPDATE ON public.multiplayer_quiz_attempts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for multiplayer_quiz_attempts';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: CREATE VALIDATION FUNCTION
-- =============================================================================

-- Function to validate multiplayer schema integrity
CREATE OR REPLACE FUNCTION validate_multiplayer_schema()
RETURNS TABLE (
    table_name TEXT,
    table_exists BOOLEAN,
    rls_enabled BOOLEAN,
    policy_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tbl TEXT;
    table_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'multiplayer_rooms',
            'multiplayer_room_players',
            'multiplayer_game_sessions',
            'multiplayer_game_events',
            'multiplayer_room_events',
            'multiplayer_chat_messages',
            'multiplayer_conversation_context',
            'multiplayer_quiz_attempts'
        ])
    LOOP
        -- Check if table exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND information_schema.tables.table_name = tbl
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Check if RLS is enabled
            SELECT c.relrowsecurity INTO rls_enabled
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' AND c.relname = tbl;
            
            -- Count policies
            SELECT COUNT(*) INTO policy_count
            FROM pg_policies
            WHERE schemaname = 'public' AND pg_policies.tablename = tbl;
        ELSE
            rls_enabled := FALSE;
            policy_count := 0;
        END IF;
        
        RETURN QUERY SELECT tbl, table_exists, rls_enabled, policy_count;
    END LOOP;
END;
$$;

-- =============================================================================
-- STEP 4: RUN VALIDATION AND LOG RESULTS
-- =============================================================================

DO $$
DECLARE
    validation_result RECORD;
    total_tables INTEGER := 0;
    existing_tables INTEGER := 0;
    rls_enabled_count INTEGER := 0;
    total_policies INTEGER := 0;
BEGIN
    RAISE NOTICE '=== MULTIPLAYER SCHEMA VALIDATION ===';
    
    FOR validation_result IN SELECT * FROM validate_multiplayer_schema() LOOP
        total_tables := total_tables + 1;
        
        IF validation_result.table_exists THEN
            existing_tables := existing_tables + 1;
            
            IF validation_result.rls_enabled THEN
                rls_enabled_count := rls_enabled_count + 1;
            END IF;
            
            total_policies := total_policies + validation_result.policy_count;
            
            RAISE NOTICE 'Table: % | Exists: % | RLS: % | Policies: %', 
                validation_result.table_name, 
                validation_result.table_exists, 
                validation_result.rls_enabled, 
                validation_result.policy_count;
        ELSE
            RAISE NOTICE 'Table: % | Exists: % | RLS: N/A | Policies: N/A', 
                validation_result.table_name, 
                validation_result.table_exists;
        END IF;
    END LOOP;
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  Total tables checked: %', total_tables;
    RAISE NOTICE '  Existing tables: %', existing_tables;
    RAISE NOTICE '  Tables with RLS: %', rls_enabled_count;
    RAISE NOTICE '  Total policies: %', total_policies;
    RAISE NOTICE '====================================';
END $$;

-- =============================================================================
-- STEP 5: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== BATCH 5: FUNCTIONS AND TRIGGERS CREATED ===';
    RAISE NOTICE 'Helper functions created for multiplayer operations';
    RAISE NOTICE 'Triggers created for automatic timestamp updates';
    RAISE NOTICE 'Validation function created for schema integrity';
    RAISE NOTICE 'Complete multiplayer schema is now ready!';
    RAISE NOTICE '============================================';
END $$;

COMMIT; 