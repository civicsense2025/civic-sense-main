-- AI Command System Migration
-- Replaces hardcoded command logic with flexible, database-driven workflows

BEGIN;

-- =============================================================================
-- CORE COMMAND TABLES
-- =============================================================================

-- AI Prompts: Reusable prompt templates for different operations
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name VARCHAR(100) NOT NULL UNIQUE,
    prompt_template TEXT NOT NULL,
    prompt_type VARCHAR(50) NOT NULL CHECK (prompt_type IN ('classification', 'execution', 'analysis', 'generation', 'validation')),
    
    -- AI Configuration
    provider VARCHAR(50) NOT NULL DEFAULT 'any' CHECK (provider IN ('openai', 'anthropic', 'any')),
    model_config JSONB DEFAULT '{}', -- temperature, max_tokens, etc.
    system_message TEXT,
    response_format VARCHAR(20) DEFAULT 'text' CHECK (response_format IN ('json', 'text', 'structured')),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- AI Actions: Atomic operations that can be composed into workflows
CREATE TABLE IF NOT EXISTS ai_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Execution configuration
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('validation', 'api_call', 'database_query', 'ai_generation', 'file_operation', 'webhook')),
    executor_class VARCHAR(100) NOT NULL, -- Class that handles this action
    executor_method VARCHAR(100) NOT NULL, -- Method to call on the class
    configuration JSONB DEFAULT '{}', -- Action-specific configuration
    
    -- Schema validation
    input_schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for input validation
    output_schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for output validation
    
    -- Performance settings
    timeout_seconds INTEGER DEFAULT 60,
    retry_count INTEGER DEFAULT 0,
    is_idempotent BOOLEAN DEFAULT true, -- Can be safely retried
    
    -- Analytics
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- AI Commands: High-level commands that compose actions into workflows
CREATE TABLE IF NOT EXISTS ai_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('database', 'content', 'analytics', 'ai', 'system')),
    
    -- Natural language processing
    natural_language_patterns TEXT[] DEFAULT '{}', -- Regex patterns for matching
    example_inputs TEXT[] DEFAULT '{}', -- Example user inputs
    intent_keywords TEXT[] DEFAULT '{}', -- Keywords for intent classification
    
    -- Configuration
    parameters_schema JSONB DEFAULT '{}', -- Expected parameters and defaults
    requires_admin BOOLEAN DEFAULT true,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- User experience
    quick_action_label VARCHAR(100), -- Label for quick action button
    success_message_template TEXT, -- Template for success messages
    error_message_template TEXT, -- Template for error messages
    
    -- Analytics
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    user_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- Show in featured commands
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- RELATIONSHIP TABLES
-- =============================================================================

-- Command-Action relationships: Define workflows as sequences of actions
CREATE TABLE IF NOT EXISTS ai_command_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID NOT NULL REFERENCES ai_commands(id) ON DELETE CASCADE,
    action_id UUID NOT NULL REFERENCES ai_actions(id) ON DELETE CASCADE,
    
    -- Workflow configuration
    execution_order INTEGER NOT NULL, -- Order in the workflow
    input_mapping JSONB DEFAULT '{}', -- How to map workflow context to action inputs
    output_mapping JSONB DEFAULT '{}', -- How to map action outputs to workflow context
    
    -- Conditional execution
    condition_expression TEXT, -- Optional condition for executing this action
    error_handling VARCHAR(50) DEFAULT 'stop' CHECK (error_handling IN ('stop', 'continue', 'retry', 'fallback')),
    fallback_action_id UUID REFERENCES ai_actions(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(command_id, action_id, execution_order)
);

-- Action-Prompt relationships: Define which prompts actions use
CREATE TABLE IF NOT EXISTS ai_action_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES ai_actions(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
    
    -- Usage configuration
    usage_context VARCHAR(50) NOT NULL CHECK (usage_context IN ('input_processing', 'execution', 'output_formatting', 'error_handling')),
    parameter_mapping JSONB DEFAULT '{}', -- How to map action inputs to prompt parameters
    
    -- Conditional usage
    condition_expression TEXT, -- When to use this prompt
    priority INTEGER DEFAULT 1, -- Priority if multiple prompts match
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(action_id, prompt_id, usage_context)
);

-- =============================================================================
-- ANALYTICS AND LOGGING
-- =============================================================================

-- Command execution analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS ai_command_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    command_id UUID NOT NULL REFERENCES ai_commands(id) ON DELETE CASCADE,
    
    -- Execution metrics
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_execution_time_ms INTEGER DEFAULT 0,
    median_execution_time_ms INTEGER DEFAULT 0,
    p95_execution_time_ms INTEGER DEFAULT 0,
    
    -- User metrics
    unique_users INTEGER DEFAULT 0,
    user_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
    user_satisfaction_count INTEGER DEFAULT 0,
    
    -- System metrics
    total_tokens_used INTEGER DEFAULT 0,
    total_api_cost_usd DECIMAL(10,6) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, command_id)
);

-- Individual command executions (detailed logging)
CREATE TABLE IF NOT EXISTS ai_command_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(100) NOT NULL UNIQUE, -- Human-readable execution ID
    
    -- Command details
    command_id UUID NOT NULL REFERENCES ai_commands(id),
    original_input TEXT NOT NULL,
    parsed_parameters JSONB DEFAULT '{}',
    
    -- Execution tracking
    status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'timeout', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    
    -- Results
    results JSONB DEFAULT '{}',
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- Action tracking
    actions_total INTEGER DEFAULT 0,
    actions_completed INTEGER DEFAULT 0,
    current_action_id UUID REFERENCES ai_actions(id),
    action_execution_log JSONB DEFAULT '[]', -- Array of action execution details
    
    -- User context
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Cost tracking
    tokens_used INTEGER DEFAULT 0,
    api_cost_usd DECIMAL(10,6) DEFAULT 0,
    
    -- User feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- AI Prompts indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompts_name ON ai_prompts(prompt_name);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(is_active) WHERE is_active = true;

-- AI Actions indexes
CREATE INDEX IF NOT EXISTS idx_ai_actions_name ON ai_actions(action_name);
CREATE INDEX IF NOT EXISTS idx_ai_actions_type ON ai_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_actions_executor ON ai_actions(executor_class, executor_method);
CREATE INDEX IF NOT EXISTS idx_ai_actions_active ON ai_actions(is_active) WHERE is_active = true;

-- AI Commands indexes
CREATE INDEX IF NOT EXISTS idx_ai_commands_name ON ai_commands(command_name);
CREATE INDEX IF NOT EXISTS idx_ai_commands_category ON ai_commands(category);
CREATE INDEX IF NOT EXISTS idx_ai_commands_active ON ai_commands(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_commands_featured ON ai_commands(is_featured) WHERE is_featured = true;

-- Command-Action relationships
CREATE INDEX IF NOT EXISTS idx_command_actions_command ON ai_command_actions(command_id, execution_order);
CREATE INDEX IF NOT EXISTS idx_command_actions_action ON ai_command_actions(action_id);

-- Action-Prompt relationships
CREATE INDEX IF NOT EXISTS idx_action_prompts_action ON ai_action_prompts(action_id);
CREATE INDEX IF NOT EXISTS idx_action_prompts_prompt ON ai_action_prompts(prompt_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_command_analytics_date ON ai_command_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_command_analytics_command ON ai_command_analytics(command_id, date DESC);

-- Executions indexes
CREATE INDEX IF NOT EXISTS idx_command_executions_id ON ai_command_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_command_executions_command ON ai_command_executions(command_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_executions_user ON ai_command_executions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_executions_status ON ai_command_executions(status);
CREATE INDEX IF NOT EXISTS idx_command_executions_started ON ai_command_executions(started_at DESC);

-- =============================================================================
-- VIEWS FOR EASIER QUERYING
-- =============================================================================

-- Command workflows view
CREATE OR REPLACE VIEW ai_command_workflows AS
SELECT 
    c.command_name,
    c.display_name,
    c.description,
    c.category,
    c.natural_language_patterns,
    c.example_inputs,
    json_agg(
        json_build_object(
            'action_name', a.action_name,
            'display_name', a.display_name,
            'execution_order', ca.execution_order,
            'action_type', a.action_type,
            'timeout_seconds', a.timeout_seconds,
            'input_mapping', ca.input_mapping,
            'output_mapping', ca.output_mapping
        ) ORDER BY ca.execution_order
    ) as workflow_steps
FROM ai_commands c
JOIN ai_command_actions ca ON c.id = ca.command_id
JOIN ai_actions a ON ca.action_id = a.id
WHERE c.is_active = true AND a.is_active = true AND ca.is_active = true
GROUP BY c.id, c.command_name, c.display_name, c.description, c.category, c.natural_language_patterns, c.example_inputs;

-- Command success rates view
CREATE OR REPLACE VIEW ai_command_success_rates AS
SELECT 
    c.command_name,
    c.display_name,
    c.category,
    COALESCE(SUM(ca.execution_count), 0) as total_executions,
    COALESCE(SUM(ca.success_count), 0) as successful_executions,
    CASE 
        WHEN SUM(ca.execution_count) > 0 
        THEN ROUND((SUM(ca.success_count)::decimal / SUM(ca.execution_count) * 100), 2)
        ELSE 0 
    END as success_rate_percent,
    COALESCE(AVG(ca.avg_execution_time_ms), 0) as avg_execution_time_ms,
    COALESCE(AVG(ca.user_satisfaction_avg), 0) as avg_user_satisfaction
FROM ai_commands c
LEFT JOIN ai_command_analytics ca ON c.id = ca.command_id
WHERE c.is_active = true
GROUP BY c.id, c.command_name, c.display_name, c.category;

-- Recent command executions view
CREATE OR REPLACE VIEW ai_recent_command_executions AS
SELECT 
    ce.execution_id,
    c.command_name,
    c.display_name,
    ce.status,
    ce.started_at,
    ce.completed_at,
    ce.execution_time_ms,
    ce.actions_completed,
    ce.actions_total,
    CASE 
        WHEN ce.user_id IS NOT NULL THEN 'authenticated'
        ELSE 'anonymous'
    END as user_type,
    ce.user_rating,
    ce.error_message
FROM ai_command_executions ce
JOIN ai_commands c ON ce.command_id = c.id
WHERE ce.started_at >= NOW() - INTERVAL '7 days'
ORDER BY ce.started_at DESC;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_command_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_command_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_command_executions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for configuration tables
CREATE POLICY "Admins can manage AI prompts" ON ai_prompts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage AI actions" ON ai_actions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage AI commands" ON ai_commands
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Analytics policies
CREATE POLICY "Admins can view command analytics" ON ai_command_analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Execution logs policies
CREATE POLICY "Users can view their own executions" ON ai_command_executions
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert executions" ON ai_command_executions
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update command analytics
CREATE OR REPLACE FUNCTION update_command_analytics(
    p_command_id UUID,
    p_success BOOLEAN,
    p_execution_time_ms INTEGER,
    p_tokens_used INTEGER DEFAULT 0,
    p_cost_usd DECIMAL DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO ai_command_analytics (
        date, 
        command_id, 
        execution_count, 
        success_count,
        failure_count,
        avg_execution_time_ms,
        total_tokens_used,
        total_api_cost_usd
    ) VALUES (
        v_today,
        p_command_id,
        1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        p_execution_time_ms,
        p_tokens_used,
        p_cost_usd
    )
    ON CONFLICT (date, command_id) DO UPDATE SET
        execution_count = ai_command_analytics.execution_count + 1,
        success_count = ai_command_analytics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        failure_count = ai_command_analytics.failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        avg_execution_time_ms = (
            (ai_command_analytics.avg_execution_time_ms * ai_command_analytics.execution_count + p_execution_time_ms) 
            / (ai_command_analytics.execution_count + 1)
        ),
        total_tokens_used = ai_command_analytics.total_tokens_used + p_tokens_used,
        total_api_cost_usd = ai_command_analytics.total_api_cost_usd + p_cost_usd,
        updated_at = NOW();
END;
$$;

-- Function to find commands by natural language
CREATE OR REPLACE FUNCTION find_commands_by_pattern(p_input TEXT)
RETURNS TABLE (
    command_id UUID,
    command_name VARCHAR,
    display_name VARCHAR,
    confidence_score DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    normalized_input TEXT := lower(trim(p_input));
    pattern TEXT;
    confidence DECIMAL;
BEGIN
    FOR command_id, command_name, display_name IN
        SELECT c.id, c.command_name, c.display_name
        FROM ai_commands c
        WHERE c.is_active = true
    LOOP
        confidence_score := 0;
        
        -- Check natural language patterns
        FOR pattern IN
            SELECT unnest(natural_language_patterns)
            FROM ai_commands 
            WHERE id = command_id
        LOOP
            IF normalized_input ~ pattern THEN
                confidence_score := GREATEST(confidence_score, 0.9);
            END IF;
        END LOOP;
        
        -- Check intent keywords
        FOR pattern IN
            SELECT unnest(intent_keywords)
            FROM ai_commands 
            WHERE id = command_id
        LOOP
            IF normalized_input LIKE '%' || pattern || '%' THEN
                confidence_score := GREATEST(confidence_score, 0.7);
            END IF;
        END LOOP;
        
        -- Return if confidence is high enough
        IF confidence_score > 0.5 THEN
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

COMMIT; 