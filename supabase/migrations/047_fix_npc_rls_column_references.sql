-- Fix NPC RLS Policies - Correct Column References
-- This migration fixes the RLS policies to reference the correct column names that actually exist in the tables

BEGIN;

-- =============================================================================
-- DROP INCORRECT POLICIES FROM PREVIOUS MIGRATION
-- =============================================================================

-- Drop policies that reference non-existent user_id columns
DROP POLICY IF EXISTS "npc_chat_messages_access" ON public.multiplayer_chat_messages;
DROP POLICY IF EXISTS "npc_npc_players_access" ON public.multiplayer_npc_players;
DROP POLICY IF EXISTS "npc_quiz_attempts_access" ON public.multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "npc_game_state_access" ON public.multiplayer_game_state;
DROP POLICY IF EXISTS "npc_question_responses_access" ON public.multiplayer_question_responses;
DROP POLICY IF EXISTS "npc_game_events_access" ON public.multiplayer_game_events;

-- =============================================================================
-- MULTIPLAYER_CHAT_MESSAGES - CORRECT NPC POLICIES
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.multiplayer_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for NPC chat messages (no user_id column, uses npc_id)
CREATE POLICY "npc_chat_messages_access" ON public.multiplayer_chat_messages
    FOR ALL 
    USING (
        npc_id IS NOT NULL
    )
    WITH CHECK (
        npc_id IS NOT NULL
    );

-- =============================================================================
-- MULTIPLAYER_NPC_PLAYERS - CORRECT NPC POLICIES  
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.multiplayer_npc_players ENABLE ROW LEVEL SECURITY;

-- Policy for NPC players (uses npc_id and player_id columns)
CREATE POLICY "npc_npc_players_access" ON public.multiplayer_npc_players
    FOR ALL 
    USING (
        npc_id IS NOT NULL
    )
    WITH CHECK (
        npc_id IS NOT NULL
    );

-- =============================================================================
-- MULTIPLAYER_QUIZ_ATTEMPTS - CORRECT NPC POLICIES
-- =============================================================================

-- Enable RLS if not already enabled  
ALTER TABLE public.multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policy for NPC quiz attempts (uses player_id column)
-- NPCs will have player records in multiplayer_room_players with guest_token starting with 'npc_'
CREATE POLICY "npc_quiz_attempts_access" ON public.multiplayer_quiz_attempts
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_quiz_attempts.player_id
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_quiz_attempts.player_id
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    );

-- =============================================================================
-- MULTIPLAYER_QUESTION_RESPONSES - CORRECT NPC POLICIES
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.multiplayer_question_responses ENABLE ROW LEVEL SECURITY;

-- Policy for NPC question responses (uses player_id column)
-- NPCs will have player records in multiplayer_room_players with guest_token starting with 'npc_'
CREATE POLICY "npc_question_responses_access" ON public.multiplayer_question_responses
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_question_responses.player_id
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_question_responses.player_id
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    );

-- =============================================================================
-- MULTIPLAYER_GAME_EVENTS - CORRECT NPC POLICIES
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.multiplayer_game_events ENABLE ROW LEVEL SECURITY;

-- Policy for NPC game events (uses triggered_by column which references player_id)
-- NPCs will have player records in multiplayer_room_players with guest_token starting with 'npc_'
CREATE POLICY "npc_game_events_access" ON public.multiplayer_game_events
    FOR ALL 
    USING (
        triggered_by IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_game_events.triggered_by
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    )
    WITH CHECK (
        triggered_by IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.multiplayer_room_players mrp
            WHERE mrp.id = multiplayer_game_events.triggered_by
            AND mrp.guest_token IS NOT NULL 
            AND mrp.guest_token LIKE 'npc_%'
        )
    );

-- =============================================================================
-- ADD POLICIES FOR REGULAR USERS/GUESTS ON THESE TABLES
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

-- Regular user/guest policies for multiplayer_quiz_attempts
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
    );

-- Regular user/guest policies for multiplayer_question_responses
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
    );

-- Regular user/guest policies for multiplayer_game_events
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
    );

COMMIT; 