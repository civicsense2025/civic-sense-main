-- AI Agent Learning & Memory Schema
-- Enables AI agents to learn from database context and maintain persistent memory

-- Create ai_agent schema
CREATE SCHEMA IF NOT EXISTS ai_agent;

-- AI agent conversations and interactions
CREATE TABLE IF NOT EXISTS ai_agent.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  agent_type VARCHAR(50) NOT NULL, -- e.g., 'content_generator', 'research_assistant', 'gap_analyzer'
  agent_model VARCHAR(100), -- e.g., 'gpt-4', 'claude-3', 'local_llm'
  conversation_context JSONB NOT NULL DEFAULT '{}',
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for conversations
CREATE INDEX idx_conversations_user_id ON ai_agent.conversations(user_id);
CREATE INDEX idx_conversations_agent_type ON ai_agent.conversations(agent_type);
CREATE INDEX idx_conversations_session ON ai_agent.conversations(session_id);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS ai_agent.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store structured data, tool calls, etc.
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for messages
CREATE INDEX idx_messages_conversation ON ai_agent.messages(conversation_id, created_at);

-- AI agent learned patterns and insights
CREATE TABLE IF NOT EXISTS ai_agent.learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(100) NOT NULL, -- e.g., 'content_preference', 'user_behavior', 'data_relationship'
  pattern_category VARCHAR(50) NOT NULL, -- e.g., 'content', 'quality', 'structure'
  pattern_description TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  supporting_evidence JSONB NOT NULL DEFAULT '[]', -- Array of evidence items
  usage_count INTEGER DEFAULT 0,
  last_applied TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  learned_from_source VARCHAR(100), -- Where this was learned from
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for learned patterns
CREATE INDEX idx_learned_patterns_type ON ai_agent.learned_patterns(pattern_type, confidence_score DESC);
CREATE INDEX idx_learned_patterns_active ON ai_agent.learned_patterns(is_active, pattern_category);

-- Content analysis cache for faster responses
CREATE TABLE IF NOT EXISTS ai_agent.content_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- 'topic', 'question', 'event', etc.
  content_id TEXT NOT NULL,
  analysis_type VARCHAR(100) NOT NULL, -- e.g., 'summary', 'key_concepts', 'relationships'
  analysis_result JSONB NOT NULL,
  model_version VARCHAR(50),
  confidence_score NUMERIC(3,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(content_type, content_id, analysis_type)
);

-- Create indexes for analysis cache
CREATE INDEX idx_analysis_cache_lookup ON ai_agent.content_analysis_cache(content_type, content_id);
CREATE INDEX idx_analysis_cache_expiry ON ai_agent.content_analysis_cache(expires_at);

-- Database context snapshots for learning
CREATE TABLE IF NOT EXISTS ai_agent.database_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type VARCHAR(100) NOT NULL, -- e.g., 'content_distribution', 'user_patterns', 'quality_metrics'
  context_data JSONB NOT NULL,
  analysis_summary TEXT,
  insights JSONB DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for database context
CREATE INDEX idx_database_context_current ON ai_agent.database_context(context_type, is_current);
CREATE INDEX idx_database_context_created ON ai_agent.database_context(created_at DESC);

-- AI-generated content tracking
CREATE TABLE IF NOT EXISTS ai_agent.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type VARCHAR(100) NOT NULL, -- e.g., 'question_topic', 'quiz_questions', 'glossary_terms'
  source_reference TEXT, -- Reference to source material
  prompt_template TEXT,
  generation_parameters JSONB DEFAULT '{}',
  generated_content JSONB NOT NULL,
  quality_scores JSONB DEFAULT '{}',
  human_review_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, modified
  human_feedback TEXT,
  published BOOLEAN DEFAULT false,
  published_id TEXT, -- ID in the target table if published
  generation_time_ms INTEGER,
  model_used VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for generated content
CREATE INDEX idx_generated_content_type ON ai_agent.generated_content(generation_type, created_at DESC);
CREATE INDEX idx_generated_content_status ON ai_agent.generated_content(human_review_status);
CREATE INDEX idx_generated_content_quality ON ai_agent.generated_content((quality_scores->>'overall')::numeric DESC);

-- Fallback responses for when AI APIs are unavailable
CREATE TABLE IF NOT EXISTS ai_agent.fallback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_pattern TEXT NOT NULL, -- Pattern to match user input
  response_type VARCHAR(50) NOT NULL, -- e.g., 'template', 'cached', 'rule_based'
  response_template TEXT NOT NULL,
  response_data JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for fallback responses
CREATE INDEX idx_fallback_responses_active ON ai_agent.fallback_responses(is_active);
CREATE INDEX idx_fallback_responses_usage ON ai_agent.fallback_responses(usage_count DESC);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS ai_agent.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  fallback_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10,4) DEFAULT 0,
  quality_metrics JSONB DEFAULT '{}',
  
  UNIQUE(metric_date, agent_type)
);

-- Create indexes for performance metrics
CREATE INDEX idx_performance_metrics_date ON ai_agent.performance_metrics(metric_date DESC, agent_type);

-- Knowledge graph for relationships
CREATE TABLE IF NOT EXISTS ai_agent.knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(50) NOT NULL,
  source_id TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id TEXT NOT NULL,
  relationship_type VARCHAR(100) NOT NULL,
  relationship_strength NUMERIC(3,2) DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  discovered_by VARCHAR(100), -- Which agent discovered this
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for knowledge graph
CREATE INDEX idx_knowledge_graph_source ON ai_agent.knowledge_graph(source_type, source_id);
CREATE INDEX idx_knowledge_graph_target ON ai_agent.knowledge_graph(target_type, target_id);
CREATE INDEX idx_knowledge_graph_relationship ON ai_agent.knowledge_graph(relationship_type);

-- RLS Policies
ALTER TABLE ai_agent.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.content_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.database_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.fallback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent.knowledge_graph ENABLE ROW LEVEL SECURITY;

-- Policies for AI agent data access
CREATE POLICY "Users can view their own conversations"
  ON ai_agent.conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage all AI data"
  ON ai_agent.conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Public read for analysis cache"
  ON ai_agent.content_analysis_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage learned patterns"
  ON ai_agent.learned_patterns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION ai_agent.record_learning(
  p_pattern_type VARCHAR,
  p_pattern_category VARCHAR,
  p_description TEXT,
  p_confidence NUMERIC,
  p_evidence JSONB,
  p_source VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pattern_id UUID;
BEGIN
  -- Check if similar pattern exists
  SELECT id INTO v_pattern_id
  FROM ai_agent.learned_patterns
  WHERE pattern_type = p_pattern_type
    AND pattern_category = p_pattern_category
    AND similarity(pattern_description, p_description) > 0.8
  LIMIT 1;
  
  IF v_pattern_id IS NOT NULL THEN
    -- Update existing pattern
    UPDATE ai_agent.learned_patterns
    SET confidence_score = LEAST(1.0, confidence_score + (p_confidence * 0.1)),
        supporting_evidence = supporting_evidence || p_evidence,
        usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = v_pattern_id;
  ELSE
    -- Create new pattern
    INSERT INTO ai_agent.learned_patterns (
      pattern_type,
      pattern_category,
      pattern_description,
      confidence_score,
      supporting_evidence,
      learned_from_source
    ) VALUES (
      p_pattern_type,
      p_pattern_category,
      p_description,
      p_confidence,
      p_evidence,
      p_source
    ) RETURNING id INTO v_pattern_id;
  END IF;
  
  RETURN v_pattern_id;
END;
$$;

-- Function to get relevant patterns for a context
CREATE OR REPLACE FUNCTION ai_agent.get_relevant_patterns(
  p_context_type VARCHAR,
  p_context_data JSONB,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  pattern_id UUID,
  pattern_description TEXT,
  confidence_score NUMERIC,
  usage_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    pattern_description,
    confidence_score,
    usage_count
  FROM ai_agent.learned_patterns
  WHERE pattern_type = p_context_type
    AND is_active = true
    AND confidence_score >= 0.5
  ORDER BY confidence_score DESC, usage_count DESC
  LIMIT p_limit;
END;
$$;

-- Trigger to clean up old cache entries
CREATE OR REPLACE FUNCTION ai_agent.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM ai_agent.content_analysis_cache
  WHERE expires_at < now();
END;
$$;

-- Scheduled cleanup (run daily)
-- Note: This would need to be set up as a cron job in Supabase
-- SELECT cron.schedule('cleanup-ai-cache', '0 2 * * *', 'SELECT ai_agent.cleanup_expired_cache();'); 