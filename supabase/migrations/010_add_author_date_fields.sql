-- Add missing author and date fields to source_metadata table
-- These fields are needed to store the enhanced metadata from the fetch-meta API

-- Add author and date fields
ALTER TABLE source_metadata 
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS published_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS modified_time TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_source_metadata_author ON source_metadata(author) WHERE author IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_metadata_published_time ON source_metadata(published_time) WHERE published_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_source_metadata_modified_time ON source_metadata(modified_time) WHERE modified_time IS NOT NULL;

-- Update the get_or_create_source_metadata function to include the new fields
CREATE OR REPLACE FUNCTION get_or_create_source_metadata(
    p_url TEXT,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_domain TEXT DEFAULT NULL,
    p_author TEXT DEFAULT NULL,
    p_published_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_modified_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
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
        INSERT INTO source_metadata (
            url, 
            title, 
            description, 
            domain,
            author,
            published_time,
            modified_time
        )
        VALUES (
            p_url,
            COALESCE(p_title, v_domain),
            p_description,
            v_domain,
            p_author,
            p_published_time,
            p_modified_time
        )
        RETURNING id INTO v_source_id;
        
        -- Add to fetch queue for metadata enhancement
        INSERT INTO source_fetch_queue (url, priority, fetch_type)
        VALUES (p_url, 2, 'metadata')
        ON CONFLICT DO NOTHING;
    ELSE
        -- Update existing record with new metadata if provided
        UPDATE source_metadata 
        SET 
            title = COALESCE(p_title, title),
            description = COALESCE(p_description, description),
            author = COALESCE(p_author, author),
            published_time = COALESCE(p_published_time, published_time),
            modified_time = COALESCE(p_modified_time, modified_time),
            updated_at = NOW()
        WHERE id = v_source_id;
    END IF;
    
    RETURN v_source_id;
END;
$$ LANGUAGE plpgsql;

-- Update the enhanced view to include the new fields
DROP VIEW IF EXISTS question_sources_enhanced;
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
    sm.author,
    sm.published_time,
    sm.modified_time,
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

-- Add comments for the new fields
COMMENT ON COLUMN source_metadata.author IS 'Article author name extracted from metadata';
COMMENT ON COLUMN source_metadata.published_time IS 'Article publication date extracted from metadata';
COMMENT ON COLUMN source_metadata.modified_time IS 'Article last modified date extracted from metadata'; 