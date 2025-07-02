-- Enhanced AI Agent Conversational Learning Schema
-- This migration adds advanced conversation management, contextual memory, and learning capabilities

BEGIN;

-- Add conversation state management columns
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'active';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS current_topic VARCHAR(200);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_mode VARCHAR(50) DEFAULT 'assistant';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS next_suggested_actions JSONB DEFAULT '[]';

-- Add message enhancement columns
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2);
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS action_completed BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS related_messages UUID[];
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]';
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS tool_results JSONB DEFAULT '[]';

-- Create conversation context tracking table
CREATE TABLE IF NOT EXISTS ai_agent.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
  context_key VARCHAR(100) NOT NULL,
  context_value JSONB NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(conversation_id, context_key)
);

CREATE INDEX IF NOT EXISTS idx_conversation_context_lookup ON ai_agent.conversation_context(conversation_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_context_expiry ON ai_agent.conversation_context(expires_at);

-- Create intent patterns table
CREATE TABLE IF NOT EXISTS ai_agent.intent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name VARCHAR(100) NOT NULL,
  pattern_text TEXT NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_intent_patterns_active ON ai_agent.intent_patterns(is_active, success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_intent_patterns_usage ON ai_agent.intent_patterns(usage_count DESC);

-- Create response templates table
CREATE TABLE IF NOT EXISTS ai_agent.response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_category VARCHAR(50) NOT NULL,
  agent_type VARCHAR(50),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  template_content TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]',
  tone VARCHAR(50) DEFAULT 'professional',
  complexity_level INTEGER DEFAULT 3 CHECK (complexity_level >= 1 AND complexity_level <= 5),
  usage_count INTEGER DEFAULT 0,
  effectiveness_score NUMERIC(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_response_templates_category ON ai_agent.response_templates(template_category, agent_type);
CREATE INDEX IF NOT EXISTS idx_response_templates_effectiveness ON ai_agent.response_templates(effectiveness_score DESC);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS ai_agent.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  preference_type VARCHAR(100) NOT NULL,
  preference_value JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  learned_from_interactions INTEGER DEFAULT 1,
  last_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, preference_type),
  UNIQUE(session_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON ai_agent.user_preferences(user_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_session ON ai_agent.user_preferences(session_id, confidence_score DESC);

-- Create tool usage patterns table
CREATE TABLE IF NOT EXISTS ai_agent.tool_usage_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(100) NOT NULL,
  usage_context JSONB NOT NULL,
  success_indicators JSONB DEFAULT '{}',
  typical_parameters JSONB DEFAULT '{}',
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

CREATE INDEX IF NOT EXISTS idx_tool_usage_patterns_tool ON ai_agent.tool_usage_patterns(tool_name, success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tool_usage_patterns_recommended ON ai_agent.tool_usage_patterns(is_recommended, usage_count DESC);

-- Insert basic intent patterns for conversational AI
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

-- Insert response templates for better conversation flow
INSERT INTO ai_agent.response_templates (template_name, template_category, template_content, template_variables, tone, effectiveness_score) VALUES
('friendly_greeting', 'greeting', 
 'Hello! I''m your CivicSense AI assistant. I''m actively monitoring the system and ready to help. What would you like to work on?',
 '["capabilities"]', 'friendly', 0.9),

('professional_help', 'explanation',
 'I can assist you with {{task_type}}. Based on current system status, I recommend {{recommendation}}. Would you like me to proceed?',
 '["task_type", "recommendation"]', 'professional', 0.8),

('autonomous_update', 'system_update',
 'I''ve detected {{issue_type}} and {{action_taken}}. Current status: {{status}}. {{next_steps}}',
 '["issue_type", "action_taken", "status", "next_steps"]', 'technical', 0.9),

('completion_summary', 'completion',
 'Task completed! {{summary}} Is there anything else you''d like me to help with?',
 '["summary", "stats"]', 'friendly', 0.8);

COMMIT; 