-- =============================================================================
-- BATCH 6: RECREATE CORE MULTIPLAYER TABLES
-- =============================================================================
-- This migration recreates the core multiplayer tables that were dropped in batch 2
-- These are essential tables for the multiplayer gaming functionality.

BEGIN;

-- =============================================================================
-- STEP 1: CREATE CORE MULTIPLAYER TABLES
-- =============================================================================

-- Table: multiplayer_rooms
-- Main table for multiplayer quiz rooms
CREATE TABLE IF NOT EXISTS public.multiplayer_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code TEXT NOT NULL UNIQUE,
    host_user_id UUID,
    topic_id TEXT NOT NULL,
    room_name TEXT DEFAULT 'Quiz Room',
    max_players INTEGER DEFAULT 6 CHECK (max_players >= 1 AND max_players <= 20),
    current_players INTEGER DEFAULT 0,
    room_status TEXT DEFAULT 'waiting' CHECK (room_status IN ('waiting', 'starting', 'in_progress', 'completed', 'abandoned')),
    game_mode TEXT DEFAULT 'classic',
    settings JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_room_players
-- Players in multiplayer rooms (both authenticated users and guests)
CREATE TABLE IF NOT EXISTS public.multiplayer_room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    user_id UUID,
    guest_token TEXT,
    player_name TEXT NOT NULL,
    player_emoji TEXT DEFAULT '😊',
    is_host BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    is_connected BOOLEAN DEFAULT TRUE,
    join_order INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT multiplayer_room_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_room_players_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL) OR 
        (user_id IS NULL AND guest_token IS NOT NULL)
    ),
    CONSTRAINT multiplayer_room_players_unique_user_per_room UNIQUE (room_id, user_id),
    CONSTRAINT multiplayer_room_players_unique_guest_per_room UNIQUE (room_id, guest_token)
);

-- Table: multiplayer_npc_players
-- NPC (AI) players for multiplayer games
CREATE TABLE IF NOT EXISTS public.multiplayer_npc_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    npc_id TEXT NOT NULL, -- References to predefined NPC configurations
    room_id UUID NOT NULL,
    player_name TEXT NOT NULL,
    player_emoji TEXT NOT NULL,
    personality_type TEXT DEFAULT 'balanced' CHECK (personality_type IN ('aggressive', 'balanced', 'supportive', 'competitive', 'educational')),
    difficulty_level INTEGER DEFAULT 2 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    ai_behavior_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT multiplayer_npc_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_npc_players_unique_npc_per_room UNIQUE (room_id, npc_id)
);

-- Table: multiplayer_question_responses
-- Individual question responses in multiplayer games
CREATE TABLE IF NOT EXISTS public.multiplayer_question_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    player_id UUID, -- References multiplayer_room_players.id
    npc_player_id UUID, -- References multiplayer_npc_players.id
    question_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    topic_id TEXT NOT NULL,
    selected_answer TEXT,
    is_correct BOOLEAN,
    response_time_ms INTEGER,
    points_earned INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    boosts_used INTEGER DEFAULT 0,
    response_metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT multiplayer_question_responses_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_question_responses_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_question_responses_npc_player_id_fkey FOREIGN KEY (npc_player_id) REFERENCES public.multiplayer_npc_players(id) ON DELETE CASCADE,
    CONSTRAINT multiplayer_question_responses_player_or_npc CHECK (
        (player_id IS NOT NULL AND npc_player_id IS NULL) OR 
        (player_id IS NULL AND npc_player_id IS NOT NULL)
    )
);

-- =============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for multiplayer_rooms
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_room_code ON public.multiplayer_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_host_user_id ON public.multiplayer_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_topic_id ON public.multiplayer_rooms(topic_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON public.multiplayer_rooms(room_status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_expires_at ON public.multiplayer_rooms(expires_at);

-- Indexes for multiplayer_room_players
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_room_id ON public.multiplayer_room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_user_id ON public.multiplayer_room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_guest_token ON public.multiplayer_room_players(guest_token);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_is_host ON public.multiplayer_room_players(is_host);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_is_connected ON public.multiplayer_room_players(is_connected);

-- Indexes for multiplayer_npc_players
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room_id ON public.multiplayer_npc_players(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_npc_id ON public.multiplayer_npc_players(npc_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_is_active ON public.multiplayer_npc_players(is_active);

-- Indexes for multiplayer_question_responses
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_room_id ON public.multiplayer_question_responses(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_player_id ON public.multiplayer_question_responses(player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_npc_player_id ON public.multiplayer_question_responses(npc_player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_question_id ON public.multiplayer_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_topic_id ON public.multiplayer_question_responses(topic_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_submitted_at ON public.multiplayer_question_responses(submitted_at);

-- =============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all core multiplayer tables
ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_npc_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: CREATE BASIC RLS POLICIES
-- =============================================================================

-- Policies for multiplayer_rooms
CREATE POLICY "multiplayer_rooms_view_all" ON public.multiplayer_rooms
    FOR SELECT USING (true); -- Rooms are public for joining

CREATE POLICY "multiplayer_rooms_host_manage" ON public.multiplayer_rooms
    FOR ALL USING (
        host_user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

-- Policies for multiplayer_room_players
CREATE POLICY "multiplayer_room_players_view_room_members" ON public.multiplayer_room_players
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp2
            WHERE mrp2.room_id = multiplayer_room_players.room_id
            AND mrp2.user_id = auth.uid()
        )
    );

CREATE POLICY "multiplayer_room_players_insert_own" ON public.multiplayer_room_players
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "multiplayer_room_players_update_own" ON public.multiplayer_room_players
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "multiplayer_room_players_delete_own" ON public.multiplayer_room_players
    FOR DELETE USING (
        user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

-- Policies for multiplayer_npc_players
CREATE POLICY "multiplayer_npc_players_view_all" ON public.multiplayer_npc_players
    FOR SELECT USING (true); -- NPCs are visible to all players

CREATE POLICY "multiplayer_npc_players_service_manage" ON public.multiplayer_npc_players
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for multiplayer_question_responses
CREATE POLICY "multiplayer_question_responses_view_room" ON public.multiplayer_question_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.room_id = multiplayer_question_responses.room_id
            AND mrp.user_id = auth.uid()
        ) OR
        auth.role() = 'service_role'
    );

CREATE POLICY "multiplayer_question_responses_insert_own" ON public.multiplayer_question_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_question_responses.player_id
            AND mrp.user_id = auth.uid()
        ) OR
        auth.role() = 'service_role'
    );

-- =============================================================================
-- STEP 5: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger function for updated_at timestamps (reuse from batch 5)
-- This function should already exist from batch 5, but create if needed
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to core multiplayer tables
CREATE TRIGGER update_multiplayer_rooms_updated_at
    BEFORE UPDATE ON public.multiplayer_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multiplayer_room_players_updated_at
    BEFORE UPDATE ON public.multiplayer_room_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multiplayer_npc_players_updated_at
    BEFORE UPDATE ON public.multiplayer_npc_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing chars
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.multiplayer_rooms WHERE room_code = result) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- =============================================================================
-- STEP 7: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== BATCH 6: CORE MULTIPLAYER TABLES CREATED ===';
    RAISE NOTICE 'Core multiplayer tables recreated:';
    RAISE NOTICE '  - multiplayer_rooms';
    RAISE NOTICE '  - multiplayer_room_players';
    RAISE NOTICE '  - multiplayer_npc_players';
    RAISE NOTICE '  - multiplayer_question_responses';
    RAISE NOTICE 'All tables have RLS enabled with basic policies';
    RAISE NOTICE 'Indexes and triggers have been created';
    RAISE NOTICE 'Helper functions are available';
    RAISE NOTICE '=============================================';
END $$;

COMMIT; 