-- Create Missing Multiplayer Tables and NPC RLS Policies
-- This migration creates missing tables first, then applies correct RLS policies for NPCs

BEGIN;

-- =============================================================================
-- CREATE MISSING MULTIPLAYER TABLES (IDEMPOTENT)
-- =============================================================================

-- Create multiplayer_chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.multiplayer_chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    player_id UUID NULL,
    npc_id UUID NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'chat',
    npc_personality_traits TEXT[] NULL,
    educational_value VARCHAR(10) NULL,
    confidence_score NUMERIC(3,2) NULL,
    trigger_type VARCHAR(30) NULL,
    trigger_context JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT multiplayer_chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT multiplayer_chat_messages_room_fkey FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_chat_messages_player_fkey FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE,
    
    -- Ensure either player_id or npc_id is set, but not both
    CONSTRAINT multiplayer_chat_messages_sender_check CHECK (
        (player_id IS NOT NULL AND npc_id IS NULL) OR 
        (player_id IS NULL AND npc_id IS NOT NULL)
    )
);

-- Create multiplayer_npc_players table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.multiplayer_npc_players (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    npc_id UUID NOT NULL,
    player_id UUID NOT NULL,
    conversation_frequency NUMERIC(3,2) NOT NULL DEFAULT 0.3,
    teaching_mode BOOLEAN NOT NULL DEFAULT TRUE,
    conflict_resolution_active BOOLEAN NOT NULL DEFAULT TRUE,
    messages_sent INTEGER NOT NULL DEFAULT 0,
    educational_contributions INTEGER NOT NULL DEFAULT 0,
    conflict_interventions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT multiplayer_npc_players_pkey PRIMARY KEY (id),
    CONSTRAINT multiplayer_npc_players_room_fkey FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_npc_players_player_fkey FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate NPCs per room
    CONSTRAINT multiplayer_npc_players_unique UNIQUE (room_id, npc_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_room ON public.multiplayer_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_player ON public.multiplayer_chat_messages(player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_npc ON public.multiplayer_chat_messages(npc_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_created ON public.multiplayer_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room ON public.multiplayer_npc_players(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_npc ON public.multiplayer_npc_players(npc_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_player ON public.multiplayer_npc_players(player_id);

-- =============================================================================
-- DROP INCORRECT POLICIES FROM PREVIOUS MIGRATIONS
-- =============================================================================

-- Drop policies that may have incorrect column references
DROP POLICY IF EXISTS "npc_chat_messages_access" ON public.multiplayer_chat_messages;
DROP POLICY IF EXISTS "npc_npc_players_access" ON public.multiplayer_npc_players;
DROP POLICY IF EXISTS "npc_quiz_attempts_access" ON public.multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "npc_question_responses_access" ON public.multiplayer_question_responses;
DROP POLICY IF EXISTS "npc_game_events_access" ON public.multiplayer_game_events;
DROP POLICY IF EXISTS "regular_chat_messages_access" ON public.multiplayer_chat_messages;
DROP POLICY IF EXISTS "regular_npc_players_view" ON public.multiplayer_npc_players;

-- =============================================================================
-- ENABLE RLS ON ALL MULTIPLAYER TABLES
-- =============================================================================

ALTER TABLE public.multiplayer_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_npc_players ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables (idempotent)
DO $$ 
BEGIN
    -- Only enable if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        ALTER TABLE public.multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_question_responses' AND table_schema = 'public') THEN
        ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public') THEN
        ALTER TABLE public.multiplayer_game_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- NPC RLS POLICIES - CORRECT COLUMN REFERENCES
-- =============================================================================

-- NPC policies for multiplayer_chat_messages (uses npc_id column)
CREATE POLICY "npc_chat_messages_access" ON public.multiplayer_chat_messages
    FOR ALL 
    USING (npc_id IS NOT NULL)
    WITH CHECK (npc_id IS NOT NULL);

-- NPC policies for multiplayer_npc_players (uses npc_id column)
CREATE POLICY "npc_npc_players_access" ON public.multiplayer_npc_players
    FOR ALL 
    USING (npc_id IS NOT NULL)
    WITH CHECK (npc_id IS NOT NULL);

-- NPC policies for multiplayer_quiz_attempts (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "npc_quiz_attempts_access" ON public.multiplayer_quiz_attempts
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_quiz_attempts.player_id
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_quiz_attempts.player_id
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            );';
    END IF;
END $$;

-- NPC policies for multiplayer_question_responses (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_question_responses' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "npc_question_responses_access" ON public.multiplayer_question_responses
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_question_responses.player_id
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_question_responses.player_id
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            );';
    END IF;
END $$;

-- NPC policies for multiplayer_game_events (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "npc_game_events_access" ON public.multiplayer_game_events
            FOR ALL 
            USING (
                triggered_by IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_game_events.triggered_by
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            )
            WITH CHECK (
                triggered_by IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_game_events.triggered_by
                    AND mrp.guest_token IS NOT NULL 
                    AND mrp.guest_token LIKE ''npc_%''
                )
            );';
    END IF;
END $$;

-- =============================================================================
-- REGULAR USER/GUEST RLS POLICIES
-- =============================================================================

-- Regular user/guest policies for multiplayer_chat_messages
CREATE POLICY "regular_chat_messages_access" ON public.multiplayer_chat_messages
    FOR ALL 
    USING (
        player_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_chat_messages.player_id
        )
    )
    WITH CHECK (
        player_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_chat_messages.player_id
        )
    );

-- Regular user/guest policies for multiplayer_npc_players (users can view NPC data in their rooms)
CREATE POLICY "regular_npc_players_view" ON public.multiplayer_npc_players
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_npc_players.room_id
        )
    );

-- Regular user/guest policies for other tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "regular_quiz_attempts_access" ON public.multiplayer_quiz_attempts
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_quiz_attempts.player_id
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_quiz_attempts.player_id
                )
            );';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_question_responses' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "regular_question_responses_access" ON public.multiplayer_question_responses
            FOR ALL 
            USING (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_question_responses.player_id
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_question_responses.player_id
                )
            );';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public') THEN
        EXECUTE '
        CREATE POLICY "regular_game_events_access" ON public.multiplayer_game_events
            FOR ALL 
            USING (
                triggered_by IS NULL OR
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_game_events.triggered_by
                )
            )
            WITH CHECK (
                triggered_by IS NULL OR
                EXISTS (
                    SELECT 1 FROM public.multiplayer_room_players mrp
                    WHERE mrp.id = multiplayer_game_events.triggered_by
                )
            );';
    END IF;
END $$;

-- =============================================================================
-- ENABLE REALTIME FOR NEW TABLES
-- =============================================================================

-- Add new tables to realtime publication
DO $$
BEGIN
    -- Add multiplayer_chat_messages to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_chat_messages;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
    END;
    
    -- Add multiplayer_npc_players to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_npc_players;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
    END;
END $$;

-- =============================================================================
-- ADD HELPFUL COMMENTS
-- =============================================================================

COMMENT ON TABLE public.multiplayer_chat_messages IS 'Real-time chat messages in multiplayer rooms, supports both player and NPC messages';
COMMENT ON TABLE public.multiplayer_npc_players IS 'NPC player configurations and statistics for multiplayer rooms';

COMMIT; 