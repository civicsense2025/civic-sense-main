-- Source Metadata Storage Migration
-- Stores enhanced metadata for question sources including OpenGraph data

-- 1. SOURCE METADATA TABLE
-- Store rich metadata for all source URLs used in questions
CREATE TABLE source_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL UNIQUE, -- The source URL (canonical)
    
    -- Basic metadata
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT NOT NULL,
    
    -- OpenGraph metadata
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    og_site_name TEXT,
    og_type TEXT,
    
    -- Twitter Card metadata
    twitter_title TEXT,
    twitter_description TEXT,
    twitter_image TEXT,
    
    -- Additional metadata
    favicon_url TEXT,
    canonical_url TEXT, -- If different from original URL
    language VARCHAR(10), -- ISO language code
    
    -- Content analysis
    content_type VARCHAR(50), -- 'article', 'video', 'pdf', 'government', 'academic', etc.
    credibility_score REAL, -- 0-100 credibility assessment
    bias_rating VARCHAR(20), -- 'left', 'center', 'right', 'mixed', 'unknown'
    
    -- Technical metadata
    last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fetch_status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'timeout', 'blocked'
    fetch_error TEXT, -- Error message if fetch failed
    response_time_ms INTEGER, -- How long it took to fetch
    
    -- Quality indicators
    has_https BOOLEAN DEFAULT false,
    has_valid_ssl BOOLEAN DEFAULT false,
    is_accessible BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. QUESTION SOURCE LINKS
-- Enhanced many-to-many relationship between questions and sources
CREATE TABLE question_source_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    source_metadata_id UUID NOT NULL REFERENCES source_metadata(id) ON DELETE CASCADE,
    
    -- Source context
    source_name TEXT, -- Display name for this source in this context
    source_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'primary', 'supporting', 'background'
    relevance_score REAL DEFAULT 1.0, -- 0-1 how relevant this source is to the question
    
    -- Display preferences
    display_order INTEGER DEFAULT 0,
    is_primary_source BOOLEAN DEFAULT false,
    show_thumbnail BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(question_id, source_metadata_id)
);

-- 3. SOURCE FETCH QUEUE
-- Queue for background fetching/updating of source metadata
CREATE TABLE source_fetch_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1-5, higher = more urgent
    fetch_type VARCHAR(20) DEFAULT 'metadata', -- 'metadata', 'refresh', 'validate'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_source_metadata_url ON source_metadata(url);
CREATE INDEX idx_source_metadata_domain ON source_metadata(domain);
CREATE INDEX idx_source_metadata_last_fetched ON source_metadata(last_fetched_at);
CREATE INDEX idx_source_metadata_credibility ON source_metadata(credibility_score) WHERE credibility_score IS NOT NULL;
CREATE INDEX idx_question_source_links_question ON question_source_links(question_id);
CREATE INDEX idx_question_source_links_source ON question_source_links(source_metadata_id);
CREATE INDEX idx_question_source_links_primary ON question_source_links(question_id, is_primary_source) WHERE is_primary_source = true;
CREATE INDEX idx_source_fetch_queue_scheduled ON source_fetch_queue(scheduled_for, priority);
CREATE INDEX idx_source_fetch_queue_retry ON source_fetch_queue(retry_count, max_retries);

-- Add triggers for updated_at
CREATE TRIGGER update_source_metadata_updated_at 
    BEFORE UPDATE ON source_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. FUNCTIONS FOR SOURCE MANAGEMENT

-- Function to get or create source metadata
CREATE OR REPLACE FUNCTION get_or_create_source_metadata(
    p_url TEXT,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_domain TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_source_id UUID;
    v_domain TEXT;
BEGIN
    -- Extract domain if not provided
    IF p_domain IS NULL THEN
        v_domain := regexp_replace(p_url, '^https?://(?:www\.)?([^/]+).*$', '\1');
    ELSE
        v_domain := p_domain;
    END IF;
    
    -- Try to find existing source
    SELECT id INTO v_source_id
    FROM source_metadata
    WHERE url = p_url;
    
    -- Create if not found
    IF v_source_id IS NULL THEN
        INSERT INTO source_metadata (url, title, description, domain)
        VALUES (
            p_url,
            COALESCE(p_title, v_domain),
            p_description,
            v_domain
        )
        RETURNING id INTO v_source_id;
        
        -- Add to fetch queue for metadata enhancement
        INSERT INTO source_fetch_queue (url, priority, fetch_type)
        VALUES (p_url, 2, 'metadata')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN v_source_id;
END;
$$ LANGUAGE plpgsql;

-- Function to link question to source
CREATE OR REPLACE FUNCTION link_question_to_source(
    p_question_id UUID,
    p_url TEXT,
    p_source_name TEXT DEFAULT NULL,
    p_source_type VARCHAR(50) DEFAULT 'reference',
    p_is_primary BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_source_id UUID;
    v_link_id UUID;
BEGIN
    -- Get or create source metadata
    v_source_id := get_or_create_source_metadata(p_url);
    
    -- Create or update the link
    INSERT INTO question_source_links (
        question_id,
        source_metadata_id,
        source_name,
        source_type,
        is_primary_source
    )
    VALUES (
        p_question_id,
        v_source_id,
        p_source_name,
        p_source_type,
        p_is_primary
    )
    ON CONFLICT (question_id, source_metadata_id)
    DO UPDATE SET
        source_name = COALESCE(EXCLUDED.source_name, question_source_links.source_name),
        source_type = EXCLUDED.source_type,
        is_primary_source = EXCLUDED.is_primary_source
    RETURNING id INTO v_link_id;
    
    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql;

-- 5. MIGRATE EXISTING SOURCES
-- Convert existing question sources to the new system
DO $$
DECLARE
    question_record RECORD;
    source_record RECORD;
    source_id UUID;
BEGIN
    -- Loop through all questions with sources
    FOR question_record IN 
        SELECT id, sources 
        FROM questions 
        WHERE sources IS NOT NULL 
        AND sources != 'null'::jsonb
        AND sources != '[]'::jsonb
    LOOP
        -- Check if sources is an array or a scalar
        IF jsonb_typeof(question_record.sources) = 'array' THEN
            -- Handle array of sources
            FOR source_record IN 
                SELECT 
                    value->>'name' as name,
                    value->>'url' as url
                FROM jsonb_array_elements(question_record.sources)
            LOOP
                -- Skip if URL is missing
                IF source_record.url IS NOT NULL AND source_record.url != '' THEN
                    -- Create source metadata and link
                    PERFORM link_question_to_source(
                        question_record.id,
                        source_record.url,
                        source_record.name,
                        'reference',
                        false
                    );
                END IF;
            END LOOP;
        ELSIF jsonb_typeof(question_record.sources) = 'string' THEN
            -- Handle single URL as string
            DECLARE
                source_url TEXT;
            BEGIN
                source_url := question_record.sources #>> '{}';
                IF source_url IS NOT NULL AND source_url != '' THEN
                    PERFORM link_question_to_source(
                        question_record.id,
                        source_url,
                        NULL, -- No name for string sources
                        'reference',
                        false
                    );
                END IF;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated existing question sources to new source metadata system';
END $$;

-- 6. CREATE VIEW FOR ENHANCED QUESTION SOURCES
CREATE VIEW question_sources_enhanced AS
SELECT 
    q.id as question_id,
    q.topic_id,
    q.question,
    sm.id as source_id,
    sm.url,
    sm.title,
    sm.description,
    sm.domain,
    sm.og_title,
    sm.og_description,
    sm.og_image,
    sm.og_site_name,
    sm.credibility_score,
    qsl.source_name,
    qsl.source_type,
    qsl.is_primary_source,
    qsl.display_order
FROM questions q
JOIN question_source_links qsl ON q.id = qsl.question_id
JOIN source_metadata sm ON qsl.source_metadata_id = sm.id
WHERE q.is_active = true
ORDER BY q.topic_id, q.question_number, qsl.display_order;

-- Add comments for documentation
COMMENT ON TABLE source_metadata IS 'Enhanced metadata for question sources including OpenGraph data and credibility assessment';
COMMENT ON TABLE question_source_links IS 'Many-to-many relationship between questions and sources with context';
COMMENT ON TABLE source_fetch_queue IS 'Queue for background fetching and updating of source metadata';
COMMENT ON FUNCTION get_or_create_source_metadata IS 'Get existing or create new source metadata record';
COMMENT ON FUNCTION link_question_to_source IS 'Link a question to a source with metadata';
COMMENT ON VIEW question_sources_enhanced IS 'Enhanced view of question sources with full metadata'; 