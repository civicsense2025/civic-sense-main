-- =============================================================================
-- MULTIPLAYER NPC INTEGRATION MIGRATION
-- =============================================================================
-- Integrates the NPC conversation system with multiplayer rooms

BEGIN;

-- =============================================================================
-- MULTIPLAYER CHAT SYSTEM
-- =============================================================================

-- Chat messages in multiplayer rooms (including NPC messages)
CREATE TABLE IF NOT EXISTS multiplayer_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES multiplayer_room_players(id) ON DELETE SET NULL,
  npc_id UUID REFERENCES npc_personalities(id) ON DELETE SET NULL,
  
  message_content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'npc_reaction', 'npc_teaching', 'npc_encouragement')),
  
  -- NPC-specific metadata
  npc_personality_traits TEXT[], -- Which traits influenced this message
  educational_value VARCHAR(10) CHECK (educational_value IN ('high', 'medium', 'low')),
  confidence_score DECIMAL(3,2), -- NPC's confidence in this message (0-1)
  
  -- Context that triggered this message
  trigger_type VARCHAR(30), -- 'on_join', 'on_correct', 'on_incorrect', 'silence_break', etc.
  trigger_context JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure either player or NPC sent the message, not both
  CHECK ((player_id IS NOT NULL AND npc_id IS NULL) OR (player_id IS NULL AND npc_id IS NOT NULL))
);

-- =============================================================================
-- NPC MULTIPLAYER PARTICIPATION
-- =============================================================================

-- Track NPCs as special players in multiplayer rooms
CREATE TABLE IF NOT EXISTS multiplayer_npc_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES multiplayer_room_players(id) ON DELETE CASCADE,
  
  -- NPC behavior settings for this room
  conversation_frequency DECIMAL(3,2) NOT NULL DEFAULT 0.3, -- How often to participate (0-1)
  teaching_mode BOOLEAN NOT NULL DEFAULT true, -- Whether to provide educational content
  conflict_resolution_active BOOLEAN NOT NULL DEFAULT true, -- Whether to help resolve conflicts
  
  -- Performance tracking
  messages_sent INTEGER NOT NULL DEFAULT 0,
  educational_contributions INTEGER NOT NULL DEFAULT 0,
  conflict_interventions INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(room_id, npc_id)
);

-- =============================================================================
-- CONVERSATION INTELLIGENCE TRACKING
-- =============================================================================

-- Track conversation context for intelligent NPC responses
CREATE TABLE IF NOT EXISTS multiplayer_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  
  -- Conversation state
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  silence_duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  
  -- Mood and engagement tracking
  room_mood VARCHAR(20) DEFAULT 'neutral' CHECK (room_mood IN ('positive', 'neutral', 'tense', 'confused', 'frustrated')),
  engagement_level VARCHAR(20) DEFAULT 'medium' CHECK (engagement_level IN ('high', 'medium', 'low')),
  conflict_detected BOOLEAN NOT NULL DEFAULT false,
  
  -- Learning context
  current_topic_difficulty VARCHAR(20),
  struggling_players TEXT[], -- Player IDs who seem to be struggling
  dominant_players TEXT[], -- Player IDs who are dominating conversation
  
  -- NPC intervention tracking
  last_npc_intervention TIMESTAMPTZ,
  intervention_cooldown_until TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(room_id)
);

-- =============================================================================
-- ENHANCED ROOM FUNCTIONS
-- =============================================================================

-- Function to add NPC to multiplayer room
CREATE OR REPLACE FUNCTION add_npc_to_multiplayer_room(
  p_room_code VARCHAR(8),
  p_npc_code VARCHAR(20)
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  npc_player_id UUID
) AS $$
DECLARE
  target_room_id UUID;
  target_room_status VARCHAR(20);
  target_current_players INTEGER;
  target_max_players INTEGER;
  npc_personality_id UUID;
  new_player_id UUID;
  new_npc_player_id UUID;
  new_join_order INTEGER;
BEGIN
  -- Find the room
  SELECT id, room_status, current_players, max_players
  INTO target_room_id, target_room_status, target_current_players, target_max_players
  FROM multiplayer_rooms
  WHERE room_code = p_room_code;
  
  -- Check if room exists
  IF target_room_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Room not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if room is accepting players
  IF target_room_status != 'waiting' THEN
    RETURN QUERY SELECT FALSE, 'Room is not accepting new players', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if room is full
  IF target_current_players >= target_max_players THEN
    RETURN QUERY SELECT FALSE, 'Room is full', NULL::UUID;
    RETURN;
  END IF;
  
  -- Find the NPC personality
  SELECT id INTO npc_personality_id
  FROM npc_personalities
  WHERE npc_code = p_npc_code AND is_active = true;
  
  IF npc_personality_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NPC not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if NPC is already in room
  IF EXISTS (
    SELECT 1 FROM multiplayer_npc_players mnp
    JOIN multiplayer_room_players mrp ON mnp.player_id = mrp.id
    WHERE mnp.room_id = target_room_id AND mnp.npc_id = npc_personality_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'NPC already in room', NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate join order
  SELECT COALESCE(MAX(join_order), 0) + 1
  INTO new_join_order
  FROM multiplayer_room_players
  WHERE room_id = target_room_id;
  
  -- Add NPC as a player
  INSERT INTO multiplayer_room_players (
    room_id,
    guest_token,
    player_name,
    player_emoji,
    join_order,
    is_host
  )
  SELECT 
    target_room_id,
    'npc_' || p_npc_code,
    np.display_name,
    np.emoji,
    new_join_order,
    FALSE
  FROM npc_personalities np
  WHERE np.id = npc_personality_id
  RETURNING id INTO new_player_id;
  
  -- Create NPC player record
  INSERT INTO multiplayer_npc_players (
    room_id,
    npc_id,
    player_id
  ) VALUES (
    target_room_id,
    npc_personality_id,
    new_player_id
  ) RETURNING id INTO new_npc_player_id;
  
  -- Update room player count
  UPDATE multiplayer_rooms
  SET current_players = current_players + 1
  WHERE id = target_room_id;
  
  -- Initialize conversation context if it doesn't exist
  INSERT INTO multiplayer_conversation_context (room_id)
  VALUES (target_room_id)
  ON CONFLICT (room_id) DO NOTHING;
  
  RETURN QUERY SELECT TRUE, 'NPC successfully added to room', new_npc_player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send NPC message
CREATE OR REPLACE FUNCTION send_npc_message(
  p_room_id UUID,
  p_npc_id UUID,
  p_message_content TEXT,
  p_message_type VARCHAR(20) DEFAULT 'chat',
  p_trigger_type VARCHAR(30) DEFAULT NULL,
  p_trigger_context JSONB DEFAULT '{}'::JSONB,
  p_educational_value VARCHAR(10) DEFAULT 'medium',
  p_confidence_score DECIMAL(3,2) DEFAULT 0.8
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
  npc_traits TEXT[];
BEGIN
  -- Get NPC personality traits
  SELECT ARRAY[base_skill_level, personality_type] INTO npc_traits
  FROM npc_personalities
  WHERE id = p_npc_id;
  
  -- Insert the message
  INSERT INTO multiplayer_chat_messages (
    room_id,
    npc_id,
    message_content,
    message_type,
    npc_personality_traits,
    educational_value,
    confidence_score,
    trigger_type,
    trigger_context
  ) VALUES (
    p_room_id,
    p_npc_id,
    p_message_content,
    p_message_type,
    npc_traits,
    p_educational_value,
    p_confidence_score,
    p_trigger_type,
    p_trigger_context
  ) RETURNING id INTO new_message_id;
  
  -- Update NPC activity
  UPDATE multiplayer_npc_players
  SET messages_sent = messages_sent + 1,
      educational_contributions = educational_contributions + CASE WHEN p_educational_value = 'high' THEN 1 ELSE 0 END,
      last_activity = NOW()
  WHERE room_id = p_room_id AND npc_id = p_npc_id;
  
  -- Update conversation context
  UPDATE multiplayer_conversation_context
  SET last_message_at = NOW(),
      silence_duration_seconds = 0,
      total_messages = total_messages + 1,
      last_npc_intervention = CASE WHEN p_trigger_type IN ('conflict_resolution', 'encouragement') THEN NOW() ELSE last_npc_intervention END,
      updated_at = NOW()
  WHERE room_id = p_room_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation context
CREATE OR REPLACE FUNCTION update_conversation_context(
  p_room_id UUID,
  p_player_message BOOLEAN DEFAULT TRUE,
  p_mood VARCHAR(20) DEFAULT NULL,
  p_conflict_detected BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO multiplayer_conversation_context (
    room_id,
    last_message_at,
    total_messages,
    room_mood,
    conflict_detected
  ) VALUES (
    p_room_id,
    NOW(),
    1,
    COALESCE(p_mood, 'neutral'),
    COALESCE(p_conflict_detected, false)
  )
  ON CONFLICT (room_id) DO UPDATE SET
    last_message_at = NOW(),
    silence_duration_seconds = 0,
    total_messages = multiplayer_conversation_context.total_messages + 1,
    room_mood = COALESCE(p_mood, multiplayer_conversation_context.room_mood),
    conflict_detected = COALESCE(p_conflict_detected, multiplayer_conversation_context.conflict_detected),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check for silence and trigger NPC intervention
CREATE OR REPLACE FUNCTION check_silence_intervention(p_room_id UUID)
RETURNS TABLE(
  should_intervene BOOLEAN,
  silence_duration INTEGER,
  suggested_npc_id UUID,
  intervention_type VARCHAR(30)
) AS $$
DECLARE
  context_record RECORD;
  silence_seconds INTEGER;
  available_npc UUID;
BEGIN
  -- Get conversation context
  SELECT * INTO context_record
  FROM multiplayer_conversation_context
  WHERE room_id = p_room_id;
  
  -- Calculate silence duration
  silence_seconds := EXTRACT(EPOCH FROM (NOW() - context_record.last_message_at))::INTEGER;
  
  -- Check if intervention is needed (30+ seconds of silence)
  IF silence_seconds >= 30 AND (
    context_record.intervention_cooldown_until IS NULL OR 
    context_record.intervention_cooldown_until < NOW()
  ) THEN
    -- Find an available NPC (prioritize encouraging personalities for silence breaking)
    SELECT np.id INTO available_npc
    FROM npc_personalities np
    JOIN multiplayer_npc_players mnp ON np.id = mnp.npc_id
    WHERE mnp.room_id = p_room_id
      AND np.encouragement_style IN ('supportive', 'casual')
      AND np.chattiness_level >= 3
    ORDER BY np.chattiness_level DESC, RANDOM()
    LIMIT 1;
    
    IF available_npc IS NOT NULL THEN
      -- Update intervention cooldown (2 minutes)
      UPDATE multiplayer_conversation_context
      SET intervention_cooldown_until = NOW() + INTERVAL '2 minutes'
      WHERE room_id = p_room_id;
      
      RETURN QUERY SELECT TRUE, silence_seconds, available_npc, 'silence_break'::VARCHAR(30);
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT FALSE, silence_seconds, NULL::UUID, NULL::VARCHAR(30);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_room ON multiplayer_chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_npc ON multiplayer_chat_messages(npc_id, created_at);
CREATE INDEX IF NOT EXISTS idx_multiplayer_chat_messages_type ON multiplayer_chat_messages(message_type, educational_value);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_room ON multiplayer_npc_players(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_npc_players_npc ON multiplayer_npc_players(npc_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_conversation_context_room ON multiplayer_conversation_context(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_conversation_context_mood ON multiplayer_conversation_context(room_mood, engagement_level);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE multiplayer_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_npc_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multiplayer_chat_messages
CREATE POLICY "Players can view messages in their rooms"
  ON multiplayer_chat_messages FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can send messages in their rooms"
  ON multiplayer_chat_messages FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for multiplayer_npc_players
CREATE POLICY "Players can view NPCs in their rooms"
  ON multiplayer_npc_players FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for multiplayer_conversation_context
CREATE POLICY "Players can view conversation context in their rooms"
  ON multiplayer_conversation_context FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM multiplayer_room_players 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- REALTIME PUBLICATION
-- =============================================================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_npc_players;
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_conversation_context;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC CONTEXT UPDATES
-- =============================================================================

-- Trigger to update silence duration periodically
CREATE OR REPLACE FUNCTION update_silence_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Update silence duration for all active rooms
  UPDATE multiplayer_conversation_context
  SET silence_duration_seconds = EXTRACT(EPOCH FROM (NOW() - last_message_at))::INTEGER,
      updated_at = NOW()
  WHERE room_id IN (
    SELECT id FROM multiplayer_rooms 
    WHERE room_status IN ('waiting', 'in_progress')
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs every minute to update silence duration
-- Note: In production, this would be better handled by a cron job or background task

COMMIT;

-- Add helpful comments
COMMENT ON TABLE multiplayer_chat_messages IS 'Chat messages in multiplayer rooms including NPC contributions';
COMMENT ON TABLE multiplayer_npc_players IS 'NPCs participating in multiplayer rooms with behavior settings';
COMMENT ON TABLE multiplayer_conversation_context IS 'Real-time conversation context for intelligent NPC responses';
COMMENT ON FUNCTION add_npc_to_multiplayer_room IS 'Adds an NPC to a multiplayer room as a special player';
COMMENT ON FUNCTION send_npc_message IS 'Sends a message from an NPC with educational metadata';
COMMENT ON FUNCTION check_silence_intervention IS 'Checks if NPCs should intervene due to silence or other triggers'; 