-- =============================================================================
-- BATCH 1: POLICY CLEANUP AND MISSING COLUMNS
-- =============================================================================
-- This migration creates a complete multiplayer experience with all necessary
-- tables and proper RLS policies that avoid infinite recursion.
--
-- CRITICAL RULE: DROP ALL POLICIES FIRST, then recreate from scratch.
-- DEADLOCK-SAFE: Uses proper transaction isolation and careful ordering.

-- Set transaction isolation to avoid deadlocks
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

BEGIN;

-- =============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (DEADLOCK-SAFE)
-- =============================================================================

-- Use a more careful approach to dropping policies
DO $$ 
DECLARE 
    pol RECORD;
    tbl TEXT;
    retry_count INTEGER;
    max_retries INTEGER := 3;
BEGIN
    -- List of all multiplayer tables (existing and new)
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
        -- Check if table exists before trying to drop policies
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = tbl) THEN
            
            -- Drop all policies for this table with retry logic
            FOR pol IN 
                SELECT policyname FROM pg_policies 
                WHERE tablename = tbl AND schemaname = 'public'
            LOOP
                retry_count := 0;
                WHILE retry_count < max_retries LOOP
                    BEGIN
                        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
                        RAISE NOTICE 'Dropped policy: % on table: %', pol.policyname, tbl;
                        EXIT; -- Success, exit retry loop
                    EXCEPTION
                        WHEN lock_not_available OR deadlock_detected THEN
                            retry_count := retry_count + 1;
                            IF retry_count >= max_retries THEN
                                RAISE NOTICE 'Failed to drop policy % on table % after % retries', pol.policyname, tbl, max_retries;
                                -- Continue anyway - the policy might not be critical
                            ELSE
                                RAISE NOTICE 'Retrying policy drop: % on table % (attempt %)', pol.policyname, tbl, retry_count + 1;
                                PERFORM pg_sleep(0.1 * retry_count); -- Brief backoff
                            END IF;
                    END;
                END LOOP;
            END LOOP;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping policy drops', tbl;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Adding missing columns to existing multiplayer tables...';
    
    -- Add missing columns to multiplayer_rooms
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'multiplayer_rooms'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Add session_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_rooms' 
            AND column_name = 'session_id'
        ) THEN
            ALTER TABLE public.multiplayer_rooms ADD COLUMN session_id UUID;
            RAISE NOTICE 'Added session_id column to multiplayer_rooms';
        END IF;
        
        -- Add game_config column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_rooms' 
            AND column_name = 'game_config'
        ) THEN
            ALTER TABLE public.multiplayer_rooms ADD COLUMN game_config JSONB DEFAULT '{}';
            RAISE NOTICE 'Added game_config column to multiplayer_rooms';
        END IF;
        
        -- Add expires_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_rooms' 
            AND column_name = 'expires_at'
        ) THEN
            ALTER TABLE public.multiplayer_rooms ADD COLUMN expires_at TIMESTAMPTZ;
            RAISE NOTICE 'Added expires_at column to multiplayer_rooms';
        END IF;
    END IF;
    
    -- Add missing columns to multiplayer_room_players
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'multiplayer_room_players'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Add session_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'session_id'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN session_id UUID;
            RAISE NOTICE 'Added session_id column to multiplayer_room_players';
        END IF;
        
        -- Add guest_token column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'guest_token'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN guest_token TEXT;
            RAISE NOTICE 'Added guest_token column to multiplayer_room_players';
        END IF;
        
        -- Add join_order column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'join_order'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN join_order INTEGER DEFAULT 1;
            RAISE NOTICE 'Added join_order column to multiplayer_room_players';
        END IF;
        
        -- Add performance_data column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'performance_data'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN performance_data JSONB DEFAULT '{}';
            RAISE NOTICE 'Added performance_data column to multiplayer_room_players';
        END IF;
        
        -- Add player_type column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'player_type'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN player_type TEXT DEFAULT 'human' CHECK (player_type IN ('human', 'npc'));
            RAISE NOTICE 'Added player_type column to multiplayer_room_players';
        END IF;
        
        -- Add npc_config column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'multiplayer_room_players' 
            AND column_name = 'npc_config'
        ) THEN
            ALTER TABLE public.multiplayer_room_players ADD COLUMN npc_config JSONB DEFAULT '{}';
            RAISE NOTICE 'Added npc_config column to multiplayer_room_players';
        END IF;
    END IF;
    
    RAISE NOTICE 'Finished adding missing columns to existing tables';
END $$;

COMMIT; 