-- ============================================================================
-- FIX AI AGENT SCHEMA BASED ON ACTUAL DATABASE STRUCTURE
-- ============================================================================
-- This migration adds ONLY missing columns to existing ai_agent tables
-- Based on actual schema from database.types.ts

BEGIN;

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING AI_AGENT TABLES
-- ============================================================================

-- conversations table - add missing columns if they don't exist
-- (Note: Based on database.types.ts, conversations already has most columns we need)

-- Check if we need additional columns for enhanced functionality
-- Add conversation state management
DO $$ 
BEGIN 
  -- Add conversation_state if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'conversations' 
    AND column_name = 'conversation_state'
  ) THEN
    ALTER TABLE ai_agent.conversations ADD COLUMN conversation_state VARCHAR(50) DEFAULT 'active';
  END IF;
  
  -- Add current_topic if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'conversations' 
    AND column_name = 'current_topic'
  ) THEN
    ALTER TABLE ai_agent.conversations ADD COLUMN current_topic VARCHAR(200);
  END IF;
  
  -- Add conversation_mode if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'conversations' 
    AND column_name = 'conversation_mode'
  ) THEN
    ALTER TABLE ai_agent.conversations ADD COLUMN conversation_mode VARCHAR(50) DEFAULT 'assistant';
  END IF;
  
  -- Add user_satisfaction_score if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'conversations' 
    AND column_name = 'user_satisfaction_score'
  ) THEN
    ALTER TABLE ai_agent.conversations ADD COLUMN user_satisfaction_score INTEGER 
    CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5);
  END IF;
  
  -- Add conversation_summary if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'conversations' 
    AND column_name = 'conversation_summary'
  ) THEN
    ALTER TABLE ai_agent.conversations ADD COLUMN conversation_summary TEXT;
  END IF;
  
  -- Add context_data if it doesn't exist (note: conversation_context already exists)
  -- We'll use the existing conversation_context column instead of adding context_data
  
END $$;

-- ============================================================================
-- ADD MISSING COLUMNS TO MESSAGES TABLE
-- ============================================================================

DO $$ 
BEGIN 
  -- Add message_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'messages' 
    AND column_name = 'message_type'
  ) THEN
    ALTER TABLE ai_agent.messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'user_message';
  END IF;
  
  -- Add processing_time_ms if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'messages' 
    AND column_name = 'processing_time_ms'
  ) THEN
    ALTER TABLE ai_agent.messages ADD COLUMN processing_time_ms INTEGER;
  END IF;
  
  -- Add error_details if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'messages' 
    AND column_name = 'error_details'
  ) THEN
    ALTER TABLE ai_agent.messages ADD COLUMN error_details JSONB;
  END IF;
  
  -- Add parent_message_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'messages' 
    AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE ai_agent.messages ADD COLUMN parent_message_id UUID 
    REFERENCES ai_agent.messages(id) ON DELETE SET NULL;
  END IF;
  
END $$;

-- ============================================================================
-- ADD MISSING COLUMNS TO GENERATED_CONTENT TABLE
-- ============================================================================

DO $$ 
BEGIN 
  -- Add content_category if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'generated_content' 
    AND column_name = 'content_category'
  ) THEN
    ALTER TABLE ai_agent.generated_content ADD COLUMN content_category VARCHAR(100);
  END IF;
  
  -- Add approval_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'ai_agent' 
    AND table_name = 'generated_content' 
    AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE ai_agent.generated_content ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
END $$;

-- ============================================================================
-- CREATE MISSING TABLES THAT DON'T EXIST IN DATABASE.TYPES.TS
-- ============================================================================

-- Drop and recreate conversation_analytics table with correct structure
-- (The old table from 20250101000001 has incompatible schema)
DROP TABLE IF EXISTS ai_agent.conversation_analytics CASCADE;

CREATE TABLE ai_agent.conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  conversation_duration_seconds INTEGER DEFAULT 0,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  resolution_status VARCHAR(50) DEFAULT 'unresolved',
  topics_covered TEXT[],
  conversation_outcome VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_metrics table if it doesn't exist (for system health monitoring)
CREATE TABLE IF NOT EXISTS ai_agent.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(50),
  component VARCHAR(100) NOT NULL,
  metric_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD USEFUL INDEXES
-- ============================================================================

-- Index for conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_session_id 
ON ai_agent.conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_conversations_agent_type 
ON ai_agent.conversations(agent_type);

-- Index for message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON ai_agent.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_role 
ON ai_agent.messages(role);

-- Index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent_type_date 
ON ai_agent.performance_metrics(agent_type, metric_date);

-- ============================================================================
-- UPDATE RLS POLICIES (if needed)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ai_agent.conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.system_metrics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for conversation_analytics
CREATE POLICY "conversation_analytics_read" ON ai_agent.conversation_analytics
  FOR SELECT USING (true); -- Allow reading for now, tighten later

CREATE POLICY "conversation_analytics_insert" ON ai_agent.conversation_analytics
  FOR INSERT WITH CHECK (true); -- Allow inserting for now, tighten later

-- Basic RLS policies for system_metrics
CREATE POLICY "system_metrics_read" ON ai_agent.system_metrics
  FOR SELECT USING (true); -- Allow reading for now, tighten later

CREATE POLICY "system_metrics_insert" ON ai_agent.system_metrics
  FOR INSERT WITH CHECK (true); -- Allow inserting for now, tighten later

COMMIT; 