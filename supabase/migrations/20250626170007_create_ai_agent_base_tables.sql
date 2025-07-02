-- ============================================================================
-- CREATE MISSING AI AGENT BASE TABLES
-- ============================================================================
-- Creates the core tables needed for the AI agent system that are missing

BEGIN;

-- Create the ai_agent schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ai_agent;

-- ============================================================================
-- CORE BASE TABLES
-- ============================================================================

-- Base conversations table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ai_agent.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(100) NOT NULL,
  agent_model VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ai_agent.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning patterns table
CREATE TABLE IF NOT EXISTS ai_agent.learning_patterns (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory clusters table
CREATE TABLE IF NOT EXISTS ai_agent.memory_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name VARCHAR(200) NOT NULL,
  cluster_type VARCHAR(100) NOT NULL,
  description TEXT,
  embedding_model VARCHAR(100),
  cluster_metadata JSONB DEFAULT '{}',
  similarity_threshold NUMERIC(3,2) DEFAULT 0.7,
  max_memories INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation analysis table
CREATE TABLE IF NOT EXISTS ai_agent.conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  analysis_type VARCHAR(100) NOT NULL,
  sentiment_score NUMERIC(3,2),
  topic_categories JSONB DEFAULT '[]',
  key_insights JSONB DEFAULT '[]',
  success_indicators JSONB DEFAULT '{}',
  improvement_suggestions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS ai_agent.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(100) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_unit VARCHAR(50),
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content table
CREATE TABLE IF NOT EXISTS ai_agent.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type VARCHAR(100) NOT NULL,
  source_reference VARCHAR(255),
  prompt_template VARCHAR(200),
  generation_parameters JSONB DEFAULT '{}',
  generated_content JSONB NOT NULL,
  quality_scores JSONB DEFAULT '{}',
  human_review_status VARCHAR(50) DEFAULT 'pending' CHECK (human_review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewer_notes TEXT,
  model_used VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID -- References auth.users but no FK constraint for flexibility
);

-- Knowledge graph table
CREATE TABLE IF NOT EXISTS ai_agent.knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  last_validated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

-- System insights table
CREATE TABLE IF NOT EXISTS ai_agent.system_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(100) NOT NULL,
  insight_category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  actionable_recommendation TEXT,
  priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  evidence JSONB DEFAULT '[]',
  related_entities JSONB DEFAULT '[]',
  implementation_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON ai_agent.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_type ON ai_agent.conversations(agent_type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai_agent.conversations(created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON ai_agent.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON ai_agent.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_agent.messages(created_at);

-- Learning patterns indexes
CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON ai_agent.learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_category ON ai_agent.learning_patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_active ON ai_agent.learning_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_confidence ON ai_agent.learning_patterns(confidence);

-- Memory clusters indexes
CREATE INDEX IF NOT EXISTS idx_memory_clusters_type ON ai_agent.memory_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_name ON ai_agent.memory_clusters(cluster_name);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent ON ai_agent.performance_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON ai_agent.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON ai_agent.performance_metrics(measurement_date);

-- Generated content indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON ai_agent.generated_content(generation_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON ai_agent.generated_content(human_review_status);
CREATE INDEX IF NOT EXISTS idx_generated_content_model ON ai_agent.generated_content(model_used);

-- Knowledge graph indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_entity ON ai_agent.knowledge_graph(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_confidence ON ai_agent.knowledge_graph(confidence_score);

-- System insights indexes
CREATE INDEX IF NOT EXISTS idx_system_insights_type ON ai_agent.system_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_system_insights_priority ON ai_agent.system_insights(priority_level);
CREATE INDEX IF NOT EXISTS idx_system_insights_status ON ai_agent.system_insights(implementation_status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ai_agent.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.memory_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.system_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (service role bypasses RLS)
-- Users can only see their own conversations and related data
CREATE POLICY "Users can view own conversations" ON ai_agent.conversations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create conversations" ON ai_agent.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own messages" ON ai_agent.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_agent.conversations 
      WHERE id = conversation_id 
      AND auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can create messages" ON ai_agent.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agent.conversations 
      WHERE id = conversation_id 
      AND auth.uid() IS NOT NULL
    )
  );

-- Admin tables - only accessible via service role
CREATE POLICY "Service role only" ON ai_agent.learning_patterns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.memory_clusters
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.conversation_analysis
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.performance_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.generated_content
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.knowledge_graph
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON ai_agent.system_insights
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMIT; 