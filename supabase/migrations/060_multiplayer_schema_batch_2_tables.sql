-- =============================================================================
-- BATCH 2: CREATE MISSING MULTIPLAYER TABLES (WITHOUT FOREIGN KEYS)
-- =============================================================================
-- This migration creates all missing multiplayer tables without foreign key
-- constraints to avoid dependency issues. Foreign keys will be added in batch 3.

BEGIN;

-- =============================================================================
-- STEP 0: DROP ALL EXISTING MULTIPLAYER TABLES (CASCADE)
-- =============================================================================
-- Since we're testing and need clean schema, drop all multiplayer tables first

DROP TABLE IF EXISTS public.multiplayer_chat_messages CASCADE;
DROP TABLE IF EXISTS public.multiplayer_conversation_context CASCADE;
DROP TABLE IF EXISTS public.multiplayer_game_events CASCADE;
DROP TABLE IF EXISTS public.multiplayer_game_sessions CASCADE;
DROP TABLE IF EXISTS public.multiplayer_quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.multiplayer_room_events CASCADE;

-- Also drop any existing core multiplayer tables to ensure clean state
DROP TABLE IF EXISTS public.multiplayer_room_players CASCADE;
DROP TABLE IF EXISTS public.multiplayer_rooms CASCADE;
DROP TABLE IF EXISTS public.multiplayer_npc_players CASCADE;
DROP TABLE IF EXISTS public.multiplayer_question_responses CASCADE;

-- =============================================================================
-- STEP 1: CREATE MISSING MULTIPLAYER TABLES (IF NOT EXISTS)
-- =============================================================================

-- Table: multiplayer_game_sessions
-- Tracks individual game sessions within rooms
CREATE TABLE IF NOT EXISTS public.multiplayer_game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    session_number INTEGER NOT NULL DEFAULT 1,
    topic_id TEXT NOT NULL,
    game_mode TEXT NOT NULL DEFAULT 'classic',
    session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER NOT NULL DEFAULT 0,
    current_question_number INTEGER DEFAULT 0,
    session_config JSONB DEFAULT '{}',
    final_scores JSONB DEFAULT '{}',
    performance_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_game_events
-- Tracks all game events (answers, power-ups, etc.)
CREATE TABLE IF NOT EXISTS public.multiplayer_game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    room_id UUID NOT NULL,
    player_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('answer_submitted', 'hint_used', 'boost_activated', 'time_expired', 'player_eliminated', 'achievement_unlocked')),
    event_data JSONB DEFAULT '{}',
    question_number INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_room_events  
-- Tracks room-level events (player joins/leaves, game starts, etc.)
CREATE TABLE IF NOT EXISTS public.multiplayer_room_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('room_created', 'player_joined', 'player_left', 'game_started', 'game_completed', 'room_closed', 'settings_changed')),
    player_id UUID,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_conversation_context
-- Stores AI conversation context for NPCs
CREATE TABLE IF NOT EXISTS public.multiplayer_conversation_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    npc_player_id UUID NOT NULL,
    conversation_history JSONB DEFAULT '[]',
    personality_state JSONB DEFAULT '{}',
    educational_goals JSONB DEFAULT '{}',
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_quiz_attempts
-- Links multiplayer sessions to individual quiz attempts for tracking
CREATE TABLE IF NOT EXISTS public.multiplayer_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    room_id UUID NOT NULL,
    player_id UUID NOT NULL,
    user_id UUID,
    topic_id TEXT NOT NULL,
    attempt_data JSONB DEFAULT '{}', -- Stores quiz state, scores, etc.
    final_score INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    questions_total INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: multiplayer_chat_messages
-- Stores chat messages between players (including NPC interactions)
CREATE TABLE IF NOT EXISTS public.multiplayer_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    player_id UUID NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'npc_reaction', 'game_event')),
    message_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- For tone, educational value, etc.
    is_from_npc BOOLEAN DEFAULT FALSE,
    is_from_host BOOLEAN DEFAULT FALSE,
    reply_to_message_id UUID, -- Self-referencing column (FK added in batch 3)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE (IF NOT EXISTS)
-- =============================================================================

-- Game sessions indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_sessions_room_id ON public.multiplayer_game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_sessions_status ON public.multiplayer_game_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_sessions_topic ON public.multiplayer_game_sessions(topic_id);

-- Game events indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_session_id ON public.multiplayer_game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_room_id ON public.multiplayer_game_events(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_player_id ON public.multiplayer_game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_type ON public.multiplayer_game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_timestamp ON public.multiplayer_game_events(timestamp);

-- Room events indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_events_room_id ON public.multiplayer_room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_events_type ON public.multiplayer_room_events(event_type);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_events_timestamp ON public.multiplayer_room_events(timestamp);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_room_id ON public.multiplayer_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_player_id ON public.multiplayer_chat_messages(player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_timestamp ON public.multiplayer_chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_type ON public.multiplayer_chat_messages(message_type);

-- Conversation context indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_conversation_context_room_id ON public.multiplayer_conversation_context(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_conversation_context_npc_id ON public.multiplayer_conversation_context(npc_player_id);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_session_id ON public.multiplayer_quiz_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_room_id ON public.multiplayer_quiz_attempts(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_player_id ON public.multiplayer_quiz_attempts(player_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_user_id ON public.multiplayer_quiz_attempts(user_id);

-- =============================================================================
-- STEP 3: LOG COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== BATCH 2: MULTIPLAYER TABLES CREATED ===';
    RAISE NOTICE 'Dropped existing tables CASCADE for clean state';
    RAISE NOTICE 'Created tables (without foreign keys):';
    RAISE NOTICE '  - multiplayer_game_sessions';
    RAISE NOTICE '  - multiplayer_game_events';  
    RAISE NOTICE '  - multiplayer_room_events';
    RAISE NOTICE '  - multiplayer_chat_messages';
    RAISE NOTICE '  - multiplayer_conversation_context';
    RAISE NOTICE '  - multiplayer_quiz_attempts';
    RAISE NOTICE 'Foreign key constraints will be added in batch 3';
    RAISE NOTICE '==========================================';
END $$;

COMMIT; 