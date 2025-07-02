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
  ON multiplayer_room_players (last_activity DESC);

-- Create index for host migration queries
CREATE INDEX IF NOT EXISTS idx_room_players_host_migration
  ON multiplayer_room_players (room_id, is_host, join_order ASC)
  WHERE is_connected = TRUE;

-- Update existing players to have heartbeat data
UPDATE multiplayer_room_players 
SET 
  last_activity = COALESCE(last_activity, created_at),
  is_connected = COALESCE(is_connected, TRUE),
  connection_latency = COALESCE(connection_latency, 0),
  connection_quality = COALESCE(connection_quality, 'excellent')
WHERE last_activity IS NULL 
   OR is_connected IS NULL 
   OR connection_latency IS NULL 
   OR connection_quality IS NULL;

-- Add comment explaining the heartbeat system
COMMENT ON COLUMN multiplayer_room_players.last_activity IS 'Timestamp of last heartbeat update for presence tracking';
COMMENT ON COLUMN multiplayer_room_players.is_connected IS 'Quick boolean flag for active connection status';
COMMENT ON COLUMN multiplayer_room_players.connection_latency IS 'Connection latency in milliseconds for quality monitoring';
COMMENT ON COLUMN multiplayer_room_players.connection_quality IS 'Connection quality rating: excellent, good, poor, offline';

-- Create function to cleanup inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_players(
  inactive_threshold_minutes INTEGER DEFAULT 60,
  dry_run BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  room_id UUID,
  player_count INTEGER,
  action TEXT
) AS $$
DECLARE
  inactive_cutoff TIMESTAMPTZ;
BEGIN
  inactive_cutoff := NOW() - (inactive_threshold_minutes || ' minutes')::INTERVAL;
  
  IF dry_run THEN
    -- Return what would be cleaned up without actually doing it
    RETURN QUERY
    SELECT 
      mrp.room_id,
      COUNT(*)::INTEGER as player_count,
      'would_cleanup'::TEXT as action
    FROM multiplayer_room_players mrp
    WHERE mrp.last_activity < inactive_cutoff 
       OR (mrp.is_connected = FALSE AND mrp.last_activity < inactive_cutoff)
    GROUP BY mrp.room_id;
  ELSE
    -- Actually clean up inactive players
    RETURN QUERY
    WITH deleted_players AS (
      DELETE FROM multiplayer_room_players
      WHERE last_activity < inactive_cutoff
         OR (is_connected = FALSE AND last_activity < inactive_cutoff)
      RETURNING room_id
    )
    SELECT 
      dp.room_id,
      COUNT(*)::INTEGER as player_count,
      'cleaned_up'::TEXT as action
    FROM deleted_players dp
    GROUP BY dp.room_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the cleanup function
COMMENT ON FUNCTION cleanup_inactive_players IS 'Clean up inactive players based on heartbeat activity. Use dry_run=true to preview changes.';

-- Grant necessary permissions (adjust as needed for your RLS setup)
-- These are example permissions - adjust based on your actual RLS policies
GRANT SELECT, UPDATE ON multiplayer_room_players TO authenticated;
GRANT SELECT, UPDATE ON multiplayer_room_players TO anon; 