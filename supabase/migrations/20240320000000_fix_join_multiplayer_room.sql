-- Drop existing function if it exists
DROP FUNCTION IF EXISTS join_multiplayer_room_v2;

-- Create new version of join_multiplayer_room that fixes ambiguous column references
CREATE OR REPLACE FUNCTION join_multiplayer_room_v2(
  p_room_code TEXT,
  p_player_name TEXT,
  p_player_emoji TEXT DEFAULT '😊',
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_room_id UUID;
  v_room_data JSONB;
  v_player_data JSONB;
  v_current_players INTEGER;
  v_max_players INTEGER;
  v_join_order INTEGER;
BEGIN
  -- Get room data
  SELECT 
    id,
    max_players,
    current_players,
    jsonb_build_object(
      'id', id,
      'room_code', room_code,
      'topic_id', topic_id,
      'room_name', room_name,
      'max_players', max_players,
      'current_players', current_players,
      'room_status', room_status,
      'game_mode', game_mode,
      'created_at', created_at
    ) INTO v_room_id, v_max_players, v_current_players, v_room_data
  FROM multiplayer_rooms mr
  WHERE mr.room_code = p_room_code
  AND mr.room_status IN ('waiting', 'starting');

  -- Check if room exists
  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND';
  END IF;

  -- Check if room is full
  IF v_current_players >= v_max_players THEN
    RAISE EXCEPTION 'ROOM_FULL';
  END IF;

  -- Get next join order
  SELECT COALESCE(MAX(join_order), 0) + 1 INTO v_join_order
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = v_room_id;

  -- Insert player
  WITH new_player AS (
    INSERT INTO multiplayer_room_players (
      room_id,
      user_id,
      guest_token,
      player_name,
      player_emoji,
      join_order,
      is_host,
      is_ready,
      is_connected,
      last_activity_at
    ) VALUES (
      v_room_id,
      p_user_id,
      p_guest_token,
      p_player_name,
      p_player_emoji,
      v_join_order,
      FALSE, -- Not host by default
      FALSE, -- Not ready by default
      TRUE,  -- Connected by default
      NOW()
    )
    RETURNING 
      id,
      room_id,
      user_id,
      guest_token,
      player_name,
      player_emoji,
      join_order,
      is_host,
      is_ready,
      is_connected,
      score,
      last_activity_at,
      created_at
  )
  SELECT jsonb_build_object(
    'id', id,
    'room_id', room_id,
    'user_id', user_id,
    'guest_token', guest_token,
    'player_name', player_name,
    'player_emoji', player_emoji,
    'join_order', join_order,
    'is_host', is_host,
    'is_ready', is_ready,
    'is_connected', is_connected,
    'score', score,
    'last_activity_at', last_activity_at,
    'created_at', created_at
  ) INTO v_player_data
  FROM new_player;

  -- Return combined data
  RETURN jsonb_build_object(
    'room', v_room_data,
    'player', v_player_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION join_multiplayer_room_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION join_multiplayer_room_v2 TO anon; 