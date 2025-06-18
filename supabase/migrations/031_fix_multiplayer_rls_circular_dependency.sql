-- =============================================================================
-- FIX MULTIPLAYER RLS CIRCULAR DEPENDENCY
-- =============================================================================
-- Fixes circular dependency in RLS policies that causes HTTPAccessFallbackBoundary errors

BEGIN;

-- RLS Policies for multiplayer_rooms - Fix circular dependency
DROP POLICY IF EXISTS "Users can view rooms they're in or that are public" ON multiplayer_rooms;
CREATE POLICY "Users can view rooms they're in or that are public"
  ON multiplayer_rooms FOR SELECT
  USING (
    host_user_id = auth.uid() 
    OR host_user_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.room_id = multiplayer_rooms.id 
      AND (mrp.user_id = auth.uid() OR mrp.guest_token IS NOT NULL)
    )
  );

-- RLS Policies for multiplayer_room_players - Fix circular dependency
DROP POLICY IF EXISTS "Players can view other players in their rooms" ON multiplayer_room_players;
CREATE POLICY "Players can view other players in their rooms"
  ON multiplayer_room_players FOR SELECT
  USING (
    user_id = auth.uid() 
    OR guest_token IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp2
      WHERE mrp2.room_id = multiplayer_room_players.room_id 
      AND mrp2.user_id = auth.uid()
    )
  );

COMMIT;

-- Add helpful comment
COMMENT ON POLICY "Users can view rooms they're in or that are public" ON multiplayer_rooms IS 'Fixed circular dependency - allows viewing rooms where user is host, guest rooms, or rooms where user is a player';
COMMENT ON POLICY "Players can view other players in their rooms" ON multiplayer_room_players IS 'Fixed circular dependency - allows viewing own player record, guest players, or players in same room'; 