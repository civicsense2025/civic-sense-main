-- Content Relationships Integration - Clean Approach
-- Creates dedicated tables for content relationships while preserving existing schema

BEGIN;

-- ============================================================================
-- CREATE DEDICATED CONTENT_RELATIONSHIPS TABLE
-- ============================================================================

-- Main table for tracking relationships between any content types
CREATE TABLE IF NOT EXISTS public.content_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source content (the content that references another)
    source_content_type TEXT NOT NULL CHECK (source_content_type IN (
        'question_topics', 'questions', 'glossary_terms', 'skills', 
        'events', 'public_figures', 'organizations', 'media_organizations'
    )),
    source_content_id TEXT NOT NULL,
    
    -- Target content (the content being referenced)
    target_content_type TEXT NOT NULL CHECK (target_content_type IN (
        'question_topics', 'questions', 'glossary_terms', 'skills', 
        'events', 'public_figures', 'organizations', 'media_organizations'
    )),
    target_content_id TEXT NOT NULL,
    
    -- Relationship details
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'semantic', 'topical', 'hierarchical', 'temporal', 'causal', 
        'references', 'similar_to', 'part_of', 'example_of', 'related_to'
    )),
    
    -- Relationship strength (0-100)
    strength INTEGER NOT NULL DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
    
    -- AI analysis metadata
    ai_discovered BOOLEAN DEFAULT TRUE,
    discovery_method TEXT DEFAULT 'semantic_analysis',
    confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Human review
    human_verified BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(source_content_type, source_content_id, target_content_type, target_content_id, relationship_type)
);

-- Indexes for performance
CREATE INDEX idx_content_relationships_source 
ON public.content_relationships(source_content_type, source_content_id);

CREATE INDEX idx_content_relationships_target 
ON public.content_relationships(target_content_type, target_content_id);

CREATE INDEX idx_content_relationships_strength 
ON public.content_relationships(strength DESC);

CREATE INDEX idx_content_relationships_type 
ON public.content_relationships(relationship_type);

CREATE INDEX idx_content_relationships_ai_discovered 
ON public.content_relationships(ai_discovered, confidence_score DESC);

-- ============================================================================
-- CREATE CONTENT_DUPLICATION_WARNINGS TABLE (lightweight tracking)
-- ============================================================================

-- This table tracks potential duplications discovered by AI
-- Uses existing content IDs rather than duplicating content
CREATE TABLE IF NOT EXISTS public.content_duplication_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to existing content
    content_type TEXT NOT NULL CHECK (content_type IN (
        'question_topics', 'questions', 'glossary_terms', 'skills', 
        'events', 'public_figures', 'organizations', 'media_organizations'
    )),
    content_id TEXT NOT NULL,
    content_title TEXT NOT NULL,
    
    -- Similar content reference
    similar_content_type TEXT NOT NULL CHECK (similar_content_type IN (
        'question_topics', 'questions', 'glossary_terms', 'skills', 
        'events', 'public_figures', 'organizations', 'media_organizations'
    )),
    similar_content_id TEXT NOT NULL,
    similar_content_title TEXT NOT NULL,
    
    -- Duplication analysis
    similarity_score INTEGER NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
    warning_level TEXT NOT NULL CHECK (warning_level IN ('low', 'medium', 'high', 'critical')),
    
    -- AI recommendations
    recommendation TEXT NOT NULL,
    suggested_action TEXT NOT NULL CHECK (suggested_action IN (
        'merge', 'enhance_existing', 'differentiate', 'cancel_creation', 'review_manually'
    )),
    
    -- Analysis metadata
    analysis_method TEXT DEFAULT 'ai_semantic',
    keyword_overlap TEXT[],
    content_overlap_details JSONB,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Ensure we don't duplicate warnings
    UNIQUE(content_type, content_id, similar_content_type, similar_content_id)
);

-- Indexes for duplication warnings
CREATE INDEX idx_content_duplication_warnings_content 
ON public.content_duplication_warnings(content_type, content_id);

CREATE INDEX idx_content_duplication_warnings_similarity 
ON public.content_duplication_warnings(similarity_score DESC, warning_level);

CREATE INDEX idx_content_duplication_warnings_status 
ON public.content_duplication_warnings(status, created_at);

-- ============================================================================
-- CREATE ENHANCED CONTENT ANALYSIS VIEW
-- ============================================================================

-- View that aggregates content relationships across all existing tables
CREATE OR REPLACE VIEW public.content_relationship_analysis AS
WITH content_items AS (
    -- Question Topics
    SELECT 
        id::TEXT as content_id,
        'question_topics' as content_type,
        topic_title as title,
        description as content,
        CASE 
            WHEN categories IS NULL THEN ARRAY[]::TEXT[]
            WHEN jsonb_typeof(categories) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(categories))
            ELSE ARRAY[categories::TEXT]
        END as categories,
        created_at,
        updated_at
    FROM public.question_topics
    WHERE is_active = true
    
    UNION ALL
    
    -- Glossary Terms
    SELECT 
        id::TEXT as content_id,
        'glossary_terms' as content_type,
        term as title,
        definition as content,
        ARRAY[COALESCE(metadata->>'category', 'general')]::TEXT[] as categories,
        created_at,
        updated_at
    FROM public.glossary_terms
    
    UNION ALL
    
    -- Skills
    SELECT 
        id::TEXT as content_id,
        'skills' as content_type,
        skill_name as title,
        description as content,
        CASE 
            WHEN category_id IS NOT NULL THEN ARRAY[category_id::TEXT]
            ELSE ARRAY['uncategorized']
        END::TEXT[] as categories,
        created_at,
        updated_at
    FROM public.skills
    WHERE is_active = true
    
    UNION ALL
    
    -- Events
    SELECT 
        COALESCE(id::TEXT, topic_id) as content_id,
        'events' as content_type,
        topic_title as title,
        why_this_matters as content,
        ARRAY[COALESCE(source_type, 'event')]::TEXT[] as categories,
        created_at,
        updated_at
    FROM public.events
    WHERE is_active = true
    
    UNION ALL
    
    -- Public Figures
    SELECT 
        id::TEXT as content_id,
        'public_figures' as content_type,
        full_name as title,
        COALESCE(bio, 'Public figure') as content,
        ARRAY[COALESCE(primary_role_category, 'political_figure')]::TEXT[] as categories,
        created_at,
        updated_at
    FROM public.public_figures
    WHERE is_active = true
    
    UNION ALL
    
    -- Organizations
    SELECT 
        id::TEXT as content_id,
        'organizations' as content_type,
        name as title,
        description as content,
        ARRAY[COALESCE(organization_type, 'organization')]::TEXT[] as categories,
        created_at,
        updated_at
    FROM public.organizations
),
all_relationships AS (
    -- Content relationships from our new table
    SELECT 
        cr.source_content_id as source_id,
        cr.source_content_type as source_type,
        cr.target_content_id as target_id,
        cr.target_content_type as target_type,
        cr.relationship_type,
        cr.strength,
        cr.created_at
    FROM public.content_relationships cr
    
    UNION ALL
    
    -- Figure-Organization relationships (from existing table)
    SELECT 
        fo.figure_id::TEXT as source_id,
        'public_figures' as source_type,
        fo.organization_id::TEXT as target_id,
        'organizations' as target_type,
        'affiliation' as relationship_type,
        75 as strength,
        fo.created_at
    FROM public.figure_organizations fo
    
    UNION ALL
    
    -- Figure-Events relationships (from existing table)
    SELECT 
        fe.figure_id::TEXT as source_id,
        'public_figures' as source_type,
        fe.id::TEXT as target_id,
        'events' as target_type,
        'participation' as relationship_type,
        60 as strength,
        fe.created_at
    FROM public.figure_events fe
)
SELECT 
    ci.content_id,
    ci.content_type,
    ci.title,
    ci.content,
    ci.categories,
    ci.created_at,
    ci.updated_at,
    COALESCE(
        (SELECT COUNT(*) FROM all_relationships r 
         WHERE (r.source_id = ci.content_id AND r.source_type = ci.content_type)
            OR (r.target_id = ci.content_id AND r.target_type = ci.content_type)
        ), 0
    ) as relationship_count,
    COALESCE(
        (SELECT AVG(r.strength) FROM all_relationships r 
         WHERE (r.source_id = ci.content_id AND r.source_type = ci.content_type)
            OR (r.target_id = ci.content_id AND r.target_type = ci.content_type)
        ), 0
    ) as avg_relationship_strength
FROM content_items ci;

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to find content relationships using new dedicated table + existing relationships
CREATE OR REPLACE FUNCTION public.get_content_relationships(
    p_content_type TEXT,
    p_content_id TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    related_content_type TEXT,
    related_content_id TEXT,
    related_title TEXT,
    relationship_type TEXT,
    strength INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH all_relationships AS (
        -- From new content_relationships table
        SELECT 
            CASE 
                WHEN cr.source_content_type = p_content_type AND cr.source_content_id = p_content_id 
                THEN cr.target_content_type
                ELSE cr.source_content_type
            END as rel_type,
            CASE 
                WHEN cr.source_content_type = p_content_type AND cr.source_content_id = p_content_id 
                THEN cr.target_content_id
                ELSE cr.source_content_id
            END as rel_id,
            cr.relationship_type as rel_relationship,
            cr.strength as rel_strength
        FROM public.content_relationships cr
        WHERE (cr.source_content_type = p_content_type AND cr.source_content_id = p_content_id)
           OR (cr.target_content_type = p_content_type AND cr.target_content_id = p_content_id)
        
        UNION ALL
        
        -- From figure_organizations (if content is public figure)
        SELECT 
            'organizations' as rel_type,
            fo.organization_id::TEXT as rel_id,
            'affiliation' as rel_relationship,
            75 as rel_strength
        FROM public.figure_organizations fo
        WHERE p_content_type = 'public_figures' AND fo.figure_id::TEXT = p_content_id
        
        UNION ALL
        
        -- From figure_events (if content is public figure)
        SELECT 
            'events' as rel_type,
            fe.id::TEXT as rel_id,
            'participation' as rel_relationship,
            60 as rel_strength
        FROM public.figure_events fe
        WHERE p_content_type = 'public_figures' AND fe.figure_id::TEXT = p_content_id
    ),
    enriched_relationships AS (
        SELECT 
            ar.rel_type,
            ar.rel_id,
            ar.rel_relationship,
            ar.rel_strength,
            CASE 
                WHEN ar.rel_type = 'question_topics' THEN (SELECT topic_title FROM public.question_topics WHERE id::TEXT = ar.rel_id LIMIT 1)
                WHEN ar.rel_type = 'glossary_terms' THEN (SELECT term FROM public.glossary_terms WHERE id::TEXT = ar.rel_id LIMIT 1)
                WHEN ar.rel_type = 'skills' THEN (SELECT skill_name FROM public.skills WHERE id::TEXT = ar.rel_id LIMIT 1)
                WHEN ar.rel_type = 'events' THEN (SELECT topic_title FROM public.events WHERE id::TEXT = ar.rel_id LIMIT 1)
                WHEN ar.rel_type = 'public_figures' THEN (SELECT full_name FROM public.public_figures WHERE id::TEXT = ar.rel_id LIMIT 1)
                WHEN ar.rel_type = 'organizations' THEN (SELECT name FROM public.organizations WHERE id::TEXT = ar.rel_id LIMIT 1)
                ELSE 'Unknown'
            END as rel_title
        FROM all_relationships ar
    )
    SELECT 
        er.rel_type,
        er.rel_id,
        er.rel_title,
        er.rel_relationship,
        er.rel_strength
    FROM enriched_relationships er
    WHERE er.rel_title IS NOT NULL
    ORDER BY er.rel_strength DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new table
ALTER TABLE public.content_duplication_warnings ENABLE ROW LEVEL SECURITY;

-- Admin access for duplication warnings
CREATE POLICY "Admins can manage duplication warnings"
ON public.content_duplication_warnings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Public read access for content analysis view (no RLS needed for views)

-- ============================================================================
-- UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.content_duplication_warnings IS 
'Tracks potential content duplications discovered by AI analysis. Integrates with existing content tables rather than duplicating data.';

COMMENT ON VIEW public.content_relationship_analysis IS 
'Comprehensive view of all content items and their relationships across question_topics, glossary_terms, skills, events, public_figures, and organizations.';

COMMENT ON FUNCTION public.get_content_relationships IS 
'Finds all content relationships for a given content item using existing relationship tables (figure_relationships, figure_organizations, figure_events).';

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample duplication warning
INSERT INTO public.content_duplication_warnings (
    content_type, content_id, content_title,
    similar_content_type, similar_content_id, similar_content_title,
    similarity_score, warning_level,
    recommendation, suggested_action,
    keyword_overlap, content_overlap_details
) VALUES (
    'question_topics', 'sample_topic_1', 'Understanding Democracy',
    'question_topics', 'sample_topic_2', 'Democratic Principles',
    85, 'high',
    'These topics cover very similar ground with 85% content overlap. Consider merging or differentiating the focus areas.',
    'merge',
    ARRAY['democracy', 'principles', 'government', 'voting'],
    '{"content_similarity": 0.85, "title_similarity": 0.73, "keyword_jaccard": 0.67}'::jsonb
) ON CONFLICT DO NOTHING;

COMMIT; 