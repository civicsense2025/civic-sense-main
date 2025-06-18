-- =============================================================================
-- TARGETED FIX FOR ROOM_ID AMBIGUITY
-- =============================================================================
-- Fixes the specific ambiguous room_id column reference

BEGIN;

-- =============================================================================
-- FIX ADD_NPC_TO_MULTIPLAYER_ROOM FUNCTION - ROOM_ID AMBIGUITY
-- =============================================================================

DROP FUNCTION IF EXISTS add_npc_to_multiplayer_room(VARCHAR(8), VARCHAR(20));

CREATE OR REPLACE FUNCTION add_npc_to_multiplayer_room(
  p_room_code VARCHAR(8),
  p_npc_code VARCHAR(20)
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  npc_player_id UUID,
  room_id UUID
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
  -- Find the room with explicit alias
  SELECT mr.id, mr.room_status, mr.current_players, mr.max_players
  INTO target_room_id, target_room_status, target_current_players, target_max_players
  FROM multiplayer_rooms mr
  WHERE mr.room_code = p_room_code;
  
  -- Check if room exists
  IF target_room_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Room not found'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if room is accepting players
  IF target_room_status != 'waiting' THEN
    RETURN QUERY SELECT FALSE, 'Room is not accepting new players'::TEXT, NULL::UUID, target_room_id;
    RETURN;
  END IF;
  
  -- Check if room is full
  IF target_current_players >= target_max_players THEN
    RETURN QUERY SELECT FALSE, 'Room is full'::TEXT, NULL::UUID, target_room_id;
    RETURN;
  END IF;
  
  -- Find the NPC personality with explicit alias
  SELECT np.id INTO npc_personality_id
  FROM npc_personalities np
  WHERE np.npc_code = p_npc_code AND np.is_active = true;
  
  IF npc_personality_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NPC not found'::TEXT, NULL::UUID, target_room_id;
    RETURN;
  END IF;
  
  -- Check if NPC is already in room with explicit aliases
  IF EXISTS (
    SELECT 1 
    FROM multiplayer_npc_players mnp
    JOIN multiplayer_room_players mrp ON mnp.player_id = mrp.id
    WHERE mnp.room_id = target_room_id AND mnp.npc_id = npc_personality_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'NPC already in room'::TEXT, NULL::UUID, target_room_id;
    RETURN;
  END IF;
  
  -- Calculate join order with explicit alias
  SELECT COALESCE(MAX(mrp.join_order), 0) + 1
  INTO new_join_order
  FROM multiplayer_room_players mrp
  WHERE mrp.room_id = target_room_id;
  
  -- Add NPC as a player with explicit column names
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
  RETURNING multiplayer_room_players.id INTO new_player_id;
  
  -- Create NPC player record with explicit column names
  INSERT INTO multiplayer_npc_players (
    room_id,
    npc_id,
    player_id
  ) VALUES (
    target_room_id,
    npc_personality_id,
    new_player_id
  ) RETURNING multiplayer_npc_players.id INTO new_npc_player_id;
  
  -- Update room player count with explicit alias
  UPDATE multiplayer_rooms mr
  SET current_players = mr.current_players + 1
  WHERE mr.id = target_room_id;
  
  -- Initialize conversation context if it doesn't exist
  INSERT INTO multiplayer_conversation_context (room_id)
  VALUES (target_room_id)
  ON CONFLICT (room_id) DO NOTHING;
  
  RETURN QUERY SELECT TRUE, 'NPC successfully added to room'::TEXT, new_npc_player_id, target_room_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FIX SEND_NPC_MESSAGE FUNCTION - POTENTIAL AMBIGUITY
-- =============================================================================

DROP FUNCTION IF EXISTS send_npc_message(UUID, UUID, TEXT, VARCHAR(20), VARCHAR(30), JSONB, VARCHAR(10), DECIMAL(3,2));

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
  -- Get NPC personality traits with explicit alias
  SELECT ARRAY[np.base_skill_level, np.personality_type] INTO npc_traits
  FROM npc_personalities np
  WHERE np.id = p_npc_id;
  
  -- Insert the message with explicit column names
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
  ) RETURNING multiplayer_chat_messages.id INTO new_message_id;
  
  -- Update NPC activity with explicit alias
  UPDATE multiplayer_npc_players mnp
  SET messages_sent = mnp.messages_sent + 1,
      educational_contributions = mnp.educational_contributions + CASE WHEN p_educational_value = 'high' THEN 1 ELSE 0 END,
      last_activity = NOW()
  WHERE mnp.room_id = p_room_id AND mnp.npc_id = p_npc_id;
  
  -- Update conversation context with explicit alias
  UPDATE multiplayer_conversation_context mcc
  SET last_message_at = NOW(),
      silence_duration_seconds = 0,
      total_messages = mcc.total_messages + 1,
      last_npc_intervention = CASE WHEN p_trigger_type IN ('conflict_resolution', 'encouragement') THEN NOW() ELSE mcc.last_npc_intervention END,
      updated_at = NOW()
  WHERE mcc.room_id = p_room_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FIX CHECK_SILENCE_INTERVENTION FUNCTION
-- =============================================================================

DROP FUNCTION IF EXISTS check_silence_intervention(UUID);

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
  -- Get conversation context with explicit alias
  SELECT mcc.* INTO context_record
  FROM multiplayer_conversation_context mcc
  WHERE mcc.room_id = p_room_id;
  
  -- Calculate silence duration
  silence_seconds := EXTRACT(EPOCH FROM (NOW() - context_record.last_message_at))::INTEGER;
  
  -- Check if intervention is needed (30+ seconds of silence)
  IF silence_seconds >= 30 AND (
    context_record.intervention_cooldown_until IS NULL OR 
    context_record.intervention_cooldown_until < NOW()
  ) THEN
    -- Find an available NPC with explicit aliases
    SELECT np.id INTO available_npc
    FROM npc_personalities np
    JOIN multiplayer_npc_players mnp ON np.id = mnp.npc_id
    WHERE mnp.room_id = p_room_id
      AND np.encouragement_style IN ('supportive', 'casual')
      AND np.chattiness_level >= 3
    ORDER BY np.chattiness_level DESC, RANDOM()
    LIMIT 1;
    
    IF available_npc IS NOT NULL THEN
      -- Update intervention cooldown with explicit alias
      UPDATE multiplayer_conversation_context mcc
      SET intervention_cooldown_until = NOW() + INTERVAL '2 minutes'
      WHERE mcc.room_id = p_room_id;
      
      RETURN QUERY SELECT TRUE, silence_seconds, available_npc, 'silence_break'::VARCHAR(30);
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT FALSE, silence_seconds, NULL::UUID, NULL::VARCHAR(30);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION add_npc_to_multiplayer_room TO authenticated;
GRANT EXECUTE ON FUNCTION send_npc_message TO authenticated;
GRANT EXECUTE ON FUNCTION check_silence_intervention TO authenticated;

COMMIT;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'Fixed room_id ambiguity by using explicit table aliases and column references'; 