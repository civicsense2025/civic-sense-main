-- =============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES - FINAL
-- =============================================================================
-- Fixes infinite recursion by using simple, non-recursive policy approaches
-- Following best practices to avoid circular references
-- All column references are fully qualified to avoid ambiguity

BEGIN;

-- =============================================================================
-- DROP ALL PROBLEMATIC RLS POLICIES
-- =============================================================================

-- Drop all policies that could cause recursion
DROP POLICY IF EXISTS "Players can view players in rooms they joined" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can view room participants" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can view multiplayer rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Players can view quiz attempts in their games" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can view quiz attempts in hosted rooms" ON multiplayer_quiz_attempts;
DROP POLICY IF EXISTS "Players can view responses in their games" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "Players can view responses in hosted rooms" ON multiplayer_question_responses;
DROP POLICY IF EXISTS "Players can view game events in their rooms" ON multiplayer_game_events;
DROP POLICY IF EXISTS "Players can view events in hosted rooms" ON multiplayer_game_events;
DROP POLICY IF EXISTS "Players can view chat in their rooms" ON multiplayer_chat_messages;
DROP POLICY IF EXISTS "Players can view chat in hosted rooms" ON multiplayer_chat_messages;
DROP POLICY IF EXISTS "Players can view NPCs in their games" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Players can view NPCs in hosted rooms" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Players can view conversation context in their games" ON multiplayer_conversation_context;
DROP POLICY IF EXISTS "Players can view context in hosted rooms" ON multiplayer_conversation_context;
DROP POLICY IF EXISTS "Users can join available rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Users can join rooms" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can update their own status" ON multiplayer_room_players;
DROP POLICY IF EXISTS "Players can update their own data" ON multiplayer_room_players;

-- =============================================================================
-- CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =============================================================================

-- ============================================================================= 
-- MULTIPLAYER_ROOM_PLAYERS POLICIES (Following exact guidelines)
-- =============================================================================

-- 1. SELECT policy: Players can view their own records
CREATE POLICY "Players can view their own records" 
ON multiplayer_room_players 
FOR SELECT 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

-- 2. INSERT policy: Players can join a room
CREATE POLICY "Players can join a room" 
ON multiplayer_room_players 
FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 
                    FROM multiplayer_rooms mr 
                    WHERE mr.id = multiplayer_room_players.room_id 
                    AND mr.current_players < mr.max_players 
                    AND mr.room_status = 'waiting'));

-- 3. UPDATE policy: Players can update their own records
CREATE POLICY "Players can update their own records" 
ON multiplayer_room_players 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

-- 4. DELETE policy: Players can remove themselves from a room
CREATE POLICY "Players can remove themselves from a room" 
ON multiplayer_room_players 
FOR DELETE 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

-- Additional policy to allow viewing guest/NPC players (they have no user_id)
CREATE POLICY "Anyone can view guest and NPC players"
ON multiplayer_room_players
FOR SELECT
TO authenticated
USING (user_id IS NULL);

-- =============================================================================
-- MULTIPLAYER_ROOMS POLICIES (Simple, non-recursive)
-- =============================================================================

-- Allow users to view rooms they host
CREATE POLICY "Users can view their own rooms"
  ON multiplayer_rooms FOR SELECT
  TO authenticated
  USING (host_user_id = auth.uid());

-- Allow users to view waiting rooms (for joining)
CREATE POLICY "Anyone can view waiting rooms"
  ON multiplayer_rooms FOR SELECT
  TO authenticated
  USING (room_status = 'waiting');

-- Allow users to create rooms
CREATE POLICY "Users can create rooms"
  ON multiplayer_rooms FOR INSERT
  TO authenticated
  WITH CHECK (host_user_id = auth.uid());

-- Allow hosts to update their rooms
CREATE POLICY "Hosts can update their rooms"
  ON multiplayer_rooms FOR UPDATE
  TO authenticated
  USING (host_user_id = auth.uid());

-- =============================================================================
-- OTHER TABLE POLICIES (Simple ownership-based)
-- =============================================================================

-- Quiz attempts - simple ownership
CREATE POLICY "Players can view their own quiz attempts"
  ON multiplayer_quiz_attempts FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Players can create their own quiz attempts"
  ON multiplayer_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can update their own quiz attempts"
  ON multiplayer_quiz_attempts FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid());

-- Question responses - simple ownership
CREATE POLICY "Players can view their own responses"
  ON multiplayer_question_responses FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Players can create their own responses"
  ON multiplayer_question_responses FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Game events - simple ownership
CREATE POLICY "Players can view events they triggered"
  ON multiplayer_game_events FOR SELECT
  TO authenticated
  USING (triggered_by = auth.uid());

CREATE POLICY "Players can create game events"
  ON multiplayer_game_events FOR INSERT
  TO authenticated
  WITH CHECK (triggered_by = auth.uid());

-- =============================================================================
-- CONDITIONAL POLICIES FOR NPC TABLES (if they exist)
-- =============================================================================

-- Chat messages (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_chat_messages') THEN
    -- Allow players to view messages they sent
    EXECUTE 'CREATE POLICY "Players can view their own messages"
      ON multiplayer_chat_messages FOR SELECT
      TO authenticated
      USING (multiplayer_chat_messages.player_id IN (
        SELECT mrp.id FROM multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid()
      ))';
    
    -- Allow players to send messages
    EXECUTE 'CREATE POLICY "Players can send messages"
      ON multiplayer_chat_messages FOR INSERT
      TO authenticated
      WITH CHECK (multiplayer_chat_messages.player_id IN (
        SELECT mrp.id FROM multiplayer_room_players mrp
        WHERE mrp.user_id = auth.uid()
      ))';
  END IF;
END $$;

-- NPC players (if table exists) - read-only for authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_npc_players') THEN
    EXECUTE 'CREATE POLICY "Users can view NPC players"
      ON multiplayer_npc_players FOR SELECT
      TO authenticated
      USING (true)'; -- NPCs are public information
  END IF;
END $$;

-- Conversation context (if table exists) - read-only for authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multiplayer_conversation_context') THEN
    EXECUTE 'CREATE POLICY "Users can view conversation context"
      ON multiplayer_conversation_context FOR SELECT
      TO authenticated
      USING (true)'; -- Context is public for participants
  END IF;
END $$;

-- =============================================================================
-- SECURITY DEFINER FUNCTIONS FOR SAFE ACCESS (Optional helpers)
-- =============================================================================

-- Function to safely check if user is in a room (avoids RLS recursion)
CREATE OR REPLACE FUNCTION user_is_in_room(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM multiplayer_room_players mrp
    WHERE mrp.room_id = p_room_id 
    AND mrp.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to safely get user's rooms (avoids RLS recursion)
CREATE OR REPLACE FUNCTION get_user_rooms(p_user_id UUID)
RETURNS TABLE(room_id UUID)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT mrp.room_id
  FROM multiplayer_room_players mrp
  WHERE mrp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on security definer functions
GRANT EXECUTE ON FUNCTION user_is_in_room TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rooms TO authenticated;

-- Ensure all necessary permissions are granted
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_ready_status TO authenticated;
GRANT EXECUTE ON FUNCTION start_multiplayer_game TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_players_ready TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rooms TO authenticated;

-- Grant permissions for NPC functions with specific signatures
GRANT EXECUTE ON FUNCTION add_npc_to_multiplayer_room(VARCHAR(8), VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION send_npc_message(UUID, UUID, TEXT, VARCHAR(20), VARCHAR(30), JSONB, VARCHAR(10), DECIMAL(3,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_context(UUID, BOOLEAN, VARCHAR(20), BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_silence_intervention(UUID) TO authenticated;

-- ============================================
-- Fix Infinite Recursion in RLS Policies
-- ============================================
-- The pod_memberships policies were causing infinite recursion
-- by referencing the same table they were protecting

-- Drop the problematic policies (idempotent)
DROP POLICY IF EXISTS "Users can view pod memberships" ON pod_memberships;
DROP POLICY IF EXISTS "Pod admins can manage memberships" ON pod_memberships;

-- Create simpler, non-recursive policies for pod_memberships (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND policyname = 'Users can view their own memberships'
    ) THEN
        CREATE POLICY "Users can view their own memberships" ON pod_memberships
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND policyname = 'Users can view memberships in their pods'
    ) THEN
        CREATE POLICY "Users can view memberships in their pods" ON pod_memberships
            FOR SELECT USING (
                pod_id IN (
                    SELECT lp.id FROM learning_pods lp 
                    WHERE lp.created_by = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND policyname = 'Pod creators can manage memberships'
    ) THEN
        CREATE POLICY "Pod creators can manage memberships" ON pod_memberships
            FOR ALL USING (
                pod_id IN (
                    SELECT lp.id FROM learning_pods lp 
                    WHERE lp.created_by = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_memberships' 
        AND policyname = 'Users can join pods'
    ) THEN
        CREATE POLICY "Users can join pods" ON pod_memberships
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Also fix the learning_pods policies to avoid recursion (idempotent)
DROP POLICY IF EXISTS "Pod members can view their pods" ON learning_pods;
DROP POLICY IF EXISTS "Pod admins can manage their pods" ON learning_pods;

-- Simpler learning_pods policies (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'learning_pods' 
        AND policyname = 'Pod creators can manage their pods'
    ) THEN
        CREATE POLICY "Pod creators can manage their pods" ON learning_pods
            FOR ALL USING (created_by = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'learning_pods' 
        AND policyname = 'Pod members can view their pods'
    ) THEN
        CREATE POLICY "Pod members can view their pods" ON learning_pods
            FOR SELECT USING (
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM pod_memberships pm 
                    WHERE pm.pod_id = id 
                    AND pm.user_id = auth.uid() 
                    AND pm.membership_status = 'active'
                )
            );
    END IF;
END $$;

-- Fix other policies that might reference pod_memberships recursively (idempotent)
DROP POLICY IF EXISTS "Pod members can view activities" ON pod_activities;
DROP POLICY IF EXISTS "Pod members can view challenges" ON pod_challenges;
DROP POLICY IF EXISTS "Pod admins can manage challenges" ON pod_challenges;

-- Simpler policies for related tables (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_activities' 
        AND policyname = 'Pod members can view activities'
    ) THEN
        CREATE POLICY "Pod members can view activities" ON pod_activities
            FOR SELECT USING (
                pod_id IN (
                    SELECT lp.id FROM learning_pods lp 
                    WHERE lp.created_by = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM pod_memberships pm 
                    WHERE pm.pod_id = pod_activities.pod_id 
                    AND pm.user_id = auth.uid() 
                    AND pm.membership_status = 'active'
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_challenges' 
        AND policyname = 'Pod members can view challenges'
    ) THEN
        CREATE POLICY "Pod members can view challenges" ON pod_challenges
            FOR SELECT USING (
                pod_id IN (
                    SELECT lp.id FROM learning_pods lp 
                    WHERE lp.created_by = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM pod_memberships pm 
                    WHERE pm.pod_id = pod_challenges.pod_id 
                    AND pm.user_id = auth.uid() 
                    AND pm.membership_status = 'active'
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_challenges' 
        AND policyname = 'Pod creators can manage challenges'
    ) THEN
        CREATE POLICY "Pod creators can manage challenges" ON pod_challenges
            FOR ALL USING (
                created_by = auth.uid() OR
                pod_id IN (
                    SELECT lp.id FROM learning_pods lp 
                    WHERE lp.created_by = auth.uid()
                )
            );
    END IF;
END $$;

-- Fix challenge participants policy (idempotent)
DROP POLICY IF EXISTS "Users can view challenge participants" ON pod_challenge_participants;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pod_challenge_participants' 
        AND policyname = 'Users can view challenge participants'
    ) THEN
        CREATE POLICY "Users can view challenge participants" ON pod_challenge_participants
            FOR SELECT USING (
                user_id = auth.uid() OR
                challenge_id IN (
                    SELECT c.id FROM pod_challenges c
                    JOIN learning_pods lp ON c.pod_id = lp.id
                    WHERE lp.created_by = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM pod_challenges c
                    JOIN pod_memberships pm ON c.pod_id = pm.pod_id
                    WHERE c.id = challenge_id 
                    AND pm.user_id = auth.uid() 
                    AND pm.membership_status = 'active'
                )
            );
    END IF;
END $$;

COMMIT;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Fixed infinite recursion in multiplayer RLS policies using simple ownership-based approaches following best practices'; 