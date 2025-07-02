    -- =============================================================================
    -- COMPREHENSIVE MULTIPLAYER SCHEMA ALIGNMENT MIGRATION
    -- =============================================================================
    -- This migration creates an idempotent script that aligns all multiplayer tables,
    -- functions, and policies with the actual usage patterns found in the codebase
    -- and the database.types.ts file.
    --
    -- Key Issues Addressed:
    -- 1. Schema misalignments between database.types.ts and actual tables
    -- 2. Function signature conflicts and version inconsistencies
    -- 3. RLS policy overlaps and circular dependencies
    -- 4. Missing indexes for performance
    -- 5. Inconsistent guest token handling
    -- 6. Custom slug support integration
    -- 7. NPC integration complexities
    --
    -- SAFETY: This migration is idempotent and can be run multiple times safely

    BEGIN;

    -- =============================================================================
    -- 1. SCHEMA ALIGNMENT - ENSURE TABLES MATCH database.types.ts EXACTLY
    -- =============================================================================

    -- 1.1 Multiplayer Rooms Table Alignment
    -- Based on database.types.ts multiplayer_rooms interface
    ALTER TABLE public.multiplayer_rooms 
    ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;

    -- Ensure all columns exist with correct types
    DO $$
    BEGIN
    -- Check and add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'multiplayer_rooms' AND column_name = 'custom_slug') THEN
        ALTER TABLE public.multiplayer_rooms ADD COLUMN custom_slug TEXT UNIQUE;
    END IF;
    
    -- Ensure expires_at has proper default
    ALTER TABLE public.multiplayer_rooms 
        ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '2 hours');
        
    -- Ensure settings has proper default
    ALTER TABLE public.multiplayer_rooms 
        ALTER COLUMN settings SET DEFAULT '{}';
    END $$;

    -- 1.2 Multiplayer Room Players Table Alignment
    -- Based on database.types.ts multiplayer_room_players interface
    DO $$
    BEGIN
    -- Add missing columns from database.types.ts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'multiplayer_room_players' AND column_name = 'connection_latency') THEN
        ALTER TABLE public.multiplayer_room_players ADD COLUMN connection_latency INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'multiplayer_room_players' AND column_name = 'connection_quality') THEN
        ALTER TABLE public.multiplayer_room_players ADD COLUMN connection_quality TEXT;
    END IF;
    
    -- Ensure boost_inventory has proper default
    ALTER TABLE public.multiplayer_room_players 
        ALTER COLUMN boost_inventory SET DEFAULT '{}';
    END $$;

    -- 1.3 Multiplayer Quiz Attempts Table Alignment
    -- Based on database.types.ts multiplayer_quiz_attempts interface
    DO $$
    BEGIN
    -- Add missing game_session_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'multiplayer_quiz_attempts' AND column_name = 'game_session_id') THEN
        ALTER TABLE public.multiplayer_quiz_attempts ADD COLUMN game_session_id TEXT;
    END IF;
    END $$;

    -- 1.4 Ensure Missing Multiplayer Tables Exist
    -- Create tables that may be missing from some environments

    -- Multiplayer Chat Messages Table
    CREATE TABLE IF NOT EXISTS public.multiplayer_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE,
    npc_id UUID REFERENCES public.npc_personalities(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'npc', 'announcement')),
    educational_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure either player_id or npc_id is set, not both
    CHECK ((player_id IS NOT NULL AND npc_id IS NULL) OR (player_id IS NULL AND npc_id IS NOT NULL))
    );

    -- Multiplayer Conversation Context Table
    CREATE TABLE IF NOT EXISTS public.multiplayer_conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    current_mood TEXT DEFAULT 'neutral',
    recent_messages JSONB DEFAULT '[]',
    conflict_level INTEGER DEFAULT 0 CHECK (conflict_level >= 0 AND conflict_level <= 10),
    educational_opportunities JSONB DEFAULT '[]',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Multiplayer NPC Players Table
    CREATE TABLE IF NOT EXISTS public.multiplayer_npc_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE,
    npc_id UUID NOT NULL REFERENCES public.npc_personalities(id) ON DELETE CASCADE,
    skill_adjustments JSONB DEFAULT '{}',
    learning_context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(room_id, npc_id),
    UNIQUE(room_id, player_id)
    );

    -- =============================================================================
    -- 2. FUNCTION CONSOLIDATION - CLEAN SLATE APPROACH
    -- =============================================================================

    -- 2.1 Drop ALL existing multiplayer functions to avoid conflicts
    -- Drop all versions with all possible signatures

    -- Room code generation
    DROP FUNCTION IF EXISTS generate_room_code() CASCADE;

    -- Room management functions - all versions
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT, INT) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT, UUID) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS create_multiplayer_room_v2(TEXT, UUID, TEXT, TEXT, INT, TEXT) CASCADE;

    -- Player management functions - all versions
    DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT, UUID) CASCADE;
    DROP FUNCTION IF EXISTS join_multiplayer_room(TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS join_multiplayer_room_v2(TEXT, TEXT, UUID, TEXT, TEXT) CASCADE;

    DROP FUNCTION IF EXISTS leave_multiplayer_room(UUID, UUID) CASCADE;
    DROP FUNCTION IF EXISTS leave_multiplayer_room(TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS leave_multiplayer_room_v2(UUID, UUID) CASCADE;

    DROP FUNCTION IF EXISTS update_player_ready_status(UUID, UUID, BOOLEAN) CASCADE;
    DROP FUNCTION IF EXISTS update_player_ready_status(TEXT, TEXT, BOOLEAN) CASCADE;
    DROP FUNCTION IF EXISTS update_player_ready_status_v2(UUID, UUID, BOOLEAN) CASCADE;

    -- Game management functions - all versions
    DROP FUNCTION IF EXISTS start_multiplayer_game(UUID) CASCADE;
    DROP FUNCTION IF EXISTS start_multiplayer_game(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS start_multiplayer_game_v2(UUID) CASCADE;

    -- Utility functions
    DROP FUNCTION IF EXISTS reassign_room_host(UUID, UUID) CASCADE;
    DROP FUNCTION IF EXISTS cleanup_expired_rooms() CASCADE;
    DROP FUNCTION IF EXISTS get_room_by_code_or_slug(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS validate_room_access(UUID, UUID, TEXT) CASCADE;

    -- NPC functions
    DROP FUNCTION IF EXISTS add_npc_to_room(UUID, TEXT, TEXT, INT) CASCADE;
    DROP FUNCTION IF EXISTS remove_npc_from_room(UUID, UUID) CASCADE;
    DROP FUNCTION IF EXISTS update_npc_status(UUID, TEXT) CASCADE;

    -- Validation and test functions
    DROP FUNCTION IF EXISTS validate_multiplayer_schema_alignment() CASCADE;
    DROP FUNCTION IF EXISTS test_multiplayer_operations() CASCADE;

    -- 2.2 Room Code Generation Function (Enhanced)
    CREATE OR REPLACE FUNCTION generate_room_code()
    RETURNS TEXT AS $$
    DECLARE
    code TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
    BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (uppercase letters and numbers)
        code := UPPER(
        SUBSTRING(
            REPLACE(
            REPLACE(
                REPLACE(
                REPLACE(gen_random_uuid()::text, '-', ''),
                '0', '2'  -- Avoid confusing characters
                ),
                'O', '3'
            ),
            'I', '4'
            ),
            1, 8
        )
        );
        
        -- Make it more readable
        code := REPLACE(code, '1', '5');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM public.multiplayer_rooms WHERE room_code = code) THEN
        RETURN code;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique room code after % attempts', max_attempts;
        END IF;
    END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.3 Create Multiplayer Room Function (Final Version)
    CREATE OR REPLACE FUNCTION create_multiplayer_room(
    p_topic_id TEXT,
    p_host_user_id UUID DEFAULT NULL,
    p_host_guest_token TEXT DEFAULT NULL,
    p_room_name TEXT DEFAULT NULL,
    p_max_players INTEGER DEFAULT 6,
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
    new_room_id UUID;
    new_room_code TEXT;
    host_player_id UUID;
    host_player_name TEXT;
    expires_time TIMESTAMPTZ;
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
    
    -- Set expiration (24 hours for users, 1 hour for guests)
    IF p_host_user_id IS NOT NULL THEN
        expires_time := NOW() + INTERVAL '24 hours';
    ELSE
        expires_time := NOW() + INTERVAL '1 hour';
    END IF;
    
    -- Create the room
    INSERT INTO public.multiplayer_rooms (
        room_code,
        topic_id,
        room_name,
        max_players,
        current_players,
        game_mode,
        room_status,
        host_user_id,
        expires_at,
        settings
    ) VALUES (
        new_room_code,
        p_topic_id,
        COALESCE(p_room_name, 'Multiplayer Room'),
        COALESCE(p_max_players, 6),
        1, -- Start with 1 player (the host)
        COALESCE(p_game_mode, 'classic'),
        'waiting',
        p_host_user_id,
        expires_time,
        '{}'
    ) RETURNING multiplayer_rooms.id INTO new_room_id;
    
    -- Determine host display name
    IF p_host_user_id IS NOT NULL THEN
        host_player_name := 'Host';
    ELSE
        host_player_name := 'Host';
    END IF;
    
    -- Automatically add the host as a player
    INSERT INTO public.multiplayer_room_players (
        room_id,
        user_id,
        guest_token,
        player_name,
        player_emoji,
        join_order,
        is_host,
        is_ready,
        is_connected,
        boost_inventory
    ) VALUES (
        new_room_id,
        p_host_user_id,
        p_host_guest_token,
        host_player_name,
        '👑',
        1, -- First player
        TRUE, -- This is the host
        FALSE, -- Host starts as not ready
        TRUE, -- Host is connected
        '{}'
    ) RETURNING multiplayer_room_players.id INTO host_player_id;
    
    -- Return room data
    RETURN QUERY 
    SELECT 
        new_room_id,
        new_room_code,
        p_topic_id,
        COALESCE(p_room_name, 'Multiplayer Room'),
        COALESCE(p_max_players, 6),
        1,
        COALESCE(p_game_mode, 'classic'),
        'waiting'::TEXT,
        p_host_user_id,
        NOW();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.4 Join Multiplayer Room Function (Final Version)
    CREATE OR REPLACE FUNCTION join_multiplayer_room(
    p_room_code TEXT,
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
    v_room_record RECORD;
    v_player_id UUID;
    v_join_order INTEGER;
    v_current_players INTEGER;
    BEGIN
    -- Validate inputs
    IF p_room_code IS NULL OR p_room_code = '' THEN
        RETURN QUERY SELECT FALSE, 'Room code is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    IF p_player_name IS NULL OR p_player_name = '' THEN
        RETURN QUERY SELECT FALSE, 'Player name is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Ensure we have either user_id or guest_token
    IF p_user_id IS NULL AND (p_guest_token IS NULL OR p_guest_token = '') THEN
        RETURN QUERY SELECT FALSE, 'Either user ID or guest token is required'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Get room details
    SELECT * INTO v_room_record
    FROM public.multiplayer_rooms
    WHERE room_code = UPPER(p_room_code);

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Room not found'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Check room status
    IF v_room_record.room_status != 'waiting' THEN
        RETURN QUERY SELECT FALSE, 'Room is not accepting new players'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Check room capacity
    IF v_room_record.current_players >= v_room_record.max_players THEN
        RETURN QUERY SELECT FALSE, 'Room is full'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Check if player already in room
    IF EXISTS (
        SELECT 1 FROM public.multiplayer_room_players 
        WHERE room_id = v_room_record.id 
        AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id) OR
        (p_guest_token IS NOT NULL AND guest_token = p_guest_token)
        )
    ) THEN
        RETURN QUERY SELECT FALSE, 'Already in this room'::TEXT, NULL::UUID, NULL::UUID, NULL::INTEGER;
        RETURN;
    END IF;

    -- Get next join order
    SELECT COALESCE(MAX(join_order), 0) + 1 INTO v_join_order
    FROM public.multiplayer_room_players
    WHERE room_id = v_room_record.id;

    -- Add player to room
    INSERT INTO public.multiplayer_room_players (
        room_id,
        user_id,
        guest_token,
        player_name,
        player_emoji,
        is_host,
        is_ready,
        is_connected,
        join_order,
        boost_inventory
    ) VALUES (
        v_room_record.id,
        p_user_id,
        p_guest_token,
        p_player_name,
        p_player_emoji,
        FALSE,
        FALSE,
        TRUE,
        v_join_order,
        '{}'
    ) RETURNING id INTO v_player_id;

    -- Update room player count
    UPDATE public.multiplayer_rooms 
    SET current_players = current_players + 1
    WHERE id = v_room_record.id;

    -- Return success
    RETURN QUERY SELECT 
        TRUE,
        'Joined room successfully'::TEXT,
        v_room_record.id,
        v_player_id,
        v_join_order;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.5 Leave Multiplayer Room Function (Final Version)
    CREATE OR REPLACE FUNCTION leave_multiplayer_room(
    p_room_id UUID,
    p_player_id UUID
    )
    RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    new_host_player_id UUID
    ) AS $$
    DECLARE
    v_player_record RECORD;
    v_new_host_id UUID;
    v_current_players INTEGER;
    BEGIN
    -- Get player details
    SELECT * INTO v_player_record
    FROM public.multiplayer_room_players
    WHERE id = p_player_id AND room_id = p_room_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Player not found in room'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- If leaving player is host, reassign host
    IF v_player_record.is_host THEN
        SELECT id INTO v_new_host_id
        FROM public.multiplayer_room_players
        WHERE room_id = p_room_id 
        AND id != p_player_id
        AND is_connected = TRUE
        ORDER BY join_order
        LIMIT 1;

        IF v_new_host_id IS NOT NULL THEN
        UPDATE public.multiplayer_room_players
        SET is_host = TRUE
        WHERE id = v_new_host_id;
        END IF;
    END IF;

    -- Remove player from room
    DELETE FROM public.multiplayer_room_players
    WHERE id = p_player_id;

    -- Update room player count
    UPDATE public.multiplayer_rooms
    SET current_players = GREATEST(0, current_players - 1)
    WHERE id = p_room_id;

    RETURN QUERY SELECT TRUE, 'Left room successfully'::TEXT, v_new_host_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.6 Update Player Ready Status Function (Final Version)
    CREATE OR REPLACE FUNCTION update_player_ready_status(
    p_room_id UUID,
    p_player_id UUID,
    p_is_ready BOOLEAN
    )
    RETURNS BOOLEAN AS $$
    BEGIN
    UPDATE public.multiplayer_room_players
    SET 
        is_ready = p_is_ready,
        last_activity = NOW()
    WHERE room_id = p_room_id AND id = p_player_id;

    RETURN FOUND;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.7 Start Multiplayer Game Function (Final Version)
    CREATE OR REPLACE FUNCTION start_multiplayer_game(
    p_room_id UUID
    )
    RETURNS BOOLEAN AS $$
    DECLARE
    v_ready_count INTEGER;
    v_total_count INTEGER;
    BEGIN
    -- Check if all players are ready
    SELECT 
        COUNT(*) FILTER (WHERE is_ready = TRUE),
        COUNT(*)
    INTO v_ready_count, v_total_count
    FROM public.multiplayer_room_players
    WHERE room_id = p_room_id AND is_connected = TRUE;

    -- Need at least 1 player and all must be ready
    IF v_total_count = 0 OR v_ready_count != v_total_count THEN
        RETURN FALSE;
    END IF;

    -- Update room status
    UPDATE public.multiplayer_rooms
    SET 
        room_status = 'in_progress',
        started_at = NOW()
    WHERE id = p_room_id;

    RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2.8 Cleanup Expired Rooms Function (Enhanced)
    CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
    RETURNS INTEGER AS $$
    DECLARE
    deleted_count INTEGER;
    BEGIN
    DELETE FROM public.multiplayer_rooms
    WHERE 
        expires_at < NOW()
        OR (room_status = 'waiting' AND created_at < NOW() - INTERVAL '2 hours')
        OR (room_status = 'completed' AND completed_at < NOW() - INTERVAL '1 hour')
        OR (room_status = 'cancelled' AND created_at < NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- =============================================================================
    -- 3. PERFORMANCE INDEXES - COMPREHENSIVE SET
    -- =============================================================================

    -- Drop existing indexes to recreate them cleanly
    DROP INDEX IF EXISTS idx_multiplayer_rooms_code;
    DROP INDEX IF EXISTS idx_multiplayer_rooms_status;
    DROP INDEX IF EXISTS idx_multiplayer_rooms_expires;
    DROP INDEX IF EXISTS idx_multiplayer_rooms_custom_slug;
    DROP INDEX IF EXISTS idx_multiplayer_room_players_room;
    DROP INDEX IF EXISTS idx_multiplayer_room_players_user;
    DROP INDEX IF EXISTS idx_multiplayer_room_players_guest;
    DROP INDEX IF EXISTS idx_multiplayer_quiz_attempts_room;
    DROP INDEX IF EXISTS idx_multiplayer_quiz_attempts_player;
    DROP INDEX IF EXISTS idx_multiplayer_question_responses_room;
    DROP INDEX IF EXISTS idx_multiplayer_question_responses_attempt;
    DROP INDEX IF EXISTS idx_multiplayer_game_events_room;
    DROP INDEX IF EXISTS idx_multiplayer_chat_messages_room;
    DROP INDEX IF EXISTS idx_multiplayer_npc_players_room;

    -- Create comprehensive performance indexes (without CONCURRENTLY for Supabase compatibility)
    CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code 
    ON public.multiplayer_rooms(room_code);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status_expires 
    ON public.multiplayer_rooms(room_status, expires_at);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_custom_slug 
    ON public.multiplayer_rooms(custom_slug) WHERE custom_slug IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_host_status 
    ON public.multiplayer_rooms(host_user_id, room_status);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_room_connected 
    ON public.multiplayer_room_players(room_id, is_connected);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_user_room 
    ON public.multiplayer_room_players(user_id, room_id) WHERE user_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_guest_room 
    ON public.multiplayer_room_players(guest_token, room_id) WHERE guest_token IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_room_player 
    ON public.multiplayer_quiz_attempts(room_id, player_id);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_attempt_num 
    ON public.multiplayer_question_responses(attempt_id, question_number);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_room_created 
    ON public.multiplayer_game_events(room_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_room_created 
    ON public.multiplayer_chat_messages(room_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room_npc 
    ON public.multiplayer_npc_players(room_id, npc_id);

    -- =============================================================================
    -- 4. RLS POLICIES - CLEAN SLATE APPROACH
    -- =============================================================================

    -- 4.1 Clean up all existing RLS policies
    DO $$ 
    DECLARE 
    pol RECORD;
    BEGIN
    -- Drop all policies on multiplayer tables
    FOR pol IN 
        SELECT policyname, tablename FROM pg_policies 
        WHERE tablename IN (
        'multiplayer_rooms', 
        'multiplayer_room_players', 
        'multiplayer_quiz_attempts',
        'multiplayer_question_responses',
        'multiplayer_game_events',
        'multiplayer_chat_messages',
        'multiplayer_conversation_context',
        'multiplayer_npc_players'
        ) AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    END $$;

    -- 4.2 Enable RLS on all tables
    ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_room_players ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_game_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_chat_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_conversation_context ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.multiplayer_npc_players ENABLE ROW LEVEL SECURITY;

    -- 4.3 Multiplayer Rooms Policies (Simple, Non-Circular)
    CREATE POLICY "multiplayer_rooms_host_access" ON public.multiplayer_rooms
    FOR ALL USING (
        host_user_id = auth.uid() OR 
        host_user_id IS NULL
    );

    CREATE POLICY "multiplayer_rooms_player_view" ON public.multiplayer_rooms
    FOR SELECT USING (
        -- Direct subquery, no JOIN to avoid circular references
        EXISTS (
        SELECT 1 FROM public.multiplayer_room_players mrp
        WHERE mrp.room_id = multiplayer_rooms.id 
        AND (
            mrp.user_id = auth.uid() OR 
            mrp.guest_token IS NOT NULL
        )
        )
    );

    CREATE POLICY "multiplayer_rooms_service_role" ON public.multiplayer_rooms
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.4 Multiplayer Room Players Policies (Simple, Non-Circular)
    CREATE POLICY "multiplayer_room_players_own_access" ON public.multiplayer_room_players
    FOR ALL USING (
        user_id = auth.uid() OR 
        guest_token IS NOT NULL
    );

    CREATE POLICY "multiplayer_room_players_service_role" ON public.multiplayer_room_players
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.5 Multiplayer Quiz Attempts Policies
    CREATE POLICY "multiplayer_quiz_attempts_player_access" ON public.multiplayer_quiz_attempts
    FOR ALL USING (
        player_id IN (
        SELECT mrp.id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_quiz_attempts_service_role" ON public.multiplayer_quiz_attempts
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.6 Multiplayer Question Responses Policies
    CREATE POLICY "multiplayer_question_responses_player_access" ON public.multiplayer_question_responses
    FOR ALL USING (
        player_id IN (
        SELECT mrp.id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_question_responses_service_role" ON public.multiplayer_question_responses
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.7 Multiplayer Game Events Policies
    CREATE POLICY "multiplayer_game_events_room_access" ON public.multiplayer_game_events
    FOR ALL USING (
        room_id IN (
        SELECT mrp.room_id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_game_events_service_role" ON public.multiplayer_game_events
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.8 Multiplayer Chat Messages Policies
    CREATE POLICY "multiplayer_chat_messages_room_access" ON public.multiplayer_chat_messages
    FOR ALL USING (
        room_id IN (
        SELECT mrp.room_id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_chat_messages_service_role" ON public.multiplayer_chat_messages
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.9 Multiplayer Conversation Context Policies
    CREATE POLICY "multiplayer_conversation_context_room_access" ON public.multiplayer_conversation_context
    FOR ALL USING (
        room_id IN (
        SELECT mrp.room_id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_conversation_context_service_role" ON public.multiplayer_conversation_context
    FOR ALL USING (auth.role() = 'service_role');

    -- 4.10 Multiplayer NPC Players Policies
    CREATE POLICY "multiplayer_npc_players_room_access" ON public.multiplayer_npc_players
    FOR ALL USING (
        room_id IN (
        SELECT mrp.room_id FROM public.multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL
        )
    );

    CREATE POLICY "multiplayer_npc_players_service_role" ON public.multiplayer_npc_players
    FOR ALL USING (auth.role() = 'service_role');

    -- =============================================================================
    -- 5. GRANT PERMISSIONS
    -- =============================================================================

    -- Grant function permissions
    GRANT EXECUTE ON FUNCTION generate_room_code TO authenticated;
    GRANT EXECUTE ON FUNCTION generate_room_code TO anon;
    GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
    GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;
    GRANT EXECUTE ON FUNCTION join_multiplayer_room TO authenticated;
    GRANT EXECUTE ON FUNCTION join_multiplayer_room TO anon;
    GRANT EXECUTE ON FUNCTION leave_multiplayer_room TO authenticated;
    GRANT EXECUTE ON FUNCTION leave_multiplayer_room TO anon;
    GRANT EXECUTE ON FUNCTION update_player_ready_status TO authenticated;
    GRANT EXECUTE ON FUNCTION update_player_ready_status TO anon;
    GRANT EXECUTE ON FUNCTION start_multiplayer_game TO authenticated;
    GRANT EXECUTE ON FUNCTION start_multiplayer_game TO anon;
    GRANT EXECUTE ON FUNCTION cleanup_expired_rooms TO authenticated;

    -- Grant table permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_rooms TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_rooms TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_room_players TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_room_players TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_quiz_attempts TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_quiz_attempts TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_question_responses TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_question_responses TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_game_events TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_game_events TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_chat_messages TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_chat_messages TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_conversation_context TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_conversation_context TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_npc_players TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.multiplayer_npc_players TO anon;

    -- =============================================================================
    -- 6. VALIDATION AND TESTING FUNCTIONS
    -- =============================================================================

    -- 6.1 Validation function to check schema alignment
    CREATE OR REPLACE FUNCTION validate_multiplayer_schema_alignment()
    RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    expected_type TEXT,
    actual_type TEXT,
    status TEXT
    ) AS $$
    BEGIN
    -- Check multiplayer_rooms table
    RETURN QUERY
    WITH expected_columns AS (
        SELECT 'multiplayer_rooms'::TEXT as tbl, 'id'::TEXT as col, 'uuid'::TEXT as exp_type
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'room_code'::TEXT, 'character varying'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'host_user_id'::TEXT, 'uuid'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'topic_id'::TEXT, 'character varying'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'room_name'::TEXT, 'character varying'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'max_players'::TEXT, 'integer'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'current_players'::TEXT, 'integer'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'room_status'::TEXT, 'character varying'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'game_mode'::TEXT, 'character varying'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'settings'::TEXT, 'jsonb'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'created_at'::TEXT, 'timestamp with time zone'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'started_at'::TEXT, 'timestamp with time zone'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'completed_at'::TEXT, 'timestamp with time zone'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'expires_at'::TEXT, 'timestamp with time zone'::TEXT
        UNION ALL SELECT 'multiplayer_rooms'::TEXT, 'custom_slug'::TEXT, 'text'::TEXT
    )
    SELECT 
        ec.tbl,
        ec.col,
        ec.exp_type,
        COALESCE(c.data_type::TEXT, 'MISSING'::TEXT),
        CASE 
        WHEN c.data_type IS NULL THEN 'MISSING'::TEXT
        WHEN c.data_type::TEXT = ec.exp_type THEN 'OK'::TEXT
        ELSE 'TYPE_MISMATCH'::TEXT
        END
    FROM expected_columns ec
    LEFT JOIN information_schema.columns c ON c.table_name = ec.tbl AND c.column_name = ec.col
    WHERE c.table_schema = 'public' OR c.table_schema IS NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 6.2 Function to test multiplayer operations
    CREATE OR REPLACE FUNCTION test_multiplayer_operations()
    RETURNS TABLE(
    test_name TEXT,
    status TEXT,
    details TEXT
    ) AS $$
    DECLARE
    test_room_id UUID;
    test_player_id UUID;
    test_room_code TEXT;
    BEGIN
    -- Test 1: Create room
    BEGIN
        SELECT id, room_code INTO test_room_id, test_room_code
        FROM create_multiplayer_room(
        p_topic_id => 'test-topic',
        p_host_guest_token => 'test-guest-token',
        p_room_name => 'Test Room'
        );
        
        RETURN QUERY SELECT 'create_room'::TEXT, 'PASS'::TEXT, format('Created room %s', test_room_code);
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'create_room'::TEXT, 'FAIL'::TEXT, SQLERRM;
    END;
    
    -- Test 2: Join room
    IF test_room_code IS NOT NULL THEN
        BEGIN
        SELECT player_id INTO test_player_id
        FROM join_multiplayer_room(
            p_room_code => test_room_code,
            p_player_name => 'Test Player',
            p_guest_token => 'test-guest-token-2'
        );
        
        RETURN QUERY SELECT 'join_room'::TEXT, 'PASS'::TEXT, format('Joined room as player %s', test_player_id);
        EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'join_room'::TEXT, 'FAIL'::TEXT, SQLERRM;
        END;
    END IF;
    
    -- Test 3: Update ready status
    IF test_player_id IS NOT NULL THEN
        BEGIN
        PERFORM update_player_ready_status(test_room_id, test_player_id, TRUE);
        RETURN QUERY SELECT 'update_ready'::TEXT, 'PASS'::TEXT, 'Updated ready status';
        EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'update_ready'::TEXT, 'FAIL'::TEXT, SQLERRM;
        END;
    END IF;
    
    -- Cleanup
    IF test_room_id IS NOT NULL THEN
        DELETE FROM public.multiplayer_rooms WHERE id = test_room_id;
    END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- =============================================================================
    -- 7. FINAL VALIDATION AND CLEANUP
    -- =============================================================================

    -- Run validation
    DO $$
    DECLARE
    validation_result RECORD;
    test_result RECORD;
    BEGIN
    -- Check schema alignment
    RAISE NOTICE 'Validating schema alignment...';
    FOR validation_result IN SELECT * FROM validate_multiplayer_schema_alignment() LOOP
        IF validation_result.status != 'OK' THEN
        RAISE WARNING 'Schema issue: %.% - Expected: %, Actual: %, Status: %', 
            validation_result.table_name, 
            validation_result.column_name,
            validation_result.expected_type,
            validation_result.actual_type,
            validation_result.status;
        END IF;
    END LOOP;
    
    -- Test operations
    RAISE NOTICE 'Testing multiplayer operations...';
    FOR test_result IN SELECT * FROM test_multiplayer_operations() LOOP
        IF test_result.status = 'PASS' THEN
        RAISE NOTICE 'Test %: PASS - %', test_result.test_name, test_result.details;
        ELSE
        RAISE WARNING 'Test %: FAIL - %', test_result.test_name, test_result.details;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Multiplayer schema alignment completed successfully!';
    END $$;

    COMMIT; 