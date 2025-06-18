-- =============================================================================
-- MULTIPLAYER QUIZ SYSTEM MIGRATION
-- =============================================================================
-- Creates tables and functions for real-time multiplayer quiz functionality

BEGIN;

-- =============================================================================
-- MULTIPLAYER ROOM TABLES
-- =============================================================================

-- Main multiplayer rooms table
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL, -- Short alphanumeric code for joining
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic_id VARCHAR(255) NOT NULL,
  room_name VARCHAR(100),
  max_players INTEGER NOT NULL DEFAULT 6,
  current_players INTEGER NOT NULL DEFAULT 0,
  room_status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (room_status IN ('waiting', 'starting', 'in_progress', 'completed', 'cancelled')),
  game_mode VARCHAR(20) NOT NULL DEFAULT 'classic' CHECK (game_mode IN ('classic', 'speed_round', 'elimination', 'team_battle')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours')
);

-- Players in multiplayer rooms
CREATE TABLE IF NOT EXISTS multiplayer_room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token VARCHAR(255), -- For guest players
  player_name VARCHAR(50) NOT NULL,
  player_emoji VARCHAR(10) NOT NULL DEFAULT '😊',
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_connected BOOLEAN NOT NULL DEFAULT TRUE,
  join_order INTEGER NOT NULL,
  boost_inventory JSONB DEFAULT '{}', -- Available boosts for this session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, guest_token),
  CHECK ((user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL))
);

-- Individual quiz attempts within multiplayer sessions
CREATE TABLE IF NOT EXISTS multiplayer_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES multiplayer_room_players(id) ON DELETE CASCADE,
  topic_id VARCHAR(255) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE(room_id, player_id)
);

-- Real-time question responses in multiplayer
CREATE TABLE IF NOT EXISTS multiplayer_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES multiplayer_room_players(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES multiplayer_quiz_attempts(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER NOT NULL,
  bonus_applied VARCHAR(50), -- Type of bonus if any
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(attempt_id, question_number)
);

-- Real-time game events (for synchronized gameplay)
CREATE TABLE IF NOT EXISTS multiplayer_game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'question_start', 'question_end', 'player_answer', 'boost_used', etc.
  event_data JSONB NOT NULL DEFAULT '{}',
  triggered_by UUID REFERENCES multiplayer_room_players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code ON multiplayer_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON multiplayer_rooms(room_status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_expires ON multiplayer_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_room ON multiplayer_room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_room_players_user ON multiplayer_room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_attempts_room ON multiplayer_quiz_attempts(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_room ON multiplayer_question_responses(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_question_responses_attempt ON multiplayer_question_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_room ON multiplayer_game_events(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_game_events_created ON multiplayer_game_events(created_at);

-- =============================================================================
-- ROOM CODE GENERATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  code VARCHAR(8);
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase letters and numbers)
    code := UPPER(
      SUBSTRING(
        REPLACE(
          REPLACE(
            REPLACE(gen_random_uuid()::text, '-', ''),
            'a', 'A'
          ),
          'b', 'B'
        ),
        1, 8
      )
    );
    
    -- Make it more readable by avoiding confusing characters
    code := REPLACE(code, '0', '2');
    code := REPLACE(code, 'O', '3');
    code := REPLACE(code, 'I', '4');
    code := REPLACE(code, '1', '5');
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM multiplayer_rooms WHERE room_code = code) THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique room code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROOM MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to create a new multiplayer room
CREATE OR REPLACE FUNCTION create_multiplayer_room(
  p_host_user_id UUID,
  p_topic_id VARCHAR(255),
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
  
  -- Create the room
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
    p_host_user_id,
    p_topic_id,
    p_room_name,
    p_max_players,
    p_game_mode,
    0
  ) RETURNING id, created_at INTO new_room_id, new_created_at;
  
  RETURN QUERY SELECT new_room_id, new_room_code, new_created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to join a multiplayer room
CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_code VARCHAR(8),
  p_player_name VARCHAR(50),
  p_user_id UUID DEFAULT NULL,
  p_guest_token VARCHAR(255) DEFAULT NULL,
  p_player_emoji VARCHAR(10) DEFAULT '😊'
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  room_id UUID,
  player_id UUID,
  join_order INTEGER
) AS $$
DECLARE
  target_room_id UUID;
  target_max_players INTEGER;
  target_current_players INTEGER;
  target_status VARCHAR(20);
  new_player_id UUID;
  new_join_order INTEGER;
BEGIN
  -- Find the room
  SELECT id, max_players, current_players, room_status
  INTO target_room_id, target_max_players, target_current_players, target_status
  FROM multiplayer_rooms
  WHERE room_code = p_room_code;
  
  -- Check if room exists
  IF target_room_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Room not found', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if room is in waiting state
  IF target_status != 'waiting' THEN
    RETURN QUERY SELECT FALSE, 'Room is not accepting new players', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if room is full
  IF target_current_players >= target_max_players THEN
    RETURN QUERY SELECT FALSE, 'Room is full', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if player is already in room
  IF EXISTS (
    SELECT 1 FROM multiplayer_room_players 
    WHERE room_id = target_room_id 
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_guest_token IS NOT NULL AND guest_token = p_guest_token)
    )
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already in this room', NULL::UUID, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Calculate join order
  SELECT COALESCE(MAX(join_order), 0) + 1
  INTO new_join_order
  FROM multiplayer_room_players
  WHERE room_id = target_room_id;
  
  -- Add player to room
  INSERT INTO multiplayer_room_players (
    room_id,
    user_id,
    guest_token,
    player_name,
    player_emoji,
    join_order,
    is_host
  ) VALUES (
    target_room_id,
    p_user_id,
    p_guest_token,
    p_player_name,
    p_player_emoji,
    new_join_order,
    FALSE
  ) RETURNING id INTO new_player_id;
  
  -- Update room player count
  UPDATE multiplayer_rooms
  SET current_players = current_players + 1
  WHERE id = target_room_id;
  
  RETURN QUERY SELECT TRUE, 'Successfully joined room', target_room_id, new_player_id, new_join_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update player ready status
CREATE OR REPLACE FUNCTION update_player_ready_status(
  p_room_id UUID,
  p_player_id UUID,
  p_is_ready BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE multiplayer_room_players
  SET is_ready = p_is_ready,
      last_activity = NOW()
  WHERE room_id = p_room_id AND id = p_player_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all players are ready
CREATE OR REPLACE FUNCTION check_all_players_ready(p_room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_players INTEGER;
  ready_players INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_players
  FROM multiplayer_room_players
  WHERE room_id = p_room_id AND is_connected = TRUE;
  
  SELECT COUNT(*) INTO ready_players
  FROM multiplayer_room_players
  WHERE room_id = p_room_id AND is_connected = TRUE AND is_ready = TRUE;
  
  RETURN total_players > 1 AND total_players = ready_players;
END;
$$ LANGUAGE plpgsql;

-- Function to start a multiplayer game
CREATE OR REPLACE FUNCTION start_multiplayer_game(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all players are ready
  IF NOT check_all_players_ready(p_room_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Update room status
  UPDATE multiplayer_rooms
  SET room_status = 'in_progress',
      started_at = NOW()
  WHERE id = p_room_id;
  
  -- Create quiz attempts for all players
  INSERT INTO multiplayer_quiz_attempts (
    room_id,
    player_id,
    topic_id,
    total_questions
  )
  SELECT 
    p_room_id,
    mrp.id,
    mr.topic_id,
    10 -- Default question count, can be made configurable
  FROM multiplayer_room_players mrp
  JOIN multiplayer_rooms mr ON mr.id = p_room_id
  WHERE mrp.room_id = p_room_id AND mrp.is_connected = TRUE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP FUNCTIONS
-- =============================================================================

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM multiplayer_rooms
  WHERE expires_at < NOW()
  OR (room_status = 'waiting' AND created_at < NOW() - INTERVAL '2 hours')
  OR (room_status = 'completed' AND completed_at < NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_game_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multiplayer_rooms
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

DROP POLICY IF EXISTS "Users can create rooms" ON multiplayer_rooms;
CREATE POLICY "Users can create rooms"
  ON multiplayer_rooms FOR INSERT
  WITH CHECK (host_user_id = auth.uid() OR host_user_id IS NULL);

DROP POLICY IF EXISTS "Hosts can update their rooms" ON multiplayer_rooms;
CREATE POLICY "Hosts can update their rooms"
  ON multiplayer_rooms FOR UPDATE
  USING (host_user_id = auth.uid() OR host_user_id IS NULL);

-- RLS Policies for multiplayer_room_players
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

DROP POLICY IF EXISTS "Users can join rooms" ON multiplayer_room_players;
CREATE POLICY "Users can join rooms"
  ON multiplayer_room_players FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Players can update their own data" ON multiplayer_room_players;
CREATE POLICY "Players can update their own data"
  ON multiplayer_room_players FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for multiplayer_quiz_attempts
CREATE POLICY "Players can view attempts in their rooms"
  ON multiplayer_quiz_attempts FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own attempts"
  ON multiplayer_quiz_attempts FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can update their own attempts"
  ON multiplayer_quiz_attempts FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for multiplayer_question_responses
CREATE POLICY "Players can view responses in their rooms"
  ON multiplayer_question_responses FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own responses"
  ON multiplayer_question_responses FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for multiplayer_game_events
CREATE POLICY "Players can view events in their rooms"
  ON multiplayer_game_events FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create events in their rooms"
  ON multiplayer_game_events FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- REALTIME PUBLICATION
-- =============================================================================

-- Enable realtime for multiplayer tables
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_question_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_game_events;

COMMIT;

-- Add helpful comment
COMMENT ON TABLE multiplayer_rooms IS 'Stores multiplayer quiz room information and settings';
COMMENT ON TABLE multiplayer_room_players IS 'Tracks players in each multiplayer room with their status and preferences';
COMMENT ON TABLE multiplayer_quiz_attempts IS 'Individual quiz attempts within multiplayer sessions';
COMMENT ON TABLE multiplayer_question_responses IS 'Real-time question responses from players in multiplayer games';
COMMENT ON TABLE multiplayer_game_events IS 'Real-time game events for synchronized multiplayer gameplay'; 