-- Enable RLS on multiplayer_rooms
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a room
CREATE POLICY "Anyone can create a room" ON multiplayer_rooms
  FOR INSERT
  WITH CHECK (true);

-- Policy: Room creators can update their own rooms
CREATE POLICY "Room creators can update their own rooms" ON multiplayer_rooms
  FOR UPDATE
  USING (
    (auth.uid() = host_user_id) OR
    (host_user_id IS NULL AND EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.room_id = id
        AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token'
        AND mrp.is_host = true
    ))
  );

-- Policy: Anyone can read rooms
CREATE POLICY "Anyone can read rooms" ON multiplayer_rooms
  FOR SELECT
  USING (true);

-- Policy: Room creators can delete their own rooms
CREATE POLICY "Room creators can delete their own rooms" ON multiplayer_rooms
  FOR DELETE
  USING (
    (auth.uid() = host_user_id) OR
    (host_user_id IS NULL AND EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.room_id = id
        AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token'
        AND mrp.is_host = true
    ))
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON multiplayer_rooms TO anon; 