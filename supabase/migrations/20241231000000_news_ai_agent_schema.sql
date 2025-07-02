-- =============================================================================
-- News AI Agent Database Schema
-- =============================================================================
-- 
-- This migration creates the database schema for the autonomous news monitoring
-- and content generation system. The agent monitors breaking news and automatically
-- creates comprehensive civic education content packages.
--
-- Created: 2024-12-31
-- =============================================================================

BEGIN;

-- =============================================================================
-- NEWS AGENT CONFIGURATION TABLE
-- =============================================================================

-- Store the singleton configuration for the News AI Agent
CREATE TABLE IF NOT EXISTS public.news_agent_config (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure only one configuration row exists
    CONSTRAINT single_config_row CHECK (id = 'singleton')
);

-- Enable RLS
ALTER TABLE public.news_agent_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent config (admin access only)
CREATE POLICY "Admin can manage agent config" ON public.news_agent_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================================================
-- NEWS EVENTS TABLE
-- =============================================================================

-- Store discovered news events and their civic relevance analysis
CREATE TABLE IF NOT EXISTS public.news_events (
    id TEXT PRIMARY KEY,
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Civic relevance analysis
    civic_relevance_score INTEGER NOT NULL CHECK (civic_relevance_score >= 0 AND civic_relevance_score <= 100),
    power_dynamics_revealed TEXT[] DEFAULT '{}',
    government_actors_involved TEXT[] DEFAULT '{}',
    policy_areas_affected TEXT[] DEFAULT '{}',
    potential_civic_actions TEXT[] DEFAULT '{}',
    
    -- Content generation tracking
    content_generation_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (content_generation_status IN ('pending', 'processing', 'completed', 'failed')),
    content_package_id TEXT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_events_discovered_at 
    ON public.news_events(discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_events_civic_relevance_score 
    ON public.news_events(civic_relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_news_events_content_status 
    ON public.news_events(content_generation_status);

CREATE INDEX IF NOT EXISTS idx_news_events_source_url 
    ON public.news_events(source_url);

-- Enable RLS
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news events
CREATE POLICY "Admin can manage news events" ON public.news_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Public read access for viewing news events
CREATE POLICY "Users can view news events" ON public.news_events
    FOR SELECT USING (true);

-- =============================================================================
-- CONTENT PACKAGES TABLE
-- =============================================================================

-- Store generated content packages from news events
CREATE TABLE IF NOT EXISTS public.content_packages (
    id TEXT PRIMARY KEY,
    news_event_id TEXT NOT NULL REFERENCES public.news_events(id) ON DELETE CASCADE,
    news_headline TEXT NOT NULL,
    
    -- Generated content (stored as JSONB for flexibility)
    generated_content JSONB NOT NULL DEFAULT '{}',
    
    -- Quality assessment
    quality_scores JSONB NOT NULL DEFAULT '{}',
    
    -- Publication status
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'review', 'published', 'rejected')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ NULL,
    reviewed_by UUID NULL REFERENCES auth.users(id),
    published_at TIMESTAMPTZ NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_packages_news_event_id 
    ON public.content_packages(news_event_id);

CREATE INDEX IF NOT EXISTS idx_content_packages_status 
    ON public.content_packages(status);

CREATE INDEX IF NOT EXISTS idx_content_packages_created_at 
    ON public.content_packages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_packages_quality_score 
    ON public.content_packages USING BTREE ((quality_scores->>'overall'));

-- Enable RLS
ALTER TABLE public.content_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content packages
CREATE POLICY "Admin can manage content packages" ON public.content_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Moderators can review content packages
CREATE POLICY "Moderators can review content packages" ON public.content_packages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Public read access for published content
CREATE POLICY "Users can view published content packages" ON public.content_packages
    FOR SELECT USING (status = 'published');

-- =============================================================================
-- NEWS AGENT LOGS TABLE
-- =============================================================================

-- Store monitoring cycle logs and processing activity
CREATE TABLE IF NOT EXISTS public.news_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL,
    events_found INTEGER NOT NULL DEFAULT 0,
    relevant_events INTEGER NOT NULL DEFAULT 0,
    events_processed INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
    error TEXT NULL,
    
    -- Processing metrics
    processing_time_ms INTEGER NULL,
    memory_usage_mb INTEGER NULL,
    
    -- Configuration snapshot at time of processing
    config_snapshot JSONB NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_agent_logs_timestamp 
    ON public.news_agent_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_news_agent_logs_status 
    ON public.news_agent_logs(status);

-- Enable RLS
ALTER TABLE public.news_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent logs
CREATE POLICY "Admin can manage agent logs" ON public.news_agent_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================================================
-- CONTENT PUBLICATION TRACKING
-- =============================================================================

-- Track which generated content has been published to production tables
CREATE TABLE IF NOT EXISTS public.content_publication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_package_id TEXT NOT NULL REFERENCES public.content_packages(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN (
        'question_topic', 'questions', 'skills', 'glossary_terms', 'events', 'public_figures'
    )),
    target_table TEXT NOT NULL,
    target_record_id TEXT NOT NULL,
    publication_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (publication_status IN ('pending', 'published', 'failed')),
    error_message TEXT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ NULL
);

-- Indexes for tracking
CREATE INDEX IF NOT EXISTS idx_content_publication_log_package_id 
    ON public.content_publication_log(content_package_id);

CREATE INDEX IF NOT EXISTS idx_content_publication_log_status 
    ON public.content_publication_log(publication_status);

-- Enable RLS
ALTER TABLE public.content_publication_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for publication log
CREATE POLICY "Admin can manage publication log" ON public.content_publication_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that need them
CREATE TRIGGER trigger_news_agent_config_updated_at
    BEFORE UPDATE ON public.news_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_news_events_updated_at
    BEFORE UPDATE ON public.news_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_content_packages_updated_at
    BEFORE UPDATE ON public.content_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- VIEWS FOR ANALYTICS
-- =============================================================================

-- View for content generation analytics
CREATE OR REPLACE VIEW public.news_agent_analytics AS
SELECT 
    -- Daily aggregations
    DATE(cp.created_at) as date,
    COUNT(*) as total_packages,
    COUNT(*) FILTER (WHERE cp.status = 'published') as published_packages,
    COUNT(*) FILTER (WHERE cp.status = 'review') as packages_in_review,
    COUNT(*) FILTER (WHERE cp.status = 'rejected') as rejected_packages,
    
    -- Quality metrics
    AVG((cp.quality_scores->>'overall')::numeric) as avg_quality_score,
    AVG((cp.quality_scores->>'brandVoiceCompliance')::numeric) as avg_brand_voice_score,
    AVG((cp.quality_scores->>'factualAccuracy')::numeric) as avg_accuracy_score,
    AVG((cp.quality_scores->>'civicActionability')::numeric) as avg_actionability_score,
    
    -- News source distribution
    ARRAY_AGG(DISTINCT ne.source) as news_sources,
    AVG(ne.civic_relevance_score) as avg_civic_relevance
    
FROM public.content_packages cp
JOIN public.news_events ne ON cp.news_event_id = ne.id
GROUP BY DATE(cp.created_at)
ORDER BY date DESC;

-- View for agent performance metrics
CREATE OR REPLACE VIEW public.news_agent_performance AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as monitoring_cycles,
    SUM(events_found) as total_events_found,
    SUM(relevant_events) as total_relevant_events,
    SUM(events_processed) as total_events_processed,
    
    -- Success rates
    ROUND(
        (SUM(events_processed)::decimal / NULLIF(SUM(events_found), 0)) * 100, 
        2
    ) as processing_success_rate,
    
    ROUND(
        (SUM(relevant_events)::decimal / NULLIF(SUM(events_found), 0)) * 100, 
        2
    ) as relevance_detection_rate,
    
    -- Error tracking
    COUNT(*) FILTER (WHERE status = 'failed') as failed_cycles,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_cycles
    
FROM public.news_agent_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- =============================================================================
-- INITIAL DATA SETUP
-- =============================================================================

-- Insert default agent configuration
INSERT INTO public.news_agent_config (id, config) 
VALUES (
    'singleton',
    '{
        "isActive": false,
        "monitoringIntervalMinutes": 15,
        "minCivicRelevanceScore": 70,
        "maxEventsPerCycle": 5,
        "contentGeneration": {
            "generateQuestions": true,
            "generateSkills": true,
            "generateGlossary": true,
            "generateEvents": true,
            "generatePublicFigures": true
        },
        "aiProvider": "openai",
        "aiModel": "gpt-4",
        "qualityControl": {
            "minQualityScore": 75,
            "requireHumanReview": true
        }
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables (RLS will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_agent_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_agent_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_publication_log TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.news_agent_analytics TO authenticated;
GRANT SELECT ON public.news_agent_performance TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT; 