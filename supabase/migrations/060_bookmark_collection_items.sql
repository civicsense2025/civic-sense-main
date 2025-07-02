-- Migration: Add bookmark_collection_items junction table
-- This table acts as an entity to hold any type of saved content in collections

BEGIN;

-- Create the bookmark_collection_items table
CREATE TABLE IF NOT EXISTS public.bookmark_collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    collection_id UUID NOT NULL REFERENCES public.bookmark_collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content identification - flexible to handle any type of saved content
    content_type TEXT NOT NULL CHECK (content_type IN (
        'bookmark',           -- Regular bookmarks
        'snippet',           -- Highlighted text snippets  
        'quiz_result',       -- Quiz completion results
        'custom_quiz',       -- User-generated quizzes
        'topic',             -- Saved topics
        'lesson',            -- Saved lessons
        'article',           -- News articles
        'collection'         -- Nested collections (future)
    )),
    content_id TEXT NOT NULL,  -- The ID of the actual content item
    
    -- Metadata
    title TEXT,              -- Cached title for faster display
    description TEXT,        -- Cached description
    image_url TEXT,          -- Cached image URL
    emoji TEXT,              -- Cached emoji
    
    -- User customization for this item in this collection
    user_notes TEXT,         -- User's personal notes about this item
    user_tags TEXT[],        -- User's custom tags for this item
    sort_order INTEGER DEFAULT 0, -- Manual ordering within collection
    
    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique content per collection
    UNIQUE(collection_id, content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmark_collection_items_collection_id 
    ON public.bookmark_collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_collection_items_user_id 
    ON public.bookmark_collection_items(user_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_collection_items_content_type 
    ON public.bookmark_collection_items(content_type);

CREATE INDEX IF NOT EXISTS idx_bookmark_collection_items_content_lookup 
    ON public.bookmark_collection_items(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_collection_items_sort_order 
    ON public.bookmark_collection_items(collection_id, sort_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bookmark_collection_items_updated_at
    BEFORE UPDATE ON public.bookmark_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.bookmark_collection_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own collection items
CREATE POLICY "bookmark_collection_items_own_access" ON public.bookmark_collection_items
    FOR ALL USING (auth.uid() = user_id);

-- Function to add content to collection
CREATE OR REPLACE FUNCTION add_content_to_collection(
    p_collection_id UUID,
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id TEXT,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_emoji TEXT DEFAULT NULL,
    p_user_notes TEXT DEFAULT NULL,
    p_user_tags TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result_item public.bookmark_collection_items;
    max_sort_order INTEGER;
BEGIN
    -- Verify the collection belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.bookmark_collections 
        WHERE id = p_collection_id AND user_id = p_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Collection not found or access denied');
    END IF;
    
    -- Get the next sort order
    SELECT COALESCE(MAX(sort_order), 0) + 1 
    INTO max_sort_order
    FROM public.bookmark_collection_items 
    WHERE collection_id = p_collection_id;
    
    -- Insert or update the collection item
    INSERT INTO public.bookmark_collection_items (
        collection_id,
        user_id,
        content_type,
        content_id,
        title,
        description,
        image_url,
        emoji,
        user_notes,
        user_tags,
        sort_order
    ) VALUES (
        p_collection_id,
        p_user_id,
        p_content_type,
        p_content_id,
        p_title,
        p_description,
        p_image_url,
        p_emoji,
        p_user_notes,
        p_user_tags,
        max_sort_order
    )
    ON CONFLICT (collection_id, content_type, content_id)
    DO UPDATE SET
        title = COALESCE(EXCLUDED.title, bookmark_collection_items.title),
        description = COALESCE(EXCLUDED.description, bookmark_collection_items.description),
        image_url = COALESCE(EXCLUDED.image_url, bookmark_collection_items.image_url),
        emoji = COALESCE(EXCLUDED.emoji, bookmark_collection_items.emoji),
        user_notes = COALESCE(EXCLUDED.user_notes, bookmark_collection_items.user_notes),
        user_tags = COALESCE(EXCLUDED.user_tags, bookmark_collection_items.user_tags),
        updated_at = NOW()
    RETURNING * INTO result_item;
    
    -- Update collection's updated_at timestamp
    UPDATE public.bookmark_collections 
    SET updated_at = NOW() 
    WHERE id = p_collection_id;
    
    RETURN json_build_object(
        'success', true, 
        'item', row_to_json(result_item)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove content from collection
CREATE OR REPLACE FUNCTION remove_content_from_collection(
    p_collection_id UUID,
    p_user_id UUID,
    p_content_type TEXT,
    p_content_id TEXT
)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Verify the collection belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.bookmark_collections 
        WHERE id = p_collection_id AND user_id = p_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Collection not found or access denied');
    END IF;
    
    -- Delete the collection item
    DELETE FROM public.bookmark_collection_items
    WHERE collection_id = p_collection_id
        AND user_id = p_user_id
        AND content_type = p_content_type
        AND content_id = p_content_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        -- Update collection's updated_at timestamp
        UPDATE public.bookmark_collections 
        SET updated_at = NOW() 
        WHERE id = p_collection_id;
        
        RETURN json_build_object('success', true, 'deleted_count', deleted_count);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Item not found in collection');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collection contents with metadata
CREATE OR REPLACE FUNCTION get_collection_contents(
    p_collection_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    content_type TEXT,
    content_id TEXT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    emoji TEXT,
    user_notes TEXT,
    user_tags TEXT[],
    sort_order INTEGER,
    added_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Verify the collection belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.bookmark_collections 
        WHERE bookmark_collections.id = p_collection_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Collection not found or access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        bci.id,
        bci.content_type,
        bci.content_id,
        bci.title,
        bci.description,
        bci.image_url,
        bci.emoji,
        bci.user_notes,
        bci.user_tags,
        bci.sort_order,
        bci.added_at,
        bci.updated_at
    FROM public.bookmark_collection_items bci
    WHERE bci.collection_id = p_collection_id
        AND bci.user_id = p_user_id
    ORDER BY bci.sort_order ASC, bci.added_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder collection items
CREATE OR REPLACE FUNCTION reorder_collection_items(
    p_collection_id UUID,
    p_user_id UUID,
    p_item_orders JSON[]
)
RETURNS JSON AS $$
DECLARE
    item_order JSON;
    update_count INTEGER := 0;
BEGIN
    -- Verify the collection belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.bookmark_collections 
        WHERE id = p_collection_id AND user_id = p_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Collection not found or access denied');
    END IF;
    
    -- Update sort orders
    FOREACH item_order IN ARRAY p_item_orders
    LOOP
        UPDATE public.bookmark_collection_items
        SET sort_order = (item_order->>'sort_order')::INTEGER,
            updated_at = NOW()
        WHERE collection_id = p_collection_id
            AND user_id = p_user_id
            AND id = (item_order->>'id')::UUID;
        
        GET DIAGNOSTICS update_count = update_count + ROW_COUNT;
    END LOOP;
    
    -- Update collection's updated_at timestamp
    UPDATE public.bookmark_collections 
    SET updated_at = NOW() 
    WHERE id = p_collection_id;
    
    RETURN json_build_object('success', true, 'updated_count', update_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 