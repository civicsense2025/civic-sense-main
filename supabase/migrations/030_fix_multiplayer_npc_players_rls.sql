-- =============================================================================
-- FIX MULTIPLAYER NPC PLAYERS RLS POLICIES
-- =============================================================================
-- This migration fixes the RLS policies on multiplayer_npc_players table
-- to allow proper NPC creation in multiplayer rooms

BEGIN;

-- =============================================================================
-- DROP EXISTING POLICIES (IDEMPOTENT)
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view NPC players" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Anyone can create NPC players" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Players can view NPCs in their rooms" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Players can view NPCs in their games" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "System can manage NPC players" ON multiplayer_npc_players;
DROP POLICY IF EXISTS "Authenticated users can manage NPC players" ON multiplayer_npc_players;

-- =============================================================================
-- ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE multiplayer_npc_players ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE NEW SIMPLIFIED RLS POLICIES
-- =============================================================================

-- Allow authenticated users to view all NPC players
CREATE POLICY "Authenticated users can view NPC players"
  ON multiplayer_npc_players
  FOR SELECT
  USING (true);

-- Allow authenticated users to create NPC players
CREATE POLICY "Authenticated users can create NPC players"
  ON multiplayer_npc_players
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update NPC players
CREATE POLICY "Authenticated users can update NPC players"
  ON multiplayer_npc_players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete NPC players (for cleanup)
CREATE POLICY "Authenticated users can delete NPC players"
  ON multiplayer_npc_players
  FOR DELETE
  USING (true);

-- =============================================================================
-- VERIFY TABLE STRUCTURE AND CONSTRAINTS
-- =============================================================================

-- Ensure the table has the correct structure
DO $$
BEGIN
  -- Check if required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multiplayer_npc_players' 
    AND column_name = 'npc_id'
  ) THEN
    RAISE EXCEPTION 'Column npc_id does not exist in multiplayer_npc_players table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multiplayer_npc_players' 
    AND column_name = 'player_id'
  ) THEN
    RAISE EXCEPTION 'Column player_id does not exist in multiplayer_npc_players table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'multiplayer_npc_players' 
    AND column_name = 'room_id'
  ) THEN
    RAISE EXCEPTION 'Column room_id does not exist in multiplayer_npc_players table';
  END IF;
END $$;

-- =============================================================================
-- VERIFY FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Ensure foreign key constraints exist
DO $$
BEGIN
  -- Check npc_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'multiplayer_npc_players'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'npc_id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE multiplayer_npc_players 
    ADD CONSTRAINT multiplayer_npc_players_npc_id_fkey 
    FOREIGN KEY (npc_id) REFERENCES npc_personalities(id) ON DELETE CASCADE;
  END IF;

  -- Check player_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'multiplayer_npc_players'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'player_id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE multiplayer_npc_players 
    ADD CONSTRAINT multiplayer_npc_players_player_id_fkey 
    FOREIGN KEY (player_id) REFERENCES multiplayer_room_players(id) ON DELETE CASCADE;
  END IF;

  -- Check room_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'multiplayer_npc_players'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'room_id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE multiplayer_npc_players 
    ADD CONSTRAINT multiplayer_npc_players_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES multiplayer_rooms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- ADD HELPFUL INDEXES (IDEMPOTENT)
-- =============================================================================

-- Index on room_id for efficient room-based queries
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room_id 
ON multiplayer_npc_players(room_id);

-- Index on npc_id for efficient NPC-based queries
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_npc_id 
ON multiplayer_npc_players(npc_id);

-- Index on player_id for efficient player-based queries
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_player_id 
ON multiplayer_npc_players(player_id);

-- Composite index for room + npc uniqueness checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room_npc_unique
ON multiplayer_npc_players(room_id, npc_id);

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_npc_players TO authenticated;

-- Grant usage on the sequence if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_name = 'multiplayer_npc_players_id_seq'
  ) THEN
    GRANT USAGE ON SEQUENCE multiplayer_npc_players_id_seq TO authenticated;
  END IF;
END $$;

-- =============================================================================
-- TEST THE POLICIES (OPTIONAL VERIFICATION)
-- =============================================================================

-- Create a test function to verify policies work
CREATE OR REPLACE FUNCTION test_multiplayer_npc_players_policies()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := 'RLS policies configured successfully';
BEGIN
  -- Test that policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'multiplayer_npc_players' 
    AND policyname = 'Authenticated users can view NPC players'
  ) THEN
    test_result := 'ERROR: View policy not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'multiplayer_npc_players' 
    AND policyname = 'Authenticated users can create NPC players'
  ) THEN
    test_result := 'ERROR: Create policy not found';
  END IF;

  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_multiplayer_npc_players_policies() as policy_test_result;

-- Clean up test function
DROP FUNCTION test_multiplayer_npc_players_policies();

COMMIT;

-- =============================================================================
-- HELPFUL COMMENTS
-- =============================================================================

COMMENT ON TABLE multiplayer_npc_players IS 'Tracks NPC participation in multiplayer rooms with simplified RLS policies for authenticated users';
COMMENT ON POLICY "Authenticated users can view NPC players" ON multiplayer_npc_players IS 'Allows all authenticated users to view NPC players in any room';
COMMENT ON POLICY "Authenticated users can create NPC players" ON multiplayer_npc_players IS 'Allows all authenticated users to add NPCs to multiplayer rooms';
COMMENT ON POLICY "Authenticated users can update NPC players" ON multiplayer_npc_players IS 'Allows all authenticated users to update NPC player records';
COMMENT ON POLICY "Authenticated users can delete NPC players" ON multiplayer_npc_players IS 'Allows all authenticated users to remove NPCs from rooms'; 