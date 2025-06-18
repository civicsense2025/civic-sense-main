-- =============================================================================
-- ALLOW GUEST HOSTS IN MULTIPLAYER ROOMS
-- =============================================================================
-- Updates the create_multiplayer_room function to allow guest hosts

BEGIN;

-- =============================================================================
-- UPDATE MULTIPLAYER ROOMS TABLE
-- =============================================================================

-- Remove the NOT NULL constraint from host_user_id to allow guest hosts
ALTER TABLE multiplayer_rooms 
ALTER COLUMN host_user_id DROP NOT NULL;

-- Add a check constraint to ensure either host_user_id or a guest token is tracked
-- (We'll track guest hosts through the room_players table)

-- =============================================================================
-- UPDATE CREATE_MULTIPLAYER_ROOM FUNCTION
-- =============================================================================

-- Drop and recreate the function with optional host_user_id
DROP FUNCTION IF EXISTS create_multiplayer_room(UUID, VARCHAR(255), VARCHAR(100), INTEGER, VARCHAR(20));

CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_topic_id VARCHAR(255),              -- Required parameter first
  p_host_user_id UUID DEFAULT NULL,     -- Now optional for guest hosts
  p_room_name VARCHAR(100) DEFAULT NULL,
  p_max_players INTEGER DEFAULT 6,
  p_game_mode VARCHAR(20) DEFAULT 'classic'
)
RETURNS TABLE(
  room_id UUID,
  room_code VARCHAR(8),
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  new_room_id UUID;
  new_room_code VARCHAR(8);
  new_created_at TIMESTAMPTZ;
BEGIN
  -- Generate unique room code
  new_room_code := generate_room_code();
  
  -- Create the room (host_user_id can be NULL for guest hosts)
  INSERT INTO multiplayer_rooms (
    room_code,
    host_user_id,
    topic_id,
    room_name,
    max_players,
    game_mode,
    current_players
  ) VALUES (
    new_room_code,
    p_host_user_id,  -- Can be NULL
    p_topic_id,
    p_room_name,
    p_max_players,
    p_game_mode,
    0
  ) RETURNING multiplayer_rooms.id, multiplayer_rooms.created_at INTO new_room_id, new_created_at;
  
  RETURN QUERY SELECT new_room_id, new_room_code, new_created_at;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE RLS POLICIES FOR GUEST HOSTS
-- =============================================================================

-- Drop existing policies that assume host_user_id is always present
DROP POLICY IF EXISTS "Hosts can update their rooms" ON multiplayer_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON multiplayer_rooms;

-- Create new policies that handle guest hosts
CREATE POLICY "Users can create rooms"
  ON multiplayer_rooms FOR INSERT
  WITH CHECK (
    -- Authenticated users can create rooms with their user_id
    (auth.uid() IS NOT NULL AND host_user_id = auth.uid()) OR
    -- Guest users can create rooms with NULL host_user_id
    (auth.uid() IS NULL AND host_user_id IS NULL)
  );

CREATE POLICY "Hosts can update their rooms"
  ON multiplayer_rooms FOR UPDATE
  USING (
    -- Authenticated hosts can update their rooms
    (auth.uid() IS NOT NULL AND host_user_id = auth.uid()) OR
    -- Guest hosts can update rooms they created (identified through room_players)
    (host_user_id IS NULL AND id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE is_host = true AND guest_token IS NOT NULL
    ))
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION create_multiplayer_room TO anon;

COMMIT;

-- Add helpful comment
COMMENT ON FUNCTION create_multiplayer_room IS 'Creates multiplayer rooms for both authenticated users and guests'; 