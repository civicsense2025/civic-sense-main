-- =============================================================================
-- NPC CONVERSATION HISTORY MIGRATION
-- =============================================================================
-- Adds conversation history tracking for OpenAI-powered NPC interactions

BEGIN;

-- =============================================================================
-- NPC CONVERSATION HISTORY (OpenAI Integration)
-- =============================================================================

-- Store NPC conversation history for continuity and learning
CREATE TABLE IF NOT EXISTS npc_conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES npc_personalities(id) ON DELETE CASCADE,
  room_id UUID REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(255), -- Can be user_id or guest_token
  
  -- Message Content
  message TEXT NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- What caused this message
  response_to_user_id VARCHAR(255), -- If responding to specific user
  
  -- Context Data for OpenAI
  context_data JSONB, -- Quiz context, user mood, performance data
  openai_metadata JSONB, -- Temperature, model version, token usage
  
  -- Message Analytics
  tone VARCHAR(20), -- 'supportive', 'competitive', 'analytical', etc.
  educational_value VARCHAR(10), -- 'high', 'medium', 'low'
  personality_traits TEXT[], -- Which traits were emphasized
  
  -- Engagement Tracking
  user_reactions JSONB, -- Likes, responses, engagement metrics
  follow_up_generated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_npc_conversation_history_npc ON npc_conversation_history(npc_id, created_at);
CREATE INDEX IF NOT EXISTS idx_npc_conversation_history_room ON npc_conversation_history(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_npc_conversation_history_player ON npc_conversation_history(player_id, created_at);
CREATE INDEX IF NOT EXISTS idx_npc_conversation_history_trigger ON npc_conversation_history(trigger_type, created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on conversation history
ALTER TABLE npc_conversation_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view conversation history
CREATE POLICY "Users can view NPC conversations"
  ON npc_conversation_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow system to insert conversation history
CREATE POLICY "System can insert NPC conversations"
  ON npc_conversation_history FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- REALTIME PUBLICATION
-- =============================================================================

-- Enable realtime for NPC conversation tracking
ALTER PUBLICATION supabase_realtime ADD TABLE npc_conversation_history;

COMMIT;

-- Add helpful comments
COMMENT ON TABLE npc_conversation_history IS 'OpenAI-powered NPC conversation history for continuity and learning analytics'; 