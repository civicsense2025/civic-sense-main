-- Historical Research AI Agent Enhancements
-- This migration enhances existing tables and creates new ones to support the AI agent
-- Dependencies are ordered to ensure proper foreign key relationships

-- ============================================================================
-- 1. ENHANCE EXISTING ai_research_results TABLE
-- Add missing columns needed for the Historical Research Agent
-- ============================================================================

-- Add mode column (this was causing the error)
ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'systematic_survey';

-- Add other missing columns for enhanced functionality
ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}';

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS start_year INTEGER;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS end_year INTEGER;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS max_events INTEGER DEFAULT 10;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS learning_context TEXT;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS database_context_analyzed INTEGER DEFAULT 0;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS content_connections_built INTEGER DEFAULT 0;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS knowledge_insights JSON;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS validation_score INTEGER;

ALTER TABLE ai_research_results 
ADD COLUMN IF NOT EXISTS performance_metrics JSON;

-- Update research_type to include new AI agent modes
COMMENT ON COLUMN ai_research_results.mode IS 'Research mode: systematic_survey, period_focus, thematic_research, gap_analysis, relationship_discovery';

-- ============================================================================
-- 2. CREATE CONTENT GAPS ANALYSIS TABLE
-- Stores identified content gaps and research opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_gaps_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Gap Identification
    gap_type TEXT NOT NULL CHECK (gap_type IN ('category_gap', 'time_period_gap', 'theme_gap', 'connection_gap')),
    priority_level TEXT NOT NULL CHECK (priority_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    
    -- Gap Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSON NOT NULL DEFAULT '[]',
    confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Research Suggestions
    suggested_research JSON NOT NULL DEFAULT '{}',
    impact_potential INTEGER DEFAULT 50 CHECK (impact_potential >= 0 AND impact_potential <= 100),
    
    -- Categories and Themes
    missing_categories TEXT[] DEFAULT '{}',
    missing_themes TEXT[] DEFAULT '{}',
    time_period_start INTEGER,
    time_period_end INTEGER,
    
    -- Analysis Context
    analysis_method TEXT DEFAULT 'ai_agent_analysis',
    discovered_by TEXT, -- researcher_id
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status Tracking
    status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'addressed', 'dismissed')),
    addressed_by TEXT, -- researcher_id who addressed it
    addressed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content gaps analysis
CREATE INDEX IF NOT EXISTS idx_content_gaps_analysis_gap_type ON content_gaps_analysis(gap_type);
CREATE INDEX IF NOT EXISTS idx_content_gaps_analysis_priority ON content_gaps_analysis(priority_level);
CREATE INDEX IF NOT EXISTS idx_content_gaps_analysis_status ON content_gaps_analysis(status);
CREATE INDEX IF NOT EXISTS idx_content_gaps_analysis_discovered_at ON content_gaps_analysis(discovered_at);

-- ============================================================================
-- 3. CREATE AI RESEARCH SESSIONS TABLE
-- Tracks individual research sessions and their outcomes
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_research_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Session Details
    session_name TEXT,
    research_mode TEXT NOT NULL,
    researcher_id TEXT NOT NULL,
    
    -- Research Configuration
    research_config JSON NOT NULL DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    focus_areas TEXT[] DEFAULT '{}',
    time_constraints JSON, -- start_year, end_year
    
    -- Database Context Used
    database_context JSON NOT NULL DEFAULT '{}',
    existing_topics_analyzed INTEGER DEFAULT 0,
    existing_events_analyzed INTEGER DEFAULT 0,
    patterns_identified TEXT[] DEFAULT '{}',
    
    -- Research Results
    results_summary JSON DEFAULT '{}',
    events_generated INTEGER DEFAULT 0,
    connections_discovered INTEGER DEFAULT 0,
    content_packages_created INTEGER DEFAULT 0,
    
    -- Quality Metrics
    overall_quality_score INTEGER CHECK (overall_quality_score >= 0 AND overall_quality_score <= 100),
    validation_results JSON DEFAULT '{}',
    
    -- Performance Tracking
    processing_time_ms INTEGER,
    ai_model_used TEXT,
    tokens_consumed INTEGER,
    cost_usd DECIMAL(10,4),
    
    -- Session Status
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for research sessions
CREATE INDEX IF NOT EXISTS idx_ai_research_sessions_mode ON ai_research_sessions(research_mode);
CREATE INDEX IF NOT EXISTS idx_ai_research_sessions_researcher ON ai_research_sessions(researcher_id);
CREATE INDEX IF NOT EXISTS idx_ai_research_sessions_status ON ai_research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_research_sessions_started_at ON ai_research_sessions(started_at);

-- ============================================================================
-- 4. CREATE KNOWLEDGE CONNECTIONS TABLE  
-- Stores discovered connections between content pieces
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Connection Details
    connection_type TEXT NOT NULL CHECK (connection_type IN (
        'causal', 'temporal', 'thematic', 'institutional', 'biographical', 'geographical', 'ideological'
    )),
    connection_strength INTEGER NOT NULL DEFAULT 50 CHECK (connection_strength >= 0 AND connection_strength <= 100),
    
    -- Source Content
    source_content_type TEXT NOT NULL CHECK (source_content_type IN ('topic', 'event', 'question', 'news')),
    source_content_id TEXT NOT NULL,
    source_title TEXT,
    
    -- Target Content  
    target_content_type TEXT NOT NULL CHECK (target_content_type IN ('topic', 'event', 'question', 'news')),
    target_content_id TEXT NOT NULL,
    target_title TEXT,
    
    -- Connection Evidence
    explanation TEXT NOT NULL,
    evidence_sources JSON DEFAULT '[]',
    historical_precedent TEXT,
    
    -- Discovery Context
    discovered_by_ai BOOLEAN DEFAULT TRUE,
    discovery_method TEXT, -- 'ai_research_agent', 'manual_analysis', etc.
    research_session_id UUID REFERENCES ai_research_sessions(id) ON DELETE SET NULL,
    
    -- Validation
    human_verified BOOLEAN DEFAULT FALSE,
    confidence_score INTEGER DEFAULT 70 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    admin_notes TEXT,
    
    -- Usage Tracking
    used_in_explanations BOOLEAN DEFAULT FALSE,
    used_in_questions BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for knowledge connections
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_type ON knowledge_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_strength ON knowledge_connections(connection_strength);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_source ON knowledge_connections(source_content_type, source_content_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_target ON knowledge_connections(target_content_type, target_content_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_connections_session ON knowledge_connections(research_session_id);

-- ============================================================================
-- 5. CREATE RESEARCH VALIDATION TABLE
-- Tracks validation and quality control of AI research results
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_validation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Target Content
    content_type TEXT NOT NULL CHECK (content_type IN ('event', 'connection', 'research_session', 'content_package')),
    content_id TEXT NOT NULL,
    
    -- Validation Details
    validation_type TEXT NOT NULL CHECK (validation_type IN (
        'fact_check', 'source_verification', 'quality_review', 'bias_check', 'accuracy_assessment'
    )),
    
    -- Validation Results
    validation_score INTEGER CHECK (validation_score >= 0 AND validation_score <= 100),
    is_valid BOOLEAN,
    issues_found TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    
    -- Validator Information
    validated_by TEXT NOT NULL, -- user_id of validator
    validation_method TEXT, -- 'manual', 'automated', 'ai_assisted'
    validation_criteria JSON DEFAULT '{}',
    
    -- Evidence and Sources
    evidence_checked JSON DEFAULT '[]',
    sources_verified JSON DEFAULT '[]',
    fact_check_results JSON DEFAULT '{}',
    
    -- Actions Taken
    corrections_made JSON DEFAULT '[]',
    content_updated BOOLEAN DEFAULT FALSE,
    flagged_for_review BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for research validation
CREATE INDEX IF NOT EXISTS idx_research_validation_content ON research_validation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_research_validation_type ON research_validation(validation_type);
CREATE INDEX IF NOT EXISTS idx_research_validation_validator ON research_validation(validated_by);
CREATE INDEX IF NOT EXISTS idx_research_validation_score ON research_validation(validation_score);

-- ============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINTS (after all tables are created)
-- ============================================================================

-- Add foreign key from knowledge_connections to ai_research_sessions (already done above)
-- Add any other foreign keys as needed

-- ============================================================================
-- 7. CREATE OR UPDATE FUNCTIONS FOR THE HISTORICAL RESEARCH AGENT
-- ============================================================================

-- Function to log research session results
CREATE OR REPLACE FUNCTION log_research_session_result(
    p_session_id UUID,
    p_events_generated INTEGER DEFAULT 0,
    p_connections_discovered INTEGER DEFAULT 0,
    p_quality_score INTEGER DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT 'completed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE ai_research_sessions 
    SET 
        events_generated = p_events_generated,
        connections_discovered = p_connections_discovered,
        overall_quality_score = p_quality_score,
        processing_time_ms = p_processing_time_ms,
        status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN FOUND;
END;
$$;

-- Function to identify content gaps
CREATE OR REPLACE FUNCTION identify_content_gaps(
    p_analysis_type TEXT DEFAULT 'comprehensive',
    p_researcher_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    gap_type TEXT,
    priority_level TEXT,
    title TEXT,
    description TEXT,
    confidence_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- This is a placeholder function that can be enhanced with actual gap analysis logic
    -- For now, return sample data to demonstrate the structure
    
    RETURN QUERY
    SELECT 
        'time_period_gap'::TEXT as gap_type,
        'high'::TEXT as priority_level, 
        'Civil Rights Era 1950-1960'::TEXT as title,
        'Limited coverage of early civil rights movement'::TEXT as description,
        85 as confidence_score
    
    UNION ALL
    
    SELECT 
        'category_gap'::TEXT as gap_type,
        'medium'::TEXT as priority_level,
        'Environmental Policy'::TEXT as title, 
        'Few events covering environmental legislation history'::TEXT as description,
        75 as confidence_score;
        
END;
$$;

-- ============================================================================
-- 8. ACCESS CONTROL NOTES
-- ============================================================================

-- NOTE: RLS policies are not used for these tables as admin access is controlled
-- via application-level middleware (requireAdmin() function).
-- All admin API routes are protected by middleware in the application layer.
-- 
-- If database-level security is needed in the future, RLS policies can be added
-- by first creating an is_admin() function or using the user_roles table.

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE content_gaps_analysis IS 'Stores identified content gaps and research opportunities discovered by the AI agent';
COMMENT ON TABLE ai_research_sessions IS 'Tracks Historical Research AI Agent sessions and their outcomes';
COMMENT ON TABLE knowledge_connections IS 'Stores discovered connections between different pieces of content';
COMMENT ON TABLE research_validation IS 'Tracks validation and quality control of AI research results';

-- Add column comments for key fields
COMMENT ON COLUMN ai_research_results.mode IS 'Research mode used by the AI agent';
COMMENT ON COLUMN knowledge_connections.connection_strength IS 'Strength of connection from 0-100';
COMMENT ON COLUMN research_validation.validation_score IS 'Quality score from validation process'; 