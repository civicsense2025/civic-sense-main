-- Bookmarking System Tables
-- ========================

BEGIN;

-- 1. Bookmark Collections (Folders)
CREATE TABLE IF NOT EXISTS bookmark_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '📂',
    color TEXT DEFAULT '#6B7280',
    is_smart BOOLEAN DEFAULT FALSE,
    smart_criteria JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    parent_collection_id UUID REFERENCES bookmark_collections(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Main Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES bookmark_collections(id) ON DELETE SET NULL,
    
    -- Content reference (polymorphic)
    content_type TEXT NOT NULL CHECK (content_type IN ('quiz', 'article', 'glossary', 'figure', 'custom')),
    content_id TEXT, -- Can be topic_id, article_id, etc.
    content_url TEXT,
    
    -- Metadata
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    source_domain TEXT,
    
    -- User customization
    user_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Text Snippets Table
CREATE TABLE IF NOT EXISTS bookmark_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES bookmark_collections(id) ON DELETE SET NULL,
    
    -- Snippet content
    snippet_text TEXT NOT NULL,
    full_context TEXT, -- Surrounding text for context
    
    -- Location information
    source_url TEXT,
    source_title TEXT,
    source_type TEXT, -- 'quiz_question', 'article', 'explanation', etc.
    source_id TEXT, -- Reference to specific content
    
    -- Selection metadata
    selection_start INTEGER,
    selection_end INTEGER,
    paragraph_index INTEGER,
    
    -- User customization
    highlight_color TEXT DEFAULT '#FBBF24',
    user_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- AI-generated insights (optional)
    ai_summary TEXT,
    ai_tags TEXT[],
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bookmark Tags
CREATE TABLE IF NOT EXISTS bookmark_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, tag_slug)
);

-- 5. Bookmark Analytics
CREATE TABLE IF NOT EXISTS bookmark_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    snippet_id UUID REFERENCES bookmark_snippets(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'share', 'export', 'note_added', 'highlighted')),
    event_data JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Shared Collections
CREATE TABLE IF NOT EXISTS shared_collection_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES bookmark_collections(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
    share_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 0, 9),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX idx_bookmarks_content_type ON bookmarks(content_type);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_tags ON bookmarks USING GIN(tags);

CREATE INDEX idx_snippets_user_id ON bookmark_snippets(user_id);
CREATE INDEX idx_snippets_bookmark_id ON bookmark_snippets(bookmark_id);
CREATE INDEX idx_snippets_source_type ON bookmark_snippets(source_type);
CREATE INDEX idx_snippets_tags ON bookmark_snippets USING GIN(tags);

CREATE INDEX idx_collections_user_id ON bookmark_collections(user_id);
CREATE INDEX idx_collections_parent ON bookmark_collections(parent_collection_id);

-- Functions
-- ---------

-- Function to update bookmark access tracking
CREATE OR REPLACE FUNCTION update_bookmark_access(
    p_bookmark_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE bookmarks
    SET 
        last_accessed_at = now(),
        access_count = access_count + 1,
        updated_at = now()
    WHERE id = p_bookmark_id AND user_id = p_user_id;
    
    -- Log analytics event
    INSERT INTO bookmark_analytics (user_id, bookmark_id, event_type)
    VALUES (p_user_id, p_bookmark_id, 'view');
END;
$$ LANGUAGE plpgsql;

-- Function to get or create tag
CREATE OR REPLACE FUNCTION get_or_create_tag(
    p_user_id UUID,
    p_tag_name TEXT
) RETURNS UUID AS $$
DECLARE
    v_tag_id UUID;
    v_tag_slug TEXT;
BEGIN
    -- Generate slug from tag name
    v_tag_slug := lower(regexp_replace(p_tag_name, '[^a-z0-9]+', '-', 'g'));
    
    -- Try to get existing tag
    SELECT id INTO v_tag_id
    FROM bookmark_tags
    WHERE user_id = p_user_id AND tag_slug = v_tag_slug;
    
    -- Create if doesn't exist
    IF v_tag_id IS NULL THEN
        INSERT INTO bookmark_tags (user_id, tag_name, tag_slug)
        VALUES (p_user_id, p_tag_name, v_tag_slug)
        RETURNING id INTO v_tag_id;
    ELSE
        -- Update usage count
        UPDATE bookmark_tags
        SET usage_count = usage_count + 1
        WHERE id = v_tag_id;
    END IF;
    
    RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search bookmarks
CREATE OR REPLACE FUNCTION search_bookmarks(
    p_user_id UUID,
    p_query TEXT,
    p_content_types TEXT[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_collection_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    bookmark_id UUID,
    title TEXT,
    description TEXT,
    content_type TEXT,
    tags TEXT[],
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.content_type,
        b.tags,
        (
            CASE 
                WHEN b.title ILIKE '%' || p_query || '%' THEN 3.0
                WHEN b.description ILIKE '%' || p_query || '%' THEN 2.0
                WHEN array_to_string(b.tags, ' ') ILIKE '%' || p_query || '%' THEN 1.0
                ELSE 0.5
            END
        ) as relevance_score
    FROM bookmarks b
    WHERE b.user_id = p_user_id
        AND (p_query IS NULL OR p_query = '' OR 
             b.title ILIKE '%' || p_query || '%' OR
             b.description ILIKE '%' || p_query || '%' OR
             array_to_string(b.tags, ' ') ILIKE '%' || p_query || '%')
        AND (p_content_types IS NULL OR b.content_type = ANY(p_content_types))
        AND (p_tags IS NULL OR b.tags && p_tags)
        AND (p_collection_id IS NULL OR b.collection_id = p_collection_id)
    ORDER BY relevance_score DESC, b.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
-- -----------

ALTER TABLE bookmark_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_collection_access ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view their own collections" ON bookmark_collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" ON bookmark_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON bookmark_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON bookmark_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Snippets policies
CREATE POLICY "Users can view their own snippets" ON bookmark_snippets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snippets" ON bookmark_snippets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippets" ON bookmark_snippets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets" ON bookmark_snippets
    FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view their own tags" ON bookmark_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON bookmark_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON bookmark_tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON bookmark_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies (write-only for users)
CREATE POLICY "Users can create analytics for their bookmarks" ON bookmark_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared access policies
CREATE POLICY "Users can view shared collections" ON bookmark_collections
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM shared_collection_access
            WHERE collection_id = bookmark_collections.id
            AND (shared_with_user_id = auth.uid() OR shared_by_user_id = auth.uid())
        )
    );

COMMIT; 