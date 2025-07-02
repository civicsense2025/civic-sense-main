-- Enable RLS on multiplayer_room_players
ALTER TABLE multiplayer_room_players ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a player in a room
CREATE POLICY "Anyone can create a player in a room" ON multiplayer_room_players
  FOR INSERT
  WITH CHECK (true);

-- Policy: Players can update their own records
CREATE POLICY "Players can update their own records" ON multiplayer_room_players
  FOR UPDATE
  USING (
    (auth.uid() = user_id) OR
    (user_id IS NULL AND guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token')
  );

-- Policy: Anyone can read players
CREATE POLICY "Anyone can read players" ON multiplayer_room_players
  FOR SELECT
  USING (true);

-- Policy: Players can delete their own records
CREATE POLICY "Players can delete their own records" ON multiplayer_room_players
  FOR DELETE
  USING (
    (auth.uid() = user_id) OR
    (user_id IS NULL AND guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token')
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_room_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_room_players TO anon; 