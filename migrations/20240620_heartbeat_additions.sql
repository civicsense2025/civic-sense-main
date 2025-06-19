-- Add heartbeat functionality to multiplayer_room_players table
-- This enables real-time presence tracking and automatic cleanup

-- Add heartbeat columns (idempotent)
ALTER TABLE multiplayer_room_players
  ADD COLUMN IF NOT EXISTS last_activity      TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_connected       BOOLEAN     DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS connection_latency INTEGER     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connection_quality TEXT        DEFAULT 'excellent';

-- Create index for fast "who's still here" queries
CREATE INDEX IF NOT EXISTS idx_room_players_active
  ON multiplayer_room_players (room_id, is_connected, last_activity DESC);

-- Create index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_room_players_last_activity
  ON multiplayer_room_players (last_activity);

-- Update existing players to have current timestamp
UPDATE multiplayer_room_players 
SET last_activity = NOW()
WHERE last_activity IS NULL;

-- Add RLS policy for heartbeat updates (players can update only themselves)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'multiplayer_room_players' 
    AND policyname = 'players_can_update_heartbeat'
  ) THEN
    CREATE POLICY "players_can_update_heartbeat"
    ON multiplayer_room_players
    FOR UPDATE 
    USING (
      auth.uid() = user_id OR 
      (guest_token IS NOT NULL AND guest_token = current_setting('request.jwt.claims', true)::json->>'guest_token')
    );
  END IF;
END $$;

-- Add helpful view for active players
CREATE OR REPLACE VIEW active_room_players AS
SELECT 
  rp.*,
  CASE 
    WHEN rp.last_activity > NOW() - INTERVAL '15 seconds' THEN 'online'
    WHEN rp.last_activity > NOW() - INTERVAL '60 seconds' THEN 'away'
    ELSE 'offline'
  END as presence_status,
  EXTRACT(EPOCH FROM (NOW() - rp.last_activity)) as seconds_since_activity
FROM multiplayer_room_players rp
WHERE rp.is_connected = true
  AND rp.last_activity > NOW() - INTERVAL '5 minutes';

-- Add comment for documentation
COMMENT ON COLUMN multiplayer_room_players.last_activity IS 'Timestamp of last heartbeat update';
COMMENT ON COLUMN multiplayer_room_players.is_connected IS 'Quick flag for connection status';
COMMENT ON COLUMN multiplayer_room_players.connection_latency IS 'Latest connection latency in milliseconds';
COMMENT ON COLUMN multiplayer_room_players.connection_quality IS 'Connection quality: excellent, good, poor, offline'; 