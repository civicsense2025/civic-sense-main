-- Enhanced AI Agent Conversational Learning Schema
-- Adds advanced conversation management, contextual memory, and learning capabilities

-- Add conversation state management
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'active';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS current_topic VARCHAR(200);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_mode VARCHAR(50) DEFAULT 'assistant'; -- assistant, autonomous, diagnostic, etc.
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS next_suggested_actions JSONB DEFAULT '[]';

-- Add message enhancements
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text'; -- text, command, suggestion, error, system_update
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2);
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS action_completed BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS related_messages UUID[];
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]';
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS tool_results JSONB DEFAULT '[]';

-- Create conversation context tracking
CREATE TABLE IF NOT EXISTS ai_agent.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  context_key VARCHAR(100) NOT NULL, -- current_focus, ongoing_tasks, user_preferences, etc.
  context_value JSONB NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(conversation_id, context_key)
);

CREATE INDEX idx_conversation_context_lookup ON ai_agent.conversation_context(conversation_id, priority DESC);
CREATE INDEX idx_conversation_context_expiry ON ai_agent.conversation_context(expires_at);

-- Intent recognition and learning
CREATE TABLE IF NOT EXISTS ai_agent.intent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name VARCHAR(100) NOT NULL,
  pattern_text TEXT NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- regex, fuzzy, semantic, keyword
  confidence_threshold NUMERIC(3,2) DEFAULT 0.7,
  typical_responses JSONB DEFAULT '[]',
  required_context JSONB DEFAULT '{}',
  suggested_actions JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intent_patterns_active ON ai_agent.intent_patterns(is_active, success_rate DESC);
CREATE INDEX idx_intent_patterns_usage ON ai_agent.intent_patterns(usage_count DESC);

-- Conversation templates and response patterns
CREATE TABLE IF NOT EXISTS ai_agent.response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_category VARCHAR(50) NOT NULL, -- greeting, explanation, error, suggestion, completion
  agent_type VARCHAR(50), -- specific to agent type or null for general
  trigger_conditions JSONB NOT NULL DEFAULT '{}', -- conditions when to use this template
  template_content TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]', -- list of variables this template expects
  tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, technical, casual
  complexity_level INTEGER DEFAULT 3 CHECK (complexity_level >= 1 AND complexity_level <= 5),
  usage_count INTEGER DEFAULT 0,
  effectiveness_score NUMERIC(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_response_templates_category ON ai_agent.response_templates(template_category, agent_type);
CREATE INDEX idx_response_templates_effectiveness ON ai_agent.response_templates(effectiveness_score DESC);

-- User interaction preferences and adaptation
CREATE TABLE IF NOT EXISTS ai_agent.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID, -- for anonymous users
  preference_type VARCHAR(100) NOT NULL, -- communication_style, detail_level, preferred_tools, etc.
  preference_value JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  learned_from_interactions INTEGER DEFAULT 1,
  last_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, preference_type),
  UNIQUE(session_id, preference_type)
);

CREATE INDEX idx_user_preferences_user ON ai_agent.user_preferences(user_id, confidence_score DESC);
CREATE INDEX idx_user_preferences_session ON ai_agent.user_preferences(session_id, confidence_score DESC);

-- Tool usage patterns and learning
CREATE TABLE IF NOT EXISTS ai_agent.tool_usage_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(100) NOT NULL,
  usage_context JSONB NOT NULL, -- what conditions led to using this tool
  success_indicators JSONB DEFAULT '{}', -- what indicates this tool usage was successful
  typical_parameters JSONB DEFAULT '{}', -- common parameter patterns
  user_satisfaction_avg NUMERIC(3,2),
  execution_time_avg_ms INTEGER,
  success_rate NUMERIC(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  is_recommended BOOLEAN DEFAULT true,
  learned_optimizations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_usage_patterns_tool ON ai_agent.tool_usage_patterns(tool_name, success_rate DESC);
CREATE INDEX idx_tool_usage_patterns_recommended ON ai_agent.tool_usage_patterns(is_recommended, usage_count DESC);

-- Conversation flow management
CREATE TABLE IF NOT EXISTS ai_agent.conversation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_name VARCHAR(100) NOT NULL,
  flow_description TEXT,
  trigger_conditions JSONB NOT NULL, -- when to start this flow
  flow_steps JSONB NOT NULL, -- array of steps in this conversation flow
  expected_outcomes JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '{}',
  typical_duration_minutes INTEGER,
  success_rate NUMERIC(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_flows_active ON ai_agent.conversation_flows(is_active, success_rate DESC);

-- Conversation flow instances (track current position in flows)
CREATE TABLE IF NOT EXISTS ai_agent.conversation_flow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES ai_agent.conversation_flows(id),
  current_step INTEGER DEFAULT 0,
  step_data JSONB DEFAULT '{}', -- data collected during this flow
  flow_state VARCHAR(50) DEFAULT 'active', -- active, paused, completed, abandoned
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  
  UNIQUE(conversation_id, flow_id)
);

CREATE INDEX idx_conversation_flow_instances_active ON ai_agent.conversation_flow_instances(flow_state, started_at DESC);

-- Memory consolidation and cleanup
CREATE TABLE IF NOT EXISTS ai_agent.memory_consolidation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consolidation_type VARCHAR(50) NOT NULL, -- daily, weekly, pattern_discovery, cleanup
  consolidation_date DATE NOT NULL,
  items_processed INTEGER DEFAULT 0,
  patterns_discovered INTEGER DEFAULT 0,
  insights_generated JSONB DEFAULT '[]',
  cleanup_actions_taken JSONB DEFAULT '[]',
  processing_time_ms INTEGER,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(consolidation_type, consolidation_date)
);

CREATE INDEX idx_memory_consolidation_status ON ai_agent.memory_consolidation(status, consolidation_date DESC);

-- Conversation analytics and insights
CREATE TABLE IF NOT EXISTS ai_agent.conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date DATE NOT NULL,
  agent_type VARCHAR(50),
  total_conversations INTEGER DEFAULT 0,
  avg_conversation_length INTEGER DEFAULT 0,
  avg_satisfaction_score NUMERIC(3,2),
  most_common_intents JSONB DEFAULT '[]',
  successful_flow_completions INTEGER DEFAULT 0,
  tool_usage_effectiveness JSONB DEFAULT '{}',
  user_retention_metrics JSONB DEFAULT '{}',
  conversation_quality_score NUMERIC(3,2),
  insights_discovered JSONB DEFAULT '[]',
  
  UNIQUE(analysis_date, agent_type)
);

CREATE INDEX idx_conversation_analytics_date ON ai_agent.conversation_analytics(analysis_date DESC, agent_type);

-- ============================================================================
-- ENHANCED FUNCTIONS
-- ============================================================================

-- Function to get conversation context
CREATE OR REPLACE FUNCTION ai_agent.get_conversation_context(
  p_conversation_id UUID,
  p_context_keys TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_context JSONB := '{}';
  v_record RECORD;
BEGIN
  FOR v_record IN 
    SELECT context_key, context_value
    FROM ai_agent.conversation_context
    WHERE conversation_id = p_conversation_id
      AND (p_context_keys IS NULL OR context_key = ANY(p_context_keys))
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY priority DESC, updated_at DESC
  LOOP
    v_context := v_context || jsonb_build_object(v_record.context_key, v_record.context_value);
  END LOOP;
  
  RETURN v_context;
END;
$$;

-- Function to update conversation context
CREATE OR REPLACE FUNCTION ai_agent.update_conversation_context(
  p_conversation_id UUID,
  p_context_key VARCHAR(100),
  p_context_value JSONB,
  p_priority INTEGER DEFAULT 5,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO ai_agent.conversation_context (
    conversation_id,
    context_key,
    context_value,
    priority,
    expires_at
  ) VALUES (
    p_conversation_id,
    p_context_key,
    p_context_value,
    p_priority,
    p_expires_at
  )
  ON CONFLICT (conversation_id, context_key)
  DO UPDATE SET
    context_value = EXCLUDED.context_value,
    priority = EXCLUDED.priority,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$;

-- Function to detect intent from message
CREATE OR REPLACE FUNCTION ai_agent.detect_intent(
  p_message_content TEXT,
  p_context JSONB DEFAULT '{}'
)
RETURNS TABLE (
  intent_name VARCHAR(100),
  confidence_score NUMERIC(3,2),
  suggested_actions JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ip.intent_name,
    CASE 
      WHEN ip.pattern_type = 'keyword' THEN
        CASE WHEN p_message_content ILIKE '%' || ip.pattern_text || '%' THEN 0.8 ELSE 0.0 END
      WHEN ip.pattern_type = 'fuzzy' THEN
        similarity(p_message_content, ip.pattern_text)
      ELSE ip.confidence_threshold
    END as calculated_confidence,
    ip.suggested_actions
  FROM ai_agent.intent_patterns ip
  WHERE ip.is_active = true
    AND (
      (ip.pattern_type = 'keyword' AND p_message_content ILIKE '%' || ip.pattern_text || '%') OR
      (ip.pattern_type = 'fuzzy' AND similarity(p_message_content, ip.pattern_text) >= ip.confidence_threshold) OR
      (ip.pattern_type = 'regex' AND p_message_content ~ ip.pattern_text)
    )
  ORDER BY calculated_confidence DESC
  LIMIT 5;
END;
$$;

-- Function to get best response template
CREATE OR REPLACE FUNCTION ai_agent.get_response_template(
  p_category VARCHAR(50),
  p_agent_type VARCHAR(50),
  p_context JSONB DEFAULT '{}',
  p_user_preferences JSONB DEFAULT '{}'
)
RETURNS TABLE (
  template_content TEXT,
  template_variables JSONB,
  tone VARCHAR(50)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_preferred_tone VARCHAR(50);
  v_preferred_complexity INTEGER;
BEGIN
  -- Extract user preferences
  v_preferred_tone := COALESCE(p_user_preferences->>'communication_tone', 'professional');
  v_preferred_complexity := COALESCE((p_user_preferences->>'detail_level')::INTEGER, 3);
  
  RETURN QUERY
  SELECT 
    rt.template_content,
    rt.template_variables,
    rt.tone
  FROM ai_agent.response_templates rt
  WHERE rt.template_category = p_category
    AND (rt.agent_type = p_agent_type OR rt.agent_type IS NULL)
    AND rt.is_active = true
    AND (rt.tone = v_preferred_tone OR rt.tone = 'professional') -- fallback to professional
    AND rt.complexity_level <= v_preferred_complexity + 1 -- allow slightly higher complexity
  ORDER BY 
    rt.effectiveness_score DESC,
    CASE WHEN rt.tone = v_preferred_tone THEN 1 ELSE 2 END,
    CASE WHEN rt.agent_type = p_agent_type THEN 1 ELSE 2 END,
    rt.usage_count DESC
  LIMIT 1;
END;
$$;

-- Function to record tool usage and learn from it
CREATE OR REPLACE FUNCTION ai_agent.record_tool_usage(
  p_tool_name VARCHAR(100),
  p_context JSONB,
  p_parameters JSONB,
  p_execution_time_ms INTEGER,
  p_success BOOLEAN,
  p_user_satisfaction INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_pattern_id UUID;
  v_new_success_rate NUMERIC(3,2);
  v_new_avg_time INTEGER;
BEGIN
  -- Find or create tool usage pattern
  SELECT id INTO v_pattern_id
  FROM ai_agent.tool_usage_patterns
  WHERE tool_name = p_tool_name
    AND usage_context @> p_context
  LIMIT 1;
  
  IF v_pattern_id IS NULL THEN
    -- Create new pattern
    INSERT INTO ai_agent.tool_usage_patterns (
      tool_name,
      usage_context,
      typical_parameters,
      execution_time_avg_ms,
      success_rate,
      usage_count,
      user_satisfaction_avg,
      last_used
    ) VALUES (
      p_tool_name,
      p_context,
      p_parameters,
      p_execution_time_ms,
      CASE WHEN p_success THEN 1.0 ELSE 0.0 END,
      1,
      p_user_satisfaction,
      now()
    );
  ELSE
    -- Update existing pattern
    UPDATE ai_agent.tool_usage_patterns
    SET 
      usage_count = usage_count + 1,
      success_rate = (success_rate * usage_count + CASE WHEN p_success THEN 1 ELSE 0 END) / (usage_count + 1),
      execution_time_avg_ms = (execution_time_avg_ms * usage_count + p_execution_time_ms) / (usage_count + 1),
      user_satisfaction_avg = CASE 
        WHEN p_user_satisfaction IS NOT NULL THEN
          COALESCE((user_satisfaction_avg * usage_count + p_user_satisfaction) / (usage_count + 1), p_user_satisfaction)
        ELSE user_satisfaction_avg
      END,
      last_used = now(),
      updated_at = now()
    WHERE id = v_pattern_id;
  END IF;
END;
$$;

-- Function to learn user preferences from interactions
CREATE OR REPLACE FUNCTION ai_agent.learn_user_preference(
  p_user_id UUID,
  p_session_id UUID,
  p_preference_type VARCHAR(100),
  p_preference_value JSONB,
  p_confidence NUMERIC(3,2) DEFAULT 0.1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_confidence NUMERIC(3,2);
  v_interaction_count INTEGER;
BEGIN
  -- Get existing preference if it exists
  SELECT confidence_score, learned_from_interactions
  INTO v_existing_confidence, v_interaction_count
  FROM ai_agent.user_preferences
  WHERE (user_id = p_user_id OR session_id = p_session_id)
    AND preference_type = p_preference_type;
  
  IF v_existing_confidence IS NOT NULL THEN
    -- Update existing preference
    UPDATE ai_agent.user_preferences
    SET 
      preference_value = preference_value || p_preference_value,
      confidence_score = LEAST(1.0, v_existing_confidence + p_confidence),
      learned_from_interactions = v_interaction_count + 1,
      updated_at = now()
    WHERE (user_id = p_user_id OR session_id = p_session_id)
      AND preference_type = p_preference_type;
  ELSE
    -- Create new preference
    INSERT INTO ai_agent.user_preferences (
      user_id,
      session_id,
      preference_type,
      preference_value,
      confidence_score,
      learned_from_interactions
    ) VALUES (
      p_user_id,
      p_session_id,
      p_preference_type,
      p_preference_value,
      p_confidence,
      1
    );
  END IF;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC LEARNING
-- ============================================================================

-- Trigger to automatically detect intents when messages are added
CREATE OR REPLACE FUNCTION ai_agent.auto_detect_intent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_detected_intent RECORD;
  v_conversation_context JSONB;
BEGIN
  -- Only process user messages
  IF NEW.role = 'user' THEN
    -- Get conversation context
    v_conversation_context := ai_agent.get_conversation_context(NEW.conversation_id);
    
    -- Detect intent
    SELECT intent_name, confidence_score, suggested_actions
    INTO v_detected_intent
    FROM ai_agent.detect_intent(NEW.content, v_conversation_context)
    ORDER BY confidence_score DESC
    LIMIT 1;
    
    -- Update message with detected intent
    IF v_detected_intent.intent_name IS NOT NULL THEN
      UPDATE ai_agent.messages
      SET 
        intent_detected = v_detected_intent.intent_name,
        confidence_score = v_detected_intent.confidence_score,
        metadata = metadata || jsonb_build_object(
          'suggested_actions', v_detected_intent.suggested_actions,
          'auto_detected', true
        )
      WHERE id = NEW.id;
      
      -- Update intent pattern usage
      UPDATE ai_agent.intent_patterns
      SET usage_count = usage_count + 1
      WHERE intent_name = v_detected_intent.intent_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_detect_intent
  AFTER INSERT ON ai_agent.messages
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.auto_detect_intent();

-- Trigger to update conversation topic when context changes
CREATE OR REPLACE FUNCTION ai_agent.update_conversation_topic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_topic VARCHAR(200);
BEGIN
  -- Extract topic from context if available
  IF NEW.context_key = 'current_focus' THEN
    v_current_topic := NEW.context_value ->> 'topic';
    
    IF v_current_topic IS NOT NULL THEN
      UPDATE ai_agent.conversations
      SET current_topic = v_current_topic
      WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_topic
  AFTER INSERT OR UPDATE ON ai_agent.conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_conversation_topic();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION ai_agent.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER trigger_conversation_context_updated_at
  BEFORE UPDATE ON ai_agent.conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_updated_at_column();

CREATE TRIGGER trigger_intent_patterns_updated_at
  BEFORE UPDATE ON ai_agent.intent_patterns
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_updated_at_column();

CREATE TRIGGER trigger_response_templates_updated_at
  BEFORE UPDATE ON ai_agent.response_templates
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON ai_agent.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_updated_at_column();

CREATE TRIGGER trigger_tool_usage_patterns_updated_at
  BEFORE UPDATE ON ai_agent.tool_usage_patterns
  FOR EACH ROW
  EXECUTE FUNCTION ai_agent.update_updated_at_column();

-- ============================================================================
-- SEED DATA FOR BETTER CONVERSATIONS
-- ============================================================================

-- Insert basic intent patterns
INSERT INTO ai_agent.intent_patterns (intent_name, pattern_text, pattern_type, typical_responses, suggested_actions) VALUES
('greeting', 'hello|hi|hey|good morning|good afternoon', 'regex', 
 '["Hello! I''m your CivicSense AI assistant. I can help you with congressional data, system monitoring, and civic education content."]',
 '["show_capabilities", "ask_how_can_help"]'),

('help_request', 'help|assist|support|how do|what can', 'regex',
 '["I can help you with several things: congressional data sync, system health monitoring, content generation, and database diagnostics. What would you like to work on?"]',
 '["show_available_commands", "ask_specific_need"]'),

('system_status', 'status|health|how is|system|running', 'regex',
 '["Let me check the current system status for you."]',
 '["check_system_health", "show_recent_activity"]'),

('congressional_data', 'congress|representative|senator|bill|legislation|photo', 'regex',
 '["I can help you with congressional data operations. Would you like me to sync member data, download photos, or check the status?"]',
 '["check_congressional_status", "offer_sync_options"]'),

('fix_issues', 'fix|repair|broken|error|issue|problem', 'regex',
 '["I''ll help you identify and fix any issues. Let me run a diagnostic first."]',
 '["run_diagnostics", "check_error_logs", "suggest_fixes"]'),

('generate_content', 'generate|create|make|content|quiz|questions', 'regex',
 '["I can generate various types of civic education content. What type of content would you like me to create?"]',
 '["show_content_types", "ask_content_preferences"]');

-- Insert response templates
INSERT INTO ai_agent.response_templates (template_name, template_category, template_content, template_variables, tone, effectiveness_score) VALUES
('friendly_greeting', 'greeting', 
 'Hello! I''m your CivicSense AI assistant. I''m actively monitoring the system and ready to help with {{capabilities}}. What would you like to work on?',
 '["capabilities"]', 'friendly', 0.9),

('professional_help', 'explanation',
 'I can assist you with {{task_type}}. Based on current system status, I recommend {{recommendation}}. Would you like me to proceed?',
 '["task_type", "recommendation"]', 'professional', 0.8),

('autonomous_update', 'system_update',
 'I''ve detected {{issue_type}} and {{action_taken}}. Current status: {{status}}. {{next_steps}}',
 '["issue_type", "action_taken", "status", "next_steps"]', 'technical', 0.9),

('completion_summary', 'completion',
 'Task completed! {{summary}} {{stats}} Is there anything else you''d like me to help with?',
 '["summary", "stats"]', 'friendly', 0.8);

-- Insert basic conversation flows
INSERT INTO ai_agent.conversation_flows (flow_name, flow_description, trigger_conditions, flow_steps, expected_outcomes) VALUES
('congressional_sync_flow', 'Guide user through congressional data synchronization',
 '{"intents": ["congressional_data"], "context": {"has_issues": true}}',
 '[
   {"step": "assess_current_state", "action": "check_congressional_status"},
   {"step": "identify_issues", "action": "run_photo_diagnostics"},
   {"step": "propose_solutions", "action": "suggest_sync_options"},
   {"step": "execute_fix", "action": "perform_sync"},
   {"step": "verify_success", "action": "confirm_completion"}
 ]',
 '["congressional_data_updated", "photos_synchronized", "user_satisfied"]'),

('system_health_flow', 'Comprehensive system health check and optimization',
 '{"intents": ["system_status", "fix_issues"]}',
 '[
   {"step": "initial_health_check", "action": "check_all_systems"},
   {"step": "identify_problems", "action": "analyze_issues"},
   {"step": "prioritize_fixes", "action": "rank_by_severity"},
   {"step": "apply_fixes", "action": "execute_repairs"},
   {"step": "verify_resolution", "action": "final_health_check"}
 ]',
 '["all_systems_healthy", "performance_optimized", "issues_resolved"]'),

('content_generation_flow', 'Guide user through content creation process',
 '{"intents": ["generate_content"]}',
 '[
   {"step": "understand_requirements", "action": "ask_content_type"},
   {"step": "gather_preferences", "action": "collect_parameters"},
   {"step": "generate_content", "action": "create_content"},
   {"step": "review_quality", "action": "validate_output"},
   {"step": "publish_or_revise", "action": "finalize_content"}
 ]',
 '["content_created", "quality_approved", "user_satisfied"]');

-- Insert basic user preference types
INSERT INTO ai_agent.user_preferences (user_id, preference_type, preference_value, confidence_score) VALUES
(NULL, 'default_communication_style', '{"tone": "professional", "detail_level": 3, "include_explanations": true}', 0.8),
(NULL, 'default_autonomous_behavior', '{"proactive_monitoring": true, "auto_fix_minor_issues": true, "notification_level": "important"}', 0.9);

COMMENT ON TABLE ai_agent.conversation_context IS 'Tracks dynamic context within conversations for better continuity';
COMMENT ON TABLE ai_agent.intent_patterns IS 'Patterns for recognizing user intents and providing appropriate responses';
COMMENT ON TABLE ai_agent.response_templates IS 'Templates for generating contextually appropriate responses';
COMMENT ON TABLE ai_agent.user_preferences IS 'Learned user preferences for personalized interactions';
COMMENT ON TABLE ai_agent.tool_usage_patterns IS 'Patterns for optimizing tool usage based on context and success rates';
COMMENT ON TABLE ai_agent.conversation_flows IS 'Predefined conversation flows for complex multi-step interactions'; 