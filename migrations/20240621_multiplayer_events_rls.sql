-- Enable RLS on multiplayer_room_events
ALTER TABLE multiplayer_room_events ENABLE ROW LEVEL SECURITY;

-- Policy: Room players can create events
CREATE POLICY "Room players can create events" ON multiplayer_room_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multiplayer_room_players mrp
      WHERE mrp.room_id = room_id
        AND (
          (mrp.user_id = auth.uid()) OR
          (mrp.user_id IS NULL AND mrp.guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token')
        )
    )
  );

-- Policy: Anyone can read events
CREATE POLICY "Anyone can read events" ON multiplayer_room_events
  FOR SELECT
  USING (true);

-- Policy: No one can update or delete events (events are immutable)
CREATE POLICY "No one can update events" ON multiplayer_room_events
  FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete events" ON multiplayer_room_events
  FOR DELETE
  USING (false);

-- Grant necessary permissions
GRANT SELECT, INSERT ON multiplayer_room_events TO authenticated;
GRANT SELECT, INSERT ON multiplayer_room_events TO anon; 