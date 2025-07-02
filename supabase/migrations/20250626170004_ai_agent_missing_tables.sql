-- ============================================================================
-- COMPREHENSIVE AI AGENT SCHEMA CREATION
-- ============================================================================
-- Creates all missing tables and columns needed for the AI agent system
-- This includes tables referenced by seed data and conversational intelligence

BEGIN;

-- ============================================================================
-- CORE TABLES: Base schema and conversations
-- ============================================================================

-- Create the ai_agent schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ai_agent;

-- Base conversations table (in case it doesn't exist)
CREATE TABLE IF NOT EXISTS ai_agent.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(100) NOT NULL,
  agent_model VARCHAR(100) NOT NULL,
  conversation_state VARCHAR(50) DEFAULT 'active',
  conversation_mode VARCHAR(50) DEFAULT 'assistant',
  current_topic VARCHAR(200),
  conversation_summary TEXT,
  context_data JSONB DEFAULT '{}',
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
  next_suggested_actions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing context_data column if conversations table exists
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';

-- Base messages table (in case it doesn't exist)
CREATE TABLE IF NOT EXISTS ai_agent.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  model_used VARCHAR(100),
  message_type VARCHAR(50) DEFAULT 'text',
  intent_detected VARCHAR(100),
  confidence_score NUMERIC(3,2),
  requires_action BOOLEAN DEFAULT false,
  action_completed BOOLEAN DEFAULT false,
  related_messages UUID[],
  tool_calls JSONB DEFAULT '[]',
  tool_results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- LEARNING AND PATTERNS TABLES
-- ============================================================================

-- Learning patterns table for better AI adaptation
CREATE TABLE IF NOT EXISTS ai_agent.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(100) NOT NULL,
  pattern_category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB DEFAULT '[]',
  triggers JSONB DEFAULT '{}',
  outcomes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  model_version VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Memory clusters for organized knowledge storage
CREATE TABLE IF NOT EXISTS ai_agent.memory_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name VARCHAR(200) NOT NULL UNIQUE,
  cluster_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  related_patterns TEXT[] DEFAULT '{}',
  knowledge_items JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CONTENT GENERATION AND TRACKING
-- ============================================================================

-- Generated content tracking table
CREATE TABLE IF NOT EXISTS ai_agent.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type VARCHAR(100) NOT NULL,
  source_reference VARCHAR(200),
  prompt_template VARCHAR(200),
  generation_parameters JSONB DEFAULT '{}',
  generated_content JSONB NOT NULL,
  quality_scores JSONB DEFAULT '{}',
  human_review_status VARCHAR(50) DEFAULT 'pending',
  model_used VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  cost_estimate NUMERIC(10,4),
  processing_time_ms INTEGER,
  is_approved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS ai_agent.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(100) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(10,4) NOT NULL,
  benchmark_value NUMERIC(10,4),
  context JSONB DEFAULT '{}',
  model_version VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  measurement_timestamp TIMESTAMPTZ DEFAULT now(),
  is_baseline BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ANALYSIS AND INSIGHTS
-- ============================================================================

-- Conversation analysis for learning from interactions
CREATE TABLE IF NOT EXISTS ai_agent.conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  analysis_type VARCHAR(100) NOT NULL,
  analysis_results JSONB NOT NULL DEFAULT '{}',
  insights_generated TEXT[] DEFAULT '{}',
  improvement_suggestions TEXT[] DEFAULT '{}',
  analysis_timestamp TIMESTAMPTZ DEFAULT now(),
  confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB DEFAULT '{}',
  applied_improvements BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Learning sessions table for tracking improvement cycles
CREATE TABLE IF NOT EXISTS ai_agent.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type VARCHAR(100) NOT NULL,
  focus_area VARCHAR(100) NOT NULL,
  patterns_analyzed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,
  improvements_applied INTEGER DEFAULT 0,
  session_results JSONB DEFAULT '{}',
  effectiveness_score NUMERIC(3,2),
  model_versions TEXT[] DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  processing_time_minutes INTEGER,
  automated_session BOOLEAN DEFAULT true,
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session ON ai_agent.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_type ON ai_agent.conversations(agent_type);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON ai_agent.conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON ai_agent.conversations(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_agent.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON ai_agent.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created ON ai_agent.messages(created_at DESC);

-- Patterns indexes
CREATE INDEX IF NOT EXISTS idx_patterns_type_category ON ai_agent.patterns(pattern_type, pattern_category);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON ai_agent.patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON ai_agent.patterns(is_active, success_rate DESC);

-- Memory clusters indexes
CREATE INDEX IF NOT EXISTS idx_memory_clusters_type ON ai_agent.memory_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_usage ON ai_agent.memory_clusters(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_confidence ON ai_agent.memory_clusters(confidence_score DESC);

-- Generated content indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON ai_agent.generated_content(generation_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON ai_agent.generated_content(human_review_status);
CREATE INDEX IF NOT EXISTS idx_generated_content_created ON ai_agent.generated_content(created_at DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent ON ai_agent.performance_metrics(agent_type, metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON ai_agent.performance_metrics(measurement_timestamp DESC);

-- Analysis indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_conversation ON ai_agent.conversation_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_type ON ai_agent.conversation_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_timestamp ON ai_agent.conversation_analysis(analysis_timestamp DESC);

-- Learning sessions indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON ai_agent.learning_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_focus ON ai_agent.learning_sessions(focus_area);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_created ON ai_agent.learning_sessions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS for all tables
ALTER TABLE ai_agent.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.memory_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.learning_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================================================

-- Admin policies for conversations
CREATE POLICY "Admin full access on conversations" ON ai_agent.conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for messages
CREATE POLICY "Admin full access on messages" ON ai_agent.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for patterns
CREATE POLICY "Admin full access on patterns" ON ai_agent.patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for memory clusters
CREATE POLICY "Admin full access on memory_clusters" ON ai_agent.memory_clusters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for generated content
CREATE POLICY "Admin full access on generated_content" ON ai_agent.generated_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for performance metrics
CREATE POLICY "Admin full access on performance_metrics" ON ai_agent.performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for conversation analysis
CREATE POLICY "Admin full access on conversation_analysis" ON ai_agent.conversation_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for learning sessions
CREATE POLICY "Admin full access on learning_sessions" ON ai_agent.learning_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create a new conversation with proper defaults
CREATE OR REPLACE FUNCTION ai_agent.create_conversation(
  p_session_id VARCHAR,
  p_agent_type VARCHAR,
  p_agent_model VARCHAR,
  p_context_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO ai_agent.conversations (
    session_id,
    agent_type,
    agent_model,
    context_data,
    conversation_state,
    conversation_mode
  ) VALUES (
    p_session_id,
    p_agent_type,
    p_agent_model,
    p_context_data,
    'active',
    'assistant'
  ) RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION ai_agent.add_message(
  p_conversation_id UUID,
  p_role VARCHAR,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_tokens_used INTEGER DEFAULT NULL,
  p_model_used VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO ai_agent.messages (
    conversation_id,
    role,
    content,
    metadata,
    tokens_used,
    model_used
  ) VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_metadata,
    p_tokens_used,
    p_model_used
  ) RETURNING id INTO v_message_id;
  
  -- Update conversation updated_at
  UPDATE ai_agent.conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation context
CREATE OR REPLACE FUNCTION ai_agent.update_conversation_context(
  p_conversation_id UUID,
  p_context_data JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ai_agent.conversations
  SET 
    context_data = p_context_data,
    updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 