-- =============================================================================
-- BATCH 3: ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================
-- This migration adds all foreign key constraints after tables are created.
-- This ensures all referenced tables and columns exist before creating constraints.

BEGIN;

-- =============================================================================
-- STEP 1: ADD FOREIGN KEY CONSTRAINTS TO NEW TABLES
-- =============================================================================

-- Add foreign key constraints for multiplayer_game_sessions
DO $$
BEGIN
    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_game_sessions_room_id_fkey' 
            AND table_name = 'multiplayer_game_sessions'
        ) THEN
            ALTER TABLE public.multiplayer_game_sessions 
            ADD CONSTRAINT multiplayer_game_sessions_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_game_sessions.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;
END $$;

-- Add foreign key constraints for multiplayer_game_events
DO $$
BEGIN
    -- Add session_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_game_events' AND column_name = 'session_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_game_events_session_id_fkey' 
            AND table_name = 'multiplayer_game_events'
        ) THEN
            ALTER TABLE public.multiplayer_game_events 
            ADD CONSTRAINT multiplayer_game_events_session_id_fkey 
            FOREIGN KEY (session_id) REFERENCES public.multiplayer_game_sessions(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_game_events.session_id -> multiplayer_game_sessions.id';
        END IF;
    END IF;

    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_game_events' AND column_name = 'room_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_game_events_room_id_fkey' 
            AND table_name = 'multiplayer_game_events'
        ) THEN
            ALTER TABLE public.multiplayer_game_events 
            ADD CONSTRAINT multiplayer_game_events_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_game_events.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;

    -- Add player_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_events' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_game_events' AND column_name = 'player_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_game_events_player_id_fkey' 
            AND table_name = 'multiplayer_game_events'
        ) THEN
            ALTER TABLE public.multiplayer_game_events 
            ADD CONSTRAINT multiplayer_game_events_player_id_fkey 
            FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_game_events.player_id -> multiplayer_room_players.id';
        END IF;
    END IF;
END $$;

-- Add foreign key constraints for multiplayer_room_events
DO $$
BEGIN
    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_events' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_room_events_room_id_fkey' 
            AND table_name = 'multiplayer_room_events'
        ) THEN
            ALTER TABLE public.multiplayer_room_events 
            ADD CONSTRAINT multiplayer_room_events_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_room_events.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;

    -- Add player_id foreign key (nullable)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_events' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_room_events_player_id_fkey' 
            AND table_name = 'multiplayer_room_events'
        ) THEN
            ALTER TABLE public.multiplayer_room_events 
            ADD CONSTRAINT multiplayer_room_events_player_id_fkey 
            FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: multiplayer_room_events.player_id -> multiplayer_room_players.id';
        END IF;
    END IF;
END $$;

-- Add foreign key constraints for multiplayer_chat_messages
DO $$
BEGIN
    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_chat_messages_room_id_fkey' 
            AND table_name = 'multiplayer_chat_messages'
        ) THEN
            ALTER TABLE public.multiplayer_chat_messages 
            ADD CONSTRAINT multiplayer_chat_messages_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_chat_messages.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;

    -- Add player_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_chat_messages_player_id_fkey' 
            AND table_name = 'multiplayer_chat_messages'
        ) THEN
            ALTER TABLE public.multiplayer_chat_messages 
            ADD CONSTRAINT multiplayer_chat_messages_player_id_fkey 
            FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_chat_messages.player_id -> multiplayer_room_players.id';
        END IF;
    END IF;

    -- Add reply_to_message_id foreign key (self-referencing) - ONLY if column exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_chat_messages' AND column_name = 'reply_to_message_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_chat_messages_reply_to_fkey' 
            AND table_name = 'multiplayer_chat_messages'
        ) THEN
            ALTER TABLE public.multiplayer_chat_messages 
            ADD CONSTRAINT multiplayer_chat_messages_reply_to_fkey 
            FOREIGN KEY (reply_to_message_id) REFERENCES public.multiplayer_chat_messages(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: multiplayer_chat_messages.reply_to_message_id -> multiplayer_chat_messages.id';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping reply_to_message_id foreign key - column does not exist';
    END IF;
END $$;

-- Add foreign key constraints for multiplayer_conversation_context
DO $$
BEGIN
    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_conversation_context_room_id_fkey' 
            AND table_name = 'multiplayer_conversation_context'
        ) THEN
            ALTER TABLE public.multiplayer_conversation_context 
            ADD CONSTRAINT multiplayer_conversation_context_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_conversation_context.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;

    -- Add npc_player_id foreign key - reference multiplayer_room_players instead of multiplayer_npc_players
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_conversation_context_npc_id_fkey' 
            AND table_name = 'multiplayer_conversation_context'
        ) THEN
            ALTER TABLE public.multiplayer_conversation_context 
            ADD CONSTRAINT multiplayer_conversation_context_npc_id_fkey 
            FOREIGN KEY (npc_player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_conversation_context.npc_player_id -> multiplayer_room_players.id';
        END IF;
    END IF;
END $$;

-- Add foreign key constraints for multiplayer_quiz_attempts
DO $$
BEGIN
    -- Add session_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_game_sessions' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_quiz_attempts' AND column_name = 'session_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_quiz_attempts_session_id_fkey' 
            AND table_name = 'multiplayer_quiz_attempts'
        ) THEN
            ALTER TABLE public.multiplayer_quiz_attempts 
            ADD CONSTRAINT multiplayer_quiz_attempts_session_id_fkey 
            FOREIGN KEY (session_id) REFERENCES public.multiplayer_game_sessions(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_quiz_attempts.session_id -> multiplayer_game_sessions.id';
        END IF;
    END IF;

    -- Add room_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_rooms' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_quiz_attempts' AND column_name = 'room_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_quiz_attempts_room_id_fkey' 
            AND table_name = 'multiplayer_quiz_attempts'
        ) THEN
            ALTER TABLE public.multiplayer_quiz_attempts 
            ADD CONSTRAINT multiplayer_quiz_attempts_room_id_fkey 
            FOREIGN KEY (room_id) REFERENCES public.multiplayer_rooms(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_quiz_attempts.room_id -> multiplayer_rooms.id';
        END IF;
    END IF;

    -- Add player_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_room_players' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multiplayer_quiz_attempts' AND column_name = 'player_id' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_quiz_attempts_player_id_fkey' 
            AND table_name = 'multiplayer_quiz_attempts'
        ) THEN
            ALTER TABLE public.multiplayer_quiz_attempts 
            ADD CONSTRAINT multiplayer_quiz_attempts_player_id_fkey 
            FOREIGN KEY (player_id) REFERENCES public.multiplayer_room_players(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key: multiplayer_quiz_attempts.player_id -> multiplayer_room_players.id';
        END IF;
    END IF;

    -- Add user_id foreign key (nullable) - auth.users always exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multiplayer_quiz_attempts' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'multiplayer_quiz_attempts_user_id_fkey' 
            AND table_name = 'multiplayer_quiz_attempts'
        ) THEN
            ALTER TABLE public.multiplayer_quiz_attempts 
            ADD CONSTRAINT multiplayer_quiz_attempts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key: multiplayer_quiz_attempts.user_id -> auth.users.id';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- STEP 2: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== BATCH 3: FOREIGN KEY CONSTRAINTS ADDED ===';
    RAISE NOTICE 'All foreign key constraints have been added safely';
    RAISE NOTICE 'Tables are now properly linked with referential integrity';
    RAISE NOTICE '============================================';
END $$;

COMMIT; 