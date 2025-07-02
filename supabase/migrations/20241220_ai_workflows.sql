-- ============================================================================
-- AI WORKFLOWS & ORCHESTRATION SCHEMA
-- ============================================================================
-- Migration to support unified AI workflow orchestration system

BEGIN;

-- Create ai_workflows table for custom workflows
CREATE TABLE IF NOT EXISTS public.ai_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'event')),
    schedule TEXT, -- Cron expression for scheduled workflows
    active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Performance tracking
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time_seconds INTEGER DEFAULT 0
);

-- Create ai_workflow_executions table
CREATE TABLE IF NOT EXISTS public.ai_workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id TEXT NOT NULL, -- Can reference both prebuilt and custom workflows
    
    -- Execution state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    steps_completed INTEGER DEFAULT 0 NOT NULL,
    total_steps INTEGER NOT NULL,
    current_step TEXT,
    
    -- Results and errors
    results JSONB DEFAULT '{}'::jsonb NOT NULL,
    errors TEXT[] DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    execution_time_seconds INTEGER,
    
    -- Metadata
    triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'schedule', 'api', 'event')),
    triggered_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    input_data JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create ai_workflow_step_logs table for detailed step tracking
CREATE TABLE IF NOT EXISTS public.ai_workflow_step_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID NOT NULL REFERENCES public.ai_workflow_executions(id) ON DELETE CASCADE,
    
    -- Step information
    step_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL,
    step_config JSONB DEFAULT '{}'::jsonb,
    
    -- Execution details
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    execution_time_seconds INTEGER,
    
    -- Results
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- Performance metrics
    tokens_used INTEGER,
    api_calls_made INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create ai_workflow_templates table for reusable templates
CREATE TABLE IF NOT EXISTS public.ai_workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'congressional', 'content', 'analysis', etc.
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Template metadata
    version TEXT DEFAULT '1.0',
    author TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create ai_workflow_schedules table for scheduled executions
CREATE TABLE IF NOT EXISTS public.ai_workflow_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    
    -- Schedule configuration
    cron_expression TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT true,
    
    -- Execution settings
    input_data JSONB DEFAULT '{}'::jsonb,
    max_concurrent_executions INTEGER DEFAULT 1,
    
    -- Status tracking
    last_executed_at TIMESTAMPTZ,
    next_execution_at TIMESTAMPTZ,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- ai_workflows indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflows_active ON public.ai_workflows(active);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_created_by ON public.ai_workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_trigger ON public.ai_workflows(trigger);

-- ai_workflow_executions indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_workflow_id ON public.ai_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_status ON public.ai_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_started_at ON public.ai_workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_triggered_by_user ON public.ai_workflow_executions(triggered_by_user);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_completed_today ON public.ai_workflow_executions(completed_at) 
WHERE completed_at >= CURRENT_DATE;

-- ai_workflow_step_logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflow_step_logs_execution_id ON public.ai_workflow_step_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_step_logs_step_type ON public.ai_workflow_step_logs(step_type);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_step_logs_status ON public.ai_workflow_step_logs(status);

-- ai_workflow_templates indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflow_templates_category ON public.ai_workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_templates_public ON public.ai_workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_templates_tags ON public.ai_workflow_templates USING GIN(tags);

-- ai_workflow_schedules indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflow_schedules_workflow_id ON public.ai_workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_schedules_enabled ON public.ai_workflow_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_schedules_next_execution ON public.ai_workflow_schedules(next_execution_at) 
WHERE enabled = true;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_ai_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_ai_workflows_updated_at
    BEFORE UPDATE ON public.ai_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ai_workflow_updated_at();

CREATE TRIGGER trigger_ai_workflow_executions_updated_at
    BEFORE UPDATE ON public.ai_workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ai_workflow_updated_at();

CREATE TRIGGER trigger_ai_workflow_templates_updated_at
    BEFORE UPDATE ON public.ai_workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ai_workflow_updated_at();

CREATE TRIGGER trigger_ai_workflow_schedules_updated_at
    BEFORE UPDATE ON public.ai_workflow_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ai_workflow_updated_at();

-- Auto-calculate execution time
CREATE OR REPLACE FUNCTION public.calculate_execution_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.execution_time_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_workflow_executions_calculate_time
    BEFORE UPDATE ON public.ai_workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_execution_time();

CREATE TRIGGER trigger_ai_workflow_step_logs_calculate_time
    BEFORE UPDATE ON public.ai_workflow_step_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_execution_time();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_schedules ENABLE ROW LEVEL SECURITY;

-- Admin-only access to workflows management
CREATE POLICY "ai_workflows_admin_access" ON public.ai_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Admin-only access to executions
CREATE POLICY "ai_workflow_executions_admin_access" ON public.ai_workflow_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Admin-only access to step logs
CREATE POLICY "ai_workflow_step_logs_admin_access" ON public.ai_workflow_step_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Templates: Public read, admin write
CREATE POLICY "ai_workflow_templates_public_read" ON public.ai_workflow_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "ai_workflow_templates_admin_all" ON public.ai_workflow_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Admin-only access to schedules
CREATE POLICY "ai_workflow_schedules_admin_access" ON public.ai_workflow_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View for workflow execution statistics
CREATE OR REPLACE VIEW public.ai_workflow_execution_stats AS
SELECT 
    workflow_id,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
    COUNT(*) FILTER (WHERE status = 'running') as running_executions,
    AVG(execution_time_seconds) FILTER (WHERE status = 'completed') as avg_execution_time,
    MAX(started_at) as last_execution_time,
    COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE) as executions_today
FROM public.ai_workflow_executions
GROUP BY workflow_id;

-- View for daily execution metrics
CREATE OR REPLACE VIEW public.ai_workflow_daily_metrics AS
SELECT 
    DATE(started_at) as execution_date,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
    AVG(execution_time_seconds) FILTER (WHERE status = 'completed') as avg_execution_time,
    COUNT(DISTINCT workflow_id) as unique_workflows_executed
FROM public.ai_workflow_executions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY execution_date DESC;

-- ============================================================================
-- SAMPLE DATA INSERTS
-- ============================================================================

-- Insert sample templates
INSERT INTO public.ai_workflow_templates (id, name, description, category, steps, tags, is_public, author) VALUES
(
    'template_comprehensive_congressional',
    'Comprehensive Congressional Analysis Template',
    'Analyze congressional documents with full fact-checking and quiz generation',
    'congressional',
    '[
        {
            "id": "analyze_documents",
            "name": "Analyze Congressional Documents",
            "type": "congressional_analysis",
            "config": {"include_power_dynamics": true, "civic_focus": true},
            "inputs": ["input"],
            "outputs": ["analysis_results"],
            "required": true
        },
        {
            "id": "generate_quiz",
            "name": "Generate Educational Quiz",
            "type": "quiz_generation",
            "config": {"max_questions": 5},
            "inputs": ["analysis_results"],
            "outputs": ["quiz_content"],
            "parallel": true
        },
        {
            "id": "fact_check",
            "name": "Verify Facts",
            "type": "fact_checking",
            "config": {"check_claims": true},
            "inputs": ["analysis_results"],
            "outputs": ["fact_check_results"],
            "parallel": true
        }
    ]'::jsonb,
    ARRAY['congressional', 'analysis', 'education', 'fact-checking'],
    true,
    'CivicSense System'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_workflow_templates (id, name, description, category, steps, tags, is_public, author) VALUES
(
    'template_content_generation',
    'Content Generation and Enhancement Template',
    'Generate educational content with entity extraction and optimization',
    'content',
    '[
        {
            "id": "extract_entities",
            "name": "Extract Key Entities",
            "type": "entity_extraction",
            "config": {"entity_types": ["person", "organization", "legislation"]},
            "inputs": ["input"],
            "outputs": ["entities"],
            "required": true
        },
        {
            "id": "generate_content",
            "name": "Generate Educational Content",
            "type": "content_generation",
            "config": {"tone": "civic_education", "max_length": 500},
            "inputs": ["input", "entities"],
            "outputs": ["generated_content"]
        }
    ]'::jsonb,
    ARRAY['content', 'generation', 'education', 'entities'],
    true,
    'CivicSense System'
) ON CONFLICT (id) DO NOTHING;

COMMIT; 