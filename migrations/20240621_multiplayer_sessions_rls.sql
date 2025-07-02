-- Enable RLS on multiplayer_game_sessions
ALTER TABLE multiplayer_game_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Room creators can create game sessions
CREATE POLICY "Room creators can create game sessions" ON multiplayer_game_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multiplayer_rooms mr
      LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id
      WHERE mr.id = room_id
        AND (
          (mr.host_user_id = auth.uid()) OR
          (mr.host_user_id IS NULL AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token' AND mrp.is_host = true)
        )
    )
  );

-- Policy: Room creators can update game sessions
CREATE POLICY "Room creators can update game sessions" ON multiplayer_game_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_rooms mr
      LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id
      WHERE mr.id = room_id
        AND (
          (mr.host_user_id = auth.uid()) OR
          (mr.host_user_id IS NULL AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token' AND mrp.is_host = true)
        )
    )
  );

-- Policy: Anyone can read game sessions
CREATE POLICY "Anyone can read game sessions" ON multiplayer_game_sessions
  FOR SELECT
  USING (true);

-- Policy: Room creators can delete game sessions
CREATE POLICY "Room creators can delete game sessions" ON multiplayer_game_sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM multiplayer_rooms mr
      LEFT JOIN multiplayer_room_players mrp ON mr.id = mrp.room_id
      WHERE mr.id = room_id
        AND (
          (mr.host_user_id = auth.uid()) OR
          (mr.host_user_id IS NULL AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token' AND mrp.is_host = true)
        )
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_game_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_game_sessions TO anon; 