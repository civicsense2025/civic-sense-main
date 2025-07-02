-- =============================================================================
-- Historical Events System Extension
-- =============================================================================
-- 
-- This migration extends the existing events system with historical/political
-- events that can be referenced in civic education content. It builds upon
-- the existing news_events table and creates connections for content linking.
--
-- Created: 2025-01-26
-- =============================================================================

BEGIN;

-- =============================================================================
-- HISTORICAL EVENTS TABLE (Extends existing event system)
-- =============================================================================

-- Create historical_events as an extension to the existing events ecosystem
CREATE TABLE IF NOT EXISTS public.historical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic event information
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    end_date DATE NULL, -- For events that span multiple days
    
    -- Event categorization
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'political', 'sociopolitical', 'cultural', 'economic', 
        'military', 'legislative', 'judicial', 'constitutional',
        'electoral', 'protest', 'reform', 'crisis'
    )),
    
    -- Significance and impact assessment
    significance_level INTEGER CHECK (significance_level >= 1 AND significance_level <= 10) DEFAULT 5,
    geographic_scope VARCHAR(20) CHECK (geographic_scope IN (
        'local', 'state', 'regional', 'national', 'international'
    )) DEFAULT 'national',
    
    -- Civic education relevance
    civic_impact_summary TEXT,
    lessons_learned TEXT[],
    power_dynamics_revealed TEXT[],
    government_actors_involved TEXT[],
    policy_areas_affected TEXT[],
    
    -- Source and verification
    primary_sources TEXT[],
    source_reliability_score INTEGER CHECK (source_reliability_score >= 1 AND source_reliability_score <= 100) DEFAULT 80,
    fact_checked BOOLEAN DEFAULT false,
    fact_check_notes TEXT,
    
    -- Content creation metadata
    created_by UUID REFERENCES auth.users(id),
    research_method VARCHAR(20) CHECK (research_method IN ('manual', 'ai_research', 'news_derived', 'user_submitted')) DEFAULT 'manual',
    ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_events_event_date 
    ON public.historical_events(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_historical_events_event_type 
    ON public.historical_events(event_type);

CREATE INDEX IF NOT EXISTS idx_historical_events_significance 
    ON public.historical_events(significance_level DESC);

CREATE INDEX IF NOT EXISTS idx_historical_events_geographic_scope 
    ON public.historical_events(geographic_scope);

CREATE INDEX IF NOT EXISTS idx_historical_events_text_search 
    ON public.historical_events USING GIN (
        to_tsvector('english', title || ' ' || description)
    );

-- =============================================================================
-- EVENT CONTENT CONNECTIONS TABLE
-- =============================================================================

-- Links historical events to educational content (topics, questions, etc.)
CREATE TABLE IF NOT EXISTS public.event_content_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event reference (can link to different types of events)
    historical_event_id UUID NULL REFERENCES public.historical_events(id) ON DELETE CASCADE,
    news_event_id TEXT NULL REFERENCES public.news_events(id) ON DELETE CASCADE,
    user_event_id UUID NULL REFERENCES public.user_events(id) ON DELETE CASCADE,
    
    -- Content reference
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'question_topic', 'question', 'skill', 'glossary_term', 'assessment'
    )),
    content_id TEXT NOT NULL, -- Can be various types of IDs
    
    -- Connection details
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN (
        'background', 'example', 'precedent', 'comparison', 'consequence', 
        'cause', 'related', 'timeline', 'context'
    )),
    connection_strength INTEGER CHECK (connection_strength >= 1 AND connection_strength <= 5) DEFAULT 3,
    
    -- Usage context
    context_notes TEXT,
    used_in_questions BOOLEAN DEFAULT false,
    used_in_explanations BOOLEAN DEFAULT false,
    used_in_examples BOOLEAN DEFAULT false,
    
    -- Quality and moderation
    approved BOOLEAN DEFAULT true,
    approved_by UUID NULL REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure at least one event reference exists
    CONSTRAINT event_content_connections_event_check 
        CHECK (historical_event_id IS NOT NULL OR news_event_id IS NOT NULL OR user_event_id IS NOT NULL)
);

-- Indexes for efficient content lookups
CREATE INDEX IF NOT EXISTS idx_event_content_connections_historical_event 
    ON public.event_content_connections(historical_event_id);

CREATE INDEX IF NOT EXISTS idx_event_content_connections_news_event 
    ON public.event_content_connections(news_event_id);

CREATE INDEX IF NOT EXISTS idx_event_content_connections_user_event 
    ON public.event_content_connections(user_event_id);

CREATE INDEX IF NOT EXISTS idx_event_content_connections_content 
    ON public.event_content_connections(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_event_content_connections_type 
    ON public.event_content_connections(connection_type);

-- =============================================================================
-- AI RESEARCH RESULTS TABLE
-- =============================================================================

-- Store results from AI research agent for historical events
CREATE TABLE IF NOT EXISTS public.ai_research_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Research request details
    query TEXT NOT NULL,
    research_context TEXT,
    timeframe_start DATE,
    timeframe_end DATE,
    focus_areas TEXT[],
    
    -- AI response
    researched_events JSONB NOT NULL DEFAULT '[]',
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    sources_found TEXT[],
    verification_notes TEXT,
    
    -- Processing metadata
    ai_model_used VARCHAR(50),
    processing_time_ms INTEGER,
    research_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'needs_review')) DEFAULT 'pending',
    error_message TEXT,
    
    -- Link to created historical events
    created_events UUID[] DEFAULT '{}',
    
    -- Moderation
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID NULL REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for research tracking
CREATE INDEX IF NOT EXISTS idx_ai_research_results_status 
    ON public.ai_research_results(status);

CREATE INDEX IF NOT EXISTS idx_ai_research_results_timestamp 
    ON public.ai_research_results(research_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_research_results_confidence 
    ON public.ai_research_results(confidence_score DESC);

-- =============================================================================
-- EVENT TIMELINE TABLE
-- =============================================================================

-- Create relationships between events for timeline and causality mapping
CREATE TABLE IF NOT EXISTS public.event_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source event (can be any type)
    source_historical_event_id UUID NULL REFERENCES public.historical_events(id) ON DELETE CASCADE,
    source_news_event_id TEXT NULL REFERENCES public.news_events(id) ON DELETE CASCADE,
    
    -- Target event (can be any type)
    target_historical_event_id UUID NULL REFERENCES public.historical_events(id) ON DELETE CASCADE,
    target_news_event_id TEXT NULL REFERENCES public.news_events(id) ON DELETE CASCADE,
    
    -- Relationship details
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN (
        'caused', 'preceded', 'influenced', 'paralleled', 'responded_to', 
        'escalated', 'resolved', 'related', 'pattern'
    )),
    relationship_strength INTEGER CHECK (relationship_strength >= 1 AND relationship_strength <= 5) DEFAULT 3,
    
    -- Timeline context
    time_gap_days INTEGER, -- Days between events
    description TEXT,
    
    -- Educational value
    civic_lesson TEXT, -- What this relationship teaches about how government/power works
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure valid source and target
    CONSTRAINT event_relationships_source_check 
        CHECK (source_historical_event_id IS NOT NULL OR source_news_event_id IS NOT NULL),
    CONSTRAINT event_relationships_target_check 
        CHECK (target_historical_event_id IS NOT NULL OR target_news_event_id IS NOT NULL)
);

-- Indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_event_relationships_source_historical 
    ON public.event_relationships(source_historical_event_id);

CREATE INDEX IF NOT EXISTS idx_event_relationships_target_historical 
    ON public.event_relationships(target_historical_event_id);

CREATE INDEX IF NOT EXISTS idx_event_relationships_type 
    ON public.event_relationships(relationship_type);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_content_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_relationships ENABLE ROW LEVEL SECURITY;

-- Historical events policies
CREATE POLICY "Admin can manage historical events" ON public.historical_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view historical events" ON public.historical_events
    FOR SELECT USING (true);

-- Event content connections policies
CREATE POLICY "Admin can manage event connections" ON public.event_content_connections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view approved connections" ON public.event_content_connections
    FOR SELECT USING (approved = true);

-- AI research results policies
CREATE POLICY "Admin can manage research results" ON public.ai_research_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Event relationships policies
CREATE POLICY "Admin can manage event relationships" ON public.event_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view event relationships" ON public.event_relationships
    FOR SELECT USING (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to find related events by date proximity and content similarity
CREATE OR REPLACE FUNCTION public.find_related_events(
    target_event_id UUID,
    date_range_days INTEGER DEFAULT 365,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    event_date DATE,
    similarity_score NUMERIC,
    relationship_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        he.id as event_id,
        he.title,
        he.event_date,
        -- Simple similarity based on text overlap and date proximity
        (
            similarity(target.title, he.title) * 0.4 +
            similarity(target.description, he.description) * 0.4 +
            (1.0 - (ABS(target.event_date - he.event_date) / GREATEST(date_range_days, 1))::NUMERIC) * 0.2
        ) as similarity_score,
        'related'::TEXT as relationship_type
    FROM public.historical_events he
    CROSS JOIN public.historical_events target
    WHERE target.id = target_event_id
    AND he.id != target_event_id
    AND ABS(target.event_date - he.event_date) <= date_range_days
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER trigger_historical_events_updated_at
    BEFORE UPDATE ON public.historical_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_event_content_connections_updated_at
    BEFORE UPDATE ON public.event_content_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- VIEWS FOR CONTENT INTEGRATION
-- =============================================================================

-- View for content creators to see available events with connection info
CREATE OR REPLACE VIEW public.events_for_content AS
SELECT 
    'historical' as event_source,
    he.id::TEXT as event_id,
    he.title,
    he.description,
    he.event_date,
    he.event_type,
    he.significance_level,
    he.civic_impact_summary,
    he.lessons_learned,
    COALESCE(conn_count.connection_count, 0) as times_used_in_content,
    he.created_at
FROM public.historical_events he
LEFT JOIN (
    SELECT 
        historical_event_id,
        COUNT(*) as connection_count
    FROM public.event_content_connections 
    WHERE historical_event_id IS NOT NULL
    GROUP BY historical_event_id
) conn_count ON he.id = conn_count.historical_event_id

UNION ALL

SELECT 
    'news' as event_source,
    ne.id as event_id,
    ne.headline as title,
    ne.content as description,
    ne.published_at::DATE as event_date,
    'current_event' as event_type,
    ne.civic_relevance_score / 10 as significance_level,
    array_to_string(ne.power_dynamics_revealed, '; ') as civic_impact_summary,
    ne.potential_civic_actions as lessons_learned,
    COALESCE(conn_count.connection_count, 0) as times_used_in_content,
    ne.created_at
FROM public.news_events ne
LEFT JOIN (
    SELECT 
        news_event_id,
        COUNT(*) as connection_count
    FROM public.event_content_connections 
    WHERE news_event_id IS NOT NULL
    GROUP BY news_event_id
) conn_count ON ne.id = conn_count.news_event_id

ORDER BY event_date DESC, significance_level DESC;

-- =============================================================================
-- INITIAL DATA SEEDING
-- =============================================================================

-- Add some foundational historical events to get started
INSERT INTO public.historical_events (
    title, description, event_date, event_type, significance_level, 
    civic_impact_summary, lessons_learned, power_dynamics_revealed,
    research_method, created_by
) VALUES 
(
    'Brown v. Board of Education Decision',
    'Supreme Court landmark decision that declared state laws establishing separate public schools for black and white students to be unconstitutional, overturning Plessy v. Ferguson.',
    '1954-05-17',
    'judicial',
    10,
    'Demonstrated how the judicial branch can overturn decades of legal precedent and force social change, challenging the power of state governments to maintain segregation.',
    ARRAY['Courts can drive social change when other branches fail', 'Constitutional interpretation evolves over time', 'Federal power can override state discrimination'],
    ARRAY['Supreme Court vs. State governments', 'NAACP legal strategy vs. segregationist establishment', 'Federal enforcement vs. local resistance'],
    'manual',
    NULL
),
(
    'Watergate Scandal and Nixon Resignation',
    'Political scandal involving the Nixon administration''s attempt to cover up its involvement in the break-in at the Democratic National Committee headquarters, leading to President Nixon''s resignation.',
    '1974-08-09',
    'political',
    10,
    'Showed that even the President is not above the law and demonstrated the power of investigative journalism and Congressional oversight in holding executive power accountable.',
    ARRAY['Presidential power has limits', 'Free press is essential for democracy', 'Congress can check executive power', 'Cover-ups often worse than original crimes'],
    ARRAY['Executive privilege vs. Congressional oversight', 'Media vs. government secrecy', 'Rule of law vs. presidential power'],
    'manual',
    NULL
),
(
    'Citizens United v. FEC Decision',
    'Supreme Court decision that removed restrictions on independent expenditures for political communications by corporations, unions, and other associations.',
    '2010-01-21',
    'judicial',
    9,
    'Fundamentally changed campaign finance by treating corporate spending as protected speech, dramatically increasing the influence of money in politics.',
    ARRAY['Supreme Court decisions can reshape entire political systems', 'Corporate speech receives First Amendment protection', 'Campaign finance laws have constitutional limits'],
    ARRAY['Corporate interests vs. individual voters', 'Free speech vs. democratic equality', 'Wealthy donors vs. grassroots participation'],
    'manual',
    NULL
);

COMMIT; 