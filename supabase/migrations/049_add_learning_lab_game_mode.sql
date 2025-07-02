-- =============================================================================
-- ADD LEARNING LAB GAME MODE TO MULTIPLAYER SYSTEM
-- =============================================================================
-- This migration adds 'learning_lab' as a valid game mode for multiplayer rooms.
-- Learning labs are collaborative educational sessions that can work with AI/NPCs
-- and support single-player mode.

BEGIN;

-- =============================================================================
-- 1. UPDATE GAME MODE CONSTRAINT
-- =============================================================================

-- Drop the existing constraint
ALTER TABLE multiplayer_rooms 
DROP CONSTRAINT IF EXISTS multiplayer_rooms_game_mode_check;

-- Add the new constraint that includes 'learning_lab'
ALTER TABLE multiplayer_rooms 
ADD CONSTRAINT multiplayer_rooms_game_mode_check 
CHECK (game_mode IN ('classic', 'speed_round', 'elimination', 'team_battle', 'learning_lab'));

-- =============================================================================
-- 2. UPDATE ROOM CREATION FUNCTION TO SUPPORT LEARNING LAB
-- =============================================================================

-- The existing create_multiplayer_room function will now accept 'learning_lab' 
-- because we've updated the constraint. No function changes needed.

-- =============================================================================
-- 3. ADD LEARNING LAB SPECIFIC SETTINGS
-- =============================================================================

-- Add a comment to document learning lab features
COMMENT ON COLUMN multiplayer_rooms.game_mode IS 
'Game mode type: classic (traditional quiz), speed_round (fast-paced), elimination (last player standing), team_battle (team vs team), learning_lab (collaborative educational session with AI/NPC support)';

-- =============================================================================
-- 4. VERIFY THE CHANGE
-- =============================================================================

-- Test that learning_lab is now accepted
DO $$
BEGIN
  -- Try to create a test room with learning_lab mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'multiplayer_rooms_game_mode_check' 
    AND check_clause LIKE '%learning_lab%'
  ) THEN
    RAISE EXCEPTION 'Failed to add learning_lab to game_mode constraint';
  END IF;
  
  RAISE NOTICE '✅ Successfully added learning_lab game mode to multiplayer system';
END $$;

COMMIT; 