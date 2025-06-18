-- =============================================================================
-- FINAL FIX FOR RLS RECURSION - COMPLETE REBUILD
-- =============================================================================
-- Completely rebuilds RLS policies to eliminate any recursion

BEGIN;

-- =============================================================================
-- TEMPORARILY DISABLE RLS TO CLEAR ALL POLICIES
-- =============================================================================

ALTER TABLE multiplayer_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_question_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_game_events DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on new tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages') THEN
    EXECUTE 'ALTER TABLE multiplayer_chat_messages DISABLE ROW LEVEL SECURITY';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players') THEN
    EXECUTE 'ALTER TABLE multiplayer_npc_players DISABLE ROW LEVEL SECURITY';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context') THEN
    EXECUTE 'ALTER TABLE multiplayer_conversation_context DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =============================================================================
-- DROP ALL EXISTING POLICIES
-- =============================================================================

-- Drop all policies on multiplayer_rooms
DROP POLICY IF EXISTS "Users can view rooms they're in or that are public" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can view multiplayer rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON multiplayer_rooms;

-- Drop all policies on multiplayer_room_players
DROP POLICY IF EXISTS "Players can view other players in their rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can view players in rooms they joined" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can join rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can update their own data" ON multiplayer_room_players;

-- Drop all policies on other tables
DROP POLICY IF EXISTS "Players can view attempts in their rooms" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can view quiz attempts in their games" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can create their own attempts" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can update their own attempts" ON multiplayer_quiz_attempts;

DROP POLICY IF EXISTS "Players can view responses in their rooms" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "Players can view responses in their games" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "Players can create their own responses" ON multiplayer_question_responses;

DROP POLICY IF EXISTS "Players can view events in their rooms" ON multiplayer_game_events;
DROP POLICY IF EXISTS "Players can view game events in their rooms" ON multiplayer_game_events;
DROP POLICY IF EXISTS "Players can create events in their rooms" ON multiplayer_game_events;

-- Drop policies on new tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Players can view messages in their rooms" ON multiplayer_chat_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Players can view chat in their rooms" ON multiplayer_chat_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Players can send messages in their rooms" ON multiplayer_chat_messages';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Players can view NPCs in their rooms" ON multiplayer_npc_players';
    EXECUTE 'DROP POLICY IF EXISTS "Players can view NPCs in their games" ON multiplayer_npc_players';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Players can view conversation context in their rooms" ON multiplayer_conversation_context';
    EXECUTE 'DROP POLICY IF EXISTS "Players can view conversation context in their games" ON multiplayer_conversation_context';
  END IF;
END $$;

-- =============================================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =============================================================================

-- Re-enable RLS
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_game_events ENABLE ROW LEVEL SECURITY;

-- Simple room policies
CREATE POLICY "Anyone can view waiting rooms"
  ON multiplayer_rooms FOR SELECT
  USING (room_status = 'waiting');

CREATE POLICY "Hosts can view their rooms"
  ON multiplayer_rooms FOR SELECT
  USING (host_user_id = auth.uid());

CREATE POLICY "Anyone can create rooms"
  ON multiplayer_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hosts can update their rooms"
  ON multiplayer_rooms FOR UPDATE
  USING (host_user_id = auth.uid());

-- Simple player policies (NO SUBQUERIES)
CREATE POLICY "Anyone can view all players"
  ON multiplayer_room_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON multiplayer_room_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update themselves"
  ON multiplayer_room_players FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Simple quiz attempt policies
CREATE POLICY "Anyone can view quiz attempts"
  ON multiplayer_quiz_attempts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create quiz attempts"
  ON multiplayer_quiz_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update quiz attempts"
  ON multiplayer_quiz_attempts FOR UPDATE
  USING (true);

-- Simple response policies
CREATE POLICY "Anyone can view responses"
  ON multiplayer_question_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create responses"
  ON multiplayer_question_responses FOR INSERT
  WITH CHECK (true);

-- Simple event policies
CREATE POLICY "Anyone can view events"
  ON multiplayer_game_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create events"
  ON multiplayer_game_events FOR INSERT
  WITH CHECK (true);

-- Simple policies for new tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages') THEN
    EXECUTE 'ALTER TABLE multiplayer_chat_messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Anyone can view chat messages" ON multiplayer_chat_messages FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Anyone can send chat messages" ON multiplayer_chat_messages FOR INSERT WITH CHECK (true)';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players') THEN
    EXECUTE 'ALTER TABLE multiplayer_npc_players ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Anyone can view NPC players" ON multiplayer_npc_players FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Anyone can create NPC players" ON multiplayer_npc_players FOR INSERT WITH CHECK (true)';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context') THEN
    EXECUTE 'ALTER TABLE multiplayer_conversation_context ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Anyone can view conversation context" ON multiplayer_conversation_context FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Anyone can update conversation context" ON multiplayer_conversation_context FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Anyone can modify conversation context" ON multiplayer_conversation_context FOR UPDATE USING (true)';
  END IF;
END $$;

COMMIT;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Simplified RLS policies for multiplayer system - removed all recursive policies'; 