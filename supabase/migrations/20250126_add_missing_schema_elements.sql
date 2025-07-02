-- ============================================================================
-- CIVICSENSE SCHEMA PATCH MIGRATION
-- Add missing tables, columns, and functions to fix TypeScript errors
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD MISSING COLUMN TO COLLECTIONS TABLE
-- ============================================================================

-- Add visibility column to collections table (required by Collection type)
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted'));

-- Add index for visibility column for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_visibility 
ON public.collections(visibility);

-- ============================================================================
-- 2. CREATE TRENDING_SEARCHES TABLE
-- ============================================================================

-- Create trending_searches table for search analytics
CREATE TABLE IF NOT EXISTS public.trending_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Metadata for trending analysis
    category TEXT DEFAULT 'general',
    language TEXT DEFAULT 'en',
    user_type TEXT DEFAULT 'anonymous' CHECK (user_type IN ('authenticated', 'anonymous', 'guest')),
    
    -- Performance optimization
    UNIQUE(search_query, category)
);

-- Create indexes for trending_searches
CREATE INDEX IF NOT EXISTS idx_trending_searches_query 
ON public.trending_searches(search_query);

CREATE INDEX IF NOT EXISTS idx_trending_searches_count_desc 
ON public.trending_searches(search_count DESC);

CREATE INDEX IF NOT EXISTS idx_trending_searches_last_searched 
ON public.trending_searches(last_searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_trending_searches_category 
ON public.trending_searches(category);

-- Enable RLS on trending_searches
ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies for trending_searches (allow public read, authenticated write)
CREATE POLICY "trending_searches_public_read" ON public.trending_searches
    FOR SELECT USING (true);

CREATE POLICY "trending_searches_authenticated_write" ON public.trending_searches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "trending_searches_system_update" ON public.trending_searches
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. CREATE AI_TOOL_USAGE TABLE
-- ============================================================================

-- Create ai_tool_usage table for AI operations tracking
CREATE TABLE IF NOT EXISTS public.ai_tool_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'openai', 'anthropic', 'local', etc.
    operation_type TEXT NOT NULL, -- 'generation', 'analysis', 'translation', etc.
    
    -- Usage metrics
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    processing_time_ms INTEGER DEFAULT 0,
    
    -- Request/response data (for debugging and optimization)
    input_data JSONB,
    output_data JSONB,
    metadata JSONB,
    
    -- Status tracking
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for ai_tool_usage
CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_user_id 
ON public.ai_tool_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_tool_provider 
ON public.ai_tool_usage(tool_name, provider);

CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_created_at 
ON public.ai_tool_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_status 
ON public.ai_tool_usage(status);

CREATE INDEX IF NOT EXISTS idx_ai_tool_usage_cost 
ON public.ai_tool_usage(cost_usd DESC) WHERE cost_usd > 0;

-- Enable RLS on ai_tool_usage
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_tool_usage
CREATE POLICY "ai_tool_usage_users_own" ON public.ai_tool_usage
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ai_tool_usage_service_role" ON public.ai_tool_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "ai_tool_usage_admins" ON public.ai_tool_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Create or replace function to increment trending query count
CREATE OR REPLACE FUNCTION public.increment_trending_query(
    p_search_query TEXT,
    p_category TEXT DEFAULT 'general',
    p_user_type TEXT DEFAULT 'anonymous'
)
RETURNS TABLE (
    query_id UUID,
    search_count INTEGER,
    is_new_entry BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_query_id UUID;
    v_search_count INTEGER;
    v_is_new BOOLEAN := false;
BEGIN
    -- Validate inputs
    IF p_search_query IS NULL OR trim(p_search_query) = '' THEN
        RAISE EXCEPTION 'Search query cannot be empty';
    END IF;
    
    -- Attempt to update existing record
    UPDATE public.trending_searches 
    SET 
        search_count = search_count + 1,
        last_searched_at = NOW(),
        updated_at = NOW(),
        user_type = CASE 
            -- Upgrade user_type if we get authenticated user
            WHEN p_user_type = 'authenticated' THEN 'authenticated'
            ELSE user_type 
        END
    WHERE search_query = trim(lower(p_search_query)) 
    AND category = p_category
    RETURNING id, search_count INTO v_query_id, v_search_count;
    
    -- If no existing record, create new one
    IF NOT FOUND THEN
        INSERT INTO public.trending_searches (
            search_query, 
            category, 
            user_type,
            search_count,
            last_searched_at
        ) VALUES (
            trim(lower(p_search_query)),
            p_category,
            p_user_type,
            1,
            NOW()
        )
        RETURNING id, search_count INTO v_query_id, v_search_count;
        
        v_is_new := true;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT v_query_id, v_search_count, v_is_new;
END;
$$;

-- Create function to get trending searches
CREATE OR REPLACE FUNCTION public.get_trending_searches(
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_min_count INTEGER DEFAULT 2
)
RETURNS TABLE (
    search_query TEXT,
    search_count INTEGER,
    last_searched_at TIMESTAMPTZ,
    category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.search_query,
        ts.search_count,
        ts.last_searched_at,
        ts.category
    FROM public.trending_searches ts
    WHERE 
        (p_category IS NULL OR ts.category = p_category)
        AND ts.search_count >= p_min_count
        AND ts.last_searched_at > NOW() - INTERVAL '30 days' -- Only recent searches
    ORDER BY 
        ts.search_count DESC,
        ts.last_searched_at DESC
    LIMIT p_limit;
END;
$$;

-- Create function to clean up old trending searches
CREATE OR REPLACE FUNCTION public.cleanup_old_trending_searches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete searches older than 90 days with low counts
    DELETE FROM public.trending_searches 
    WHERE 
        last_searched_at < NOW() - INTERVAL '90 days'
        AND search_count < 5;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO public.system_logs (
        log_level,
        component,
        message,
        metadata
    ) VALUES (
        'info',
        'trending_searches_cleanup',
        format('Cleaned up %s old trending search entries', v_deleted_count),
        jsonb_build_object('deleted_count', v_deleted_count)
    );
    
    RETURN v_deleted_count;
EXCEPTION WHEN OTHERS THEN
    -- If system_logs table doesn't exist, just return the count
    RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- 5. UPDATE EXISTING COLLECTIONS DATA
-- ============================================================================

-- Set default visibility for existing collections based on status
UPDATE public.collections 
SET visibility = CASE 
    WHEN status = 'published' THEN 'public'
    WHEN status = 'draft' THEN 'private'
    ELSE 'unlisted'
END
WHERE visibility IS NULL;

-- ============================================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER trigger_trending_searches_updated_at
    BEFORE UPDATE ON public.trending_searches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_ai_tool_usage_updated_at
    BEFORE UPDATE ON public.ai_tool_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. GRANT APPROPRIATE PERMISSIONS
-- ============================================================================

-- Grant permissions for trending_searches
GRANT SELECT ON public.trending_searches TO anon, authenticated;
GRANT INSERT, UPDATE ON public.trending_searches TO authenticated;
GRANT ALL ON public.trending_searches TO service_role;

-- Grant permissions for ai_tool_usage
GRANT SELECT, INSERT, UPDATE ON public.ai_tool_usage TO authenticated;
GRANT ALL ON public.ai_tool_usage TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.increment_trending_query(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_trending_searches(TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_trending_searches() TO service_role;

-- ============================================================================
-- 8. ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON TABLE public.trending_searches IS 'Stores search query analytics for trending content discovery';
COMMENT ON TABLE public.ai_tool_usage IS 'Tracks AI tool usage for cost management and analytics';
COMMENT ON COLUMN public.collections.visibility IS 'Controls collection visibility: public, private, or unlisted';

COMMENT ON FUNCTION public.increment_trending_query(TEXT, TEXT, TEXT) IS 'Increments search count for trending analysis';
COMMENT ON FUNCTION public.get_trending_searches(TEXT, INTEGER, INTEGER) IS 'Retrieves trending search queries with filtering';
COMMENT ON FUNCTION public.cleanup_old_trending_searches() IS 'Removes old trending search entries to keep table size manageable';

COMMIT; 